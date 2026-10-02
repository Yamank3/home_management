// Offline support: a per-user cache of the last successful GET responses, and an
// outbox of edits made while offline that replays when the network returns.
// Pure logic over localStorage so it can be unit-tested; api.js wires it in.

const key = (kind, owner) => `offline.v1.${kind}.${owner}`;

function readJson(k, fallback) {
  try { const raw = globalThis.localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function writeJson(k, value) {
  try { globalThis.localStorage.setItem(k, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
}

// The signed-in user's id, read from the refresh token (it outlives access tokens).
// Cache and outbox are keyed by it so users on one device never see each other's data.
export function ownerFromToken(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).userId ?? null; } catch { return null; }
}

// ── Read cache ──────────────────────────────────────────────────────────────

export const cacheGet = (owner, path) => readJson(key('cache', owner), {})[path];

export function cacheSet(owner, path, value) {
  const all = readJson(key('cache', owner), {});
  all[path] = value;
  writeJson(key('cache', owner), all);
}

export const cacheClear = (owner) => { try { globalThis.localStorage.removeItem(key('cache', owner)); } catch { /* ignore */ } };

// Applies fn to the element with this id in every cached list. fn returns the new
// element, or null to drop it. Returns the first updated element (or undefined).
function cachePatch(owner, id, fn) {
  const all = readJson(key('cache', owner), {});
  let first;
  for (const [path, value] of Object.entries(all)) {
    if (!Array.isArray(value) || !value.some((el) => el?.id === id)) continue;
    all[path] = value.flatMap((el) => {
      if (el?.id !== id) return [el];
      const next = fn(el);
      if (first === undefined && next) first = next;
      return next ? [next] : [];
    });
  }
  writeJson(key('cache', owner), all);
  return first;
}

function cacheAppend(owner, pathStartsWith, includes, item) {
  const all = readJson(key('cache', owner), {});
  for (const [path, value] of Object.entries(all)) {
    if (Array.isArray(value) && path.startsWith(pathStartsWith) && path.includes(includes)) all[path] = [...value, item];
  }
  writeJson(key('cache', owner), all);
}

// ── Outbox ──────────────────────────────────────────────────────────────────

const readBox = (owner) => readJson(key('outbox', owner), { ops: [], idMap: {} });
const writeBox = (owner, box) => writeJson(key('outbox', owner), box);

export const pendingCount = (owner) => readBox(owner).ops.length;

// Only edits whose result we can reproduce locally are queued: grocery items,
// bill updates/deletes, chore completion/deletion. Everything else fails while offline.
const RULES = [
  { method: 'POST', re: /^\/groceries\/items$/, kind: 'create' },
  { method: 'PATCH', re: /^\/(?:groceries\/items|bills)\/(?<id>[^/?]+)$/, kind: 'patch' },
  { method: 'DELETE', re: /^\/(?:groceries\/items|bills|chores)\/(?<id>[^/?]+)$/, kind: 'remove' },
  { method: 'POST', re: /^\/chores\/(?<id>[^/?]+)\/complete$/, kind: 'complete' },
];

const tmpId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

// Records an edit made while offline, applies it to the cached lists, and returns
// the response the server would have given ({ result }), or null if this kind of
// edit can't be queued.
export function queueOffline(owner, method, path, body, now = new Date()) {
  const rule = RULES.find((r) => r.method === method && r.re.test(path));
  if (!rule) return null;
  const id = rule.re.exec(path).groups?.id;
  let result;
  let op = { method, path, body, attempts: 0 };

  if (rule.kind === 'create') {
    const temp = tmpId();
    result = {
      id: temp, bought: false, category: 'other', quantity: '', note: '',
      monthlyFrequency: null, shelfLifeDays: null, createdAt: now.toISOString(), ...body,
    };
    cacheAppend(owner, '/groceries/items', `listId=${body.listId}`, result);
    op = { ...op, tmpId: temp };
  } else if (rule.kind === 'remove') {
    cachePatch(owner, id, () => null);
    result = null;
  } else {
    const patch = rule.kind === 'complete' ? { lastCompletedAt: now.toISOString() } : body;
    result = cachePatch(owner, id, (el) => ({ ...el, ...patch }));
    if (result === undefined) return null; // not in the cache: can't show a faithful result
  }

  const box = readBox(owner);
  box.ops.push(op);
  writeBox(owner, box);
  return { result };
}

// Replaces temporary ids with the real ones the server assigned to created items.
function rewrite(op, idMap) {
  let text = JSON.stringify(op);
  for (const [temp, real] of Object.entries(idMap)) text = text.replaceAll(temp, real);
  return JSON.parse(text);
}

const MAX_ATTEMPTS = 5;

// Sends queued edits in order through `perform(method, path, body)`. Stops (keeping
// the rest) when still offline, unauthenticated or the server is failing; drops an
// edit the server rejects (deleted by someone else, invalid) and reports it.
export async function flush(owner, perform) {
  const sent = [];
  const failed = [];
  for (;;) {
    const box = readBox(owner);
    if (!box.ops.length) break;
    const op = rewrite(box.ops[0], box.idMap);
    try {
      const data = await perform(op.method, op.path, op.body);
      if (op.tmpId && data?.id) box.idMap[op.tmpId] = data.id;
      box.ops.shift();
      writeBox(owner, box);
      sent.push(op);
    } catch (e) {
      if (e.offline || e.status === 401) break;
      if (e.status >= 500 && box.ops[0].attempts + 1 < MAX_ATTEMPTS) {
        box.ops[0].attempts += 1;
        writeBox(owner, box);
        break;
      }
      box.ops.shift();
      writeBox(owner, box);
      failed.push({ op, message: e.message });
    }
  }
  const box = readBox(owner);
  if (!box.ops.length && Object.keys(box.idMap).length) writeBox(owner, { ops: [], idMap: {} });
  return { sent, failed, remaining: readBox(owner).ops.length };
}
