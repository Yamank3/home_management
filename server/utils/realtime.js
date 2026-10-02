// In-memory hub of open event streams, keyed by household. Single-process only:
// running more than one server instance would need a shared bus (e.g. Redis).

// Which screens' data a write to each API area can change. Writes in one area
// ripple into others (ticking a grocery adds inventory; cooking uses stock).
const AFFECTS = {
  groceries: ['groceries', 'inventory'],
  inventory: ['inventory'],
  bills: ['bills'],
  chores: ['chores'],
  meals: ['meals', 'groceries', 'inventory'],
  voice: ['groceries', 'inventory', 'bills', 'chores', 'meals'],
};

const streams = new Map(); // householdId -> Set<res>

function subscribe(householdId, res) {
  if (!streams.has(householdId)) streams.set(householdId, new Set());
  streams.get(householdId).add(res);
  return () => {
    const set = streams.get(householdId);
    set?.delete(res);
    if (set?.size === 0) streams.delete(householdId);
  };
}

function publish(householdId, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of streams.get(householdId) ?? []) res.write(payload);
}

// Express middleware: after a successful write by an authenticated user, tell
// the rest of the household which areas changed. `origin` lets the sender's own
// device skip refetching what it just updated.
function announceWrites(req, res, next) {
  res.on('finish', () => {
    if (req.method === 'GET' || res.statusCode >= 400 || !req.householdId) return;
    const area = req.originalUrl.split('?')[0].split('/')[2]; // /api/<area>/...
    const modules = AFFECTS[area];
    if (modules) publish(req.householdId, 'change', { modules, origin: req.get('x-client-id') || null });
  });
  next();
}

module.exports = { subscribe, publish, announceWrites, AFFECTS };
