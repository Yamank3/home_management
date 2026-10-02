import { BellRing } from 'lucide-react';
import { useReminders } from '../../context/RemindersContext.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ReminderRow from '../../components/ReminderRow.jsx';

const GROUPS = [
  { urgency: 'overdue', title: 'Overdue', color: 'text-red-600' },
  { urgency: 'today', title: 'Today', color: 'text-amber-600' },
  { urgency: 'soon', title: 'Coming up', color: 'text-gray-400' },
];

export default function RemindersPage() {
  const { items, dismiss } = useReminders();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Reminders"
        subtitle={items.length ? `${items.length} thing${items.length === 1 ? '' : 's'} need attention` : undefined}
      />
      {items.length === 0 ? (
        <EmptyState icon={BellRing} title="You're all caught up"
          description="Bills, chores, maintenance, warranties and low stock will show up here when they need attention." />
      ) : (
        GROUPS.map(({ urgency, title, color }) => {
          const group = items.filter((r) => r.urgency === urgency);
          if (!group.length) return null;
          return (
            <section key={urgency} className="mb-6">
              <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${color}`}>{title}</h2>
              <div className="bg-surface rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-100">
                {group.map((r) => <ReminderRow key={r.key} reminder={r} onDismiss={dismiss} />)}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
