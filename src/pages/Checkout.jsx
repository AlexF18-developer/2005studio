import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Truck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import SafeImage from '../components/ui/SafeImage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createOrder } from '../services/orders';
import { SHOWCASE_MODE } from '../services/catalog';
import { waPedidoVitrina } from '../lib/whatsapp';
import { asset } from '../lib/asset';
import { moneyCents } from '../lib/format';
import { friendlyError } from '../lib/errors';
import { readJSON, writeJSON } from '../lib/storage';
import { PAYMENT_METHODS, STORE } from '../config/store';

const DRAFT_KEY = '2005studio:checkout:draft';
const PHONE = /^\+?[0-9 ]{9,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Ingresa tu nombre completo.';
  if (!EMAIL.test(f.email.trim())) e.email = 'Ingresa un correo válido.';
  if (!PHONE.test(f.phone.trim())) e.phone = 'Celular de 9 a 15 dígitos.';
  if (!STORE.delivery.districts.includes(f.district)) e.district = 'Selecciona tu distrito.';
  if (f.address.trim().length < 5) e.address = 'Ingresa la dirección completa.';
  if (!PAYMENT_METHODS.some((m) => m.id === f.paymentMethod)) e.paymentMethod = 'Elige cómo pagarás.';
  if (!f.accept) e.accept = 'Debes aceptar los términos de compra.';
  return e;
};

export default function Checkout() {
  const cart = useCart();
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const placed = useRef(false);
  const [form, setForm] = useState(() => ({
    name: '', email: '', phone: '', district: '', address: '', reference: '', notes: '', paymentMethod: 'yape', accept: false,
    ...readJSON(DRAFT_KEY, {}),
  }));

  // Prellenar con el perfil si el usuario inició sesión.
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      name: f.name || profile.name || '',
      email: f.email || profile.email || '',
      phone: f.phone || profile.phone || '',
    }));
  }, [profile]);

  // Guarda un borrador (sin datos de pago) por si el cliente recarga la página.
  useEffect(() => {
    const { accept, ...draft } = form;
    writeJSON(DRAFT_KEY, draft);
  }, [form]);

  // Tras confirmar, el carrito se vacía: no redirigir al carrito mientras navegamos al pedido.
  if (!cart.items.length && !placed.current) return <Navigate to="/carrito" replace />;

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Revisa los campos marcados.');
      document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (SHOWCASE_MODE) {
      // Sin Firebase: el pedido viaja completo por WhatsApp (se abre en el mismo clic para evitar bloqueos).
      window.open(waPedidoVitrina({ items: cart.items, form, subtotalCents: cart.subtotalCents }), '_blank', 'noopener');
      writeJSON(DRAFT_KEY, { ...form, address: '', reference: '', notes: '', accept: false });
      placed.current = true;
      toast.success('Te llevamos a WhatsApp para confirmar tu pedido.');
      navigate('/catalogo', { replace: true });
      cart.clear();
      return;
    }
    setSending(true);
    try {
      const code = await createOrder({ cartItems: cart.items, form, user });
      const mine = readJSON('2005studio:orders', []);
      writeJSON('2005studio:orders', [code, ...(Array.isArray(mine) ? mine : [])].slice(0, 20));
      writeJSON(DRAFT_KEY, { ...form, address: '', reference: '', notes: '', accept: false });
      placed.current = true;
      navigate(`/pedido/${code}?nuevo=1`, { replace: true });
      cart.clear();
    } catch (err) {
      console.error(err);
      setServerError(err.code === 'cart-changed' ? err.message : friendlyError(err));
      if (err.code === 'cart-changed') toast.error('Algunos productos cambiaron. Revisa tu carrito.');
    } finally {
      setSending(false);
    }
  };

  const err = (k) => errors[k] && <span className="field-error">{errors[k]}</span>;
  const totalCents = cart.subtotalCents + STORE.delivery.costCents;

  return (
    <>
      <PageHeader title="Finalizar compra" subtitle="Solo unos datos más y tu pedido estará en camino." crumbs={[{ label: 'Carrito', to: '/carrito' }]} />
      <section className="section-sm">
        <form className="container cart-layout" onSubmit={submit} noValidate>
          <div>
            {serverError && (
              <div className="alert alert-danger">
                {serverError} {serverError.includes('carrito') && <Link to="/carrito">Ir al carrito</Link>}
              </div>
            )}

            <div className="panel">
              <div className="step-title"><span>1</span><h3>Tus datos</h3></div>
              {!user && <p className="muted small">¿Tienes cuenta? <Link to="/login?next=/checkout">Inicia sesión</Link> para ver tus pedidos luego.</p>}
              <div className="form-grid">
                <label className="field"><span>Nombre completo *</span><input value={form.name} onChange={set('name')} autoComplete="name" maxLength={100} />{err('name')}</label>
                <label className="field"><span>Celular *</span><input value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="987 654 321" maxLength={20} />{err('phone')}</label>
                <label className="field span-2"><span>Correo electrónico *</span><input type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={150} />{err('email')}<small className="muted">Con este correo y tu código podrás rastrear el pedido.</small></label>
              </div>
            </div>

            <div className="panel">
              <div className="step-title"><span>2</span><h3>Dirección de entrega</h3></div>
              <div className="form-grid">
                <label className="field">
                  <span>Distrito *</span>
                  <select value={form.district} onChange={set('district')}>
                    <option value="">Selecciona tu distrito...</option>
                    {STORE.delivery.districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {err('district')}
                </label>
                <label className="field"><span>Dirección *</span><input value={form.address} onChange={set('address')} autoComplete="street-address" placeholder="Av./Calle, número, dpto." maxLength={200} />{err('address')}</label>
                <label className="field span-2"><span>Referencia</span><input value={form.reference} onChange={set('reference')} placeholder="Frente al parque, puerta negra..." maxLength={200} /></label>
                <label className="field span-2"><span>Notas para la tienda</span><textarea value={form.notes} onChange={set('notes')} rows={2} maxLength={500} placeholder="Ej.: llamar antes de llegar" /></label>
              </div>
              <p className="muted small"><Truck size={14} /> Delivery a todo Lima: {moneyCents(STORE.delivery.costCents)} · {STORE.delivery.eta}</p>
            </div>

            <div className="panel">
              <div className="step-title"><span>3</span><h3>Método de pago</h3></div>
              <div className="pay-options">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.id} className={`pay-option ${form.paymentMethod === m.id ? 'active' : ''}`}>
                    <input type="radio" name="pay" value={m.id} checked={form.paymentMethod === m.id} onChange={set('paymentMethod')} />
                    <span className={`pay-logo ${m.className}`}>{m.label.slice(0, 5)}</span>
                    <span><strong>{m.label}</strong><small>{m.hint}</small></span>
                  </label>
                ))}
              </div>
              {err('paymentMethod')}
              <div className="pay-info">
                {form.paymentMethod === 'yape' && !SHOWCASE_MODE && <>Al confirmar verás el <strong>QR de Yape</strong> y el número <strong>{STORE.payments.yape.number}</strong> ({STORE.payments.yape.holder}).</>}
                {form.paymentMethod === 'yape' && SHOWCASE_MODE && (
                  <div className="center">
                    <img src={asset(STORE.payments.yape.qr)} alt="QR de Yape" className="yape-qr" />
                    Yapea <strong>{moneyCents(totalCents)}</strong> al <strong>{STORE.payments.yape.number}</strong> ({STORE.payments.yape.holder}), guarda la captura y adjúntala en WhatsApp.
                  </div>
                )}
                {form.paymentMethod === 'plin' && <>Plinea al <strong>{STORE.payments.plin.number}</strong> ({STORE.payments.plin.holder}) y registra tu N° de operación.</>}
                {form.paymentMethod === 'transferencia' && <>Transfiere a la cuenta{STORE.payments.transfer.bank ? ` ${STORE.payments.transfer.bank}` : ''} <strong>{STORE.payments.transfer.account}</strong>{STORE.payments.transfer.cci ? <> (CCI {STORE.payments.transfer.cci})</> : null} a nombre de {STORE.payments.transfer.holder}.</>}
              </div>
            </div>
          </div>

          <aside className="panel summary">
            <h3>Tu pedido</h3>
            {cart.items.map((i) => (
              <div key={i.key} className="mini-line">
                <SafeImage src={i.image} alt="" />
                <div><strong>{i.name}</strong><small>Talla {i.size}{i.color ? ` · ${i.color}` : ''} · x{i.qty}</small></div>
                <span>{moneyCents(i.priceCents * i.qty)}</span>
              </div>
            ))}
            <div className="sum-row"><span>Subtotal</span><span>{moneyCents(cart.subtotalCents)}</span></div>
            <div className="sum-row"><span>Delivery</span><span>{moneyCents(STORE.delivery.costCents)}</span></div>
            <div className="sum-row sum-total"><span>Total</span><span>{moneyCents(totalCents)}</span></div>
            <label className="check">
              <input type="checkbox" checked={form.accept} onChange={set('accept')} />
              <span>Acepto los <Link to="/terminos" target="_blank">términos de compra</Link> y la política de envíos.</span>
            </label>
            {err('accept')}
            <button type="submit" className="btn btn-gold btn-lg btn-block btn-shine" disabled={sending}>
              {sending ? <><span className="spinner spinner-sm" /> Procesando...</> : SHOWCASE_MODE ? <>Enviar pedido por WhatsApp</> : <><Lock size={16} /> Confirmar pedido</>}
            </button>
            <p className="muted small center">El precio final se verifica con el catálogo al confirmar.</p>
          </aside>
        </form>
      </section>
    </>
  );
}
