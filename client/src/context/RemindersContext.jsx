import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { remindersApi } from '../api.js';
import { useAuth } from './AuthContext.jsx';
import { useLiveSync, ALL_MODULES } from './LiveSyncContext.jsx';

const RemindersContext = createContext(null);

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used inside RemindersProvider');
  return ctx;
}

const storageKey = (userId) => `reminders.dismissed.${userId}`;
const readDismissed = (userId) => {
  try { return JSON.parse(localStorage.getItem(storageKey(userId))) || []; } catch { return []; }
};
const writeDismissed = (userId, keys) => {
  try { localStorage.setItem(storageKey(userId), JSON.stringify(keys)); } catch { /* storage unavailable */ }
};

const REFRESH_MS = 5 * 60 * 1000;

// Reminders are computed by the server from live data. Dismissals are kept per
// user on this device; a key includes the item's date, so a dismissal disappears
// by itself once the bill/chore moves to its next cycle.
export function RemindersProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [all, setAll] = useState([]);
  const [dismissed, setDismissed] = useState(() => readDismissed(user.id));

  const refresh = useCallback(async () => {
    try {
      const data = await remindersApi.getAll();
      setAll(data);
      // Forget dismissals for reminders that no longer exist.
      setDismissed((prev) => {
        const live = new Set(data.map((r) => r.key));
        const kept = prev.filter((k) => live.has(k));
        if (kept.length !== prev.length) writeDismissed(user.id, kept);
        return kept.length === prev.length ? prev : kept;
      });
    } catch { /* keep showing the last known list */ }
  }, [user.id]);

  useLiveSync(ALL_MODULES, refresh);

  // Refetch on every navigation (so changes made on a page are reflected), when
  // the app regains focus, and periodically.
  useEffect(() => { refresh(); }, [pathname, refresh]);
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => { document.removeEventListener('visibilitychange', onVisible); clearInterval(timer); };
  }, [refresh]);

  const dismiss = useCallback((key) => {
    setDismissed((prev) => {
      const next = [...prev, key];
      writeDismissed(user.id, next);
      return next;
    });
  }, [user.id]);

  const value = useMemo(() => {
    const items = all.filter((r) => !dismissed.includes(r.key));
    return { items, count: items.length, dismiss, refresh };
  }, [all, dismissed, dismiss, refresh]);

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}
