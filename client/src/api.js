const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
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

export const authApi = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  updateMe: (data) => patch('/auth/me', data),
  getMembers: () => get('/auth/household/members'),
  inviteMember: (data) => post('/auth/household/invite', data),
  removeMember: (id) => del(`/auth/household/members/${id}`),
};

export const groceryApi = {
  getLists: () => get('/groceries/lists'),
  createList: (name, focusGroups = []) => post('/groceries/lists', { name, focusGroups }),
  deleteList: (id) => del(`/groceries/lists/${id}`),
  lookup: (name) => get(`/groceries/lookup?name=${encodeURIComponent(name)}`),
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
};

export const mealsApi = {
  getAll: () => get('/meals'),
  create: (data) => post('/meals', data),
  update: (id, data) => patch(`/meals/${id}`, data),
  remove: (id) => del(`/meals/${id}`),
  getPlan: (weekStart) => get(`/meals/plan${weekStart ? `?weekStart=${weekStart}` : ''}`),
  setPlan: (data) => post('/meals/plan', data),
  updatePlan: (id, data) => patch(`/meals/plan/${id}`, data),
  addToGroceries: (id, listId) => post(`/meals/${id}/add-to-groceries`, { listId }),
};

export const dashboardApi = {
  getSummary: () => get('/dashboard/summary'),
};
