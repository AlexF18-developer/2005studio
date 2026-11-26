import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuración de Firebase. Los valores vienen del archivo .env (ver .env.example).
 * Esta configuración web es pública por diseño: la seguridad real la dan firestore.rules.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const PLACEHOLDER = /^(tu-|000|1:000)/;

/** true cuando .env todavía no tiene los valores reales. */
export const firebaseNotConfigured = Object.values(firebaseConfig).some(
  (v) => !v || PLACEHOLDER.test(String(v)),
);

// Sin .env, getAuth() lanza "auth/invalid-api-key" y la página quedaría en blanco.
// Con valores de respaldo la tienda carga y muestra el aviso de configuración.
const safeConfig = firebaseNotConfigured
  ? { ...firebaseConfig, apiKey: 'not-configured', projectId: firebaseConfig.projectId || 'not-configured', appId: firebaseConfig.appId || '1:0:web:0' }
  : firebaseConfig;

export const app = initializeApp(safeConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
