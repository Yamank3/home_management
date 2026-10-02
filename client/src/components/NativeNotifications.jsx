import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { remindersApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLiveSync, ALL_MODULES } from '../context/LiveSyncContext.jsx';
import {
  notificationsSupported, isEnabled, wasAsked, markAsked, permissionState, requestPermission,
  applySchedule, cancelAll, onNotificationTap, onNotificationSettingsChanged,
} from '../notifications/native.js';

const DEBOUNCE_MS = 1500;

// Keeps the phone's scheduled reminders in step with the household's data: on start,
// when data changes, when the app comes back to the front, and when the setting
// changes. Renders nothing; does nothing on the web.
export default function NativeNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const timer = useRef(null);

  const sync = useCallback(async () => {
    if (!isEnabled(user.id)) { await cancelAll(); return; }
    let permission = await permissionState();
    if (permission === 'prompt' && !wasAsked(user.id)) {
      markAsked(user.id);
      permission = await requestPermission();
    }
    if (permission !== 'granted') return;
    try {
      await applySchedule(await remindersApi.getSchedule());
    } catch { /* offline with nothing saved: keep what is already scheduled */ }
  }, [user.id]);

  const syncSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(sync, DEBOUNCE_MS);
  }, [sync]);

  useEffect(() => {
    if (!notificationsSupported) return;
    syncSoon();
    const onVisible = () => { if (document.visibilityState === 'visible') syncSoon(); };
    document.addEventListener('visibilitychange', onVisible);
    const offSettings = onNotificationSettingsChanged(syncSoon);
    const offTap = onNotificationTap(navigate);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
      offSettings();
      offTap();
    };
  }, [syncSoon, navigate]);

  useLiveSync(ALL_MODULES, () => { if (notificationsSupported) syncSoon(); });
  return null;
}
