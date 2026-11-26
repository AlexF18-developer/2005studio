import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { invalidateCatalog, totalStock } from './catalog';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SIZES } from './seedData';

/**
 * Llena Firestore con categorías, tallas y productos de ejemplo.
 * Es idempotente: usa ids fijos, así que ejecutarlo dos veces no duplica nada
 * (solo restablece los productos de ejemplo a sus valores iniciales).
 * Requiere ser administrador (lo exigen las reglas).
 */
export const runSeeder = async (onProgress = () => {}) => {
  const operations = [
    ...SEED_SIZES.map(({ id, ...data }) => ({ ref: doc(db, 'sizes', id), data })),
    ...SEED_CATEGORIES.map(({ id, ...data }) => ({ ref: doc(db, 'categories', id), data })),
    ...SEED_PRODUCTS.map(({ id, ...data }) => ({
      ref: doc(db, 'products', id),
      data: { ...data, totalStock: totalStock(data.stock), createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    })),
  ];

  // Firestore permite hasta 500 escrituras por lote.
  const CHUNK = 400;
  for (let i = 0; i < operations.length; i += CHUNK) {
    const batch = writeBatch(db);
    operations.slice(i, i + CHUNK).forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
    onProgress(Math.min(i + CHUNK, operations.length), operations.length);
  }

  invalidateCatalog();
  return {
    sizes: SEED_SIZES.length,
    categories: SEED_CATEGORIES.length,
    products: SEED_PRODUCTS.length,
  };
};
