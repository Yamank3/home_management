import test from 'node:test';
import assert from 'node:assert/strict';
import { toNotifications, notificationId, NOTIFY_HOUR } from './plan.js';

const entry = (key, fireOn, extra = {}) => ({ key, title: key, body: 'Due today', fireOn, link: '/bills', ...extra });
const NOW = new Date(2026, 9, 2, 10, 30); // 2 Oct 2026, 10:30 local

test('schedules at 9:00 local on the fire date and keeps the link', () => {
  const [n] = toNotifications([entry('bill:a:1', '2026-10-05')], NOW);
  assert.equal(n.schedule.at.getHours(), NOTIFY_HOUR);
  assert.equal(n.schedule.at.getDate(), 5);
  assert.equal(n.extra.link, '/bills');
  assert.equal(n.channelId, 'reminders');
});

test('skips times that have already passed (today after 9:00)', () => {
  assert.equal(toNotifications([entry('a', '2026-10-02')], NOW).length, 0);
  assert.equal(toNotifications([entry('a', '2026-10-02')], new Date(2026, 9, 2, 8, 0)).length, 1);
});

test('orders by time and caps the number scheduled', () => {
  const many = Array.from({ length: 100 }, (_, i) => entry(`k${i}`, `2026-11-${String((i % 28) + 1).padStart(2, '0')}`));
  const out = toNotifications(many, NOW);
  assert.equal(out.length, 60);
  assert.ok(out.every((n, i) => i === 0 || out[i - 1].schedule.at <= n.schedule.at));
});

test('ids are stable, distinct, and valid 31-bit integers', () => {
  assert.equal(notificationId('bill:a:2026-10-05:1'), notificationId('bill:a:2026-10-05:1'));
  assert.notEqual(notificationId('bill:a:2026-10-05:1'), notificationId('bill:a:2026-10-05:0'));
  for (const k of ['', 'x', 'chore:123:2026-10-05:0']) {
    const id = notificationId(k);
    assert.ok(Number.isInteger(id) && id >= 0 && id <= 0x7fffffff);
  }
});
