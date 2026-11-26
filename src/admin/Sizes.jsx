import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { deleteSize, listSizes, saveSize, SIZE_GROUPS } from '../services/catalog';
import { friendlyError } from '../lib/errors';

export default function Sizes() {
  const toast = useToast();
  const { data: sizes, loading, error, reload } = useAsync(() => listSizes(), []);
  const [form, setForm] = useState({ label: '', group: 'ropa', order: '' });
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    const label = form.label.trim();
    if (!label || label.length > 8) { toast.error('Escribe una talla de 1 a 8 caracteres (ej. M, 32, 40).'); return; }
    setSaving(true);
    try {
      await saveSize(null, { ...form, order: form.order === '' ? (sizes?.length ?? 0) + 1 : form.order });
      toast.success(`Talla ${label.toUpperCase()} creada.`);
      setForm({ label: '', group: form.group, order: '' });
      await reload();
    } catch (err) { toast.error(friendlyError(err)); } finally { setSaving(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`¿Eliminar la talla ${s.label}?`)) return;
    try {
      await deleteSize(s.id);
      toast.success('Talla eliminada.');
      await reload();
    } catch (err) { toast.error(friendlyError(err)); }
  };

  if (loading && !sizes) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <div className="admin-head"><h1>Tallas</h1></div>
      <form className="panel toolbar" onSubmit={add}>
        <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Nueva talla (ej. XXL, 38)" maxLength={8} aria-label="Talla" />
        <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} aria-label="Grupo">
          {SIZE_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} placeholder="Orden" aria-label="Orden" className="w-90" />
        <button type="submit" className="btn btn-gold" disabled={saving}>Agregar</button>
      </form>
      {SIZE_GROUPS.map((g) => {
        const list = sizes.filter((s) => s.group === g.id);
        return (
          <div key={g.id} className="panel">
            <h3>{g.label} <small className="muted">({list.length})</small></h3>
            <div className="size-admin">
              {list.map((s) => (
                <span key={s.id} className="size-pill">
                  {s.label}
                  <button type="button" onClick={() => remove(s)} aria-label={`Eliminar ${s.label}`}><Trash2 size={13} /></button>
                </span>
              ))}
              {list.length === 0 && <span className="muted small">Sin tallas en este grupo.</span>}
            </div>
          </div>
        );
      })}
    </>
  );
}
