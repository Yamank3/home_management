import { tokenStore } from './tokenStore.js';
import { ownerFromToken, cacheGet, cacheSet, cacheClear, queueOffline, pendingCount, flush } from './offline/offline.js';
import { connectivity } from './offline/connectivity.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

// Identifies this tab/app instance so live sync can skip echoing our own writes.
export const CLIENT_ID = Math.random().toString(36).slice(2);

// A request that never got a usable answer: no connection, timeout, or a gateway
// error from a proxy. Callers treat this as "offline", distinct from a server error.
class NetworkError extends Error {
  constructor() { super("You appear to be offline"); this.offline = true; }
}

const TIMEOUT_MS = 15000;

async function netFetch(url, init, { stream = false } = {}) {
  let res;
  try {
    res = await fetch(url, { ...init, signal: init.signal ?? (stream ? undefined : AbortSignal.timeout(TIMEOUT_MS)) });
  } catch (e) {
    if (e.name === 'AbortError' && init.signal) throw e; // the caller cancelled it on purpose
    throw new NetworkError();
  }
  if ([502, 503, 504].includes(res.status)) throw new NetworkError();
  return res;
}

function send(method, path, body, signal) {
  const token = tokenStore.getAccess();
  const headers = { 'X-Client-Id': CLIENT_ID };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return netFetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal }, { stream: !!signal });
}

// Single-flight so concurrent 401s trigger one refresh. Tokens are only discarded
// when the server rejects the refresh token, never on a network failure.
let refreshing = null;
function refreshSession() {
  refreshing ??= (async () => {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) return false;
    const res = await netFetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.status === 401) {
      tokenStore.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      return false;
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Session refresh failed');
    tokenStore.set(json.data);
    return true;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

const CREDENTIAL_PATHS = ['/auth/login', '/auth/register'];

// One attempt, with a token refresh if the access token expired.
async function requestOnce(method, path, body) {
  let res = await send(method, path, body);
  if (res.status === 401 && !CREDENTIAL_PATHS.includes(path) && await refreshSession()) {
    res = await send(method, path, body);
  }
  const json = await res.json();
  if (!json.success) {
    const err = new Error(json.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return json.data;
}

const currentOwner = () => ownerFromToken(tokenStore.getRefresh());
const refreshPending = () => { const owner = currentOwner(); connectivity.setPending(owner ? pendingCount(owner) : 0); };
refreshPending();

// Reads fall back to the last saved copy when offline; edits that can be reproduced
// locally are queued and replayed later (see offline/offline.js).
async function request(method, path, body) {
  const owner = currentOwner();
  try {
    const data = await requestOnce(method, path, body);
    connectivity.setOffline(false);
    if (method === 'GET' && owner) cacheSet(owner, path, data);
    return data;
  } catch (e) {
    if (!e.offline) throw e;
    connectivity.setOffline(true);
    if (method === 'GET') {
      const saved = owner ? cacheGet(owner, path) : undefined;
      if (saved !== undefined) return saved;
    } else {
      const queued = owner && queueOffline(owner, method, path, body);
      if (queued) { refreshPending(); return queued.result; }
      window.dispatchEvent(new Event(OFFLINE_BLOCKED_EVENT));
    }
    throw e;
  }
}

export const OFFLINE_BLOCKED_EVENT = 'offline:blocked';
export const SYNC_FLUSHED_EVENT = 'offline:flushed';

let flushing = false;
// Sends edits made while offline. Safe to call any time; does nothing if empty.
export async function flushOutbox() {
  const owner = currentOwner();
  if (!owner || flushing || pendingCount(owner) === 0) return;
  flushing = true;
  try {
    const result = await flush(owner, requestOnce);
    if (result.sent.length) connectivity.setOffline(false);
    if (result.sent.length || result.failed.length) {
      window.dispatchEvent(new CustomEvent(SYNC_FLUSHED_EVENT, { detail: result }));
    }
  } catch { /* leave the queue for the next attempt */ } finally {
    flushing = false;
    refreshPending();
  }
}

// Reads the household event stream (Server-Sent Events over fetch, since
// EventSource can't send the Authorization header). Resolves when the server
// closes the stream; rejects on failure. onOpen fires once connected.
export async function streamEvents({ onOpen, onEvent, signal }) {
  let res = await send('GET', '/events', null, signal);
  if (res.status === 401 && await refreshSession()) res = await send('GET', '/events', null, signal);
  if (!res.ok || !res.body) throw new Error(`Event stream failed (${res.status})`);
  onOpen?.();

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += value;
    let end;
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const name = /^event: (.+)$/m.exec(frame)?.[1];
      const data = /^data: (.+)$/m.exec(frame)?.[1];
      if (name && data) onEvent({ name, data: JSON.parse(data) });
    }
  }
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const patch = (path, body) => request('PATCH', path, body);
const del = (path) => request('DELETE', path);

// Stores the session tokens and hands callers just the user/household.
const startSession = ({ accessToken, refreshToken, ...rest }) => {
  tokenStore.set({ accessToken, refreshToken });
  return rest;
};

export const authApi = {
  register: (data) => post('/auth/register', data).then(startSession),
  login: (data) => post('/auth/login', data).then(startSession),
  logout: async () => {
    const owner = currentOwner();
    if (owner) cacheClear(owner); // don't leave this user's data on a shared device
    tokenStore.clear();
  },
  me: () => get('/auth/me'),
  updateMe: (data) => patch('/auth/me', data).then(({ user, ...tokens }) => {
    if (tokens.accessToken) tokenStore.set(tokens);
    return user;
  }),
  updateHousehold: (data) => patch('/auth/household', data),
  getMembers: () => get('/auth/household/members'),
  inviteMember: (data) => post('/auth/household/invite', data),
  removeMember: (id) => del(`/auth/household/members/${id}`),
};

export const groceryApi = {
  getLists: () => get('/groceries/lists'),
  createList: (name, focusGroups = []) => post('/groceries/lists', { name, focusGroups }),
  deleteList: (id) => del(`/groceries/lists/${id}`),
  lookup: (name, members) => get(`/groceries/lookup?name=${encodeURIComponent(name)}${members ? `&members=${members}` : ''}`),
  getItems: (listId) => get(`/groceries/items${listId ? `?listId=${listId}` : ''}`),
  addItem: (data) => post('/groceries/items', data),
  updateItem: (id, data) => patch(`/groceries/items/${id}`, data),
  removeItem: (id) => del(`/groceries/items/${id}`),
  clearBought: (listId) => post('/groceries/items/bulk-delete', { listId }),
};

export const billsApi = {
  getAll: () => get('/bills'),
  create: (data) => post('/bills', data),
  update: (id, data) => patch(`/bills/${id}`, data),
  remove: (id) => del(`/bills/${id}`),
  getMonthlySummary: () => get('/bills/summary/monthly'),
};

export const paymentsApi = {
  list: (month) => get(`/payments?month=${month}`),
  summary: (month) => get(`/payments/summary?month=${month}`),
  create: (data) => post('/payments', data),
  remove: (id) => del(`/payments/${id}`),
};

export const budgetsApi = {
  list: () => get('/budgets'),
  set: (category, monthlyAmount) => request('PUT', '/budgets', { category, monthlyAmount }),
};

export const choresApi = {
  getAll: () => get('/chores'),
  create: (data) => post('/chores', data),
  update: (id, data) => patch(`/chores/${id}`, data),
  complete: (id, completedBy) => post(`/chores/${id}/complete`, { completedBy }),
  remove: (id) => del(`/chores/${id}`),
};

export const inventoryApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/inventory${qs ? `?${qs}` : ''}`);
  },
  create: (data) => post('/inventory', data),
  update: (id, data) => patch(`/inventory/${id}`, data),
  remove: (id) => del(`/inventory/${id}`),
  bulkRemove: (ids) => request('DELETE', '/inventory/bulk', { ids }),
};

export const mealsApi = {
  getAll: () => get('/meals'),
  create: (data) => post('/meals', data),
  update: (id, data) => patch(`/meals/${id}`, data),
  remove: (id) => del(`/meals/${id}`),
  getPlan: (weekStart) => get(`/meals/plan${weekStart ? `?weekStart=${weekStart}` : ''}`),
  setPlan: (data) => post('/meals/plan', data),
  updatePlan: (id, data) => patch(`/meals/plan/${id}`, data),
  cookSlot: (id, slot) => post(`/meals/plan/${id}/cook`, { slot }),
  addToGroceries: (id, listId) => post(`/meals/${id}/add-to-groceries`, { listId }),
  addIngredientsToGroceries: (ingredients, mealName, listId) =>
    post('/meals/add-ingredients-to-groceries', { ingredients, mealName, listId }),
  lookupRecipe: (name, servings) => get(`/meals/recipe?name=${encodeURIComponent(name)}${servings ? `&servings=${servings}` : ''}`),
  searchRecipes: (q, servings) => get(`/meals/search?q=${encodeURIComponent(q)}${servings ? `&servings=${servings}` : ''}`),
  importFromUrl: (url, servings) => post('/meals/import-url', { url, servings }),
  checkInventory: (ingredients) => post('/meals/check-inventory', { ingredients }),
  getSuggestions: (members) => get(`/meals/suggestions${members ? `?members=${members}` : ''}`),
};

export const dashboardApi = {
  getSummary: () => get('/dashboard/summary'),
};

export const remindersApi = {
  getAll: () => get('/reminders'),
  getSchedule: () => get('/reminders/schedule'),
};

export const voiceApi = {
  command: (transcript) => post('/voice/command', { transcript }),
};
