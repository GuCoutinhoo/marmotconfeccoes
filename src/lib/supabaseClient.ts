import { createClient } from '@supabase/supabase-js';
import { Product, Category, Address, Order, CartItem, ProductVariant } from '../types';

const SUPABASE_PROJECT_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_DEFAULT_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_ANON_KEY;
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
 * Normalizes any Supabase Product record (whether snake_case columns, camelCase, or jsonb data payload)
 * into a typed frontend Product model.
 */
export function mapSupabaseRowToProduct(row: any): Product {
  if (!row) return {} as Product;
  const d = (row.data && typeof row.data === 'object') ? row.data : {};

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
    colors: Array.isArray(row.colors) && row.colors.length > 0 ? row.colors : (Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : [{ color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' }]),
    image: row.image || d.image || (Array.isArray(row.images) && row.images[0]) || (Array.isArray(d.images) && d.images[0]) || '',
    images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (Array.isArray(d.images) && d.images.length > 0 ? d.images : (row.image ? [row.image] : (d.image ? [d.image] : []))),
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

/**
 * Direct query to Supabase for products with fallback handling and detailed error reporting.
 */
export async function fetchProductsFromSupabaseDirect(): Promise<{ products: Product[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Client Direct] Erro ao carregar produtos:', error.message || error);
      return { products: [], error };
    }

    if (!data || data.length === 0) {
      return { products: [] };
    }

    const mapped = data.map(mapSupabaseRowToProduct);
    return { products: mapped };
  } catch (err: any) {
    console.error('[Supabase Client Direct] Exceção ao buscar produtos:', err);
    return { products: [], error: err };
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



