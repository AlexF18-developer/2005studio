/**
 * Catálogo inicial de 2005 Studio (Drop 01) para el Seeder del panel.
 * Las fotos están en /public/images y se guardan como ruta relativa ("images/...").
 * El stock por talla es inicial: ajústalo desde Admin → Productos con tu inventario real.
 *
 * Este mismo catálogo se usa como "modo vitrina" cuando Firebase aún no está configurado.
 */
const SIZES = ['S', 'M', 'L'];

export const SEED_SIZES = SIZES.map((label, i) => ({
  id: `ropa-${label.toLowerCase()}`, label, group: 'ropa', order: i + 1,
}));

export const SEED_CATEGORIES = [
  {
    id: 'drop-01',
    name: 'Drop 01',
    slug: 'drop-01',
    description: '12 diseños en edición limitada. Polos oversize de algodón premium con estampado DTF.',
    image: 'images/og-image.jpg',
    order: 1,
    active: true,
  },
];

const c = (name, hex) => ({ name, hex });
const NEGRO = c('Negro', '#1A1A1A');
const BLANCO = c('Blanco Hueso', '#EFE9DD');
const GRIS = c('Gris', '#9B9B9B');
const CREMA = c('Crema', '#F5F0E6');
const ROJO = c('Rojo', '#B03A2E');
const VERDE = c('Verde', '#1E8449');
const VERDE_OSC = c('Verde Oscuro', '#17352E');
const VERDE_GRIS = c('Verde Grisáceo', '#6B8F87');
const AZUL = c('Azul', '#2255A4');
const ROSA = c('Rosa', '#E27DC2');
const MORADO = c('Morado', '#A64FD9');
const MAGENTA = c('Magenta', '#C93FA0');

/** Stock inicial de ejemplo: más unidades en M y L, que son las tallas que más rotan. */
const STOCK = { S: 4, M: 8, L: 8 };

const SHORT = 'Polo oversize de algodón premium. Estampado DTF de alta calidad.';
const LONG = (name) =>
  `${name} del Drop 01 de 2005 Studio. Polo oversize de algodón premium con estampado DTF de alta calidad, `
  + 'colores vivos y resistente al lavado.\nCorte holgado y hombro caído. Edición limitada: cuando se agota una talla, no se repone.';

const P = (num, id, name, price, file, colors, flags = []) => ({
  id,
  name,
  slug: id,
  categoryId: 'drop-01',
  gender: 'unisex',
  price,
  salePrice: null,
  images: [`images/${file}`],
  colors,
  stock: { ...STOCK },
  featured: flags.includes('featured'),
  isNew: flags.includes('new'),
  active: true,
  tags: ['drop-01', `diseno-${num}`],
  shortDescription: SHORT,
  description: LONG(name),
  soldCount: 0,
});

export const SEED_PRODUCTS = [
  P('01', 'racing-club-tee', 'Racing Club Tee', 74.9, '01_racing_club.jpg', [NEGRO, BLANCO, GRIS], ['featured']),
  P('02', 'vision-tee', 'Vision Tee', 69.9, '02_vision.jpg', [BLANCO, ROSA, GRIS], ['new']),
  P('03', 'dreams-tee', 'Dreams Tee', 79.9, '03_dreams.jpg', [GRIS, NEGRO, BLANCO]),
  P('04', 'supreme-tee', 'Supreme Tee', 74.9, '04_supreme.jpg', [BLANCO, GRIS, CREMA]),
  P('05', 'party-tee', 'Party Tee', 79.9, '05_party.jpg', [ROJO, BLANCO, VERDE], ['featured']),
  P('06', 'brand-tee', 'Brand Tee', 74.9, '06_brand.jpg', [NEGRO, AZUL, BLANCO], ['new']),
  P('07', 'neon-tee', 'Neon Tee', 69.9, '07_neon.jpg', [BLANCO, GRIS, MORADO]),
  P('08', 'cube-tee', 'Cube Tee', 84.9, '08_cube.jpg', [VERDE_OSC, VERDE_GRIS, MAGENTA], ['featured']),
  P('09', 'cartoon-tee', 'Cartoon Tee', 74.9, '09_cartoon.jpg', [BLANCO, MAGENTA, GRIS], ['new']),
  P('10', 'vintage-tee', 'Vintage Tee', 79.9, '10_vintage.jpg', [GRIS, BLANCO, NEGRO], ['featured']),
  P('11', 'galaxy-tee', 'Galaxy Tee', 79.9, '11_galaxy.jpg', [BLANCO, AZUL, GRIS], ['new']),
  P('12', 'skull-tee', 'Skull Tee', 74.9, '12_skull.jpg', [BLANCO, ROJO, GRIS], ['new']),
];
