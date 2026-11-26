import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Database } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { runSeeder } from '../services/seeder';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SIZES } from '../services/seedData';
import { friendlyError } from '../lib/errors';

export default function SeedData() {
  const toast = useToast();
  const [state, setState] = useState({ running: false, done: null, progress: 0 });

  const run = async () => {
    if (!window.confirm(`Se crearán/actualizarán ${SEED_CATEGORIES.length} categorías, ${SEED_SIZES.length} tallas y ${SEED_PRODUCTS.length} productos del Drop 01. Tus productos propios no se tocan. ¿Continuar?`)) return;
    setState({ running: true, done: null, progress: 0 });
    try {
      const result = await runSeeder((done, total) => setState((s) => ({ ...s, progress: Math.round((done / total) * 100) })));
      setState({ running: false, done: result, progress: 100 });
      toast.success('¡Drop 01 cargado!');
    } catch (e) {
      setState({ running: false, done: null, progress: 0 });
      toast.error(friendlyError(e));
    }
  };

  return (
    <>
      <div className="admin-head"><h1>Catálogo inicial (Seeder)</h1></div>
      <div className="panel narrow-panel">
        <Database size={44} className="gold" />
        <h3>Carga el Drop 01 en un clic</h3>
        <p>Firebase no usa archivos <code>.sql</code>: este botón crea directamente en tu base de datos:</p>
        <ul>
          <li><strong>{SEED_CATEGORIES.length} categorías</strong>: {SEED_CATEGORIES.map((c) => c.name).join(', ')}.</li>
          <li><strong>{SEED_SIZES.length} tallas</strong>: {SEED_SIZES.map((s) => s.label).join(', ')}.</li>
          <li><strong>{SEED_PRODUCTS.length} diseños</strong> con fotos, precios, colores y stock inicial por talla (ajústalo luego con tu inventario real).</li>
        </ul>
        <p className="muted small">Es seguro ejecutarlo varias veces: usa ids fijos, no duplica nada y no borra los productos que tú creaste. Ojo: los 12 diseños vuelven a su stock inicial, así que úsalo solo al empezar.</p>
        {state.running && <div className="progress"><span style={{ width: `${state.progress}%` }} /></div>}
        <button type="button" className="btn btn-gold btn-lg btn-shine" onClick={run} disabled={state.running}>
          {state.running ? `Cargando... ${state.progress}%` : 'Cargar catálogo Drop 01'}
        </button>
        {state.done && (
          <div className="alert alert-success mt-2">
            <CheckCircle2 size={18} /> Listo: {state.done.categories} categorías, {state.done.sizes} tallas y {state.done.products} productos.
            {' '}<Link to="/admin/productos">Ver productos</Link> · <Link to="/" target="_blank">Ver tienda</Link>
          </div>
        )}
      </div>
    </>
  );
}
