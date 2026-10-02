const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReminders } = require('./reminders');

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
