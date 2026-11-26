import { useMemo } from 'react';
import { useAsync } from './useAsync';
import { listActiveProducts, listCategories } from '../services/catalog';

/** Carga productos activos + categorías activas una sola vez (con caché de 60 s en el servicio). */
export function useCatalog() {
  const state = useAsync(async () => {
    const [products, categories] = await Promise.all([listActiveProducts(), listCategories()]);
    const activeCats = new Set(categories.map((c) => c.id));
    return { products: products.filter((p) => activeCats.has(p.categoryId)), categories };
  }, []);

  const categoryNames = useMemo(
    () => Object.fromEntries((state.data?.categories ?? []).map((c) => [c.id, c.name])),
    [state.data],
  );

  return {
    ...state,
    products: state.data?.products ?? [],
    categories: state.data?.categories ?? [],
    categoryNames,
  };
}
