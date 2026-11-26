import { Link } from 'react-router-dom';
import { asset } from '../../lib/asset';

export default function PageHeader({ title, subtitle, image, crumbs = [] }) {
  return (
    <header className="page-header">
      {image && <div className="page-header-bg" style={{ backgroundImage: `url(${asset(image)})` }} />}
      <div className="container page-header-content">
        <nav aria-label="breadcrumb" className="crumbs">
          <Link to="/">Inicio</Link>
          {crumbs.map((c) => (
            <span key={c.label}> / {c.to ? <Link to={c.to}>{c.label}</Link> : c.label}</span>
          ))}
          <span> / {title}</span>
        </nav>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
