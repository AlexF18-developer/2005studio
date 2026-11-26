import { Heart } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ProductCard from '../components/product/ProductCard';
import Reveal from '../components/ui/Reveal';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/ui/Feedback';
import { useCatalog } from '../hooks/useCatalog';
import { useFavorites } from '../context/FavoritesContext';

export default function Favorites() {
  const favorites = useFavorites();
  const { products, categoryNames, loading, error, reload } = useCatalog();
  const list = favorites.ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  return (
    <>
      <PageHeader title="Mis favoritos" subtitle="Las prendas que te encantaron, guardadas en este dispositivo." />
      <section className="section-sm">
        <div className="container">
          {error && <ErrorState message={error} onRetry={reload} />}
          {loading && <ProductGridSkeleton count={4} />}
          {!loading && !error && list.length === 0 && (
            <EmptyState icon={Heart} title="Aún no tienes favoritos" text="Toca el corazón de cualquier prenda para guardarla aquí." action={{ to: '/catalogo', label: 'Descubrir prendas' }} />
          )}
          <div className="product-grid">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 80}><ProductCard product={p} categoryName={categoryNames[p.categoryId]} /></Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
