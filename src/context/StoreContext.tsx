import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Category, Product } from '../types';
import {
  validateAndDeduplicateProducts,
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

const defaultStoreContext: StoreContextType = {
  categories: [],
  products: [],
  isLoading: false,
  isInitialized: true,
  isFetchingFreshData: false,
  fetchStoreData: async () => {},
  addCategory: async () => ({} as Category),
  updateCategory: async () => ({} as Category),
  deleteCategory: async () => false,
  reorderCategories: async () => [],
  getCategoryBySlug: () => undefined,
  addProduct: async () => ({} as Product),
  updateProduct: async () => ({} as Product),
  updateStock: async () => {},
  deleteProduct: async () => false,
  getProductById: () => undefined,
  uploadImage: async () => '',
};

const StoreContext = createContext<StoreContextType>(defaultStoreContext);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  // STRICT SINGLE SOURCE OF TRUTH: Initial products state MUST be empty []
  // NEVER initialize with stale local storage or fallback catalog with wrong images
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isFetchingFreshData, setIsFetchingFreshData] = useState<boolean>(false);

  // Remove obsolete catalog caches. They are never read as a source of truth.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('@marmot_cached_products');
        localStorage.removeItem('@marmot_cached_products_v2');
        localStorage.removeItem('@marmot_cached_categories');
        localStorage.removeItem('@marmot_deleted_categories');
      }
    } catch {}
  }, []);

  // Race condition protection: always ensure only the latest request can commit to state
  const latestFetchRequestIdRef = useRef<number>(0);

  // Helper to build headers with active auth token
  const getAuthHeaders = useCallback((isJson = true) => {
    let token: string | null = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        token = localStorage.getItem('@marmot_auth_token');
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
      }
    } catch {}

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
      let source = 'api';

      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/categories', { cache: 'no-store', credentials: 'include' }),
        ]);

        if (!prodRes.ok) throw new Error(`Falha ao carregar produtos (HTTP ${prodRes.status}).`);
        if (!catRes.ok) throw new Error(`Falha ao carregar categorias (HTTP ${catRes.status}).`);

        const productPayload = await prodRes.json();
        const categoryPayload = await catRes.json();
        loadedProducts = Array.isArray(productPayload?.products) ? productPayload.products : [];
        loadedCategories = Array.isArray(categoryPayload) ? categoryPayload : [];
      } catch (apiError) {
        // Production resilience: catalog reads are public by RLS and must keep
        // working even if the Vercel API function has a transient/configuration
        // failure. Administrative writes still go exclusively through /api.
        if (!isSupabaseConfigured()) throw apiError;

        console.warn('[PRODUCTS] API indisponível; usando leitura pública direta do Supabase.', apiError);
        source = 'supabase-direct';

        const [productResult, categoryResult] = await Promise.all([
          supabase.from('products').select('*').order('id', { ascending: true }),
          supabase.from('categories').select('*').order('order', { ascending: true }),
        ]);

        if (productResult.error) {
          throw new Error(`SUPABASE_PRODUCTS_READ_FAILED: ${productResult.error.message}`);
        }
        if (categoryResult.error) {
          throw new Error(`SUPABASE_CATEGORIES_READ_FAILED: ${categoryResult.error.message}`);
        }

        loadedProducts = (productResult.data || []).map((row) => mapSupabaseRowToProduct(row));
        loadedCategories = (categoryResult.data || []).map((row) => mapSupabaseRowToCategory(row));
      }

      // Race condition verification: if a newer request started while this one was running, discard this older result
      if (currentReqId !== latestFetchRequestIdRef.current) {
        console.log(`[PRODUCTS] request #${currentReqId} superseded by #${latestFetchRequestIdRef.current} — discarding stale response`);
        return;
      }

      const uniqueProducts = validateAndDeduplicateProducts(loadedProducts);
      console.log(`[PRODUCTS] committing ${uniqueProducts.length} authoritative rows from ${source}`);
      setProducts(uniqueProducts);
      setCategories(loadedCategories);
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
              return [...filtered, newCat];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedCat = mapSupabaseRowToCategory(payload.new);
            setCategories((prev) => prev.map((c) => (c.id === updatedCat.id || c.slug === updatedCat.slug ? updatedCat : c)));
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
    if (typeof imageFileOrBase64 === 'string' && (imageFileOrBase64.startsWith('http://') || imageFileOrBase64.startsWith('https://'))) {
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
      const cleanId = String(id || '').trim();
      const res = await fetch(`/api/categories/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Erro ao excluir categoria' }));
        throw new Error(errJson.error || 'Erro ao excluir categoria no servidor');
      }

      await fetchStoreData();
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

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Erro ao reordenar categorias' }));
        throw new Error(errJson.error || 'Erro ao reordenar categorias no servidor');
      }
      const reordered = await res.json();
      setCategories(reordered);
      return reordered;
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
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
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Falha ao salvar produto (HTTP ${res.status}).`);
      }
      const created: Product = await res.json();
      if (!created || !created.id) {
        throw new Error('O servidor não confirmou o produto criado.');
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
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Falha ao atualizar produto (HTTP ${res.status}).`);
      }
      const updated: Product = await res.json();
      if (!updated || !updated.id) {
        throw new Error('O servidor não confirmou o produto atualizado.');
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
      const res = await fetch(`/api/products/${encodeURIComponent(id)}/stock`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ stockCount }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Falha ao atualizar estoque (HTTP ${res.status}).`);
      }
      const persisted: Product = await res.json();
      if (!persisted?.id) throw new Error('O servidor não confirmou a alteração de estoque.');
      setProducts((prev) => prev.map((p) => (p.id === id || p.slug === id ? persisted : p)));
    } catch (error) {
      console.error('Update stock error:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const current = products.find((p) => p.id === id || p.slug === id);
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
        credentials: 'include',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Falha ao excluir produto (HTTP ${res.status}).`);
      }
      setProducts((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
      if (current?.image) void deleteProductImageFromStorage(current.image);
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
  return context || defaultStoreContext;
};
