import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Receipt, CheckSquare, Package, UtensilsCrossed, UserCircle,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/groceries', label: 'Groceries', icon: ShoppingCart },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/chores', label: 'Chores', icon: CheckSquare },
  { to: '/inventory', label: 'Items', icon: Package },
  { to: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { to: '/account', label: 'Account', icon: UserCircle },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex overflow-x-auto scrollbar-hide">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 min-w-0 flex flex-col items-center py-2 text-xs font-medium transition-colors shrink-0 ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            <span className="mt-0.5 truncate text-[10px]">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
