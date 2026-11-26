import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, writeJSON } from '../lib/storage';

const KEY = '2005studio:favorites:v1';
const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(() => {
    const saved = readJSON(KEY, []);
    return Array.isArray(saved) ? saved.filter((x) => typeof x === 'string').slice(0, 200) : [];
  });

  const idsRef = useRef(ids);
  idsRef.current = ids;

  useEffect(() => writeJSON(KEY, ids), [ids]);

  /** Devuelve true si quedó como favorito. */
  const toggle = useCallback((id) => {
    const prev = idsRef.current;
    const added = !prev.includes(id);
    const next = added ? [id, ...prev] : prev.filter((x) => x !== id);
    idsRef.current = next;
    setIds(next);
    return added;
  }, []);

  const value = useMemo(() => ({
    ids,
    count: ids.length,
    has: (id) => ids.includes(id),
    toggle,
  }), [ids, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
