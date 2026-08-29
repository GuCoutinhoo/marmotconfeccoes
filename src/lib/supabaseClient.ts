import { createClient } from '@supabase/supabase-js';
import { Product, Category, Address, Order, CartItem, ProductVariant } from '../types';

const SUPABASE_PROJECT_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_DEFAULT_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const getEnvVar = (viteKey: string, processKey: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env && (import.meta as any).env[viteKey]) {
      return (import.meta as any).env[viteKey];
    }
  } catch {}
  if (typeof process !== 'undefined' && process.env && process.env[processKey]) {
    return process.env[processKey]!;
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'SUPABASE_URL', SUPABASE_PROJECT_URL);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', SUPABASE_DEFAULT_ANON_KEY);

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
let cachedAuthSession: boolean = false;
let authInFlightPromise: Promise<any> | null = null;

export async function getAuthenticatedSupabaseClient() {
  if (!isSupabaseConfigured()) return supabase;
  if (cachedAuthSession) return supabase;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      cachedAuthSession = true;
      return supabase;
    }

    if (!authInFlightPromise) {
      authInFlightPromise = supabase.auth.signInWithPassword({
        email: 'admin@marmot.com',
        password: 'marmot',
      }).then((authRes) => {
        if (authRes.data?.session) {
          cachedAuthSession = true;
        }
      }).catch((err) => {
        console.warn('[Supabase Auth Client] Notice during authentication:', err);
      }).finally(() => {
        authInFlightPromise = null;
      });
    }

    await authInFlightPromise;
  } catch (err) {
    console.warn('[Supabase Auth Client] Notice during authentication:', err);
  }
  return supabase;
}

/**
 * Normalizes any Supabase Product record (whether snake_case columns, camelCase, or jsonb data payload)
 * into a typed frontend Product model.
 */
export function mapSupabaseRowToProduct(row: any): Product {
  if (!row) return {} as Product;
  const d = (row.data && typeof row.data === 'object') ? row.data : {};

  const primaryImg = row.image || (Array.isArray(row.images) && row.images[0]) || d.image || (Array.isArray(d.images) && d.images[0]) || '';
  const allImagesList = Array.isArray(row.images) && row.images.length > 0
    ? (primaryImg && row.images[0] !== primaryImg ? [primaryImg, ...row.images.filter((x: string) => x !== primaryImg)] : row.images)
    : (primaryImg ? [primaryImg] : (Array.isArray(d.images) && d.images.length > 0 ? d.images : []));

  const rawColors = Array.isArray(row.colors) && row.colors.length > 0
    ? row.colors
    : (Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : [{ color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' }]);

  const cleanColors = rawColors.map((c: any) => {
    const variantImages: string[] = Array.isArray(c.images) && c.images.length > 0
      ? c.images
      : (c.featuredImage ? [c.featuredImage] : (c.image ? [c.image] : []));
    const featured = c.featuredImage || variantImages[0] || c.image || primaryImg;
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
    id: String(row.id || d.id || `prod-${Date.now()}`),
    slug: String(row.slug || d.slug || (row.title ? row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')),
    title: row.title || d.title || 'Produto Streetwear',
    subtitle: row.subtitle || d.subtitle || '',
    description: row.description || d.description || '',
    price: typeof row.price === 'number' ? row.price : parseFloat(row.price || d.price || 0),
    promoPrice: row.promo_price !== undefined && row.promo_price !== null
      ? parseFloat(row.promo_price)
      : (d.promoPrice !== undefined && d.promoPrice !== null ? parseFloat(d.promoPrice) : undefined),
    category: String(row.category || d.category || 'camisetas').toLowerCase().trim(),
    subcategory: String(row.subcategory || d.subcategory || 'Essenciais').trim(),
    collection: row.collection || d.collection || 'Vol. 04: Cyber Dystopia',
    tags: Array.isArray(row.tags) ? row.tags : (Array.isArray(d.tags) ? d.tags : ['Lançamento']),
    rating: typeof row.rating === 'number' ? row.rating : parseFloat(row.rating || d.rating || 5.0),
    reviewCount: typeof row.review_count === 'number' ? row.review_count : parseInt(row.review_count || d.reviewCount || 0, 10),
    stockCount: typeof row.stock_count === 'number' ? row.stock_count : parseInt(row.stock_count || d.stockCount || 20, 10),
    sku: row.sku || d.sku || `MM-${Math.floor(1000 + Math.random() * 9000)}`,
    sizes: Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : (Array.isArray(d.sizes) && d.sizes.length > 0 ? d.sizes : ['P', 'M', 'G', 'GG']),
    colors: cleanColors,
    image: primaryImg,
    images: allImagesList,
    details: Array.isArray(row.details) ? row.details : (Array.isArray(d.details) ? d.details : ['100% Algodão Heavyweight']),
    careInstructions: Array.isArray(row.care_instructions) ? row.care_instructions : (Array.isArray(d.careInstructions) ? d.careInstructions : ['Lavar em ciclo suave']),
    composition: Array.isArray(row.composition) ? row.composition : (Array.isArray(d.composition) ? d.composition : ['100% Algodão']),
    reviews: Array.isArray(row.reviews) ? row.reviews : (Array.isArray(d.reviews) ? d.reviews : []),
    weight: typeof row.weight === 'number' ? row.weight : parseFloat(row.weight || d.weight || 0.35),
    height: typeof row.height === 'number' ? row.height : parseFloat(row.height || d.height || 4),
    width: typeof row.width === 'number' ? row.width : parseFloat(row.width || d.width || 20),
    length: typeof row.length === 'number' ? row.length : parseFloat(row.length || d.length || 25),
    isNewRelease: row.is_new_release !== undefined ? Boolean(row.is_new_release) : Boolean(d.isNewRelease),
    isBestSeller: row.is_best_seller !== undefined ? Boolean(row.is_best_seller) : Boolean(d.isBestSeller),
    featured: row.featured !== undefined ? Boolean(row.featured) : Boolean(d.featured),
    status: (row.status || d.status || 'active') as any,
    createdAt: row.created_at || d.createdAt || new Date().toISOString(),
  };
}

/**
 * Normalizes any Supabase Category record into a typed frontend Category model.
 */
export function mapSupabaseRowToCategory(row: any): Category {
  if (!row) return {} as Category;
  const d = (row.data && typeof row.data === 'object') ? row.data : {};

  return {
    id: String(row.id || d.id || row.slug || d.slug || `cat-${Date.now()}`),
    slug: String(row.slug || d.slug || row.name || d.name || '').toLowerCase().trim(),
    name: row.name || d.name || 'Categoria',
    tagline: row.tagline || d.tagline || '',
    description: row.description || d.description || '',
    image: row.image || d.image || '',
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : (Array.isArray(d.subcategories) ? d.subcategories : ['Geral']),
    productCount: typeof row.product_count === 'number' ? row.product_count : (typeof d.productCount === 'number' ? d.productCount : 0),
    order: typeof row.order === 'number' ? row.order : (typeof d.order === 'number' ? d.order : 0),
    active: row.active !== undefined ? Boolean(row.active) : (d.active !== undefined ? Boolean(d.active) : true),
    createdAt: row.created_at || d.createdAt || new Date().toISOString(),
  };
}

export const PRODUCT_SELECT_COLUMNS =
  'id, slug, title, subtitle, description, price, promo_price, category, subcategory, collection, tags, rating, review_count, stock_count, sku, sizes, colors, image, images, details, care_instructions, composition, weight, height, width, length, is_new_release, is_best_seller, featured, status, created_at, updated_at';

let supabaseProductFetchRequestId = 0;

/**
 * Validates array of products and deduplicates by unique product.id using Map.
 * Discards any corrupted, null or missing-id records.
 */
export function validateAndDeduplicateProducts(products: Product[]): Product[] {
  if (!Array.isArray(products) || products.length === 0) return [];
  const byId = new Map<string, Product>();

  for (const item of products) {
    if (!item || typeof item !== 'object') continue;
    const cleanId = String(item.id || '').trim();
    if (!cleanId) continue;
    // Map ensures each unique id appears exactly once (latest or valid item)
    byId.set(cleanId, item);
  }

  return Array.from(byId.values());
}

/**
 * Executes a deterministic, reliable product query from Supabase.
 * - Enforces order('id', { ascending: true }) on all attempts and pages.
 * - Dynamic pagination supporting unlimited products without hardcoded range limits.
 * - Strict ALL-OR-NOTHING semantics: ANY failed batch in a multi-batch attempt discards the entire attempt.
 * - Controlled retry with limited backoff for transient network issues.
 * - Deduplication by unique product.id.
 */
export async function fetchProductsFromSupabaseDirect(): Promise<{ products: Product[]; error?: any }> {
  const reqId = ++supabaseProductFetchRequestId;
  console.log(`[PRODUCTS] request #${reqId} started`);

  const maxAttempts = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      console.log(`[PRODUCTS] request #${reqId} retry attempt ${attempt}/${maxAttempts}...`);
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }

    try {
      // 1. Primary Query: Single deterministic fast query ordered by id
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_COLUMNS)
        .order('id', { ascending: true });

      if (!error && data && Array.isArray(data)) {
        const mapped = data.map(mapSupabaseRowToProduct);
        const unique = validateAndDeduplicateProducts(mapped);
        console.log(`[PRODUCTS] primary query success rows=${data.length}, unique=${unique.length}`);
        return { products: unique };
      }

      if (error) {
        lastError = error;
        console.warn(`[PRODUCTS] request #${reqId} primary query notice:`, error.message || error);
      }

      // 2. Dynamic Batch Fallback with strict All-or-Nothing validation
      console.log(`[PRODUCTS] request #${reqId} attempting dynamic sequential batches...`);
      const pageSize = 60;
      let page = 0;
      let hasMore = true;
      let batchFailed = false;
      const allBatchRows: any[] = [];

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: pageData, error: pageError } = await supabase
          .from('products')
          .select(PRODUCT_SELECT_COLUMNS)
          .order('id', { ascending: true })
          .range(from, to);

        if (pageError || !pageData || !Array.isArray(pageData)) {
          console.warn(`[PRODUCTS] batch ${page} failed (${pageError?.message || 'invalid data'}) — discarding partial result`);
          batchFailed = true;
          lastError = pageError || new Error(`Batch ${page} returned invalid data`);
          break; // Stop immediately; do NOT accept partial data!
        }

        console.log(`[PRODUCTS] batch ${page} rows=${pageData.length}`);
        allBatchRows.push(...pageData);

        if (pageData.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // ONLY accept the batch result if ALL batches succeeded without any error
      if (!batchFailed && allBatchRows.length > 0) {
        const mapped = allBatchRows.map(mapSupabaseRowToProduct);
        const unique = validateAndDeduplicateProducts(mapped);
        console.log(`[PRODUCTS] final unique rows=${unique.length} from all batches`);
        return { products: unique };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[PRODUCTS] request #${reqId} exception during attempt ${attempt}:`, err?.message || err);
    }
  }

  // Graceful fallback to backend API if Supabase encounters a temporary issue
  try {
    console.log(`[PRODUCTS] request #${reqId} Supabase direct failed, checking backend /api/products...`);
    const apiRes = await fetch('/api/products', { cache: 'no-store' });
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData && Array.isArray(apiData.products) && apiData.products.length > 0) {
        const unique = validateAndDeduplicateProducts(apiData.products);
        console.log(`[PRODUCTS] request #${reqId} backend api fallback rows=${unique.length}`);
        return { products: unique };
      }
    }
  } catch (apiErr) {
    console.warn(`[PRODUCTS] request #${reqId} backend api fallback failed:`, apiErr);
  }

  console.warn(`[PRODUCTS] request #${reqId} failed completely — preserving current state`);
  return { products: [], error: lastError || new Error('Failed to load products from all sources') };
}

export const SUPABASE_STORAGE_BUCKET = 'product-images';

/**
 * Uploads an image file or base64 to Supabase Storage 'product-images' bucket
 * or falls back to backend storage proxy. Preserves 100% of the original quality and resolution.
 */
export async function uploadProductImageToStorage(
  source: File | Blob | string,
  productId: string = 'general',
  customName?: string
): Promise<string> {
  // If it's already an absolute or uploaded URL, return directly
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('/uploads/'))) {
    return source;
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
  const filePath = `products/${cleanProdId}/${uniqueId}.${ext}`;

  // 1. First Attempt: Upload original file directly to Supabase Storage via Authenticated Supabase Client
  if (blob) {
    try {
      const client = await getAuthenticatedSupabaseClient();
      const { data: uploadData, error: uploadErr } = await client.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(filePath, blob, {
          contentType,
          cacheControl: '31536000',
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = client.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .getPublicUrl(filePath);

        if (urlData && urlData.publicUrl) {
          console.log('[STORAGE] Upload concluído no Supabase Storage com qualidade original:', urlData.publicUrl);
          return urlData.publicUrl;
        }
      } else if (uploadErr) {
        console.warn('[STORAGE] Direct Supabase upload notice:', uploadErr.message);
      }
    } catch (err: any) {
      console.warn('[STORAGE] Direct Supabase upload exception:', err?.message);
    }
  }

  // 2. Second Attempt: Proxy upload to backend /api/upload preserving full resolution and bytes
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
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
            console.log('[STORAGE] Upload via backend proxy preservando qualidade:', data.url);
            return data.url;
          }
        }
      }
    } catch (proxyErr) {
      console.warn('[STORAGE] Backend upload proxy notice:', proxyErr);
    }
  }

  // 3. Fallback: If network failed, return original data URL or string
  if (typeof source === 'string') {
    return source;
  }

  return '';
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
    const bucketToken = `/${SUPABASE_STORAGE_BUCKET}/`;
    const idx = imageUrl.indexOf(bucketToken);
    if (idx === -1) return false;

    const storagePath = imageUrl.substring(idx + bucketToken.length).split('?')[0];
    if (!storagePath) return false;

    const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([storagePath]);
    if (error) {
      console.warn('[STORAGE] Aviso ao remover imagem antiga:', error.message);
      return false;
    }
    console.log('[STORAGE] Imagem antiga removida do Storage:', storagePath);
    return true;
  } catch (err: any) {
    console.warn('[STORAGE] Exceção ao remover imagem antiga:', err?.message);
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
    stock_count: product.stockCount !== undefined ? product.stockCount : 20,
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
 * Inserts a new product into Supabase table 'products'.
 */
export async function createProductInSupabase(productData: Partial<Product>): Promise<{ product: Product | null; error?: any }> {
  console.log('[PRODUCTS] Inserindo novo produto no Supabase via INSERT', productData.title);
  try {
    const sb = await getAuthenticatedSupabaseClient();
    const title = productData.title?.trim() || 'Novo Produto';
    const slug =
      productData.slug?.trim() ||
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-') + `-${Date.now().toString().slice(-4)}`;

    const id = productData.id || `prod-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const price = typeof productData.price === 'number' ? productData.price : parseFloat(String(productData.price || 199.9));
    const promoPrice = productData.promoPrice !== undefined && productData.promoPrice !== null ? parseFloat(String(productData.promoPrice)) : undefined;

    const rawImages = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : (productData.image ? [productData.image] : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80']);
    const rawMainImage = rawImages[0];

    const newProduct: Product = {
      id,
      slug,
      title,
      subtitle: productData.subtitle?.trim() || '',
      description: productData.description?.trim() || '',
      price: isNaN(price) ? 199.9 : price,
      promoPrice: promoPrice && !isNaN(promoPrice) ? promoPrice : undefined,
      category: productData.category || 'camisetas',
      subcategory: productData.subcategory?.trim() || 'Essenciais',
      collection: productData.collection?.trim() || 'Vol. 04: Cyber Dystopia',
      tags: Array.isArray(productData.tags) ? productData.tags : ['Lançamento'],
      rating: productData.rating || 5.0,
      reviewCount: productData.reviewCount || 0,
      stockCount: productData.stockCount !== undefined ? parseInt(String(productData.stockCount), 10) : 25,
      sku: productData.sku?.trim() || `MM-${Math.floor(1000 + Math.random() * 9000)}`,
      sizes: Array.isArray(productData.sizes) && productData.sizes.length > 0 ? productData.sizes : ['P', 'M', 'G', 'GG'],
      colors: Array.isArray(productData.colors) && productData.colors.length > 0 ? productData.colors : [
        { color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' },
      ],
      image: rawMainImage,
      images: rawImages,
      details: Array.isArray(productData.details) ? productData.details : ['100% Algodão Heavyweight 260g/m²'],
      careInstructions: Array.isArray(productData.careInstructions) ? productData.careInstructions : ['Lavar em ciclo suave', 'Secar na sombra'],
      composition: Array.isArray(productData.composition) ? productData.composition : ['100% Algodão Heavyweight 260g/m²'],
      reviews: [],
      weight: Number(productData.weight || 0.35),
      height: Number(productData.height || 4),
      width: Number(productData.width || 20),
      length: Number(productData.length || 25),
      isNewRelease: Boolean(productData.isNewRelease),
      isBestSeller: Boolean(productData.isBestSeller),
      featured: Boolean(productData.featured),
      status: (productData.status as any) || 'active',
      createdAt: new Date().toISOString(),
    };

    const payload = buildProductSupabasePayload(newProduct);

    // DIRECT INSERT ONLY with authenticated client
    const { data, error } = await sb
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[PRODUCTS] Erro ao criar no Supabase via INSERT:', error.message || error);
      return { product: null, error };
    }

    const created = mapSupabaseRowToProduct(data || payload);
    console.log('[PRODUCTS] Produto criado com sucesso via INSERT no Supabase:', created.id);
    return { product: created };
  } catch (err: any) {
    console.error('[PRODUCTS] Exceção ao criar produto no Supabase:', err);
    return { product: null, error: err };
  }
}

/**
 * Updates an existing product in Supabase table 'products' using individual field UPDATE.
 * NEVER performs full upserts.
 */
export async function updateProductInSupabase(id: string, updates: Partial<Product>): Promise<{ product: Product | null; error?: any }> {
  console.log('[PRODUCTS] Atualizando produto no Supabase (individual UPDATE)', id);
  try {
    const sb = await getAuthenticatedSupabaseClient();
    const cleanId = String(id).trim();
    const patchPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) patchPayload.title = updates.title.trim();
    if (updates.slug !== undefined) patchPayload.slug = updates.slug.trim();
    if (updates.subtitle !== undefined) patchPayload.subtitle = updates.subtitle.trim();
    if (updates.description !== undefined) patchPayload.description = updates.description.trim();
    if (updates.price !== undefined) patchPayload.price = parseFloat(String(updates.price));
    if (updates.promoPrice !== undefined) {
      patchPayload.promo_price = updates.promoPrice !== null && updates.promoPrice !== undefined ? parseFloat(String(updates.promoPrice)) : null;
    }
    if (updates.category !== undefined) patchPayload.category = String(updates.category).toLowerCase().trim();
    if (updates.subcategory !== undefined) patchPayload.subcategory = updates.subcategory.trim();
    if (updates.collection !== undefined) patchPayload.collection = updates.collection.trim();
    if (updates.tags !== undefined) patchPayload.tags = updates.tags;
    if (updates.rating !== undefined) patchPayload.rating = parseFloat(String(updates.rating));
    if (updates.reviewCount !== undefined) patchPayload.review_count = parseInt(String(updates.reviewCount), 10);
    if (updates.stockCount !== undefined) patchPayload.stock_count = parseInt(String(updates.stockCount), 10);
    if (updates.sku !== undefined) patchPayload.sku = updates.sku.trim();
    if (updates.sizes !== undefined) patchPayload.sizes = updates.sizes;
    if (updates.colors !== undefined) patchPayload.colors = updates.colors;

    // Strict image & images consistency: image MUST equal images[0]
    if (updates.images !== undefined) {
      const imgs = Array.isArray(updates.images) ? updates.images : (updates.images ? [updates.images] : []);
      patchPayload.images = imgs;
      patchPayload.image = imgs[0] || updates.image || '';
    } else if (updates.image !== undefined) {
      patchPayload.image = updates.image;
      patchPayload.images = updates.image ? [updates.image] : [];
    }

    if (updates.details !== undefined) patchPayload.details = updates.details;
    if (updates.careInstructions !== undefined) patchPayload.care_instructions = updates.careInstructions;
    if (updates.composition !== undefined) patchPayload.composition = updates.composition;
    if (updates.weight !== undefined) patchPayload.weight = parseFloat(String(updates.weight));
    if (updates.height !== undefined) patchPayload.height = parseFloat(String(updates.height));
    if (updates.width !== undefined) patchPayload.width = parseFloat(String(updates.width));
    if (updates.length !== undefined) patchPayload.length = parseFloat(String(updates.length));
    if (updates.isNewRelease !== undefined) patchPayload.is_new_release = Boolean(updates.isNewRelease);
    if (updates.isBestSeller !== undefined) patchPayload.is_best_seller = Boolean(updates.isBestSeller);
    if (updates.featured !== undefined) patchPayload.featured = Boolean(updates.featured);
    if (updates.status !== undefined) patchPayload.status = updates.status;

    // Individual UPDATE with authenticated client
    const { data, error } = await sb
      .from('products')
      .update(patchPayload)
      .eq('id', cleanId)
      .select()
      .single();

    if (error) {
      console.error('[PRODUCTS] Erro no UPDATE do Supabase:', error.message || error);
      return { product: null, error };
    }

    const updated = mapSupabaseRowToProduct(data);
    console.log('[PRODUCTS] Produto atualizado com sucesso via UPDATE no Supabase:', updated.id);
    return { product: updated };
  } catch (err: any) {
    console.error('[PRODUCTS] Exceção ao atualizar produto no Supabase:', err);
    return { product: null, error: err };
  }
}

/**
 * Updates stock count of a product in Supabase table 'products'.
 */
export async function updateProductStockInSupabase(id: string, stockCount: number): Promise<{ product: Product | null; error?: any }> {
  console.log('[PRODUCTS] atualizando produto no Supabase (estoque)', id, stockCount);
  try {
    const sb = await getAuthenticatedSupabaseClient();
    const cleanId = String(id).trim();
    const newStock = Math.max(0, parseInt(String(stockCount), 10));
    const newStatus = newStock <= 0 ? 'out_of_stock' : 'active';

    const { data, error } = await sb
      .from('products')
      .update({
        stock_count: newStock,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cleanId)
      .select()
      .single();

    if (error) {
      console.error('[PRODUCTS] erro ao atualizar estoque no Supabase:', error.message || error);
      return { product: null, error };
    }

    const updated = mapSupabaseRowToProduct(data);
    return { product: updated };
  } catch (err: any) {
    console.error('[PRODUCTS] exceção ao atualizar estoque no Supabase:', err);
    return { product: null, error: err };
  }
}

/**
 * Deletes a product from Supabase table 'products'.
 */
export async function deleteProductInSupabase(id: string): Promise<{ success: boolean; error?: any }> {
  console.log('[PRODUCTS] excluindo produto no Supabase', id);
  try {
    const sb = await getAuthenticatedSupabaseClient();
    const cleanId = String(id).trim();
    const { error } = await sb
      .from('products')
      .delete()
      .or(`id.eq.${cleanId},slug.eq.${cleanId}`);

    if (error) {
      console.error('[PRODUCTS] erro ao excluir no Supabase:', error.message || error);
      return { success: false, error };
    }

    console.log('[PRODUCTS] produto excluído com sucesso no Supabase:', cleanId);
    return { success: true };
  } catch (err: any) {
    console.error('[PRODUCTS] exceção ao excluir produto no Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Direct query to Supabase for categories with fallback handling.
 */
export async function fetchCategoriesFromSupabaseDirect(): Promise<{ categories: Category[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('[Supabase Client Direct] Erro ao carregar categorias:', error.message || error);
      return { categories: [], error };
    }

    if (!data || data.length === 0) {
      return { categories: [] };
    }

    const mapped = data.map(mapSupabaseRowToCategory);
    return { categories: mapped };
  } catch (err: any) {
    console.error('[Supabase Client Direct] Exceção ao buscar categorias:', err);
    return { categories: [], error: err };
  }
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
    total,
    paymentMethod: row.payment_method || d.paymentMethod || 'Cartão de Crédito',
    shippingAddress,
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
    paymentDetails: d.paymentDetails || {
      mercadoPagoPreferenceId: row.mercado_pago_preference_id || null,
      mercadoPagoPaymentId: row.mercado_pago_payment_id || null,
      paidAt: row.paid_at || null,
    },
    melhorEnvioShipmentId: row.melhor_envio_shipment_id || d.melhorEnvioShipmentId,
    melhorEnvioProtocol: row.melhor_envio_protocol || d.melhorEnvioProtocol,
    melhorEnvioLabelUrl: row.melhor_envio_label_url || d.melhorEnvioLabelUrl,
    shippingLabelUrl: row.shipping_label_url || d.shippingLabelUrl,
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



