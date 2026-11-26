import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp, MessageCircle, Truck, Smartphone, Sparkles, Shirt } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { STORE } from '../../config/store';
import { waConsulta } from '../../lib/whatsapp';
import { firebaseNotConfigured } from '../../firebaseConfig';

const TICKER = [
  { icon: Truck, text: `Delivery a todo Lima por solo S/ 5` },
  { icon: Smartphone, text: 'Paga fácil con Yape o Plin' },
  { icon: Sparkles, text: `${STORE.collection} disponible · edición limitada` },
  { icon: Shirt, text: `Envíos en ${STORE.delivery.eta}` },
  { icon: MessageCircle, text: `Atención por WhatsApp ${STORE.phoneDisplay}` },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {firebaseNotConfigured && import.meta.env.DEV && (
        <div className="config-warning">
          ⚠️ Firebase no está configurado: copia <code>.env.example</code> como <code>.env</code> con tus valores y reinicia <code>npm run dev</code>. Mientras tanto la tienda funciona en <strong>modo vitrina</strong> (pedidos por WhatsApp).
        </div>
      )}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map(({ icon: Icon, text }, i) => (
            <span key={i}><Icon size={14} /> {text}</span>
          ))}
        </div>
      </div>
      <Navbar />
      <main id="contenido">
        <Outlet />
      </main>
      <Footer />
      <a className="wa-float" href={waConsulta()} target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp">
        <MessageCircle size={28} />
        <span className="wa-tip">¿Te ayudamos? ¡Escríbenos!</span>
      </a>
      <button type="button" className={`to-top ${showTop ? 'show' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Volver arriba">
        <ArrowUp size={20} />
      </button>
    </>
  );
}
