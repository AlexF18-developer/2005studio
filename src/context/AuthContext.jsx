import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { checkIsAdmin, ensureProfile } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadExtras = useCallback(async (u) => {
    if (!u) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    const [p, admin] = await Promise.all([
      ensureProfile(u).catch(() => null),
      checkIsAdmin(u.uid),
    ]);
    setProfile(p);
    setIsAdmin(admin);
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setLoading(true);
    setUser(u);
    await loadExtras(u);
    setLoading(false);
  }), [loadExtras]);

  const refresh = useCallback(() => loadExtras(auth.currentUser), [loadExtras]);

  const value = useMemo(() => ({ user, profile, isAdmin, loading, refresh }), [user, profile, isAdmin, loading, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
