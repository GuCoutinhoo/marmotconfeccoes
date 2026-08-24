import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider, useStore } from './context/StoreContext';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MiniCart } from './components/MiniCart';
import { HomePage } from './pages/HomePage';

import { Product } from './types';

// Code-split pages for instant initial load and low main-thread memory footprint
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const TrackingPage = lazy(() => import('./pages/TrackingPage').then((m) => ({ default: m.TrackingPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const InstitutionalPage = lazy(() => import('./pages/InstitutionalPage').then((m) => ({ default: m.InstitutionalPage })));
const AuthConfirmPage = lazy(() => import('./pages/AuthConfirmPage').then((m) => ({ default: m.AuthConfirmPage })));

// Code-split heavy interactive modals
const QuickViewModal = lazy(() => import('./components/QuickViewModal').then((m) => ({ default: m.QuickViewModal })));
const LiveSearchModal = lazy(() => import('./components/LiveSearchModal').then((m) => ({ default: m.LiveSearchModal })));

// Ultra-lightweight non-blocking page loader fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-[#18181B] border-t-[#F4C400] rounded-full animate-spin mb-3" />
    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#71717A]">
      Carregando...
    </span>
  </div>
);

function getInitialRoute(): { page: string; param: string } {
  if (typeof window === 'undefined') return { page: 'home', param: '' };

  const pathname = window.location.pathname.toLowerCase();
  const search = window.location.search;
  const hash = window.location.hash;

  // Supabase Auth confirmation route
  if (
    pathname.startsWith('/auth/confirm') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/confirm') ||
    search.includes('token_hash=') ||
    hash.includes('token_hash=')
  ) {
    return { page: 'auth-confirm', param: '' };
  }

  if (pathname.startsWith('/minha-conta') || pathname.startsWith('/account')) {
    const urlParams = new URLSearchParams(search);
    const tab = urlParams.get('tab') || '';
    return { page: 'account', param: tab };
  }

  if (pathname.startsWith('/admin')) {
    return { page: 'admin', param: '' };
  }

  if (pathname.startsWith('/checkout')) {
    return { page: 'checkout', param: '' };
  }

  if (pathname.startsWith('/tracking')) {
    const urlParams = new URLSearchParams(search);
    return { page: 'tracking', param: urlParams.get('code') || '' };
  }

  if (pathname.startsWith('/shop') || pathname.startsWith('/catalogo')) {
    const urlParams = new URLSearchParams(search);
    return { page: 'shop', param: urlParams.get('cat') || '' };
  }

  return { page: 'home', param: '' };
}

export function AppContent() {
  const initial = getInitialRoute();
  const [currentPage, setCurrentPage] = useState<string>(initial.page);
  const [pageParam, setPageParam] = useState<string>(initial.param);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const { products } = useStore();

  // Listen to popstate (browser back / forward)
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      setCurrentPage(route.page);
      setPageParam(route.param);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to global require-auth event to direct user to account login/register
  useEffect(() => {
    const handleRequireAuth = () => {
      handleNavigate('account', 'login');
    };

    window.addEventListener('marmot:require-auth', handleRequireAuth);
    return () => window.removeEventListener('marmot:require-auth', handleRequireAuth);
  }, []);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, pageParam]);

  const handleNavigate = useCallback((page: string, param: string = '') => {
    setCurrentPage(page);
    setPageParam(param);

    // Update browser URL state gracefully
    if (typeof window !== 'undefined' && window.history?.pushState) {
      if (page === 'home') {
        window.history.pushState({}, '', '/');
      } else if (page === 'account') {
        window.history.pushState({}, '', param ? `/minha-conta?tab=${param}` : '/minha-conta');
      } else if (page === 'admin') {
        window.history.pushState({}, '', '/admin');
      } else if (page === 'shop') {
        window.history.pushState({}, '', param ? `/shop?cat=${param}` : '/shop');
      } else if (page === 'checkout') {
        window.history.pushState({}, '', '/checkout');
      } else if (page === 'tracking') {
        window.history.pushState({}, '', param ? `/tracking?code=${param}` : '/tracking');
      }
    }
  }, []);

  const handleOpenQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#18181B] flex flex-col font-sans selection:bg-[#F4C400] selection:text-black">
      {/* Persistent Header */}
      <Header
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Page Body with non-blocking Suspense boundaries */}
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onQuickView={handleOpenQuickView}
            />
          )}

          {currentPage === 'shop' && (
            <ShopPage
              initialCategory={pageParam}
              onNavigate={handleNavigate}
              onQuickView={handleOpenQuickView}
            />
          )}

          {currentPage === 'product' && (
            <ProductDetailPage
              productId={pageParam}
              onNavigate={handleNavigate}
              onQuickView={handleOpenQuickView}
            />
          )}

          {currentPage === 'checkout' && (
            <CheckoutPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'tracking' && (
            <TrackingPage initialCode={pageParam} onNavigate={handleNavigate} />
          )}

          {currentPage === 'account' && (
            <AccountPage initialTab={pageParam} onNavigate={handleNavigate} />
          )}

          {currentPage === 'admin' && (
            <AdminDashboardPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'institutional' && (
            <InstitutionalPage section={pageParam} onNavigate={handleNavigate} />
          )}

          {currentPage === 'auth-confirm' && (
            <AuthConfirmPage onNavigate={handleNavigate} />
          )}
        </Suspense>
      </main>

      {/* Persistent Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Slide-Over MiniCart */}
      <MiniCart onNavigate={handleNavigate} />

      {/* Global Quick View Modal with Suspense */}
      {quickViewProduct && (
        <Suspense fallback={null}>
          <QuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onNavigateToDetail={(id) => handleNavigate('product', id)}
          />
        </Suspense>
      )}

      {/* Global Live Search Modal with Suspense */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <LiveSearchModal
            isOpen={isSearchOpen}
            products={products}
            onClose={() => setIsSearchOpen(false)}
            onSelectProduct={(id) => {
              setIsSearchOpen(false);
              handleNavigate('product', id);
            }}
            onSearchCategory={(cat) => {
              setIsSearchOpen(false);
              handleNavigate('shop', cat);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </StoreProvider>
    </ToastProvider>
  );
}
