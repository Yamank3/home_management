import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Receipt, CheckSquare, Package, UtensilsCrossed, AlertCircle, ArrowRight } from 'lucide-react';
import { dashboardApi } from '../api.js';

function StatCard({ to, icon: Icon, title, color, children, alert }) {
  return (
    <Link to={to} className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {alert && (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <AlertCircle size={12} /> {alert}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
      <div className="text-gray-800">{children}</div>
      <div className="flex items-center gap-1 text-xs text-gray-400 mt-3 group-hover:text-primary-500 transition-colors">
        Open <ArrowRight size={12} />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getSummary()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Home Manager</h1>
        <p className="text-sm text-gray-400 mt-0.5">Loading your home dashboard...</p>
      </div>
    </div>
  );

  const g = data?.groceries || {};
  const b = data?.bills || {};
  const c = data?.chores || {};
  const inv = data?.inventory || {};
  const m = data?.meals || {};

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good day</h1>
        <p className="text-sm text-gray-400 mt-0.5">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard to="/groceries" icon={ShoppingCart} title="Groceries" color="bg-green-500"
          alert={g.itemsToBuy > 0 ? `${g.itemsToBuy} to buy` : undefined}
        >
          <p className="text-2xl font-bold">{g.activeLists ?? 0}</p>
          <p className="text-sm text-gray-500">active list{(g.activeLists ?? 0) !== 1 ? 's' : ''}</p>
        </StatCard>

        <StatCard to="/bills" icon={Receipt} title="Bills" color="bg-blue-500"
          alert={b.dueSoonCount > 0 ? `${b.dueSoonCount} due soon` : undefined}
        >
          {b.dueSoonCount > 0 ? (
            <>
              <p className="text-2xl font-bold">${b.dueSoonTotal?.toFixed(0) ?? 0}</p>
              <p className="text-sm text-gray-500">due within 7 days</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-600">All clear</p>
              <p className="text-sm text-gray-500">no bills due soon</p>
            </>
          )}
        </StatCard>

        <StatCard to="/chores" icon={CheckSquare} title="Chores" color="bg-amber-500"
          alert={c.overdueChores > 0 ? `${c.overdueChores} overdue` : undefined}
        >
          <p className="text-2xl font-bold">{c.dueToday ?? 0}</p>
          <p className="text-sm text-gray-500">due today{c.overdueChores > 0 ? ` · ${c.overdueChores} overdue` : ''}</p>
        </StatCard>

        <StatCard to="/inventory" icon={Package} title="Inventory" color="bg-purple-500"
          alert={inv.warrantiesExpiring > 0 ? `${inv.warrantiesExpiring} warranty expiring` : undefined}
        >
          <p className="text-2xl font-bold">{inv.maintenanceDue ?? 0}</p>
          <p className="text-sm text-gray-500">maintenance due{inv.warrantiesExpiring > 0 ? ` · ${inv.warrantiesExpiring} warranty expiring` : ''}</p>
        </StatCard>

        <StatCard to="/meals" icon={UtensilsCrossed} title="Meals" color="bg-rose-500">
          <p className="text-2xl font-bold">{m.plannedDays ?? 0}<span className="text-base font-normal text-gray-400">/{m.totalDays ?? 7}</span></p>
          <p className="text-sm text-gray-500">days planned this week</p>
        </StatCard>
      </div>
    </div>
  );
}
