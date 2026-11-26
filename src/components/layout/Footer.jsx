import { Link } from 'react-router-dom';
import { Clock, Facebook, Instagram, MapPin, MessageCircle, Music2, Phone } from 'lucide-react';
import { STORE } from '../../config/store';
import { waConsulta } from '../../lib/whatsapp';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              {['Streetwear', 'Drop 01', 'Oversize', 'Estampado DTF', 'Yape · Plin', 'Delivery S/ 5', 'Hecho en Lima'].map((t) => (
                <em key={t}>{t} ✦ </em>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="container footer-grid">
        <div>
          <Link to="/" className="brand brand-light">
            <span className="brand-mark">{STORE.shortName}</span>
            <span className="brand-sub">{STORE.tagline}</span>
          </Link>
          <p className="footer-text">Streetwear independiente hecho en Lima, Perú. Polos oversize de algodón premium con estampado DTF. {STORE.slogan}.</p>
          <div className="socials">
            <a href={STORE.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
            <a href={STORE.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={18} /></a>
            <a href={STORE.socials.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><Music2 size={18} /></a>
            <a href={waConsulta()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div>
          <h4>Tienda</h4>
          <ul>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/catalogo?categoria=drop-01">Drop 01</Link></li>
            <li><Link to="/favoritos">Favoritos</Link></li>
          </ul>
        </div>
        <div>
          <h4>Ayuda</h4>
          <ul>
            <li><Link to="/seguimiento">Rastrear pedido</Link></li>
            <li><Link to="/nosotros">Nosotros</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/guia-de-tallas">Guía de tallas</Link></li>
            <li><Link to="/mi-cuenta">Mi cuenta</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul className="contact-list">
            <li><MapPin size={16} /> {STORE.address} · {STORE.city}</li>
            <li><Phone size={16} /> <a href={waConsulta()} target="_blank" rel="noopener noreferrer">{STORE.phoneDisplay}</a></li>
            <li><Clock size={16} /> {STORE.hours}</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {year} {STORE.name}. Todos los derechos reservados.</span>
        <span className="pay-chips">
          <span className="chip pay-yape">Yape</span>
          <span className="chip pay-plin">Plin</span>
          <span className="chip pay-bank">Transferencia</span>
        </span>
      </div>
    </footer>
  );
}
