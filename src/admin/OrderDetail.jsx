import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Map, MessageCircle, Printer } from 'lucide-react';
import OrderSummary from '../components/order/OrderSummary';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { changeOrderStatus, getOrder } from '../services/orders';
import { getProductsFresh } from '../services/catalog';
import { formatDateTime, moneyCents, unitPriceCents } from '../lib/format';
import { TRANSITIONS, paymentLabel, statusLabel, statusTone } from '../lib/orderStatus';
import { waToCustomer } from '../lib/whatsapp';
import { friendlyError } from '../lib/errors';
import { STORE } from '../config/store';

const ACTION_LABEL = {
  verificando: 'Marcar pago por verificar',
  confirmado: 'Confirmar pago (descuenta stock)',
  pendiente: 'Rechazar pago (volver a pendiente)',
  enviado: 'Marcar como enviado',
  entregado: 'Marcar como entregado',
  cancelado: 'Cancelar pedido',
};

export default function OrderDetail() {
  const { code } = useParams();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const order = await getOrder(code);
    if (!order) return { order: null };
    const products = await getProductsFresh(order.items.map((i) => i.productId));
    // Advierte si el precio pagado no coincide con el del catálogo (posible manipulación del navegador).
    const priceWarnings = order.items
      .filter((i) => products.has(i.productId) && unitPriceCents(products.get(i.productId)) !== i.priceCents)
      .map((i) => `${i.name}: pedido a ${moneyCents(i.priceCents)}, catálogo actual ${moneyCents(unitPriceCents(products.get(i.productId)))}`);
    const recomputed = order.items.reduce((s, i) => s + i.priceCents * i.qty, 0);
    if (recomputed !== order.subtotalCents) priceWarnings.push(`El subtotal guardado (${moneyCents(order.subtotalCents)}) no coincide con la suma de las prendas (${moneyCents(recomputed)}).`);
    return { order, priceWarnings };
  }, [code]);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data.order) return <ErrorState message="Pedido no encontrado." />;
  const { order, priceWarnings } = data;
  const next = TRANSITIONS[order.status] ?? [];

  const change = async (status) => {
    if (status === 'cancelado' && !window.confirm('¿Cancelar este pedido? Si ya se descontó el stock, se devolverá.')) return;
    setBusy(true);
    try {
      await changeOrderStatus(order.code, status, note);
      toast.success(`Pedido actualizado a "${statusLabel(status)}".`);
      setNote('');
      await reload();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const msgCliente = `Hola ${order.customer.name.split(' ')[0]}, te escribimos de ${STORE.name} 🛍️ sobre tu pedido ${order.code} (${statusLabel(order.status)}).`;

  return (
    <>
      <div className="admin-head no-print">
        <div>
          <Link to="/admin/pedidos" className="small"><ArrowLeft size={14} /> Pedidos</Link>
          <h1 className="mono">{order.code}</h1>
          <span className="muted small">Creado {formatDateTime(order.createdAt)}</span>
        </div>
        <div className="gap-row">
          <span className={`status status-${statusTone(order.status)} status-lg`}>{statusLabel(order.status)}</span>
          <button type="button" className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
        </div>
      </div>

      {priceWarnings.length > 0 && (
        <div className="alert alert-warning no-print">
          <AlertTriangle size={18} /> <strong>Revisa los montos antes de confirmar:</strong>
          <ul>{priceWarnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      <div className="admin-grid wide-left">
        <div className="panel print-area">
          <h2 className="only-print">{STORE.name} · Pedido {order.code}</h2>
          <OrderSummary order={order} />
          <div className="gap-row mt-2 no-print">
            <a className="btn btn-whatsapp btn-sm" href={waToCustomer(order.customer.phone, msgCliente)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp al cliente</a>
            <a className="btn btn-outline btn-sm" href={`mailto:${order.customer.email}?subject=${encodeURIComponent(`Tu pedido ${order.code}`)}`}>Correo: {order.customer.email}</a>
            <a className="btn btn-outline btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.shipping.address}, ${order.shipping.district}, Lima`)}`} target="_blank" rel="noopener noreferrer"><Map size={16} /> Mapa</a>
          </div>
        </div>

        <div className="no-print">
          <div className="panel">
            <h3>Pago</h3>
            <p>Método: <strong>{paymentLabel(order.paymentMethod)}</strong></p>
            <p>N° operación: <strong>{order.operationNumber || '—'}</strong></p>
            <p>Total a cobrar: <strong>{moneyCents(order.totalCents)}</strong></p>
            <p className="muted small">Stock descontado: {order.stockApplied ? 'Sí' : 'No'}</p>
            {order.status === 'verificando' && <div className="alert alert-info small">Verifica la operación en tu app de Yape/Plin antes de confirmar.</div>}
          </div>

          {next.length > 0 && (
            <div className="panel">
              <h3>Cambiar estado</h3>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Comentario opcional (el cliente lo verá en el seguimiento)" />
              <div className="state-actions">
                {next.map((s) => (
                  <button key={s} type="button" className={`state-btn ${s === 'cancelado' ? 'danger' : ''}`} disabled={busy} onClick={() => change(s)}>
                    {ACTION_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="panel">
            <h3>Historial</h3>
            <ul className="history">
              {[...order.history].reverse().map((h, i) => (
                <li key={i}>
                  <span className={`status status-${statusTone(h.status)}`}>{statusLabel(h.status)}</span>
                  <small className="muted">{formatDateTime(h.at)}</small>
                  {h.note && <p>{h.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
