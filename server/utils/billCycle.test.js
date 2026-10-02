const test = require('node:test');
const assert = require('node:assert/strict');
const { shift, nextAfter, anchorFor, isRecurring, resetPaidBills } = require('./billCycle');

test('monthly shift keeps the anchor day across short months', () => {
  assert.equal(shift('2026-01-31', 'monthly', 31), '2026-02-28');
  assert.equal(shift('2026-02-28', 'monthly', 31), '2026-03-31');
  assert.equal(shift('2024-01-31', 'monthly', 31), '2024-02-29');
});

test('year rollover and reverse shift', () => {
  assert.equal(shift('2026-12-15', 'monthly', 15), '2027-01-15');
  assert.equal(shift('2027-01-15', 'monthly', 15, -1), '2026-12-15');
  assert.equal(shift('2026-03-10', 'quarterly', 10), '2026-06-10');
  assert.equal(shift('2026-03-10', 'annual', 10), '2027-03-10');
});

test('weekly and biweekly shift by days', () => {
  assert.equal(shift('2026-10-04', 'weekly', null), '2026-10-11');
  assert.equal(shift('2026-12-28', 'biweekly', null), '2027-01-11');
});

test('nextAfter skips missed cycles and always lands after today', () => {
  assert.equal(nextAfter('2026-08-04', 'monthly', 4, '2026-10-14'), '2026-11-04');
  assert.equal(nextAfter('2026-10-04', 'monthly', 4, '2026-10-04'), '2026-11-04');
  assert.equal(nextAfter('2026-10-20', 'monthly', 20, '2026-10-02'), '2026-11-20');
});

test('one-time bills do not recur', () => {
  assert.equal(isRecurring('one-time'), false);
  assert.equal(nextAfter('2026-10-04', 'one-time', null, '2026-10-05'), '2026-10-04');
  assert.equal(anchorFor('weekly', '2026-10-04'), null);
  assert.equal(anchorFor('monthly', '2026-10-04'), 4);
});

// Minimal in-memory stand-in for the prisma calls resetPaidBills makes.
function fakePrisma(bills) {
  return {
    bill: {
      findMany: async () => bills.filter((b) => b.isPaid && b.nextDueDate),
      update: ({ where, data }) => Object.assign(bills.find((b) => b.id === where.id), data),
    },
    $transaction: async (ops) => ops,
  };
}

test('resetPaidBills flips a paid bill once its next due date is within the lead window', async () => {
  const bills = [
    { id: 'far', frequency: 'monthly', dueDay: 4, isPaid: true, nextDueDate: '2026-11-04' },
    { id: 'near', frequency: 'monthly', dueDay: 4, isPaid: true, nextDueDate: '2026-10-08' },
  ];
  await resetPaidBills(fakePrisma(bills), 'h', '2026-10-02');
  assert.equal(bills[0].isPaid, true);
  assert.equal(bills[1].isPaid, false);
});

test('resetPaidBills repairs legacy paid bills whose date is in the past', async () => {
  const bills = [{ id: 'old', frequency: 'monthly', dueDay: 4, isPaid: true, nextDueDate: '2026-09-04' }];
  await resetPaidBills(fakePrisma(bills), 'h', '2026-10-02');
  assert.equal(bills[0].nextDueDate, '2026-10-04');
  assert.equal(bills[0].isPaid, false); // due in 2 days, inside the 7-day window
});
