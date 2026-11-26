import { Link } from 'react-router-dom';
import { Clock, Compass, Facebook, Instagram, MapPin, MessageCircle, Music2, Phone } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Reveal from '../components/ui/Reveal';
import SafeImage from '../components/ui/SafeImage';
import CountUp from '../components/ui/CountUp';
import { ABOUT_IMAGE, STORE_IMAGE } from '../config/content';
import { STORE } from '../config/store';
import { waConsulta } from '../lib/whatsapp';
import { moneyCents } from '../lib/format';

export function About() {
  return (
    <>
      <PageHeader title="Nosotros" subtitle={STORE.slogan} image={STORE_IMAGE} />
      <section className="section">
        <div className="container about">
          <Reveal effect="left"><SafeImage src={ABOUT_IMAGE} alt="Polos del Drop 01 de 2005 Studio" className="about-img" /></Reveal>
          <Reveal effect="right">
            <span className="kicker">Est. {STORE.stats.founded} · {STORE.city}</span>
            <h2 className="section-title">Diseños que hablan de <span className="shine-text">lo que nos gusta</span></h2>
            <p>{STORE.name} es una marca de streetwear independiente hecha en Lima. Cada drop es una edición limitada de polos oversize de algodón premium, con estampado DTF de alta calidad.</p>
            <p>Atendemos por WhatsApp, enviamos a todo Lima y aceptamos Yape y Plin. Con tu código de pedido puedes ver en qué estado está tu compra sin tener que preguntar.</p>
            <div className="about-stats">
              <div><strong><CountUp end={STORE.stats.designs} /></strong><span>diseños</span></div>
              <div><strong><CountUp end={STORE.stats.sizes} /></strong><span>tallas</span></div>
              <div><strong><CountUp end={STORE.stats.districts} /></strong><span>distritos</span></div>
            </div>
            <Link to="/catalogo" className="btn btn-gold btn-shine">Ver la colección</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function Contact() {
  const rows = [
    { icon: MessageCircle, title: 'WhatsApp', value: STORE.phoneDisplay, href: waConsulta() },
    { icon: MapPin, title: 'Dónde estamos', value: `${STORE.address} · ${STORE.city}` },
    { icon: Clock, title: 'Horario', value: STORE.hours },
    { icon: Instagram, title: 'Instagram', value: STORE.socials.instagramHandle, href: STORE.socials.instagram },
    { icon: Music2, title: 'TikTok', value: STORE.socials.tiktokHandle, href: STORE.socials.tiktok },
    { icon: Facebook, title: 'Facebook', value: STORE.name, href: STORE.socials.facebook },
  ];
  return (
    <>
      <PageHeader title="Contacto" subtitle="¿Dudas con tu talla o tu pedido? Escríbenos." />
      <section className="section-sm">
        <div className="container narrow">
          <div className="panel">
            {rows.map(({ icon: Icon, title, value, href }) => (
              <div key={title} className="contact-row">
                <span className="benefit-icon"><Icon size={20} /></span>
                <div>
                  <strong>{title}</strong>
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer">{value}</a> : <p>{value}</p>}
                </div>
              </div>
            ))}
            <a href={waConsulta()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block btn-lg"><Phone size={18} /> Chatear ahora</a>
          </div>
        </div>
      </section>
    </>
  );
}

// Medidas referenciales de polo oversize (prenda en plano). Ajústalas con las medidas reales de tus polos.
const SIZE_TABLE = [
  ['S', '54', '72', '23'],
  ['M', '57', '74', '24'],
  ['L', '60', '76', '25'],
];

export function SizeGuide() {
  return (
    <>
      <PageHeader title="Guía de tallas" subtitle="Polos oversize · medidas referenciales en centímetros." />
      <section className="section-sm">
        <div className="container narrow">
          <div className="panel">
            <h3>Polos oversize {STORE.collection}</h3>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Talla</th><th>Ancho (axila a axila)</th><th>Largo total</th><th>Manga</th></tr></thead>
                <tbody>{SIZE_TABLE.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{i === 0 ? <strong>{c}</strong> : c}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <h3 className="mt-4">¿Cómo elegir?</h3>
            <p className="muted">El corte es holgado y con hombro caído. Si te gusta un oversize marcado, elige tu talla de siempre; si prefieres un calce más ajustado, baja una talla. Mide un polo que te quede bien, en plano, y compáralo con la tabla.</p>
            <a href={waConsulta()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-2"><MessageCircle size={18} /> ¿Dudas? Te asesoramos</a>
          </div>
        </div>
      </section>
    </>
  );
}

export function Terms() {
  return (
    <>
      <PageHeader title="Términos de compra" />
      <section className="section-sm">
        <div className="container narrow panel legal">
          <p className="muted small">Texto referencial: revísalo y adáptalo a tu negocio.</p>
          <h3>1. Pedidos</h3>
          <p>El pedido se confirma cuando validamos tu pago con el número de operación. Hasta entonces el stock no queda reservado. Son ediciones limitadas: si una talla se agota, no se repone.</p>
          <h3>2. Precios y pagos</h3>
          <p>Precios en soles (S/). Aceptamos Yape, Plin y transferencia.</p>
          <h3>3. Envíos</h3>
          <p>Delivery a todo Lima y Callao por {moneyCents(STORE.delivery.costCents)}, en {STORE.delivery.eta} desde la confirmación del pago.</p>
          <h3>4. Cambios</h3>
          <p>Coordina cualquier cambio de talla por WhatsApp, sujeto a stock. La prenda debe estar sin uso, sin lavar y con etiquetas.</p>
          <h3>5. Datos personales</h3>
          <p>Usamos tus datos solo para procesar y entregar tu pedido, conforme a la Ley N.° 29733 de Protección de Datos Personales.</p>
        </div>
      </section>
    </>
  );
}

export function NotFound() {
  return (
    <section className="section">
      <div className="container empty">
        <div className="big-404 shine-text">404</div>
        <Compass size={48} className="empty-icon" />
        <h1>Esta página se fue de outfit</h1>
        <p className="muted">La página que buscas no existe o fue movida.</p>
        <div className="gap-row center">
          <Link to="/" className="btn btn-outline">Inicio</Link>
          <Link to="/catalogo" className="btn btn-dark">Ver catálogo</Link>
        </div>
      </div>
    </section>
  );
}
