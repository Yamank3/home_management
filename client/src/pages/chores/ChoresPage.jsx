import { useState } from 'react';
import { Plus, Trash2, CheckSquare, Check } from 'lucide-react';
import { useChores } from '../../hooks/useChores.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';

const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'as-needed'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EMPTY_FORM = { name: '', assignedTo: '', frequency: 'weekly', frequencyDays: [], notes: '' };
const FREQ_COLORS = { daily: 'blue', weekly: 'green', biweekly: 'indigo', monthly: 'purple', 'as-needed': 'gray' };

const LS_KEY = 'chores_completed_today';

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// Returns a Set of chore IDs completed today, auto-resets if date has changed
function loadCompletedToday() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    if (date !== getTodayKey()) {
      localStorage.removeItem(LS_KEY);
      return new Set();
    }
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveCompletedToday(set) {
  localStorage.setItem(LS_KEY, JSON.stringify({ date: getTodayKey(), ids: [...set] }));
}

function relativeDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  const diff = Math.round((new Date(dateStr) - new Date(today)) / 86400000);
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  return `In ${diff} days`;
}

export default function ChoresPage() {
  const { overdue, dueToday, upcoming, loading, create, complete, remove } = useChores();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [completedToday, setCompletedToday] = useState(() => loadCompletedToday());

  const handleComplete = async (id) => {
    await complete(id);
    const next = new Set(completedToday).add(id);
    setCompletedToday(next);
    saveCompletedToday(next);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await create(form);
    setForm(EMPTY_FORM);
    setShowAdd(false);
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      frequencyDays: f.frequencyDays.includes(day)
        ? f.frequencyDays.filter(d => d !== day)
        : [...f.frequencyDays, day],
    }));
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  const total = overdue.length + dueToday.length + upcoming.length;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Chores"
        subtitle={`${overdue.length} overdue · ${dueToday.length} due today`}
        action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Chore</Button>}
      />

      {total === 0 ? (
        <EmptyState icon={CheckSquare} title="No chores yet" description="Add chores to track your household tasks"
          action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Chore</Button>} />
      ) : (
        <>
          {overdue.length > 0 && (
            <ChoreGroup title="Overdue" titleColor="text-red-600" chores={overdue} onComplete={handleComplete} onDelete={remove} completedToday={completedToday} />
          )}
          {dueToday.length > 0 && (
            <ChoreGroup title="Due Today" titleColor="text-amber-600" chores={dueToday} onComplete={handleComplete} onDelete={remove} completedToday={completedToday} />
          )}
          {upcoming.length > 0 && (
            <ChoreGroup title="Upcoming" chores={upcoming} onComplete={handleComplete} onDelete={remove} completedToday={completedToday} />
          )}
        </>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Chore"
        footer={<>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Add</Button>
        </>}
      >
        <div className="space-y-3">
          <Input label="Chore name" placeholder="e.g. Vacuum living room" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <Input label="Assigned to (optional)" placeholder="e.g. Alice" value={form.assignedTo}
            onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} />
          <Select label="Frequency" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
            {FREQUENCIES.map(freq => <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>)}
          </Select>
          {form.frequency === 'weekly' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Days of week</p>
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.frequencyDays.includes(idx)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Input label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

function ChoreGroup({ title, titleColor = 'text-gray-500', chores, onComplete, onDelete, completedToday }) {
  return (
    <div className="mb-5">
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${titleColor}`}>{title}</p>
      <div className="space-y-2">
        {chores.map(chore => (
          <ChoreItem key={chore.id} chore={chore} onComplete={onComplete} onDelete={onDelete}
            doneToday={completedToday.has(chore.id)} />
        ))}
      </div>
    </div>
  );
}

function ChoreItem({ chore, onComplete, onDelete, doneToday }) {
  const [completing, setCompleting] = useState(false);
  const dateLabel = relativeDate(chore.nextDueDate);
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = chore.nextDueDate && chore.nextDueDate < today;

  const handleComplete = async () => {
    if (completing || doneToday) return;
    setCompleting(true);
    await onComplete(chore.id);
    setCompleting(false);
  };

  return (
    <div className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 ${
      doneToday ? 'border-green-200 bg-green-50' : isOverdue ? 'border-red-100' : 'border-gray-100'
    }`}>
      <button
        onClick={handleComplete}
        disabled={completing || doneToday}
        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
          doneToday
            ? 'border-green-500 bg-green-500 cursor-default'
            : completing
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
        }`}
        title={doneToday ? 'Done today' : 'Mark done'}
      >
        <Check size={14} className={doneToday ? 'text-white' : 'text-gray-300'} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${doneToday ? 'text-green-700' : 'text-gray-800'}`}>{chore.name}</span>
          <Badge color={FREQ_COLORS[chore.frequency] || 'gray'}>{chore.frequency}</Badge>
          {chore.assignedTo && <Badge color="indigo">{chore.assignedTo}</Badge>}
          {doneToday && <Badge color="green">Done today</Badge>}
        </div>
        {dateLabel && !doneToday && (
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{dateLabel}</p>
        )}
      </div>
      <button onClick={() => { if (confirm('Delete this chore?')) onDelete(chore.id); }} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
