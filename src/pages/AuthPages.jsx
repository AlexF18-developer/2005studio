import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { login, loginWithGoogle, register, resetPassword } from '../services/auth';
import { friendlyError } from '../lib/errors';
import { safeNext } from '../components/RouteGuards';
import { STORE } from '../config/store';

import { asset } from '../lib/asset';

const AUTH_IMAGE = asset('images/05_party.jpg');
const AUTH_IMAGE_2 = asset('images/08_cube.jpg');

function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-icon">
      <Lock size={16} />
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required minLength={6} maxLength={100} />
      <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/** Botón "Continuar con Google" + separador. */
function GoogleButton({ next, onError }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    onError('');
    setBusy(true);
    try {
      const u = await loginWithGoogle();
      toast.success(`¡Hola, ${(u.displayName || 'cliente').split(' ')[0]}! 👋`);
      navigate(next || '/', { replace: true });
    } catch (err) {
      onError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" className="btn btn-google btn-lg btn-block" onClick={go} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
        {busy ? 'Conectando...' : 'Continuar con Google'}
      </button>
      <div className="auth-divider"><span>o con tu correo</span></div>
    </>
  );
}

function AuthShell({ image, title, subtitle, children }) {
  return (
    <section className="auth">
      <div className="auth-card">
        <div className="auth-side" style={{ backgroundImage: `url(${image})` }}>
          <div className="auth-side-text">
            <span className="brand-mark">{STORE.shortName}</span>
            <p>{STORE.slogan}</p>
          </div>
        </div>
        <div className="auth-form">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

export function Login() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const { user, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido(a) de nuevo! 👋');
      navigate(next || '/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) { setError('Escribe tu correo arriba y vuelve a pulsar "¿Olvidaste tu contraseña?".'); return; }
    try {
      await resetPassword(email);
      toast.success('Te enviamos un correo para restablecer tu contraseña.');
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <AuthShell image={AUTH_IMAGE} title="Iniciar sesión" subtitle="Accede a tus pedidos y compra más rápido.">
      {error && <div className="alert alert-danger">{error}</div>}
      <GoogleButton next={next} onError={setError} />
      <form onSubmit={submit}>
        <label className="field"><span>Correo electrónico</span>
          <div className="input-icon"><Mail size={16} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required maxLength={150} /></div>
        </label>
        <label className="field"><span>Contraseña</span><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        <button type="button" className="btn btn-link btn-sm" onClick={forgot}>¿Olvidaste tu contraseña?</button>
        <button type="submit" className="btn btn-dark btn-lg btn-block" disabled={busy}>{busy ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
      <p className="center small mt-4">¿No tienes cuenta? <Link to={`/registro${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Regístrate gratis</Link></p>
    </AuthShell>
  );
}

export function Register() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const { user, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user && !busy) return <Navigate to={next || '/'} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Ingresa tu nombre completo.');
    if (form.phone && !/^\+?[0-9 ]{9,15}$/.test(form.phone.trim())) return setError('Celular no válido.');
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      return setError('La contraseña debe tener al menos 8 caracteres y combinar letras y números.');
    }
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.');
    setBusy(true);
    try {
      await register(form);
      toast.success('¡Cuenta creada! Bienvenido(a) 🎉');
      navigate(next || '/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
    return undefined;
  };

  return (
    <AuthShell image={AUTH_IMAGE_2} title="Crear cuenta" subtitle="Guarda tus datos y revisa el estado de tus pedidos.">
      {error && <div className="alert alert-danger">{error}</div>}
      <GoogleButton next={next} onError={setError} />
      <form onSubmit={submit}>
        <label className="field"><span>Nombre completo</span><div className="input-icon"><User size={16} /><input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={80} /></div></label>
        <label className="field"><span>Correo electrónico</span><div className="input-icon"><Mail size={16} /><input type="email" value={form.email} onChange={set('email')} autoComplete="email" required maxLength={150} /></div></label>
        <label className="field"><span>Celular (opcional)</span><div className="input-icon"><Phone size={16} /><input value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={20} /></div></label>
        <div className="form-grid">
          <label className="field"><span>Contraseña</span><PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" /></label>
          <label className="field"><span>Confirmar</span><PasswordInput value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></label>
        </div>
        <small className="muted">Mínimo 8 caracteres, con letras y números.</small>
        <button type="submit" className="btn btn-dark btn-lg btn-block mt-2" disabled={busy}>{busy ? 'Creando...' : 'Crear mi cuenta'}</button>
      </form>
      <p className="center small mt-4">¿Ya tienes cuenta? <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Inicia sesión</Link></p>
    </AuthShell>
  );
}
