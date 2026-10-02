import { useEffect, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';
import Select from './ui/Select.jsx';
import { SPEND_CATEGORIES } from '../utils/categories.js';
import { localDate } from '../utils/format.js';

const empty = () => ({ name: '', amount: '', category: 'groceries', paidOn: localDate(), note: '' });

// Add a one-off expense. `initial` pre-fills it (for example from a scanned receipt);
// `source` records where it came from.
export default function ExpenseModal({ open, onClose, onSave, initial, source = 'expense', title = 'Add expense' }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setForm({ ...empty(), ...initial }); setError(''); } }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const amount = parseFloat(form.amount);
    if (!form.name.trim()) return setError('Enter what it was for');
    if (!(amount > 0)) return setError('Enter an amount above 0');
    setSaving(true);
    try {
      await onSave({ name: form.name.trim(), amount, category: form.category, paidOn: form.paidOn || localDate(), note: form.note, source });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </>}
    >
      <div className="space-y-3">
        <Input label="What was it for?" placeholder="e.g. Big Bazaar" value={form.name} onChange={set('name')} autoFocus />
        <div className="flex gap-2">
          <Input label="Amount" type="number" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={set('amount')} />
          <Input label="Date" type="date" value={form.paidOn} onChange={set('paidOn')} />
        </div>
        <Select label="Category" value={form.category} onChange={set('category')}>
          {SPEND_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Input label="Note (optional)" value={form.note} onChange={set('note')} />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
