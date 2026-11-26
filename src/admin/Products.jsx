import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import SafeImage from '../components/ui/SafeImage';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { deleteProduct, listAllProducts, listCategories, setProductActive } from '../services/catalog';
import { hasSale, money } from '../lib/format';
import { friendlyError } from '../lib/errors';
import { LOW_STOCK } from '../config/store';

export default function Products() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(async () => {
    const [products, categories] = await Promise.all([listAllProducts(), listCategories({ includeInactive: true })]);
    return { products, categories };
  }, []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [busy, setBusy] = useState(null);

  const catNames = useMemo(() => Object.fromEntries((data?.categories ?? []).map((c) => [c.id, c.name])), [data]);
  const list = useMemo(() => (data?.products ?? [])
    .filter((p) => (!cat || p.categoryId === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name)), [data, q, cat]);

  const toggle = async (p) => {
    setBusy(p.id);
    try {
      await setProductActive(p.id, !p.active);
      toast.success(p.active ? 'Producto oculto de la tienda.' : 'Producto publicado.');
      await reload();
    } catch (e) { toast.error(friendlyError(e)); } finally { setBusy(null); }
  };

  const remove = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer. (Si solo quieres ocultarlo, usa el ojo.)`)) return;
    setBusy(p.id);
    try {
      await deleteProduct(p.id);
      toast.success('Producto eliminado.');
      await reload();
    } catch (e) { toast.error(friendlyError(e)); } finally { setBusy(null); }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <div className="admin-head">
        <h1>Productos <small className="muted">({data.products.length})</small></h1>
        <Link to="/admin/productos/nuevo" className="btn btn-gold"><Plus size={16} /> Nuevo producto</Link>
      </div>
      <div className="panel toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre..." aria-label="Buscar" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="panel p-0">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock por talla</th><th>Estado</th><th className="right">Acciones</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={busy === p.id ? 'busy' : ''}>
                  <td>
                    <div className="cell-product">
                      <SafeImage src={p.images?.[0]} alt="" />
                      <div>
                        <strong>{p.name}</strong>
                        <div className="tags">
                          {p.featured && <span className="status status-gold">Destacado</span>}
                          {p.isNew && <span className="status status-info">Nuevo</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{catNames[p.categoryId] ?? <span className="text-danger">Sin categoría</span>}</td>
                  <td>
                    {hasSale(p) ? <><strong className="text-danger">{money(p.salePrice)}</strong><br /><s className="muted small">{money(p.price)}</s></> : money(p.price)}
                  </td>
                  <td>
                    <div className="stock-chips">
                      {Object.entries(p.stock || {}).map(([s, n]) => (
                        <span key={s} className={`stock-chip ${n === 0 ? 'zero' : n <= LOW_STOCK ? 'low' : ''}`}>{s}: {n}</span>
                      ))}
                    </div>
                  </td>
                  <td><span className={`status status-${p.active ? 'success' : 'muted'}`}>{p.active ? 'Publicado' : 'Oculto'}</span></td>
                  <td className="right nowrap">
                    {p.active && <Link to={`/producto/${p.id}`} target="_blank" className="icon-btn" title="Ver en tienda"><Eye size={16} /></Link>}
                    <button type="button" className="icon-btn" onClick={() => toggle(p)} title={p.active ? 'Ocultar' : 'Publicar'} disabled={busy === p.id}>
                      {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <Link to={`/admin/productos/${p.id}`} className="icon-btn" title="Editar"><Pencil size={16} /></Link>
                    <button type="button" className="icon-btn danger" onClick={() => remove(p)} title="Eliminar" disabled={busy === p.id}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="center muted pad">No hay productos. <Link to="/admin/datos">Carga el Drop 01</Link> o crea uno nuevo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
