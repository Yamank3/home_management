import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Receipt, CheckSquare, Package, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { dashboardApi } from '../api.js';
import { formatMoney } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import LowStockAlerts from '../components/LowStockAlerts.jsx';
import ReminderRow from '../components/ReminderRow.jsx';
import { useLiveSync, ALL_MODULES } from '../context/LiveSyncContext.jsx';
import { useReminders } from '../context/RemindersContext.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// tone: 'ok' | 'warn' | 'bad' drives the status pill colour.
const TONES = {
  ok: 'bg-green-100 text-green-700',
  warn: 'bg-amber-100 text-amber-700',
  bad: 'bg-red-100 text-red-700',
};

function StatCard({ to, icon: Icon, title, tint, value, unit, detail, status }) {
  return (
    <Link to={to} className="group block bg-surface rounded-2xl border border-gray-100 shadow-card p-4 sm:p-5 hover:border-primary-200 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
          <Icon size={19} className="text-white" />
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold tracking-tight text-gray-900 mt-0.5">
        {value}
        {unit && <span className="text-base font-medium text-gray-400">{unit}</span>}
      </p>
      <p className="text-xs text-gray-500 mt-1 min-h-[1rem]">{detail}</p>
      {status && (
        <span className={`inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${TONES[status.tone]}`}>
          {status.label}
        </span>
      )}
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { items: reminders, count: reminderCount, dismiss } = useReminders();
  // Low-stock reminders already appear above, with an "Add to List" action.
  const topReminders = reminders.filter((r) => r.type !== 'stock').slice(0, 4);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => dashboardApi.getSummary().then(setData).catch(() => {}), []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useLiveSync(ALL_MODULES, load);

  const g = data?.groceries || {};
  const b = data?.bills || {};
  const c = data?.chores || {};
  const inv = data?.inventory || {};
  const m = data?.meals || {};

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-gray-500">{today}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
      </div>

      <LowStockAlerts />

      {topReminders.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Needs attention</h2>
            <Link to="/reminders" className="text-xs font-medium text-primary-600 hover:underline">
              See all ({reminderCount})
            </Link>
          </div>
          <div className="bg-surface rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-100">
            {topReminders.map((r) => <ReminderRow key={r.key} reminder={r} onDismiss={dismiss} />)}
          </div>
        </section>
      )}

      {loading ? <Skeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard to="/groceries" icon={ShoppingCart} title="To buy" tint="bg-green-500"
            value={g.itemsToBuy ?? 0} unit=" items"
            detail={`${g.activeLists ?? 0} active list${g.activeLists === 1 ? '' : 's'}`}
            status={g.itemsToBuy > 0 ? { tone: 'warn', label: 'Shopping needed' } : { tone: 'ok', label: 'All stocked' }}
          />
          <StatCard to="/bills" icon={Receipt} title="Bills due soon" tint="bg-blue-500"
            value={formatMoney(b.dueSoonTotal ?? 0)}
            detail={b.dueSoonCount > 0 ? `${b.dueSoonCount} due within 7 days` : 'Nothing due this week'}
            status={b.dueSoonCount > 0 ? { tone: 'warn', label: `${b.dueSoonCount} due` } : { tone: 'ok', label: 'All clear' }}
          />
          <StatCard to="/chores" icon={CheckSquare} title="Chores today" tint="bg-amber-500"
            value={c.dueToday ?? 0}
            detail={c.overdueChores > 0 ? `${c.overdueChores} overdue` : 'Nothing overdue'}
            status={c.overdueChores > 0 ? { tone: 'bad', label: 'Overdue' } : { tone: 'ok', label: 'On track' }}
          />
          <StatCard to="/inventory" icon={Package} title="Maintenance due" tint="bg-purple-500"
            value={inv.maintenanceDue ?? 0}
            detail={inv.warrantiesExpiring > 0 ? `${inv.warrantiesExpiring} warranty expiring soon` : 'No warranties expiring'}
            status={inv.maintenanceDue > 0 || inv.warrantiesExpiring > 0 ? { tone: 'warn', label: 'Needs attention' } : { tone: 'ok', label: 'Good' }}
          />
          <StatCard to="/meals" icon={UtensilsCrossed} title="Meals planned" tint="bg-rose-500"
            value={m.plannedDays ?? 0} unit={`/${m.totalDays ?? 7} days`}
            detail="This week"
            status={(m.plannedDays ?? 0) < (m.totalDays ?? 7) ? { tone: 'warn', label: 'Plan the rest' } : { tone: 'ok', label: 'Fully planned' }}
          />
        </div>
      )}
    </div>
  );
}
