import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { discountPct, hasSale, money } from '../../lib/format';

const REASONS = {
  stock: 'No hay más stock de esa talla.',
  max: 'Llegaste al máximo por prenda.',
  lines: 'Tu carrito está lleno.',
};

export default function ProductCard({ product, categoryName }) {
  const cart = useCart();
  const favorites = useFavorites();
  const toast = useToast();

  const sizes = Object.entries(product.stock || {});
  const available = sizes.filter(([, qty]) => qty > 0).map(([size]) => size);
  const soldOut = available.length === 0;
  const fav = favorites.has(product.id);
  const url = `/producto/${product.id}`;
  const [img1, img2] = product.images || [];

  const quickAdd = (size) => {
    const result = cart.add(product, size, product.colors?.[0]?.name ?? null, 1);
    if (result.ok) toast.success(`${product.name} (${size}) se agregó al carrito 🛍️`);
    else toast.error(REASONS[result.reason]);
  };

  const toggleFav = () => {
    const added = favorites.toggle(product.id);
    toast.info(added ? 'Guardado en favoritos ❤️' : 'Quitado de favoritos');
  };

  return (
    <article className={`pcard ${soldOut ? 'is-soldout' : ''}`}>
      <div className="pcard-media">
        <Link to={url} aria-label={product.name} tabIndex={-1}>
          <SafeImage src={img1} alt={product.name} className="pcard-img" />
          {img2 && <SafeImage src={img2} alt="" className="pcard-img pcard-img-alt" />}
        </Link>
        <div className="pcard-badges">
          {soldOut && <span className="badge badge-dark">Agotado</span>}
          {!soldOut && hasSale(product) && <span className="badge badge-sale">-{discountPct(product)}%</span>}
          {product.isNew && <span className="badge badge-new">Nuevo</span>}
        </div>
        <button
          type="button"
          className={`pcard-fav ${fav ? 'active' : ''}`}
          onClick={toggleFav}
          aria-pressed={fav}
          aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
        </button>
        <div className="pcard-quick">
          {soldOut ? (
            <Link to={url} className="quick-btn"><Eye size={16} /> Ver detalle</Link>
          ) : (
            <>
              <span className="quick-label"><ShoppingBag size={14} /> Agregar talla:</span>
              <div className="quick-sizes">
                {sizes.map(([size, qty]) => (
                  <button key={size} type="button" disabled={qty <= 0} onClick={() => quickAdd(size)}>{size}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="pcard-body">
        {categoryName && <span className="pcard-cat">{categoryName}</span>}
        <h3 className="pcard-title"><Link to={url}>{product.name}</Link></h3>
        <div className="pcard-bottom">
          <div className="price">
            <span className="price-now">{money(hasSale(product) ? product.salePrice : product.price)}</span>
            {hasSale(product) && <span className="price-old">{money(product.price)}</span>}
          </div>
          {product.colors?.length > 0 && (
            <div className="swatches" aria-label="Colores">
              {product.colors.slice(0, 4).map((c) => (
                <span key={c.name} className="swatch" style={{ background: c.hex }} title={c.name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
