import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { listAllOrders } from '../services/orders';
import { formatDateTime, moneyCents } from '../lib/format';
import { STATUS, paymentLabel, statusLabel, statusTone } from '../lib/orderStatus';

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || '';
  const [q, setQ] = useState('');
  const { data: orders, loading, error, reload } = useAsync(() => listAllOrders(), []);

  const counts = useMemo(() => (orders ?? []).reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {}), [orders]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (orders ?? []).filter((o) => (!estado || o.status === estado)
      && (!term || [o.code, o.customer.name, o.customer.email, o.customer.phone].some((v) => v?.toLowerCase().includes(term))));
  }, [orders, estado, q]);

  if (loading && !orders) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <div className="admin-head">
        <h1>Pedidos <small className="muted">({orders.length})</small></h1>
        <button type="button" className="btn btn-outline" onClick={reload} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualizar</button>
      </div>
      <div className="status-tabs">
        <button type="button" className={!estado ? 'active' : ''} onClick={() => setParams({})}>Todos ({orders.length})</button>
        {Object.keys(STATUS).map((s) => (
          <button key={s} type="button" className={estado === s ? 'active' : ''} onClick={() => setParams({ estado: s })}>
            {statusLabel(s)} ({counts[s] || 0})
          </button>
        ))}
      </div>
      <div className="panel toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código, cliente, correo o celular" aria-label="Buscar" />
      </div>
      <div className="panel p-0">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Distrito</th><th>Pago</th><th>Total</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/admin/pedidos/${o.code}`} className="mono">{o.code}</Link><br /><small className="muted">{o.itemsCount} prenda(s)</small></td>
                  <td className="small">{formatDateTime(o.createdAt)}</td>
                  <td>{o.customer.name}<br /><small className="muted">{o.customer.phone}</small></td>
                  <td className="small">{o.shipping.district}</td>
                  <td className="small">{paymentLabel(o.paymentMethod)}{o.operationNumber && <><br /><span className="muted">Op. {o.operationNumber}</span></>}</td>
                  <td><strong>{moneyCents(o.totalCents)}</strong></td>
                  <td><span className={`status status-${statusTone(o.status)}`}>{statusLabel(o.status)}</span></td>
                  <td><Link to={`/admin/pedidos/${o.code}`} className="btn btn-outline btn-sm">Ver</Link></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="center muted pad">No hay pedidos con ese filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
