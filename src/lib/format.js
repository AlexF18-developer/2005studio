const soles = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Convierte soles (79.9) a céntimos enteros (7990) sin errores de coma flotante. */
export const toCents = (amount) => Math.round(Number(amount || 0) * 100);

export const fromCents = (cents) => (Number(cents) || 0) / 100;

export const money = (amount) => `S/ ${soles.format(Number(amount) || 0)}`;

export const moneyCents = (cents) => money(fromCents(cents));

/** Precio efectivo de un producto (oferta válida o precio regular), en céntimos. */
export const unitPriceCents = (product) => {
  const price = toCents(product.price);
  const sale = toCents(product.salePrice);
  return sale > 0 && sale < price ? sale : price;
};

export const hasSale = (p) => toCents(p.salePrice) > 0 && toCents(p.salePrice) < toCents(p.price);

export const discountPct = (p) => (hasSale(p) ? Math.round((1 - p.salePrice / p.price) * 100) : 0);

/** Acepta Timestamp de Firestore, Date o milisegundos. */
export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
};

const dateFmt = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export const formatDate = (v) => (toDate(v) ? dateFmt.format(toDate(v)) : '—');
export const formatDateTime = (v) => (toDate(v) ? dateTimeFmt.format(toDate(v)) : '—');

export const initials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};
