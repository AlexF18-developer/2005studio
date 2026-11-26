import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Instagram, PackageCheck, Ruler, Smartphone, Truck } from 'lucide-react';
import HeroCarousel from '../components/home/HeroCarousel';
import ProductRail from '../components/product/ProductRail';
import ProductCard from '../components/product/ProductCard';
import Reveal from '../components/ui/Reveal';
import Countdown from '../components/ui/Countdown';
import CountUp from '../components/ui/CountUp';
import SafeImage from '../components/ui/SafeImage';
import { EmptyStore, ErrorState, ProductGridSkeleton } from '../components/ui/Feedback';
import { useCatalog } from '../hooks/useCatalog';
import { LOOKBOOK, nextSaleEvent, STORE_IMAGE } from '../config/content';
import { STORE } from '../config/store';
import { hasSale } from '../lib/format';

const BENEFITS = [
  { icon: Truck, title: 'Delivery S/ 5', text: 'A todo Lima y Callao' },
  { icon: Smartphone, title: 'Yape y Plin', text: 'Paga en segundos' },
  { icon: Ruler, title: 'Tallas S, M y L', text: 'Revisa la guía de tallas' },
  { icon: PackageCheck, title: 'Compra segura', text: 'Rastrea tu pedido con tu código' },
];

export default function Home() {
  const { products, categories, categoryNames, loading, error, reload } = useCatalog();
  const event = useMemo(() => nextSaleEvent(), []);

  const featured = products.filter((p) => p.featured);
  const news = products.filter((p) => p.isNew);
  const offers = products.filter((p) => hasSale(p) && p.totalStock > 0).slice(0, 8);
  const counts = products.reduce((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] || 0) + 1 }), {});

  return (
    <>
      <HeroCarousel />

      <section className="benefits" id="beneficios">
        <div className="container benefits-grid">
          {BENEFITS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 100} className="benefit">
              <span className="benefit-icon"><Icon size={24} /></span>
              <div><strong>{title}</strong><small>{text}</small></div>
            </Reveal>
          ))}
        </div>
      </section>

      {error && <div className="container section"><ErrorState message={error} onRetry={reload} /></div>}
      {!loading && !error && products.length === 0 && <div className="container section-sm"><EmptyStore /></div>}

      {categories.length > 1 && <section className="section">
        <div className="container">
          <Reveal className="section-center">
            <span className="kicker">Explora</span>
            <h2 className="section-title">Compra por <span className="shine-text">categoría</span></h2>
          </Reveal>
          <div className="cat-grid">
            {categories.map((c, i) => (
              <Reveal key={c.id} effect="zoom" delay={i * 70}>
                <Link to={`/catalogo?categoria=${c.id}`} className="cat-tile">
                  <SafeImage src={c.image} alt={c.name} />
                  <div className="cat-info">
                    <h3>{c.name}</h3>
                    <span>{counts[c.id] || 0} prendas <ArrowRight size={14} /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>}

      {categories.length <= 1 && products.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="section-center">
              <span className="kicker">{STORE.collection} · Edición limitada</span>
              <h2 className="section-title">La <span className="shine-text">colección</span></h2>
              <p className="muted">{products.length} diseños. Polos oversize de algodón premium con estampado DTF.</p>
            </Reveal>
            <div className="product-grid">
              {products.slice(0, 8).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 90}><ProductCard product={p} categoryName={categoryNames[p.categoryId]} /></Reveal>
              ))}
            </div>
            <div className="center mt-4"><Link to="/catalogo" className="btn btn-outline">Ver los {products.length} diseños <ArrowRight size={16} /></Link></div>
          </div>
        </section>
      )}

      <section className="section section-dark">
        <div className="container">
          {loading ? <ProductGridSkeleton count={4} /> : (
            <ProductRail kicker="Lo más pedido" title="Favoritos del Drop" products={featured} categoryNames={categoryNames} />
          )}
        </div>
      </section>

      {event && (
        <section className="section-sm">
          <div className="container">
            <Reveal effect="zoom" className="promo-band">
              <div className="promo-bg" style={{ backgroundImage: `url(${STORE_IMAGE})` }} />
              <div className="promo-content">
                <span className="kicker kicker-light">Se viene</span>
                <h2>{event.name}</h2>
                <p>Asegura tu diseño antes de que se agote tu talla. Delivery a todo Lima por S/ 5.</p>
                <Countdown target={event.date} />
                <Link to="/catalogo" className="btn btn-gold btn-shine">Ver la colección <ArrowRight size={18} /></Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="section-center">
              <span className="kicker">Precios que enamoran</span>
              <h2 className="section-title">Ofertas</h2>
            </Reveal>
            <div className="product-grid">
              {offers.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 90}><ProductCard product={p} categoryName={categoryNames[p.categoryId]} /></Reveal>
              ))}
            </div>
            <div className="center mt-4"><Link to="/catalogo?ofertas=1" className="btn btn-outline">Ver todas las ofertas</Link></div>
          </div>
        </section>
      )}

      <section className="stats">
        <div className="container stats-grid">
          <div><strong><CountUp end={products.length || STORE.stats.designs} /></strong><span>Diseños en el {STORE.collection}</span></div>
          <div><strong><CountUp end={STORE.stats.sizes} /></strong><span>Tallas oversize</span></div>
          <div><strong><CountUp end={STORE.stats.districts} /></strong><span>Distritos con delivery</span></div>
          <div><strong>{STORE.stats.founded}</strong><span>Est. · Lima, Perú</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!loading && <ProductRail kicker="Recién salidos" title="Nuevos diseños" products={news} categoryNames={categoryNames} delay={3500} />}
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <Reveal className="section-center">
            <span className="kicker">{STORE.socials.instagramHandle}</span>
            <h2 className="section-title">Lookbook</h2>
            <p className="muted">Inspírate y etiquétanos en Instagram con tu outfit.</p>
          </Reveal>
          <div className="lookbook">
            {LOOKBOOK.map((src, i) => (
              <Reveal key={src} effect="zoom" delay={i * 60}>
                <a href={STORE.socials.instagram} target="_blank" rel="noopener noreferrer" className="look-item" aria-label="Ver en Instagram">
                  <SafeImage src={src} alt="Diseño de 2005 Studio" />
                  <span className="look-overlay"><Instagram size={28} /></span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
