import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { NAV } from './nav.js';
import Modal from '../ui/Modal.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useReminders } from '../../context/RemindersContext.jsx';

const PRIMARY = NAV.filter((n) => n.primary);
const MORE = NAV.filter((n) => !n.primary);

const tabClass = (active) =>
  `flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
    active ? 'text-primary-600' : 'text-gray-500'
  }`;

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const { count } = useReminders();
  const moreActive = MORE.some((n) => pathname.startsWith(n.to));

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur border-t border-gray-100 pb-safe">
        <div className="flex">
          {PRIMARY.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => tabClass(isActive)}>
              {({ isActive }) => (
                <>
                  <span className={`px-4 py-1 rounded-full transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMoreOpen(true)} className={tabClass(moreActive)} aria-haspopup="dialog">
            <span className={`relative px-4 py-1 rounded-full transition-colors ${moreActive ? 'bg-primary-50' : ''}`}>
              <MoreHorizontal size={20} />
              {count > 0 && <span className="absolute top-0.5 right-3 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-surface" />}
            </span>
            More
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="grid grid-cols-4 gap-2 mb-5">
          {MORE.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreOpen(false)}
              className="relative flex flex-col items-center gap-2 py-4 rounded-xl bg-gray-50 text-gray-700 text-xs font-medium active:bg-gray-100"
            >
              <Icon size={22} className="text-primary-600" />
              {label}
              {to === '/reminders' && count > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">{count}</span>
              )}
            </NavLink>
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Appearance</p>
        <ThemeToggle />
      </Modal>
    </>
  );
}
