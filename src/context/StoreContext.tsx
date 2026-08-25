import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Category, Product } from '../types';
import { CATALOG_90_PRODUCTS } from '../data/catalog90Products';
import { INITIAL_8_CATEGORIES } from '../data/categories';
import {
  fetchProductsFromSupabaseDirect,
  fetchCategoriesFromSupabaseDirect,
  createProductInSupabase,
  updateProductInSupabase,
  deleteProductInSupabase,
  updateProductStockInSupabase,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient';

interface StoreContextType {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  isInitialized: boolean;
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
      const cached = localStorage.getItem('@marmot_cached_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return CATALOG_90_PRODUCTS || [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(true);

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
    try {
      // Fast, parallel API fetch from backend (in-memory cache + Supabase sync)
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products').catch(() => null),
        fetch('/api/categories').catch(() => null),
      ]);

      let loadedProducts: Product[] = [];
      let loadedCategories: Category[] = [];

      if (prodRes && prodRes.ok) {
        const data = await prodRes.json();
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          loadedProducts = data.products;
        }
      }

      if (catRes && catRes.ok) {
        const data = await catRes.json();
        if (Array.isArray(data) && data.length > 0) {
          loadedCategories = data;
        }
      }

      // Fallback directly to Supabase only if backend returned empty
      if (loadedProducts.length === 0) {
        try {
          const directProd = await fetchProductsFromSupabaseDirect();
          if (directProd.products && directProd.products.length > 0) {
            loadedProducts = directProd.products;
          }
        } catch (sbErr) {
          console.warn('[PRODUCTS] Fallback Supabase error:', sbErr);
        }
      }

      if (loadedCategories.length === 0) {
        try {
          const directCat = await fetchCategoriesFromSupabaseDirect();
          if (directCat.categories && directCat.categories.length > 0) {
            loadedCategories = directCat.categories;
          }
        } catch (sbCatErr) {
          console.warn('[CATEGORIES] Fallback Supabase error:', sbCatErr);
        }
      }

      if (loadedProducts.length > 0) {
        setProducts(loadedProducts);
        try {
          localStorage.setItem('@marmot_cached_products', JSON.stringify(loadedProducts));
        } catch {}
      }

      if (loadedCategories.length > 0) {
        setCategories(loadedCategories);
        try {
          localStorage.setItem('@marmot_cached_categories', JSON.stringify(loadedCategories));
        } catch {}
      }
    } catch (error) {
      console.error('[PRODUCTS] Erro ao carregar catálogo da loja:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Upload helper for real file or base64 to server storage
  const uploadImage = async (imageFileOrBase64: File | string, filename?: string): Promise<string> => {
    try {
      let base64String = '';
      let fname = filename || 'upload';

      if (typeof imageFileOrBase64 === 'string') {
        if (imageFileOrBase64.startsWith('http://') || imageFileOrBase64.startsWith('https://')) {
          return imageFileOrBase64;
        }
        if (imageFileOrBase64.startsWith('/uploads/')) {
          return imageFileOrBase64;
        }
        base64String = imageFileOrBase64;
      } else if (imageFileOrBase64 instanceof File) {
        fname = imageFileOrBase64.name;
        base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFileOrBase64);
        });
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ image: base64String, filename: fname }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Falha no upload' }));
        throw new Error(errJson.error || 'Falha no upload de imagem');
      }

      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
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
      // 1. Send create request to backend API
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      let created: Product;
      if (res.ok) {
        created = await res.json();
      } else {
        const errJson = await res.json().catch(() => ({ error: 'Falha ao cadastrar produto' }));
        console.warn('[PRODUCTS] Backend POST notice:', errJson);
        // Fallback create directly in Supabase if backend had an auth hitch
        if (isSupabaseConfigured()) {
          const directResult = await createProductInSupabase(productData);
          if (directResult.product) {
            created = directResult.product;
          } else {
            throw new Error(errJson.error || directResult.error?.message || 'Falha ao cadastrar produto.');
          }
        } else {
          throw new Error(errJson.error || `Erro ${res.status}: Falha ao cadastrar produto.`);
        }
      }

      // 2. Direct client-side sync to Supabase if configured
      if (isSupabaseConfigured() && created) {
        try {
          await createProductInSupabase(created);
        } catch (sbErr) {
          console.warn('[PRODUCTS] Direct Supabase add sync notice:', sbErr);
        }
      }

      // 3. Update React state immediately
      setProducts((prev) => {
        const next = [created, ...prev.filter((p) => p.id !== created.id && p.slug !== created.slug)];
        try { localStorage.setItem('@marmot_cached_products', JSON.stringify(next)); } catch {}
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
      // 1. Send update request to backend API
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      let updated: Product;
      if (res.ok) {
        updated = await res.json();
      } else {
        const errJson = await res.json().catch(() => ({ error: 'Falha ao atualizar produto' }));
        console.warn('[PRODUCTS] Backend PUT notice:', errJson);
        // Fallback update directly in Supabase
        if (isSupabaseConfigured()) {
          const directResult = await updateProductInSupabase(id, productData);
          if (directResult.product) {
            updated = directResult.product;
          } else {
            const current = products.find((p) => p.id === id || p.slug === id);
            updated = { ...(current || {}), ...productData, id } as Product;
          }
        } else {
          const current = products.find((p) => p.id === id || p.slug === id);
          updated = { ...(current || {}), ...productData, id } as Product;
        }
      }

      // 2. Direct client-side sync to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await updateProductInSupabase(id, productData);
        } catch (sbErr) {
          console.warn('[PRODUCTS] Direct Supabase update sync notice:', sbErr);
        }
      }

      // 3. Update React state immediately across the whole application
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id || p.slug === id || p.id === updated.id ? { ...p, ...updated } : p));
        try { localStorage.setItem('@marmot_cached_products', JSON.stringify(next)); } catch {}
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
      const res = await fetch(`/api/products/${encodeURIComponent(id)}/stock`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ stockCount }),
      });

      let updatedStock = stockCount;
      let newStatus = stockCount <= 0 ? 'out_of_stock' : 'active';

      if (res.ok) {
        const updated: Product = await res.json();
        updatedStock = updated.stockCount;
        newStatus = updated.status;
      }

      if (isSupabaseConfigured()) {
        try {
          await updateProductStockInSupabase(id, stockCount);
        } catch (sbErr) {
          console.warn('[PRODUCTS] Direct Supabase stock sync notice:', sbErr);
        }
      }

      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id || p.slug === id ? { ...p, stockCount: updatedStock, status: newStatus as any } : p));
        try { localStorage.setItem('@marmot_cached_products', JSON.stringify(next)); } catch {}
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
        try { localStorage.setItem('@marmot_cached_products', JSON.stringify(next)); } catch {}
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
