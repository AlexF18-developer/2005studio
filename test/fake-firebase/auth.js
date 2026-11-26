import { state, persist, delay, fbError } from './store';

const listeners = new Set();
const toUser = (rec) => rec && ({
  uid: rec.uid, email: rec.email, displayName: rec.displayName || null,
  metadata: { creationTime: new Date(rec.createdAt).toUTCString() },
  getIdToken: async () => 'fake-token',
});
const auth = { currentUser: toUser(state.users[state.currentUid]) };
const emit = () => {
  auth.currentUser = toUser(state.users[state.currentUid]);
  persist();
  listeners.forEach((cb) => cb(auth.currentUser));
};

export const getAuth = () => auth;
export const onAuthStateChanged = (_a, cb) => {
  listeners.add(cb);
  setTimeout(() => cb(auth.currentUser), 0);
  return () => listeners.delete(cb);
};
export const createUserWithEmailAndPassword = async (_a, email, password) => {
  await delay();
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw fbError('auth/invalid-email');
  if (password.length < 6) throw fbError('auth/weak-password');
  if (Object.values(state.users).some((u) => u.email === e)) throw fbError('auth/email-already-in-use');
  const uid = `uid_${Math.random().toString(36).slice(2, 12)}`;
  state.users[uid] = { uid, email: e, password, displayName: null, createdAt: Date.now() };
  state.currentUid = uid;
  emit();
  return { user: auth.currentUser };
};
export const signInWithEmailAndPassword = async (_a, email, password) => {
  await delay();
  const rec = Object.values(state.users).find((u) => u.email === email.trim().toLowerCase());
  if (!rec || rec.password !== password) throw fbError('auth/invalid-credential');
  state.currentUid = rec.uid;
  emit();
  return { user: auth.currentUser };
};
export const signOut = async () => { state.currentUid = null; emit(); };
export const updateProfile = async (user, { displayName }) => {
  state.users[user.uid].displayName = displayName;
  persist();
  if (auth.currentUser?.uid === user.uid) auth.currentUser.displayName = displayName;
  user.displayName = displayName;
};
export const sendPasswordResetEmail = async () => { await delay(); };

// Google simulado: crea (o reutiliza) una cuenta de Gmail de prueba.
export class GoogleAuthProvider { setCustomParameters() {} }
export const signInWithPopup = async () => {
  await delay();
  const email = 'cliente.google@gmail.com';
  let rec = Object.values(state.users).find((u) => u.email === email);
  if (!rec) {
    const uid = `uid_g_${Math.random().toString(36).slice(2, 10)}`;
    rec = state.users[uid] = { uid, email, password: null, displayName: 'Cliente Google', createdAt: Date.now() - 60_000 };
  }
  state.currentUid = rec.uid;
  emit();
  return { user: auth.currentUser };
};
