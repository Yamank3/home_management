import { Link } from 'react-router-dom';
import { Receipt, CheckSquare, Wrench, ShieldCheck, ShoppingCart, X } from 'lucide-react';

const ICONS = { bill: Receipt, chore: CheckSquare, maintenance: Wrench, warranty: ShieldCheck, stock: ShoppingCart };

const TONES = {
  overdue: { icon: 'bg-red-100 text-red-600', detail: 'text-red-600' },
  today: { icon: 'bg-amber-100 text-amber-600', detail: 'text-amber-600' },
  soon: { icon: 'bg-gray-100 text-gray-500', detail: 'text-gray-500' },
};

export default function ReminderRow({ reminder, onDismiss }) {
  const Icon = ICONS[reminder.type] || Receipt;
  const tone = TONES[reminder.urgency];
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Link to={reminder.link} className="flex flex-1 min-w-0 items-center gap-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
          <Icon size={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-900 truncate">{reminder.title}</span>
          <span className={`block text-xs ${tone.detail}`}>{reminder.detail}</span>
        </span>
      </Link>
      <button
        onClick={() => onDismiss(reminder.key)}
        aria-label={`Dismiss ${reminder.title}`}
        className="p-2 -m-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
