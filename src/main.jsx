import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// HashRouter: las rutas (#/catalogo) funcionan en GitHub Pages aunque recargues la página.
import { HashRouter } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './styles/global.css';
import './styles/admin.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <App />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  </StrictMode>,
);
