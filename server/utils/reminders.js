const { daysUntil, todayStr } = require('./billCycle');

// How far ahead each kind of reminder starts showing up.
const WINDOW_DAYS = { bill: 3, maintenance: 7, warranty: 30, stock: 7 };

const money = (amount, currency) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function when(days, verb = 'Due') {
  if (days < 0) return `Overdue by ${plural(-days, 'day')}`;
  if (days === 0) return `${verb} today`;
  if (days === 1) return `${verb} tomorrow`;
  return `${verb} in ${plural(days, 'day')}`;
}

const urgencyOf = (days) => (days < 0 ? 'overdue' : days === 0 ? 'today' : 'soon');
const URGENCY_ORDER = { overdue: 0, today: 1, soon: 2 };

// Turns a household's bills, chores and inventory into a flat, sorted list of
// reminders. Pure: no I/O. `key` is stable for a given item + date, so a client
// can remember a dismissal and it resets when the underlying date changes.
function buildReminders({ bills, chores, items }, today = todayStr()) {
  const out = [];
  const add = (type, id, date, days, title, detail, link) =>
    out.push({ key: `${type}:${id}:${date}`, type, urgency: urgencyOf(days), date, title, detail, link });

  for (const b of bills) {
    if (b.isPaid || !b.nextDueDate) continue;
    const days = daysUntil(b.nextDueDate, today);
    if (days <= WINDOW_DAYS.bill) {
      add('bill', b.id, b.nextDueDate, days, `${b.name} · ${money(b.amount, b.currency)}`, when(days), '/bills');
    }
  }

  for (const c of chores) {
    if (!c.nextDueDate) continue;
    const days = daysUntil(c.nextDueDate, today);
    if (days <= 0) {
      add('chore', c.id, c.nextDueDate, days, c.name, [when(days), c.assignedTo].filter(Boolean).join(' · '), '/chores');
    }
  }

  for (const i of items) {
    if (i.nextMaintenanceDate) {
      const days = daysUntil(i.nextMaintenanceDate, today);
      if (days <= WINDOW_DAYS.maintenance) {
        add('maintenance', i.id, i.nextMaintenanceDate, days, `${i.name} maintenance`, when(days), '/inventory');
      }
    }
    if (i.warrantyExpiry) {
      const days = daysUntil(i.warrantyExpiry, today);
      if (days >= 0 && days <= WINDOW_DAYS.warranty) {
        add('warranty', i.id, i.warrantyExpiry, days, `${i.name} warranty`, when(days, 'Expires'), '/inventory');
      }
    }
    if (i.fromGrocery && i.estimatedEndDate) {
      const days = daysUntil(i.estimatedEndDate, today);
      if (days <= WINDOW_DAYS.stock) {
        const detail = days < 0 ? 'Has likely run out' : days === 0 ? 'Runs out today' : `Runs out in ${plural(days, 'day')}`;
        add('stock', i.id, i.estimatedEndDate, days, `${i.name} running low`, detail, '/groceries');
      }
    }
  }

  return out.sort((a, b) =>
    URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

// ── Notification schedule ───────────────────────────────────────────────────
// What to notify and on which day, looking ahead so a phone that isn't opened for
// a while still gets reminders. Each rule fires `lead` days before the date; items
// already overdue get one nudge tomorrow. The app shows each at a fixed local time.

const LEADS = { bill: [1, 0], chore: [0], maintenance: [3, 0], warranty: [7], stock: [2] };
const HORIZON_DAYS = 45;

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

function buildSchedule({ bills, chores, items }, today = todayStr()) {
  const out = [];
  const add = (type, id, due, title, link, verb, show = true) => {
    if (!show) return;
    const days = daysUntil(due, today);
    const fires = days < 0 ? [{ lead: null, fireOn: addDays(today, 1) }]
      : LEADS[type].map((lead) => ({ lead, fireOn: addDays(due, -lead) })).filter((f) => f.fireOn >= today);
    for (const { lead, fireOn } of fires) {
      if (daysUntil(fireOn, today) > HORIZON_DAYS) continue;
      const body = type === 'stock'
        ? (daysUntil(due, fireOn) < 0 ? 'Has likely run out' : daysUntil(due, fireOn) === 0 ? 'Runs out today' : `Runs out in ${plural(daysUntil(due, fireOn), 'day')}`)
        : when(daysUntil(due, fireOn), verb);
      out.push({ key: `${type}:${id}:${due}:${lead ?? 'overdue'}`, type, title, body, fireOn, link });
    }
  };

  for (const b of bills) {
    if (!b.isPaid && b.nextDueDate) add('bill', b.id, b.nextDueDate, `${b.name} · ${money(b.amount, b.currency)}`, '/bills', 'Due');
  }
  for (const c of chores) {
    if (c.nextDueDate) add('chore', c.id, c.nextDueDate, c.name, '/chores', 'Due');
  }
  for (const i of items) {
    if (i.nextMaintenanceDate) add('maintenance', i.id, i.nextMaintenanceDate, `${i.name} maintenance`, '/inventory', 'Due');
    if (i.warrantyExpiry) add('warranty', i.id, i.warrantyExpiry, `${i.name} warranty`, '/inventory', 'Expires', daysUntil(i.warrantyExpiry, today) >= 0);
    if (i.fromGrocery && i.estimatedEndDate) add('stock', i.id, i.estimatedEndDate, `${i.name} running low`, '/groceries', 'Due');
  }
  return out.sort((a, b) => a.fireOn.localeCompare(b.fireOn) || a.key.localeCompare(b.key));
}

module.exports = { buildReminders, buildSchedule };
