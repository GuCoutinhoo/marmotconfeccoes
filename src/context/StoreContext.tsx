import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Category, Product } from '../types';
import { CATALOG_90_PRODUCTS } from '../data/catalog90Products';
import { INITIAL_8_CATEGORIES } from '../data/categories';
import {
  fetchProductsFromSupabaseDirect,
  fetchCategoriesFromSupabaseDirect,
  validateAndDeduplicateProducts,
  createProductInSupabase,
  updateProductInSupabase,
  deleteProductInSupabase,
  updateProductStockInSupabase,
  isSupabaseConfigured,
  supabase,
  mapSupabaseRowToProduct,
  mapSupabaseRowToCategory,
  uploadProductImageToStorage,
  deleteProductImageFromStorage,
} from '../lib/supabaseClient';

const PRODUCT_CACHE_KEY_V2 = '@marmot_cached_products_v2';
const LEGACY_PRODUCT_CACHE_KEY = '@marmot_cached_products';

interface ProductCacheSnapshotV2 {
  version: 2;
  savedAt: number;
  products: Product[];
}

interface StoreContextType {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  isInitialized: boolean;
  isFetchingFreshData: boolean;
  fetchStoreData: () => Promise<void>;
  
  // Category Actions
  addCategory: (categoryData: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, categoryData: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;
  reorderCategories: (orderedIds: string[]) => Promise<Category[]>;
  getCategoryBySlug: (slug: string) => Category | undefined;
  
  // Product Actions
  addProduct: (productData: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  updateStock: (id: string, stockCount: number) => Promise<void>;
  deleteProduct: (id: string) => Promise<boolean>;
  getProductById: (idOrSlug: string) => Product | undefined;
  
  // Upload Helper
  uploadImage: (imageFileOrBase64: File | string, filename?: string) => Promise<string>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Instant synchronous initialization (0ms First Contentful Paint)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem('@marmot_cached_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_8_CATEGORIES || [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      // 1. Automatically neutralize and wipe old corrupt unversioned cache
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(LEGACY_PRODUCT_CACHE_KEY);
      }
    } catch {}

    try {
      // 2. Read strictly verified v2 snapshot
      const raw = localStorage.getItem(PRODUCT_CACHE_KEY_V2);
      if (raw) {
        const parsed: ProductCacheSnapshotV2 = JSON.parse(raw);
        if (parsed && parsed.version === 2 && Array.isArray(parsed.products) && parsed.products.length > 0) {
          return validateAndDeduplicateProducts(parsed.products);
        }
      }
    } catch {}
    return CATALOG_90_PRODUCTS || [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(true);
  const [isFetchingFreshData, setIsFetchingFreshData] = useState<boolean>(false);

  // Race condition protection: always ensure only the latest request can commit to state
  const latestFetchRequestIdRef = useRef<number>(0);

  const saveProductCacheSnapshot = useCallback((prods: Product[]) => {
    try {
      if (!Array.isArray(prods) || prods.length === 0) return;
      const snapshot: ProductCacheSnapshotV2 = {
        version: 2,
        savedAt: Date.now(),
        products: prods,
      };
      localStorage.setItem(PRODUCT_CACHE_KEY_V2, JSON.stringify(snapshot));
      console.log(`[PRODUCTS] cache snapshot rows=${prods.length}`);
    } catch {}
  }, []);

  // Helper to build headers with active auth token
  const getAuthHeaders = useCallback((isJson = true) => {
    let token = localStorage.getItem('@marmot_auth_token');
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.access_token) {
                token = parsed.access_token;
                break;
              }
            }
          } catch {}
        }
      }
    }

    const headers: Record<string, string> = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-admin-token'] = token;
    }
    return headers;
  }, []);

  const fetchStoreData = useCallback(async () => {
    const currentReqId = ++latestFetchRequestIdRef.current;
    console.log(`[PRODUCTS] StoreContext request #${currentReqId} started`);
    setIsFetchingFreshData(true);

    try {
      let loadedProducts: Product[] = [];
      let loadedCategories: Category[] = [];

      // 1. If Supabase is configured, fetch directly from Supabase as primary source of truth across Vercel & Google AI Studio
      if (isSupabaseConfigured()) {
        try {
          const [directProd, directCat] = await Promise.all([
            fetchProductsFromSupabaseDirect().catch(() => ({ products: [] })),
            fetchCategoriesFromSupabaseDirect().catch(() => ({ categories: [] })),
          ]);

          if (directProd?.products && directProd.products.length > 0) {
            loadedProducts = directProd.products;
          }
          if (directCat?.categories && directCat.categories.length > 0) {
            loadedCategories = directCat.categories;
          }
        } catch (sbErr) {
          console.warn(`[PRODUCTS] request #${currentReqId} Supabase direct fetch notice:`, sbErr);
        }
      }

      // 2. If Supabase returned empty or unavailable, fallback to backend API
      if (loadedProducts.length === 0 || loadedCategories.length === 0) {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }).catch(() => null),
          fetch('/api/categories', { cache: 'no-store' }).catch(() => null),
        ]);

        if (loadedProducts.length === 0 && prodRes && prodRes.ok) {
          const data = await prodRes.json();
          if (data && Array.isArray(data.products) && data.products.length > 0) {
            loadedProducts = data.products;
          }
        }

        if (loadedCategories.length === 0 && catRes && catRes.ok) {
          const data = await catRes.json();
          if (Array.isArray(data) && data.length > 0) {
            loadedCategories = data;
          }
        }
      }

      // 3. Race condition verification: if a newer request started while this one was running, discard this older result
      if (currentReqId !== latestFetchRequestIdRef.current) {
        console.log(`[PRODUCTS] request #${currentReqId} superseded by #${latestFetchRequestIdRef.current} — discarding stale response`);
        return;
      }

      // 4. Strict Non-Destructive Catalog Update: ONLY commit when valid products are returned
      if (loadedProducts.length > 0) {
        const uniqueProducts = validateAndDeduplicateProducts(loadedProducts);
        console.log(`[PRODUCTS] committing catalog rows=${uniqueProducts.length}`);
        setProducts(uniqueProducts);
        saveProductCacheSnapshot(uniqueProducts);
      } else {
        console.warn(`[PRODUCTS] request #${currentReqId} returned 0 valid products — preserving existing catalog in state.`);
      }

      if (loadedCategories.length > 0) {
        setCategories(loadedCategories);
        try {
          localStorage.setItem('@marmot_cached_categories', JSON.stringify(loadedCategories));
        } catch {}
      }
    } catch (error) {
      console.error(`[PRODUCTS] request #${currentReqId} erro ao carregar catálogo da loja:`, error);
    } finally {
      if (currentReqId === latestFetchRequestIdRef.current) {
        setIsLoading(false);
        setIsInitialized(true);
        setIsFetchingFreshData(false);
      }
    }
  }, [saveProductCacheSnapshot]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Real-time synchronization with Supabase: keeps Vercel and Google AI Studio in sync live!
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase
      .channel('store-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newProd = mapSupabaseRowToProduct(payload.new);
            setProducts((prev) => {
              const filtered = prev.filter((p) => p.id !== newProd.id && p.slug !== newProd.slug);
              const next = validateAndDeduplicateProducts([newProd, ...filtered]);
              saveProductCacheSnapshot(next);
              return next;
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedProd = mapSupabaseRowToProduct(payload.new);
            setProducts((prev) => {
              const next = validateAndDeduplicateProducts(
                prev.map((p) => (p.id === updatedProd.id || p.slug === updatedProd.slug ? { ...p, ...updatedProd } : p))
              );
              saveProductCacheSnapshot(next);
              return next;
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            const oldId = String(payload.old.id);
            setProducts((prev) => {
              const next = prev.filter((p) => p.id !== oldId);
              saveProductCacheSnapshot(next);
              return next;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newCat = mapSupabaseRowToCategory(payload.new);
            setCategories((prev) => {
              const filtered = prev.filter((c) => c.id !== newCat.id && c.slug !== newCat.slug);
              const next = [...filtered, newCat];
              try { localStorage.setItem('@marmot_cached_categories', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedCat = mapSupabaseRowToCategory(payload.new);
            setCategories((prev) => {
              const next = prev.map((c) => (c.id === updatedCat.id || c.slug === updatedCat.slug ? { ...c, ...updatedCat } : c));
              try { localStorage.setItem('@marmot_cached_categories', JSON.stringify(next)); } catch {}
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [saveProductCacheSnapshot]);

  // Upload helper: uploads to Supabase Storage (bucket 'product-images') or fallback proxy and returns permanent URL
  const uploadImage = async (imageFileOrBase64: File | string, filename?: string): Promise<string> => {
    try {
      if (typeof imageFileOrBase64 === 'string' && (imageFileOrBase64.startsWith('http://') || imageFileOrBase64.startsWith('https://'))) {
        return imageFileOrBase64;
      }

      // Convert File / Base64 to compressed image and upload to Storage
      const uploadedUrl = await uploadProductImageToStorage(imageFileOrBase64, 'general', filename);
      if (uploadedUrl) {
        return uploadedUrl;
      }

      return typeof imageFileOrBase64 === 'string' ? imageFileOrBase64 : '';
    } catch (error) {
      console.error('Upload error in StoreContext:', error);
      // If it's already a URL, return it
      if (typeof imageFileOrBase64 === 'string' && !imageFileOrBase64.startsWith('data:')) {
        return imageFileOrBase64;
      }
      throw error;
    }
  };

  // ==========================================
  // Category Actions (Server Authoritative)
  // ==========================================
  const addCategory = async (categoryData: Partial<Category>): Promise<Category> => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(categoryData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Erro ao adicionar categoria' }));
        throw new Error(errJson.error || 'Erro ao adicionar categoria no servidor');
      }

      const created: Category = await res.json();
      setCategories((prev) => {
        const exists = prev.some((c) => c.id === created.id);
        if (exists) {
          return prev.map((c) => (c.id === created.id ? created : c));
        }
        return [...prev, created];
      });
      return created;
    } catch (error) {
      console.error('Add category error:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category> => {
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(categoryData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Erro ao atualizar categoria' }));
        throw new Error(errJson.error || 'Erro ao atualizar categoria no servidor');
      }

      const updated: Category = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === id || c.slug === id ? updated : c)));
      return updated;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Erro ao excluir categoria' }));
        throw new Error(errJson.error || 'Erro ao excluir categoria');
      }

      setCategories((prev) => prev.filter((c) => c.id !== id && c.slug !== id));
      return true;
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  };

  const reorderCategories = async (orderedIds: string[]): Promise<Category[]> => {
    try {
      const res = await fetch('/api/categories-reorder', {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ orderedIds }),
      });

      if (res.ok) {
        const reordered = await res.json();
        setCategories(reordered);
        return reordered;
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
    }

    // Local sort if network failed
    const reordered: Category[] = [];
    orderedIds.forEach((id, idx) => {
      const found = categories.find((c) => c.id === id || c.slug === id);
      if (found) reordered.push({ ...found, order: idx });
    });
    categories.forEach((c) => {
      if (!reordered.find((r) => r.id === c.id)) {
        reordered.push({ ...c, order: reordered.length });
      }
    });
    setCategories(reordered);
    return reordered;
  };

  const getCategoryBySlug = (slug: string): Category | undefined => {
    const clean = slug.toLowerCase().trim();
    return categories.find((c) => c.slug?.toLowerCase() === clean || c.id?.toLowerCase() === clean);
  };

  // ==========================================
  // Product Actions (Server Authoritative & Supabase Synced)
  // ==========================================
  const addProduct = async (productData: Partial<Product>): Promise<Product> => {
    try {
      let created: Product | null = null;

      // 1. Direct write to Supabase if configured (Fastest path & Single Source of Truth)
      if (isSupabaseConfigured()) {
        try {
          const directResult = await createProductInSupabase(productData);
          if (directResult.product) {
            created = directResult.product;
          }
        } catch (sbErr) {
          console.warn('[PRODUCTS] Direct Supabase add notice:', sbErr);
        }
      }

      // If Supabase succeeded, update state immediately & sync backend in background
      if (created) {
        setProducts((prev) => {
          const next = validateAndDeduplicateProducts([created!, ...prev.filter((p) => p.id !== created!.id && p.slug !== created!.slug)]);
          saveProductCacheSnapshot(next);
          return next;
        });

        // Non-blocking background sync to backend
        fetch('/api/products', {
          method: 'POST',
          headers: getAuthHeaders(true),
          credentials: 'include',
          body: JSON.stringify(created),
        }).catch(() => {});

        return created;
      }

      // 2. Synchronize to Backend API if Supabase was not configured or direct call failed
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: getAuthHeaders(true),
          credentials: 'include',
          body: JSON.stringify(productData),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          created = await res.json();
        }
      } catch (netErr) {
        console.warn('[PRODUCTS] Backend request timed out or error:', netErr);
      }

      // 3. Fallback local item if both failed
      if (!created) {
        const localId = `p-${Date.now()}`;
        created = {
          id: localId,
          slug: productData.slug || `produto-${Date.now().toString().slice(-4)}`,
          title: productData.title || 'Novo Produto',
          price: productData.price || 189.9,
          category: productData.category || 'camisetas',
          image: productData.image || '',
          images: productData.images || [],
          colors: productData.colors || [],
          sizes: productData.sizes || ['P', 'M', 'G', 'GG'],
          status: productData.status || 'active',
          stockCount: productData.stockCount ?? 20,
          tags: productData.tags || [],
          ...productData,
        } as Product;
      }

      // 4. Update React state immediately
      setProducts((prev) => {
        const next = validateAndDeduplicateProducts([created!, ...prev.filter((p) => p.id !== created!.id && p.slug !== created!.slug)]);
        saveProductCacheSnapshot(next);
        return next;
      });

      return created;
    } catch (error: any) {
      console.error('[PRODUCTS] Erro ao criar produto:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      let updated: Product | null = null;

      // 1. Direct write to Supabase if configured (Immediate persistence across all clients)
      if (isSupabaseConfigured()) {
        try {
          const directResult = await updateProductInSupabase(id, productData);
          if (directResult.product) {
            updated = directResult.product;
          }
        } catch (sbErr) {
          console.warn('[PRODUCTS] Direct Supabase update notice:', sbErr);
        }
      }

      // If Supabase succeeded, update React state & cache immediately and sync backend in background
      if (updated) {
        setProducts((prev) => {
          const next = validateAndDeduplicateProducts(
            prev.map((p) => (p.id === id || p.slug === id || p.id === updated!.id ? { ...p, ...updated } : p))
          );
          saveProductCacheSnapshot(next);
          return next;
        });

        // Non-blocking background sync to backend
        fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: getAuthHeaders(true),
          credentials: 'include',
          body: JSON.stringify(productData),
        }).catch(() => {});

        return updated;
      }

      // 2. Synchronize to backend API if Supabase was not configured or direct call failed
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: getAuthHeaders(true),
          credentials: 'include',
          body: JSON.stringify(productData),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          updated = await res.json();
        }
      } catch (netErr) {
        console.warn('[PRODUCTS] Backend request error/timeout:', netErr);
      }

      // 3. Fallback calculation if neither returned
      if (!updated) {
        const current = products.find((p) => p.id === id || p.slug === id);
        const images = productData.images || (productData.image ? [productData.image] : current?.images || []);
        const mainImage = images[0] || productData.image || current?.image || '';
        updated = {
          ...(current || {}),
          ...productData,
          id: current?.id || id,
          image: mainImage,
          images: images,
        } as Product;
      }

      // 4. Update React state immediately across the whole application
      setProducts((prev) => {
        const next = validateAndDeduplicateProducts(
          prev.map((p) => (p.id === id || p.slug === id || p.id === updated!.id ? { ...p, ...updated } : p))
        );
        saveProductCacheSnapshot(next);
        return next;
      });

      return updated;
    } catch (error: any) {
      console.error('[PRODUCTS] Erro ao atualizar produto:', error);
      throw error;
    }
  };

  const updateStock = async (id: string, stockCount: number): Promise<void> => {
    try {
      let updatedStock = stockCount;
      let newStatus = stockCount <= 0 ? 'out_of_stock' : 'active';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`/api/products/${encodeURIComponent(id)}/stock`, {
          method: 'PUT',
          headers: getAuthHeaders(true),
          credentials: 'include',
          body: JSON.stringify({ stockCount }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const updated: Product = await res.json();
          updatedStock = updated.stockCount;
          newStatus = updated.status;
        }
      } catch {}

      if (isSupabaseConfigured()) {
        updateProductStockInSupabase(id, stockCount).catch((sbErr) => {
          console.warn('[PRODUCTS] Direct Supabase stock sync notice:', sbErr);
        });
      }

      setProducts((prev) => {
        const next = validateAndDeduplicateProducts(
          prev.map((p) => (p.id === id || p.slug === id ? { ...p, stockCount: updatedStock, status: newStatus as any } : p))
        );
        saveProductCacheSnapshot(next);
        return next;
      });
    } catch (error: any) {
      console.error('[PRODUCTS] Erro ao atualizar estoque:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
        credentials: 'include',
      }).catch(() => null);

      if (isSupabaseConfigured()) {
        try {
          await deleteProductInSupabase(id);
        } catch (sbErr) {
          console.warn('[PRODUCTS] Direct Supabase delete sync notice:', sbErr);
        }
      }

      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== id && p.slug !== id);
        saveProductCacheSnapshot(next);
        return next;
      });
      return true;
    } catch (error: any) {
      console.error('[PRODUCTS] Erro ao excluir produto:', error);
      throw error;
    }
  };

  const getProductById = (idOrSlug: string): Product | undefined => {
    const clean = idOrSlug.toLowerCase().trim();
    return products.find((p) => p.id?.toLowerCase() === clean || p.slug?.toLowerCase() === clean);
  };

  return (
    <StoreContext.Provider
      value={{
        categories,
        products,
        isLoading,
        isInitialized,
        fetchStoreData,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        getCategoryBySlug,
        addProduct,
        updateProduct,
        updateStock,
        deleteProduct,
        getProductById,
        uploadImage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
