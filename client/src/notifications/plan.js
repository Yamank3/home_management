// Turns the server's notification schedule into device notifications. Pure, so it
// can be tested without a phone.

export const NOTIFY_HOUR = 9; // local time each reminder is shown
export const CHANNEL_ID = 'reminders';
const MAX_SCHEDULED = 60; // keep well under Android's limit on pending alarms

// Stable positive 31-bit id for a key (FNV-1a), so a reminder keeps one slot
// across re-syncs and re-scheduling replaces rather than duplicates it.
export function notificationId(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return (h >>> 0) & 0x7fffffff;
}

// entries: [{ key, title, body, fireOn: 'YYYY-MM-DD', link }] from GET /reminders/schedule.
export function toNotifications(entries, now = new Date(), hour = NOTIFY_HOUR) {
  return entries
    .map((e) => {
      const [y, m, d] = e.fireOn.split('-').map(Number);
      return { e, at: new Date(y, m - 1, d, hour, 0, 0) }; // local time
    })
    .filter(({ at }) => at > now)
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_SCHEDULED)
    .map(({ e, at }) => ({
      id: notificationId(e.key),
      title: e.title,
      body: e.body,
      schedule: { at, allowWhileIdle: true },
      channelId: CHANNEL_ID,
      smallIcon: 'ic_stat_home',
      iconColor: '#4F46E5',
      extra: { link: e.link },
    }));
}
