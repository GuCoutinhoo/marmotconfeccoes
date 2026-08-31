import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Product } from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured, mapSupabaseRowToProduct } from '../lib/supabaseClient';

interface WishlistContextData {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextData>({} as WishlistContextData);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const isHydratingRef = useRef<boolean>(false);
  const activeUserIdRef = useRef<string | null>(user?.id || null);
  const { showToast } = useToast();

  // Load wishlist isolated per authenticated user vs guest
  useEffect(() => {
    let isCancelled = false;

    async function syncWishlist() {
      isHydratingRef.current = true;
      setIsHydrated(false);

      if (user && user.id) {
        activeUserIdRef.current = user.id;
        const activeToken = token || localStorage.getItem('@marmot_auth_token');

        let loadedWishlist: Product[] | null = null;

        // 1. Fetch user wishlist from backend
        try {
          const res = await fetch('/api/wishlist', {
            headers: {
              ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
            },
          });
          if (res.ok) {
            const serverWishlist = await res.json();
            if (Array.isArray(serverWishlist)) {
              loadedWishlist = serverWishlist;
            }
          }
        } catch (err) {
          console.warn('[Wishlist] Fetch error:', err);
        }

        // 2. Direct Supabase fallback
        if ((!loadedWishlist || loadedWishlist.length === 0) && isSupabaseConfigured()) {
          try {
            const { data: sbWish, error: sbWishErr } = await supabase
              .from('wishlist_items')
              .select('*')
              .eq('user_id', user.id);

            if (!sbWishErr && Array.isArray(sbWish) && sbWish.length > 0) {
              const mapped = sbWish
                .map((item: any) => {
                  if (item.data && item.data.title) return item.data;
                  return item.product || mapSupabaseRowToProduct(item.products || item);
                })
                .filter(Boolean) as Product[];

              if (mapped.length > 0) {
                loadedWishlist = mapped;
              }
            }
          } catch (sbErr) {
            console.warn('[Wishlist] Supabase direct fallback notice:', sbErr);
          }
        }

        // 3. Fallback to user cache
        if (!loadedWishlist || loadedWishlist.length === 0) {
          try {
            const cached = localStorage.getItem(`@marmot_wishlist_${user.id}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                loadedWishlist = parsed;
              }
            }
          } catch {}
        }

        if (!isCancelled) {
          const finalWishlist = loadedWishlist || [];
          setWishlist(finalWishlist);
          if (finalWishlist.length > 0) {
            localStorage.setItem(`@marmot_wishlist_${user.id}`, JSON.stringify(finalWishlist));
          }
          isHydratingRef.current = false;
          setIsHydrated(true);
        }
      } else {
        // User logged out or guest browsing:
        activeUserIdRef.current = null;
        localStorage.removeItem('@marmot_wishlist');

        let guestItems: Product[] = [];
        try {
          const guestSaved = localStorage.getItem('@marmot_guest_wishlist');
          if (guestSaved) {
            const parsed = JSON.parse(guestSaved);
            if (Array.isArray(parsed)) {
              guestItems = parsed;
            }
          }
        } catch {}

        if (!isCancelled) {
          setWishlist(guestItems);
          isHydratingRef.current = false;
          setIsHydrated(true);
        }
      }
    }

    syncWishlist();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, token]);

  // Persist to user-isolated storage or guest storage only when hydrated
  useEffect(() => {
    if (!isHydrated || isHydratingRef.current) return;

    if (user?.id && activeUserIdRef.current === user.id) {
      localStorage.setItem(`@marmot_wishlist_${user.id}`, JSON.stringify(wishlist));
    } else if (!user && activeUserIdRef.current === null) {
      localStorage.setItem('@marmot_guest_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isHydrated, user?.id]);

  const wishlistSet = useMemo(() => new Set(wishlist.map((item) => item.id)), [wishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistSet.has(productId);
  }, [wishlistSet]);

  const toggleWishlist = useCallback((product: Product) => {
    const exists = wishlistSet.has(product.id);
    if (exists) {
      setWishlist((prev) => prev.filter((p) => p.id !== product.id));
      showToast('Removido dos Favoritos', `${product.title} foi removido.`, 'info');
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast('Adicionado aos Favoritos', `${product.title} foi salvo nos seus favoritos.`, 'success');
    }

    if (user) {
      const activeToken = token || localStorage.getItem('@marmot_auth_token');
      fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ productId: product.id }),
      }).catch((err) => console.warn('[Wishlist] Sync error:', err));

      if (isSupabaseConfigured()) {
        if (exists) {
          supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product.id)
            .then(({ error }) => {
              if (error) console.warn('[Wishlist] Supabase delete notice:', error.message);
            });
        } else {
          const wishId = `wish-${user.id}-${product.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
          supabase
            .from('wishlist_items')
            .upsert({
              id: wishId,
              user_id: user.id,
              product_id: product.id,
              created_at: new Date().toISOString(),
              data: product,
            })
            .then(({ error }) => {
              if (error) console.warn('[Wishlist] Supabase upsert notice:', error.message);
            });
        }
      }
    }
  }, [wishlistSet, user, token, showToast]);

  const value = useMemo(() => ({
    wishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount: wishlist.length,
  }), [wishlist, toggleWishlist, isInWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);

