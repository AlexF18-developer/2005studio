import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Crown, LogIn, ShieldAlert } from 'lucide-react';
import { Spinner } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { claimFirstAdmin, getSetupState } from '../services/auth';
import { friendlyError } from '../lib/errors';
import { firebaseNotConfigured } from '../firebaseConfig';

/**
 * Configuración inicial: el primer usuario que entra aquí se convierte en administrador.
 * Las reglas de Firestore garantizan que esto solo pueda ocurrir una vez.
 */
export default function Setup() {
  const { user, isAdmin, loading, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { data: setup, loading: loadingSetup, error } = useAsync(() => getSetupState(), []);

  if (loading || loadingSetup) return <section className="section"><Spinner /></section>;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const claim = async () => {
    setBusy(true);
    try {
      await claimFirstAdmin(user);
      await refresh();
      toast.success('¡Ahora eres el administrador de la tienda! 👑');
      navigate('/admin/datos');
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="container narrow">
        <div className="panel center setup">
          {firebaseNotConfigured && <div className="alert alert-danger">Firebase no está configurado. Completa el archivo <code>.env</code> (ver README).</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!user ? (
            <>
              <LogIn size={48} className="gold" />
              <h1>Panel de administración</h1>
              <p className="muted">Inicia sesión con una cuenta de administrador.</p>
              <div className="gap-row center">
                <Link to="/login?next=/admin" className="btn btn-dark">Iniciar sesión</Link>
                <Link to="/registro?next=/admin/setup" className="btn btn-outline">Crear cuenta</Link>
              </div>
            </>
          ) : setup ? (
            <>
              <ShieldAlert size={48} className="text-danger" />
              <h1>Acceso restringido</h1>
              <p className="muted">Tu cuenta (<strong>{user.email}</strong>) no es administradora. Pide a un administrador que te agregue desde <em>Administradores</em>.</p>
              <Link to="/" className="btn btn-outline">Volver a la tienda</Link>
            </>
          ) : (
            <>
              <Crown size={52} className="gold" />
              <h1>Configuración inicial</h1>
              <p>Aún no hay administrador. Conviértete en el <strong>primer administrador</strong> con la cuenta <strong>{user.email}</strong>.</p>
              <p className="muted small">Solo se puede hacer una vez. Después podrás agregar más administradores desde el panel.</p>
              <button type="button" className="btn btn-gold btn-lg btn-shine" onClick={claim} disabled={busy}>
                {busy ? 'Configurando...' : 'Convertirme en administrador'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
