// Recurrence rules for bills. Dates are 'YYYY-MM-DD' strings in UTC, matching how
// nextDueDate is stored. A paid recurring bill moves to its next due date at once
// and shows as "paid" until that date is within LEAD_DAYS, when it becomes payable
// again (see resetPaidBills).

const PERIOD = {
  weekly: { days: 7 },
  biweekly: { days: 14 },
  monthly: { months: 1 },
  quarterly: { months: 3 },
  annual: { months: 12 },
};

// How many days before the next due date a paid bill flips back to unpaid.
const LEAD_DAYS = { weekly: 2, biweekly: 5, monthly: 7, quarterly: 14, annual: 30 };

const MS_DAY = 86400000;
const toUtc = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);
const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

const todayStr = () => new Date().toISOString().slice(0, 10);
const isRecurring = (frequency) => frequency in PERIOD;
const daysUntil = (date, from) => Math.round((toUtc(date) - toUtc(from)) / MS_DAY);

// One period forward (dir = 1) or back (dir = -1). `anchorDay` keeps month-based
// bills on their original day-of-month when a short month clamps it (31 -> 28 -> 31).
function shift(date, frequency, anchorDay, dir = 1) {
  const p = PERIOD[frequency];
  if (!p) return date;
  if (p.days) return fromUtc(toUtc(date) + dir * p.days * MS_DAY);
  const [y, m, d] = date.split('-').map(Number);
  const total = y * 12 + (m - 1) + dir * p.months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  return fromUtc(Date.UTC(ny, nm, Math.min(anchorDay ?? d, daysInMonth(ny, nm))));
}

// First occurrence strictly after `today`; skips any cycles that were missed.
function nextAfter(date, frequency, anchorDay, today = todayStr()) {
  if (!isRecurring(frequency)) return date;
  let next = shift(date, frequency, anchorDay);
  while (next <= today) next = shift(next, frequency, anchorDay);
  return next;
}

// Day-of-month anchor for month-based frequencies; weekly cycles don't need one.
const anchorFor = (frequency, date) => (PERIOD[frequency]?.months ? Number(date.slice(8, 10)) : null);

// Flip paid recurring bills back to unpaid once their next due date is within the
// lead window. Also repairs legacy rows that were paid without advancing their date.
// Called lazily before bills are read, so no scheduler is needed.
async function resetPaidBills(prisma, householdId, today = todayStr()) {
  const horizon = fromUtc(toUtc(today) + Math.max(...Object.values(LEAD_DAYS)) * MS_DAY);
  const paid = await prisma.bill.findMany({
    where: {
      householdId,
      isPaid: true,
      frequency: { in: Object.keys(PERIOD) },
      nextDueDate: { not: null, lte: horizon },
    },
  });

  const updates = [];
  for (const bill of paid) {
    const due = bill.nextDueDate <= today
      ? nextAfter(bill.nextDueDate, bill.frequency, bill.dueDay, today)
      : bill.nextDueDate;
    const payable = daysUntil(due, today) <= LEAD_DAYS[bill.frequency];
    if (payable) {
      updates.push(prisma.bill.update({ where: { id: bill.id }, data: { isPaid: false, paidAt: null, nextDueDate: due } }));
    } else if (due !== bill.nextDueDate) {
      updates.push(prisma.bill.update({ where: { id: bill.id }, data: { nextDueDate: due } }));
    }
  }
  if (updates.length) await prisma.$transaction(updates);
}

module.exports = { shift, nextAfter, anchorFor, isRecurring, resetPaidBills, todayStr, LEAD_DAYS };
