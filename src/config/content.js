import { asset } from '../lib/asset';

const IMG = (file) => asset(`images/${file}`);

/**
 * Diapositivas del carrusel principal (cambian cada 3 segundos).
 * `image` = fondo a pantalla completa (usa fotos de 1200 px o más).
 * `product` = foto de producto que se muestra en un marco a la derecha.
 */
export const HERO_SLIDES = [
  {
    image: IMG('og-image.jpg'),
    kicker: 'Drop 01 · Lima, Perú · Est. 2025',
    title: '2005 Studio',
    text: 'Diseños que hablan de lo que nos gusta. Ropa para los que siempre hacen lo suyo.',
    cta: { label: 'Ver la colección', to: '/catalogo' },
  },
  {
    product: IMG('05_party.jpg'),
    tone: 'crimson',
    kicker: 'Edición limitada',
    title: 'Party Tee',
    text: 'Polo oversize de algodón premium con estampado DTF de alta calidad.',
    cta: { label: 'Ver Party Tee', to: '/producto/party-tee' },
  },
  {
    product: IMG('08_cube.jpg'),
    tone: 'pine',
    kicker: '12 diseños',
    title: 'Drop 01',
    text: 'Racing Club, Vision, Dreams, Cube y más. Tallas S, M y L con stock en tiempo real.',
    cta: { label: 'Ver los 12 diseños', to: '/catalogo' },
  },
  {
    product: IMG('01_racing_club.jpg'),
    tone: 'ink',
    kicker: 'Paga con Yape o Plin',
    title: 'Delivery S/ 5',
    text: 'Enviamos a todo Lima y Callao. Rastrea tu pedido con tu código.',
    cta: { label: 'Comprar ahora', to: '/catalogo' },
  },
];

export const LOOKBOOK = [
  '01_racing_club.jpg', '05_party.jpg', '08_cube.jpg', '06_brand.jpg', '10_vintage.jpg', '12_skull.jpg',
].map(IMG);

export const ABOUT_IMAGE = IMG('og-image.jpg');
export const STORE_IMAGE = IMG('og-image.jpg');

/** Fechas comerciales para la cuenta regresiva del inicio. */
export const nextSaleEvent = (now = new Date()) => {
  const y = now.getFullYear();
  const nthWeekday = (year, month, weekday, n) => {
    const first = new Date(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + 7 * (n - 1));
  };
  const events = (year) => [
    { name: 'San Valentín', date: new Date(year, 1, 14) },
    { name: 'Día de la Madre', date: nthWeekday(year, 4, 0, 2) },
    { name: 'Día del Padre', date: nthWeekday(year, 5, 0, 3) },
    { name: 'Fiestas Patrias', date: new Date(year, 6, 28) },
    { name: 'Black Friday', date: nthWeekday(year, 10, 5, 4) },
    { name: 'Navidad', date: new Date(year, 11, 25) },
  ];
  return [...events(y), ...events(y + 1)].find((e) => e.date.getTime() + 86_400_000 > now.getTime());
};
