import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX, X } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ProductCard from '../components/product/ProductCard';
import Reveal from '../components/ui/Reveal';
import { EmptyState, EmptyStore, ErrorState, ProductGridSkeleton } from '../components/ui/Feedback';
import { useCatalog } from '../hooks/useCatalog';
import { GENDERS } from '../config/store';
import { hasSale } from '../lib/format';

const SORTS = {
  relevancia: 'Destacados',
  nuevos: 'Más recientes',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
  vendidos: 'Más vendidos',
};
const PAGE = 12;

const effectivePrice = (p) => (hasSale(p) ? p.salePrice : p.price);
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const millis = (v) => v?.toMillis?.() ?? 0;

export default function Catalog() {
  const { products, categories, categoryNames, loading, error, reload } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const f = {
    q: params.get('q') || '',
    categoria: params.get('categoria') || '',
    genero: params.get('genero') || '',
    talla: params.get('talla') || '',
    ofertas: params.get('ofertas') === '1',
    min: params.get('min') || '',
    max: params.get('max') || '',
    orden: SORTS[params.get('orden')] ? params.get('orden') : 'relevancia',
  };

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
    setVisible(PAGE);
  };

  const allSizes = useMemo(() => {
    const set = new Set();
    products.forEach((p) => Object.keys(p.stock || {}).forEach((s) => set.add(s)));
    return [...set];
  }, [products]);

  const filtered = useMemo(() => {
    const q = norm(f.q);
    const min = Number(f.min) || 0;
    const max = Number(f.max) || Infinity;
    const list = products.filter((p) => {
      if (f.categoria && p.categoryId !== f.categoria) return false;
      if (f.genero && p.gender !== f.genero && p.gender !== 'unisex') return false;
      if (f.talla && !(Number(p.stock?.[f.talla]) > 0)) return false;
      if (f.ofertas && !hasSale(p)) return false;
      const price = effectivePrice(p);
      if (price < min || price > max) return false;
      if (q && !norm(`${p.name} ${p.shortDescription} ${categoryNames[p.categoryId]} ${(p.tags || []).join(' ')}`).includes(q)) return false;
      return true;
    });
    const sorters = {
      relevancia: (a, b) => (b.featured - a.featured) || ((b.totalStock > 0) - (a.totalStock > 0)) || millis(b.createdAt) - millis(a.createdAt),
      nuevos: (a, b) => millis(b.createdAt) - millis(a.createdAt),
      'precio-asc': (a, b) => effectivePrice(a) - effectivePrice(b),
      'precio-desc': (a, b) => effectivePrice(b) - effectivePrice(a),
      vendidos: (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
    };
    return [...list].sort(sorters[f.orden]);
  }, [products, categoryNames, f.q, f.categoria, f.genero, f.talla, f.ofertas, f.min, f.max, f.orden]);

  const category = categories.find((c) => c.id === f.categoria);
  const title = category?.name
    ?? (f.ofertas ? 'Ofertas' : f.genero ? `Moda ${GENDERS.find((g) => g.id === f.genero)?.label ?? ''}` : f.q ? `Resultados para "${f.q}"` : 'Catálogo');
  const subtitle = category?.description ?? 'Encuentra tu diseño: filtra por talla y precio, o búscalo por nombre.';
  const activeFilters = ['q', 'categoria', 'genero', 'talla', 'ofertas', 'min', 'max'].filter((k) => params.get(k));

  // Solo se muestra el filtro de género si el catálogo tiene prendas de más de un género.
  const genders = GENDERS.filter((g) => g.id !== 'unisex' && products.some((p) => p.gender === g.id));

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} image={category?.image} crumbs={category || f.q || f.ofertas || f.genero ? [{ label: 'Catálogo', to: '/catalogo' }] : []} />
      <section className="section-sm">
        <div className="container catalog">
          <aside className={`filters ${filtersOpen ? 'open' : ''}`} aria-label="Filtros">
            <div className="filters-head">
              <h3>Filtros</h3>
              <button type="button" className="icon-btn only-mobile" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros"><X /></button>
            </div>
            <label className="field">
              <span>Buscar</span>
              <input value={f.q} onChange={(e) => setParam('q', e.target.value.slice(0, 60))} placeholder="Nombre de la prenda" />
            </label>
            <div className="filter-group">
              <span className="filter-title">Categoría</span>
              <button type="button" className={`filter-link ${!f.categoria ? 'active' : ''}`} onClick={() => setParam('categoria', '')}>Todas</button>
              {categories.map((c) => (
                <button key={c.id} type="button" className={`filter-link ${f.categoria === c.id ? 'active' : ''}`} onClick={() => setParam('categoria', c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
            {genders.length > 1 && <div className="filter-group">
              <span className="filter-title">Género</span>
              <div className="chips">
                {genders.map((g) => (
                  <button key={g.id} type="button" className={`chip-btn ${f.genero === g.id ? 'active' : ''}`} onClick={() => setParam('genero', f.genero === g.id ? '' : g.id)}>{g.label}</button>
                ))}
              </div>
            </div>}
            <div className="filter-group">
              <span className="filter-title">Talla</span>
              <div className="chips">
                {allSizes.map((s) => (
                  <button key={s} type="button" className={`chip-btn ${f.talla === s ? 'active' : ''}`} onClick={() => setParam('talla', f.talla === s ? '' : s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-title">Precio (S/)</span>
              <div className="row-2">
                <input type="number" min="0" value={f.min} onChange={(e) => setParam('min', e.target.value)} placeholder="Mín" aria-label="Precio mínimo" />
                <input type="number" min="0" value={f.max} onChange={(e) => setParam('max', e.target.value)} placeholder="Máx" aria-label="Precio máximo" />
              </div>
            </div>
            {(f.ofertas || products.some(hasSale)) && (
              <label className="switch">
                <input type="checkbox" checked={f.ofertas} onChange={(e) => setParam('ofertas', e.target.checked ? '1' : '')} />
                <span>Solo ofertas</span>
              </label>
            )}
            {activeFilters.length > 0 && (
              <button type="button" className="btn btn-link" onClick={() => { setParams({}, { replace: true }); setVisible(PAGE); }}>
                Limpiar filtros
              </button>
            )}
          </aside>
          {filtersOpen && <div className="backdrop" onClick={() => setFiltersOpen(false)} aria-hidden="true" />}

          <div className="catalog-main">
            <div className="catalog-bar">
              <button type="button" className="btn btn-outline btn-sm only-mobile" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal size={16} /> Filtros {activeFilters.length > 0 && `(${activeFilters.length})`}
              </button>
              <span className="muted"><strong>{filtered.length}</strong> prendas</span>
              <select value={f.orden} onChange={(e) => setParam('orden', e.target.value === 'relevancia' ? '' : e.target.value)} aria-label="Ordenar">
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {error && <ErrorState message={error} onRetry={reload} />}
            {loading && <ProductGridSkeleton />}
            {!loading && !error && products.length === 0 && <EmptyStore />}
            {!loading && !error && products.length > 0 && filtered.length === 0 && (
              <EmptyState icon={SearchX} title="No encontramos prendas con esos filtros" text="Prueba con otra búsqueda o limpia los filtros." action={{ to: '/catalogo', label: 'Ver todo el catálogo' }} />
            )}
            <div className="product-grid grid-3">
              {filtered.slice(0, visible).map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 80}><ProductCard product={p} categoryName={categoryNames[p.categoryId]} /></Reveal>
              ))}
            </div>
            {visible < filtered.length && (
              <div className="center mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setVisible((v) => v + PAGE)}>
                  Ver más ({filtered.length - visible} restantes)
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
