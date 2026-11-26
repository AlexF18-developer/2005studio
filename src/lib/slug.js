/** "Polera Oversize Ñandú" → "polera-oversize-nandu" */
export const slugify = (text = '') =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para dictarlo sin confusiones

export const randomCode = (length) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
};

/** Código de pedido no adivinable: 2005-XXXXXXXX (32^8 ≈ 1 billón de combinaciones). */
export const ORDER_CODE = /^2005-[A-Z0-9]{8}$/;
export const newOrderCode = () => `2005-${randomCode(8)}`;

/** Id de producto legible y único: slug + sufijo aleatorio corto. */
export const newProductId = (name) => `${slugify(name).slice(0, 60)}-${randomCode(4).toLowerCase()}`;
