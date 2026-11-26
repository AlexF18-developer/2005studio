import { useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addAdminByEmail, listAdmins, listUsers, removeAdmin } from '../services/auth';
import { formatDate } from '../lib/format';
import { friendlyError } from '../lib/errors';

export default function Admins() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(async () => {
    const [admins, users] = await Promise.all([listAdmins(), listUsers()]);
    return { admins, users };
  }, []);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await addAdminByEmail(email);
      toast.success(`${email} ahora es administrador.`);
      setEmail('');
      await reload();
    } catch (err) { toast.error(friendlyError(err)); } finally { setBusy(false); }
  };

  const remove = async (a) => {
    if (!window.confirm(`¿Quitar permisos de administrador a ${a.email}?`)) return;
    try {
      await removeAdmin(a.id);
      toast.success('Permisos retirados.');
      await reload();
    } catch (err) { toast.error(friendlyError(err)); }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const adminIds = new Set(data.admins.map((a) => a.id));

  return (
    <>
      <div className="admin-head"><h1>Administradores</h1></div>
      <form className="panel toolbar" onSubmit={add}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com (la persona debe estar registrada)" required />
        <button type="submit" className="btn btn-gold" disabled={busy}><ShieldCheck size={16} /> Hacer administrador</button>
      </form>
      <div className="admin-grid">
        <div className="panel">
          <h3>Administradores ({data.admins.length})</h3>
          {data.admins.map((a) => (
            <div key={a.id} className="row-between list-row">
              <span>{a.email} {a.id === user.uid && <span className="status status-gold">Tú</span>}</span>
              {a.id !== user.uid && <button type="button" className="icon-btn danger" onClick={() => remove(a)} aria-label="Quitar"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Clientes registrados ({data.users.length})</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nombre</th><th>Correo</th><th>Celular</th><th>Registro</th></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name} {adminIds.has(u.id) && <span className="status status-gold">Admin</span>}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
