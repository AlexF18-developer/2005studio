import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { RequireAdmin, RequireAuth } from './components/RouteGuards';
import { Spinner } from './components/ui/Feedback';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderView from './pages/OrderView';
import Track from './pages/Track';
import Favorites from './pages/Favorites';
import Account from './pages/Account';
import { Login, Register } from './pages/AuthPages';
import { About, Contact, NotFound, SizeGuide, Terms } from './pages/InfoPages';

// El panel se carga bajo demanda: los clientes nunca descargan su código.
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const Products = lazy(() => import('./admin/Products'));
const ProductForm = lazy(() => import('./admin/ProductForm'));
const Categories = lazy(() => import('./admin/Categories'));
const Sizes = lazy(() => import('./admin/Sizes'));
const Orders = lazy(() => import('./admin/Orders'));
const OrderDetail = lazy(() => import('./admin/OrderDetail'));
const Admins = lazy(() => import('./admin/Admins'));
const SeedData = lazy(() => import('./admin/SeedData'));
const Setup = lazy(() => import('./admin/Setup'));

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalogo" element={<Catalog />} />
          <Route path="producto/:id" element={<ProductDetail />} />
          <Route path="carrito" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="pedido/:code" element={<OrderView />} />
          <Route path="seguimiento" element={<Track />} />
          <Route path="favoritos" element={<Favorites />} />
          <Route path="mi-cuenta" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />
          <Route path="nosotros" element={<About />} />
          <Route path="contacto" element={<Contact />} />
          <Route path="guia-de-tallas" element={<SizeGuide />} />
          <Route path="terminos" element={<Terms />} />
          <Route path="admin/setup" element={<Setup />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<Products />} />
          <Route path="productos/nuevo" element={<ProductForm />} />
          <Route path="productos/:id" element={<ProductForm />} />
          <Route path="categorias" element={<Categories />} />
          <Route path="tallas" element={<Sizes />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="pedidos/:code" element={<OrderDetail />} />
          <Route path="administradores" element={<Admins />} />
          <Route path="datos" element={<SeedData />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
