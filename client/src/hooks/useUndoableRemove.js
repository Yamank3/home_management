import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '../components/ui/Toast.jsx';

const UNDO_MS = 5000;

// Removes an item from the UI immediately, shows an "Undo" toast, and only calls
// the API once the window closes. Undo restores the exact original (nothing is
// re-created). Pending deletes are committed if the page unmounts.
//   items/setItems: the list state owned by the calling hook
//   apiRemove(id):  the server call; onCommitted(): optional follow-up (e.g. refetch)
export function useUndoableRemove({ items, setItems, apiRemove, label, onCommitted }) {
  const { toast } = useToast();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pending = useRef(new Map()); // id -> { item, commit }

  const commit = useCallback(async (id) => {
    const entry = pending.current.get(id);
    if (!entry) return;
    pending.current.delete(id);
    clearTimeout(entry.timer);
    try {
      await apiRemove(id);
      onCommitted?.();
    } catch (e) {
      setItems((prev) => [...prev, entry.item]);
      toast(`Couldn't delete: ${e.message}`, { tone: 'error' });
    }
  }, [apiRemove, onCommitted, setItems, toast]);

  useEffect(() => () => { [...pending.current.keys()].forEach(commit); }, [commit]);

  return useCallback((id) => {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const timer = setTimeout(() => commit(id), UNDO_MS);
    pending.current.set(id, { item, timer });
    toast(`${label(item)} deleted`, {
      duration: UNDO_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timer);
          pending.current.delete(id);
          setItems((prev) => [...prev, item]);
        },
      },
    });
  }, [commit, label, setItems, toast]);
}
