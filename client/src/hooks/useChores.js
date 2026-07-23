import { useState, useEffect } from 'react';
import { choresApi } from '../api.js';

export function useChores() {
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    try {
      const data = await choresApi.getAll();
      setChores(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []);

  const create = async (data) => {
    const chore = await choresApi.create(data);
    setChores(prev => [...prev, chore]);
  };

  const update = async (id, data) => {
    const updated = await choresApi.update(id, data);
    setChores(prev => prev.map(c => c.id === id ? updated : c));
  };

  const complete = async (id, completedBy = '') => {
    const updated = await choresApi.complete(id, completedBy);
    setChores(prev => prev.map(c => c.id === id ? updated : c));
  };

  const remove = async (id) => {
    await choresApi.remove(id);
    setChores(prev => prev.filter(c => c.id !== id));
  };

  const today = new Date().toISOString().split('T')[0];
  const overdue = chores.filter(c => c.nextDueDate && c.nextDueDate < today);
  const dueToday = chores.filter(c => c.nextDueDate === today);
  const upcoming = chores.filter(c => !c.nextDueDate || c.nextDueDate > today);

  return { chores, overdue, dueToday, upcoming, loading, error, create, update, complete, remove };
}
