import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Truck, ShieldCheck, Ruler, MessageCircle, Shirt } from 'lucide-react';
import SafeImage from '../components/ui/SafeImage';
import ProductRail from '../components/product/ProductRail';
import { EmptyState, ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { getProduct, listActiveProducts, listCategories } from '../services/catalog';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { discountPct, hasSale, money } from '../lib/format';
import { waConsulta } from '../lib/whatsapp';
import { GENDERS, LOW_STOCK, MAX_QTY_PER_ITEM, STORE } from '../config/store';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const favorites = useFavorites();
  const toast = useToast();

  const { data, loading, error, reload } = useAsync(async () => {
    const [product, categories] = await Promise.all([getProduct(id), listCategories()]);
    if (!product || !product.active) return { product: null };
    const all = await listActiveProducts();
    const related = all.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 8);
    return { product, category: categories.find((c) => c.id === product.categoryId), related, categories };
  }, [id]);

  const product = data?.product;
  const [imgIndex, setImgIndex] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [tab, setTab] = useState('desc');
  const mediaRef = useRef(null);

  useEffect(() => {
    setImgIndex(0); setSize(''); setQty(1); setTab('desc');
    setColor(product?.colors?.[0]?.name ?? '');
    if (product) document.title = `${product.name} · ${STORE.name}`;
    return () => { document.title = `${STORE.name} · ${STORE.tagline}`; };
  }, [product]);

  const images = product?.images?.length ? product.images : [''];

  // Cambio automático de imagen cada 3 segundos (se pausa al hacer zoom).
  useEffect(() => {
    if (images.length < 2 || zoom) return undefined;
    const t = setInterval(() => setImgIndex((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length, zoom]);

  const sizes = useMemo(() => Object.entries(product?.stock || {}), [product]);
  const available = Number(product?.stock?.[size] ?? 0);
  const soldOut = product && sizes.every(([, q]) => q <= 0);
  const categoryNames = useMemo(() => Object.fromEntries((data?.categories ?? []).map((c) => [c.id, c.name])), [data]);

  if (loading) return <Spinner />;
  if (error) return <div className="container section"><ErrorState message={error} onRetry={reload} /></div>;
  if (!product) {
    return (
      <div className="container section">
        <EmptyState icon={Shirt} title="Esta prenda no está disponible" text="Puede que se haya agotado o retirado del catálogo." action={{ to: '/catalogo', label: 'Ver catálogo' }} />
      </div>
    );
  }

  const fav = favorites.has(product.id);
  const maxQty = Math.min(available, MAX_QTY_PER_ITEM);

  const addToCart = (goToCart = false) => {
    if (!size) {
      toast.error('Elige una talla.');
      return;
    }
    const result = cart.add(product, size, color || null, qty);
    if (!result.ok) {
      toast.error(result.reason === 'stock' ? 'Ya tienes en el carrito todo el stock de esta talla.' : 'No se pudo agregar al carrito.');
      return;
    }
    toast.success(`${product.name} (${size}) agregado al carrito 🛍️`);
    if (goToCart) navigate('/carrito');
  };

  const onMove = (e) => {
    const r = mediaRef.current.getBoundingClientRect();
    mediaRef.current.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    mediaRef.current.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <>
      <div className="container crumbs crumbs-dark">
        <Link to="/">Inicio</Link> / <Link to="/catalogo">Catálogo</Link>
        {data.category && <> / <Link to={`/catalogo?categoria=${data.category.id}`}>{data.category.name}</Link></>}
        {' / '}<span>{product.name}</span>
      </div>

      <section className="container detail">
        <div className="gallery">
          <div
            ref={mediaRef}
            className={`gallery-main ${zoom ? 'zoom' : ''}`}
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={onMove}
          >
            {images.map((src, i) => (
              <SafeImage key={src || i} src={src} alt={`${product.name} ${i + 1}`} className={i === imgIndex ? 'current' : ''} eager={i === 0} />
            ))}
            <div className="pcard-badges">
              {hasSale(product) && <span className="badge badge-sale">-{discountPct(product)}%</span>}
              {product.isNew && <span className="badge badge-new">Nuevo</span>}
            </div>
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button key={src} type="button" className={i === imgIndex ? 'active' : ''} onClick={() => setImgIndex(i)} aria-label={`Ver imagen ${i + 1}`}>
                  <SafeImage src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          {data.category && <span className="kicker">{data.category.name} · {GENDERS.find((g) => g.id === product.gender)?.label}</span>}
          <h1 className="detail-title">{product.name}</h1>
          <div className="price price-lg">
            <span className="price-now">{money(hasSale(product) ? product.salePrice : product.price)}</span>
            {hasSale(product) && <span className="price-old">{money(product.price)}</span>}
          </div>
          {product.shortDescription && <p className="muted">{product.shortDescription}</p>}

          {product.colors?.length > 0 && (
            <div className="option">
              <span className="option-label">Color: <strong>{color}</strong></span>
              <div className="color-options">
                {product.colors.map((c) => (
                  <button key={c.name} type="button" className={`color-dot ${color === c.name ? 'active' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c.name)} aria-label={c.name} title={c.name} />
                ))}
              </div>
            </div>
          )}

          <div className="option">
            <span className="option-label">Talla: <strong>{size || 'elige una'}</strong> <Link to="/guia-de-tallas" className="link-sm"><Ruler size={14} /> Guía de tallas</Link></span>
            <div className="size-options">
              {sizes.map(([s, q]) => (
                <button key={s} type="button" disabled={q <= 0} className={`size-btn ${size === s ? 'active' : ''}`} onClick={() => { setSize(s); setQty(1); }}>
                  {s}
                </button>
              ))}
            </div>
            {size && available > 0 && available <= LOW_STOCK && <p className="low-stock">🔥 ¡Solo quedan {available}!</p>}
          </div>

          {soldOut ? (
            <div className="alert alert-warning">Esta prenda está agotada. Escríbenos y te avisamos cuando vuelva.</div>
          ) : (
            <div className="buy-row">
              <div className="qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos"><Minus size={16} /></button>
                <span aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))} disabled={!size || qty >= maxQty} aria-label="Más"><Plus size={16} /></button>
              </div>
              <button type="button" className="btn btn-dark btn-lg grow" onClick={() => addToCart(false)}><ShoppingBag size={18} /> Agregar al carrito</button>
              <button
                type="button"
                className={`icon-btn icon-btn-lg ${fav ? 'fav-active' : ''}`}
                onClick={() => toast.info(favorites.toggle(product.id) ? 'Guardado en favoritos ❤️' : 'Quitado de favoritos')}
                aria-pressed={fav}
                aria-label="Favorito"
              >
                <Heart fill={fav ? 'currentColor' : 'none'} />
              </button>
            </div>
          )}
          {!soldOut && <button type="button" className="btn btn-gold btn-lg btn-block btn-shine" onClick={() => addToCart(true)}>Comprar ahora</button>}
          <a href={waConsulta(product.name)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block"><MessageCircle size={18} /> Consultar por WhatsApp</a>

          <ul className="perks">
            <li><Truck size={18} /> Delivery a todo Lima por {money(STORE.delivery.costCents / 100)} · {STORE.delivery.eta}</li>
            <li><ShieldCheck size={18} /> Paga con Yape, Plin o transferencia</li>
          </ul>

          <div className="tabs">
            <div className="tab-list" role="tablist">
              {[['desc', 'Descripción'], ['tallas', 'Tallas'], ['envio', 'Envío']].map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
              ))}
            </div>
            <div className="tab-panel">
              {tab === 'desc' && <p className="pre-line">{product.description || product.shortDescription}</p>}
              {tab === 'tallas' && (
                <ul className="stock-list">
                  {sizes.map(([s, q]) => <li key={s}><strong>{s}</strong> <span>{q > 0 ? `${q} disponible(s)` : 'Agotado'}</span></li>)}
                </ul>
              )}
              {tab === 'envio' && (
                <p>Enviamos a los {STORE.delivery.districts.length} distritos de Lima y Callao por {money(STORE.delivery.costCents / 100)}. Tiempo estimado: {STORE.delivery.eta} desde que confirmamos tu pago.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {data.related?.length > 0 && (
        <section className="section-sm">
          <div className="container">
            <ProductRail kicker="Completa tu look" title="También te puede gustar" products={data.related} categoryNames={categoryNames} />
          </div>
        </section>
      )}
    </>
  );
}
