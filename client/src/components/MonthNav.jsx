import { ChevronLeft, ChevronRight } from 'lucide-react';
import { shiftMonth, monthLabel, currentMonth } from '../utils/format.js';

export default function MonthNav({ month, onChange }) {
  const isCurrent = month === currentMonth();
  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month"
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><ChevronLeft size={18} /></button>
      <button onClick={() => onChange(currentMonth())} disabled={isCurrent}
        className="text-sm font-semibold text-gray-800 disabled:cursor-default" title={isCurrent ? undefined : 'Back to this month'}>
        {monthLabel(month)}
      </button>
      <button onClick={() => onChange(shiftMonth(month, 1))} disabled={isCurrent} aria-label="Next month"
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"><ChevronRight size={18} /></button>
    </div>
  );
}
