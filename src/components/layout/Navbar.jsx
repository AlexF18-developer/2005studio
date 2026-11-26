import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { logout } from '../../services/auth';
import { STORE } from '../../config/store';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/catalogo?categoria=drop-01', label: 'Drop 01', hot: true },
  { to: '/guia-de-tallas', label: 'Guía de tallas' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/seguimiento', label: 'Rastrear pedido' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [term, setTerm] = useState('');
  const { user, profile, isAdmin } = useAuth();
  const cart = useCart();
  const favorites = useFavorites();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const badgeRef = useRef(null);
  const prevCount = useRef(cart.count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setUserOpen(false); setSearchOpen(false); }, [location.pathname, location.search]);

  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 150); }, [searchOpen]);

  // Animación "pop" del contador cuando cambia el carrito.
  useEffect(() => {
    if (cart.count > prevCount.current && badgeRef.current) {
      badgeRef.current.classList.remove('pop');
      void badgeRef.current.offsetWidth;
      badgeRef.current.classList.add('pop');
    }
    prevCount.current = cart.count;
  }, [cart.count]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = term.trim().slice(0, 60);
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
    setTerm('');
  };

  const doLogout = async () => {
    await logout();
    toast.info('Cerraste sesión. ¡Vuelve pronto!');
    navigate('/');
  };

  const isActive = (to) => {
    const [path, qs] = to.split('?');
    if (qs) return location.pathname === path && location.search === `?${qs}`;
    return null;
  };

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <button type="button" className="icon-btn only-mobile" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu /></button>

          <Link to="/" className="brand" aria-label={`${STORE.name} inicio`}>
            <span className="brand-mark">{STORE.shortName}</span>
            <span className="brand-sub">{STORE.tagline}</span>
          </Link>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Principal">
            <button type="button" className="icon-btn only-mobile nav-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X /></button>
            {LINKS.map((l) => {
              const forced = isActive(l.to);
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive: a }) => `nav-link ${l.hot ? 'hot' : ''} ${(forced ?? (a && !l.to.includes('?'))) ? 'active' : ''}`}
                >
                  {l.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="nav-actions">
            <button type="button" className="icon-btn" onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar"><Search size={20} /></button>
            <Link to="/favoritos" className="icon-btn" aria-label="Favoritos">
              <Heart size={20} />
              {favorites.count > 0 && <span className="badge-count">{favorites.count}</span>}
            </Link>
            <Link to="/carrito" className="icon-btn" aria-label="Carrito">
              <ShoppingBag size={20} />
              {cart.count > 0 && <span ref={badgeRef} className="badge-count gold" data-testid="cart-count">{cart.count}</span>}
            </Link>
            {user ? (
              <div className="dropdown">
                <button type="button" className="icon-btn" onClick={() => setUserOpen((v) => !v)} aria-label="Mi cuenta" aria-expanded={userOpen}><User size={20} /></button>
                {userOpen && (
                  <div className="dropdown-menu" role="menu">
                    <div className="dropdown-head">Hola, <strong>{(profile?.name || user.displayName || 'cliente').split(' ')[0]}</strong></div>
                    {isAdmin && <Link to="/admin" className="dropdown-item"><LayoutDashboard size={16} /> Panel admin</Link>}
                    <Link to="/mi-cuenta" className="dropdown-item"><Package size={16} /> Mis pedidos</Link>
                    <Link to="/favoritos" className="dropdown-item"><Heart size={16} /> Favoritos</Link>
                    <button type="button" className="dropdown-item danger" onClick={doLogout}><LogOut size={16} /> Cerrar sesión</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="icon-btn" aria-label="Iniciar sesión"><User size={20} /></Link>
            )}
          </div>
        </div>

        <div className={`search-panel ${searchOpen ? 'open' : ''}`}>
          <form className="container search-form" onSubmit={submitSearch} role="search">
            <Search size={20} />
            <input
              ref={searchRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              maxLength={60}
              placeholder="Busca un diseño: Party, Cube, Vintage..."
              aria-label="Buscar productos"
            />
            <button type="submit" className="btn btn-gold btn-sm">Buscar</button>
          </form>
        </div>
      </header>
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
    </>
  );
}
