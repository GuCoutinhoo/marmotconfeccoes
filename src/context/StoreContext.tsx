import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Category, Product } from '../types';
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
  // Categories state: fallback to initial structural categories
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

  // STRICT SINGLE SOURCE OF TRUTH: Initial products state MUST be empty []
  // NEVER initialize with stale local storage or fallback catalog with wrong images
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isFetchingFreshData, setIsFetchingFreshData] = useState<boolean>(false);

  // Clean any old corrupted legacy caches on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('@marmot_cached_products');
        localStorage.removeItem('@marmot_cached_products_v2');
      }
    } catch {}
  }, []);

  // Race condition protection: always ensure only the latest request can commit to state
  const latestFetchRequestIdRef = useRef<number>(0);

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

      // 1. If Supabase is configured, fetch directly from Supabase as primary source of truth
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

      // 4. Commit authoritative catalog to state
      if (loadedProducts.length > 0) {
        const uniqueProducts = validateAndDeduplicateProducts(loadedProducts);
        console.log(`[PRODUCTS] committing catalog rows=${uniqueProducts.length}`);
        setProducts(uniqueProducts);
      } else {
        console.warn(`[PRODUCTS] request #${currentReqId} returned 0 valid products.`);
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
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Real-time synchronization with Supabase: keeps all clients in sync live!
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase
      .channel('store-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newProd = mapSupabaseRowToProduct(payload.new);
            setProducts((prev) => {
              const filtered = prev.filter((p) => p.id !== newProd.id && p.slug !== newProd.slug);
              return validateAndDeduplicateProducts([newProd, ...filtered]);
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedProd = mapSupabaseRowToProduct(payload.new);
            setProducts((prev) => {
              return validateAndDeduplicateProducts(
                prev.map((p) => (p.id === updatedProd.id || p.slug === updatedProd.slug ? updatedProd : p))
              );
            });
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            const oldId = String(payload.old.id);
            setProducts((prev) => prev.filter((p) => p.id !== oldId));
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
  }, []);

  // Upload helper: uploads to Supabase Storage (bucket 'product-images') or fallback proxy and returns permanent URL
  const uploadImage = async (imageFileOrBase64: File | string, filename?: string): Promise<string> => {
    if (typeof imageFileOrBase64 === 'string' && (imageFileOrBase64.startsWith('http://') || imageFileOrBase64.startsWith('https://') || imageFileOrBase64.startsWith('/uploads/'))) {
      return imageFileOrBase64;
    }

    // Convert File / Base64 to compressed image and upload to Storage
    const uploadedUrl = await uploadProductImageToStorage(imageFileOrBase64, 'general', filename);
    if (uploadedUrl && !uploadedUrl.startsWith('data:')) {
      return uploadedUrl;
    }

    throw new Error('Falha no upload da imagem. Não foi possível gerar uma URL persistente.');
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

      // 1. Direct write to Supabase if configured (Single Source of Truth)
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
          return validateAndDeduplicateProducts([created!, ...prev.filter((p) => p.id !== created!.id && p.slug !== created!.slug)]);
        });

        fetch('/api/products', {
          method: 'POST',
          headers: getAuthHeaders(true),
          credentials: 'include',
          body: JSON.stringify(created),
        }).catch(() => {});

        return created;
      }

      // 2. Synchronize to Backend API if Supabase was not configured or direct call failed
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Falha ao salvar produto no servidor' }));
        throw new Error(errJson.error || 'Falha ao salvar produto no servidor.');
      }

      created = await res.json();
      if (!created || !created.id) {
        throw new Error('Servidor retornou um produto inválido.');
      }

      setProducts((prev) => {
        return validateAndDeduplicateProducts([created!, ...prev.filter((p) => p.id !== created!.id && p.slug !== created!.slug)]);
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

      // 1. Direct write to Supabase if configured
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

      if (updated) {
        setProducts((prev) => {
          return validateAndDeduplicateProducts(
            prev.map((p) => (p.id === id || p.slug === id || p.id === updated!.id ? updated! : p))
          );
        });

        fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: getAuthHeaders(true),
          credentials: 'include',
          body: JSON.stringify(productData),
        }).catch(() => {});

        return updated;
      }

      // 2. Synchronize to backend API
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Falha ao atualizar produto no servidor' }));
        throw new Error(errJson.error || 'Falha ao atualizar produto no servidor.');
      }

      updated = await res.json();
      if (!updated || !updated.id) {
        throw new Error('Servidor retornou um produto inválido ao atualizar.');
      }

      setProducts((prev) => {
        return validateAndDeduplicateProducts(
          prev.map((p) => (p.id === id || p.slug === id || p.id === updated!.id ? updated! : p))
        );
      });

      return updated;
    } catch (error: any) {
      console.error('[PRODUCTS] Erro ao atualizar produto:', error);
      throw error;
    }
  };

  const updateStock = async (id: string, stockCount: number): Promise<void> => {
    try {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id || p.slug === id) {
            return {
              ...p,
              stockCount,
              status: stockCount <= 0 ? 'out_of_stock' : p.status === 'out_of_stock' ? 'active' : p.status,
            };
          }
          return p;
        })
      );

      if (isSupabaseConfigured()) {
        await updateProductStockInSupabase(id, stockCount).catch(() => {});
      }

      fetch(`/api/products/${encodeURIComponent(id)}/stock`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ stockCount }),
      }).catch(() => {});
    } catch (error) {
      console.error('Update stock error:', error);
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      // Find current product to remove images from storage if needed
      const current = products.find((p) => p.id === id || p.slug === id);
      if (current?.image) {
        deleteProductImageFromStorage(current.image).catch(() => {});
      }

      // Direct Supabase delete
      if (isSupabaseConfigured()) {
        await deleteProductInSupabase(id).catch(() => {});
      }

      // Backend delete
      await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
        credentials: 'include',
      }).catch(() => {});

      setProducts((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
      return true;
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  };

  const getProductById = (idOrSlug: string): Product | undefined => {
    const clean = idOrSlug.trim();
    return products.find((p) => p.id === clean || p.slug === clean);
  };

  return (
    <StoreContext.Provider
      value={{
        categories,
        products,
        isLoading,
        isInitialized,
        isFetchingFreshData,
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
