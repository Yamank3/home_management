import {
  LayoutDashboard, ShoppingCart, Receipt, CheckSquare, Package, UtensilsCrossed, UserCircle, Bell,
} from 'lucide-react';

// Single source of truth for navigation. `primary` items get a bottom-nav tab on
// mobile; the rest live in the "More" sheet.
export const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, primary: true },
  { to: '/groceries', label: 'Groceries', icon: ShoppingCart, primary: true },
  { to: '/bills', label: 'Bills', icon: Receipt, primary: true },
  { to: '/chores', label: 'Chores', icon: CheckSquare, primary: true },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/account', label: 'Account', icon: UserCircle },
];
