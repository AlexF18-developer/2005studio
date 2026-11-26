# 2005 Studio · Tienda online (React + Firebase)

Streetwear independiente hecho en Lima. Esta versión 2 toma la arquitectura del proyecto **EARK (Catálogo de Ropa React + Firebase)** y la adapta a 2005 Studio: marca, colores (negro, hueso, carmesí, pino y dorado), tipografía Anton + Inter, catálogo real del **Drop 01** (12 diseños, tallas S, M y L) y contacto real.

**Qué cambia respecto a la v1** (un solo `App.jsx` que mandaba el carrito por WhatsApp):

| v1 | v2 |
|---|---|
| Carrito en memoria (se perdía al recargar) | Carrito y favoritos guardados en el navegador |
| Sin stock | Stock por talla: no deja comprar tallas agotadas |
| Pedido solo por WhatsApp | Pedido con código `2005-XXXXXXXX` guardado en Firestore |
| Sin seguimiento | El cliente rastrea su pedido con código + correo y registra su N° de operación |
| Sin cuentas | Registro con correo o **con Google**, y “Mis pedidos” |
| Sin panel | Panel admin: dashboard de ventas, pedidos (confirmar pago descuenta stock, cancelar lo devuelve), productos, tallas, categorías y administradores |
| Una sola página | Inicio, catálogo con filtros, detalle, carrito, checkout, guía de tallas, nosotros, contacto, términos |

## 1. Instalar

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev
```

## 2. Modo vitrina (sin Firebase)

Si no hay `.env` (o tiene los valores de ejemplo), la tienda **funciona igual en modo vitrina**: muestra el catálogo del Drop 01 desde `src/services/seedData.js`, el checkout muestra el QR de Yape y envía el pedido completo por WhatsApp (como la v1). Así la web publicada nunca queda en blanco mientras conectas Firebase.

## 3. Firebase (ya configurado)

El proyecto **2005Studio-Tienda** (`studio-2005-tienda`) ya está creado y el `.env` incluido apunta a él:

- Authentication: **Correo/contraseña** y **Google** habilitados (nombre público "2005 Studio").
- Dominios autorizados: `localhost` y `alexf18-developer.github.io`.
- Firestore en `southamerica-east1` (São Paulo), modo producción, con las reglas de `firestore.rules` publicadas.

Si cambias `firestore.rules`, vuelve a publicarlas en *Firestore → Reglas* (o `firebase deploy --only firestore:rules`).

Luego, con `npm run dev`:

1. Crea tu cuenta en **Registrarse**.
2. Entra a `#/admin/setup` → **Convertirme en administrador** (solo funciona una vez).
3. En **Catálogo inicial** pulsa **Cargar catálogo Drop 01**: crea la categoría, las tallas S, M y L y los 12 diseños con sus fotos y precios.
4. Ajusta el **stock real** de cada talla en *Admin → Productos* (el inicial es S 4 · M 8 · L 8).

## 4. Publicar en GitHub Pages

```bash
npm run deploy        # compila y sube la carpeta dist a la rama gh-pages
```

Queda en https://alexf18-developer.github.io/2005studio/. La app usa rutas con `#` (`/2005studio/#/catalogo`) para que funcionen aunque recargues la página en GitHub Pages.

> El `.env` no se sube a GitHub (está en `.gitignore`), pero `npm run deploy` lo usa al compilar. La configuración web de Firebase es pública por diseño: la seguridad la dan las reglas de `firestore.rules`.

Para Firebase Hosting u otro dominio: `VITE_BASE=/ npm run build` y luego `firebase deploy`.

## 5. Revisa antes de publicar

- `src/config/store.js`: número y titular de Yape/Plin (se tomó el titular del QR de Yape), la cuenta para transferencias, horario y redes.
- `public/images/yape_qr.jpg`: tu QR de Yape.
- `src/pages/InfoPages.jsx`: las medidas de la **guía de tallas** son referenciales: reemplázalas por las medidas reales de tus polos. Revisa también los términos de compra.
- Para agregar un diseño nuevo: sube la foto a `public/images/` y en *Admin → Productos → Nuevo* escribe la ruta `images/mi_foto.jpg` (o una URL `https://`).

## 6. Pruebas automáticas (opcional)

Recorren todo el flujo con un Firebase simulado en memoria (registro, admin, seeder, compra, N° de operación, rastreo, confirmar pago con descuento de stock, cancelación, reglas y vista móvil):

```bash
npm i -D playwright && npx playwright install chromium
npm run test:server        # terminal 1
npm run test:e2e           # terminal 2
```

## Estructura

```
src/
  firebaseConfig.js     conexión a Firebase (lee .env)
  config/               datos de 2005 Studio (store.js) y contenido del inicio (content.js)
  services/             catálogo (+ modo vitrina), pedidos, auth, seeder y seedData (Drop 01)
  context/ hooks/       carrito, favoritos, sesión, toasts
  components/ pages/    tienda pública
  admin/                panel administrativo (se carga solo para admins)
  lib/asset.js          rutas de imágenes que funcionan en local y en /2005studio/
  styles/               tema de la marca y animaciones
public/images/          fotos del Drop 01 y og-image
firestore.rules         reglas de seguridad (códigos de pedido 2005-XXXXXXXX)
test/                   pruebas E2E con Firebase simulado
```

Créditos: arquitectura base del proyecto EARK · Catálogo de Ropa (React + Firebase).
