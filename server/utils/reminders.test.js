const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReminders, buildSchedule } = require('./reminders');

const TODAY = '2026-10-02';
const none = { bills: [], chores: [], items: [] };

test('bills: shown within 3 days or overdue, hidden when paid or far off', () => {
  const bills = [
    { id: '1', name: 'Rent', amount: 1000, currency: 'INR', isPaid: false, nextDueDate: '2026-10-01' },
    { id: '2', name: 'Power', amount: 50, currency: 'INR', isPaid: false, nextDueDate: '2026-10-02' },
    { id: '3', name: 'Net', amount: 50, currency: 'INR', isPaid: false, nextDueDate: '2026-10-05' },
    { id: '4', name: 'Far', amount: 50, currency: 'INR', isPaid: false, nextDueDate: '2026-10-06' },
    { id: '5', name: 'Paid', amount: 50, currency: 'INR', isPaid: true, nextDueDate: '2026-10-02' },
  ];
  const r = buildReminders({ ...none, bills }, TODAY);
  assert.deepEqual(r.map((x) => [x.title.split(' ·')[0], x.urgency]), [['Rent', 'overdue'], ['Power', 'today'], ['Net', 'soon']]);
  assert.equal(r[0].detail, 'Overdue by 1 day');
  assert.equal(r[2].detail, 'Due in 3 days');
});

test('chores: only due or overdue, with assignee', () => {
  const chores = [
    { id: 'a', name: 'Trash', assignedTo: 'Sam', nextDueDate: '2026-10-02' },
    { id: 'b', name: 'Mop', assignedTo: '', nextDueDate: '2026-09-30' },
    { id: 'c', name: 'Later', assignedTo: '', nextDueDate: '2026-10-03' },
  ];
  const r = buildReminders({ ...none, chores }, TODAY);
  assert.deepEqual(r.map((x) => x.title), ['Mop', 'Trash']);
  assert.equal(r[0].detail, 'Overdue by 2 days');
  assert.equal(r[1].detail, 'Due today · Sam');
});

test('inventory: maintenance, warranty window and low stock', () => {
  const items = [
    { id: 'm', name: 'AC', nextMaintenanceDate: '2026-10-01', warrantyExpiry: '2026-10-20', fromGrocery: false },
    { id: 'w', name: 'Oldwarranty', warrantyExpiry: '2026-09-01', fromGrocery: false },
    { id: 's', name: 'Rice', fromGrocery: true, estimatedEndDate: '2026-10-04' },
    { id: 'n', name: 'Soap', fromGrocery: false, estimatedEndDate: '2026-10-04' },
  ];
  const r = buildReminders({ ...none, items }, TODAY);
  assert.deepEqual(r.map((x) => x.type), ['maintenance', 'stock', 'warranty']);
  assert.equal(r[1].detail, 'Runs out in 2 days');
  assert.equal(r[2].detail, 'Expires in 18 days');
});

test('keys are stable per item+date and change when the date moves', () => {
  const bill = (d) => ({ id: '1', name: 'Rent', amount: 1, currency: 'INR', isPaid: false, nextDueDate: d });
  const a = buildReminders({ ...none, bills: [bill('2026-10-02')] }, TODAY)[0].key;
  const b = buildReminders({ ...none, bills: [bill('2026-10-02')] }, TODAY)[0].key;
  const c = buildReminders({ ...none, bills: [bill('2026-10-03')] }, TODAY)[0].key;
  assert.equal(a, b);
  assert.notEqual(a, c);
});

// ── buildSchedule ───────────────────────────────────────────────────────────
const bill = (id, due, extra = {}) => ({ id, name: id, amount: 10, currency: 'INR', isPaid: false, nextDueDate: due, ...extra });
const sched = (data) => buildSchedule({ ...none, ...data }, TODAY).map((s) => `${s.fireOn} ${s.type} ${s.body}`);

test('schedule: a bill notifies the day before and on the day', () => {
  assert.deepEqual(sched({ bills: [bill('Rent', '2026-10-05')] }), ['2026-10-04 bill Due tomorrow', '2026-10-05 bill Due today']);
});

test('schedule: past fire dates are dropped, today is kept', () => {
  assert.deepEqual(sched({ bills: [bill('A', '2026-10-02')] }), ['2026-10-02 bill Due today']);
  assert.deepEqual(sched({ bills: [bill('B', '2026-10-03')] }), ['2026-10-02 bill Due tomorrow', '2026-10-03 bill Due today']);
});

test('schedule: an overdue bill gets a single nudge tomorrow, worded for that day', () => {
  assert.deepEqual(sched({ bills: [bill('C', '2026-10-01')] }), ['2026-10-03 bill Overdue by 2 days']);
});

test('schedule: paid bills, far-future items and expired warranties produce nothing', () => {
  assert.deepEqual(sched({ bills: [bill('P', '2026-10-05', { isPaid: true }), bill('F', '2026-12-31')] }), []);
  assert.deepEqual(sched({ items: [{ id: 'w', name: 'TV', warrantyExpiry: '2026-09-01' }] }), []);
});

test('schedule: chores, maintenance, warranty and low stock follow their own lead times', () => {
  const r = sched({
    chores: [{ id: 'c', name: 'Trash', assignedTo: '', nextDueDate: '2026-10-04' }],
    items: [
      { id: 'm', name: 'AC', nextMaintenanceDate: '2026-10-10' },
      { id: 'w', name: 'TV', warrantyExpiry: '2026-10-20' },
      { id: 's', name: 'Rice', fromGrocery: true, estimatedEndDate: '2026-10-06' },
    ],
  });
  assert.deepEqual(r, [
    '2026-10-04 chore Due today',
    '2026-10-04 stock Runs out in 2 days',
    '2026-10-07 maintenance Due in 3 days',
    '2026-10-10 maintenance Due today',
    '2026-10-13 warranty Expires in 7 days',
  ]);
});

test('schedule: keys are unique per notification and stable', () => {
  const a = buildSchedule({ ...none, bills: [bill('Rent', '2026-10-05')] }, TODAY);
  const b = buildSchedule({ ...none, bills: [bill('Rent', '2026-10-05')] }, TODAY);
  assert.equal(new Set(a.map((x) => x.key)).size, a.length);
  assert.deepEqual(a.map((x) => x.key), b.map((x) => x.key));
});
