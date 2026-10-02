import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage stand-in (the module reads it at call time).
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { ownerFromToken, cacheGet, cacheSet, cacheClear, queueOffline, pendingCount, flush } = await import('./offline.js');

const U = 'user-1';
const items = [{ id: 'a', name: 'Milk', bought: false }, { id: 'b', name: 'Rice', bought: false }];
const fresh = () => {
  store.clear();
  cacheSet(U, '/groceries/items?listId=L1', items);
  cacheSet(U, '/groceries/items?listId=L2', [{ id: 'z', name: 'Other', bought: false }]);
  cacheSet(U, '/bills', [{ id: 'bill1', name: 'Rent', isPaid: false }]);
  cacheSet(U, '/chores', [{ id: 'c1', name: 'Trash', lastCompletedAt: null }]);
};
const offlineErr = () => Object.assign(new Error('offline'), { offline: true });

test('cache is isolated per user and clearable', () => {
  fresh();
  assert.equal(cacheGet('user-2', '/bills'), undefined);
  cacheClear(U);
  assert.equal(cacheGet(U, '/bills'), undefined);
});

test('owner is read from the token payload', () => {
  const payload = Buffer.from(JSON.stringify({ userId: 'u-9' })).toString('base64url');
  assert.equal(ownerFromToken(`h.${payload}.s`), 'u-9');
  assert.equal(ownerFromToken('garbage'), null);
  assert.equal(ownerFromToken(null), null);
});

test('patching a cached item returns the merged item and updates the cache', () => {
  fresh();
  const { result } = queueOffline(U, 'PATCH', '/groceries/items/a', { bought: true });
  assert.deepEqual(result, { id: 'a', name: 'Milk', bought: true });
  assert.equal(cacheGet(U, '/groceries/items?listId=L1')[0].bought, true);
  assert.equal(pendingCount(U), 1);
});

test('create adds a temp item only to the matching list', () => {
  fresh();
  const { result } = queueOffline(U, 'POST', '/groceries/items', { name: 'Eggs', listId: 'L1' });
  assert.match(result.id, /^tmp-/);
  assert.equal(result.bought, false);
  assert.equal(cacheGet(U, '/groceries/items?listId=L1').length, 3);
  assert.equal(cacheGet(U, '/groceries/items?listId=L2').length, 1);
});

test('delete removes from the cache; bills and chores edits are queued', () => {
  fresh();
  assert.equal(queueOffline(U, 'DELETE', '/groceries/items/b').result, null);
  assert.equal(cacheGet(U, '/groceries/items?listId=L1').length, 1);
  assert.equal(queueOffline(U, 'PATCH', '/bills/bill1', { isPaid: true }).result.isPaid, true);
  assert.ok(queueOffline(U, 'POST', '/chores/c1/complete', { completedBy: 'Sam' }).result.lastCompletedAt);
  assert.equal(pendingCount(U), 3);
});

test('edits that cannot be reproduced offline are refused, not queued', () => {
  fresh();
  assert.equal(queueOffline(U, 'POST', '/bills', { name: 'New', amount: 5 }), null);
  assert.equal(queueOffline(U, 'PATCH', '/inventory/x', {}), null);
  assert.equal(queueOffline(U, 'PATCH', '/groceries/items/not-cached', { bought: true }), null);
  assert.equal(pendingCount(U), 0);
});

test('flush replays in order and swaps temp ids for the real ones', async () => {
  fresh();
  queueOffline(U, 'POST', '/groceries/items', { name: 'Eggs', listId: 'L1' });
  const tmp = cacheGet(U, '/groceries/items?listId=L1').at(-1).id;
  queueOffline(U, 'PATCH', `/groceries/items/${tmp}`, { bought: true });
  queueOffline(U, 'DELETE', '/groceries/items/a');
  const calls = [];
  const out = await flush(U, async (method, path, body) => {
    calls.push(`${method} ${path}`);
    return method === 'POST' ? { id: 'real-9' } : null;
  });
  assert.deepEqual(calls, ['POST /groceries/items', 'PATCH /groceries/items/real-9', 'DELETE /groceries/items/a']);
  assert.equal(out.sent.length, 3);
  assert.equal(out.remaining, 0);
});

test('flush stops when still offline and keeps the remaining edits', async () => {
  fresh();
  queueOffline(U, 'PATCH', '/groceries/items/a', { bought: true });
  queueOffline(U, 'PATCH', '/groceries/items/b', { bought: true });
  let n = 0;
  const out = await flush(U, async () => { if (n++ === 1) throw offlineErr(); return {}; });
  assert.equal(out.sent.length, 1);
  assert.equal(out.remaining, 1);
});

test('flush drops edits the server rejects and reports them', async () => {
  fresh();
  queueOffline(U, 'PATCH', '/groceries/items/a', { bought: true });
  queueOffline(U, 'PATCH', '/groceries/items/b', { bought: true });
  let n = 0;
  const out = await flush(U, async () => { if (n++ === 0) throw Object.assign(new Error('Item not found'), { status: 404 }); return {}; });
  assert.deepEqual(out.failed.map((f) => f.message), ['Item not found']);
  assert.equal(out.sent.length, 1);
  assert.equal(out.remaining, 0);
});

test('a failing server is retried, then the edit is dropped after 5 attempts', async () => {
  fresh();
  queueOffline(U, 'PATCH', '/groceries/items/a', { bought: true });
  const boom = async () => { throw Object.assign(new Error('boom'), { status: 500 }); };
  for (let i = 0; i < 4; i++) assert.equal((await flush(U, boom)).remaining, 1);
  const last = await flush(U, boom);
  assert.equal(last.remaining, 0);
  assert.equal(last.failed.length, 1);
});

test('unauthenticated replay keeps the edits for later', async () => {
  fresh();
  queueOffline(U, 'PATCH', '/groceries/items/a', { bought: true });
  const out = await flush(U, async () => { throw Object.assign(new Error('x'), { status: 401 }); });
  assert.equal(out.remaining, 1);
  assert.equal(out.failed.length, 0);
});
