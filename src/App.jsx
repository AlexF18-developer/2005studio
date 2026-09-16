import React, { useState, useMemo } from "react";
import { ShoppingBag, X, Plus, Minus, ChevronRight } from "lucide-react";

/* ---------- Brand tokens ----------
Color:
  ink:     #100F0D  (near-black, brand base)
  bone:    #EFE9DD  (warm off-white, card/paper)
  paper:   #F7F3EA  (page background, slightly lighter than bone)
  crimson: #9A1F26  (accent — Party Tee red)
  pine:    #17352E  (accent — Cube Tee green)
  ink-60:  rgba(16,15,13,.6) (muted text)
Type:
  Display: 'Anton' (condensed, heavy — matches the racing/varsity wordmark feel)
  Body:    'Inter' (clean grotesk for product copy, UI)
------------------------------------ */

const SITE_URL = "https://alexf18-developer.github.io/2005studio";
const BASE = import.meta.env.BASE_URL;

const IMG = {
  racingClub: BASE + "images/01_racing_club.jpg",
  vision: BASE + "images/02_vision.jpg",
  dreams: BASE + "images/03_dreams.jpg",
  supreme: BASE + "images/04_supreme.jpg",
  party: BASE + "images/05_party.jpg",
  brand: BASE + "images/06_brand.jpg",
  neon: BASE + "images/07_neon.jpg",
  cube: BASE + "images/08_cube.jpg",
  cartoon: BASE + "images/09_cartoon.jpg",
  vintage: BASE + "images/10_vintage.jpg",
  galaxy: BASE + "images/11_galaxy.jpg",
  skull: BASE + "images/12_skull.jpg",
  yapeQr: BASE + "images/yape_qr.jpg",
};

const IMG_ABS = {
  racingClub: SITE_URL + "/images/01_racing_club.jpg",
  vision: SITE_URL + "/images/02_vision.jpg",
  dreams: SITE_URL + "/images/03_dreams.jpg",
  supreme: SITE_URL + "/images/04_supreme.jpg",
  party: SITE_URL + "/images/05_party.jpg",
  brand: SITE_URL + "/images/06_brand.jpg",
  neon: SITE_URL + "/images/07_neon.jpg",
  cube: SITE_URL + "/images/08_cube.jpg",
  cartoon: SITE_URL + "/images/09_cartoon.jpg",
  vintage: SITE_URL + "/images/10_vintage.jpg",
  galaxy: SITE_URL + "/images/11_galaxy.jpg",
  skull: SITE_URL + "/images/12_skull.jpg",
};

const NEGRO = { name: "Negro", hex: "#1A1A1A" };
const BLANCO = { name: "Blanco Hueso", hex: "#EFE9DD" };
const GRIS = { name: "Gris", hex: "#9B9B9B" };
const CREMA = { name: "Crema", hex: "#F5F0E6" };
const ROJO = { name: "Rojo", hex: "#B03A2E" };
const VERDE = { name: "Verde", hex: "#1E8449" };
const VERDE_OSC = { name: "Verde Oscuro", hex: "#17352E" };
const VERDE_GRIS = { name: "Verde Grisáceo", hex: "#6B8F87" };
const AZUL = { name: "Azul", hex: "#2255A4" };
const ROSA = { name: "Rosa", hex: "#E27DC2" };
const MORADO = { name: "Morado", hex: "#A64FD9" };
const MAGENTA = { name: "Magenta", hex: "#C93FA0" };

const PRODUCTS = [
  { id: "racing", name: "Racing Club Tee", price: 74.9, img: IMG.racingClub, imgAbs: IMG_ABS.racingClub, bg: "#EFE9DD", ink: "#100F0D", tag: "01", colors: [NEGRO, BLANCO, GRIS] },
  { id: "vision", name: "Vision Tee", price: 69.9, img: IMG.vision, imgAbs: IMG_ABS.vision, bg: "#EFE9DD", ink: "#100F0D", tag: "02", colors: [BLANCO, ROSA, GRIS] },
  { id: "dreams", name: "Dreams Tee", price: 79.9, img: IMG.dreams, imgAbs: IMG_ABS.dreams, bg: "#EFE9DD", ink: "#100F0D", tag: "03", colors: [GRIS, NEGRO, BLANCO] },
  { id: "supreme", name: "Supreme Tee", price: 74.9, img: IMG.supreme, imgAbs: IMG_ABS.supreme, bg: "#EFE9DD", ink: "#100F0D", tag: "04", colors: [BLANCO, GRIS, CREMA] },
  { id: "party", name: "Party Tee", price: 79.9, img: IMG.party, imgAbs: IMG_ABS.party, bg: "#9A1F26", ink: "#FFFFFF", tag: "05", colors: [ROJO, BLANCO, VERDE] },
  { id: "brand", name: "Brand Tee", price: 74.9, img: IMG.brand, imgAbs: IMG_ABS.brand, bg: "#100F0D", ink: "#FFFFFF", tag: "06", colors: [NEGRO, AZUL, BLANCO] },
  { id: "neon", name: "Neon Tee", price: 69.9, img: IMG.neon, imgAbs: IMG_ABS.neon, bg: "#EFE9DD", ink: "#100F0D", tag: "07", colors: [BLANCO, GRIS, MORADO] },
  { id: "cube", name: "Cube Tee", price: 84.9, img: IMG.cube, imgAbs: IMG_ABS.cube, bg: "#17352E", ink: "#FFFFFF", tag: "08", colors: [VERDE_OSC, VERDE_GRIS, MAGENTA] },
  { id: "cartoon", name: "Cartoon Tee", price: 74.9, img: IMG.cartoon, imgAbs: IMG_ABS.cartoon, bg: "#EFE9DD", ink: "#100F0D", tag: "09", colors: [BLANCO, MAGENTA, GRIS] },
  { id: "vintage", name: "Vintage Tee", price: 79.9, img: IMG.vintage, imgAbs: IMG_ABS.vintage, bg: "#100F0D", ink: "#FFFFFF", tag: "10", colors: [GRIS, BLANCO, NEGRO] },
  { id: "galaxy", name: "Galaxy Tee", price: 79.9, img: IMG.galaxy, imgAbs: IMG_ABS.galaxy, bg: "#EFE9DD", ink: "#100F0D", tag: "11", colors: [BLANCO, AZUL, GRIS] },
  { id: "skull", name: "Skull Tee", price: 74.9, img: IMG.skull, imgAbs: IMG_ABS.skull, bg: "#100F0D", ink: "#FFFFFF", tag: "12", colors: [BLANCO, ROJO, GRIS] },
];

const SIZES = ["S", "M", "L", "XL"];

const SOCIALS = {
  instagram: "https://www.instagram.com/alex_fade12?utm_source=qr&stkn=bmJpNXBqNWQ0NjI1",
  facebook: "https://www.facebook.com/abraham.avila.5686",
  tiktok: "https://www.tiktok.com/@alexfade16",
  whatsapp: "51917233247",
};

function fmt(n) {
  return "S/ " + n.toFixed(2);
}

function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconFacebook(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h2.5l.5-4H13V7a1 1 0 0 1 1-1h2z" />
    </svg>
  );
}
function IconTiktok(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
      <path d="M14.5 3c.4 2.1 1.8 3.6 4 3.9v2.6c-1.5 0-2.9-.4-4-1.2v6.1a5.6 5.6 0 1 1-4.8-5.5v2.7a3 3 0 1 0 2.1 2.9V3h2.7z" />
    </svg>
  );
}
function IconWhatsapp(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm0 16.2a7.2 7.2 0 0 1-3.7-1l-.3-.2-2.8.7.7-2.7-.2-.3A7.2 7.2 0 1 1 12 19.2zm3.9-5.4c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.6.8-.1.1-.2.1-.4 0-.2-.1-.9-.3-1.7-1-.6-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.4l.3-.4.2-.3c.1-.1 0-.2 0-.3-.1-.1-.5-1.2-.7-1.6-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1z" />
    </svg>
  );
}
function StarMark({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 1l1.8 7.2L21 10l-7.2 1.8L12 19l-1.8-7.2L3 10l7.2-1.8z" />
    </svg>
  );
}

function ProductCard({ product, onAdd }) {
  const [size, setSize] = useState("M");
  const [color, setColor] = useState(product.colors[0]);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd(product, size, color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="pcard" style={{ background: product.bg, color: product.ink }}>
      <div className="pcard-photo">
        <img src={product.img} alt={product.name} />
      </div>
      <div className="pcard-body">
        <div className="pcard-row">
          <span className="pcard-tag">{product.tag}</span>
          <span className="pcard-price">{fmt(product.price)}</span>
        </div>
        <h3 className="pcard-name">{product.name}</h3>
        <p className="pcard-desc">Polo oversize de algodón premium. Estampado DTF de alta calidad.</p>

        <div className="color-row">
          {product.colors.map((c) => (
            <button
              key={c.name}
              className={"color-dot" + (c.name === color.name ? " active" : "")}
              style={{ background: c.hex, outlineColor: product.ink }}
              title={c.name}
              aria-label={c.name}
              onClick={() => setColor(c)}
            />
          ))}
          <span className="color-label">{color.name}</span>
        </div>

        <div className="size-row">
          {SIZES.map((s) => (
            <button
              key={s}
              className={"size-chip" + (s === size ? " active" : "")}
              style={{ borderColor: product.ink, color: s === size ? product.bg : product.ink, background: s === size ? product.ink : "transparent" }}
              onClick={() => setSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="add-btn" style={{ background: product.ink, color: product.bg }} onClick={handleAdd}>
          {added ? "Agregado ✓" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  function addToCart(product, size, color) {
    setCart((prev) => {
      const key = product.id + "-" + size + "-" + color.name;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { key, id: product.id, name: product.name, price: product.price, img: product.img, imgAbs: product.imgAbs, size, color: color.name, qty: 1 }];
    });
    setCartOpen(true);
  }

  function updateQty(key, delta) {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(key) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.qty * i.price, 0), [cart]);

  const orderText = useMemo(() => {
    if (cart.length === 0) return "";
    const lines = cart.map(
      (i) => `• ${i.name} — Color: ${i.color}, Talla ${i.size} — x${i.qty} — ${fmt(i.price * i.qty)}\n  Foto: ${i.imgAbs}`
    );
    return encodeURIComponent(
      "Hola 2005 Studio! Quiero confirmar mi pedido:\n\n" +
        lines.join("\n\n") +
        `\n\nTotal: ${fmt(cartTotal)}\n\n(Voy a adjuntar mi captura de pago de Yape a este mismo mensaje antes de enviarlo)`
    );
  }, [cart, cartTotal]);

  return (
    <div className="app-root">
      <style>{CSS}</style>

      {/* Header */}
      <header className="topnav">
        <div className="wrap topnav-inner">
          <div className="brandmark">
            <StarMark size={18} />
            <span>2005<em>STUDIO</em></span>
          </div>
          <nav className="topnav-links">
            <a href="#tienda">Tienda</a>
            <a href="#nosotros">Nosotros</a>
          </nav>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={19} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-stars">
          <StarMark size={14} /> <StarMark size={9} /> <StarMark size={20} />
        </div>
        <p className="eyebrow">Drop 01 · Lima, Perú · Est. 2025</p>
        <h1 className="hero-title">2005 STUDIO</h1>
        <p className="hero-sub">
          Diseños que hablan de lo que nos gusta.<br />Ropa para los que siempre hacen lo suyo.
        </p>
        <a href="#tienda" className="hero-cta">
          Ver la colección <ChevronRight size={16} />
        </a>
      </section>

      {/* Product grid */}
      <section className="tienda" id="tienda">
        <div className="wrap">
          <div className="section-head">
            <h2>Colección — Drop 01</h2>
            <p>12 diseños en edición limitada. Polos oversize de algodón premium, estampado DTF.</p>
          </div>
          <div className="grid">
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="nosotros">
        <div className="wrap footer-inner">
          <div className="brandmark light">
            <StarMark size={18} />
            <span>2005<em>STUDIO</em></span>
          </div>
          <p className="footer-tag">Streetwear independiente hecho en Lima, Perú.</p>
          <div className="social-row">
            <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><IconInstagram /></a>
            <a href={SOCIALS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><IconFacebook /></a>
            <a href={SOCIALS.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"><IconTiktok /></a>
            <a href={"https://wa.me/" + SOCIALS.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><IconWhatsapp /></a>
          </div>
          <p className="footer-small">© 2025 2005 Studio. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Cart drawer */}
      <div className={"overlay" + (cartOpen ? " show" : "")} onClick={() => setCartOpen(false)} />
      <aside className={"drawer" + (cartOpen ? " open" : "")}>
        <div className="drawer-head">
          <h3>Tu carrito</h3>
          <button onClick={() => setCartOpen(false)}><X size={20} /></button>
        </div>
        <div className="drawer-body">
          {cart.length === 0 && <p className="empty-msg">Tu carrito está vacío. Elige un diseño de la colección.</p>}
          {cart.map((item) => (
            <div className="cart-item" key={item.key}>
              <img src={item.img} alt={item.name} />
              <div className="cart-item-info">
                <strong>{item.name}</strong>
                <span>{item.color} · Talla {item.size}</span>
                <span className="cart-item-price">{fmt(item.price)}</span>
              </div>
              <div className="qty-controls">
                <button onClick={() => updateQty(item.key, -1)}><Minus size={14} /></button>
                <span>{item.qty}</span>
                <button onClick={() => updateQty(item.key, 1)}><Plus size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="total-row">
              <span>Total</span>
              <strong>{fmt(cartTotal)}</strong>
            </div>
            <button className="checkout-btn" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
              Pagar con Yape
            </button>
          </div>
        )}
      </aside>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="modal-overlay" onClick={() => setCheckoutOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCheckoutOpen(false)}><X size={20} /></button>
            <h3>Paga con Yape</h3>
            <p className="modal-hint">1. Escanea el código y paga <strong>{fmt(cartTotal)}</strong>.<br/>2. Guarda la captura de tu pago.</p>
            <img className="qr-img" src={IMG.yapeQr} alt="Código QR de Yape" />
            <div className="modal-steps">
              <span className="step-badge">3</span>
              <p>Se abrirá WhatsApp con tu pedido ya escrito. <b>Antes de enviarlo</b>, toca el clip 📎 y adjunta tu captura de pago, así nos llega todo junto.</p>
            </div>
            <a
              className="wa-confirm-btn"
              href={"https://wa.me/" + SOCIALS.whatsapp + "?text=" + orderText}
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsapp /> Abrir WhatsApp con mi pedido
            </a>
            <button className="modal-secondary" onClick={() => setCheckoutOpen(false)}>Volver a la tienda</button>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap');

.app-root { font-family: 'Inter', sans-serif; background: #F7F3EA; color: #100F0D; }
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px; }

.topnav { position: sticky; top: 0; z-index: 30; background: #100F0D; color: #fff; }
.topnav-inner { display:flex; align-items:center; justify-content:space-between; height:58px; }
.brandmark { display:flex; align-items:center; gap:8px; font-family:'Anton', sans-serif; letter-spacing: .5px; font-size: 18px; }
.brandmark em { font-style: normal; color: #C9A34A; margin-left: 3px; }
.brandmark.light { color: #fff; justify-content:center; }
.topnav-links { display:flex; gap:22px; font-size: 13.5px; }
.topnav-links a { color: #cfcac2; text-decoration:none; }
.topnav-links a:hover { color: #fff; }
.cart-btn { position:relative; background:none; border:none; color:#fff; cursor:pointer; padding:6px; }
.cart-badge { position:absolute; top:-2px; right:-2px; background:#9A1F26; color:#fff; font-size:10px; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; }

.hero { background:#100F0D; color:#F7F3EA; text-align:center; padding: 70px 20px 84px; position:relative; overflow:hidden; }
.hero-stars { display:flex; justify-content:center; gap:14px; color:#C9A34A; margin-bottom:18px; opacity:.9; }
.eyebrow { font-size:12.5px; letter-spacing:1.5px; text-transform:uppercase; color:#a79f8f; margin:0 0 14px; }
.hero-title { font-family:'Anton', sans-serif; font-size: clamp(52px, 11vw, 108px); line-height:.92; margin:0; letter-spacing: 1px; }
.hero-sub { font-size:15.5px; color:#cfc9bd; margin:20px auto 0; max-width: 480px; line-height:1.55; }
.hero-cta { display:inline-flex; align-items:center; gap:6px; margin-top:30px; background:#F7F3EA; color:#100F0D; padding:13px 26px; border-radius:999px; text-decoration:none; font-weight:600; font-size:14px; transition: transform .18s ease; }
.hero-cta:hover { transform: translateY(-2px); }

.tienda { padding: 64px 0 80px; }
.section-head { text-align:center; max-width:520px; margin: 0 auto 40px; }
.section-head h2 { font-family:'Anton', sans-serif; font-size:30px; margin:0 0 10px; letter-spacing:.5px; }
.section-head p { color:#5c584f; font-size:14px; margin:0; }

.grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:18px; }
@media (max-width: 980px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .grid { grid-template-columns: 1fr; } .topnav-links{display:none;} }

.pcard { border-radius: 14px; overflow:hidden; display:flex; flex-direction:column; box-shadow: 0 1px 2px rgba(0,0,0,.06); transition: transform .18s ease, box-shadow .18s ease; }
.pcard:hover { transform: translateY(-4px); box-shadow: 0 14px 26px rgba(0,0,0,.14); }
.pcard-photo { aspect-ratio: 4/3; overflow:hidden; }
.pcard-photo img { width:100%; height:100%; object-fit:cover; display:block; }
.pcard-body { padding:14px 16px 16px; display:flex; flex-direction:column; gap:8px; }
.pcard-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; opacity:.75; font-weight:600; }
.pcard-name { font-family:'Anton', sans-serif; font-size:17px; margin:0; letter-spacing:.3px; }
.pcard-desc { font-size:12px; opacity:.75; margin:0; line-height:1.4; }
.color-row { display:flex; align-items:center; gap:6px; margin-top:2px; }
.color-dot { width:20px; height:20px; border-radius:50%; border:1.5px solid rgba(0,0,0,.15); cursor:pointer; padding:0; outline: 2px solid transparent; outline-offset:2px; }
.color-dot.active { outline-style: solid; outline-width: 2px; }
.color-label { font-size:11px; opacity:.7; margin-left:2px; }
.size-row { display:flex; gap:6px; margin-top:2px; }
.size-chip { width:30px; height:28px; border-radius:7px; border:1.4px solid; background:transparent; font-size:11.5px; font-weight:700; cursor:pointer; }
.add-btn { margin-top:6px; border:none; border-radius:9px; padding:10px; font-weight:700; font-size:13px; cursor:pointer; }

.footer { background:#100F0D; color:#cfc9bd; padding: 44px 0 30px; text-align:center; }
.footer-inner { display:flex; flex-direction:column; align-items:center; gap:10px; }
.footer-tag { font-size:13px; color:#a79f8f; margin:0; }
.social-row { display:flex; gap:16px; margin:8px 0; }
.social-row a { color:#F7F3EA; opacity:.85; }
.social-row a:hover { opacity:1; }
.footer-small { font-size:11px; color:#726c60; margin-top:6px; }

.overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); opacity:0; pointer-events:none; transition:opacity .25s ease; z-index:40; }
.overlay.show { opacity:1; pointer-events:auto; }

.drawer { position:fixed; top:0; right:-380px; width:360px; max-width:88vw; height:100%; background:#fff; z-index:50; box-shadow:-8px 0 24px rgba(0,0,0,.18); transition: right .3s ease; display:flex; flex-direction:column; }
.drawer.open { right:0; }
.drawer-head { display:flex; justify-content:space-between; align-items:center; padding:18px 20px; border-bottom:1px solid #eee; }
.drawer-head h3 { font-family:'Anton', sans-serif; margin:0; font-size:18px; }
.drawer-head button { background:none; border:none; cursor:pointer; }
.drawer-body { flex:1; overflow-y:auto; padding: 12px 20px; }
.empty-msg { color:#888; font-size:13px; margin-top:20px; }
.cart-item { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid #f0f0f0; align-items:center; }
.cart-item img { width:52px; height:52px; object-fit:cover; border-radius:8px; }
.cart-item-info { flex:1; display:flex; flex-direction:column; font-size:12.5px; }
.cart-item-info strong { font-size:13.5px; }
.cart-item-price { color:#9A1F26; font-weight:700; margin-top:2px; }
.qty-controls { display:flex; align-items:center; gap:6px; }
.qty-controls button { width:22px; height:22px; border-radius:6px; border:1px solid #ddd; background:#fafafa; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.drawer-foot { border-top:1px solid #eee; padding:16px 20px 22px; }
.total-row { display:flex; justify-content:space-between; font-size:15px; margin-bottom:12px; }
.checkout-btn { width:100%; background:#100F0D; color:#fff; border:none; border-radius:10px; padding:13px; font-weight:700; cursor:pointer; font-size:14px; }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:60; display:flex; align-items:center; justify-content:center; padding:20px; }
.modal { background:#fff; border-radius:16px; padding:26px; max-width:360px; width:100%; text-align:center; position:relative; }
.modal-close { position:absolute; top:14px; right:14px; background:none; border:none; cursor:pointer; }
.modal h3 { font-family:'Anton', sans-serif; margin:0 0 10px; font-size:20px; }
.modal-hint { font-size:12.5px; color:#555; line-height:1.5; margin:0 0 16px; }
.modal-steps { display:flex; gap:10px; align-items:flex-start; background:#f6f6f6; border-radius:10px; padding:10px 12px; text-align:left; margin-bottom:14px; }
.step-badge { background:#100F0D; color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; margin-top:1px; }
.modal-steps p { font-size:12px; color:#444; margin:0; line-height:1.5; }
.qr-img { width:100%; max-width:220px; border-radius:12px; margin:0 auto 16px; display:block; }
.wa-confirm-btn { display:flex; align-items:center; justify-content:center; gap:8px; background:#1E8449; color:#fff; text-decoration:none; padding:12px; border-radius:10px; font-weight:700; font-size:13.5px; margin-bottom:10px; }
.modal-secondary { background:none; border:none; color:#888; font-size:12.5px; cursor:pointer; text-decoration:underline; }
`;
