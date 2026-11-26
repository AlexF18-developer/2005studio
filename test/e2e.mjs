// Prueba E2E del flujo completo contra el Firebase falso. Uso: node test/e2e.mjs
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5199';
const SHOTS = process.env.SHOTS || '/tmp/claude-0/shots';
mkdirSync(SHOTS, { recursive: true });

const errors = [];
const results = [];
const step = async (name, fn) => {
  try { await fn(); results.push(`✔ ${name}`); console.log(`✔ ${name}`); }
  catch (e) { results.push(`✘ ${name}: ${e.message}`); console.log(`✘ ${name}: ${e.message.split('\n').slice(0, 14).join('\n')}`); throw e; }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errors.push(`console: ${m.text()}`);
});
// La tienda usa HashRouter (#/ruta) para funcionar en GitHub Pages.
const go = (route) => page.goto(`${BASE}/#${route}`);
const atRoute = (re) => page.waitForURL((u) => re.test(new URL(u).hash), { timeout: 10000 });
const fakeDb = () => page.evaluate(() => JSON.parse(localStorage.getItem('__fake_firebase__')));
const shot = (n) => page.screenshot({ path: `${SHOTS}/${n}.png` });
const toast = (text) => page.locator('.toast', { hasText: text }).first().waitFor({ timeout: 8000 });

try {
  await step('Inicio carga sin Firebase poblado', async () => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('.hero').waitFor();
    expect(!(await page.locator('.config-warning').count()), 'aviso de configuración visible con .env válido');
  });

  await step('Registro de cuenta (contraseña débil rechazada)', async () => {
    await go('/registro?next=/admin/setup');
    const f = page.locator('.auth-form form');
    await f.locator('input[autocomplete="name"]').fill('Alexander Avila');
    await f.locator('input[type="email"]').fill('Admin@2005Studio.pe');
    await f.locator('input[autocomplete="tel"]').fill('917233247');
    const pw = f.locator('input[autocomplete="new-password"]');
    await pw.nth(0).fill('abcdefgh');
    await pw.nth(1).fill('abcdefgh');
    await f.locator('button[type="submit"]').click();
    await page.locator('.alert-danger', { hasText: '8 caracteres' }).waitFor();
    await pw.nth(0).fill('Studio2005!');
    await pw.nth(1).fill('Studio2005!');
    await f.locator('button[type="submit"]').click();
    await atRoute(/^#\/admin\/setup/);
  });

  await step('Perfil de usuario creado sin carrera (reglas)', async () => {
    await page.waitForTimeout(2600);
    const db = await fakeDb();
    const users = Object.entries(db.docs).filter(([k]) => k.startsWith('users/'));
    expect(users.length === 1, `perfiles: ${users.length}`);
    expect(users[0][1].email === 'admin@2005studio.pe' && users[0][1].phone === '917233247', 'perfil incorrecto');
  });

  await step('Reclamar primer administrador', async () => {
    await page.getByRole('button', { name: 'Convertirme en administrador' }).click();
    await atRoute(/^#\/admin\/datos/);
    await shot('01-admin-seeder');
  });

  await step('Seeder llena Firestore', async () => {
    await page.locator('.btn-gold', { hasText: /cargar|datos/i }).first().click();
    await page.waitForFunction(() => {
      const d = JSON.parse(localStorage.getItem('__fake_firebase__'));
      return Object.keys(d.docs).filter((k) => k.startsWith('products/')).length >= 12;
    }, null, { timeout: 15000 });
    await page.waitForTimeout(500);
    const db = await fakeDb();
    const count = (p) => Object.keys(db.docs).filter((k) => k.startsWith(p)).length;
    expect(count('categories/') === 1 && count('sizes/') === 3 && count('products/') === 12, `cats ${count('categories/')} sizes ${count('sizes/')} prods ${count('products/')}`);
    expect(db.docs['products/party-tee']?.price === 79.9 && db.docs['products/party-tee'].images[0] === 'images/05_party.jpg', 'Party Tee mal cargado');
    await shot('02-seeder-done');
  });

  await step('Seeder idempotente (segunda ejecución)', async () => {
    await page.reload();
    await page.locator('.btn-gold', { hasText: /cargar|datos/i }).first().click();
    await page.waitForTimeout(2500);
    const db = await fakeDb();
    expect(Object.keys(db.docs).filter((k) => k.startsWith('products/')).length === 12, 'duplicó productos');
  });

  await step('Dashboard admin', async () => {
    await go('/admin');
    await page.locator('.kpi').first().waitFor();
    await shot('03-admin-dashboard');
  });

  await step('Cerrar sesión y volver a entrar como admin', async () => {
    await page.evaluate(async () => {
      const m = await import('/src/services/auth.js');
      await m.logout();
    });
    await go('/admin');
    await atRoute(/^#\/(admin\/setup|login)/);
    await go('/login?next=/admin');
    await page.locator('input[type="email"]').fill('admin@2005studio.pe');
    await page.locator('input[type="password"]').fill('Studio2005!');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await atRoute(/^#\/admin$/);
    await page.locator('.kpi').first().waitFor();
    await page.evaluate(async () => (await import('/src/services/auth.js')).logout());
  });

  await step('Home con productos (invitado)', async () => {
    await go('/');
    await page.locator('.pcard').first().waitFor({ state: 'attached', timeout: 15000 });
    expect(await page.locator('.pcard img[src*="images/"]').count() > 0, 'no se ven las fotos del drop');
    await page.waitForTimeout(800);
    await shot('04-home');
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(900);
    await shot('05-home-scroll');
  });

  await step('Catálogo + filtros por URL', async () => {
    await go('/catalogo?q=party');
    await page.locator('.pcard').first().waitFor();
    const n = await page.locator('.product-grid .pcard').count();
    expect(n === 1, `búsqueda "party" devolvió ${n}`);
    await go('/catalogo?q=xxxxxxxx');
    await page.locator('.empty').waitFor();
    await go('/catalogo');
    await page.locator('.pcard').first().waitFor();
    expect(await page.locator('.product-grid .pcard').count() === 12, 'el catálogo no muestra los 12 diseños');
    await page.locator('.pcard').first().waitFor();
    await shot('06-catalogo');
  });

  let productUrl;
  await step('Detalle de producto y agregar al carrito', async () => {
    await page.locator('.product-grid .pcard a').first().click();
    await page.locator('.detail-title').waitFor();
    productUrl = page.url();
    await page.locator('.size-btn:not([disabled])').first().click();
    await page.getByRole('button', { name: 'Más' }).click();
    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await page.waitForTimeout(300);
    await shot('07-detalle');
    const badge = await page.locator('.navbar .badge-count').first().innerText();
    expect(badge.trim() === '2', `badge carrito = ${badge}`);
  });

  await step('Favoritos', async () => {
    await page.locator('.icon-btn-lg').first().click();
    await go('/favoritos');
    await page.locator('.pcard').first().waitFor();
  });

  let orderCode;
  await step('Checkout invitado con validaciones', async () => {
    await go('/carrito');
    await page.locator('.cart-line').first().waitFor();
    await shot('08-carrito');
    await go('/checkout');
    await page.getByRole('button', { name: /Confirmar pedido/ }).click();
    expect(await page.locator('.field-error').count() >= 3, 'no mostró errores de validación');
    await page.locator('input[autocomplete="name"]').fill('Cliente Prueba');
    await page.locator('input[autocomplete="tel"]').fill('987654321');
    await page.locator('input[type="email"]').fill('cliente@test.pe');
    await page.locator('select').selectOption('Miraflores');
    await page.locator('input[autocomplete="street-address"]').fill('Av. Larco 123');
    await page.locator('label.pay-option', { hasText: 'Yape' }).click();
    await page.locator('label.check input[type="checkbox"]').check();
    await shot('09-checkout');
    await page.getByRole('button', { name: /Confirmar pedido/ }).click();
    await atRoute(/^#\/pedido\/2005-[A-Z0-9]{8}/);
    orderCode = page.url().match(/2005-[A-Z0-9]{8}/)[0];
    await page.waitForTimeout(1200);
    await shot('10-pedido-creado');
    const db = await fakeDb();
    const o = db.docs[`orders/${orderCode}`];
    expect(o && o.itemsCount === 2 && o.totalCents === o.subtotalCents + 500, `pedido mal guardado: ${JSON.stringify(o)}`);
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('2005studio:cart:v1') || '[]'));
    expect(Array.isArray(cart) && cart.length === 0, 'carrito no se vació');
  });

  await step('Cliente registra N° de operación', async () => {
    expect(await page.locator('img.yape-qr').evaluate((i) => i.complete && i.naturalWidth > 0), 'el QR de Yape no cargó');
    await page.locator('.op-form input').fill('12345678');
    await page.locator('.op-form button[type="submit"]').click();
    await page.locator('.status', { hasText: /verific/i }).first().waitFor({ timeout: 8000 });
    const db = await fakeDb();
    expect(db.docs[`orders/${orderCode}`].status === 'verificando', 'estado no cambió');
  });

  await step('Seguimiento por código + correo', async () => {
    await go('/seguimiento');
    await page.locator('input[placeholder="2005-XXXXXXXX"]').fill(orderCode);
    await page.locator('input[type="email"]').fill('CLIENTE@test.pe');
    await page.locator('.track-form button[type="submit"]').click();
    await page.locator('.timeline').waitFor();
    await shot('11-seguimiento');
  });

  let productId; let sizeKey; let stockBefore;
  await step('Admin confirma pago → descuenta stock', async () => {
    let db = await fakeDb();
    const item = db.docs[`orders/${orderCode}`].items[0];
    productId = item.productId; sizeKey = item.size;
    stockBefore = db.docs[`products/${productId}`].stock[sizeKey];
    await go(`/login?next=/admin/pedidos/${orderCode}`);
    await page.locator('input[type="email"]').fill('admin@2005studio.pe');
    await page.locator('input[type="password"]').fill('Studio2005!');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await atRoute(new RegExp(`^#/admin/pedidos/${orderCode}`));
    await page.getByRole('button', { name: /Confirmar pago/ }).click();
    await toast('');
    await page.waitForTimeout(600);
    db = await fakeDb();
    const p = db.docs[`products/${productId}`];
    expect(p.stock[sizeKey] === stockBefore - 2, `stock ${stockBefore} → ${p.stock[sizeKey]}`);
    expect(p.soldCount >= 2 && db.docs[`orders/${orderCode}`].stockApplied === true, 'soldCount/stockApplied');
    await shot('12-admin-pedido');
  });

  await step('Admin cancela → devuelve stock', async () => {
    await page.getByRole('button', { name: 'Cancelar pedido' }).click();
    await page.waitForTimeout(900);
    const db = await fakeDb();
    expect(db.docs[`products/${productId}`].stock[sizeKey] === stockBefore, 'stock no restaurado');
    expect(db.docs[`orders/${orderCode}`].status === 'cancelado', 'no canceló');
  });

  await step('Admin: listado de pedidos, productos, crear y ocultar producto', async () => {
    await go('/admin/pedidos');
    await page.locator('table tbody tr').first().waitFor();
    await go('/admin/productos');
    await page.locator('table tbody tr').first().waitFor();
    await shot('13-admin-productos');
    await go('/admin/productos/nuevo');
    await page.locator('.form-layout').waitFor();
    await shot('14-admin-form');
  });

  await step('Producto oculto: invitado lo ve como "no disponible" sin romper', async () => {
    await page.evaluate(async (id) => (await import('/src/services/catalog.js')).setProductActive(id, false), productId);
    await page.evaluate(async () => (await import('/src/services/auth.js')).logout());
    await go(`/producto/${productId}`);
    await page.waitForTimeout(1500);
    expect(!(await page.locator('.detail-title').count()), 'el producto oculto se mostró');
    await shot('15-producto-oculto');
    const { warnings } = await page.evaluate(async (id) => (await import('/src/services/orders.js'))
      .priceCart([{ key: 'k', productId: id, name: 'X', size: 'M', qty: 1 }]), productId);
    expect(warnings.length === 1 && /ya no está disponible/.test(warnings[0]), `warnings: ${warnings}`);
  });

  await step('Reglas: invitado no puede escribir catálogo ni falsear pedido', async () => {
    const r = await page.evaluate(async () => {
      const fs = await import('/test/fake-firebase/firestore.js');
      const { db } = await import('/src/firebaseConfig.js');
      const out = {};
      try { await fs.setDoc(fs.doc(db, 'products', 'hack'), { name: 'x', active: true }); out.product = 'ok'; } catch (e) { out.product = e.code; }
      try {
        await fs.setDoc(fs.doc(db, 'orders', '2005-HACK0001'), {
          code: '2005-HACK0001', userId: null, customer: { name: 'aa', email: 'a@a.pe', phone: '987654321' },
          shipping: { district: 'Lima', address: 'Calle 123', reference: null, costCents: 500 }, items: [{}], itemsCount: 1,
          subtotalCents: 100, totalCents: 100, paymentMethod: 'yape', operationNumber: null, status: 'confirmado',
          history: [{}], stockApplied: false, createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp(),
        });
        out.order = 'ok';
      } catch (e) { out.order = e.code; }
      return out;
    });
    expect(r.product === 'permission-denied' && r.order === 'permission-denied', JSON.stringify(r));
  });

  await step('Ingreso con Google crea el perfil del cliente', async () => {
    await go('/login?next=/mi-cuenta');
    await page.getByRole('button', { name: /Continuar con Google/ }).click();
    await atRoute(/^#\/mi-cuenta/);
    await page.waitForTimeout(2800);
    const db = await fakeDb();
    const prof = Object.entries(db.docs).find(([k, v]) => k.startsWith('users/') && v.email === 'cliente.google@gmail.com');
    expect(prof && prof[1].name === 'Cliente Google', 'no se creó el perfil de Google');
    await shot('18-google-cuenta');
    await page.evaluate(async () => (await import('/src/services/auth.js')).logout());
  });

  await step('Responsive móvil', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/');
    await page.locator('.pcard').first().waitFor({ state: 'attached', timeout: 15000 });
    await page.waitForTimeout(600);
    await shot('16-movil-home');
    await page.locator('.navbar .only-mobile').first().click();
    await page.waitForTimeout(400);
    await shot('17-movil-menu');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(!overflow, 'scroll horizontal en móvil');
  });
} catch {
  // el detalle ya se imprimió
} finally {
  console.log('\nErrores de consola/página:', errors.length ? errors : 'ninguno');
  await browser.close();
  const failed = results.filter((r) => r.startsWith('✘')).length;
  console.log(`\n${results.length - failed}/${results.length} pasos OK`);
  process.exit(failed || errors.length ? 1 : 0);
}
