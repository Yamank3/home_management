import { useState } from 'react';
import { Plus, PiggyBank } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments.js';
import { SPEND_CATEGORIES } from '../../utils/categories.js';
import { formatMoney as fmt } from '../../utils/format.js';
import MonthNav from '../../components/MonthNav.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const BAR = { ok: 'bg-green-500', near: 'bg-amber-500', over: 'bg-red-500', none: 'bg-primary-500' };
const STATUS_TEXT = { ok: 'text-green-600', near: 'text-amber-600', over: 'text-red-600', none: 'text-gray-400' };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function BudgetsTab({ month, onMonthChange }) {
  const { summary, loading, setBudget } = usePayments(month);
  const [editing, setEditing] = useState(null); // { category, amount } or null
  const [error, setError] = useState('');

  const budgeted = summary?.categories.filter((c) => c.budget !== null) ?? [];
  const others = summary?.categories.filter((c) => c.budget === null && c.spent > 0) ?? [];
  const overall = summary?.budgetTotal
    ? Math.min(100, Math.round((budgeted.reduce((a, c) => a + c.spent, 0) / summary.budgetTotal) * 100)) : 0;

  const open = (category = SPEND_CATEGORIES.find((c) => !budgeted.some((b) => b.category === c)) ?? 'other') => {
    const existing = budgeted.find((c) => c.category === category);
    setError('');
    setEditing({ category, amount: existing ? String(existing.budget) : '' });
  };

  const save = async (amount) => {
    try {
      await setBudget(editing.category, amount);
      setEditing(null);
    } catch (e) { setError(e.message); }
  };

  return (
    <>
      <MonthNav month={month} onChange={onMonthChange} />

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <p className="text-xs text-gray-400">Spent of budget</p>
              <p className="text-2xl font-bold tracking-tight text-gray-900">
                {fmt(budgeted.reduce((a, c) => a + c.spent, 0))}
                <span className="text-base font-medium text-gray-400"> / {fmt(summary?.budgetTotal ?? 0)}</span>
              </p>
            </div>
            <Button size="sm" onClick={() => open()}><Plus size={15} /> Set budget</Button>
          </div>

          {budgeted.length === 0 ? (
            <EmptyState icon={PiggyBank} title="No budgets yet"
              description="Set a monthly limit for a category, such as groceries, and see how you're doing as you pay bills and add expenses."
              action={<Button onClick={() => open('groceries')}><Plus size={16} /> Set a budget</Button>} />
          ) : (
            <>
              {summary.budgetTotal > 0 && (
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5" aria-label={`${overall}% of the total budget used`}>
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${overall}%` }} />
                </div>
              )}
              <div className="space-y-2 mb-6">
                {budgeted.map((c) => (
                  <button key={c.category} onClick={() => open(c.category)}
                    className="w-full text-left bg-surface rounded-2xl border border-gray-100 shadow-card px-4 py-3 hover:border-primary-200 transition-colors">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900">{cap(c.category)}</span>
                      <span className="text-sm text-gray-500">{fmt(c.spent)} <span className="text-gray-400">/ {fmt(c.budget)}</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden my-2">
                      <div className={`h-full rounded-full ${BAR[c.status]}`} style={{ width: `${Math.min(100, c.percent)}%` }} />
                    </div>
                    <p className={`text-xs font-medium ${STATUS_TEXT[c.status]}`}>
                      {c.status === 'over' ? `${fmt(-c.remaining)} over budget` : `${fmt(c.remaining)} left`}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {others.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Spending without a budget</h3>
              <div className="bg-surface rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-100">
                {others.map((c) => (
                  <div key={c.category} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm text-gray-800">{cap(c.category)}</span>
                    <span className="text-sm text-gray-500 flex items-center gap-3">
                      {fmt(c.spent)}
                      <button onClick={() => open(c.category)} className="text-xs font-medium text-primary-600 hover:underline">Set budget</button>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Monthly budget"
        footer={editing && <>
          {budgeted.some((c) => c.category === editing.category) && (
            <Button variant="ghost" className="mr-auto text-red-600" onClick={() => save(0)}>Remove</Button>
          )}
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={() => { const n = parseFloat(editing.amount); n > 0 ? save(n) : setError('Enter an amount above 0'); }}>Save</Button>
        </>}
      >
        {editing && (
          <div className="space-y-3">
            <Select label="Category" value={editing.category} onChange={(e) => setEditing((s) => ({ ...s, category: e.target.value, amount: String(budgeted.find((c) => c.category === e.target.value)?.budget ?? '') }))}>
              {SPEND_CATEGORIES.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
            </Select>
            <Input label="Limit per month" type="number" inputMode="decimal" placeholder="0.00" value={editing.amount} autoFocus
              onChange={(e) => setEditing((s) => ({ ...s, amount: e.target.value }))} />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
