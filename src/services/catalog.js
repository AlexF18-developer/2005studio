import {
  collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db, firebaseNotConfigured } from '../firebaseConfig';
import { newProductId, slugify } from '../lib/slug';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SIZES } from './seedData';

/*
 * Catálogo: categorías, tallas y productos.
 * Las consultas evitan índices compuestos (filtros/orden en el cliente) para que funcione
 * sin configurar índices en Firebase. Para catálogos de cientos de prendas es suficiente.
 */

const CACHE_MS = 60_000;
const cache = new Map();

const cached = async (key, loader) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await loader();
  cache.set(key, { value, at: Date.now() });
  return value;
};

export const invalidateCatalog = () => cache.clear();

const withId = (snap) => ({ id: snap.id, ...snap.data() });

/*
 * Modo vitrina: si Firebase aún no está configurado (.env vacío), la tienda muestra el
 * catálogo del Drop 01 desde seedData.js y los pedidos se envían por WhatsApp.
 * Así la web publicada nunca queda en blanco mientras conectas Firebase.
 */
export const SHOWCASE_MODE = firebaseNotConfigured;

const totalStock = (stock = {}) =>
  Object.values(stock).reduce((sum, n) => sum + (Number.isFinite(Number(n)) ? Math.max(0, Number(n)) : 0), 0);

// ---------------- Categorías ----------------

export const listCategories = ({ includeInactive = false } = {}) =>
  SHOWCASE_MODE ? Promise.resolve(SEED_CATEGORIES) : cached(`categories:${includeInactive}`, async () => {
    const snap = await getDocs(query(collection(db, 'categories'), orderBy('order')));
    const all = snap.docs.map(withId);
    return includeInactive ? all : all.filter((c) => c.active !== false);
  });

export const saveCategory = async (id, data) => {
  const clean = {
    name: data.name.trim(),
    slug: slugify(data.name),
    description: (data.description || '').trim(),
    image: (data.image || '').trim(),
    order: Number(data.order) || 0,
    active: Boolean(data.active),
  };
  const ref = id ? doc(db, 'categories', id) : doc(db, 'categories', `${clean.slug}`);
  if (!id) {
    const exists = await getDoc(ref);
    if (exists.exists()) throw new Error('Ya existe una categoría con ese nombre.');
  }
  await setDoc(ref, clean, { merge: true });
  invalidateCatalog();
  return ref.id;
};

export const deleteCategory = async (id) => {
  const products = await listAllProducts();
  if (products.some((p) => p.categoryId === id)) {
    throw new Error('La categoría tiene productos. Muévelos o desactiva la categoría.');
  }
  await deleteDoc(doc(db, 'categories', id));
  invalidateCatalog();
};

// ---------------- Tallas ----------------

export const SIZE_GROUPS = [
  { id: 'ropa', label: 'Ropa' },
  { id: 'calzado', label: 'Calzado' },
  { id: 'unica', label: 'Talla única' },
];

export const listSizes = () =>
  SHOWCASE_MODE ? Promise.resolve(SEED_SIZES) : cached('sizes', async () => {
    const snap = await getDocs(query(collection(db, 'sizes'), orderBy('order')));
    return snap.docs.map(withId);
  });

export const saveSize = async (id, data) => {
  const clean = { label: data.label.trim().toUpperCase(), group: data.group, order: Number(data.order) || 0 };
  const sizes = await listSizes();
  if (sizes.some((s) => s.label === clean.label && s.id !== id)) throw new Error('Esa talla ya existe.');
  const ref = id ? doc(db, 'sizes', id) : doc(collection(db, 'sizes'));
  await setDoc(ref, clean);
  invalidateCatalog();
};

export const deleteSize = async (id) => {
  const [sizes, products] = await Promise.all([listSizes(), listAllProducts()]);
  const size = sizes.find((s) => s.id === id);
  if (size && products.some((p) => Object.prototype.hasOwnProperty.call(p.stock || {}, size.label))) {
    throw new Error(`La talla ${size.label} está en uso por productos. Quítala de ellos primero.`);
  }
  await deleteDoc(doc(db, 'sizes', id));
  invalidateCatalog();
};

// ---------------- Productos ----------------

const showcaseProducts = () => SEED_PRODUCTS.map((p) => ({ ...p, totalStock: totalStock(p.stock) }));

export const listActiveProducts = () =>
  SHOWCASE_MODE ? Promise.resolve(showcaseProducts()) : cached('products:active', async () => {
    const snap = await getDocs(query(collection(db, 'products'), where('active', '==', true)));
    return snap.docs.map(withId);
  });

export const listAllProducts = () =>
  cached('products:all', async () => {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map(withId);
  });

/**
 * Lee un producto. Para el público, las reglas niegan leer productos desactivados
 * (permission-denied): eso equivale a "no disponible", así que se trata como inexistente.
 */
const readProduct = async (id) => {
  if (SHOWCASE_MODE) return showcaseProducts().find((p) => p.id === id) ?? null;
  try {
    const snap = await getDoc(doc(db, 'products', id));
    return snap.exists() ? withId(snap) : null;
  } catch (e) {
    if (e?.code === 'permission-denied') return null;
    throw e;
  }
};

export const getProduct = async (id) => (id ? readProduct(id) : null);

/** Lee varios productos frescos (sin caché) para validar precio y stock al comprar. */
export const getProductsFresh = async (ids) => {
  const unique = [...new Set(ids)];
  const products = await Promise.all(unique.map(readProduct));
  return new Map(products.filter(Boolean).map((p) => [p.id, p]));
};

export const normalizeProduct = (data) => {
  const stock = {};
  Object.entries(data.stock || {}).forEach(([size, qty]) => {
    const n = Math.max(0, Math.floor(Number(qty) || 0));
    if (size) stock[size] = n;
  });
  const price = Math.round(Number(data.price) * 100) / 100;
  const sale = data.salePrice === '' || data.salePrice == null ? null : Math.round(Number(data.salePrice) * 100) / 100;
  return {
    name: data.name.trim(),
    slug: slugify(data.name),
    shortDescription: (data.shortDescription || '').trim(),
    description: (data.description || '').trim(),
    categoryId: data.categoryId,
    gender: data.gender,
    price,
    salePrice: sale && sale > 0 && sale < price ? sale : null,
    images: (data.images || []).map((u) => u.trim()).filter(Boolean).slice(0, 8),
    colors: (data.colors || []).filter((c) => c.name?.trim()).map((c) => ({ name: c.name.trim(), hex: c.hex || '#000000' })),
    stock,
    totalStock: totalStock(stock),
    featured: Boolean(data.featured),
    isNew: Boolean(data.isNew),
    active: Boolean(data.active),
    tags: (data.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean),
  };
};

export const saveProduct = async (id, data) => {
  const clean = normalizeProduct(data);
  if (id) {
    await updateDoc(doc(db, 'products', id), { ...clean, updatedAt: serverTimestamp() });
    invalidateCatalog();
    return id;
  }
  const newId = newProductId(clean.name);
  await setDoc(doc(db, 'products', newId), { ...clean, soldCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  invalidateCatalog();
  return newId;
};

export const setProductActive = async (id, active) => {
  await updateDoc(doc(db, 'products', id), { active, updatedAt: serverTimestamp() });
  invalidateCatalog();
};

export const deleteProduct = async (id) => {
  await deleteDoc(doc(db, 'products', id));
  invalidateCatalog();
};

export { totalStock };
