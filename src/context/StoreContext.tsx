import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Category, Product } from '../types';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Helper to build headers with active auth token
  const getAuthHeaders = useCallback((isJson = true) => {
    const token = localStorage.getItem('@marmot_auth_token');
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
      setIsLoading(true);

      // Directly load from Supabase - Single Source of Truth
      const [prodResult, catResult] = await Promise.all([
        fetchProductsFromSupabaseDirect(),
        fetchCategoriesFromSupabaseDirect(),
      ]);

      if (prodResult.products && prodResult.products.length > 0) {
        setProducts(prodResult.products);
      } else {
        try {
          const prodRes = await fetch('/api/products');
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            if (prodData && Array.isArray(prodData.products) && prodData.products.length > 0) {
              setProducts(prodData.products);
            }
          }
        } catch {}
      }

      if (catResult.categories && catResult.categories.length > 0) {
        setCategories(catResult.categories);
      } else {
        // Fallback check on categories API if empty
        try {
          const catRes = await fetch('/api/categories', { credentials: 'include' });
          if (catRes.ok) {
            const catData = await catRes.json();
            if (Array.isArray(catData)) {
              setCategories(catData);
            }
          }
        } catch {}
      }
    } catch (error) {
      console.error('[PRODUCTS] Erro ao carregar produtos do Supabase:', error);
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
  // Product Actions (Supabase Authoritative)
  // ==========================================
  const addProduct = async (productData: Partial<Product>): Promise<Product> => {
    try {
      const { product: created, error } = await createProductInSupabase(productData);
      if (error || !created) {
        throw new Error(error?.message || 'Falha ao inserir produto no Supabase.');
      }

      // Update state with newly created Supabase record
      setProducts((prev) => [created, ...prev.filter((p) => p.id !== created.id && p.slug !== created.slug)]);

      // Background sync to server API if available
      fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(created),
      }).catch((err) => console.warn('[Store API Sync] Sync notice:', err));

      return created;
    } catch (error) {
      console.error('[PRODUCTS] Erro ao criar produto:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
    // 1. Optimistic UI update instantly for zero perceived delay
    setProducts((prev) =>
      prev.map((p) => (p.id === id || p.slug === id ? ({ ...p, ...productData } as Product) : p))
    );

    try {
      const { product: updated, error } = await updateProductInSupabase(id, productData);
      if (error || !updated) {
        throw new Error(error?.message || `Falha ao atualizar produto #${id} no Supabase.`);
      }

      // 2. Sync final updated Supabase record in state
      setProducts((prev) => prev.map((p) => (p.id === id || p.slug === id || p.id === updated.id ? updated : p)));

      // Background sync to server API if available (non-blocking)
      fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(updated),
      }).catch((err) => console.warn('[Store API Sync] Sync notice:', err));

      return updated;
    } catch (error) {
      console.error('[PRODUCTS] Erro ao atualizar produto:', error);
      throw error;
    }
  };

  const updateStock = async (id: string, stockCount: number): Promise<void> => {
    try {
      const { product: updated, error } = await updateProductStockInSupabase(id, stockCount);
      if (error || !updated) {
        throw new Error(error?.message || `Falha ao atualizar estoque do produto #${id} no Supabase.`);
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === id || p.slug === id ? { ...p, stockCount: updated.stockCount, status: updated.status } : p))
      );

      // Background sync to server API
      fetch(`/api/products/${encodeURIComponent(id)}/stock`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ stockCount }),
      }).catch((err) => console.warn('[Store API Sync] Sync stock notice:', err));
    } catch (error) {
      console.error('[PRODUCTS] Erro ao atualizar estoque:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const { success, error } = await deleteProductInSupabase(id);
      if (error || !success) {
        throw new Error(error?.message || `Falha ao excluir produto #${id} do Supabase.`);
      }

      // Only remove from interface state after Supabase confirms deletion
      setProducts((prev) => prev.filter((p) => p.id !== id && p.slug !== id));

      // Background sync to server API
      fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
        credentials: 'include',
      }).catch((err) => console.warn('[Store API Sync] Sync delete notice:', err));

      return true;
    } catch (error) {
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
