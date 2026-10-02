const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeMonth, isMonth } = require('./spending');

const pay = (category, amount, paidOn) => ({ category, amount, paidOn });

test('sums only the requested month, per category', () => {
  const s = summarizeMonth(
    [pay('groceries', 100, '2026-10-01'), pay('groceries', 50.5, '2026-10-31'), pay('rent', 900, '2026-10-05'), pay('groceries', 999, '2026-09-30')],
    [], '2026-10');
  assert.equal(s.total, 1050.5);
  assert.equal(s.count, 3);
  assert.deepEqual(s.categories.map((c) => [c.category, c.spent]), [['rent', 900], ['groceries', 150.5]]);
});

test('budget status: ok, near (80%+), over, and none without a budget', () => {
  const s = summarizeMonth(
    [pay('a', 50, '2026-10-02'), pay('b', 80, '2026-10-02'), pay('c', 101, '2026-10-02'), pay('d', 5, '2026-10-02')],
    [{ category: 'a', monthlyAmount: 100 }, { category: 'b', monthlyAmount: 100 }, { category: 'c', monthlyAmount: 100 }], '2026-10');
  const by = Object.fromEntries(s.categories.map((c) => [c.category, c]));
  assert.equal(by.a.status, 'ok');
  assert.equal(by.b.status, 'near');
  assert.equal(by.c.status, 'over');
  assert.equal(by.c.remaining, -1);
  assert.equal(by.d.status, 'none');
  assert.equal(by.d.budget, null);
  assert.equal(s.budgetTotal, 300);
});

test('a budget with no spending still appears, at 0%', () => {
  const s = summarizeMonth([], [{ category: 'dining', monthlyAmount: 200 }], '2026-10');
  assert.deepEqual(s.categories, [{ category: 'dining', spent: 0, budget: 200, remaining: 200, percent: 0, status: 'ok' }]);
});

test('floating point amounts are rounded to cents', () => {
  const s = summarizeMonth([pay('x', 0.1, '2026-10-01'), pay('x', 0.2, '2026-10-01')], [], '2026-10');
  assert.equal(s.total, 0.3);
});

test('month validation', () => {
  assert.equal(isMonth('2026-10'), true);
  assert.equal(isMonth('2026-13'), false);
  assert.equal(isMonth('10-2026'), false);
});
