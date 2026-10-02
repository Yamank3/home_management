import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CHANNEL_ID, toNotifications } from './plan.js';

// Reminder notifications are scheduled on the device itself, so they fire on time
// with no connection and no push service. They only exist in the native app.
export const notificationsSupported = Capacitor.isNativePlatform();

const NOTIFICATIONS_CHANGED = 'notifications:changed';
export const notifyChanged = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
export const onNotificationSettingsChanged = (fn) => {
  window.addEventListener(NOTIFICATIONS_CHANGED, fn);
  return () => window.removeEventListener(NOTIFICATIONS_CHANGED, fn);
};

// Per-user on/off switch (on by default) and "have we asked for permission yet".
const flag = (name, userId) => `notifications.${name}.${userId}`;
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export const isEnabled = (userId) => read(flag('enabled', userId)) !== 'false';
export const setEnabled = (userId, on) => write(flag('enabled', userId), String(on));
export const wasAsked = (userId) => read(flag('asked', userId)) === 'true';
export const markAsked = (userId) => write(flag('asked', userId), 'true');

// 'granted' | 'denied' | 'prompt'
export async function permissionState() {
  const { display } = await LocalNotifications.checkPermissions();
  return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
}

export async function requestPermission() {
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted' ? 'granted' : 'denied';
}

export async function cancelAll() {
  if (!notificationsSupported) return;
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length) await LocalNotifications.cancel({ notifications });
}

// Replaces everything scheduled with the current schedule from the server.
export async function applySchedule(entries) {
  await LocalNotifications.createChannel({
    id: CHANNEL_ID, name: 'Reminders', description: 'Bills, chores, maintenance and low stock', importance: 4,
  });
  const planned = toNotifications(entries);
  await cancelAll();
  if (planned.length) await LocalNotifications.schedule({ notifications: planned });
}

// Calls back with the link of the notification the user tapped.
export function onNotificationTap(fn) {
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const link = event.notification?.extra?.link;
    if (link) fn(link);
  });
  return () => { handle.then((h) => h.remove()); };
}
