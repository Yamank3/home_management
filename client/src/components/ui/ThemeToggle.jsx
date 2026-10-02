import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.js';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'Auto', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export default function ThemeToggle() {
  const { pref, setPref } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="flex p-1 bg-gray-100 rounded-xl">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={pref === value}
          onClick={() => setPref(value)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            pref === value ? 'bg-surface text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}
