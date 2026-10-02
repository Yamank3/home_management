import { useState } from 'react';
import { Plus, Trash2, Pencil, CheckCircle, Circle, Receipt, AlertCircle } from 'lucide-react';
import { useBills } from '../../hooks/useBills.js';
import { formatMoney as fmt } from '../../utils/format.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';

const CATEGORIES = ['utilities', 'insurance', 'subscriptions', 'rent/mortgage', 'loans', 'other'];
const FREQUENCIES = ['monthly', 'weekly', 'biweekly', 'quarterly', 'annual', 'one-time'];
const CAT_COLORS = {
  utilities: 'blue', insurance: 'purple', subscriptions: 'indigo',
  'rent/mortgage': 'orange', loans: 'red', other: 'gray',
};

const EMPTY_FORM = { name: '', amount: '', currency: 'INR', category: 'utilities', frequency: 'monthly', nextDueDate: '', notes: '' };

function dueSoonColor(nextDueDate) {
  if (!nextDueDate) return '';
  const today = new Date().toISOString().split('T')[0];
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  if (nextDueDate < today) return 'border-red-200 bg-red-50';
  if (nextDueDate <= in7) return 'border-amber-200 bg-amber-50';
  return '';
}

export default function BillsPage() {
  const { bills, summary, loading, create, update, remove, markPaid } = useBills();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.amount) return;
    const { name, currency, category, frequency, notes } = form;
    const payload = {
      name, currency, category, frequency, notes,
      amount: parseFloat(form.amount),
      nextDueDate: form.nextDueDate || null,
    };
    if (editId) {
      await update(editId, payload);
    } else {
      await create(payload);
    }
    setForm(EMPTY_FORM);
    setShowAdd(false);
    setEditId(null);
  };

  const openEdit = (bill) => {
    setForm({ ...EMPTY_FORM, ...bill, amount: String(bill.amount), nextDueDate: bill.nextDueDate || '' });
    setEditId(bill.id);
    setShowAdd(true);
  };

  const today = new Date().toISOString().split('T')[0];
  const unpaid = bills.filter(b => !b.isPaid);
  const paid = bills.filter(b => b.isPaid);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Bills & Expenses"
        subtitle={summary ? `~${fmt(summary.total)} / month` : undefined}
        action={<Button size="sm" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowAdd(true); }}><Plus size={15} /> Add Bill</Button>}
      />

      {/* Monthly summary */}
      {summary && Object.keys(summary.byCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Monthly Breakdown</p>
          <div className="space-y-2">
            {Object.entries(summary.byCategory).map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-2">
                <Badge color={CAT_COLORS[cat] || 'gray'}>{cat}</Badge>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${Math.min(100, (amt / summary.total) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-20 text-right">{fmt(amt)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-sm font-bold text-primary-600">{fmt(summary.total)}</span>
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <EmptyState icon={Receipt} title="No bills tracked yet" description="Add your recurring bills and subscriptions"
          action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Bill</Button>} />
      ) : (
        <>
          {unpaid.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Unpaid</p>
              <div className="space-y-2 mb-6">
                {unpaid.map(bill => (
                  <BillCard key={bill.id} bill={bill} onTogglePaid={markPaid} onEdit={openEdit} onDelete={remove} />
                ))}
              </div>
            </>
          )}
          {paid.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Paid</p>
              <div className="space-y-2">
                {paid.map(bill => (
                  <BillCard key={bill.id} bill={bill} onTogglePaid={markPaid} onEdit={openEdit} onDelete={remove} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditId(null); }} title={editId ? 'Edit Bill' : 'Add Bill'}
        footer={<>
          <Button variant="secondary" onClick={() => { setShowAdd(false); setEditId(null); }}>Cancel</Button>
          <Button onClick={handleSubmit}>{editId ? 'Save' : 'Add'}</Button>
        </>}
      >
        <div className="space-y-3">
          <Input label="Bill name" placeholder="e.g. Netflix" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <div className="flex gap-2">
            <Input label="Amount" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Select label="Currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['INR','USD','EUR','GBP','AED','SGD'].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="flex gap-2">
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Select label="Frequency" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
              {FREQUENCIES.map(freq => <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>)}
            </Select>
          </div>
          <div>
            <Input label={form.frequency === 'one-time' ? 'Due date (optional)' : 'Next due date'} type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))} />
            {form.frequency !== 'one-time' && (
              <p className="text-xs text-gray-400 mt-1">Repeats {form.frequency}. Once you mark it paid, it moves to the next due date by itself.</p>
            )}
          </div>
          <Input label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

function BillCard({ bill, onTogglePaid, onEdit, onDelete }) {
  const highlight = dueSoonColor(bill.nextDueDate);
  return (
    <div className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 ${highlight || 'border-gray-100'}`}>
      <button onClick={() => onTogglePaid(bill.id, !bill.isPaid)} className="shrink-0 text-gray-400 hover:text-green-500 transition-colors">
        {bill.isPaid ? <CheckCircle size={20} className="text-green-500" /> : <Circle size={20} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${bill.isPaid ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{bill.name}</span>
          <Badge color={CAT_COLORS[bill.category] || 'gray'}>{bill.category}</Badge>
          {bill.nextDueDate && bill.isPaid && bill.frequency !== 'one-time' && (
            <span className="text-xs text-gray-400">Paid · next due {bill.nextDueDate}</span>
          )}
          {bill.nextDueDate && !bill.isPaid && (
            <span className={`text-xs ${bill.nextDueDate < new Date().toISOString().split('T')[0] ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              Due {bill.nextDueDate}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{bill.frequency}</p>
      </div>
      <span className="font-semibold text-gray-700 shrink-0">{fmt(bill.amount, bill.currency)}</span>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(bill)} aria-label="Edit bill" className="p-2 -m-1 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-gray-100 transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={() => onDelete(bill.id)} aria-label="Delete bill" className="p-2 -m-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
