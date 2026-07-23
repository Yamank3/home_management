import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Receipt, CheckSquare, Package, UtensilsCrossed, Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/groceries', label: 'Groceries', icon: ShoppingCart },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/chores', label: 'Chores', icon: CheckSquare },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/meals', label: 'Meals', icon: UtensilsCrossed },
];

export default function Sidebar() {
  const { user, household } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-primary-600">Home</span>
        <span className="text-lg font-bold text-gray-700"> Manager</span>
        {household && <p className="text-xs text-gray-400 mt-0.5 truncate">{household.name}</p>}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="border-t border-gray-100 p-3">
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <span className="truncate">{user.name}</span>
          </NavLink>
        </div>
      )}
    </aside>
  );
}
