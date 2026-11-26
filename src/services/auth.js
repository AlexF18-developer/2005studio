import {
  createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile,
} from 'firebase/auth';
import {
  collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, where, query, writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export const register = async ({ name, email, password, phone }) => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  const ref = doc(db, 'users', cred.user.uid);
  try {
    await setDoc(ref, { name: name.trim(), email: cred.user.email, phone: phone?.trim() || null, createdAt: serverTimestamp() });
  } catch (e) {
    // El perfil pudo crearse en paralelo (ensureProfile): solo actualizamos nombre y celular.
    if (e?.code !== 'permission-denied') throw e;
    await updateDoc(ref, { name: name.trim(), phone: phone?.trim() || null });
  }
  return cred.user;
};

export const login = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);

/** Ingreso con cuenta de Google (el perfil en Firestore lo crea ensureProfile al iniciar sesión). */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
};

export const logout = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

export const getProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });

/** Crea el perfil si falta (p. ej. usuarios creados desde la consola de Firebase). */
export const ensureProfile = async (user) => {
  let existing = await getProfile(user.uid);
  if (existing) return existing;
  // Recién registrado: register() está creando el perfil; damos tiempo antes de crearlo nosotros.
  const createdAt = Date.parse(user.metadata?.creationTime || '') || 0;
  if (Date.now() - createdAt < 15_000) {
    await wait(2000);
    existing = await getProfile(user.uid);
    if (existing) return existing;
  }
  const profile = {
    name: (user.displayName || user.email.split('@')[0]).slice(0, 80).padEnd(2, '_'),
    email: user.email,
    phone: null,
    createdAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'users', user.uid), profile);
  } catch (e) {
    if (e?.code === 'permission-denied') return getProfile(user.uid); // ya lo creó register()
    throw e;
  }
  return { id: user.uid, ...profile };
};

export const updateMyProfile = async (user, { name, phone }) => {
  await updateDoc(doc(db, 'users', user.uid), { name: name.trim(), phone: phone?.trim() || null });
  await updateProfile(user, { displayName: name.trim() });
};

// ---------------- Administradores ----------------

export const checkIsAdmin = async (uid) => {
  try {
    return (await getDoc(doc(db, 'admins', uid))).exists();
  } catch {
    return false;
  }
};

export const getSetupState = async () => {
  const snap = await getDoc(doc(db, 'meta', 'setup'));
  return snap.exists() ? snap.data() : null;
};

/** Convierte al usuario actual en el PRIMER administrador (solo funciona una vez; lo garantizan las reglas). */
export const claimFirstAdmin = async (user) => {
  const batch = writeBatch(db);
  batch.set(doc(db, 'admins', user.uid), { email: user.email, createdAt: serverTimestamp() });
  batch.set(doc(db, 'meta', 'setup'), { adminUid: user.uid, createdAt: serverTimestamp() });
  await batch.commit();
};

export const listAdmins = async () => {
  const snap = await getDocs(collection(db, 'admins'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addAdminByEmail = async (email) => {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase())));
  if (snap.empty) throw new Error('No hay una cuenta registrada con ese correo. Pídele que se registre primero.');
  const target = snap.docs[0];
  await setDoc(doc(db, 'admins', target.id), { email: target.data().email, createdAt: serverTimestamp() });
};

export const removeAdmin = (uid) => deleteDoc(doc(db, 'admins', uid));

export const listUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
