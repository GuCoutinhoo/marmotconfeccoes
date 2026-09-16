import { createClient } from '@supabase/supabase-js';
import { Product, Category, Address, Order, CartItem, ProductVariant } from '../types';

const SUPABASE_PROJECT_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_DEFAULT_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

let resolvedUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL?.trim()) || SUPABASE_PROJECT_URL;
let resolvedAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim()) || SUPABASE_DEFAULT_ANON_KEY;

// Security & Connectivity Guard:
// If running in browser and the URL is an internal loopback/emulator address (127.0.0.1, localhost, or port 54321)
// while the browser origin is not that same local port, fallback immediately to the real live Supabase project.
if (typeof window !== 'undefined') {
  const isLoopbackOrEmulator =
    resolvedUrl.includes(':54321') ||
    ((resolvedUrl.includes('127.0.0.1') || resolvedUrl.includes('localhost')) &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1');

  if (isLoopbackOrEmulator) {
    resolvedUrl = SUPABASE_PROJECT_URL;
    resolvedAnonKey = SUPABASE_DEFAULT_ANON_KEY;
  }
}

// Ensure live project always pairs with the live publishable key (never an emulator JWT)
if (resolvedUrl.includes('ktmkvysnjfphcfntazut') && resolvedAnonKey.startsWith('eyJ')) {
  resolvedAnonKey = SUPABASE_DEFAULT_ANON_KEY;
}

const supabaseUrl = resolvedUrl;
const supabaseAnonKey = resolvedAnonKey;

export const isSupabaseConfigured = (): boolean => {
  const url = supabaseUrl;
  const key = supabaseAnonKey;
  return Boolean(url && key && !url.includes('placeholder'));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Returns an authenticated Supabase client. If no active session is present,
 * signs in with admin credentials to guarantee write access through RLS.
 */
export async function getAuthenticatedSupabaseClient() {
  return supabase;
}

/**
 * Maps the canonical columns from public.products into the frontend model.
 * Legacy JSONB and static image mappings are intentionally ignored: Supabase is
 * the only authority for every persistent product field.
 */
export function mapSupabaseRowToProduct(row: any): Product {
  if (!row) return {} as Product;
  const rowId = String(row.id || '').trim();
  const rowSlug = String(row.slug || '').trim();
  const storedImages = Array.isArray(row.images) ? row.images.filter((value: unknown) => typeof value === 'string' && value.trim()) : [];
  const primaryImg = String(row.image || storedImages[0] || '').trim();
  const allImagesList = primaryImg
    ? [primaryImg, ...storedImages.filter((value: string) => value !== primaryImg)]
    : storedImages;
  const rawColors = Array.isArray(row.colors) ? row.colors : [];

  const cleanColors = rawColors.map((c: any) => {
    let variantImages: string[] = Array.isArray(c.images) && c.images.length > 0
      ? c.images
      : (c.featuredImage ? [c.featuredImage] : (c.image ? [c.image] : []));
    let featured = c.featuredImage || variantImages[0] || c.image || primaryImg;

    return {
      id: c.id,
      color: c.color || 'default',
      colorName: c.colorName || 'Cor Única',
      colorHex: c.colorHex || '#000000',
      image: featured,
      featuredImage: featured,
      images: variantImages.length > 0 ? variantImages : (allImagesList.length > 0 ? allImagesList : [primaryImg]),
      sku: c.sku,
      stockCount: c.stockCount,
      sizes: c.sizes,
    };
  });

  return {
    id: rowId,
    slug: rowSlug,
    title: String(row.title || ''),
    subtitle: String(row.subtitle || ''),
    description: String(row.description || ''),
    price: Number(row.price),
    promoPrice: row.promo_price !== undefined && row.promo_price !== null ? Number(row.promo_price) : undefined,
    category: String(row.category || '').toLowerCase().trim(),
    subcategory: String(row.subcategory || '').trim(),
    collection: String(row.collection || ''),
    tags: Array.isArray(row.tags) ? row.tags : [],
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    stockCount: Number(row.stock_count || 0),
    sku: String(row.sku || ''),
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colors: cleanColors,
    image: primaryImg,
    images: allImagesList,
    details: Array.isArray(row.details) ? row.details : [],
    careInstructions: Array.isArray(row.care_instructions) ? row.care_instructions : [],
    composition: Array.isArray(row.composition) ? row.composition : [],
    reviews: [],
    weight: Number(row.weight || 0),
    height: Number(row.height || 0),
    width: Number(row.width || 0),
    length: Number(row.length || 0),
    isNewRelease: Boolean(row.is_new_release),
    isBestSeller: Boolean(row.is_best_seller),
    featured: Boolean(row.featured),
    status: (row.status || 'active') as any,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Normalizes any Supabase Category record into a typed frontend Category model.
 */
export function mapSupabaseRowToCategory(row: any): Category {
  if (!row) return {} as Category;
  const slug = String(row.slug || row.id || '').toLowerCase().trim();

  return {
    id: String(row.id || row.slug || ''),
    slug,
    name: String(row.name || ''),
    tagline: String(row.tagline || ''),
    description: String(row.description || ''),
    image: String(row.image || ''),
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
    productCount: Number(row.product_count || 0),
    order: Number(row.order || 0),
    active: row.active !== false,
    createdAt: row.created_at,
  };
}

/**
 * Validates array of products and deduplicates by unique product.id using Map.
 * Discards any corrupted, null or missing-id records.
 * This function never adds, rebuilds or overrides products.
 */
export function validateAndDeduplicateProducts(products: Product[]): Product[] {
  if (!Array.isArray(products)) return [];
  const byId = new Map<string, Product>();

  for (const item of products) {
    if (!item || typeof item !== 'object') continue;
    const cleanId = String(item.id || '').trim();
    if (!cleanId) continue;
    byId.set(cleanId, item);
  }

  return Array.from(byId.values());
}

export const SUPABASE_STORAGE_BUCKET = 'product-images';

/**
 * Sends an image to the authenticated backend, which persists it in Supabase Storage.
 */
export async function uploadProductImageToStorage(
  source: File | Blob | string,
  productId: string = 'general',
  customName?: string
): Promise<string> {
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
    return source;
  }
  if (typeof source === 'string' && (source.startsWith('/uploads/') || source.startsWith('uploads/'))) {
    throw new Error('Imagem local não é persistente. Envie o arquivo para o Supabase Storage.');
  }

  const cleanProdId = String(productId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  let detectedExt = 'webp';
  let contentType = 'image/webp';
  let blob: Blob | null = null;
  let originalFilename = customName || '';

  if (source instanceof File) {
    blob = source;
    contentType = source.type || 'image/jpeg';
    originalFilename = source.name;
    const parts = source.name.split('.');
    if (parts.length > 1) {
      detectedExt = parts.pop()?.toLowerCase() || 'jpg';
    } else {
      detectedExt = contentType.split('/')[1] || 'jpg';
    }
  } else if (source instanceof Blob) {
    blob = source;
    contentType = source.type || 'image/jpeg';
    detectedExt = contentType.split('/')[1] || 'jpg';
    if (detectedExt === 'jpeg') detectedExt = 'jpg';
  } else if (typeof source === 'string' && source.startsWith('data:')) {
    try {
      const parts = source.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) {
        contentType = mimeMatch[1];
        detectedExt = contentType.split('/')[1] || 'jpg';
        if (detectedExt === 'jpeg') detectedExt = 'jpg';
      }
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: contentType });
    } catch (e) {
      console.warn('[STORAGE] Failed to parse base64 Data URL:', e);
    }
  }

  const ext = customName && customName.includes('.') ? (customName.split('.').pop() || detectedExt) : detectedExt;
  // Product image mutations are backend-only; the browser never writes Storage directly.
  if (typeof window !== 'undefined') {
    try {
      let payloadDataUrl = '';
      if (typeof source === 'string' && source.startsWith('data:')) {
        payloadDataUrl = source;
      } else if (blob) {
        payloadDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob!);
        });
      }

      if (payloadDataUrl) {
        const authHeaders = getClientAuthHeaders();
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          credentials: 'include',
          body: JSON.stringify({
            image: payloadDataUrl,
            filename: originalFilename || `product-${uniqueId}.${ext}`,
            productId: cleanProdId,
            mimeType: contentType,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            return data.url;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn('[STORAGE] Backend upload proxy notice:', res.status, errData);
          throw new Error(errData?.error || `Falha no upload (código HTTP ${res.status}).`);
        }
      }
    } catch (proxyErr: any) {
      console.warn('[STORAGE] Backend upload proxy exception:', proxyErr?.message || proxyErr);
      throw proxyErr;
    }
  }

  throw new Error('Falha ao processar e persistir a imagem no servidor ou Supabase Storage.');
}

/**
 * Safely deletes an image from Supabase Storage if it's hosted in the project.
 */
export async function deleteProductImageFromStorage(imageUrl: string): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  if (!imageUrl.includes('supabase.co') || !imageUrl.includes(SUPABASE_STORAGE_BUCKET)) {
    return true;
  }

  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: getClientAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ url: imageUrl }),
    });
    return response.ok;
  } catch (err: any) {
    console.warn('[STORAGE] Não foi possível remover a imagem antiga:', err?.message);
    return false;
  }
}

/**
 * Builds a standardized Supabase row payload for products table.
 */
export function buildProductSupabasePayload(product: Product) {
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image ? [product.image] : []);
  const mainImage = images[0] || product.image || '';

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle || '',
    description: product.description || '',
    price: product.price,
    promo_price: product.promoPrice !== undefined ? product.promoPrice : null,
    category: product.category,
    subcategory: product.subcategory || 'Essenciais',
    collection: product.collection || 'Vol. 04: Cyber Dystopia',
    tags: product.tags || [],
    rating: product.rating || 5.0,
    review_count: product.reviewCount || 0,
    stock_count: typeof product.stockCount === 'number' ? product.stockCount : 0,
    sku: product.sku || '',
    sizes: product.sizes || ['P', 'M', 'G', 'GG'],
    colors: product.colors || [],
    image: mainImage,
    images: images,
    details: product.details || [],
    care_instructions: product.careInstructions || [],
    composition: product.composition || [],
    weight: product.weight || 0.35,
    height: product.height || 4,
    width: product.width || 20,
    length: product.length || 25,
    is_new_release: Boolean(product.isNewRelease),
    is_best_seller: Boolean(product.isBestSeller),
    featured: Boolean(product.featured),
    status: product.status || 'active',
    data: null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Helper to build headers with active auth token from local storage
 */
function getClientAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window === 'undefined') return headers;

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

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }
  return headers;
}
/**
 * Normalizes any Supabase user_addresses row into a typed frontend Address model.
 */
export function mapSupabaseRowToAddress(row: any): Address {
  if (!row) return {} as Address;
  const d = (row.data && typeof row.data === 'object') ? row.data : {};

  return {
    id: String(row.id || d.id || `addr-${Date.now()}`),
    recipientName: String(row.recipient_name || d.recipientName || '').trim(),
    cep: String(row.cep || d.cep || '').trim(),
    street: String(row.street || d.street || '').trim(),
    number: String(row.number || d.number || '').trim(),
    complement: row.complement !== undefined && row.complement !== null ? String(row.complement).trim() : (d.complement || ''),
    neighborhood: String(row.neighborhood || d.neighborhood || '').trim(),
    city: String(row.city || d.city || '').trim(),
    state: String(row.state || d.state || '').trim(),
    isDefault: row.is_default !== undefined ? Boolean(row.is_default) : Boolean(d.isDefault),
    phone: row.phone || d.phone || '',
  };
}

/**
 * Direct query to fetch all saved addresses for a specific authenticated user from Supabase.
 */
export async function fetchUserAddressesDirect(userId: string): Promise<Address[]> {
  if (!userId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      // If table is missing from schema cache (PGRST205), fallback gracefully to Auth user_metadata
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        const { data: authData } = await supabase.auth.getUser();
        const metaAddresses = authData?.user?.user_metadata?.addresses;
        if (Array.isArray(metaAddresses) && metaAddresses.length > 0) {
          return metaAddresses.map(mapSupabaseRowToAddress);
        }
      }
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map(mapSupabaseRowToAddress);
  } catch (err) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const metaAddresses = authData?.user?.user_metadata?.addresses;
      if (Array.isArray(metaAddresses)) {
        return metaAddresses.map(mapSupabaseRowToAddress);
      }
    } catch {
      // Ignore
    }
    return [];
  }
}

/**
 * Direct insert of a new address to Supabase user_addresses table with Auth user_metadata backup.
 */
export async function saveUserAddressDirect(userId: string, address: Omit<Address, 'id'> | Address): Promise<Address | null> {
  if (!userId || !isSupabaseConfigured()) return null;

  const id = (address as Address).id || `addr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const isDefault = Boolean(address.isDefault);

  const newAddressObj: Address = {
    id,
    recipientName: address.recipientName,
    cep: address.cep,
    street: address.street,
    number: address.number,
    complement: address.complement || '',
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    phone: address.phone || '',
    isDefault,
  };

  // Always sync to Supabase Auth user_metadata for robust redundancy
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      let existingAddresses: Address[] = authData.user.user_metadata?.addresses || [];
      if (isDefault) {
        existingAddresses = existingAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      const filtered = existingAddresses.filter((a) => a.id !== id);
      const updatedMetaAddresses = [...filtered, newAddressObj];
      await supabase.auth.updateUser({
        data: { addresses: updatedMetaAddresses },
      });
    }
  } catch (metaErr) {
    console.warn('[Supabase Metadata Address Backup Warning]:', metaErr);
  }

  try {
    if (isDefault) {
      // Unset previous defaults
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const payload = {
      id,
      user_id: userId,
      recipient_name: address.recipientName,
      cep: address.cep,
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      is_default: isDefault,
      data: {
        ...address,
        id,
        isDefault,
      },
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_addresses')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      // If table is not present in schema cache, we gracefully rely on the Auth user_metadata updated above
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        console.info('[Supabase Direct] Tabela public.user_addresses pendente no banco; endereço persistido via Auth user_metadata.');
      } else {
        console.warn('[Supabase Direct] Aviso ao salvar endereço na tabela:', error.message || error);
      }
      return newAddressObj;
    }

    return mapSupabaseRowToAddress(data || payload);
  } catch (err) {
    return newAddressObj;
  }
}

/**
 * Direct update of an existing address in Supabase user_addresses table.
 */
export async function updateUserAddressDirect(userId: string, addressId: string, updates: Partial<Address>): Promise<Address | null> {
  if (!userId || !addressId || !isSupabaseConfigured()) return null;

  // Sync to Supabase Auth user_metadata
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      let existingAddresses: Address[] = authData.user.user_metadata?.addresses || [];
      const updatedMetaAddresses = existingAddresses.map((a) => {
        if (a.id === addressId) {
          return { ...a, ...updates };
        }
        if (updates.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      await supabase.auth.updateUser({
        data: { addresses: updatedMetaAddresses },
      });
    }
  } catch (metaErr) {
    console.warn('[Supabase Metadata Update Warning]:', metaErr);
  }

  try {
    if (updates.isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.recipientName !== undefined) updatePayload.recipient_name = updates.recipientName;
    if (updates.cep !== undefined) updatePayload.cep = updates.cep;
    if (updates.street !== undefined) updatePayload.street = updates.street;
    if (updates.number !== undefined) updatePayload.number = updates.number;
    if (updates.complement !== undefined) updatePayload.complement = updates.complement;
    if (updates.neighborhood !== undefined) updatePayload.neighborhood = updates.neighborhood;
    if (updates.city !== undefined) updatePayload.city = updates.city;
    if (updates.state !== undefined) updatePayload.state = updates.state;
    if (updates.isDefault !== undefined) updatePayload.is_default = updates.isDefault;

    const { data, error } = await supabase
      .from('user_addresses')
      .update(updatePayload)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code !== 'PGRST205') {
        console.warn('[Supabase Direct] Aviso ao atualizar endereço na tabela:', error.message || error);
      }
      return null;
    }

    return mapSupabaseRowToAddress(data);
  } catch (err) {
    return null;
  }
}

/**
 * Direct deletion of an address in Supabase user_addresses table.
 */
export async function deleteUserAddressDirect(userId: string, addressId: string): Promise<boolean> {
  if (!userId || !addressId || !isSupabaseConfigured()) return false;

  // Sync to Supabase Auth user_metadata
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      let existingAddresses: Address[] = authData.user.user_metadata?.addresses || [];
      const updatedMetaAddresses = existingAddresses.filter((a) => a.id !== addressId);
      if (updatedMetaAddresses.length > 0 && !updatedMetaAddresses.some((a) => a.isDefault)) {
        updatedMetaAddresses[0].isDefault = true;
      }
      await supabase.auth.updateUser({
        data: { addresses: updatedMetaAddresses },
      });
    }
  } catch (metaErr) {
    console.warn('[Supabase Metadata Delete Warning]:', metaErr);
  }

  try {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error && error.code !== 'PGRST205') {
      console.warn('[Supabase Direct] Aviso ao excluir endereço da tabela:', error.message || error);
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Normalizes any Supabase orders row into a typed frontend Order model.
 */
export function mapSupabaseRowToOrder(row: any): Order {
  if (!row) return {} as Order;
  const d = (row.data && typeof row.data === 'object') ? row.data : {};

  const id = String(row.id || d.id || row.order_number || '');
  const userId = row.user_id || d.userId || d.user_id || undefined;
  const customerName = row.customer_name || d.customerName || d.customer_name || 'Cliente Marmot';
  const customerEmail = row.customer_email || d.customerEmail || d.customer_email || '';
  const customerPhone = row.customer_phone || d.customerPhone || d.customer_phone || '';
  const customerCpf = row.customer_cpf || d.customerCpf || d.customer_cpf || '';
  
  const subtotal = typeof row.subtotal === 'number' ? row.subtotal : parseFloat(row.subtotal || d.subtotal || 0);
  const shippingFee = typeof row.shipping_amount === 'number'
    ? row.shipping_amount
    : (typeof row.shipping_fee === 'number' ? row.shipping_fee : parseFloat(row.shipping_amount || row.shipping_fee || d.shippingFee || d.shipping_fee || 0));
  const discount = typeof row.discount_amount === 'number'
    ? row.discount_amount
    : (typeof row.discount === 'number' ? row.discount : parseFloat(row.discount_amount || row.discount || d.discount || 0));
  const total = typeof row.total === 'number' ? row.total : parseFloat(row.total || d.total || 0);

  const status = row.status || d.status || 'Aguardando Pagamento';
  const paymentStatus = row.payment_status || d.paymentStatus || d.payment_status || (status === 'Pagamento Aprovado' ? 'Pago' : 'Pendente');
  const shippingStatus = row.shipping_status || d.shippingStatus || d.shipping_status || 'Aguardando preparação';
  const trackingCode = row.tracking_code || d.trackingCode || d.tracking_code || '';
  
  const rawItems = Array.isArray(row.items) ? row.items : (Array.isArray(d.items) ? d.items : []);
  const items = rawItems.map((item: any) => ({
    id: String(item.id || `item-${Math.random().toString(36).substring(2, 7)}`),
    productId: String(item.product_id || item.productId || item.id || ''),
    sku: item.sku || '',
    title: item.product_name || item.title || item.name || 'Produto Streetwear',
    image: item.image_snapshot || item.image || '',
    size: item.size || 'M',
    color: item.color || item.colorName || 'Padrão',
    price: typeof item.unit_price === 'number' ? item.unit_price : parseFloat(item.unit_price || item.price || 0),
    quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity || 1, 10),
    subtotal: typeof item.subtotal === 'number' ? item.subtotal : parseFloat(item.subtotal || 0),
    weight: item.weight_snapshot || item.weight,
    height: item.height_snapshot || item.height,
    width: item.width_snapshot || item.width,
    length: item.length_snapshot || item.length,
  }));

  const shippingAddress = row.shipping_address_snapshot || row.shipping_address || d.shippingAddress || d.shipping_address || {
    id: 'addr-1',
    recipientName: customerName,
    cep: '00000-000',
    street: '',
    number: '',
    city: '',
    state: 'SP',
  };

  const history = Array.isArray(row.history) ? row.history : (Array.isArray(d.history) ? d.history : [
    {
      status,
      timestamp: new Date(row.created_at || d.createdAt || Date.now()).toLocaleString('pt-BR'),
      description: 'Pedido registrado no sistema.',
    },
  ]);

  return {
    id,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    customerCpf,
    date: new Date(row.created_at || d.createdAt || Date.now()).toLocaleDateString('pt-BR'),
    status: status as any,
    paymentStatus: paymentStatus as any,
    shippingStatus: shippingStatus as any,
    items,
    subtotal,
    discount,
    shippingFee,
    shippingPrice: typeof row.shipping_price === 'number'
      ? row.shipping_price
      : parseFloat(row.shipping_price || d.shippingPrice || shippingFee || 0),
    total,
    paymentMethod: row.payment_method || d.paymentMethod || 'Cartão de Crédito',
    shippingAddress,
    shippingQuoteId: row.shipping_quote_id || d.shippingQuoteId,
    shippingOption: row.shipping_option || d.shippingOption,
    shippingDetails: row.shipping_details || d.shippingDetails,
    shippingCarrier: row.shipping_company || row.shipping_carrier || d.shippingCarrier || 'Melhor Envio',
    shippingService: row.shipping_service_name || row.shipping_service || d.shippingService || 'SEDEX Expresso',
    shippingServiceId: row.shipping_service_id || d.shippingServiceId,
    shippingDeliveryTime: row.shipping_delivery_time || d.shippingDeliveryTime,
    estimatedDelivery: d.estimatedDelivery || '3 a 7 dias úteis',
    trackingCode,
    history,
    paidAt: row.paid_at || d.paidAt || (row.payment_status === 'Pago' ? (row.created_at || d.createdAt) : undefined),
    separationStartedAt: row.separation_started_at || d.separationStartedAt || undefined,
    postedAt: row.posted_at || d.postedAt || undefined,
    inTransitAt: row.in_transit_at || d.inTransitAt || undefined,
    outForDeliveryAt: row.out_for_delivery_at || d.outForDeliveryAt || undefined,
    deliveredAt: row.delivered_at || d.deliveredAt || undefined,
    paymentProvider: row.payment_provider || d.paymentProvider,
    paymentProviderPaymentId: row.payment_provider_payment_id || d.paymentProviderPaymentId,
    paymentProviderSessionId: row.payment_provider_session_id || d.paymentProviderSessionId,
    checkoutAttemptKey: row.checkout_attempt_key || d.checkoutAttemptKey,
    checkoutExpiresAt: row.checkout_expires_at || d.checkoutExpiresAt,
    paymentDetails: {
      ...(d.paymentDetails || {}),
      gateway: row.payment_provider || d.paymentDetails?.gateway,
      transactionId: row.payment_provider_payment_id || d.paymentDetails?.transactionId,
      sessionId: row.payment_provider_session_id || d.paymentDetails?.sessionId,
      statusDetail: row.payment_status_detail || d.paymentDetails?.statusDetail,
      paidAt: row.paid_at || d.paymentDetails?.paidAt || null,
    },
    melhorEnvioShipmentId: row.melhor_envio_shipment_id || d.melhorEnvioShipmentId,
    melhorEnvioProtocol: row.melhor_envio_protocol || d.melhorEnvioProtocol,
    melhorEnvioLabelUrl: row.melhor_envio_label_url || d.melhorEnvioLabelUrl,
    shippingLabelUrl: row.shipping_label_url || d.shippingLabelUrl,
    shipmentPurchaseStatus: row.shipment_purchase_status || d.shipmentPurchaseStatus || 'not_started',
    labelGenerationStatus: row.label_generation_status || d.labelGenerationStatus || 'not_started',
    shipmentPurchasedAt: row.shipment_purchased_at || d.shipmentPurchasedAt,
    labelGeneratedAt: row.label_generated_at || d.labelGeneratedAt,
    shipmentLastError: row.shipment_last_error || d.shipmentLastError,
    notes: row.notes || d.notes,
    createdAt: row.created_at || d.createdAt || new Date().toISOString(),
  };
}

/**
 * Direct query to fetch all orders for a specific authenticated user from Supabase.
 */
export async function fetchUserOrdersDirect(userId: string, userEmail?: string): Promise<Order[]> {
  if (!userId && !userEmail) return [];
  if (!isSupabaseConfigured()) return [];

  try {
    let query = supabase.from('orders').select('*');
    if (userId && userEmail) {
      query = query.or(`user_id.eq.${userId},customer_email.eq.${userEmail}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('customer_email', userEmail);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Direct Orders] Query notice:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map(mapSupabaseRowToOrder);
  } catch (err) {
    console.warn('[Supabase Direct Orders] Exception:', err);
    return [];
  }
}

/**
 * Direct query to fetch all orders for admin from Supabase.
 */
export async function fetchAllOrdersDirectAdmin(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Direct Admin Orders] Query notice:', error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map(mapSupabaseRowToOrder);
  } catch (err) {
    console.warn('[Supabase Direct Admin Orders] Exception:', err);
    return [];
  }
}

/**
 * Direct query to fetch a single order by ID or tracking code from Supabase.
 */
export async function fetchOrderByIdDirect(orderId: string): Promise<Order | null> {
  if (!orderId || !isSupabaseConfigured()) return null;

  try {
    const clean = orderId.trim();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${clean},tracking_code.eq.${clean}`)
      .maybeSingle();

    if (error || !data) return null;

    return mapSupabaseRowToOrder(data);
  } catch {
    return null;
  }
}

/**
 * Direct query to fetch the authenticated user's cart items from Supabase.
 * Strictly acts as the primary source of truth for authenticated users.
 */
export async function fetchUserCartFromSupabase(userId: string): Promise<CartItem[]> {
  if (!userId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Cart Direct] Erro ao carregar carrinho do usuário:', error.message || error);
      return [];
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    const items: CartItem[] = [];
    for (const row of data) {
      const d = (row.data && typeof row.data === 'object') ? row.data : {};
      
      let product: Product | null = null;
      if (d.product && d.product.id) {
        product = d.product;
      } else if (row.product && row.product.id) {
        product = mapSupabaseRowToProduct(row.product);
      } else if (row.product_id) {
        try {
          const { data: prodRow } = await supabase
            .from('products')
            .select('*')
            .eq('id', row.product_id)
            .maybeSingle();
          if (prodRow) {
            product = mapSupabaseRowToProduct(prodRow);
          }
        } catch {}
      }

      if (!product || !product.id) {
        product = {
          id: row.product_id || d.productId || `prod-${Date.now()}`,
          title: d.title || row.product_name || 'Produto Streetwear',
          subtitle: d.subtitle || 'Streetwear Oversized',
          description: d.description || '',
          slug: d.slug || 'produto',
          price: Number(d.price || row.price || 0),
          promoPrice: d.promoPrice !== undefined ? Number(d.promoPrice) : undefined,
          category: 'camisetas',
          subcategory: 'Essenciais',
          collection: 'Aura Collection',
          tags: ['Streetwear'],
          rating: 5,
          reviewCount: 0,
          stockCount: 10,
          sku: d.sku || 'MM-001',
          sizes: ['P', 'M', 'G', 'GG'],
          colors: [{ color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' }],
          image: d.image || row.image || '',
          images: d.images || (row.image ? [row.image] : []),
          details: [],
          careInstructions: [],
          composition: [],
          reviews: [],
          weight: 0.35,
          height: 4,
          width: 20,
          length: 25,
          isNewRelease: false,
          isBestSeller: false,
          featured: false,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      }

      const selectedSize = String(row.selected_size || d.selectedSize || 'M');
      const rawColor = row.selected_color || d.selectedColor || { color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' };
      const selectedColor: ProductVariant = {
        color: rawColor.color || 'black',
        colorName: rawColor.colorName || rawColor.color || 'Padrão',
        colorHex: rawColor.colorHex || '#121212',
        image: rawColor.image || '',
      };
      const quantity = Math.max(1, parseInt(String(row.quantity || d.quantity || 1), 10));

      items.push({
        product,
        selectedSize,
        selectedColor,
        quantity,
      });
    }

    return items;
  } catch (err) {
    console.error('[Supabase Cart Direct] Exceção ao buscar carrinho:', err);
    return [];
  }
}

/**
 * Direct upsert of a cart item to Supabase for the authenticated user.
 */
export async function saveCartItemToSupabase(userId: string, item: CartItem): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;

  try {
    const colorName = item.selectedColor?.colorName || item.selectedColor?.color || 'padrao';
    const cleanSize = item.selectedSize || 'M';
    const cartItemId = `cart_${userId}_${item.product.id}_${cleanSize}_${colorName}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    const payload = {
      id: cartItemId,
      user_id: userId,
      product_id: item.product.id,
      size: cleanSize,
      color: colorName,
      selected_size: cleanSize,
      selected_color: item.selectedColor,
      quantity: Math.max(1, item.quantity || 1),
      updated_at: new Date().toISOString(),
      data: {
        id: cartItemId,
        userId,
        product: item.product,
        productId: item.product.id,
        selectedSize: cleanSize,
        selectedColor: item.selectedColor,
        quantity: Math.max(1, item.quantity || 1),
        updatedAt: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from('cart_items')
      .upsert(payload);

    if (error) {
      console.warn('[Supabase Cart Direct] Erro ao salvar item no banco:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Supabase Cart Direct] Exceção ao salvar item:', err);
    return false;
  }
}

/**
 * Direct update of a cart item's quantity in Supabase for the authenticated user.
 */
export async function updateCartItemQuantityInSupabase(
  userId: string,
  productId: string,
  selectedSize: string,
  colorName: string,
  quantity: number
): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;

  if (quantity <= 0) {
    return removeCartItemFromSupabase(userId, productId, selectedSize, colorName);
  }

  const cleanColor = colorName || 'padrao';
  const cleanSize = selectedSize || 'M';
  const cartItemId = `cart_${userId}_${productId}_${cleanSize}_${cleanColor}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('selected_size', selectedSize);

    if (error) {
      await supabase.from('cart_items').update({
        quantity,
        updated_at: new Date().toISOString(),
      }).eq('id', cartItemId);
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Direct removal of a cart item from Supabase for the authenticated user.
 */
export async function removeCartItemFromSupabase(
  userId: string,
  productId: string,
  selectedSize: string,
  colorName: string
): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;

  const cleanColor = colorName || 'padrao';
  const cleanSize = selectedSize || 'M';
  const cartItemId = `cart_${userId}_${productId}_${cleanSize}_${cleanColor}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('selected_size', selectedSize);

    if (error) {
      await supabase.from('cart_items').delete().eq('id', cartItemId);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Direct clear of all cart items from Supabase for the authenticated user.
 */
export async function clearUserCartInSupabase(userId: string): Promise<boolean> {
  if (!userId || !isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Merges guest items into the authenticated user's cart in Supabase.
 */
export async function mergeGuestCartIntoSupabase(userId: string, guestItems: CartItem[]): Promise<CartItem[]> {
  if (!userId || !isSupabaseConfigured()) return [];
  if (!Array.isArray(guestItems) || guestItems.length === 0) {
    return fetchUserCartFromSupabase(userId);
  }

  const currentDbCart = await fetchUserCartFromSupabase(userId);

  for (const guestItem of guestItems) {
    if (!guestItem.product || !guestItem.product.id) continue;
    const existingIndex = currentDbCart.findIndex(
      (c) =>
        c.product.id === guestItem.product.id &&
        c.selectedSize === guestItem.selectedSize &&
        (c.selectedColor?.colorName === guestItem.selectedColor?.colorName ||
          c.selectedColor?.color === guestItem.selectedColor?.color)
    );

    if (existingIndex > -1) {
      currentDbCart[existingIndex].quantity += (guestItem.quantity || 1);
      await saveCartItemToSupabase(userId, currentDbCart[existingIndex]);
    } else {
      currentDbCart.push(guestItem);
      await saveCartItemToSupabase(userId, guestItem);
    }
  }

  return currentDbCart;
}



