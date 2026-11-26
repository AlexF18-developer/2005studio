import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import SafeImage from '../components/ui/SafeImage';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { deleteCategory, listAllProducts, listCategories, saveCategory } from '../services/catalog';
import { friendlyError } from '../lib/errors';

const EMPTY = { name: '', description: '', image: '', order: 0, active: true };

export default function Categories() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(async () => {
    const [categories, products] = await Promise.all([listCategories({ includeInactive: true }), listAllProducts()]);
    return { categories, products };
  }, []);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const open = (c) => {
    setEditing(c ? c.id : 'new');
    setForm(c ? { name: c.name, description: c.description || '', image: c.image || '', order: c.order ?? 0, active: c.active !== false }
      : { ...EMPTY, order: (data?.categories.length ?? 0) + 1 });
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { toast.error('El nombre debe tener al menos 2 caracteres.'); return; }
    if (form.image && !/^https:\/\/\S+$/i.test(form.image.trim())) { toast.error('La imagen debe ser una URL https://'); return; }
    setSaving(true);
    try {
      await saveCategory(editing === 'new' ? null : editing, form);
      toast.success('Categoría guardada.');
      setEditing(null);
      await reload();
    } catch (err) { toast.error(friendlyError(err)); } finally { setSaving(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
    try {
      await deleteCategory(c.id);
      toast.success('Categoría eliminada.');
      await reload();
    } catch (err) { toast.error(friendlyError(err)); }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const count = (id) => data.products.filter((p) => p.categoryId === id).length;

  return (
    <>
      <div className="admin-head">
        <h1>Categorías</h1>
        <button type="button" className="btn btn-gold" onClick={() => open(null)}><Plus size={16} /> Nueva categoría</button>
      </div>

      {editing && (
        <form className="panel form-card" onSubmit={save}>
          <div className="row-between"><h3>{editing === 'new' ? 'Nueva categoría' : 'Editar categoría'}</h3><button type="button" className="icon-btn" onClick={() => setEditing(null)} aria-label="Cerrar"><X /></button></div>
          <div className="form-grid">
            <label className="field"><span>Nombre *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} required /></label>
            <label className="field"><span>Orden</span><input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></label>
            <label className="field span-2"><span>Descripción</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200} /></label>
            <label className="field span-2"><span>URL de imagen</span><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></label>
            {form.image && <SafeImage src={form.image} alt="" className="img-preview lg" />}
            <label className="switch"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><span>Visible en la tienda</span></label>
          </div>
          <button type="submit" className="btn btn-dark" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </form>
      )}

      <div className="panel p-0">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Categoría</th><th>Productos</th><th>Orden</th><th>Estado</th><th className="right">Acciones</th></tr></thead>
            <tbody>
              {data.categories.map((c) => (
                <tr key={c.id}>
                  <td><div className="cell-product"><SafeImage src={c.image} alt="" /><div><strong>{c.name}</strong><br /><small className="muted">{c.description}</small></div></div></td>
                  <td>{count(c.id)}</td>
                  <td>{c.order}</td>
                  <td><span className={`status status-${c.active !== false ? 'success' : 'muted'}`}>{c.active !== false ? 'Visible' : 'Oculta'}</span></td>
                  <td className="right nowrap">
                    <button type="button" className="icon-btn" onClick={() => open(c)} aria-label="Editar"><Pencil size={16} /></button>
                    <button type="button" className="icon-btn danger" onClick={() => remove(c)} aria-label="Eliminar"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {data.categories.length === 0 && <tr><td colSpan={5} className="center muted pad">Sin categorías.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
