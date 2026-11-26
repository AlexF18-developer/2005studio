import { Link } from 'react-router-dom';
import SafeImage from '../ui/SafeImage';
import { moneyCents } from '../../lib/format';
import { paymentLabel } from '../../lib/orderStatus';

export default function OrderSummary({ order }) {
  return (
    <>
      <div className="order-meta">
        <div>
          <h4>Entrega</h4>
          <p><strong>{order.customer.name}</strong> · {order.customer.phone}</p>
          <p>{order.shipping.address}, {order.shipping.district}</p>
          {order.shipping.reference && <p className="muted small">Ref.: {order.shipping.reference}</p>}
        </div>
        <div>
          <h4>Pago</h4>
          <p>{paymentLabel(order.paymentMethod)}</p>
          {order.operationNumber && <p className="muted small">N° operación: {order.operationNumber}</p>}
          {order.notes && <p className="muted small">Notas: {order.notes}</p>}
        </div>
      </div>
      {order.items.map((i) => (
        <div key={`${i.productId}-${i.size}-${i.color}`} className="mini-line">
          <SafeImage src={i.image} alt="" />
          <div>
            <Link to={`/producto/${i.productId}`}><strong>{i.name}</strong></Link>
            <small>Talla {i.size}{i.color ? ` · ${i.color}` : ''} · {i.qty} x {moneyCents(i.priceCents)}</small>
          </div>
          <span>{moneyCents(i.priceCents * i.qty)}</span>
        </div>
      ))}
      <div className="sum-row"><span>Subtotal</span><span>{moneyCents(order.subtotalCents)}</span></div>
      <div className="sum-row"><span>Delivery</span><span>{moneyCents(order.shipping.costCents)}</span></div>
      <div className="sum-row sum-total"><span>Total</span><span>{moneyCents(order.totalCents)}</span></div>
    </>
  );
}
