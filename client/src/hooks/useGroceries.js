import { useState, useEffect, useCallback } from 'react';
import { groceryApi } from '../api.js';

export function useGroceries() {
  const [lists, setLists] = useState([]);
  const [items, setItems] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLists = useCallback(async () => {
    try {
      const data = await groceryApi.getLists();
      setLists(data);
      if (data.length > 0 && !activeListId) setActiveListId(data[0].id);
    } catch (e) {
      setError(e.message);
    }
  }, [activeListId]);

  const fetchItems = useCallback(async (listId) => {
    if (!listId) return;
    try {
      const data = await groceryApi.getItems(listId);
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLists().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeListId) fetchItems(activeListId);
  }, [activeListId, fetchItems]);

  const createList = async (name, focusGroups = []) => {
    const list = await groceryApi.createList(name, focusGroups);
    setLists(prev => [list, ...prev]);
    setActiveListId(list.id);
    setItems([]);
  };

  const deleteList = async (id) => {
    await groceryApi.deleteList(id);
    const remaining = lists.filter(l => l.id !== id);
    setLists(remaining);
    if (activeListId === id) {
      const next = remaining[0]?.id || null;
      setActiveListId(next);
      if (next) fetchItems(next); else setItems([]);
    }
  };

  const addItem = async (data) => {
    const item = await groceryApi.addItem({ ...data, listId: activeListId });
    setItems(prev => [...prev, item]);
  };

  const toggleBought = async (id, bought) => {
    const updated = await groceryApi.updateItem(id, { bought });
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  };

  const updateItem = async (id, data) => {
    const updated = await groceryApi.updateItem(id, data);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  };

  const removeItem = async (id) => {
    await groceryApi.removeItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearBought = async () => {
    await groceryApi.clearBought(activeListId);
    setItems(prev => prev.filter(i => !i.bought));
  };

  return {
    lists, items, activeListId, setActiveListId,
    loading, error,
    createList, deleteList, addItem, toggleBought, updateItem, removeItem, clearBought,
  };
}
