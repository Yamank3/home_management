import { useEffect, useRef } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { flushOutbox, OFFLINE_BLOCKED_EVENT, SYNC_FLUSHED_EVENT } from '../api.js';
import { connectivity, useConnectivity } from '../offline/connectivity.js';
import { useToast } from './ui/Toast.jsx';

const RETRY_MS = 15000;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Banner while offline or while edits are waiting, plus the triggers that send the
// queued edits: back online, app regains focus, and a periodic retry.
export default function OfflineStatus() {
  const { offline, pending } = useConnectivity();
  const { toast } = useToast();
  const lastBlockedToast = useRef(0);

  useEffect(() => {
    const retry = () => flushOutbox();
    const onOffline = () => connectivity.setOffline(true);
    const onVisible = () => { if (document.visibilityState === 'visible') retry(); };
    const onFlushed = ({ detail: { sent, failed } }) => {
      if (sent.length) toast(`Synced ${plural(sent.length, 'change')}`);
      if (failed.length) toast(`${plural(failed.length, 'change')} couldn't be saved: ${failed[0].message}`, { tone: 'error' });
    };
    const onBlocked = () => {
      if (Date.now() - lastBlockedToast.current < 3000) return;
      lastBlockedToast.current = Date.now();
      toast("You're offline. This change needs a connection.", { tone: 'error' });
    };

    retry();
    const timer = setInterval(retry, RETRY_MS);
    window.addEventListener('online', retry);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(SYNC_FLUSHED_EVENT, onFlushed);
    window.addEventListener(OFFLINE_BLOCKED_EVENT, onBlocked);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', retry);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(SYNC_FLUSHED_EVENT, onFlushed);
      window.removeEventListener(OFFLINE_BLOCKED_EVENT, onBlocked);
    };
  }, [toast]);

  if (!offline && pending === 0) return null;

  return (
    <div role="status" className="sticky top-0 z-30 flex items-center gap-2 px-4 py-2 text-xs font-medium bg-amber-100 text-amber-700 border-b border-amber-200">
      {offline ? <WifiOff size={14} className="shrink-0" /> : <RefreshCw size={14} className="shrink-0 animate-spin" />}
      <span className="min-w-0 truncate">
        {offline ? "You're offline. Showing your last saved data." : 'Syncing your changes…'}
        {pending > 0 && ` ${plural(pending, 'change')} waiting to sync.`}
      </span>
    </div>
  );
}
