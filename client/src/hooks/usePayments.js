import { useState, useEffect, useCallback } from 'react';
import { paymentsApi, budgetsApi } from '../api.js';
import { useUndoableRemove } from './useUndoableRemove.js';
import { useLiveSync } from '../context/LiveSyncContext.jsx';

// Payment history, the spending summary and budgets for one month ('YYYY-MM').
export function usePayments(month) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([paymentsApi.list(month), paymentsApi.summary(month)]);
      setPayments(remove.withoutPending(list));
      setSummary(sum);
      setError(null);
    } catch (e) { setError(e.message); }
  }, [month]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);
  useLiveSync(['payments', 'budgets'], load);

  const remove = useUndoableRemove({
    items: payments, setItems: setPayments, apiRemove: paymentsApi.remove, label: (p) => p.name, onCommitted: load,
  });

  const addExpense = async (data) => { const p = await paymentsApi.create(data); await load(); return p; };
  const setBudget = async (category, amount) => { await budgetsApi.set(category, amount); await load(); };

  return { payments, summary, loading, error, addExpense, removePayment: remove, setBudget };
}
