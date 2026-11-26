// Estado compartido del Firebase falso, persistido en localStorage para sobrevivir recargas.
const KEY = '__fake_firebase__';
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
};
export const state = load() || { docs: {}, users: {}, currentUid: null };
export const persist = () => localStorage.setItem(KEY, JSON.stringify(state));
export const delay = () => new Promise((r) => setTimeout(r, 15));
export const fbError = (code, message = code) => Object.assign(new Error(message), { code });
