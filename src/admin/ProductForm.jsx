import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import SafeImage from '../components/ui/SafeImage';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { getProduct, listCategories, listSizes, saveProduct, SIZE_GROUPS } from '../services/catalog';
import { friendlyError } from '../lib/errors';
import { GENDERS } from '../config/store';

const EMPTY = {
  name: '', categoryId: '', gender: 'unisex', price: '', salePrice: '', shortDescription: '', description: '',
  images: [''], colors: [{ name: '', hex: '#111111' }], stock: {}, featured: false, isNew: true, active: true, tags: [],
};

const isUrl = (u) => /^https:\/\/\S+$/i.test(u) || /^\/\S+$/.test(u);

const validate = (f) => {
  const e = {};
  if (f.name.trim().length < 3) e.name = 'Mínimo 3 caracteres.';
  if (!f.categoryId) e.categoryId = 'Elige una categoría.';
  const price = Number(f.price);
  if (!(price > 0) || price > 99999) e.price = 'Precio no válido.';
  if (f.salePrice !== '' && f.salePrice != null) {
    const sale = Number(f.salePrice);
    if (!(sale > 0) || sale >= price) e.salePrice = 'Debe ser mayor a 0 y menor al precio regular.';
  }
  const imgs = f.images.map((u) => u.trim()).filter(Boolean);
  if (!imgs.length) e.images = 'Agrega al menos una imagen.';
  else if (imgs.some((u) => !isUrl(u))) e.images = 'Las imágenes deben ser URLs https://';
  if (!Object.keys(f.stock).length) e.stock = 'Activa al menos una talla.';
  if (Object.values(f.stock).some((n) => !Number.isInteger(Number(n)) || Number(n) < 0)) e.stock = 'El stock debe ser un número entero ≥ 0.';
  return e;
};

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === 'nuevo';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const [categories, sizes, product] = await Promise.all([
      listCategories({ includeInactive: true }),
      listSizes(),
      isNew ? null : getProduct(id),
    ]);
    return { categories, sizes, product };
  }, [id]);

  useEffect(() => {
    if (!data) return;
    if (data.product) {
      const p = data.product;
      setForm({
        ...EMPTY,
        ...p,
        price: String(p.price ?? ''),
        salePrice: p.salePrice != null ? String(p.salePrice) : '',
        images: p.images?.length ? p.images : [''],
        colors: p.colors?.length ? p.colors : [{ name: '', hex: '#111111' }],
        stock: { ...(p.stock || {}) },
      });
    } else if (isNew) {
      setForm({ ...EMPTY, categoryId: data.categories[0]?.id ?? '' });
    }
  }, [data, isNew]);

  const sizesByGroup = useMemo(() => {
    const groups = {};
    (data?.sizes ?? []).forEach((s) => { (groups[s.group] ||= []).push(s); });
    // Incluye tallas que el producto tenga pero ya no existan en la lista global.
    Object.keys(form.stock).forEach((label) => {
      if (!(data?.sizes ?? []).some((s) => s.label === label)) (groups.otras ||= []).push({ id: label, label });
    });
    return groups;
  }, [data, form.stock]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!isNew && !data.product) return <ErrorState message="Producto no encontrado." />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setList = (k, i, value) => setForm((f) => ({ ...f, [k]: f[k].map((x, j) => (j === i ? value : x)) }));
  const toggleSize = (label) => setForm((f) => {
    const stock = { ...f.stock };
    if (label in stock) delete stock[label]; else stock[label] = 0;
    return { ...f, stock };
  });

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) { toast.error('Revisa los campos marcados.'); return; }
    setSaving(true);
    try {
      const stock = Object.fromEntries(Object.entries(form.stock).map(([k, v]) => [k, Number(v)]));
      const savedId = await saveProduct(isNew ? null : id, { ...form, stock });
      toast.success(isNew ? 'Producto creado.' : 'Producto actualizado.');
      navigate(isNew ? `/admin/productos/${savedId}` : '/admin/productos', { replace: isNew });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const err = (k) => errors[k] && <span className="field-error">{errors[k]}</span>;

  return (
    <form onSubmit={submit} noValidate>
      <div className="admin-head">
        <div>
          <Link to="/admin/productos" className="small"><ArrowLeft size={14} /> Productos</Link>
          <h1>{isNew ? 'Nuevo producto' : 'Editar producto'}</h1>
        </div>
        <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? 'Guardando...' : 'Guardar producto'}</button>
      </div>

      <div className="form-layout">
        <div>
          <div className="panel">
            <div className="form-grid">
              <label className="field span-2"><span>Nombre *</span><input value={form.name} onChange={set('name')} maxLength={120} />{err('name')}</label>
              <label className="field">
                <span>Categoría *</span>
                <select value={form.categoryId} onChange={set('categoryId')}>
                  <option value="">Selecciona...</option>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inactiva)'}</option>)}
                </select>
                {err('categoryId')}
                {data.categories.length === 0 && <small className="text-danger">Primero <Link to="/admin/categorias">crea una categoría</Link>.</small>}
              </label>
              <label className="field">
                <span>Género</span>
                <select value={form.gender} onChange={set('gender')}>{GENDERS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
              </label>
              <label className="field"><span>Precio regular (S/) *</span><input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} />{err('price')}</label>
              <label className="field"><span>Precio oferta (S/)</span><input type="number" step="0.01" min="0" value={form.salePrice} onChange={set('salePrice')} placeholder="Opcional" />{err('salePrice')}</label>
              <label className="field span-2"><span>Descripción corta</span><input value={form.shortDescription} onChange={set('shortDescription')} maxLength={160} /></label>
              <label className="field span-2"><span>Descripción completa</span><textarea rows={5} value={form.description} onChange={set('description')} maxLength={3000} /></label>
              <label className="field span-2"><span>Etiquetas de búsqueda (separadas por coma)</span>
                <input value={(form.tags || []).join(', ')} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(',') }))} placeholder="oversize, algodón, verano" />
              </label>
            </div>
          </div>

          <div className="panel">
            <h3>Tallas y stock *</h3>
            <p className="muted small">Activa las tallas disponibles y escribe cuántas unidades hay de cada una. El stock baja al confirmar un pedido.</p>
            {Object.entries(sizesByGroup).map(([group, sizes]) => (
              <div key={group} className="size-group">
                <span className="filter-title">{SIZE_GROUPS.find((g) => g.id === group)?.label ?? 'Otras'}</span>
                <div className="size-stock">
                  {sizes.map((s) => {
                    const on = s.label in form.stock;
                    return (
                      <div key={s.id} className={`size-cell ${on ? 'on' : ''}`}>
                        <button type="button" onClick={() => toggleSize(s.label)} aria-pressed={on}>{s.label}</button>
                        {on && (
                          <input type="number" min="0" step="1" value={form.stock[s.label]} aria-label={`Stock talla ${s.label}`}
                            onChange={(e) => setForm((f) => ({ ...f, stock: { ...f.stock, [s.label]: e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))) } }))} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {(data.sizes ?? []).length === 0 && <p className="text-danger small">No hay tallas. <Link to="/admin/tallas">Créalas aquí</Link>.</p>}
            {err('stock')}
          </div>

          <div className="panel">
            <h3>Colores</h3>
            {form.colors.map((c, i) => (
              <div key={i} className="color-row">
                <input type="color" value={c.hex} onChange={(e) => setList('colors', i, { ...c, hex: e.target.value })} aria-label="Color" />
                <input value={c.name} onChange={(e) => setList('colors', i, { ...c, name: e.target.value })} placeholder="Nombre (ej. Negro)" maxLength={30} />
                <button type="button" className="icon-btn danger" onClick={() => setForm((f) => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))} aria-label="Quitar color"><Trash2 size={16} /></button>
              </div>
            ))}
            {form.colors.length < 8 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, { name: '', hex: '#111111' }] }))}><Plus size={14} /> Agregar color</button>
            )}
          </div>
        </div>

        <div>
          <div className="panel">
            <h3>Imágenes *</h3>
            <p className="muted small">Pega URLs de imágenes (https). La primera es la principal; la segunda aparece al pasar el mouse.</p>
            {form.images.map((url, i) => (
              <div key={i} className="img-row">
                <SafeImage src={url} alt="" className="img-preview" />
                <input value={url} onChange={(e) => setList('images', i, e.target.value)} placeholder="images/13_mi_diseno.jpg o https://..." />
                <button type="button" className="icon-btn danger" onClick={() => setForm((f) => ({ ...f, images: f.images.length > 1 ? f.images.filter((_, j) => j !== i) : [''] }))} aria-label="Quitar imagen"><Trash2 size={16} /></button>
              </div>
            ))}
            {form.images.length < 8 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm((f) => ({ ...f, images: [...f.images, ''] }))}><Plus size={14} /> Agregar imagen</button>
            )}
            {err('images')}
          </div>
          <div className="panel">
            <h3>Visibilidad</h3>
            <label className="switch"><input type="checkbox" checked={form.active} onChange={set('active')} /><span>Publicado en la tienda</span></label>
            <label className="switch"><input type="checkbox" checked={form.featured} onChange={set('featured')} /><span>Destacado en el inicio</span></label>
            <label className="switch"><input type="checkbox" checked={form.isNew} onChange={set('isNew')} /><span>Marcar como nuevo</span></label>
          </div>
          <button type="submit" className="btn btn-gold btn-lg btn-block" disabled={saving}>{saving ? 'Guardando...' : 'Guardar producto'}</button>
        </div>
      </div>
    </form>
  );
}
