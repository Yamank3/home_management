import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  notificationsSupported, isEnabled, setEnabled, permissionState, requestPermission, notifyChanged,
} from '../notifications/native.js';

// On/off switch for the reminder notifications. Only exists in the native app.
export default function NotificationSettings() {
  const { user } = useAuth();
  const [on, setOn] = useState(() => isEnabled(user.id));
  const [permission, setPermission] = useState('granted');

  useEffect(() => {
    if (notificationsSupported) permissionState().then(setPermission);
  }, []);

  if (!notificationsSupported) return null;

  const toggle = async () => {
    const next = !on;
    setOn(next);
    setEnabled(user.id, next);
    if (next && permission !== 'granted') setPermission(await requestPermission());
    notifyChanged();
  };

  return (
    <div className="bg-surface rounded-2xl border border-gray-100 shadow-card p-5 mb-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BellRing size={15} className="text-gray-400" /> Reminder notifications
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            A notification at 9:00 for bills, chores, maintenance, warranties and low stock. They work without a connection.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={on}
          aria-label="Reminder notifications"
          onClick={toggle}
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-primary-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      {on && permission === 'denied' && (
        <p className="text-xs text-red-500 mt-3">
          Notifications are blocked for this app. Turn them on in Android Settings → Apps → Home Manager → Notifications.
        </p>
      )}
    </div>
  );
}
