// Firestore falso en memoria con una réplica de firestore.rules (solo para pruebas E2E).
import { state, persist, delay, fbError } from './store';

export class Timestamp {
  constructor(ms) { this.ms = ms; this.seconds = Math.floor(ms / 1000); this.nanoseconds = 0; }
  toDate() { return new Date(this.ms); }
  toMillis() { return this.ms; }
}
const SERVER_TS = { __serverTimestamp: true };
export const serverTimestamp = () => SERVER_TS;

// ---------- serialización ----------
const ser = (v) => {
  if (v instanceof Timestamp) return { __ts: v.ms };
  if (Array.isArray(v)) return v.map(ser);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x)]));
  return v;
};
const de = (v) => {
  if (v && typeof v === 'object' && '__ts' in v) return new Timestamp(v.__ts);
  if (Array.isArray(v)) return v.map(de);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, de(x)]));
  return v;
};
const resolveTs = (v, now) => {
  if (v === SERVER_TS) return new Timestamp(now);
  if (Array.isArray(v)) return v.map((x) => resolveTs(x, now));
  if (v && typeof v === 'object' && !(v instanceof Timestamp)) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveTs(x, now)]));
  }
  return v;
};
const assertNoUndefined = (v, path = '') => {
  if (v === undefined) throw fbError('invalid-argument', `Unsupported field value: undefined (${path})`);
  if (v && typeof v === 'object' && v !== SERVER_TS && !(v instanceof Timestamp)) {
    Object.entries(v).forEach(([k, x]) => assertNoUndefined(x, `${path}.${k}`));
  }
};

// ---------- referencias ----------
export const getFirestore = () => ({ type: 'fake-firestore' });
export const collection = (_db, name) => ({ type: 'collection', path: name });
export const doc = (a, col, id) => {
  if (a?.type === 'collection') return { type: 'doc', col: a.path, id: Math.random().toString(36).slice(2, 22), get path() { return `${this.col}/${this.id}`; } };
  return { type: 'doc', col, id, path: `${col}/${id}` };
};
export const where = (field, op, value) => ({ kind: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir });
export const limit = (n) => ({ kind: 'limit', n });
export const query = (ref, ...constraints) => ({ type: 'query', path: ref.path, constraints });

const read = (path, docs = state.docs) => (docs[path] ? de(docs[path]) : null);
const snap = (ref, data) => ({ id: ref.id, ref, exists: () => data != null, data: () => (data == null ? undefined : data) });

// ---------- réplica de las reglas ----------
const auth = () => (state.currentUid ? state.users[state.currentUid] : null);
const isAdmin = (docs = state.docs) => !!auth() && !!docs[`admins/${auth().uid}`];
const str = (v, min, max) => typeof v === 'string' && v.length >= min && v.length <= max;
const optStr = (v, max) => v == null || (typeof v === 'string' && v.length <= max);
const isInt = (v) => Number.isInteger(v);
const keysOnly = (o, allowed) => Object.keys(o).every((k) => allowed.includes(k));
const changedKeys = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter((k) => JSON.stringify(ser(a[k])) !== JSON.stringify(ser(b[k])));
const isServerTs = (raw) => raw === SERVER_TS;

const validNewOrder = (id, d, raw) => {
  const ok = keysOnly(d, ['code', 'userId', 'customer', 'shipping', 'notes', 'items', 'itemsCount', 'subtotalCents',
    'totalCents', 'paymentMethod', 'operationNumber', 'status', 'history', 'stockApplied', 'createdAt', 'updatedAt'])
    && ['code', 'userId', 'customer', 'shipping', 'items', 'itemsCount', 'subtotalCents', 'totalCents', 'paymentMethod',
      'status', 'history', 'stockApplied', 'createdAt', 'updatedAt'].every((k) => k in d)
    && d.code === id && /^2005-[A-Z0-9]{8}$/.test(id)
    && (d.userId == null || (auth() && d.userId === auth().uid))
    && keysOnly(d.customer, ['name', 'email', 'phone'])
    && str(d.customer.name, 2, 100) && str(d.customer.email, 5, 150) && str(d.customer.phone, 9, 20)
    && keysOnly(d.shipping, ['district', 'address', 'reference', 'costCents'])
    && str(d.shipping.district, 2, 60) && str(d.shipping.address, 5, 200) && optStr(d.shipping.reference, 200)
    && isInt(d.shipping.costCents) && d.shipping.costCents >= 0
    && optStr(d.notes ?? null, 500)
    && Array.isArray(d.items) && d.items.length >= 1 && d.items.length <= 30
    && isInt(d.itemsCount) && d.itemsCount >= 1 && d.itemsCount <= 300
    && isInt(d.subtotalCents) && d.subtotalCents > 0 && isInt(d.totalCents)
    && d.totalCents === d.subtotalCents + d.shipping.costCents
    && ['yape', 'plin', 'transferencia', 'contraentrega'].includes(d.paymentMethod)
    && (d.operationNumber ?? null) === null && d.status === 'pendiente' && d.stockApplied === false
    && Array.isArray(d.history) && d.history.length === 1
    && isServerTs(raw.createdAt) && isServerTs(raw.updatedAt);
  if (!ok) console.warn('[fake-rules] pedido inválido', d);
  return ok;
};
const validPaymentReport = (before, after, raw) => before.status === 'pendiente'
  && before.paymentMethod !== 'contraentrega'
  && keysOnly(Object.fromEntries(changedKeys(before, after).map((k) => [k, 1])), ['operationNumber', 'status', 'history', 'updatedAt'])
  && after.status === 'verificando' && str(after.operationNumber, 4, 30)
  && Array.isArray(after.history) && after.history.length === before.history.length + 1
  && isServerTs(raw.updatedAt);

/** Evalúa una escritura. before/after = datos; raw = datos sin resolver timestamps; afterDocs = estado tras el lote. */
const canWrite = (op, ref, before, after, raw, beforeDocs, afterDocs) => {
  const u = auth();
  const admin = isAdmin(beforeDocs);
  switch (ref.col) {
    case 'categories': case 'sizes': case 'products': return admin;
    case 'users':
      if (op === 'delete' || !u || u.uid !== ref.id) return false;
      if (!before) {
        return keysOnly(after, ['name', 'email', 'phone', 'createdAt']) && str(after.name, 2, 80)
          && after.email === u.email && optStr(after.phone, 20) && isServerTs(raw.createdAt);
      }
      return keysOnly(Object.fromEntries(changedKeys(before, after).map((k) => [k, 1])), ['name', 'phone'])
        && str(after.name, 2, 80) && optStr(after.phone, 20);
    case 'admins':
      if (op === 'delete') return admin && ref.id !== u?.uid;
      if (before) return false;
      return admin || (!!u && u.uid === ref.id && !beforeDocs['meta/setup'] && afterDocs['meta/setup']?.adminUid === ref.id);
    case 'meta':
      if (ref.id !== 'setup' || before || op === 'delete') return false;
      return !!u && keysOnly(after, ['adminUid', 'createdAt']) && after.adminUid === u.uid
        && isServerTs(raw.createdAt) && !!afterDocs[`admins/${u.uid}`];
    case 'orders':
      if (op === 'delete') return admin;
      if (!before) return validNewOrder(ref.id, after, raw);
      return admin || validPaymentReport(before, after, raw);
    default: return false;
  }
};
const canGet = (ref, data) => {
  const u = auth();
  switch (ref.col) {
    case 'products': return data == null || data.active === true || isAdmin();
    case 'users': case 'admins': return !!u && (u.uid === ref.id || isAdmin());
    case 'categories': case 'sizes': case 'meta': case 'orders': return true;
    default: return false;
  }
};
const canList = (path, constraints) => {
  const u = auth();
  const eq = (f, v) => constraints.some((c) => c.kind === 'where' && c.field === f && c.op === '==' && c.value === v);
  switch (path) {
    case 'categories': case 'sizes': return true;
    case 'products': return isAdmin() || eq('active', true);
    case 'users': case 'admins': return isAdmin();
    case 'orders': return isAdmin() || (!!u && eq('userId', u.uid));
    default: return false;
  }
};
const deny = () => fbError('permission-denied', 'Missing or insufficient permissions.');

// ---------- lecturas ----------
export const getDoc = async (ref) => {
  await delay();
  const data = read(ref.path);
  if (!canGet(ref, data)) throw deny();
  return snap(ref, data);
};
export const getDocs = async (q) => {
  await delay();
  const constraints = q.constraints || [];
  if (!canList(q.path, constraints)) throw deny();
  let rows = Object.keys(state.docs)
    .filter((p) => p.startsWith(`${q.path}/`) && p.split('/').length === 2)
    .map((p) => ({ ref: doc(null, q.path, p.split('/')[1]), data: read(p) }));
  constraints.filter((c) => c.kind === 'where').forEach((c) => {
    if (c.op !== '==') throw new Error(`fake: operador ${c.op} no soportado`);
    rows = rows.filter((r) => r.data[c.field] === c.value);
  });
  const ob = constraints.find((c) => c.kind === 'orderBy');
  if (ob) {
    const val = (r) => { const v = r.data[ob.field]; return v instanceof Timestamp ? v.ms : v; };
    rows = rows.filter((r) => r.data[ob.field] !== undefined);
    rows.sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * (ob.dir === 'desc' ? -1 : 1));
  }
  const lim = constraints.find((c) => c.kind === 'limit');
  if (lim) rows = rows.slice(0, lim.n);
  const docs = rows.map((r) => snap(r.ref, r.data));
  return { docs, empty: !docs.length, size: docs.length, forEach: (fn) => docs.forEach(fn) };
};

// ---------- escrituras (todas pasan por un lote atómico) ----------
const commitOps = (ops) => {
  const now = Date.now();
  const beforeDocs = state.docs;
  const afterDocs = { ...state.docs };
  const checks = [];
  ops.forEach(({ op, ref, data, merge }) => {
    if (data) assertNoUndefined(data);
    const prev = afterDocs[ref.path] ? de(afterDocs[ref.path]) : null;
    if (op === 'update' && !prev) throw fbError('not-found', `No document to update: ${ref.path}`);
    let next = null;
    if (op === 'set') next = merge && prev ? { ...prev, ...resolveTs(data, now) } : resolveTs(data, now);
    if (op === 'update') next = { ...prev, ...resolveTs(data, now) };
    const raw = op === 'delete' ? {} : (merge || op === 'update') ? { ...(prev || {}), ...data } : data;
    if (next) afterDocs[ref.path] = ser(next); else delete afterDocs[ref.path];
    checks.push({ op: op === 'delete' ? 'delete' : prev ? 'update' : 'create', ref, before: prev, after: next, raw });
  });
  const plainAfter = Object.fromEntries(Object.entries(afterDocs).map(([k, v]) => [k, de(v)]));
  const plainBefore = Object.fromEntries(Object.entries(beforeDocs).map(([k, v]) => [k, de(v)]));
  for (const c of checks) {
    if (!canWrite(c.op, c.ref, c.before, c.after, c.raw, plainBefore, plainAfter)) {
      console.warn('[fake-rules] denegado', c.op, c.ref.path);
      throw deny();
    }
  }
  state.docs = afterDocs;
  persist();
};

export const setDoc = async (ref, data, opts = {}) => { await delay(); commitOps([{ op: 'set', ref, data, merge: !!opts.merge }]); };
export const updateDoc = async (ref, data) => { await delay(); commitOps([{ op: 'update', ref, data }]); };
export const deleteDoc = async (ref) => { await delay(); commitOps([{ op: 'delete', ref }]); };
export const writeBatch = () => {
  const ops = [];
  return {
    set(ref, data, opts = {}) { ops.push({ op: 'set', ref, data, merge: !!opts.merge }); return this; },
    update(ref, data) { ops.push({ op: 'update', ref, data }); return this; },
    delete(ref) { ops.push({ op: 'delete', ref }); return this; },
    async commit() { await delay(); commitOps(ops); },
  };
};
export const runTransaction = async (_db, fn) => {
  const ops = [];
  let wrote = false;
  const tx = {
    async get(ref) {
      if (wrote) throw new Error('Firestore transactions require all reads to be executed before all writes.');
      return getDoc(ref);
    },
    set(ref, data, opts = {}) { wrote = true; ops.push({ op: 'set', ref, data, merge: !!opts.merge }); return tx; },
    update(ref, data) { wrote = true; ops.push({ op: 'update', ref, data }); return tx; },
    delete(ref) { wrote = true; ops.push({ op: 'delete', ref }); return tx; },
  };
  const result = await fn(tx);
  commitOps(ops);
  return result;
};
