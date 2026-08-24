import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider, useStore } from './context/StoreContext';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MiniCart } from './components/MiniCart';
import { QuickViewModal } from './components/QuickViewModal';
import { LiveSearchModal } from './components/LiveSearchModal';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackingPage } from './pages/TrackingPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { InstitutionalPage } from './pages/InstitutionalPage';
import { AuthConfirmPage } from './pages/AuthConfirmPage';

import { Product } from './types';

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

  const handleNavigate = (page: string, param: string = '') => {
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
  };

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#18181B] flex flex-col font-sans selection:bg-[#F4C400] selection:text-black">
      {/* Persistent Header */}
      <Header
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1">
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
      </main>

      {/* Persistent Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Slide-Over MiniCart */}
      <MiniCart onNavigate={handleNavigate} />

      {/* Global Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onNavigateToDetail={(id) => handleNavigate('product', id)}
      />

      {/* Global Live Search Modal */}
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
