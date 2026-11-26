import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Copy, MessageCircle, PackageSearch, Banknote, BadgeCheck } from 'lucide-react';
import { asset } from '../lib/asset';
import OrderTimeline from '../components/order/OrderTimeline';
import OrderSummary from '../components/order/OrderSummary';
import { EmptyState, ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { getOrder, reportPayment } from '../services/orders';
import { moneyCents } from '../lib/format';
import { statusLabel, statusTone, paymentLabel } from '../lib/orderStatus';
import { waPedido } from '../lib/whatsapp';
import { friendlyError } from '../lib/errors';
import { STORE } from '../config/store';

const copy = async (text, toast) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copiado ✨');
  } catch {
    toast.error('No se pudo copiar. Selecciónalo manualmente.');
  }
};

function Celebration() {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 6000); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => (
        <span key={i} style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 1.2}s`, animationDuration: `${2.5 + Math.random() * 2.5}s` }} />
      ))}
    </div>
  );
}

export default function OrderView() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get('nuevo') === '1';
  const toast = useToast();
  const { data: order, loading, error, reload } = useAsync(() => getOrder(code), [code]);
  const [op, setOp] = useState('');
  const [sending, setSending] = useState(false);

  if (loading) return <Spinner />;
  if (error) return <div className="container section"><ErrorState message={error} onRetry={reload} /></div>;
  if (!order) {
    return <div className="container section"><EmptyState icon={PackageSearch} title="Pedido no encontrado" text="Revisa el código e inténtalo nuevamente." action={{ to: '/seguimiento', label: 'Rastrear pedido' }} /></div>;
  }

  const pay = STORE.payments;
  const canReport = order.status === 'pendiente' && order.paymentMethod !== 'contraentrega';

  const submitOp = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await reportPayment(order, op);
      toast.success('¡Recibimos tu número de operación! Verificaremos tu pago.');
      setOp('');
      reload();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section-sm">
      {isNew && <Celebration />}
      <div className="container narrow">
        <div className="order-hero">
          {isNew && (
            <svg className="check-anim" viewBox="0 0 110 110" aria-hidden="true">
              <circle cx="55" cy="55" r="50" /><path d="M32 57 L48 72 L79 40" />
            </svg>
          )}
          {isNew ? <><span className="script">¡Gracias, {order.customer.name.split(' ')[0]}!</span><h1>Recibimos tu pedido</h1></> : <h1>Tu pedido</h1>}
          <p className="muted">Guarda tu código para rastrearlo:</p>
          <div className="order-code">
            <span>{order.code}</span>
            <button type="button" className="icon-btn" onClick={() => copy(order.code, toast)} aria-label="Copiar código"><Copy size={16} /></button>
          </div>
          <span className={`status status-${statusTone(order.status)}`}>{statusLabel(order.status)}</span>
        </div>

        <div className="panel"><OrderTimeline status={order.status} /></div>

        <div className="order-grid">
          <div className="panel center">
            {canReport ? (
              <>
                <h3>Completa tu pago</h3>
                <p className="muted small">Monto a pagar</p>
                <div className="big-amount">{moneyCents(order.totalCents)}</div>
                {order.paymentMethod === 'yape' && (
                  <>
                    <img src={asset(pay.yape.qr)} alt="QR de Yape" className="yape-qr" />
                    <p>Yapea al <strong>{pay.yape.number}</strong> <button type="button" className="icon-btn icon-btn-sm" onClick={() => copy(pay.yape.number.replace(/\s/g, ''), toast)} aria-label="Copiar número"><Copy size={14} /></button></p>
                    <p className="muted small">Titular: {pay.yape.holder}</p>
                  </>
                )}
                {order.paymentMethod === 'plin' && (
                  <>
                    <span className="pay-logo pay-plin big">Plin</span>
                    <p>Plinea al <strong>{pay.plin.number}</strong> <button type="button" className="icon-btn icon-btn-sm" onClick={() => copy(pay.plin.number.replace(/\s/g, ''), toast)} aria-label="Copiar número"><Copy size={14} /></button></p>
                    <p className="muted small">Titular: {pay.plin.holder}</p>
                  </>
                )}
                {order.paymentMethod === 'transferencia' && (
                  <>
                    <Banknote size={44} className="gold" />
                    <p>{pay.transfer.bank ? `${pay.transfer.bank} · ` : ''}Cuenta: <strong>{pay.transfer.account}</strong> <button type="button" className="icon-btn icon-btn-sm" onClick={() => copy(pay.transfer.account, toast)} aria-label="Copiar cuenta"><Copy size={14} /></button></p>
                    {pay.transfer.cci && <p className="small">CCI: <strong>{pay.transfer.cci}</strong></p>}
                    <p className="muted small">Titular: {pay.transfer.holder}</p>
                  </>
                )}
                <form onSubmit={submitOp} className="op-form">
                  <label className="field">
                    <span>N° de operación</span>
                    <div className="input-group">
                      <input value={op} onChange={(e) => setOp(e.target.value)} placeholder="Ej.: 12345678" maxLength={30} pattern="[A-Za-z0-9]{4,30}" required />
                      <button type="submit" className="btn btn-dark" disabled={sending}>{sending ? '...' : 'Enviar'}</button>
                    </div>
                  </label>
                  <small className="muted">Lo encuentras en el comprobante de tu app.</small>
                </form>
              </>
            ) : order.paymentMethod === 'contraentrega' && order.status === 'pendiente' ? (
              <>
                <Banknote size={48} className="gold" />
                <h3>Pago contra entrega</h3>
                <p className="muted">Ten listo <strong>{moneyCents(order.totalCents)}</strong> en efectivo. Te escribiremos por WhatsApp para confirmar.</p>
              </>
            ) : (
              <>
                <BadgeCheck size={48} className="gold" />
                <h3>{statusLabel(order.status)}</h3>
                <p className="muted">Método: {paymentLabel(order.paymentMethod)}</p>
              </>
            )}
            <a href={waPedido(order)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block btn-lg mt-2">
              <MessageCircle size={18} /> Enviar comprobante por WhatsApp
            </a>
          </div>
          <div className="panel"><h3>Resumen</h3><OrderSummary order={order} /></div>
        </div>

        <div className="center mt-4 gap-row">
          <Link to="/catalogo" className="btn btn-outline">Seguir comprando</Link>
          <Link to={`/seguimiento?codigo=${order.code}`} className="btn btn-dark">Rastrear pedido</Link>
        </div>
      </div>
    </section>
  );
}
