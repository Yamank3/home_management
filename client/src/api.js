import { tokenStore } from './tokenStore.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

function send(method, path, body) {
  const token = tokenStore.getAccess();
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

// Single-flight so concurrent 401s trigger one refresh. Tokens are only discarded
// when the server rejects the refresh token, never on a network failure.
let refreshing = null;
function refreshSession() {
  refreshing ??= (async () => {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) return false;
    const res = await fetch(`${BASE}/auth/refresh`, {
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

async function request(method, path, body) {
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
  logout: async () => tokenStore.clear(),
  me: () => get('/auth/me'),
  updateMe: (data) => patch('/auth/me', data),
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
};

export const voiceApi = {
  command: (transcript) => post('/voice/command', { transcript }),
};
