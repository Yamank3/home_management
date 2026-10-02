import { useState, useEffect } from 'react';
import { billsApi } from '../api.js';
import { useUndoableRemove } from './useUndoableRemove.js';
import { useLiveSync } from '../context/LiveSyncContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export function useBills() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    try {
      const [data, sum] = await Promise.all([billsApi.getAll(), billsApi.getMonthlySummary()]);
      setBills(remove.withoutPending(data));
      setSummary(sum);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  useLiveSync(['bills'], fetchAll);

  const create = async (data) => {
    const bill = await billsApi.create(data);
    setBills(prev => [...prev, bill]);
    fetchAll();
  };

  const update = async (id, data) => {
    const updated = await billsApi.update(id, data);
    setBills(prev => prev.map(b => b.id === id ? updated : b));
    fetchAll();
  };

  const remove = useUndoableRemove({
    items: bills, setItems: setBills, apiRemove: billsApi.remove, label: b => b.name, onCommitted: fetchAll,
  });

  const markPaid = async (id, isPaid) => {
    const updated = await billsApi.update(id, { isPaid });
    setBills(prev => prev.map(b => b.id === id ? updated : b));
    if (isPaid) {
      const next = updated.frequency !== 'one-time' && updated.nextDueDate;
      toast(next ? `${updated.name} paid · next due ${updated.nextDueDate}` : `${updated.name} paid`, {
        action: { label: 'Undo', onClick: () => markPaid(id, false) },
      });
    }
  };

  return { bills, summary, loading, error, create, update, remove, markPaid };
}
