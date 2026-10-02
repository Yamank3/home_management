import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// toast(message, { action: { label, onClick }, tone: 'success' | 'error', duration })
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((message, { action, tone = 'success', duration = 5000 } = {}) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, action, tone }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[70] inset-x-4 bottom-24 md:bottom-6 md:left-auto md:right-6 md:w-96 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(({ id, message, action, tone }) => (
          <div
            key={id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-gray-50 shadow-float animate-fade-in"
          >
            {tone === 'error'
              ? <AlertCircle size={18} className="text-red-400 shrink-0" />
              : <CheckCircle2 size={18} className="text-green-400 shrink-0" />}
            <p className="flex-1 min-w-0 text-sm truncate">{message}</p>
            {action && (
              <button
                onClick={() => { action.onClick(); dismiss(id); }}
                className="shrink-0 text-sm font-semibold text-primary-200 hover:text-white px-2 py-1 -my-1 rounded-lg"
              >
                {action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
