import { Link } from 'react-router-dom';
import { AlertTriangle, Store } from 'lucide-react';

export function Spinner({ label = 'Cargando...' }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card-skeleton">
          <div className="sk sk-img" />
          <div className="sk sk-line" />
          <div className="sk sk-line short" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={56} strokeWidth={1.3} className="empty-icon" />}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && (
        <Link to={action.to} className="btn btn-primary">{action.label}</Link>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty">
      <AlertTriangle size={48} className="empty-icon text-danger" />
      <h3>No pudimos cargar la información</h3>
      <p>{message}</p>
      {onRetry && <button type="button" className="btn btn-outline" onClick={onRetry}>Reintentar</button>}
    </div>
  );
}

/** Aviso cuando Firestore aún no tiene productos (tienda recién creada). */
export function EmptyStore() {
  return (
    <div className="empty panel">
      <Store size={56} strokeWidth={1.3} className="empty-icon" />
      <h3>La tienda aún no tiene productos</h3>
      <p className="muted">
        Si eres el administrador: crea tu cuenta, entra a <strong>/admin/setup</strong> y pulsa
        <strong> Cargar catálogo Drop 01</strong> (o crea tus prendas en <em>Admin → Productos</em>).
      </p>
      <Link to="/admin/setup" className="btn btn-primary">Configurar la tienda</Link>
    </div>
  );
}
