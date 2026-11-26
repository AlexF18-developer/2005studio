import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { STORE, MAX_QTY_PER_ITEM } from '../config/store';
import { unitPriceCents } from '../lib/format';
import { newOrderCode, ORDER_CODE } from '../lib/slug';
import { canTransition, statusLabel } from '../lib/orderStatus';
import { getProductsFresh, invalidateCatalog, totalStock } from './catalog';

const withId = (snap) => ({ id: snap.id, ...snap.data() });

/**
 * Revisa el carrito contra los productos actuales: precios vigentes, existencia y stock por talla.
 * Devuelve líneas válidas + avisos para el cliente.
 */
export const priceCart = async (cartItems) => {
  const products = await getProductsFresh(cartItems.map((i) => i.productId));
  const lines = [];
  const warnings = [];

  for (const item of cartItems) {
    const p = products.get(item.productId);
    if (!p || !p.active) {
      warnings.push(`"${item.name}" ya no está disponible y se retiró del carrito.`);
      continue;
    }
    const available = Number(p.stock?.[item.size] ?? 0);
    if (available <= 0) {
      warnings.push(`"${p.name}" talla ${item.size} se agotó y se retiró del carrito.`);
      continue;
    }
    const qty = Math.min(item.qty, available, MAX_QTY_PER_ITEM);
    if (qty < item.qty) warnings.push(`Solo hay ${available} unidad(es) de "${p.name}" talla ${item.size}. Ajustamos la cantidad.`);
    lines.push({
      key: item.key,
      productId: p.id,
      name: p.name,
      image: p.images?.[0] || '',
      size: item.size,
      color: item.color || null,
      priceCents: unitPriceCents(p),
      qty,
      available,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.priceCents * l.qty, 0);
  return { lines, warnings, subtotalCents };
};

const clean = (v, max) => (v ?? '').toString().trim().slice(0, max);

/** Crea el pedido. Los precios se recalculan siempre desde Firestore (nunca se confía en el carrito). */
export const createOrder = async ({ cartItems, form, user }) => {
  const { lines, warnings, subtotalCents } = await priceCart(cartItems);
  if (warnings.length) {
    const err = new Error(`Tu carrito cambió: ${warnings.join(' ')} Revisa el resumen y confirma otra vez.`);
    err.code = 'cart-changed';
    throw err;
  }
  if (!lines.length) throw new Error('Tu carrito está vacío.');
  if (!STORE.delivery.districts.includes(form.district)) throw new Error('Selecciona un distrito válido.');

  const costCents = STORE.delivery.costCents;
  const now = Date.now();
  const order = {
    code: '',
    userId: user?.uid ?? null,
    customer: {
      name: clean(form.name, 100),
      email: clean(form.email, 150).toLowerCase(),
      phone: clean(form.phone, 20),
    },
    shipping: {
      district: form.district,
      address: clean(form.address, 200),
      reference: clean(form.reference, 200) || null,
      costCents,
    },
    notes: clean(form.notes, 500) || null,
    items: lines.map(({ productId, name, image, size, color, priceCents, qty }) => ({
      productId, name, image, size, color, priceCents, qty,
    })),
    itemsCount: lines.reduce((s, l) => s + l.qty, 0),
    subtotalCents,
    totalCents: subtotalCents + costCents,
    paymentMethod: form.paymentMethod,
    operationNumber: null,
    status: 'pendiente',
    history: [{ status: 'pendiente', at: now, note: 'Pedido registrado desde la web.' }],
    stockApplied: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Reintenta en el improbable caso de colisión de código (setDoc sobre existente = update → rechazado por reglas).
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newOrderCode();
    try {
      await setDoc(doc(db, 'orders', code), { ...order, code });
      return code;
    } catch (e) {
      if (e?.code !== 'permission-denied' || attempt === 3) throw e;
      const exists = await getDoc(doc(db, 'orders', code));
      if (!exists.exists()) throw e;
    }
  }
  throw new Error('No se pudo generar el código del pedido.');
};

export const getOrder = async (code) => {
  if (!ORDER_CODE.test(code || '')) return null;
  const snap = await getDoc(doc(db, 'orders', code));
  return snap.exists() ? withId(snap) : null;
};

export const trackOrder = async (code, email) => {
  const order = await getOrder(code.trim().toUpperCase());
  if (!order || order.customer.email !== email.trim().toLowerCase()) return null;
  return order;
};

export const reportPayment = async (order, operationNumber) => {
  const op = operationNumber.trim();
  if (!/^[A-Za-z0-9]{4,30}$/.test(op)) throw new Error('Ingresa un número de operación válido (4 a 30 letras o números).');
  if (order.status !== 'pendiente') throw new Error('Este pedido ya no está pendiente de pago.');
  await updateDoc(doc(db, 'orders', order.code), {
    operationNumber: op,
    status: 'verificando',
    history: [...order.history, { status: 'verificando', at: Date.now(), note: `Cliente registró la operación N° ${op}.` }],
    updatedAt: serverTimestamp(),
  });
};

export const listMyOrders = async (uid) => {
  const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', uid)));
  return snap.docs.map(withId).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
};

export const listAllOrders = async (max = 500) => {
  const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map(withId);
};

/**
 * Cambia el estado de un pedido (solo admin). Al CONFIRMAR descuenta el stock por talla;
 * al CANCELAR un pedido que ya lo había descontado, lo devuelve. Todo en una transacción.
 */
export const changeOrderStatus = async (code, newStatus, note) => {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', code);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Pedido no encontrado.');
    const order = orderSnap.data();

    if (!canTransition(order.status, newStatus)) {
      throw new Error(`No se puede pasar de "${statusLabel(order.status)}" a "${statusLabel(newStatus)}".`);
    }

    const applyStock = newStatus === 'confirmado' && !order.stockApplied;
    const restoreStock = newStatus === 'cancelado' && order.stockApplied;

    // Lecturas primero (requisito de las transacciones de Firestore).
    const productIds = [...new Set(order.items.map((i) => i.productId))];
    const productSnaps = applyStock || restoreStock
      ? await Promise.all(productIds.map((id) => tx.get(doc(db, 'products', id))))
      : [];
    const products = new Map(productSnaps.filter((s) => s.exists()).map((s) => [s.id, s.data()]));

    if (applyStock || restoreStock) {
      const sign = applyStock ? -1 : 1;
      const updated = new Map();
      for (const item of order.items) {
        const p = updated.get(item.productId) ?? (products.get(item.productId) && {
          stock: { ...(products.get(item.productId).stock || {}) },
          soldCount: products.get(item.productId).soldCount || 0,
        });
        if (!p) {
          if (applyStock) throw new Error(`"${item.name}" ya no existe en el catálogo.`);
          continue;
        }
        const current = Number(p.stock[item.size] ?? 0);
        if (applyStock && current < item.qty) {
          throw new Error(`Stock insuficiente de "${item.name}" talla ${item.size} (quedan ${current}).`);
        }
        p.stock[item.size] = current + sign * item.qty;
        p.soldCount = Math.max(0, p.soldCount - sign * item.qty);
        updated.set(item.productId, p);
      }
      updated.forEach((p, id) => {
        tx.update(doc(db, 'products', id), {
          stock: p.stock, totalStock: totalStock(p.stock), soldCount: p.soldCount, updatedAt: serverTimestamp(),
        });
      });
    }

    tx.update(orderRef, {
      status: newStatus,
      stockApplied: applyStock ? true : restoreStock ? false : order.stockApplied,
      history: [...order.history, { status: newStatus, at: Date.now(), note: (note || '').trim().slice(0, 300) || null }],
      updatedAt: serverTimestamp(),
    });
  });
  invalidateCatalog();
};
