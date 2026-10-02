import { useSyncExternalStore } from 'react';

// Tiny store for the banner: are we offline, and how many edits are waiting to sync.
let state = { offline: typeof navigator !== 'undefined' && navigator.onLine === false, pending: 0 };
const listeners = new Set();

function set(patch) {
  const next = { ...state, ...patch };
  if (next.offline === state.offline && next.pending === state.pending) return;
  state = next;
  listeners.forEach((fn) => fn());
}

export const connectivity = {
  setOffline: (offline) => set({ offline }),
  setPending: (pending) => set({ pending }),
  get: () => state,
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
};

export const useConnectivity = () => useSyncExternalStore(connectivity.subscribe, connectivity.get);
