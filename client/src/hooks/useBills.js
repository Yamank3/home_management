import { useState, useEffect } from 'react';
import { billsApi } from '../api.js';

export function useBills() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    try {
      const [data, sum] = await Promise.all([billsApi.getAll(), billsApi.getMonthlySummary()]);
      setBills(data);
      setSummary(sum);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

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

  const remove = async (id) => {
    await billsApi.remove(id);
    setBills(prev => prev.filter(b => b.id !== id));
    fetchAll();
  };

  const markPaid = async (id, isPaid) => {
    const updated = await billsApi.update(id, { isPaid });
    setBills(prev => prev.map(b => b.id === id ? updated : b));
  };

  return { bills, summary, loading, error, create, update, remove, markPaid };
}
