import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import { unitPriceCents } from '../lib/format';
import { MAX_QTY_PER_ITEM } from '../config/store';

const KEY = '2005studio:cart:v1';
const MAX_LINES = 30;
const CartContext = createContext(null);

const loadCart = () => {
  const raw = readJSON(KEY, []);
  return Array.isArray(raw) ? raw.filter(isValidItem) : [];
};

const isValidItem = (i) =>
  i && typeof i.productId === 'string' && typeof i.size === 'string' && Number.isInteger(i.qty) && i.qty > 0;

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  // Ref con el valor vigente: permite devolver el resultado de add() de forma síncrona.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => writeJSON(KEY, items), [items]);

  // Sincroniza el carrito entre pestañas abiertas.
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setItems(loadCart()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /** Agrega al carrito respetando stock y límites. Devuelve { ok, qty } o { ok: false, reason }. */
  const add = useCallback((product, size, color, qty = 1) => {
    const prev = itemsRef.current;
    const available = Number(product.stock?.[size] ?? 0);
    const key = `${product.id}__${size}__${color || ''}`;
    const existing = prev.find((i) => i.key === key);
    const current = existing?.qty ?? 0;
    const target = Math.min(current + qty, available, MAX_QTY_PER_ITEM);
    if (target <= current) return { ok: false, reason: available <= current ? 'stock' : 'max' };
    if (!existing && prev.length >= MAX_LINES) return { ok: false, reason: 'lines' };

    const line = {
      key,
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || '',
      size,
      color: color || null,
      priceCents: unitPriceCents(product),
      qty: target,
    };
    const next = existing ? prev.map((i) => (i.key === key ? line : i)) : [...prev, line];
    itemsRef.current = next;
    setItems(next);
    return { ok: true, qty: target };
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((prev) => (qty <= 0
      ? prev.filter((i) => i.key !== key)
      : prev.map((i) => (i.key === key ? { ...i, qty: Math.min(qty, MAX_QTY_PER_ITEM) } : i))));
  }, []);

  const remove = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  /** Reemplaza el carrito por las líneas validadas contra Firestore (precios y stock reales). */
  const syncWith = useCallback((lines) => {
    setItems(lines.map(({ key, productId, name, image, size, color, priceCents, qty }) => ({
      key, productId, name, image, size, color, priceCents, qty,
    })));
  }, []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotalCents: items.reduce((s, i) => s + i.priceCents * i.qty, 0),
    add, setQty, remove, clear, syncWith,
  }), [items, add, setQty, remove, clear, syncWith]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
