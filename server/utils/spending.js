// Monthly spending against budgets. Pure so it can be tested without a database.
// Amounts are summed as-is (one currency per household is assumed, like the bills summary).

const NEAR_LIMIT = 0.8; // "close to budget" from 80% of it

const round2 = (n) => Math.round(n * 100) / 100;

// payments: [{ category, amount, paidOn: 'YYYY-MM-DD' }], budgets: [{ category, monthlyAmount }]
function summarizeMonth(payments, budgets, month) {
  const spent = new Map();
  let total = 0;
  let count = 0;
  for (const p of payments) {
    if (!p.paidOn.startsWith(month)) continue;
    spent.set(p.category, (spent.get(p.category) ?? 0) + p.amount);
    total += p.amount;
    count += 1;
  }
  const limit = new Map(budgets.map((b) => [b.category, b.monthlyAmount]));

  const categories = [...new Set([...spent.keys(), ...limit.keys()])].map((category) => {
    const s = round2(spent.get(category) ?? 0);
    const budget = limit.get(category) ?? null;
    const status = budget === null ? 'none' : s > budget ? 'over' : s >= budget * NEAR_LIMIT ? 'near' : 'ok';
    return {
      category,
      spent: s,
      budget,
      remaining: budget === null ? null : round2(budget - s),
      percent: budget ? Math.round((s / budget) * 100) : null,
      status,
    };
  }).sort((a, b) => b.spent - a.spent || a.category.localeCompare(b.category));

  return {
    month,
    total: round2(total),
    count,
    budgetTotal: round2([...limit.values()].reduce((a, b) => a + b, 0)),
    categories,
  };
}

const isMonth = (s) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
const currentMonth = () => new Date().toISOString().slice(0, 7);

module.exports = { summarizeMonth, isMonth, currentMonth };
