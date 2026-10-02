import { NavLink } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NAV } from './nav.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

export default function Sidebar() {
  const { user, household } = useAuth();
  const items = NAV.filter((n) => n.to !== '/account');

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-surface border-r border-gray-100 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
          <Home size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">Home Manager</p>
          {household && <p className="text-xs text-gray-400 truncate">{household.name}</p>}
        </div>
      </div>
      <nav className="flex-1 py-2 space-y-1 px-3 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3 space-y-3">
        <ThemeToggle />
        {user && (
          <NavLink to="/account" className={linkClass}>
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <span className="truncate">{user.name}</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
