import { useState, useEffect, useCallback } from 'react';
import { groceryApi } from '../api.js';

export function useGroceries() {
  const [lists, setLists] = useState([]);
  const [items, setItems] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (listId) => {
    if (!listId) return;
    try {
      const data = await groceryApi.getItems(listId);
      setItems(data);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    setLoading(true);
    groceryApi.getLists()
      .then(data => {
        setLists(data);
        if (data.length > 0) setActiveListId(data[0].id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeListId) fetchItems(activeListId);
  }, [activeListId, fetchItems]);

  const createList = async (name, focusGroups = []) => {
    const list = await groceryApi.createList(name, focusGroups);
    setLists(prev => [list, ...prev]);
    setActiveListId(list.id);
    setItems([]);
    return list;
  };

  const addItem = async (data) => {
    const item = await groceryApi.addItem({ ...data, listId: activeListId });
    setItems(prev => [...prev, item]);
  };

  const toggleBought = async (id, bought, edits = {}) => {
    // If marking as bought, apply any edits (quantity, note, shelfLifeDays) in the same call
    const data = { bought, ...edits };
    const updated = await groceryApi.updateItem(id, data);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  };

  const reAddItem = async (item) => {
    // Add a fresh unbought copy of the same item back to the list
    const fresh = await groceryApi.addItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      note: item.note,
      monthlyFrequency: item.monthlyFrequency,
      shelfLifeDays: item.shelfLifeDays,
      listId: activeListId,
    });
    setItems(prev => [...prev, fresh]);
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
    createList, addItem, toggleBought, reAddItem, removeItem, clearBought,
  };
}
