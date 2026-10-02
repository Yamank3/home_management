import { useState } from 'react';
import { Plus, Trash2, Receipt, ShoppingBag, Wallet, History } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments.js';
import { formatMoney as fmt } from '../../utils/format.js';
import MonthNav from '../../components/MonthNav.jsx';
import ExpenseModal from '../../components/ExpenseModal.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const SOURCE_ICON = { bill: Receipt, receipt: ShoppingBag, expense: Wallet };

const dayLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function HistoryTab({ month, onMonthChange }) {
  const { payments, summary, loading, addExpense, removePayment } = usePayments(month);
  const [adding, setAdding] = useState(false);

  // Adding an expense dated in another month jumps to that month so it's visible.
  const save = async (data) => {
    await addExpense(data);
    if (data.paidOn.slice(0, 7) !== month) onMonthChange(data.paidOn.slice(0, 7));
  };

  const byDay = payments.reduce((acc, p) => { (acc[p.paidOn] ??= []).push(p); return acc; }, {});

  return (
    <>
      <MonthNav month={month} onChange={onMonthChange} />
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <p className="text-xs text-gray-400">Spent</p>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{fmt(summary?.total ?? 0)}</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}><Plus size={15} /> Add expense</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <EmptyState icon={History} title="No payments this month"
          description="Paying a bill adds it here. You can also record other spending with Add expense." />
      ) : (
        Object.entries(byDay).map(([day, list]) => (
          <section key={day} className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{dayLabel(day)}</h3>
            <div className="bg-surface rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-100">
              {list.map((p) => {
                const Icon = SOURCE_ICON[p.source] || Wallet;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0"><Icon size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        <Badge color="gray" className="mr-1.5">{p.category}</Badge>
                        {p.dueDate && p.source === 'bill' ? `for ${p.dueDate}` : p.note}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 shrink-0">{fmt(p.amount, p.currency)}</span>
                    <button onClick={() => removePayment(p.id)} aria-label={`Delete ${p.name}`}
                      className="p-2 -m-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      <ExpenseModal open={adding} onClose={() => setAdding(false)} onSave={save} />
    </>
  );
}
