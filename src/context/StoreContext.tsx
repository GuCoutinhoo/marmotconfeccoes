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

      setProducts(loadedProducts);
      setCategories(loadedCategories);
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
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Falha ao cadastrar produto' }));
        throw new Error(errJson.error || `Erro ${res.status}: Falha ao cadastrar produto.`);
      }

      const created: Product = await res.json();
      setProducts((prev) => [created, ...prev.filter((p) => p.id !== created.id && p.slug !== created.slug)]);
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
        const errJson = await res.json().catch(() => ({ error: 'Falha ao atualizar produto' }));
        throw new Error(errJson.error || `Erro ${res.status}: Falha ao atualizar produto #${id}.`);
      }

      const updated: Product = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === id || p.slug === id || p.id === updated.id ? updated : p)));
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
        const errJson = await res.json().catch(() => ({ error: 'Falha ao atualizar estoque' }));
        throw new Error(errJson.error || `Erro ${res.status}: Falha ao atualizar estoque do produto #${id}.`);
      }

      const updated: Product = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === id || p.slug === id ? { ...p, stockCount: updated.stockCount, status: updated.status } : p))
      );
    } catch (error: any) {
      console.error('[PRODUCTS] Erro ao atualizar estoque:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Falha ao excluir produto' }));
        throw new Error(errJson.error || `Erro ${res.status}: Falha ao excluir produto #${id}.`);
      }

      setProducts((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
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
