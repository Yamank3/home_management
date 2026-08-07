import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../api.js';

export function useInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchAll = useCallback(async (params = {}) => {
    try {
      const data = await inventoryApi.getAll(params);
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    fetchAll(params);
  }, [search, categoryFilter, fetchAll]);

  const create = async (data) => {
    const item = await inventoryApi.create(data);
    setItems(prev => [...prev, item]);
  };

  const update = async (id, data) => {
    const updated = await inventoryApi.update(id, data);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  };

  const remove = async (id) => {
    await inventoryApi.remove(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const bulkRemove = async (ids) => {
    await inventoryApi.bulkRemove(ids);
    setItems(prev => prev.filter(i => !ids.includes(i.id)));
  };

  return {
    items, loading, error,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    create, update, remove, bulkRemove,
  };
}
