const express = require('express');
const { subscribe } = require('../utils/realtime');

const router = express.Router();
const HEARTBEAT_MS = 25000;

// GET /api/events — Server-Sent Events stream of household changes. Authenticated
// like any other request. It is closed when the access token expires so that
// reconnecting picks up a fresh token and re-checks membership.
router.get('/', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');

  const unsubscribe = subscribe(req.householdId, res);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);
  const expiry = setTimeout(() => res.end(), Math.max(req.user.exp * 1000 - Date.now(), 0));

  req.on('close', () => {
    clearInterval(heartbeat);
    clearTimeout(expiry);
    unsubscribe();
  });
});

module.exports = router;
