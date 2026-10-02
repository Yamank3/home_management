const test = require('node:test');
const assert = require('node:assert/strict');
const { subscribe, announceWrites } = require('./realtime');

const fakeRes = () => ({ written: [], write(s) { this.written.push(s); } });

// Drives announceWrites like Express would: runs next(), then fires 'finish'.
function write({ method = 'POST', url = '/api/groceries/items', status = 200, householdId = 'h1', origin = 'tab-a' }) {
  let onFinish;
  const req = { method, originalUrl: url, householdId, get: (h) => (h === 'x-client-id' ? origin : undefined) };
  const res = { statusCode: status, on: (_, fn) => { onFinish = fn; } };
  announceWrites(req, res, () => {});
  onFinish();
}

test('a write is announced to every stream in the household, with affected modules and origin', () => {
  const a = fakeRes(), b = fakeRes(), other = fakeRes();
  const offA = subscribe('h1', a); subscribe('h1', b); subscribe('h2', other);
  write({});
  assert.equal(a.written.length, 1);
  assert.match(a.written[0], /^event: change\n/);
  assert.deepEqual(JSON.parse(a.written[0].split('data: ')[1]), { modules: ['groceries', 'inventory'], origin: 'tab-a' });
  assert.equal(b.written.length, 1);
  assert.equal(other.written.length, 0); // other households never see it
  offA();
  write({});
  assert.equal(a.written.length, 1); // unsubscribed
  assert.equal(b.written.length, 2);
});

test('reads, failures, unauthenticated and unknown areas are not announced', () => {
  const s = fakeRes();
  subscribe('h3', s);
  write({ householdId: 'h3', method: 'GET' });
  write({ householdId: 'h3', status: 422 });
  write({ householdId: undefined });
  write({ householdId: 'h3', url: '/api/auth/me' });
  assert.equal(s.written.length, 0);
});

test('meal writes ripple into groceries and inventory', () => {
  const s = fakeRes();
  subscribe('h4', s);
  write({ householdId: 'h4', url: '/api/meals/plan/abc/cook?x=1' });
  assert.deepEqual(JSON.parse(s.written[0].split('data: ')[1]).modules, ['meals', 'groceries', 'inventory']);
});
