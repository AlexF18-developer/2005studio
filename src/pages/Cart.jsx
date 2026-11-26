import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import SafeImage from '../components/ui/SafeImage';
import { EmptyState, Spinner } from '../components/ui/Feedback';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { priceCart } from '../services/orders';
import { moneyCents } from '../lib/format';
import { friendlyError } from '../lib/errors';
import { STORE } from '../config/store';

export default function Cart() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [warnings, setWarnings] = useState([]);
  const [stockByKey, setStockByKey] = useState({});

  // Al abrir el carrito, valida precios y stock reales contra Firestore.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!cart.items.length) { setChecking(false); return; }
      try {
        const { lines, warnings: w } = await priceCart(cart.items);
        if (!alive) return;
        setWarnings(w);
        setStockByKey(Object.fromEntries(lines.map((l) => [l.key, l.available])));
        const changed = w.length > 0 || lines.some((l) => {
          const old = cart.items.find((i) => i.key === l.key);
          return !old || old.priceCents !== l.priceCents || old.qty !== l.qty;
        });
        if (changed) cart.syncWith(lines);
      } catch (e) {
        if (alive) toast.error(friendlyError(e));
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => { alive = false; };
    // Solo al montar: luego el usuario edita cantidades localmente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!cart.items.length && !checking) {
    return (
      <>
        <PageHeader title="Mi carrito" />
        <div className="container section">
          {warnings.map((w) => <div key={w} className="alert alert-warning">{w}</div>)}
          <EmptyState icon={ShoppingBag} title="Tu carrito está vacío" text="Descubre prendas con estilo y llévalas a tu puerta." action={{ to: '/catalogo', label: 'Ir al catálogo' }} />
        </div>
      </>
    );
  }

  const totalCents = cart.subtotalCents + STORE.delivery.costCents;

  return (
    <>
      <PageHeader title="Mi carrito" subtitle={`${cart.count} prenda(s) en tu bolsa`} />
      <section className="section-sm">
        <div className="container cart-layout">
          <div>
            {warnings.map((w) => <div key={w} className="alert alert-warning">{w}</div>)}
            {checking && <Spinner label="Verificando stock..." />}
            <div className="panel">
              {cart.items.map((i, idx) => {
                const max = Math.min(stockByKey[i.key] ?? 10, 10);
                return (
                  <div key={i.key} className="cart-line" style={{ animationDelay: `${idx * 70}ms` }}>
                    <Link to={`/producto/${i.productId}`} className="cart-img"><SafeImage src={i.image} alt={i.name} /></Link>
                    <div className="cart-info">
                      <Link to={`/producto/${i.productId}`} className="cart-name">{i.name}</Link>
                      <span className="muted small">Talla {i.size}{i.color ? ` · ${i.color}` : ''}</span>
                      <span className="price-now small">{moneyCents(i.priceCents)}</span>
                    </div>
                    <div className="qty qty-sm">
                      <button type="button" onClick={() => cart.setQty(i.key, i.qty - 1)} aria-label="Menos"><Minus size={14} /></button>
                      <span>{i.qty}</span>
                      <button type="button" onClick={() => cart.setQty(i.key, i.qty + 1)} disabled={i.qty >= max} aria-label="Más"><Plus size={14} /></button>
                    </div>
                    <strong className="cart-sub">{moneyCents(i.priceCents * i.qty)}</strong>
                    <button type="button" className="icon-btn" onClick={() => { cart.remove(i.key); toast.info('Prenda retirada del carrito.'); }} aria-label={`Quitar ${i.name}`}><Trash2 size={18} /></button>
                  </div>
                );
              })}
            </div>
            <button type="button" className="btn btn-link danger mt-2" onClick={() => { cart.clear(); toast.info('Vaciaste tu carrito.'); }}>Vaciar carrito</button>
          </div>

          <aside className="panel summary">
            <h3>Resumen</h3>
            <div className="sum-row"><span>Subtotal</span><span>{moneyCents(cart.subtotalCents)}</span></div>
            <div className="sum-row"><span><Truck size={16} /> Delivery (todo Lima)</span><span>{moneyCents(STORE.delivery.costCents)}</span></div>
            <div className="sum-row sum-total"><span>Total</span><span>{moneyCents(totalCents)}</span></div>
            <button type="button" className="btn btn-gold btn-lg btn-block btn-shine" disabled={checking} onClick={() => navigate('/checkout')}>
              Finalizar compra
            </button>
            <Link to="/catalogo" className="btn btn-link btn-block">Seguir comprando</Link>
            <div className="pay-chips center">
              <span className="chip pay-yape">Yape</span><span className="chip pay-plin">Plin</span><span className="chip pay-bank">Transferencia</span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
