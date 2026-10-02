import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Bottom sheet on phones, centred dialog on larger screens.
export default function Modal({ open, onClose, title, children, footer }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-float flex flex-col max-h-[90dvh] animate-sheet-up sm:animate-fade-in"
      >
        <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-gray-200" />
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-4">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end shrink-0 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
