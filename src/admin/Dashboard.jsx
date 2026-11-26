import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, DollarSign, PackageOpen, Receipt, Shirt, TrendingUp, Database } from 'lucide-react';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { listAllOrders } from '../services/orders';
import { listAllProducts } from '../services/catalog';
import { formatDate, moneyCents, toDate } from '../lib/format';
import { SALE_STATUSES, statusLabel, statusTone } from '../lib/orderStatus';
import { LOW_STOCK } from '../config/store';
import { useAuth } from '../context/AuthContext';

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function SalesChart({ series }) {
  const max = Math.max(...series.map((s) => s.total), 1);
  return (
    <div className="chart" role="img" aria-label="Ventas de los últimos 14 días">
      {series.map((s) => (
        <div key={s.label} className="chart-col" title={`${s.label}: ${moneyCents(s.total)}`}>
          <div className="chart-bar" style={{ height: `${(s.total / max) * 100}%` }}>
            {s.total > 0 && <span>{Math.round(s.total / 100)}</span>}
          </div>
          <small>{s.label}</small>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => {
    const [orders, products] = await Promise.all([listAllOrders(), listAllProducts()]);
    return { orders, products };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const { orders, products } = data;
    const now = new Date();
    const today = dayKey(now);
    const sales = orders.filter((o) => SALE_STATUSES.includes(o.status));
    const month = sales.filter((o) => {
      const d = toDate(o.createdAt);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const series = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (13 - i));
      const k = dayKey(d);
      return {
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        total: sales.filter((o) => toDate(o.createdAt) && dayKey(toDate(o.createdAt)) === k).reduce((s, o) => s + o.totalCents, 0),
      };
    });
    const top = new Map();
    sales.forEach((o) => o.items.forEach((i) => {
      const t = top.get(i.name) || { name: i.name, qty: 0, total: 0 };
      t.qty += i.qty; t.total += i.qty * i.priceCents;
      top.set(i.name, t);
    }));
    const lowStock = products
      .filter((p) => p.active)
      .flatMap((p) => Object.entries(p.stock || {}).filter(([, q]) => q <= LOW_STOCK).map(([size, q]) => ({ id: p.id, name: p.name, size, q })))
      .sort((a, b) => a.q - b.q)
      .slice(0, 8);
    return {
      salesToday: sales.filter((o) => toDate(o.createdAt) && dayKey(toDate(o.createdAt)) === today).reduce((s, o) => s + o.totalCents, 0),
      salesMonth: month.reduce((s, o) => s + o.totalCents, 0),
      avgTicket: month.length ? Math.round(month.reduce((s, o) => s + o.totalCents, 0) / month.length) : 0,
      pending: orders.filter((o) => o.status === 'pendiente').length,
      verifying: orders.filter((o) => o.status === 'verificando').length,
      toShip: orders.filter((o) => o.status === 'confirmado').length,
      products: products.length,
      activeProducts: products.filter((p) => p.active).length,
      series,
      top: [...top.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
      lowStock,
      latest: orders.slice(0, 8),
    };
  }, [data]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const kpis = [
    { icon: DollarSign, label: 'Ventas de hoy', value: moneyCents(stats.salesToday), tone: 'gold' },
    { icon: TrendingUp, label: 'Ventas del mes', value: moneyCents(stats.salesMonth), tone: 'green' },
    { icon: Clock, label: 'Pagos por verificar', value: stats.verifying, tone: 'blue', to: '/admin/pedidos?estado=verificando' },
    { icon: PackageOpen, label: 'Por despachar', value: stats.toShip, tone: 'purple', to: '/admin/pedidos?estado=confirmado' },
    { icon: Receipt, label: 'Pendientes de pago', value: stats.pending, tone: 'amber', to: '/admin/pedidos?estado=pendiente' },
    { icon: DollarSign, label: 'Ticket promedio (mes)', value: moneyCents(stats.avgTicket), tone: 'gold' },
    { icon: Shirt, label: 'Productos activos', value: `${stats.activeProducts} / ${stats.products}`, tone: 'green', to: '/admin/productos' },
    { icon: AlertTriangle, label: 'Tallas con stock bajo', value: stats.lowStock.length, tone: 'red' },
  ];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Hola, {(profile?.name || 'Admin').split(' ')[0]} 👋</h1>
          <p className="muted">Resumen de tu tienda.</p>
        </div>
        <div className="gap-row">
          <Link to="/admin/productos/nuevo" className="btn btn-gold">+ Nuevo producto</Link>
          <Link to="/admin/pedidos" className="btn btn-outline">Ver pedidos</Link>
        </div>
      </div>

      {stats.products === 0 && (
        <div className="alert alert-info">
          <Database size={18} /> Tu catálogo está vacío. <Link to="/admin/datos"><strong>Carga el Drop 01</strong></Link> para empezar en un clic.
        </div>
      )}

      <div className="kpi-grid">
        {kpis.map(({ icon: Icon, label, value, tone, to }, i) => {
          const body = (
            <>
              <span className={`kpi-icon tone-${tone}`}><Icon size={22} /></span>
              <span><small>{label}</small><strong>{value}</strong></span>
            </>
          );
          return to
            ? <Link key={label} to={to} className="kpi" style={{ animationDelay: `${i * 50}ms` }}>{body}</Link>
            : <div key={label} className="kpi" style={{ animationDelay: `${i * 50}ms` }}>{body}</div>;
        })}
      </div>

      <div className="admin-grid">
        <div className="panel">
          <h3>Ventas de los últimos 14 días <small className="muted">(confirmadas, S/)</small></h3>
          <SalesChart series={stats.series} />
        </div>
        <div className="panel">
          <h3>Más vendidos</h3>
          {stats.top.length === 0 && <p className="muted">Aún no hay ventas confirmadas.</p>}
          {stats.top.map((t) => (
            <div key={t.name} className="row-between list-row"><span>{t.name}</span><strong>{t.qty} u · {moneyCents(t.total)}</strong></div>
          ))}
        </div>
      </div>

      <div className="admin-grid">
        <div className="panel">
          <div className="row-between"><h3>Últimos pedidos</h3><Link to="/admin/pedidos" className="small">Ver todos</Link></div>
          {stats.latest.length === 0 ? <p className="muted">Sin pedidos todavía.</p> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Código</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>
                  {stats.latest.map((o) => (
                    <tr key={o.id}>
                      <td><Link to={`/admin/pedidos/${o.code}`} className="mono">{o.code}</Link></td>
                      <td>{o.customer.name}</td>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>{moneyCents(o.totalCents)}</td>
                      <td><span className={`status status-${statusTone(o.status)}`}>{statusLabel(o.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="panel">
          <h3>Stock bajo</h3>
          {stats.lowStock.length === 0 && <p className="muted">Todo el inventario está bien ✅</p>}
          {stats.lowStock.map((s) => (
            <div key={`${s.id}-${s.size}`} className="row-between list-row">
              <Link to={`/admin/productos/${s.id}`}>{s.name} · <strong>{s.size}</strong></Link>
              <span className={`status status-${s.q === 0 ? 'danger' : 'warning'}`}>{s.q} u</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
