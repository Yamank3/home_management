import { useState, useEffect, useCallback } from 'react';
import { mealsApi } from '../api.js';

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function useMeals() {
  const [meals, setMeals] = useState([]);
  const [plan, setPlan] = useState([]);
  const [weekStart, setWeekStart] = useState(getMonday());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeals = useCallback(async () => {
    const data = await mealsApi.getAll();
    setMeals(data);
  }, []);

  const fetchPlan = useCallback(async (ws) => {
    const data = await mealsApi.getPlan(ws);
    setPlan(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMeals(), fetchPlan(weekStart)]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPlan(weekStart);
  }, [weekStart, fetchPlan]);

  const createMeal = async (data) => {
    const meal = await mealsApi.create(data);
    setMeals(prev => [...prev, meal]);
    return meal;
  };

  const updateMeal = async (id, data) => {
    const updated = await mealsApi.update(id, data);
    setMeals(prev => prev.map(m => m.id === id ? updated : m));
  };

  const removeMeal = async (id) => {
    await mealsApi.remove(id);
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const setPlanDay = async (date, slot, mealId) => {
    const entry = plan.find(p => p.date === date);
    const updated = { date, [slot]: mealId };
    if (entry?.id) {
      const res = await mealsApi.updatePlan(entry.id, updated);
      setPlan(prev => prev.map(p => p.date === date ? res : p));
    } else {
      const res = await mealsApi.setPlan(updated);
      setPlan(prev => {
        const exists = prev.find(p => p.date === date);
        if (exists) return prev.map(p => p.date === date ? res : p);
        return [...prev, res];
      });
    }
  };

  const addToGroceries = (mealId, listId) => mealsApi.addToGroceries(mealId, listId);

  const markCooked = async (date, slot) => {
    const entry = plan.find(p => p.date === date);
    if (!entry?.id) return null;
    const result = await mealsApi.cookSlot(entry.id, slot);
    // Update plan state with new cookedSlots
    setPlan(prev => prev.map(p => p.date === date ? result.entry : p));
    return result;
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  return {
    meals, plan, weekStart, loading, error,
    createMeal, updateMeal, removeMeal,
    setPlanDay, addToGroceries, markCooked,
    prevWeek, nextWeek,
  };
}
