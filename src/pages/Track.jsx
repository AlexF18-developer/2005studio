import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PackageSearch, Search } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import OrderTimeline from '../components/order/OrderTimeline';
import OrderSummary from '../components/order/OrderSummary';
import { trackOrder } from '../services/orders';
import { SHOWCASE_MODE } from '../services/catalog';
import { waConsulta } from '../lib/whatsapp';
import { formatDateTime } from '../lib/format';
import { statusLabel, statusTone } from '../lib/orderStatus';
import { friendlyError } from '../lib/errors';

export default function Track() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('codigo') || '');
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ loading: false, order: null, searched: false, error: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, order: null, searched: false, error: '' });
    try {
      const order = await trackOrder(code, email);
      setState({ loading: false, order, searched: true, error: '' });
    } catch (err) {
      setState({ loading: false, order: null, searched: true, error: friendlyError(err) });
    }
  };

  const { order } = state;
  return (
    <>
      <PageHeader title="Rastrear pedido" subtitle="Ingresa tu código y el correo que usaste al comprar." />
      <section className="section-sm">
        <div className="container narrow">
          {SHOWCASE_MODE && (
            <div className="alert alert-info">El rastreo en línea se activará pronto. Mientras tanto, <a href={waConsulta()} target="_blank" rel="noopener noreferrer">consulta tu pedido por WhatsApp</a>.</div>
          )}
          <form className="panel track-form" onSubmit={submit}>
            <label className="field"><span>Código de pedido</span><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="2005-XXXXXXXX" required maxLength={13} /></label>
            <label className="field"><span>Correo electrónico</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={150} /></label>
            <button type="submit" className="btn btn-dark" disabled={state.loading}><Search size={16} /> {state.loading ? 'Buscando...' : 'Buscar'}</button>
          </form>

          {state.error && <div className="alert alert-danger">{state.error}</div>}
          {state.searched && !order && !state.error && (
            <div className="panel center">
              <PackageSearch size={48} className="gold" />
              <h3>No encontramos ese pedido</h3>
              <p className="muted">Verifica el código y el correo usado en la compra.</p>
            </div>
          )}

          {order && (
            <>
              <div className="panel">
                <div className="row-between">
                  <div><span className="muted small">Pedido</span><h3 className="mono">{order.code}</h3></div>
                  <span className={`status status-${statusTone(order.status)}`}>{statusLabel(order.status)}</span>
                </div>
                <OrderTimeline status={order.status} />
              </div>
              <div className="panel">
                <OrderSummary order={order} />
                <h4 className="mt-4">Historial</h4>
                <ul className="history">
                  {[...order.history].reverse().map((h, i) => (
                    <li key={i}>
                      <span className={`status status-${statusTone(h.status)}`}>{statusLabel(h.status)}</span>
                      <small className="muted">{formatDateTime(h.at)}</small>
                      {h.note && <p>{h.note}</p>}
                    </li>
                  ))}
                </ul>
                <Link to={`/pedido/${order.code}`} className="btn btn-outline btn-block mt-2">Ver pedido y pagar</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
