import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShoppingCart } from 'lucide-react';
import { inventoryApi, groceryApi } from '../api.js';

const sessionDismissed = new Set();

export default function LowStockAlerts({ onReAdded }) {
  const [alerts, setAlerts]       = useState([]);
  const [dismissed, setDismissed] = useState(new Set(sessionDismissed));
  const [adding, setAdding]       = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    inventoryApi.getAll({ fromGrocery: 'true' })
      .then(items => {
        if (cancelled) return;
        const today = new Date().toISOString().split('T')[0];
        const in7   = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        setAlerts(items.filter(i =>
          i.estimatedEndDate &&
          i.estimatedEndDate <= in7 &&
          !sessionDismissed.has(i.id)
        ));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const dismiss = (id) => {
    sessionDismissed.add(id);
    setDismissed(prev => new Set([...prev, id]));
  };

  const reAdd = async (item) => {
    setAdding(prev => new Set([...prev, item.id]));
    try {
      const lists = await groceryApi.getLists();
      if (lists.length) {
        await groceryApi.addItem({
          name: item.name,
          category: item.category,
          quantity: item.stockQuantity || '',
          note: '',
          monthlyFrequency: item.monthlyFrequency,
          shelfLifeDays: item.shelfLifeDays,
          listId: lists[0].id,
        });
        dismiss(item.id);
        onReAdded?.();
      }
    } catch {}
    setAdding(prev => { const s = new Set(prev); s.delete(item.id); return s; });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-2 mb-5">
      {visible.map(item => {
        const daysLeft   = Math.round((new Date(item.estimatedEndDate) - new Date(today)) / 86400000);
        const isOut      = daysLeft < 0;
        const isCritical = daysLeft >= 0 && daysLeft <= 3;

        const bg     = isOut || isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
        const iconCl = isOut || isCritical ? 'text-red-500' : 'text-amber-500';
        const textCl = isOut || isCritical ? 'text-red-700' : 'text-amber-700';
        const label  = isOut        ? `${item.name} has likely run out`
                     : daysLeft === 0 ? `${item.name} runs out today`
                     :                  `${item.name} runs out in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;

        return (
          <div key={item.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${bg}`}>
            <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${iconCl}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${textCl}`}>{label}</p>
              {item.stockQuantity && (
                <p className="text-xs text-gray-500 mt-0.5">Last bought: {item.stockQuantity}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => reAdd(item)}
                disabled={adding.has(item.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-primary-300 text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                <ShoppingCart size={12} />
                {adding.has(item.id) ? 'Adding…' : 'Add to List'}
              </button>
              <button
                onClick={() => dismiss(item.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
