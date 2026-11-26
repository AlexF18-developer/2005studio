import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Database, FolderTree, LayoutDashboard, LogOut, Menu, Receipt, Ruler, Shield, Shirt, Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth';
import { STORE } from '../config/store';
import { initials } from '../lib/format';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { group: 'Ventas' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Receipt },
  { group: 'Catálogo' },
  { to: '/admin/productos', label: 'Productos', icon: Shirt },
  { to: '/admin/categorias', label: 'Categorías', icon: FolderTree },
  { to: '/admin/tallas', label: 'Tallas', icon: Ruler },
  { group: 'Sistema' },
  { to: '/admin/administradores', label: 'Administradores', icon: Shield },
  { to: '/admin/datos', label: 'Catálogo inicial', icon: Database },
];

export default function AdminLayout() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const name = profile?.name || user?.email || 'Admin';

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <Link to="/admin" className="admin-brand">
          <span className="brand-mark">{STORE.shortName}</span>
          <small>Administración</small>
        </Link>
        <nav onClick={() => setOpen(false)}>
          {MENU.map((m) => (m.group
            ? <div key={m.group} className="admin-group">{m.group}</div>
            : (
              <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                <m.icon size={18} /> {m.label}
              </NavLink>
            )))}
          <div className="admin-group">Tienda</div>
          <Link to="/" className="admin-link"><Store size={18} /> Ver tienda</Link>
        </nav>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className="admin-main">
        <header className="admin-top">
          <button type="button" className="icon-btn only-mobile" onClick={() => setOpen(true)} aria-label="Menú"><Menu /></button>
          <span className="muted small hide-mobile">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <div className="admin-user">
            <span className="avatar">{initials(name)}</span>
            <span className="hide-mobile">{name}</span>
            <button type="button" className="icon-btn" onClick={doLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
