import { createContext, useContext, useEffect, useRef } from 'react';
import { streamEvents, CLIENT_ID, SYNC_FLUSHED_EVENT } from '../api.js';

// Areas of data a screen can depend on; matches the server's utils/realtime.js.
export const ALL_MODULES = ['groceries', 'inventory', 'bills', 'chores', 'meals', 'payments', 'budgets'];

const LiveSyncContext = createContext(null);

const FLUSH_MS = 250;        // coalesce bursts of events into one refetch
const FALLBACK_MS = 60000;   // safety net if a proxy buffers or drops the stream
const MAX_BACKOFF_MS = 30000;

// Keeps one event stream open and tells subscribed screens when household data
// they show was changed by someone else. After any gap (reconnect, tab hidden,
// periodic fallback) it tells everyone to refetch, since events may be missed.
export function LiveSyncProvider({ children }) {
  const listeners = useRef(new Set());

  useEffect(() => {
    const controller = new AbortController();
    let pending = new Set();
    let timer = null;

    const flush = () => {
      const changed = pending;
      pending = new Set();
      timer = null;
      listeners.current.forEach((fn) => fn(changed));
    };
    const notify = (modules) => {
      modules.forEach((m) => pending.add(m));
      timer ??= setTimeout(flush, FLUSH_MS);
    };

    const onVisible = () => { if (document.visibilityState === 'visible') notify(ALL_MODULES); };
    document.addEventListener('visibilitychange', onVisible);
    // Edits made offline just reached the server: show the real (server-assigned) data.
    const onFlushed = () => notify(ALL_MODULES);
    window.addEventListener(SYNC_FLUSHED_EVENT, onFlushed);
    const fallback = setInterval(() => notify(ALL_MODULES), FALLBACK_MS);

    (async () => {
      let backoff = 1000;
      let connectedBefore = false;
      while (!controller.signal.aborted) {
        try {
          await streamEvents({
            signal: controller.signal,
            onOpen: () => {
              backoff = 1000;
              if (connectedBefore) notify(ALL_MODULES); // we may have missed events
              connectedBefore = true;
            },
            onEvent: ({ name, data }) => {
              if (name === 'change' && data.origin !== CLIENT_ID) notify(data.modules);
            },
          });
        } catch { /* network drop or server restart: fall through and retry */ }
        if (controller.signal.aborted) return;
        await new Promise((r) => setTimeout(r, backoff));
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
    })();

    return () => {
      controller.abort();
      clearTimeout(timer);
      clearInterval(fallback);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(SYNC_FLUSHED_EVENT, onFlushed);
    };
  }, []);

  return <LiveSyncContext.Provider value={listeners}>{children}</LiveSyncContext.Provider>;
}

// Calls `onChange` when another device changes any of `modules`. Use with the
// function that refetches what the screen shows.
export function useLiveSync(modules, onChange) {
  const listeners = useContext(LiveSyncContext);
  const latest = useRef(onChange);
  latest.current = onChange;
  const key = modules.join(',');

  useEffect(() => {
    if (!listeners) return;
    const mine = new Set(key.split(','));
    const listener = (changed) => {
      if ([...changed].some((m) => mine.has(m))) latest.current();
    };
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, [listeners, key]);
}
