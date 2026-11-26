import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { EmptyState, ErrorState, Spinner } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { listMyOrders } from '../services/orders';
import { updateMyProfile } from '../services/auth';
import { formatDate, moneyCents } from '../lib/format';
import { statusLabel, statusTone } from '../lib/orderStatus';
import { friendlyError } from '../lib/errors';

export default function Account() {
  const { user, profile, refresh } = useAuth();
  const toast = useToast();
  const { data: orders, loading, error, reload } = useAsync(() => listMyOrders(user.uid), [user.uid]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile) setForm({ name: profile.name || '', phone: profile.phone || '' }); }, [profile]);

  const save = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { toast.error('Ingresa tu nombre.'); return; }
    if (form.phone && !/^\+?[0-9 ]{9,15}$/.test(form.phone.trim())) { toast.error('Celular no válido.'); return; }
    setSaving(true);
    try {
      await updateMyProfile(user, form);
      await refresh();
      toast.success('Datos actualizados.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Mi cuenta" subtitle={user.email} />
      <section className="section-sm">
        <div className="container account-layout">
          <form className="panel" onSubmit={save}>
            <h3>Mis datos</h3>
            <label className="field"><span>Nombre</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></label>
            <label className="field"><span>Celular</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} /></label>
            <label className="field"><span>Correo</span><input value={user.email} disabled /></label>
            <button type="submit" className="btn btn-dark btn-block" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
          </form>

          <div className="panel">
            <h3>Mis pedidos</h3>
            {loading && <Spinner />}
            {error && <ErrorState message={error} onRetry={reload} />}
            {!loading && !error && orders?.length === 0 && (
              <EmptyState icon={Package} title="Aún no tienes pedidos" text="Cuando compres con tu cuenta, aquí verás su estado." action={{ to: '/catalogo', label: 'Ir al catálogo' }} />
            )}
            {orders?.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Código</th><th>Fecha</th><th>Total</th><th>Estado</th><th /></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="mono">{o.code}</td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>{moneyCents(o.totalCents)}</td>
                        <td><span className={`status status-${statusTone(o.status)}`}>{statusLabel(o.status)}</span></td>
                        <td><Link to={`/pedido/${o.code}`} className="btn btn-outline btn-sm">Ver</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
