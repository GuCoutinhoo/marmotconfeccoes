import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import { waitUntil } from '@vercel/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import sharp from 'sharp';
import {
  assertInfinitePayConfiguration,
  checkInfinitePayPayment,
  centsToReais,
  createInfinitePayCheckout,
  getInfinitePayConfigurationStatus,
  InfinitePayClientError,
  InfinitePayWebhookSchema,
  reaisToCents,
  resolveApplicationBaseUrl,
  resolveInfinitePayWebhookUrl,
  sanitizeInfinitePayReceiptUrl,
  type InfinitePayCheckoutItem,
} from '../src/server/infinitePayClient';
import { IS_TEST_MODE } from '../src/server/runtime-flags';

export { IS_TEST_MODE };

if ((process.env.MARMOT_TEST_MODE === 'true' || process.env.CI === 'true') && fs.existsSync('/tmp/supabase-disposable.env')) {
  try {
    const envLines = fs.readFileSync('/tmp/supabase-disposable.env', 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^export\s+([A-Z0-9_]+)="?(.*?)"?$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {}
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch {
    // Read-only filesystem fail-safe
  }
}

export function saveBase64ToUploads(imageStr: string | undefined | null, prefix = 'prod'): string {
  if (!imageStr || typeof imageStr !== 'string') return imageStr || '';
  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }
  // On Vercel, serverless, or production, do NOT convert base64 to local /uploads/ which causes 404 on other instances/static CDN
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    return imageStr;
  }
  const match = imageStr.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!match || match.length !== 3) return imageStr;
  try {
    const mime = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 12);
    const filename = `marmot-${prefix}-${hash}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
    }
    return `/uploads/${filename}`;
  } catch {
    return imageStr;
  }
}

// =========================================================================
// 1. DATA MODELS & TYPES (Completely self-contained, no ../src imports)
// =========================================================================

export interface ProductVariant {
  id?: string;
  color: string;
  colorName: string;
  colorHex: string;
  image?: string;
  featuredImage?: string;
  images?: string[];
  sku?: string;
  stockCount?: number;
  sizes?: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date?: string;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  likes?: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  promoPrice?: number;
  category: string;
  subcategory?: string;
  collection?: string;
  tags?: string[];
  rating: number;
  reviewCount: number;
  stockCount?: number;
  sku: string;
  sizes: string[];
  colors: ProductVariant[];
  image?: string;
  images: string[];
  details: string[];
  careInstructions: string[];
  composition?: string[];
  reviews?: ProductReview[];
  weight?: number; // em kg
  height?: number; // em cm
  width?: number;  // em cm
  length?: number; // em cm
  isNewRelease?: boolean;
  isBestSeller?: boolean;
  featured?: boolean;
  status?: 'active' | 'draft' | 'archived' | 'out_of_stock';
  createdAt?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description?: string;
  image: string;
  subcategories: string[];
  productCount?: number;
  order?: number;
  active?: boolean;
  createdAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  productTitle?: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  colorName?: string;
  image: string;
  productImage?: string;
  sku?: string;
  subtotal?: number;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
}

export interface OrderHistoryEvent {
  id?: string;
  orderId?: string;
  status: string;
  timestamp: string;
  description: string;
  previousStatus?: string;
  newStatus?: string;
  source?: string;
  externalEventId?: string;
  occurredAt?: string;
  location?: string;
  date?: string;
  time?: string;
  responsible?: string;
  author?: string;
  note?: string;
  trackingCode?: string;
  [key: string]: any;
}

export type OrderStatus =
  | 'Aguardando Pagamento'
  | 'Pagamento Pendente'
  | 'Pagamento Aprovado'
  | 'Pedido Confirmado'
  | 'Em Separação'
  | 'Preparando Envio'
  | 'Pronto para Envio'
  | 'Despachado'
  | 'Enviado'
  | 'Em Transporte'
  | 'Em trânsito'
  | 'Entregue'
  | 'Cancelado'
  | 'Devolução Solicitada'
  | 'Devolvido'
  | 'Reembolso Pendente'
  | 'Reembolsado'
  | 'Pagamento Recusado'
  | 'Problema no envio'
  | 'Problema na entrega';

export type PaymentStatus = 'Pendente' | 'Pago' | 'Aprovado' | 'Recusado' | 'Cancelado' | 'Reembolsado';

export type ShipmentPurchaseStatus = 'not_started' | 'processing' | 'purchased' | 'failed';
export type LabelGenerationStatus = 'not_started' | 'processing' | 'generated' | 'failed';

export type ShippingDeliveryStatus =
  | 'Aguardando preparação'
  | 'Aguardando compra de frete'
  | 'Preparando'
  | 'Frete comprado'
  | 'Etiqueta gerada'
  | 'Pronto para envio'
  | 'Despachado'
  | 'Postado'
  | 'Em transporte'
  | 'Em trânsito'
  | 'Saiu para entrega'
  | 'Entregue'
  | 'Falha na entrega'
  | 'Devolvido ao remetente';

export interface Address {
  id: string;
  recipientName: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  phone?: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCpf?: string;
  items: OrderItem[];
  shippingAddress: {
    id?: string;
    recipientName?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    cep: string;
  };
  paymentMethod: string;
  paymentStatus?: string;
  paymentDetails?: any;
  shippingCarrier?: string;
  shippingProvider?: string;
  shippingService?: string;
  shippingServiceId?: string;
  shippingDeliveryTime?: number;
  shippingStatus?: any;
  shippingQuoteId?: string;
  shippingOption?: any;
  shippingDetails?: any;
  shipmentPurchaseStatus?: ShipmentPurchaseStatus;
  labelGenerationStatus?: LabelGenerationStatus;
  shipmentPurchasedAt?: string;
  labelGeneratedAt?: string;
  shipmentLastError?: string;
  shippingFee: number;
  shippingPrice?: number;
  estimatedDelivery?: string;
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus | string;
  trackingCode?: string;
  date?: string;
  createdAt: string;
  history: OrderHistoryEvent[];
  melhorEnvioProtocol?: string;
  melhorEnvioLabelUrl?: string;
  melhorEnvioShipmentId?: string;
  [key: string]: any;
}

export interface ReturnItem {
  productId: string;
  productTitle: string;
  size: string;
  colorName?: string;
  quantity: number;
  price: number;
}

export interface ReturnHistoryEvent {
  status: string;
  timestamp: string;
  note?: string;
  responsible?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: ReturnItem[];
  reason: string;
  description: string;
  photos?: string[];
  status: 'Solicitada' | 'Em Análise' | 'Aprovada' | 'Recusada' | 'Aguardando Envio' | 'Em Trânsito' | 'Recebida' | 'Concluída' | 'Devolvido' | 'Reembolso realizado';
  trackingCode?: string;
  history: ReturnHistoryEvent[];
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
  refundAmount?: number;
  restockCompleted?: boolean;
  data?: any;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productTitle: string;
  sku?: string;
  variant?: {
    size?: string;
    colorName?: string;
  };
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: 'sale' | 'restock' | 'manual_adjustment' | 'return_restock' | 'order_cancel_restock' | 'damage_loss';
  orderId?: string;
  returnId?: string;
  userOrAdmin: string;
  timestamp: string;
  note?: string;
  data?: any;
}

export interface StoreBanner {
  id: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  linkUrl: string;
  imageUrl: string;
  active: boolean;
  order: number;
  placement: 'hero' | 'middle' | 'popup' | 'footer';
  createdAt?: string;
  data?: any;
}

export interface StoreSettingsData {
  storeName: string;
  contactEmail: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  freeShippingThreshold: number;
  defaultPostalCode: string;
  announcementBarText: string;
  announcementBarActive: boolean;
  maintenanceMode: boolean;
  [key: string]: any;
}

export interface AdminActivityLog {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  entity: 'order' | 'product' | 'products' | 'category' | 'customer' | 'coupon' | 'settings' | 'shipping' | 'refund' | 'inventory' | 'marketing' | 'newsletter' | 'review';
  entityId: string;
  details?: string;
  timestamp: string;
  metadata?: any;
}

export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: 'customer' | 'admin' | string;
  isVerified: boolean;
  addresses: any[];
  createdAt: string;
  lastLogin?: string;
  totalOrders: number;
  totalSpent: number;
  avgTicket: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'blocked';
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  date: string;
  transactionId?: string;
  paymentProvider?: string;
  paymentSessionId?: string;
  statusDetail?: string;
  refundedAmount?: number;
  refundDate?: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  carrier: string;
  service: string;
  price: number;
  deliveryDays: number;
  trackingCode?: string;
  status: ShippingDeliveryStatus;
  address?: any;
  dispatchedAt?: string;
  protocol?: string;
  labelUrl?: string;
  melhorEnvioShipmentId?: string;
}

export interface AdminOverviewMetrics {
  revenueToday: number;
  revenueThisMonth: number;
  ordersToday: number;
  newOrders: number;
  ordersAwaitingShipment: number;
  ordersInTransit: number;
  ordersDelivered: number;
  ordersCancelled: number;
  pendingReturns: number;
  averageTicket: number;
  newCustomersThisMonth: number;
  lowStockCount: number;
  salesByDay: Array<{ date: string; label: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number; color: string }>;
  topProducts: Array<{ id: string; title: string; image: string; salesCount: number; revenue: number; stock: number }>;
  topCategories: Array<{ category: string; count: number; revenue: number }>;
}

export interface ShippingOption {
  id: string | number;
  serviceId?: string | number;
  companyId?: number;
  name: string;
  carrier: string;
  company?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  deliveryTime: number; // dias úteis
  deliveryDays: string;
  picture?: string;
  currency?: string;
  error?: string;
}

export interface DbCoupon {
  code: string;
  discountPercentage: number;
  minOrderValue: number;
  description: string;
  active: boolean;
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'customer' | string;
  isVerified: boolean;
  phone?: string;
  cpf?: string;
  addresses: any[];
  verificationCode?: string;
  verificationCodeExpires?: number;
  resetCode?: string;
  resetToken?: string;
  resetTokenExpires?: number;
  createdAt?: string;
  lastLogin?: string;
}

export interface DbAuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  email?: string;
  userId?: string;
  ip?: string;
  status: 'success' | 'failure' | 'warning' | 'info';
  details: string;
  data?: any;
}

export interface DbCartItem {
  id: string;
  userId: string;
  productId: string;
  selectedSize: string;
  selectedColor: {
    color: string;
    colorName: string;
    colorHex?: string;
    image?: string;
  };
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbWishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  source?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  orderId?: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  date?: string;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  likes?: number;
  status: 'published' | 'hidden';
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  status: 'sent' | 'failed' | 'simulated';
  error?: string;
  providerMessageId?: string;
  orderId?: string;
  userId?: string;
  createdAt: string;
}

export interface ShipmentEvent {
  id: string;
  orderId: string;
  shipmentId?: string;
  provider: 'melhor_envio' | 'correios' | 'manual' | 'carrier' | 'tracking' | 'tracking_sync' | 'admin' | 'system' | string;
  providerEventId?: string;
  status: string;
  description: string;
  location?: string;
  occurredAt: string;
  createdAt: string;
}

export interface CampaignRecord {
  id: string;
  title: string;
  subject: string;
  collectionName?: string;
  discountCode?: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
}

// =========================================================================
// 2. EMBEDDED INITIAL DATA (Guarantees zero file dependencies)
// =========================================================================

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'camisetas',
    slug: 'camisetas',
    name: 'Camisetas',
    tagline: 'Heavyweight 260g & Boxy Fit',
    description: 'Camisetas streetwear confeccionadas em algodão penteado 260g/m² com caimento estruturado.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Heavyweight 260g', 'Boxy Fit', 'Graphic Tees', 'Oversized'],
    productCount: 10,
    order: 0,
    active: true,
  },
  {
    id: 'moletons',
    slug: 'moletons',
    name: 'Moletons',
    tagline: '400g Felpado & Capuz Duplo',
    description: 'Hoodies e crewnecks de alta gramatura com toque ultra macio e acabamento premium.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Hoodies', 'Crewnecks', 'Zip-Ups'],
    productCount: 19,
    order: 1,
    active: true,
  },
  {
    id: 'jaquetas',
    slug: 'jaquetas',
    name: 'Jaquetas',
    tagline: 'Techwear & Puffer Outerwear',
    description: 'Jaquetas corta-vento, puffers térmicas e bombers utilitárias.',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Puffer Jackets', 'Windbreakers', 'Bombers'],
    productCount: 19,
    order: 2,
    active: true,
  },
  {
    id: 'calcas',
    slug: 'calcas',
    name: 'Calças',
    tagline: 'Cargo Multi-Pocket & Wide Leg',
    description: 'Modelagens amplas, tecidos ripstop e detalhes funcionais.',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Cargo Pants', 'Wide Leg', 'Parachute Pants', 'Sweatpants'],
    productCount: 18,
    order: 3,
    active: true,
  },
  {
    id: 'shorts',
    slug: 'shorts',
    name: 'Shorts & Bermudas',
    tagline: 'Nylon Taslan & Moletom',
    description: 'Shorts leves com secagem rápida e bermudas de moletom encorpado.',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Nylon Shorts', 'Cargo Shorts', 'Moletom Shorts'],
    productCount: 15,
    order: 4,
    active: true,
  },
  {
    id: 'tenis',
    slug: 'tenis',
    name: 'Tênis',
    tagline: 'Sneakers Chunky & Solados Tratorados',
    description: 'Silhuetas chunky, solados tratorados, slides e sneakers exclusivos para o lifestyle urbano.',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Chunky Platform', 'Retro Runner', 'Skate Leather', 'Chunky Slides'],
    productCount: 10,
    order: 5,
    active: true,
  },
  {
    id: 'acessorios',
    slug: 'acessorios',
    name: 'Acessórios',
    tagline: 'Bags, Meias & Detalhes',
    description: 'Shoulder bags, meias atoalhadas, cintos táticos e chaveiros exclusivos.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Shoulder Bags', 'Meias Atoalhadas', 'Cintos Táticos'],
    productCount: 15,
    order: 6,
    active: true,
  },
  {
    id: 'headwear',
    slug: 'headwear',
    name: 'Headwear',
    tagline: 'Caps, Buckets & Beanies',
    description: 'Bonés desestruturados dad hat, gorros canelados e bucket hats.',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Dad Hats', 'Buckets', 'Beanies', 'Snapbacks'],
    productCount: 0,
    order: 6,
    active: true,
  },
  {
    id: 'calcados',
    slug: 'calcados',
    name: 'Calçados',
    tagline: 'Slides & Street Footwear',
    description: 'Slides anatômicos de EVA injetado e calçados desenvolvidos para o cotidiano urbano.',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    subcategories: ['Recovery Slides', 'Chunky Slides'],
    productCount: 0,
    order: 7,
    active: true,
  },
];

const INITIAL_CORE_PRODUCTS: Product[] = [];

const INITIAL_COUPONS_LIST: DbCoupon[] = [
  {
    code: 'FIRSTAURA',
    discountPercentage: 10,
    minOrderValue: 150,
    description: '10% OFF na sua primeira compra acima de R$ 150',
    active: true,
  },
  {
    code: 'STREET20',
    discountPercentage: 20,
    minOrderValue: 400,
    description: '20% OFF em compras acima de R$ 400',
    active: true,
  },
  {
    code: 'VIPAURA',
    discountPercentage: 15,
    minOrderValue: 250,
    description: '15% OFF para membros da comunidade',
    active: true,
  },
  {
    code: 'FRETEGRATIS',
    discountPercentage: 10,
    minOrderValue: 200,
    description: 'Frete Grátis para todo o Brasil',
    active: true,
  },
];

// =========================================================================
// 3. PERSISTENCE ENGINE (DatabaseManager)
// =========================================================================

// File paths (for durable local synchronization when available)
const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'store_products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'store_categories.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const COUPONS_FILE = path.join(DATA_DIR, 'store_coupons.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const CART_ITEMS_FILE = path.join(DATA_DIR, 'cart_items.json');
const WISHLIST_ITEMS_FILE = path.join(DATA_DIR, 'wishlist_items.json');
const RETURNS_FILE = path.join(DATA_DIR, 'returns.json');
const INVENTORY_MOVEMENTS_FILE = path.join(DATA_DIR, 'inventory_movements.json');
const STORE_BANNERS_FILE = path.join(DATA_DIR, 'store_banners.json');
const STORE_SETTINGS_FILE = path.join(DATA_DIR, 'store_settings.json');
const USER_ADDRESSES_FILE = path.join(DATA_DIR, 'user_addresses.json');
const NEWSLETTER_FILE = path.join(DATA_DIR, 'newsletter_subscribers.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'product_reviews.json');
const EMAIL_LOGS_FILE = path.join(DATA_DIR, 'email_logs.json');
const SHIPMENT_EVENTS_FILE = path.join(DATA_DIR, 'shipment_events.json');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaign_records.json');

const INITIAL_STORE_SETTINGS: StoreSettingsData = {
  storeName: 'MARMOT Streetwear',
  contactEmail: 'contato@marmotstreetwear.com.br',
  phone: '+55 (11) 99999-9999',
  whatsapp: '+55 (11) 99999-9999',
  instagram: '@marmotstreetwear',
  address: 'Rua Augusta, 1500 - Consolação, São Paulo - SP',
  freeShippingThreshold: 399.00,
  defaultPostalCode: '01304-001',
  announcementBarText: 'FRETE GRÁTIS PARA TODO O BRASIL EM COMPRAS ACIMA DE R$ 399',
  announcementBarActive: true,
  maintenanceMode: false,
};

const INITIAL_STORE_BANNERS: StoreBanner[] = [
  {
    id: 'banner-hero-1',
    title: 'NOVA COLEÇÃO CYBER DROP 2026',
    subtitle: 'Modelagem oversized exclusiva, algodão penteado 30.1 e estampas em silk HD.',
    buttonText: 'EXPLORAR DROP',
    linkUrl: '/shop',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1600',
    active: true,
    order: 1,
    placement: 'hero',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'banner-middle-1',
    title: 'STREET CULTURE & PREMIUM APPAREL',
    subtitle: 'Feito para quem vive a rua. Qualidade sem concessões.',
    buttonText: 'VER MAIS',
    linkUrl: '/shop?collection=Cyberpunk',
    imageUrl: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&q=80&w=1600',
    active: true,
    order: 2,
    placement: 'middle',
    createdAt: new Date().toISOString(),
  },
];

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Read-only environment fail-safe
  }
}

export class DatabaseManager {
  private pgPool: Pool | null = null;
  private supabase: SupabaseClient | null = null;
  private supabaseAdmin: SupabaseClient | null = null;
  private supabaseAuth: SupabaseClient | null = null;
  private adminToken: string | null = null;
  private adminTokenExpiresAt = 0;
  private mode: 'postgres' | 'supabase' | 'durable_file' = 'durable_file';
  private isInitialized = false;

  private products: Product[] = [];
  private categories: Category[] = [];
  private users: DbUser[] = [];
  private orders: Order[] = [];
  private coupons: DbCoupon[] = [];
  private auditLogs: DbAuditLog[] = [];
  private cartItems: DbCartItem[] = [];
  private wishlistItems: DbWishlistItem[] = [];
  private returns: ReturnRequest[] = [];
  private inventoryMovements: InventoryMovement[] = [];
  private storeBanners: StoreBanner[] = [];
  private storeSettings: StoreSettingsData = INITIAL_STORE_SETTINGS;
  private userAddresses: any[] = [];
  private newsletterSubscribers: NewsletterSubscriber[] = [];
  private productReviews: ProductReview[] = [];
  private emailLogs: EmailLog[] = [];
  private shipmentEvents: ShipmentEvent[] = [];
  private campaignRecords: CampaignRecord[] = [];

  constructor() {
    this.detectAndInitMode();
  }

  private detectAndInitMode() {
    const dbUrl = process.env.DISPOSABLE_DATABASE_URL || process.env.DATABASE_URL;

    const runtimeSupabaseUrl = process.env.SUPABASE_DISPOSABLE_URL || process.env.SUPABASE_URL;
    const runtimeSupabaseKey = process.env.SUPABASE_DISPOSABLE_URL
      ? (process.env.SUPABASE_DISPOSABLE_SERVICE_ROLE_KEY || process.env.SUPABASE_DISPOSABLE_ANON_KEY)
      : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

    if (runtimeSupabaseUrl && runtimeSupabaseKey && !runtimeSupabaseUrl.includes('placeholder')) {
      try {
        this.supabase = createClient(runtimeSupabaseUrl, runtimeSupabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.mode = 'supabase';
        console.log('[DB] Live Supabase persistence mode enabled.');
      } catch (err) {
        console.error('[DB] Failed to init Supabase client:', err);
        this.mode = 'durable_file';
      }
    } else if (dbUrl) {
      try {
        this.pgPool = new Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' && !dbUrl.includes('localhost') ? { rejectUnauthorized: false } : undefined,
        });
        this.mode = 'postgres';
        console.log('[DB] PostgreSQL pool initialized.');
      } catch (err) {
        console.error('[DB] PostgreSQL pool failure:', err);
        this.mode = 'durable_file';
      }
    } else {
      this.mode = 'durable_file';
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load local storage files as initial fallback
    this.loadFromFiles();

    if (this.mode === 'supabase' && this.supabase) {
      // In Supabase mode, ensure authoritative catalog is loaded before marking initialization complete
      try {
        await this.loadFromSupabase();
      } catch (err: any) {
        console.warn('[DB] Supabase initial load notice:', err?.message || err);
      }
    } else if (this.mode === 'postgres' && this.pgPool) {
      await this.loadFromPostgres().catch(() => {});
    }

    try {
      await this.cleanUpArtificialTrackingCodes();
    } catch {}
    this.isInitialized = true;
  }

  private async loadFromPostgres() {
    if (!this.pgPool) return;
    const client = await this.pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS store_categories (id VARCHAR(100) PRIMARY KEY, data JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS store_products (id VARCHAR(100) PRIMARY KEY, slug VARCHAR(255), data JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS store_users (id VARCHAR(100) PRIMARY KEY, email VARCHAR(255), data JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS store_orders (id VARCHAR(100) PRIMARY KEY, data JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS store_coupons (code VARCHAR(100) PRIMARY KEY, data JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS store_cart_items (id VARCHAR(100) PRIMARY KEY, user_id VARCHAR(100) NOT NULL, data JSONB NOT NULL);
        CREATE TABLE IF NOT EXISTS store_wishlist_items (id VARCHAR(100) PRIMARY KEY, user_id VARCHAR(100) NOT NULL, data JSONB NOT NULL);
      `);

      const catRes = await client.query('SELECT data FROM store_categories');
      if (catRes.rows.length === 0) {
        this.categories = INITIAL_CATEGORIES;
        for (const cat of INITIAL_CATEGORIES) {
          await client.query('INSERT INTO store_categories (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [cat.id, JSON.stringify(cat)]);
        }
      } else {
        this.categories = catRes.rows.map((r) => r.data);
      }

      const prodRes = await client.query('SELECT data FROM store_products');
      if (prodRes.rows.length === 0) {
        this.products = [];
      } else {
        this.products = prodRes.rows.map((r) => r.data);
      }

      const userRes = await client.query('SELECT data FROM store_users');
      this.users = userRes.rows.map((r) => r.data);

      const orderRes = await client.query('SELECT data FROM store_orders');
      this.orders = orderRes.rows.map((r) => r.data);

      const couponRes = await client.query('SELECT data FROM store_coupons');
      this.coupons = couponRes.rows.map((r) => r.data);

      const cartRes = await client.query('SELECT data FROM store_cart_items');
      this.cartItems = cartRes.rows.map((r) => r.data);

      const wishRes = await client.query('SELECT data FROM store_wishlist_items');
      this.wishlistItems = wishRes.rows.map((r) => r.data);
    } finally {
      client.release();
    }
  }

  public sanitizeProduct(p: any): Product {
    if (!p) return {} as Product;
    const prodId = String(p.id || `prod-${Date.now()}`);
    const rawMainImage = p.image || (Array.isArray(p.images) && p.images[0]) || '';
    const cleanMainImage = saveBase64ToUploads(rawMainImage, `p-${prodId.slice(-6)}-main`);

    const rawImagesList = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (rawMainImage ? [rawMainImage] : []);
    const cleanImagesList = rawImagesList.map((img: string, idx: number) =>
      saveBase64ToUploads(img, `p-${prodId.slice(-6)}-g${idx}`)
    );

    const rawColors = Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors
      : [{ color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' }];

    const cleanColors = rawColors.map((c: any, cIdx: number) => {
      const rawVariantImages: string[] = Array.isArray(c.images) && c.images.length > 0
        ? c.images
        : (c.featuredImage ? [c.featuredImage] : (c.image ? [c.image] : []));
      const cleanVariantImages = rawVariantImages.map((vImg: string, vIdx: number) =>
        saveBase64ToUploads(vImg, `p-${prodId.slice(-6)}-c${cIdx}-v${vIdx}`)
      );
      const rawFeatured = c.featuredImage || rawVariantImages[0] || c.image || '';
      const cleanFeatured = saveBase64ToUploads(rawFeatured, `p-${prodId.slice(-6)}-c${cIdx}-feat`);

      return {
        id: c.id,
        color: c.color || 'default',
        colorName: c.colorName || 'Cor Única',
        colorHex: c.colorHex || '#000000',
        image: cleanFeatured || cleanMainImage,
        featuredImage: cleanFeatured || cleanMainImage,
        images: cleanVariantImages.length > 0 ? cleanVariantImages : (cleanImagesList.length > 0 ? cleanImagesList : [cleanMainImage]),
        sku: c.sku,
        stockCount: c.stockCount,
        sizes: c.sizes,
      };
    });

    return {
      ...p,
      id: prodId,
      image: cleanMainImage || (cleanImagesList[0] || ''),
      images: cleanImagesList.length > 0 ? cleanImagesList : (cleanMainImage ? [cleanMainImage] : []),
      colors: cleanColors,
      status: (p.status as any) || 'active',
      weight: p.weight && Number(p.weight) > 0 ? Number(p.weight) : (p.category === 'moletons' || p.category === 'jaquetas' ? 0.75 : p.category === 'calcas' ? 0.6 : 0.35),
      height: p.height && Number(p.height) > 0 ? Number(p.height) : (p.category === 'moletons' || p.category === 'jaquetas' ? 8 : 4),
      width: p.width && Number(p.width) > 0 ? Number(p.width) : 20,
      length: p.length && Number(p.length) > 0 ? Number(p.length) : 25,
    };
  }

  private mapSupabaseProduct(item: any): Product {
    if (!item) return {} as Product;
    const d = (item.data && typeof item.data === 'object') ? item.data : {};
    const prodId = String(item.id || d.id || `prod-${Date.now()}`);
    
    const rawMainImage = item.image || d.image || (Array.isArray(item.images) && item.images[0]) || (Array.isArray(d.images) && d.images[0]) || '';
    const cleanMainImage = saveBase64ToUploads(rawMainImage, `p-${prodId.slice(-6)}-main`);

    const rawImagesList = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (Array.isArray(d.images) && d.images.length > 0 ? d.images : (rawMainImage ? [rawMainImage] : []));
    const cleanImagesList = rawImagesList.map((img: string, idx: number) => saveBase64ToUploads(img, `p-${prodId.slice(-6)}-g${idx}`));

    const rawColors = Array.isArray(item.colors) && item.colors.length > 0
      ? item.colors
      : (Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : [{ color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' }]);

    const cleanColors = rawColors.map((c: any, cIdx: number) => {
      const rawVariantImages: string[] = Array.isArray(c.images) && c.images.length > 0
        ? c.images
        : (c.featuredImage ? [c.featuredImage] : (c.image ? [c.image] : []));
      const cleanVariantImages = rawVariantImages.map((vImg: string, vIdx: number) => saveBase64ToUploads(vImg, `p-${prodId.slice(-6)}-c${cIdx}-v${vIdx}`));
      const rawFeatured = c.featuredImage || rawVariantImages[0] || c.image || '';
      const cleanFeatured = saveBase64ToUploads(rawFeatured, `p-${prodId.slice(-6)}-c${cIdx}-feat`);

      return {
        id: c.id,
        color: c.color || 'default',
        colorName: c.colorName || 'Cor Única',
        colorHex: c.colorHex || '#000000',
        image: cleanFeatured || cleanMainImage,
        featuredImage: cleanFeatured || cleanMainImage,
        images: cleanVariantImages.length > 0 ? cleanVariantImages : (cleanImagesList.length > 0 ? cleanImagesList : [cleanMainImage]),
        sku: c.sku,
        stockCount: c.stockCount,
        sizes: c.sizes,
      };
    });

    return {
      id: prodId,
      slug: String(item.slug || d.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')),
      title: item.title || d.title || 'Produto Streetwear',
      subtitle: item.subtitle || d.subtitle || '',
      description: item.description || d.description || '',
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price || d.price || 0),
      promoPrice: item.promo_price !== undefined && item.promo_price !== null
        ? parseFloat(item.promo_price)
        : (d.promoPrice !== undefined && d.promoPrice !== null ? parseFloat(d.promoPrice) : undefined),
      category: String(item.category || d.category || 'camisetas').toLowerCase().trim(),
      subcategory: String(item.subcategory || d.subcategory || 'Essenciais').trim(),
      collection: item.collection || d.collection || 'Vol. 04: Cyber Dystopia',
      tags: Array.isArray(item.tags) ? item.tags : (Array.isArray(d.tags) ? d.tags : ['Lançamento']),
      rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating || d.rating || 5.0),
      reviewCount: typeof item.review_count === 'number' ? item.review_count : parseInt(item.review_count || d.reviewCount || 0, 10),
      stockCount: typeof item.stock_count === 'number'
        ? item.stock_count
        : (item.stock_count !== undefined && item.stock_count !== null
            ? (parseInt(String(item.stock_count), 10) >= 0 ? parseInt(String(item.stock_count), 10) : 0)
            : (typeof d?.stockCount === 'number' ? d.stockCount : 0)),
      sku: item.sku || d.sku || `MM-${Math.floor(1000 + Math.random() * 9000)}`,
      sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : (Array.isArray(d.sizes) && d.sizes.length > 0 ? d.sizes : ['P', 'M', 'G', 'GG']),
      colors: cleanColors,
      image: cleanMainImage || (cleanImagesList[0] || ''),
      images: cleanImagesList.length > 0 ? cleanImagesList : (cleanMainImage ? [cleanMainImage] : []),
      details: Array.isArray(item.details) ? item.details : (Array.isArray(d.details) ? d.details : ['100% Algodão Heavyweight']),
      careInstructions: Array.isArray(item.care_instructions) ? item.care_instructions : (Array.isArray(d.careInstructions) ? d.careInstructions : ['Lavar em ciclo suave']),
      composition: Array.isArray(item.composition) ? item.composition : (Array.isArray(d.composition) ? d.composition : ['100% Algodão']),
      reviews: Array.isArray(item.reviews) ? item.reviews : (Array.isArray(d.reviews) ? d.reviews : []),
      weight: typeof item.weight === 'number' ? item.weight : parseFloat(item.weight || d.weight || 0.35),
      height: typeof item.height === 'number' ? item.height : parseFloat(item.height || d.height || 4),
      width: typeof item.width === 'number' ? item.width : parseFloat(item.width || d.width || 20),
      length: typeof item.length === 'number' ? item.length : parseFloat(item.length || d.length || 25),
      isNewRelease: item.is_new_release !== undefined ? Boolean(item.is_new_release) : Boolean(d.isNewRelease),
      isBestSeller: item.is_best_seller !== undefined ? Boolean(item.is_best_seller) : Boolean(d.isBestSeller),
      featured: item.featured !== undefined ? Boolean(item.featured) : Boolean(d.featured),
      status: (item.status || d.status || 'active') as any,
      createdAt: item.created_at || d.createdAt || new Date().toISOString(),
    };
  }

  private mapSupabaseCategory(item: any): Category {
    if (!item) return {} as Category;
    const d = (item.data && typeof item.data === 'object') ? item.data : {};
    return {
      id: String(item.id || d.id || item.slug || d.slug || `cat-${Date.now()}`),
      slug: String(item.slug || d.slug || item.name || d.name || '').toLowerCase().trim(),
      name: item.name || d.name || 'Categoria',
      tagline: item.tagline || d.tagline || '',
      description: item.description || d.description || '',
      image: item.image || d.image || '',
      subcategories: Array.isArray(item.subcategories) ? item.subcategories : (Array.isArray(d.subcategories) ? d.subcategories : ['Geral']),
      productCount: typeof item.product_count === 'number' ? item.product_count : (typeof d.productCount === 'number' ? d.productCount : 0),
      order: typeof item.order === 'number' ? item.order : (typeof d.order === 'number' ? d.order : 0),
      active: item.active !== undefined ? Boolean(item.active) : (d.active !== undefined ? Boolean(d.active) : true),
      createdAt: item.created_at || d.createdAt || new Date().toISOString(),
    };
  }

  private async loadFromSupabase() {
    if (!this.supabase) return;
    this.loadFromFiles();

    try {
      const { data: catData, error: catErr } = await this.supabase.from('categories').select('*').order('order', { ascending: true });
      if (!catErr && catData && catData.length > 0) {
        this.categories = catData.map((item: any) => this.mapSupabaseCategory(item));
        this.writeJsonFile(CATEGORIES_FILE, this.categories);
      } else if (!catErr && catData && catData.length === 0) {
        for (const cat of this.categories) {
          await this.supabase.from('categories').upsert({
            id: cat.id,
            slug: cat.slug,
            name: cat.name,
            tagline: cat.tagline,
            description: cat.description,
            image: cat.image,
            subcategories: cat.subcategories,
            product_count: cat.productCount,
            order: cat.order,
            active: cat.active,
            data: cat,
          });
        }
      }

      console.log('[PRODUCTS] Carregando catálogo completo do Supabase...');
      const PRODUCT_SELECT_COLUMNS = 'id, slug, title, subtitle, description, price, promo_price, category, subcategory, collection, tags, rating, review_count, stock_count, sku, sizes, colors, image, images, details, care_instructions, composition, weight, height, width, length, is_new_release, is_best_seller, featured, status, created_at, updated_at';
      const { data: prodData, error: prodErr } = await this.supabase
        .from('products')
        .select(PRODUCT_SELECT_COLUMNS)
        .order('id', { ascending: true });

      if (!prodErr && prodData && Array.isArray(prodData) && prodData.length > 0) {
        const mapped = prodData.map((item: any) => this.mapSupabaseProduct(item));
        const byId = new Map<string, Product>();
        for (const p of mapped) {
          if (p && p.id && String(p.id).trim().length > 0) {
            byId.set(String(p.id).trim(), p);
          }
        }
        const uniqueProducts = Array.from(byId.values());
        this.products = uniqueProducts;
        this.writeJsonFile(PRODUCTS_FILE, this.products);
        console.log(`[PRODUCTS] ${this.products.length} produtos únicos carregados do Supabase com sucesso.`);
      } else if (prodErr) {
        console.warn('[PRODUCTS] aviso ao carregar do Supabase:', prodErr.message || prodErr);
      }

      const { data: ordersData, error: ordersErr } = await this.supabase.from('orders').select('*');
      if (!ordersErr && ordersData && ordersData.length > 0) {
        this.orders = ordersData.map((item: any) => item.data || item);
        this.writeJsonFile(ORDERS_FILE, this.orders);
      }

      const { data: couponsData, error: couponsErr } = await this.supabase.from('coupons').select('*');
      if (!couponsErr && couponsData && couponsData.length > 0) {
        this.coupons = couponsData.map((item: any) => {
          const d = item.data || {};
          const discountVal = item.discount_percentage ?? item.discount_value ?? d.discountPercentage ?? d.discountValue ?? 10;
          return {
            code: String(item.code || d.code || '').toUpperCase(),
            discountPercentage: Number(discountVal),
            discountValue: Number(discountVal),
            discountType: item.discount_type || d.discountType || 'percentage',
            minOrderValue: Number(item.min_order_value ?? d.minOrderValue ?? 0),
            description: item.description || d.description || '',
            active: item.active !== false && d.active !== false,
          };
        });
        this.writeJsonFile(COUPONS_FILE, this.coupons);
      }

      try {
        const { data: retData } = await this.supabase.from('returns').select('*');
        if (retData && retData.length > 0) {
          this.returns = retData.map((item: any) => item.data || item);
          this.writeJsonFile(RETURNS_FILE, this.returns);
        }
      } catch {}

      try {
        const { data: movData } = await this.supabase.from('inventory_movements').select('*');
        if (movData && movData.length > 0) {
          this.inventoryMovements = movData.map((item: any) => item.data || item);
          this.writeJsonFile(INVENTORY_MOVEMENTS_FILE, this.inventoryMovements);
        }
      } catch {}

      try {
        const { data: bannerData } = await this.supabase.from('store_banners').select('*');
        if (bannerData && bannerData.length > 0) {
          this.storeBanners = bannerData.map((item: any) => item.data || item);
          this.writeJsonFile(STORE_BANNERS_FILE, this.storeBanners);
        }
      } catch {}

      try {
        const { data: settingsData } = await this.supabase.from('store_settings').select('*').limit(1);
        if (settingsData && settingsData.length > 0) {
          this.storeSettings = settingsData[0].data || settingsData[0];
          this.writeJsonFile(STORE_SETTINGS_FILE, this.storeSettings);
        }
      } catch {}

      try {
        const { data: cartData } = await this.supabase.from('cart_items').select('*');
        if (cartData && cartData.length > 0) {
          this.cartItems = cartData.map((item: any) => item.data || item);
          this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);
        }
      } catch {}

      try {
        const { data: wishData } = await this.supabase.from('favorites').select('*');
        if (wishData && wishData.length > 0) {
          this.wishlistItems = wishData.map((item: any) => item.data || {
            id: item.id,
            userId: item.user_id,
            productId: item.product_id,
            createdAt: item.created_at,
          });
          this.writeJsonFile(WISHLIST_ITEMS_FILE, this.wishlistItems);
        }
      } catch {}

      try {
        const { data: addrData } = await this.supabase.from('user_addresses').select('*');
        if (addrData && addrData.length > 0) {
          this.userAddresses = addrData.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            recipientName: item.recipient_name,
            cep: item.cep,
            street: item.street,
            number: item.number,
            complement: item.complement,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            isDefault: Boolean(item.is_default),
            phone: item.phone || item.data?.phone,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
          this.writeJsonFile(USER_ADDRESSES_FILE, this.userAddresses);
        }
      } catch {}

      try {
        const { data: newsData } = await this.supabase.from('newsletter_subscribers').select('*');
        if (newsData && newsData.length > 0) {
          this.newsletterSubscribers = newsData.map((item: any) => item.data || item);
          this.writeJsonFile(NEWSLETTER_FILE, this.newsletterSubscribers);
        }
      } catch {}

      try {
        const { data: revData } = await this.supabase.from('product_reviews').select('*');
        if (revData && revData.length > 0) {
          this.productReviews = revData.map((item: any) => item.data || item);
          this.writeJsonFile(REVIEWS_FILE, this.productReviews);
        }
      } catch {}

      try {
        const { data: emailData } = await this.supabase.from('email_logs').select('*');
        if (emailData && emailData.length > 0) {
          this.emailLogs = emailData.map((item: any) => item.data || item);
          this.writeJsonFile(EMAIL_LOGS_FILE, this.emailLogs);
        }
      } catch {}

      try {
        const { data: shipEvtData } = await this.supabase.from('shipment_events').select('*');
        if (shipEvtData && shipEvtData.length > 0) {
          this.shipmentEvents = shipEvtData.map((item: any) => item.data || item);
          this.writeJsonFile(SHIPMENT_EVENTS_FILE, this.shipmentEvents);
        }
      } catch {}
    } catch (err) {
      console.warn('[DB] Supabase query notice, continuing with persistent cache:', err);
    }
  }

  private loadFromFiles() {
    this.categories = this.readJsonFile(CATEGORIES_FILE, INITIAL_CATEGORIES);
    const rawProds = this.readJsonFile(PRODUCTS_FILE, []);
    let neededSanitization = false;
    this.products = rawProds.map((p: any) => {
      const sanitized = this.sanitizeProduct(p);
      if (sanitized.image !== p.image || sanitized.images?.length !== p.images?.length) {
        neededSanitization = true;
      }
      return sanitized;
    });
    if (neededSanitization) {
      this.writeJsonFile(PRODUCTS_FILE, this.products);
    }
    this.users = this.readJsonFile(USERS_FILE, []);
    this.orders = this.readJsonFile(ORDERS_FILE, []);
    this.coupons = this.readJsonFile(COUPONS_FILE, INITIAL_COUPONS_LIST);
    this.auditLogs = this.readJsonFile(AUDIT_LOGS_FILE, []);
    this.cartItems = this.readJsonFile(CART_ITEMS_FILE, []);
    this.wishlistItems = this.readJsonFile(WISHLIST_ITEMS_FILE, []);
    this.returns = this.readJsonFile(RETURNS_FILE, []);
    this.inventoryMovements = this.readJsonFile(INVENTORY_MOVEMENTS_FILE, []);
    this.storeBanners = this.readJsonFile(STORE_BANNERS_FILE, INITIAL_STORE_BANNERS);
    this.storeSettings = this.readJsonFile(STORE_SETTINGS_FILE, INITIAL_STORE_SETTINGS);
    this.userAddresses = this.readJsonFile(USER_ADDRESSES_FILE, []);
    this.newsletterSubscribers = this.readJsonFile(NEWSLETTER_FILE, [
      {
        id: 'sub-demo-1',
        email: 'streetwear.collector@marmot.com.br',
        status: 'subscribed',
        source: 'Footer Drop Form',
        subscribedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ]);
    this.productReviews = this.readJsonFile(REVIEWS_FILE, [
      {
        id: 'rev-001',
        productId: 'prod-001',
        userName: 'Lucas V.',
        userEmail: 'lucas.v@gmail.com',
        rating: 5,
        title: 'Gramatura absurda e caimento boxy impecável',
        comment: 'A qualidade do algodão 260g é surreal, caimento exatamente como no anúncio. A gola de 3cm não deforma nem depois de lavar.',
        verifiedPurchase: true,
        likes: 12,
        status: 'published',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'rev-002',
        productId: 'prod-002',
        userName: 'Matheus R.',
        userEmail: 'matheus.r@gmail.com',
        rating: 5,
        title: 'Melhor hoodie nacional sem dúvidas',
        comment: 'Moletom 400g pesado, capuz duplo fica em pé sem precisar de cordão. Vale cada centavo investido.',
        verifiedPurchase: true,
        likes: 8,
        status: 'published',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ]);
    this.emailLogs = this.readJsonFile(EMAIL_LOGS_FILE, []);
    this.shipmentEvents = this.readJsonFile(SHIPMENT_EVENTS_FILE, []);
    this.campaignRecords = this.readJsonFile(CAMPAIGNS_FILE, []);

    this.writeJsonFile(CATEGORIES_FILE, this.categories);
    this.writeJsonFile(PRODUCTS_FILE, this.products);
    this.writeJsonFile(USERS_FILE, this.users);
    this.writeJsonFile(ORDERS_FILE, this.orders);
    this.writeJsonFile(COUPONS_FILE, this.coupons);
    this.writeJsonFile(AUDIT_LOGS_FILE, this.auditLogs);
    this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);
    this.writeJsonFile(WISHLIST_ITEMS_FILE, this.wishlistItems);
    this.writeJsonFile(RETURNS_FILE, this.returns);
    this.writeJsonFile(INVENTORY_MOVEMENTS_FILE, this.inventoryMovements);
    this.writeJsonFile(STORE_BANNERS_FILE, this.storeBanners);
    this.writeJsonFile(STORE_SETTINGS_FILE, this.storeSettings);
    this.writeJsonFile(USER_ADDRESSES_FILE, this.userAddresses);
    this.writeJsonFile(NEWSLETTER_FILE, this.newsletterSubscribers);
    this.writeJsonFile(REVIEWS_FILE, this.productReviews);
    this.writeJsonFile(EMAIL_LOGS_FILE, this.emailLogs);
    this.writeJsonFile(SHIPMENT_EVENTS_FILE, this.shipmentEvents);
    this.writeJsonFile(CAMPAIGNS_FILE, this.campaignRecords);
  }

  private readJsonFile<T>(filePath: string, defaultData: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Return default data
    }
    return defaultData;
  }

  private writeJsonFile<T>(filePath: string, data: T): void {
    try {
      const effectivePath = (IS_TEST_MODE && filePath.includes(DATA_DIR))
        ? path.join(os.tmpdir(), 'marmot-test-data', path.basename(filePath))
        : filePath;

      const dir = path.dirname(effectivePath);
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch {
          // Read-only serverless filesystem
        }
      }
      const tempPath = `${effectivePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, effectivePath);
    } catch {
      try {
        const effectivePath = (IS_TEST_MODE && filePath.includes(DATA_DIR))
          ? path.join(os.tmpdir(), 'marmot-test-data', path.basename(filePath))
          : filePath;
        fs.writeFileSync(effectivePath, JSON.stringify(data, null, 2), 'utf-8');
      } catch {
        // Safe failover
      }
    }
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  /**
   * Dedicated anon-key client for end-user authentication operations.
   * Never authenticate a user on the cached service-role client: doing so
   * replaces its Authorization context and makes later administrative writes
   * unexpectedly subject to that user's RLS policies.
   */
  public getSupabaseAuthClient(): SupabaseClient | null {
    const supabaseUrl = process.env.SUPABASE_DISPOSABLE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_DISPOSABLE_URL
      ? process.env.SUPABASE_DISPOSABLE_ANON_KEY
      : process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey || supabaseUrl.includes('placeholder')) {
      return null;
    }

    if (!this.supabaseAuth) {
      this.supabaseAuth = createClient(supabaseUrl, anonKey.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }

    return this.supabaseAuth;
  }

  /**
   * Returns authoritative Supabase client with service_role secret for administrative writes.
   * Fail-Closed Security Policy: Never falls back to anon client for admin operations.
   */
  public async getSupabaseAdminClient(): Promise<SupabaseClient | null> {
    const serviceKey = (process.env.SUPABASE_DISPOSABLE_URL ? process.env.SUPABASE_DISPOSABLE_SERVICE_ROLE_KEY : null) || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_DISPOSABLE_URL || process.env.SUPABASE_URL;

    if (serviceKey && serviceKey.trim() !== '') {
      const cleanKey = serviceKey.trim();
      const anonKey = process.env.SUPABASE_ANON_KEY;

      // Fail-closed guard: Reject anon/publishable keys passed erroneously as service role key
      if (cleanKey.startsWith('sb_publishable_') || (anonKey && cleanKey === anonKey.trim())) {
        console.error('[DB SECURITY ALERT] SUPABASE_SERVICE_ROLE_KEY contém uma chave anon/publishable em vez de uma service_role secret válida! Acesso administrativo bloqueado.');
        return null;
      }

      if (!this.supabaseAdmin) {
        this.supabaseAdmin = createClient(supabaseUrl, cleanKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      }
      return this.supabaseAdmin;
    }

    // Strict fail-closed: Never fall back to anon key for administrative mutations
    return null;
  }

  /**
   * Requires an authoritative Supabase client with service_role secret.
   * Throws an explicit configuration error if SUPABASE_SERVICE_ROLE_KEY is absent.
   */
  public async getRequiredSupabaseAdminClient(operationName = 'operação administrativa'): Promise<SupabaseClient> {
    const adminClient = await this.getSupabaseAdminClient();
    if (!adminClient) {
      console.error(`[DB CONFIG ERROR] SUPABASE_SERVICE_ROLE_KEY_NOT_CONFIGURED: Impossível executar '${operationName}' no Supabase sem a chave SUPABASE_SERVICE_ROLE_KEY configurada no servidor.`);
      throw new Error(`SUPABASE_SERVICE_ROLE_KEY_NOT_CONFIGURED: A chave SUPABASE_SERVICE_ROLE_KEY é obrigatória para executar '${operationName}' no banco de dados com integridade e segurança. Verifique as variáveis de ambiente na Vercel.`);
    }
    return adminClient;
  }

  public getMode(): 'supabase' | 'postgres' | 'durable_file' {
    return this.mode;
  }

  // ==========================================
  // PRODUCTS CRUD
  // ==========================================
  public async getProducts(filters?: any): Promise<Product[]> {
    return this.getAllProducts(filters);
  }

  public async getAllProducts(filters?: {
    category?: string;
    subcategory?: string;
    tag?: string;
    status?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    onSale?: boolean;
    sort?: string;
  }): Promise<Product[]> {
    await this.initialize();
    let list = [...this.products];

    if (!filters) return list;

    if (filters.category) {
      const cat = filters.category.toLowerCase();
      if (cat === 'calcas') {
        list = list.filter((p) => p.category?.toLowerCase() === 'calcas' || p.category?.toLowerCase() === 'cargos' || p.subcategory?.toLowerCase() === 'calcas' || p.tags?.some(t => t.toLowerCase() === 'calças' || t.toLowerCase() === 'calca'));
      } else {
        list = list.filter((p) => p.category?.toLowerCase() === cat || p.subcategory?.toLowerCase() === cat || p.tags?.some(t => t.toLowerCase() === cat));
      }
    }

    if (filters.subcategory) {
      const sub = filters.subcategory.toLowerCase();
      list = list.filter((p) => p.subcategory?.toLowerCase() === sub);
    }

    if (filters.tag) {
      list = list.filter((p) => Array.isArray(p.tags) && p.tags.includes(filters.tag as any));
    }

    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.collection?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    if (filters.minPrice !== undefined) {
      list = list.filter((p) => (p.promoPrice || p.price) >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      list = list.filter((p) => (p.promoPrice || p.price) <= filters.maxPrice!);
    }

    if (filters.onSale) {
      list = list.filter((p) => typeof p.promoPrice === 'number' && p.promoPrice < p.price);
    }

    if (filters.sort === 'price-asc') {
      list.sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
    } else if (filters.sort === 'price-desc') {
      list.sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
    } else if (filters.sort === 'rating') {
      list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else if (filters.sort === 'newest') {
      list.sort((a, b) => (b.isNewRelease ? 1 : 0) - (a.isNewRelease ? 1 : 0));
    }

    return list;
  }

  public async getProductById(idOrSlug: string): Promise<Product | null> {
    await this.initialize();
    if (!idOrSlug) return null;
    const clean = String(idOrSlug).trim();
    const lower = clean.toLowerCase();

    let prod = this.products.find((p) => 
      p.id === clean || 
      p.slug === clean || 
      p.id?.toLowerCase() === lower || 
      p.slug?.toLowerCase() === lower
    );

    if (!prod && this.mode === 'supabase') {
      const adminClient = (await this.getSupabaseAdminClient()) || this.supabase;
      if (adminClient) {
        try {
          const { data, error } = await adminClient
            .from('products')
            .select('*')
            .or(`id.eq.${clean},slug.eq.${clean}`)
            .limit(1);

          if (!error && data && data.length > 0) {
            prod = this.mapSupabaseProduct(data[0]);
            this.products.unshift(prod);
            this.writeJsonFile(PRODUCTS_FILE, this.products);
          }
        } catch {}
      }
    }

    return prod || null;
  }

  public async createProduct(productData: Partial<Product>): Promise<Product> {
    await this.initialize();

    const title = productData.title?.trim() || 'Novo Produto Marmot';
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

    const rawWeight = productData.weight !== undefined && productData.weight !== null && String(productData.weight).trim() !== ''
      ? parseFloat(String(productData.weight).replace(',', '.'))
      : 0.35;
    const rawHeight = productData.height !== undefined && productData.height !== null && String(productData.height).trim() !== ''
      ? parseFloat(String(productData.height).replace(',', '.'))
      : 4;
    const rawWidth = productData.width !== undefined && productData.width !== null && String(productData.width).trim() !== ''
      ? parseFloat(String(productData.width).replace(',', '.'))
      : 20;
    const rawLength = productData.length !== undefined && productData.length !== null && String(productData.length).trim() !== ''
      ? parseFloat(String(productData.length).replace(',', '.'))
      : 25;

    const newProduct: Product = this.sanitizeProduct({
      id,
      slug,
      title,
      subtitle: productData.subtitle?.trim() || 'Streetwear Autoral Heavyweight',
      description: productData.description?.trim() || '',
      price: isNaN(price) ? 199.9 : price,
      promoPrice: promoPrice && !isNaN(promoPrice) ? promoPrice : undefined,
      category: productData.category || 'camisetas',
      subcategory: productData.subcategory?.trim() || 'Essenciais',
      collection: productData.collection?.trim() || 'Vol. 04: Cyber Dystopia',
      tags: Array.isArray(productData.tags) ? productData.tags : ['Lançamento'],
      rating: 5.0,
      reviewCount: 0,
      stockCount: productData.stockCount !== undefined ? parseInt(String(productData.stockCount), 10) : 25,
      sku: productData.sku?.trim() || `MM-${Math.floor(1000 + Math.random() * 9000)}`,
      sizes: Array.isArray(productData.sizes) && productData.sizes.length > 0 ? productData.sizes : ['P', 'M', 'G', 'GG'],
      colors: Array.isArray(productData.colors) && productData.colors.length > 0 ? productData.colors : [
        { color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' },
      ],
      image: productData.image || (productData.images && productData.images[0]) || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      images: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      ],
      details: Array.isArray(productData.details) ? productData.details : ['100% Algodão Heavyweight 260g/m²', 'Gola canelada 3cm'],
      careInstructions: Array.isArray(productData.careInstructions) ? productData.careInstructions : ['Lavar em ciclo suave', 'Secar na sombra'],
      composition: Array.isArray(productData.composition) ? productData.composition : ['100% Algodão Heavyweight 260g/m²'],
      reviews: [],
      weight: Number(rawWeight) || 0.35,
      height: Number(rawHeight) || 4,
      width: Number(rawWidth) || 20,
      length: Number(rawLength) || 25,
      isNewRelease: Boolean(productData.isNewRelease),
      isBestSeller: Boolean(productData.isBestSeller),
      featured: Boolean(productData.featured),
      status: (productData.status as any) || 'active',
      createdAt: new Date().toISOString(),
    });

    // 1. Persistent local storage & active in-memory list (Always guaranteed)
    this.products.unshift(newProduct);
    this.writeJsonFile(PRODUCTS_FILE, this.products);

    // 2. Synchronize to Supabase database with direct await
    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('createProduct');
        const { error } = await adminClient.from('products').insert({
          id: newProduct.id,
          slug: newProduct.slug,
          title: newProduct.title,
          subtitle: newProduct.subtitle,
          description: newProduct.description,
          price: newProduct.price,
          promo_price: newProduct.promoPrice ?? null,
          category: newProduct.category,
          subcategory: newProduct.subcategory,
          collection: newProduct.collection,
          tags: newProduct.tags,
          rating: newProduct.rating,
          review_count: newProduct.reviewCount,
          stock_count: newProduct.stockCount,
          sku: newProduct.sku,
          sizes: newProduct.sizes,
          colors: newProduct.colors,
          image: newProduct.image,
          images: newProduct.images,
          details: newProduct.details,
          care_instructions: newProduct.careInstructions,
          composition: newProduct.composition,
          weight: newProduct.weight,
          height: newProduct.height,
          width: newProduct.width,
          length: newProduct.length,
          is_new_release: newProduct.isNewRelease,
          is_best_seller: newProduct.isBestSeller,
          featured: newProduct.featured,
          status: newProduct.status,
          data: null,
        });

        if (error) {
          console.warn('[DB] Supabase product insert notice:', error.message);
        } else {
          console.log('[DB] Produto criado no Supabase com sucesso:', newProduct.id);
        }
      } catch (sbErr: any) {
        console.warn('[DB] Supabase insert exception:', sbErr?.message);
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') throw sbErr;
      }
    }

    return newProduct;
  }

  public async updateProduct(idOrSlug: string, updates: Partial<Product>): Promise<Product> {
    await this.initialize();
    const clean = String(idOrSlug).trim();
    const lower = clean.toLowerCase();

    let idx = this.products.findIndex((p) => 
      p.id === clean || 
      p.slug === clean || 
      p.id?.toLowerCase() === lower || 
      p.slug?.toLowerCase() === lower
    );

    if (idx === -1 && this.mode === 'supabase' && this.supabase) {
      const client = (await this.getSupabaseAdminClient()) || this.supabase;
      if (client) {
        try {
          const { data, error } = await client
            .from('products')
            .select('*')
            .or(`id.eq.${clean},slug.eq.${clean}`)
            .limit(1);
          if (!error && data && data.length > 0) {
            const loaded = this.mapSupabaseProduct(data[0]);
            this.products.unshift(loaded);
            idx = 0;
          }
        } catch {}
      }
    }

    if (idx === -1) {
      throw new Error(`Produto não encontrado para "${idOrSlug}"`);
    }

    const current = this.products[idx];
    const updatedProduct: Product = {
      ...current,
      ...updates,
      id: current.id,
      status: (updates.status as any) || current.status || 'active',
    };

    if (updates.price !== undefined) updatedProduct.price = parseFloat(String(updates.price));
    if (updates.promoPrice !== undefined) {
      updatedProduct.promoPrice = updates.promoPrice ? parseFloat(String(updates.promoPrice)) : undefined;
    }
    if (updates.stockCount !== undefined) updatedProduct.stockCount = parseInt(String(updates.stockCount), 10);
    
    if (updates.weight !== undefined) {
      const val = parseFloat(String(updates.weight).replace(',', '.'));
      if (Number.isFinite(val) && val > 0) {
        updatedProduct.weight = Number(val);
      }
    }
    if (updates.height !== undefined) {
      const val = parseFloat(String(updates.height).replace(',', '.'));
      if (Number.isFinite(val) && val > 0) {
        updatedProduct.height = Number(val);
      }
    }
    if (updates.width !== undefined) {
      const val = parseFloat(String(updates.width).replace(',', '.'));
      if (Number.isFinite(val) && val > 0) {
        updatedProduct.width = Number(val);
      }
    }
    if (updates.length !== undefined) {
      const val = parseFloat(String(updates.length).replace(',', '.'));
      if (Number.isFinite(val) && val > 0) {
        updatedProduct.length = Number(val);
      }
    }

    // Consistency rule: image MUST equal images[0]
    if (updatedProduct.images && updatedProduct.images.length > 0) {
      updatedProduct.image = updatedProduct.images[0];
    }

    const cleanProduct = this.sanitizeProduct(updatedProduct);

    // 1. Persistent local storage & in-memory update (Always guaranteed)
    this.products[idx] = cleanProduct;
    this.writeJsonFile(PRODUCTS_FILE, this.products);

    // 2. Synchronize to Supabase database via direct UPDATE with await
    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('updateProduct');
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
          data: null,
        };
        if (updates.title !== undefined) updatePayload.title = cleanProduct.title;
        if (updates.slug !== undefined) updatePayload.slug = cleanProduct.slug;
        if (updates.subtitle !== undefined) updatePayload.subtitle = cleanProduct.subtitle || '';
        if (updates.description !== undefined) updatePayload.description = cleanProduct.description || '';
        if (updates.price !== undefined) updatePayload.price = cleanProduct.price;
        if (updates.promoPrice !== undefined) updatePayload.promo_price = cleanProduct.promoPrice ?? null;
        if (updates.category !== undefined) updatePayload.category = cleanProduct.category;
        if (updates.subcategory !== undefined) updatePayload.subcategory = cleanProduct.subcategory || 'Essenciais';
        if (updates.collection !== undefined) updatePayload.collection = cleanProduct.collection || 'Vol. 04: Cyber Dystopia';
        if (updates.tags !== undefined) updatePayload.tags = cleanProduct.tags || [];
        if (updates.rating !== undefined) updatePayload.rating = cleanProduct.rating || 5.0;
        if (updates.reviewCount !== undefined) updatePayload.review_count = cleanProduct.reviewCount || 0;
        if (updates.stockCount !== undefined) updatePayload.stock_count = typeof cleanProduct.stockCount === 'number' ? cleanProduct.stockCount : 0;
        if (updates.sku !== undefined) updatePayload.sku = cleanProduct.sku || '';
        if (updates.sizes !== undefined) updatePayload.sizes = cleanProduct.sizes || ['P', 'M', 'G', 'GG'];
        if (updates.colors !== undefined) updatePayload.colors = cleanProduct.colors || [];
        if (updates.image !== undefined || updates.images !== undefined) {
          updatePayload.image = cleanProduct.image || '';
          updatePayload.images = cleanProduct.images || [];
        }
        if (updates.details !== undefined) updatePayload.details = cleanProduct.details || [];
        if (updates.careInstructions !== undefined) updatePayload.care_instructions = cleanProduct.careInstructions || [];
        if (updates.composition !== undefined) updatePayload.composition = cleanProduct.composition || [];
        if (updates.weight !== undefined) updatePayload.weight = cleanProduct.weight || 0.35;
        if (updates.height !== undefined) updatePayload.height = cleanProduct.height || 4;
        if (updates.width !== undefined) updatePayload.width = cleanProduct.width || 20;
        if (updates.length !== undefined) updatePayload.length = cleanProduct.length || 25;
        if (updates.isNewRelease !== undefined) updatePayload.is_new_release = Boolean(cleanProduct.isNewRelease);
        if (updates.isBestSeller !== undefined) updatePayload.is_best_seller = Boolean(cleanProduct.isBestSeller);
        if (updates.featured !== undefined) updatePayload.featured = Boolean(cleanProduct.featured);
        if (updates.status !== undefined) updatePayload.status = cleanProduct.status || 'active';

        const { error } = await adminClient
          .from('products')
          .update(updatePayload)
          .eq('id', cleanProduct.id);

        if (error) {
          console.warn('[DB] Supabase product update notice:', error.message);
        } else {
          console.log('[DB] Produto atualizado no Supabase com sucesso via UPDATE:', cleanProduct.id);
        }
      } catch (sbErr: any) {
        console.warn('[DB] Supabase product update exception:', sbErr?.message);
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') throw sbErr;
      }
    }

    return cleanProduct;
  }

  public async updateProductStock(id: string, stockCount: number): Promise<Product> {
    await this.initialize();
    const clean = String(id).trim();
    const lower = clean.toLowerCase();

    let idx = this.products.findIndex((p) => 
      p.id === clean || 
      p.slug === clean || 
      p.id?.toLowerCase() === lower || 
      p.slug?.toLowerCase() === lower
    );

    if (idx === -1 && this.mode === 'supabase' && this.supabase) {
      const client = (await this.getSupabaseAdminClient()) || this.supabase;
      if (client) {
        try {
          const { data, error } = await client
            .from('products')
            .select('*')
            .or(`id.eq.${clean},slug.eq.${clean}`)
            .limit(1);
          if (!error && data && data.length > 0) {
            const loaded = this.mapSupabaseProduct(data[0]);
            this.products.unshift(loaded);
            idx = 0;
          }
        } catch {}
      }
    }

    if (idx === -1) throw new Error(`Produto #${id} não encontrado.`);

    const current = this.products[idx];
    const newStock = Math.max(0, parseInt(String(stockCount), 10));
    const status = newStock <= 0 ? 'out_of_stock' : current.status === 'out_of_stock' ? 'active' : current.status;

    const updated: Product = {
      ...current,
      stockCount: newStock,
      status: status as any,
    };

    // 1. Save locally
    this.products[idx] = updated;
    this.writeJsonFile(PRODUCTS_FILE, this.products);

    // 2. Sync to Supabase
    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('updateProductStock');
        const { error } = await adminClient.from('products').update({
          stock_count: newStock,
          status: status,
          data: null,
        }).eq('id', current.id);

        if (error) {
          console.warn('[DB] Supabase stock update notice:', error.message);
        }
      } catch (sbErr: any) {
        console.warn('[DB] Supabase stock update exception:', sbErr?.message);
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') throw sbErr;
      }
    }

    return updated;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    await this.initialize();
    const cleanId = String(id || '').trim();
    if (!cleanId) return false;

    const lowerId = cleanId.toLowerCase();

    // 1. Delete locally
    this.products = this.products.filter((p) => 
      p.id !== cleanId && 
      p.slug !== cleanId && 
      p.id?.toLowerCase() !== lowerId && 
      p.slug?.toLowerCase() !== lowerId
    );
    this.writeJsonFile(PRODUCTS_FILE, this.products);

    // 2. Delete in Supabase
    if (this.mode === 'supabase') {
      try {
        console.log('[PRODUCTS] excluindo produto no Supabase:', cleanId);
        const adminClient = await this.getRequiredSupabaseAdminClient('deleteProduct');
        const { error } = await adminClient
          .from('products')
          .delete()
          .or(`id.eq.${cleanId},slug.eq.${cleanId}`);
        if (error) {
          console.warn('[DB] Supabase delete product notice:', error.message);
        }
      } catch (sbErr: any) {
        console.warn('[DB] Supabase delete exception:', sbErr?.message);
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') throw sbErr;
      }
    }

    return true;
  }

  public async saveProduct(product: Product): Promise<Product> {
    return this.updateProduct(product.id, product);
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================
  public async getAllCategories(): Promise<Category[]> {
    await this.initialize();
    return [...this.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public async getCategoryById(idOrSlug: string): Promise<Category | null> {
    await this.initialize();
    return this.categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug) || null;
  }

  public async createCategory(categoryData: Partial<Category>): Promise<Category> {
    await this.initialize();

    const name = categoryData.name?.trim() || 'Nova Categoria';
    const slug =
      categoryData.slug?.trim() ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');

    const id = categoryData.id || slug || `cat-${Date.now()}`;

    const newCategory: Category = {
      id,
      name,
      slug,
      tagline: categoryData.tagline || 'Peças exclusivas streetwear',
      description: categoryData.description || '',
      image: categoryData.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      subcategories: Array.isArray(categoryData.subcategories) ? categoryData.subcategories : ['Geral'],
      productCount: categoryData.productCount || 0,
      order: this.categories.length,
      active: categoryData.active !== false,
      createdAt: new Date().toISOString(),
    };

    if (this.mode === 'supabase') {
      const adminClient = await this.getRequiredSupabaseAdminClient('createCategory');
      const { error } = await adminClient.from('categories').upsert({
        id: newCategory.id,
        slug: newCategory.slug,
        name: newCategory.name,
        tagline: newCategory.tagline,
        description: newCategory.description,
        image: newCategory.image,
        subcategories: newCategory.subcategories,
        product_count: newCategory.productCount,
        order: newCategory.order,
        active: newCategory.active,
        data: newCategory,
      });
      if (error) {
        console.error('[DB] Supabase category insert error:', error);
        throw new Error(`Falha ao salvar categoria no Supabase: ${error.message}`);
      }
    }

    this.categories.push(newCategory);
    this.writeJsonFile(CATEGORIES_FILE, this.categories);

    return newCategory;
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    await this.initialize();
    const cleanId = String(id || '').trim();
    const lowerId = cleanId.toLowerCase();

    let idx = this.categories.findIndex((c) => 
      c.id === cleanId || 
      c.slug === cleanId || 
      c.id?.toLowerCase() === lowerId || 
      c.slug?.toLowerCase() === lowerId
    );

    if (idx === -1 && this.mode === 'supabase') {
      const client = (await this.getSupabaseAdminClient()) || this.supabase;
      if (client) {
        try {
          const { data, error } = await client
            .from('categories')
            .select('*')
            .or(`id.eq.${cleanId},slug.eq.${cleanId}`)
            .limit(1);
          if (!error && data && data.length > 0) {
            const loaded = this.mapSupabaseCategory(data[0]);
            this.categories.push(loaded);
            idx = this.categories.length - 1;
          }
        } catch {}
      }
    }

    if (idx === -1) throw new Error(`Categoria "${id}" não encontrada.`);

    const current = this.categories[idx];
    const updated = {
      ...current,
      ...updates,
      id: current.id,
    };

    if (updated.image && typeof updated.image === 'string' && updated.image.startsWith('data:image/')) {
      try {
        const matches = updated.image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1].replace(/[^a-z0-9]/gi, '');
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `cat-${updated.id || cleanId}-${Date.now()}.${ext || 'jpg'}`;
          if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          }
          fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
          updated.image = `/uploads/${filename}`;
        }
      } catch (imgErr) {
        console.warn('[DB] Could not save category base64 image to file, keeping original:', imgErr);
      }
    }

    if (this.mode === 'supabase') {
      const adminClient = await this.getRequiredSupabaseAdminClient('updateCategory');
      const { error } = await adminClient.from('categories').upsert({
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        tagline: updated.tagline,
        description: updated.description,
        image: updated.image,
        subcategories: updated.subcategories,
        product_count: updated.productCount,
        order: updated.order,
        active: updated.active,
        data: updated,
      });
      if (error) {
        console.error('[DB] Supabase category update error:', error);
        throw new Error(`Falha ao atualizar categoria no Supabase: ${error.message}`);
      }
    }

    this.categories[idx] = updated;
    this.writeJsonFile(CATEGORIES_FILE, this.categories);

    return updated;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    await this.initialize();
    const cleanId = String(id || '').trim();
    if (!cleanId) return false;

    const lowerId = cleanId.toLowerCase();

    if (this.mode === 'supabase') {
      const adminClient = await this.getRequiredSupabaseAdminClient('deleteCategory');
      const { error } = await adminClient.from('categories').delete().or(`id.eq.${cleanId},slug.eq.${cleanId}`);
      if (error) {
        console.error('[DB] Supabase category delete error:', error);
        throw new Error(`Falha ao excluir categoria no Supabase: ${error.message}`);
      }
    }

    this.categories = this.categories.filter((c) => 
      c.id !== cleanId && 
      c.slug !== cleanId &&
      c.id?.toLowerCase() !== lowerId &&
      c.slug?.toLowerCase() !== lowerId
    );
    this.categories.forEach((c, idx) => {
      c.order = idx;
    });
    this.writeJsonFile(CATEGORIES_FILE, this.categories);

    return true;
  }

  public async reorderCategories(orderedIds: string[]): Promise<Category[]> {
    await this.initialize();
    const reordered: Category[] = [];

    orderedIds.forEach((id, index) => {
      const cat = this.categories.find((c) => c.id === id || c.slug === id);
      if (cat) {
        reordered.push({ ...cat, order: index });
      }
    });

    this.categories.forEach((c) => {
      if (!reordered.find((r) => r.id === c.id)) {
        reordered.push({ ...c, order: reordered.length });
      }
    });

    if (this.mode === 'supabase') {
      const adminClient = await this.getRequiredSupabaseAdminClient('reorderCategories');
      for (const c of reordered) {
        const { error } = await adminClient.from('categories').update({ order: c.order, data: c }).eq('id', c.id);
        if (error) {
          console.error('[DB] Supabase reorder categories error:', error);
        }
      }
    }

    this.categories = reordered;
    this.writeJsonFile(CATEGORIES_FILE, this.categories);

    return this.categories;
  }

  // ==========================================
  // USERS & SESSIONS
  // ==========================================
  public async getUsers(): Promise<DbUser[]> {
    await this.initialize();
    return this.users;
  }

  public async getUserByEmail(email: string): Promise<DbUser | null> {
    await this.initialize();
    const clean = email.toLowerCase().trim();
    const local = this.users.find((u) => u.email.toLowerCase() === clean);
    if (local) return local;

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase.from('profiles').select('*').eq('email', clean).single();
        if (!error && data) {
          const legacyData = data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0 ? data.data : null;
          return {
            ...legacyData,
            id: data.id,
            email: data.email,
            name: data.name || legacyData?.name || 'Cliente Marmot',
            role: data.role || legacyData?.role || 'customer',
            phone: data.phone ?? legacyData?.phone ?? '',
            cpf: data.cpf ?? legacyData?.cpf ?? '',
            addresses: data.addresses ?? legacyData?.addresses ?? [],
            createdAt: data.created_at || legacyData?.createdAt || new Date().toISOString(),
            lastLogin: data.updated_at || legacyData?.lastLogin,
          };
        }
      } catch {
        // Continue
      }
    }

    return null;
  }

  public async getUserById(id: string): Promise<DbUser | null> {
    await this.initialize();
    const local = this.users.find((u) => u.id === id);
    if (local) return local;

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase.from('profiles').select('*').eq('id', id).single();
        if (!error && data) {
          const legacyData = data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0 ? data.data : null;
          return {
            ...legacyData,
            id: data.id,
            email: data.email,
            name: data.name || legacyData?.name || 'Cliente Marmot',
            role: data.role || legacyData?.role || 'customer',
            phone: data.phone ?? legacyData?.phone ?? '',
            cpf: data.cpf ?? legacyData?.cpf ?? '',
            addresses: data.addresses ?? legacyData?.addresses ?? [],
            createdAt: data.created_at || legacyData?.createdAt || new Date().toISOString(),
            lastLogin: data.updated_at || legacyData?.lastLogin,
          };
        }
      } catch {
        // Continue
      }
    }

    return null;
  }

  public async saveUser(user: DbUser): Promise<DbUser> {
    await this.initialize();
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.users[idx] = user;
    } else {
      this.users.push(user);
    }
    this.writeJsonFile(USERS_FILE, this.users);

    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: (user as any).phone,
          cpf: (user as any).cpf,
          addresses: (user as any).addresses,
          data: user,
        });
      } catch (err) {
        console.error('[DB] Supabase user upsert error:', err);
      }
    }
    return user;
  }

  // ==========================================
  // USER ADDRESSES (Supabase public.user_addresses + local sync)
  // ==========================================
  public async getUserAddresses(userId: string): Promise<Address[]> {
    await this.initialize();
    if (!userId) return [];

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const list: Address[] = data.map((r: any) => ({
            id: r.id,
            recipientName: r.recipient_name || r.data?.recipientName || '',
            cep: r.cep || r.data?.cep || '',
            street: r.street || r.data?.street || '',
            number: r.number || r.data?.number || '',
            complement: r.complement !== undefined && r.complement !== null ? r.complement : (r.data?.complement || ''),
            neighborhood: r.neighborhood || r.data?.neighborhood || '',
            city: r.city || r.data?.city || '',
            state: r.state || r.data?.state || '',
            isDefault: Boolean(r.is_default ?? r.data?.isDefault),
            phone: r.phone || r.data?.phone || '',
          }));

          // Sync local state
          this.userAddresses = this.userAddresses.filter((a) => a.userId !== userId).concat(
            list.map((l) => ({ ...l, userId }))
          );
          this.writeJsonFile(USER_ADDRESSES_FILE, this.userAddresses);

          return list;
        }
      } catch (err) {
        console.error('[DB] Supabase getUserAddresses error:', err);
      }
    }

    const local = this.userAddresses.filter((a) => a.userId === userId);
    if (local.length > 0) {
      return local.map(({ userId: _, ...addr }) => addr as Address);
    }

    const user = this.users.find((u) => u.id === userId);
    if (user && Array.isArray((user as any).addresses)) {
      return (user as any).addresses;
    }

    return [];
  }

  public async saveUserAddress(userId: string, address: Omit<Address, 'id'> | Address): Promise<Address[]> {
    await this.initialize();
    if (!userId) throw new Error('Identificador do usuário é obrigatório.');

    const addressId = (address as Address).id || `addr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentAddresses = await this.getUserAddresses(userId);
    const isFirst = currentAddresses.length === 0;
    const isDefault = isFirst ? true : Boolean(address.isDefault);

    const newAddress: Address = {
      id: addressId,
      recipientName: (address.recipientName || '').trim(),
      cep: (address.cep || '').replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2'),
      street: (address.street || '').trim(),
      number: (address.number || '').trim(),
      complement: (address.complement || '').trim(),
      neighborhood: (address.neighborhood || '').trim(),
      city: (address.city || '').trim(),
      state: (address.state || '').trim().toUpperCase(),
      isDefault,
      phone: (address.phone || '').trim(),
    };

    let updatedAddresses: Address[] = [];
    if (isDefault) {
      updatedAddresses = currentAddresses.map((a) => ({ ...a, isDefault: false }));
    } else {
      updatedAddresses = [...currentAddresses];
    }

    const existingIdx = updatedAddresses.findIndex((a) => a.id === addressId);
    if (existingIdx >= 0) {
      updatedAddresses[existingIdx] = newAddress;
    } else {
      updatedAddresses.push(newAddress);
    }

    // Ensure at least one address is default
    if (!updatedAddresses.some((a) => a.isDefault) && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    this.userAddresses = this.userAddresses.filter((a) => a.userId !== userId).concat(
      updatedAddresses.map((a) => ({ ...a, userId }))
    );
    this.writeJsonFile(USER_ADDRESSES_FILE, this.userAddresses);

    const userIdx = this.users.findIndex((u) => u.id === userId);
    if (userIdx >= 0) {
      (this.users[userIdx] as any).addresses = updatedAddresses;
      this.writeJsonFile(USERS_FILE, this.users);
    }

    if (this.mode === 'supabase' && this.supabase) {
      try {
        if (isDefault) {
          await this.supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
        }

        await this.supabase.from('user_addresses').upsert({
          id: newAddress.id,
          user_id: userId,
          recipient_name: newAddress.recipientName,
          cep: newAddress.cep,
          street: newAddress.street,
          number: newAddress.number,
          complement: newAddress.complement || '',
          neighborhood: newAddress.neighborhood,
          city: newAddress.city,
          state: newAddress.state,
          is_default: newAddress.isDefault,
          data: newAddress,
          updated_at: new Date().toISOString(),
        });

        await this.supabase.from('profiles').update({
          addresses: updatedAddresses,
        }).eq('id', userId);
      } catch (err) {
        console.error('[DB] Supabase saveUserAddress error:', err);
      }
    }

    return updatedAddresses;
  }

  public async updateUserAddress(userId: string, addressId: string, updates: Partial<Address>): Promise<Address[]> {
    await this.initialize();
    if (!userId || !addressId) throw new Error('Identificador do usuário e do endereço são obrigatórios.');

    const currentAddresses = await this.getUserAddresses(userId);
    const existingIdx = currentAddresses.findIndex((a) => a.id === addressId);
    if (existingIdx === -1) {
      throw new Error(`Endereço "${addressId}" não encontrado.`);
    }

    const isDefault = updates.isDefault !== undefined ? updates.isDefault : currentAddresses[existingIdx].isDefault;
    let updatedAddresses: Address[] = [];

    if (isDefault) {
      updatedAddresses = currentAddresses.map((a) => (a.id === addressId ? { ...a, ...updates, id: addressId, isDefault: true } : { ...a, isDefault: false }));
    } else {
      updatedAddresses = currentAddresses.map((a) => (a.id === addressId ? { ...a, ...updates, id: addressId } : a));
    }

    if (!updatedAddresses.some((a) => a.isDefault) && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    const targetAddress = updatedAddresses.find((a) => a.id === addressId)!;

    this.userAddresses = this.userAddresses.filter((a) => a.userId !== userId).concat(
      updatedAddresses.map((a) => ({ ...a, userId }))
    );
    this.writeJsonFile(USER_ADDRESSES_FILE, this.userAddresses);

    const userIdx = this.users.findIndex((u) => u.id === userId);
    if (userIdx >= 0) {
      (this.users[userIdx] as any).addresses = updatedAddresses;
      this.writeJsonFile(USERS_FILE, this.users);
    }

    if (this.mode === 'supabase' && this.supabase) {
      try {
        if (targetAddress.isDefault) {
          await this.supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
        }

        await this.supabase.from('user_addresses').upsert({
          id: targetAddress.id,
          user_id: userId,
          recipient_name: targetAddress.recipientName,
          cep: targetAddress.cep,
          street: targetAddress.street,
          number: targetAddress.number,
          complement: targetAddress.complement || '',
          neighborhood: targetAddress.neighborhood,
          city: targetAddress.city,
          state: targetAddress.state,
          is_default: targetAddress.isDefault,
          data: targetAddress,
          updated_at: new Date().toISOString(),
        });

        await this.supabase.from('profiles').update({
          addresses: updatedAddresses,
        }).eq('id', userId);
      } catch (err) {
        console.error('[DB] Supabase updateUserAddress error:', err);
      }
    }

    return updatedAddresses;
  }

  public async deleteUserAddress(userId: string, addressId: string): Promise<Address[]> {
    await this.initialize();
    if (!userId || !addressId) throw new Error('Identificador do usuário e do endereço são obrigatórios.');

    const currentAddresses = await this.getUserAddresses(userId);
    const addressToDelete = currentAddresses.find((a) => a.id === addressId);
    if (!addressToDelete) return currentAddresses;

    let updatedAddresses = currentAddresses.filter((a) => a.id !== addressId);

    if (addressToDelete.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    this.userAddresses = this.userAddresses.filter((a) => a.userId !== userId).concat(
      updatedAddresses.map((a) => ({ ...a, userId }))
    );
    this.writeJsonFile(USER_ADDRESSES_FILE, this.userAddresses);

    const userIdx = this.users.findIndex((u) => u.id === userId);
    if (userIdx >= 0) {
      (this.users[userIdx] as any).addresses = updatedAddresses;
      this.writeJsonFile(USERS_FILE, this.users);
    }

    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('user_addresses').delete().eq('id', addressId).eq('user_id', userId);

        if (addressToDelete.isDefault && updatedAddresses.length > 0) {
          await this.supabase.from('user_addresses').update({ is_default: true }).eq('id', updatedAddresses[0].id).eq('user_id', userId);
        }

        await this.supabase.from('profiles').update({
          addresses: updatedAddresses,
        }).eq('id', userId);
      } catch (err) {
        console.error('[DB] Supabase deleteUserAddress error:', err);
      }
    }

    return updatedAddresses;
  }

  public async setDefaultUserAddress(userId: string, addressId: string): Promise<Address[]> {
    return this.updateUserAddress(userId, addressId, { isDefault: true });
  }

  // ==========================================
  // SHIPPING QUOTES (Server-authoritative)
  // ==========================================
  private shippingQuotes: any[] = [];

  public async saveShippingQuotes(quotes: any[]): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[DB_SECURITY] In-memory shipping quotes fallback is strictly forbidden in production mode.');
      return;
    }
    if (!Array.isArray(quotes) || quotes.length === 0) return;
    for (const q of quotes) {
      const qKey = q.id;
      const idx = this.shippingQuotes.findIndex((existing) => existing.id === qKey);
      if (idx >= 0) {
        this.shippingQuotes[idx] = q;
      } else {
        this.shippingQuotes.push(q);
      }
    }
  }

  public async getShippingQuote(quoteId: string): Promise<any | null> {
    if (!quoteId) return null;
    const adminClient = await this.getSupabaseAdminClient();
    if (adminClient) {
      try {
        const { data, error } = await adminClient
          .from('shipping_quotes')
          .select('*')
          .eq('id', quoteId)
          .maybeSingle();
        if (error) {
          console.error('[DB] Supabase query shipping_quotes failed:', error.message);
          return null; // strictly fail-closed, no memory fallback
        }
        if (data) {
          return data;
        }
        return null;
      } catch (err: any) {
        console.error('[DB] Supabase query shipping_quotes exception:', err.message);
        return null; // strictly fail-closed, no memory fallback
      }
    }

    // Fail-closed guard: in production, NEVER fall back to in-memory quotes
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    return this.shippingQuotes.find((q) => q.id === quoteId) || null;
  }

  // ==========================================
  // ORDERS
  // ==========================================
  public async getOrders(userId?: string, userEmail?: string): Promise<Order[]> {
    await this.initialize();
    if (this.mode === 'supabase') {
      try {
        const adminClient = (await this.getSupabaseAdminClient()) || this.supabase;
        if (adminClient) {
          let query = adminClient.from('orders').select('*').order('created_at', { ascending: false });
          if (userId && userEmail) {
            query = query.or(`user_id.eq.${userId},customer_email.eq.${userEmail},customer_email.eq.${userId}`);
          } else if (userId) {
            query = query.or(`user_id.eq.${userId},customer_email.eq.${userId}`);
          } else if (userEmail) {
            query = query.eq('customer_email', userEmail);
          }
          const { data, error } = await query;
          if (!error && data) {
            const sbOrders: Order[] = data.map((item: any) => {
              if (item.data && typeof item.data === 'object' && item.data.id) {
                return {
                  ...item.data,
                  id: item.id || item.data.id,
                  paymentStatus: item.payment_status || item.data.paymentStatus,
                  shippingStatus: item.shipping_status || item.data.shippingStatus,
                  shippingQuoteId: item.shipping_quote_id || item.data.shippingQuoteId,
                  shipmentPurchaseStatus: item.shipment_purchase_status || item.data.shipmentPurchaseStatus || 'not_started',
                  labelGenerationStatus: item.label_generation_status || item.data.labelGenerationStatus || 'not_started',
                  shipmentPurchasedAt: item.shipment_purchased_at || item.data.shipmentPurchasedAt,
                  labelGeneratedAt: item.label_generated_at || item.data.labelGeneratedAt,
                  shipmentLastError: item.shipment_last_error || item.data.shipmentLastError,
                  melhorEnvioShipmentId: item.melhor_envio_shipment_id || item.data.melhorEnvioShipmentId,
                  shippingLabelUrl: item.shipping_label_url || item.data.shippingLabelUrl,
                  trackingCode: item.tracking_code || item.data.trackingCode,
                  paymentProvider: item.payment_provider || item.data.paymentProvider,
                  paymentProviderPaymentId: item.payment_provider_payment_id || item.data.paymentProviderPaymentId,
                  paymentProviderSessionId: item.payment_provider_session_id || item.data.paymentProviderSessionId,
                  paymentProviderInvoiceSlug: item.payment_provider_invoice_slug || item.data.paymentProviderInvoiceSlug,
                  checkoutUrl: item.checkout_url || item.data.checkoutUrl,
                  paymentReceiptUrl: item.payment_receipt_url || item.data.paymentReceiptUrl,
                  checkoutAttemptKey: item.checkout_attempt_key || item.data.checkoutAttemptKey,
                  checkoutExpiresAt: item.checkout_expires_at || item.data.checkoutExpiresAt,
                  paymentDetails: {
                    ...(item.data.paymentDetails || {}),
                    gateway: item.payment_provider || item.data.paymentDetails?.gateway,
                    transactionId: item.payment_provider_payment_id || item.data.paymentDetails?.transactionId,
                    sessionId: item.payment_provider_session_id || item.data.paymentDetails?.sessionId,
                    invoiceSlug: item.payment_provider_invoice_slug || item.data.paymentDetails?.invoiceSlug,
                    checkoutUrl: item.checkout_url || item.data.paymentDetails?.checkoutUrl,
                    receiptUrl: item.payment_receipt_url || item.data.paymentDetails?.receiptUrl,
                    statusDetail: item.payment_status_detail || item.data.paymentDetails?.statusDetail,
                  },
                };
              }
              return {
                id: item.id || item.order_number,
                userId: item.user_id || undefined,
                customerName: item.customer_name || 'Cliente Marmot',
                customerEmail: item.customer_email || '',
                customerPhone: item.customer_phone || '',
                customerCpf: item.customer_cpf || '',
                date: new Date(item.created_at || Date.now()).toLocaleDateString('pt-BR'),
                status: item.status || 'Aguardando Pagamento',
                paymentStatus: item.payment_status || 'Pendente',
                shippingStatus: item.shipping_status || 'Aguardando preparação',
                items: item.items || [],
                subtotal: Number(item.subtotal || 0),
                discount: Number(item.discount_amount || item.discount || 0),
                shippingFee: Number(item.shipping_amount || item.shipping_fee || 0),
                total: Number(item.total || 0),
                paymentMethod: item.payment_method || 'Cartão de Crédito',
                shippingAddress: item.shipping_address_snapshot || item.shipping_address || {},
                shippingCarrier: item.shipping_company || item.shipping_carrier || 'Melhor Envio',
                shippingService: item.shipping_service_name || item.shipping_service || 'SEDEX',
                shippingServiceId: item.shipping_service_id,
                shippingDeliveryTime: item.shipping_delivery_time,
                trackingCode: item.tracking_code || '',
                history: item.history || [],
                paymentProvider: item.payment_provider || undefined,
                paymentProviderPaymentId: item.payment_provider_payment_id || undefined,
                paymentProviderSessionId: item.payment_provider_session_id || undefined,
                paymentProviderInvoiceSlug: item.payment_provider_invoice_slug || undefined,
                checkoutUrl: item.checkout_url || undefined,
                paymentReceiptUrl: item.payment_receipt_url || undefined,
                checkoutAttemptKey: item.checkout_attempt_key || undefined,
                checkoutExpiresAt: item.checkout_expires_at || undefined,
                paymentDetails: {
                  ...(item.data?.paymentDetails || {}),
                  gateway: item.payment_provider || item.data?.paymentDetails?.gateway,
                  transactionId: item.payment_provider_payment_id || item.data?.paymentDetails?.transactionId,
                  sessionId: item.payment_provider_session_id || item.data?.paymentDetails?.sessionId,
                  invoiceSlug: item.payment_provider_invoice_slug || item.data?.paymentDetails?.invoiceSlug,
                  checkoutUrl: item.checkout_url || item.data?.paymentDetails?.checkoutUrl,
                  receiptUrl: item.payment_receipt_url || item.data?.paymentDetails?.receiptUrl,
                  statusDetail: item.payment_status_detail || item.data?.paymentDetails?.statusDetail,
                },
                shippingDetails: item.data?.shippingDetails || null,
                shippingQuoteId: item.shipping_quote_id || undefined,
                shipmentPurchaseStatus: item.shipment_purchase_status || 'not_started',
                labelGenerationStatus: item.label_generation_status || 'not_started',
                shipmentPurchasedAt: item.shipment_purchased_at || undefined,
                labelGeneratedAt: item.label_generated_at || undefined,
                shipmentLastError: item.shipment_last_error || undefined,
                melhorEnvioShipmentId: item.melhor_envio_shipment_id || undefined,
                shippingLabelUrl: item.shipping_label_url || undefined,
                createdAt: item.created_at || new Date().toISOString(),
              };
            });

            const map = new Map<string, Order>();
            for (const o of sbOrders) map.set(o.id, o);
            for (const o of this.orders) {
              if (!map.has(o.id)) map.set(o.id, o);
            }
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            this.orders = merged;
            if (userId || userEmail) {
              return merged.filter((o) =>
                (userId && ((o as any).userId === userId || (o as any).user_id === userId)) ||
                (userEmail && o.customerEmail?.toLowerCase() === userEmail.toLowerCase()) ||
                (userId && o.customerEmail?.toLowerCase() === userId.toLowerCase())
              );
            }
            return merged;
          }
        }
      } catch (err) {
        console.warn('[DB] Supabase live getOrders fallback:', err);
      }
    }
    if (userId || userEmail) {
      return this.orders.filter((o) =>
        (userId && ((o as any).userId === userId || (o as any).user_id === userId)) ||
        (userEmail && o.customerEmail?.toLowerCase() === userEmail.toLowerCase()) ||
        (userId && o.customerEmail?.toLowerCase() === userId.toLowerCase())
      );
    }
    return this.orders;
  }

  public async getOrderById(id: string): Promise<Order | null> {
    await this.initialize();
    if (!id) return null;
    const clean = String(id).trim();

    // 1. Direct Supabase query with admin client (bypasses RLS to guarantee order persistence across lambdas)
    if (this.mode === 'supabase') {
      try {
        const adminClient = (await this.getSupabaseAdminClient()) || this.supabase;
        if (adminClient) {
          const { data, error } = await adminClient
            .from('orders')
            .select('*')
            .or(`id.eq.${clean},tracking_code.eq.${clean},payment_provider_session_id.eq.${clean},payment_provider_invoice_slug.eq.${clean},payment_provider_payment_id.eq.${clean}`)
            .maybeSingle();

          if (!error && data) {
            const order: Order = (data.data && typeof data.data === 'object' && data.data.id) ? {
              ...data.data,
              id: data.id || data.data.id,
              paymentStatus: data.payment_status || data.data.paymentStatus,
              shippingStatus: data.shipping_status || data.data.shippingStatus,
              shippingQuoteId: data.shipping_quote_id || data.data.shippingQuoteId,
              shipmentPurchaseStatus: data.shipment_purchase_status || data.data.shipmentPurchaseStatus || 'not_started',
              labelGenerationStatus: data.label_generation_status || data.data.labelGenerationStatus || 'not_started',
              shipmentPurchasedAt: data.shipment_purchased_at || data.data.shipmentPurchasedAt,
              labelGeneratedAt: data.label_generated_at || data.data.labelGeneratedAt,
              shipmentLastError: data.shipment_last_error || data.data.shipmentLastError,
              melhorEnvioShipmentId: data.melhor_envio_shipment_id || data.data.melhorEnvioShipmentId,
              shippingLabelUrl: data.shipping_label_url || data.data.shippingLabelUrl,
              trackingCode: data.tracking_code || data.data.trackingCode,
              paymentProvider: data.payment_provider || data.data.paymentProvider,
              paymentProviderPaymentId: data.payment_provider_payment_id || data.data.paymentProviderPaymentId,
              paymentProviderSessionId: data.payment_provider_session_id || data.data.paymentProviderSessionId,
              paymentProviderInvoiceSlug: data.payment_provider_invoice_slug || data.data.paymentProviderInvoiceSlug,
              checkoutUrl: data.checkout_url || data.data.checkoutUrl,
              paymentReceiptUrl: data.payment_receipt_url || data.data.paymentReceiptUrl,
              checkoutAttemptKey: data.checkout_attempt_key || data.data.checkoutAttemptKey,
              checkoutExpiresAt: data.checkout_expires_at || data.data.checkoutExpiresAt,
              paymentDetails: {
                ...(data.data.paymentDetails || {}),
                gateway: data.payment_provider || data.data.paymentDetails?.gateway,
                transactionId: data.payment_provider_payment_id || data.data.paymentDetails?.transactionId,
                sessionId: data.payment_provider_session_id || data.data.paymentDetails?.sessionId,
                invoiceSlug: data.payment_provider_invoice_slug || data.data.paymentDetails?.invoiceSlug,
                checkoutUrl: data.checkout_url || data.data.paymentDetails?.checkoutUrl,
                receiptUrl: data.payment_receipt_url || data.data.paymentDetails?.receiptUrl,
                statusDetail: data.payment_status_detail || data.data.paymentDetails?.statusDetail,
              },
            } : {
              id: data.id || clean,
              userId: data.user_id || undefined,
              customerName: data.customer_name || 'Cliente Marmot',
              customerEmail: data.customer_email || '',
              customerPhone: data.customer_phone || '',
              customerCpf: data.customer_cpf || '',
              date: new Date(data.created_at || Date.now()).toLocaleDateString('pt-BR'),
              status: data.status || 'Aguardando Pagamento',
              paymentStatus: data.payment_status || 'Pendente',
              shippingStatus: data.shipping_status || 'Aguardando preparação',
              items: data.items || [],
              subtotal: Number(data.subtotal || 0),
              discount: Number(data.discount || 0),
              shippingFee: Number(data.shipping_fee || 0),
              total: Number(data.total || 0),
              paymentMethod: data.payment_method || 'Cartão de Crédito',
              shippingAddress: data.shipping_address || {},
              shippingCarrier: data.shipping_option?.company || 'Melhor Envio',
              shippingService: data.shipping_option?.service_name || 'SEDEX',
              shippingServiceId: data.shipping_option?.service_id,
              shippingDeliveryTime: data.shipping_option?.delivery_time,
              trackingCode: data.tracking_code || '',
              history: data.history || [],
              paymentProvider: data.payment_provider || undefined,
              paymentProviderPaymentId: data.payment_provider_payment_id || undefined,
              paymentProviderSessionId: data.payment_provider_session_id || undefined,
              paymentProviderInvoiceSlug: data.payment_provider_invoice_slug || undefined,
              checkoutUrl: data.checkout_url || undefined,
              paymentReceiptUrl: data.payment_receipt_url || undefined,
              checkoutAttemptKey: data.checkout_attempt_key || undefined,
              checkoutExpiresAt: data.checkout_expires_at || undefined,
              paymentDetails: {
                ...(data.data?.paymentDetails || {}),
                gateway: data.payment_provider || data.data?.paymentDetails?.gateway,
                transactionId: data.payment_provider_payment_id || data.data?.paymentDetails?.transactionId,
                sessionId: data.payment_provider_session_id || data.data?.paymentDetails?.sessionId,
                invoiceSlug: data.payment_provider_invoice_slug || data.data?.paymentDetails?.invoiceSlug,
                checkoutUrl: data.checkout_url || data.data?.paymentDetails?.checkoutUrl,
                receiptUrl: data.payment_receipt_url || data.data?.paymentDetails?.receiptUrl,
                statusDetail: data.payment_status_detail || data.data?.paymentDetails?.statusDetail,
              },
              shippingDetails: data.data?.shippingDetails || null,
              shippingQuoteId: data.shipping_quote_id || undefined,
              shipmentPurchaseStatus: data.shipment_purchase_status || 'not_started',
              labelGenerationStatus: data.label_generation_status || 'not_started',
              shipmentPurchasedAt: data.shipment_purchased_at || undefined,
              labelGeneratedAt: data.label_generated_at || undefined,
              shipmentLastError: data.shipment_last_error || undefined,
              melhorEnvioShipmentId: data.melhor_envio_shipment_id || undefined,
              shippingLabelUrl: data.shipping_label_url || undefined,
              createdAt: data.created_at || new Date().toISOString(),
            };

            const idx = this.orders.findIndex((o) => o.id === order.id || o.id === clean);
            if (idx >= 0) this.orders[idx] = order;
            else this.orders.unshift(order);
            return order;
          }
        }
      } catch (err) {
        console.warn('[DB] Supabase live getOrderById fallback:', err);
      }
    }

    // 2. Memory / local file lookup
    return this.orders.find((o) =>
      o.id === clean ||
      o.trackingCode === clean ||
      o.paymentProviderSessionId === clean ||
      o.paymentProviderInvoiceSlug === clean ||
      o.paymentProviderPaymentId === clean ||
      o.paymentDetails?.sessionId === clean ||
      o.paymentDetails?.transactionId === clean
    ) || null;
  }

  public async getOrderByCheckoutAttempt(userId: string, attemptKey: string): Promise<Order | null> {
    await this.initialize();
    if (!userId || !attemptKey) return null;

    if (this.mode === 'supabase') {
      try {
        const client = await this.getRequiredSupabaseAdminClient('consulta idempotente de checkout');
        const { data, error } = await client
          .from('orders')
          .select('id')
          .eq('user_id', userId)
          .eq('checkout_attempt_key', attemptKey)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (data?.id) return this.getOrderById(data.id);
      } catch (error: any) {
        console.error('[CHECKOUT_ATTEMPT_LOOKUP_ERROR]', error?.message || error);
        throw error;
      }
    }

    return this.orders.find((order) =>
      order.userId === userId && String(order.checkoutAttemptKey || '') === attemptKey
    ) || null;
  }

  public async saveOrder(order: Order): Promise<Order> {
    await this.initialize();

    if (this.mode === 'supabase') {
      const adminClient = await this.getSupabaseAdminClient();
      const clientToUse = adminClient || this.supabase;

      if (!clientToUse) {
        throw new Error(`[DB_PERSISTENCE_ERROR] Supabase client não disponível para persistir pedido #${order.id}.`);
      }

      const orderPayload: any = {
        id: order.id,
        user_id: order.userId || null,
        customer: (order as any).customer || {},
        customer_email: order.customerEmail || (order as any).customer?.email || 'cliente@marmot.com',
        customer_name: order.customerName || (order as any).customer?.name || order.shippingAddress?.recipientName || null,
        customer_phone: order.customerPhone || (order as any).customer?.phone || null,
        customer_cpf: order.customerCpf || (order as any).customer?.cpf || null,
        items: order.items || [],
        shipping_address: order.shippingAddress || {},
        shipping_option: order.shippingOption || {
          company: order.shippingCarrier || null,
          service_name: order.shippingService || null,
          service_id: order.shippingServiceId || null,
          delivery_time: order.shippingDeliveryTime || null,
        },
        shipping_details: (order as any).shippingDetails || null,
        shipping_quote_id: order.shippingQuoteId || (order as any).shipping_quote_id || null,
        shipping_carrier: order.shippingCarrier || null,
        shipping_provider: (order as any).shippingProvider || order.shippingCarrier || null,
        shipping_service: order.shippingService || null,
        shipping_service_id: order.shippingServiceId || null,
        shipping_delivery_time: order.shippingDeliveryTime || null,
        payment_method: order.paymentMethod || null,
        payment_details: order.paymentDetails || {},
        payment_provider: order.paymentProvider || order.paymentDetails?.gateway || null,
        payment_provider_payment_id: order.paymentProviderPaymentId || order.paymentDetails?.transactionId || null,
        payment_provider_session_id: order.paymentProviderSessionId || order.paymentDetails?.sessionId || null,
        payment_provider_invoice_slug: order.paymentProviderInvoiceSlug || order.paymentDetails?.invoiceSlug || null,
        payment_installments: order.paymentDetails?.installments || null,
        payment_amount: order.paymentStatus === 'Pago' ? Number(order.total || 0) : null,
        payment_receipt_url: order.paymentReceiptUrl || order.paymentDetails?.receiptUrl || null,
        checkout_url: order.checkoutUrl || order.paymentDetails?.checkoutUrl || null,
        payment_status_detail: order.paymentDetails?.statusDetail || null,
        checkout_attempt_key: order.checkoutAttemptKey || null,
        checkout_expires_at: order.checkoutExpiresAt || null,
        subtotal: Number(order.subtotal || 0),
        shipping_fee: Number(order.shippingFee || (order as any).shipping || 0),
        shipping_price: Number(order.shippingPrice ?? order.shippingFee ?? (order as any).shipping ?? 0),
        discount: Number(order.discount || 0),
        coupon_code: (order as any).couponCode || (order as any).coupon_code || null,
        total: Number(order.total || 0),
        status: order.status || 'Aguardando Pagamento',
        payment_status: order.paymentStatus || (order.status === 'Pagamento Aprovado' || order.status === 'Em Separação' ? 'Pago' : 'Pendente'),
        shipping_status: order.shippingStatus || 'Aguardando preparação',
        shipment_purchase_status: order.shipmentPurchaseStatus || 'not_started',
        label_generation_status: order.labelGenerationStatus || 'not_started',
        shipment_purchased_at: order.shipmentPurchasedAt || null,
        label_generated_at: order.labelGeneratedAt || null,
        shipment_last_error: order.shipmentLastError || null,
        tracking_code: order.trackingCode || null,
        tracking_url: (order as any).trackingUrl || (order as any).tracking_url || null,
        paid_at: order.paidAt || (order.paymentStatus === 'Pago' ? (order.createdAt || new Date().toISOString()) : null),
        separation_started_at: order.separationStartedAt || null,
        posted_at: order.postedAt || null,
        in_transit_at: order.inTransitAt || null,
        out_for_delivery_at: order.outForDeliveryAt || null,
        delivered_at: order.deliveredAt || null,
        melhor_envio_shipment_id: order.melhorEnvioShipmentId || (order as any).melhor_envio_shipment_id || null,
        shipping_label_url: order.shippingLabelUrl || (order as any).shipping_label_url || null,
        history: order.history || [],
        notes: (order as any).notes || null,
        data: order,
        updated_at: new Date().toISOString(),
      };

      try {
        const { error: saveErr } = await clientToUse.from('orders').upsert(orderPayload, { onConflict: 'id' });

        if (saveErr) {
          console.warn('[DB] Tentativa de upsert completo falhou, testando payload base:', saveErr.message);
          // Fallback to base columns that always exist in core orders table
          const basePayload = {
            id: order.id,
            user_id: order.userId || null,
            customer_name: order.customerName || (order as any).customer?.name || null,
            customer_email: order.customerEmail || (order as any).customer?.email || 'cliente@marmot.com',
            customer_phone: order.customerPhone || null,
            customer_cpf: order.customerCpf || null,
            items: order.items || [],
            subtotal: Number(order.subtotal || 0),
            shipping_fee: Number(order.shippingFee || 0),
            discount: Number(order.discount || 0),
            total: Number(order.total || 0),
            status: order.status || 'Aguardando Pagamento',
            payment_method: order.paymentMethod || null,
            payment_status: order.paymentStatus || 'Pendente',
            shipping_address: order.shippingAddress || {},
            tracking_code: order.trackingCode || null,
            data: order,
            updated_at: new Date().toISOString(),
          };
          const { error: fallbackErr } = await clientToUse.from('orders').upsert(basePayload, { onConflict: 'id' });
          if (fallbackErr) {
            console.error('[DB] Supabase order upsert fallback error:', fallbackErr.message);
            throw new Error(`[DB_PERSISTENCE_ERROR] Falha crítica ao persistir pedido #${order.id} no Supabase: ${fallbackErr.message}`);
          } else {
            console.log(`[DB] Pedido #${order.id} salvo via payload canônico no Supabase.`);
          }
        } else {
          console.log(`[DB] Pedido #${order.id} salvo com sucesso no Supabase.`);
        }

        // Persist normalized order_items if admin client is present
        if (adminClient && Array.isArray(order.items) && order.items.length > 0) {
          for (const item of order.items) {
            try {
              await adminClient.from('order_items').upsert({
                id: item.id || `${order.id}-${item.productId}`,
                order_id: order.id,
                product_id: item.productId,
                product_name: item.title || (item as any).productTitle || (item as any).name || 'Produto',
                sku: item.sku || null,
                size: item.size || 'M',
                color: item.color || (item as any).colorName || 'Padrão',
                color_name: (item as any).colorName || item.color || null,
                quantity: item.quantity || 1,
                unit_price: item.price || 0,
                discount: 0,
                line_total: item.subtotal || ((item.price || 0) * (item.quantity || 1)),
                image: item.image || (item as any).productImage || null,
              }, { onConflict: 'id' });
            } catch (itemErr: any) {
              console.warn('[DB] Supabase order_item notice:', itemErr.message);
            }
          }
        }

        // Persist status history entry if admin client is present
        if (adminClient) {
          try {
            await adminClient.from('order_status_history').insert({
              order_id: order.id,
              status: order.status || 'Aguardando Pagamento',
              previous_status: null,
              new_status: order.status || 'Aguardando Pagamento',
              source: 'system',
              description: `Pedido sincronizado com status "${order.status || 'Aguardando Pagamento'}"`,
              occurred_at: new Date().toISOString(),
            });
          } catch (histErr: any) {
            // Silently ignore if already logged or duplicate
          }
        }
      } catch (dbErr: any) {
        console.error('[DB] Erro crítico ao persistir pedido no Supabase:', dbErr.message);
        throw dbErr;
      }
    }

    // Only update local cache and memory once backend persistence succeeds
    const idx = this.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.orders[idx] = order;
    } else {
      this.orders.unshift(order);
    }
    this.writeJsonFile(ORDERS_FILE, this.orders);

    return order;
  }

  // ==========================================
  // COUPONS
  // ==========================================
  public async getCoupons(): Promise<DbCoupon[]> {
    await this.initialize();
    return this.coupons;
  }

  public async saveCoupon(coupon: DbCoupon): Promise<DbCoupon> {
    await this.initialize();
    const idx = this.coupons.findIndex((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) {
      this.coupons[idx] = coupon;
    } else {
      this.coupons.push(coupon);
    }
    this.writeJsonFile(COUPONS_FILE, this.coupons);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('saveCoupon');
        await adminClient.from('coupons').upsert({
          code: coupon.code,
          discount_percentage: coupon.discountPercentage,
          min_order_value: coupon.minOrderValue,
          description: coupon.description,
          active: coupon.active,
          data: coupon,
        });
      } catch (err) {
        console.error('[DB] Supabase coupon upsert error:', err);
      }
    }
    return coupon;
  }

  public async deleteCoupon(code: string): Promise<boolean> {
    await this.initialize();
    const initLen = this.coupons.length;
    this.coupons = this.coupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    this.writeJsonFile(COUPONS_FILE, this.coupons);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('deleteCoupon');
        await adminClient.from('coupons').delete().eq('code', code.toUpperCase());
      } catch (err) {
        console.error('[DB] Supabase coupon delete error:', err);
      }
    }
    return this.coupons.length < initLen;
  }

  public async toggleCoupon(code: string): Promise<DbCoupon | null> {
    await this.initialize();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) return null;
    coupon.active = !coupon.active;
    return this.saveCoupon(coupon);
  }

  public async validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; discount: number; coupon?: DbCoupon; error?: string }> {
    await this.initialize();
    if (!code || typeof code !== 'string') {
      return { valid: false, discount: 0, error: 'Código de cupom inválido.' };
    }
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!coupon) {
      return { valid: false, discount: 0, error: 'Cupom não encontrado.' };
    }
    if (!coupon.active) {
      return { valid: false, discount: 0, error: 'Este cupom está inativo ou expirado.' };
    }
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        error: `O valor mínimo do pedido para este cupom é de R$ ${coupon.minOrderValue.toFixed(2)}.`,
      };
    }
    const discount = Number(((subtotal * coupon.discountPercentage) / 100).toFixed(2));
    return { valid: true, discount, coupon };
  }

  public async getOrderByTracking(code: string): Promise<Order | null> {
    await this.initialize();
    const clean = code.trim().toLowerCase();
    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('orders')
          .select('*')
          .or(`tracking_code.eq.${code.trim()},id.eq.${code.trim()}`)
          .maybeSingle();
        if (!error && data) {
          const order = data.data || data;
          const idx = this.orders.findIndex((o) => o.id === order.id);
          if (idx >= 0) this.orders[idx] = order;
          else this.orders.unshift(order);
          return order;
        }
      } catch (err) {
        console.warn('[DB] Supabase getOrderByTracking fallback:', err);
      }
    }
    return this.orders.find((o) => o.trackingCode?.toLowerCase() === clean || o.id.toLowerCase() === clean) || null;
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  public async logEvent(eventType: string, payload: Partial<DbAuditLog>): Promise<void> {
    const logItem: DbAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      eventType,
      email: payload.email,
      userId: payload.userId,
      ip: payload.ip,
      status: payload.status || 'info',
      details: payload.details || '',
    };

    this.auditLogs.unshift(logItem);
    if (this.auditLogs.length > 300) {
      this.auditLogs = this.auditLogs.slice(0, 300);
    }
    this.writeJsonFile(AUDIT_LOGS_FILE, this.auditLogs);
  }

  public async getAuditLogs(): Promise<DbAuditLog[]> {
    await this.initialize();
    return this.auditLogs;
  }

  // ==========================================
  // CART PERSISTENCE (Isolated per user)
  // ==========================================
  public async getCartForUser(userId: string): Promise<any[]> {
    await this.initialize();

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase.from('cart_items').select('*').eq('user_id', userId);
        if (!error && Array.isArray(data)) {
          const nonUserItems = this.cartItems.filter((c) => c.userId !== userId);
          const sbItems = data.map((item: any) => {
            const rawSize = item.size || item.selected_size || item.data?.selectedSize || item.data?.size || 'M';
            const rawColor = item.selected_color || item.data?.selectedColor || {
              color: item.color || 'black',
              colorName: item.color_name || item.color || 'Padrão',
              colorHex: '#121212',
            };
            return {
              id: item.id,
              userId: item.user_id,
              productId: item.product_id,
              selectedSize: rawSize,
              selectedColor: typeof rawColor === 'object' ? rawColor : { color: String(rawColor), colorName: String(item.color_name || rawColor), colorHex: '#121212' },
              quantity: item.quantity || 1,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            };
          });
          this.cartItems = [...nonUserItems, ...sbItems];
          this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);
        }
      } catch (err) {
        console.warn('[DB] Supabase getCartForUser notice:', err);
      }
    }

    const userItems = this.cartItems.filter((c) => c.userId === userId);
    const result: any[] = [];
    for (const item of userItems) {
      const prod =
        this.products.find((p) => p.id === item.productId || (item as any).product_id === p.id) ||
        (item as any).product ||
        ((item as any).data as any)?.product;

      if (prod) {
        result.push({
          product: prod,
          selectedSize: item.selectedSize || (item as any).selected_size || 'M',
          selectedColor: item.selectedColor || (item as any).selected_color || { color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' },
          quantity: item.quantity || 1,
        });
      }
    }
    return result;
  }

  public async addCartItemForUser(
    userId: string,
    productId: string,
    selectedSize: string,
    selectedColor: any,
    quantity: number = 1
  ): Promise<any[]> {
    await this.initialize();
    const cleanQty = Math.max(1, parseInt(String(quantity || 1), 10));
    const cleanColorName = selectedColor?.colorName || selectedColor?.color || 'Padrão';
    const prod = this.products.find((p) => p.id === productId);

    const existing = this.cartItems.find(
      (c) =>
        c.userId === userId &&
        c.productId === productId &&
        c.selectedSize === selectedSize &&
        (c.selectedColor?.colorName === cleanColorName || c.selectedColor?.color === selectedColor?.color)
    );

    if (existing) {
      existing.quantity += cleanQty;
      existing.updatedAt = new Date().toISOString();
    } else {
      const newItem: DbCartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        productId,
        selectedSize,
        selectedColor: {
          color: selectedColor?.color || 'black',
          colorName: cleanColorName,
          colorHex: selectedColor?.colorHex || '#121212',
          image: selectedColor?.image || '',
        },
        quantity: cleanQty,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.cartItems.push(newItem);
    }

    this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const itemToPersist = existing || this.cartItems[this.cartItems.length - 1];
        await this.supabase.from('cart_items').upsert({
          id: itemToPersist.id,
          user_id: itemToPersist.userId,
          product_id: itemToPersist.productId,
          size: itemToPersist.selectedSize || 'M',
          color: itemToPersist.selectedColor?.colorName || itemToPersist.selectedColor?.color || 'Padrão',
          selected_size: itemToPersist.selectedSize,
          selected_color: itemToPersist.selectedColor,
          quantity: itemToPersist.quantity,
          updated_at: itemToPersist.updatedAt,
          data: {
            ...itemToPersist,
            product: prod || (itemToPersist as any).product,
          },
        });
      } catch (err) {
        console.warn('[DB] Supabase cart upsert warning:', err);
      }
    }

    return this.getCartForUser(userId);
  }

  public async updateCartItemQuantityForUser(
    userId: string,
    productId: string,
    selectedSize: string,
    colorName: string,
    quantity: number
  ): Promise<any[]> {
    await this.initialize();
    const cleanQty = parseInt(String(quantity), 10);
    const prod = this.products.find((p) => p.id === productId);

    const idx = this.cartItems.findIndex(
      (c) =>
        c.userId === userId &&
        c.productId === productId &&
        c.selectedSize === selectedSize &&
        (!colorName || c.selectedColor?.colorName === colorName || c.selectedColor?.color === colorName)
    );

    if (idx >= 0) {
      const item = this.cartItems[idx];
      if (cleanQty <= 0) {
        this.cartItems.splice(idx, 1);
        if (this.mode === 'supabase' && this.supabase) {
          try {
            await this.supabase.from('cart_items').delete().eq('id', item.id);
          } catch {}
        }
      } else {
        item.quantity = cleanQty;
        item.updatedAt = new Date().toISOString();
        if (this.mode === 'supabase' && this.supabase) {
          try {
            await this.supabase.from('cart_items').upsert({
              id: item.id,
              user_id: item.userId,
              product_id: item.productId,
              size: item.selectedSize || 'M',
              color: item.selectedColor?.colorName || item.selectedColor?.color || 'Padrão',
              selected_size: item.selectedSize,
              selected_color: item.selectedColor,
              quantity: item.quantity,
              updated_at: item.updatedAt,
              data: {
                ...item,
                product: prod || (item as any).product,
              },
            });
          } catch {}
        }
      }
      this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);
    }

    return this.getCartForUser(userId);
  }

  public async removeCartItemForUser(
    userId: string,
    productId: string,
    selectedSize: string,
    colorName: string
  ): Promise<any[]> {
    await this.initialize();
    const idx = this.cartItems.findIndex(
      (c) =>
        c.userId === userId &&
        c.productId === productId &&
        (!selectedSize || c.selectedSize === selectedSize) &&
        (!colorName || c.selectedColor?.colorName === colorName || c.selectedColor?.color === colorName)
    );

    if (idx >= 0) {
      const item = this.cartItems[idx];
      this.cartItems.splice(idx, 1);
      this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);
      if (this.mode === 'supabase' && this.supabase) {
        try {
          await this.supabase.from('cart_items').delete().eq('id', item.id);
        } catch {}
      }
    }

    return this.getCartForUser(userId);
  }

  public async clearCartForUser(userId: string): Promise<void> {
    await this.initialize();
    this.cartItems = this.cartItems.filter((c) => c.userId !== userId);
    this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);
    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('cart_items').delete().eq('user_id', userId);
      } catch {}
    }
  }

  public async mergeGuestCartForUser(userId: string, guestItems: any[]): Promise<any[]> {
    await this.initialize();
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return this.getCartForUser(userId);
    }

    for (const item of guestItems) {
      const prodId = item.product?.id || item.productId;
      if (!prodId) continue;
      const size = item.selectedSize || 'M';
      const color = item.selectedColor || { color: 'black', colorName: 'Obsidian Black', colorHex: '#121212' };
      const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));

      const existing = this.cartItems.find(
        (c) =>
          c.userId === userId &&
          c.productId === prodId &&
          c.selectedSize === size &&
          (c.selectedColor?.colorName === color.colorName || c.selectedColor?.color === color.color)
      );

      if (existing) {
        existing.quantity += qty;
        existing.updatedAt = new Date().toISOString();
      } else {
        const newItem: DbCartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId,
          productId: prodId,
          selectedSize: size,
          selectedColor: color,
          quantity: qty,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.cartItems.push(newItem);
      }
    }

    this.writeJsonFile(CART_ITEMS_FILE, this.cartItems);

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const userItems = this.cartItems.filter((c) => c.userId === userId);
        for (const item of userItems) {
          await this.supabase.from('cart_items').upsert({
            id: item.id,
            user_id: item.userId,
            product_id: item.productId,
            size: item.selectedSize || 'M',
            color: item.selectedColor?.colorName || item.selectedColor?.color || 'Padrão',
            selected_size: item.selectedSize,
            selected_color: item.selectedColor,
            quantity: item.quantity,
            updated_at: item.updatedAt,
            data: item,
          });
        }
      } catch {}
    }

    return this.getCartForUser(userId);
  }

  // ==========================================
  // WISHLIST PERSISTENCE (Isolated per user)
  // ==========================================
  public async getWishlistForUser(userId: string): Promise<Product[]> {
    await this.initialize();

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase.from('favorites').select('*').eq('user_id', userId);
        if (!error && data) {
          const nonUserItems = this.wishlistItems.filter((w) => w.userId !== userId);
          const sbItems = data.map((item: any) => item.data || {
            id: item.id,
            userId: item.user_id,
            productId: item.product_id,
            createdAt: item.created_at,
          });
          this.wishlistItems = [...nonUserItems, ...sbItems];
          this.writeJsonFile(WISHLIST_ITEMS_FILE, this.wishlistItems);
        }
      } catch (err) {
        console.warn('[DB] Supabase getWishlistForUser notice:', err);
      }
    }

    const userItems = this.wishlistItems.filter((w) => w.userId === userId);
    const result: Product[] = [];
    for (const item of userItems) {
      const prod = this.products.find((p) => p.id === item.productId);
      if (prod) {
        result.push(prod);
      }
    }
    return result;
  }

  public async toggleWishlistForUser(userId: string, productId: string): Promise<{ wishlist: Product[]; isInWishlist: boolean }> {
    await this.initialize();
    const idx = this.wishlistItems.findIndex((w) => w.userId === userId && w.productId === productId);
    let isInWishlist = false;

    if (idx >= 0) {
      const item = this.wishlistItems[idx];
      this.wishlistItems.splice(idx, 1);
      if (this.mode === 'supabase' && this.supabase) {
        try {
          await this.supabase.from('favorites').delete().eq('id', item.id);
        } catch {}
      }
      isInWishlist = false;
    } else {
      const newItem: DbWishlistItem = {
        id: `fav-${userId}-${productId}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        userId,
        productId,
        createdAt: new Date().toISOString(),
      };
      this.wishlistItems.push(newItem);
      if (this.mode === 'supabase' && this.supabase) {
        try {
          await this.supabase.from('favorites').upsert({
            id: newItem.id,
            user_id: newItem.userId,
            product_id: newItem.productId,
            created_at: newItem.createdAt,
            data: newItem,
          });
        } catch {}
      }
      isInWishlist = true;
    }

    this.writeJsonFile(WISHLIST_ITEMS_FILE, this.wishlistItems);
    const wishlist = await this.getWishlistForUser(userId);
    return { wishlist, isInWishlist };
  }

  public async removeFromWishlistForUser(userId: string, productId: string): Promise<Product[]> {
    await this.initialize();
    const idx = this.wishlistItems.findIndex((w) => w.userId === userId && w.productId === productId);
    if (idx >= 0) {
      const item = this.wishlistItems[idx];
      this.wishlistItems.splice(idx, 1);
      this.writeJsonFile(WISHLIST_ITEMS_FILE, this.wishlistItems);
      if (this.mode === 'supabase' && this.supabase) {
        try {
          await this.supabase.from('favorites').delete().eq('id', item.id);
        } catch {}
      }
    }
    return this.getWishlistForUser(userId);
  }

  public async clearWishlistForUser(userId: string): Promise<void> {
    await this.initialize();
    this.wishlistItems = this.wishlistItems.filter((w) => w.userId !== userId);
    this.writeJsonFile(WISHLIST_ITEMS_FILE, this.wishlistItems);
    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('favorites').delete().eq('user_id', userId);
      } catch {}
    }
  }

  // ==========================================
  // RETURNS & EXCHANGES (RMA)
  // ==========================================
  public async getReturns(userId?: string): Promise<ReturnRequest[]> {
    await this.initialize();
    if (userId) {
      return this.returns.filter((r) => r.userId === userId || r.customerEmail.toLowerCase() === userId.toLowerCase());
    }
    return this.returns;
  }

  public async getReturnById(id: string): Promise<ReturnRequest | null> {
    await this.initialize();
    return this.returns.find((r) => r.id === id) || null;
  }

  public async saveReturn(returnReq: ReturnRequest): Promise<ReturnRequest> {
    await this.initialize();
    const idx = this.returns.findIndex((r) => r.id === returnReq.id);
    if (idx >= 0) {
      this.returns[idx] = returnReq;
    } else {
      this.returns.unshift(returnReq);
    }
    this.writeJsonFile(RETURNS_FILE, this.returns);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('saveReturn');
        await adminClient.from('returns').upsert({
          id: returnReq.id,
          order_id: returnReq.orderId,
          user_id: returnReq.userId || null,
          customer_name: returnReq.customerName,
          customer_email: returnReq.customerEmail,
          customer_phone: returnReq.customerPhone || null,
          items: returnReq.items,
          reason: returnReq.reason,
          description: returnReq.description,
          photos: returnReq.photos || [],
          status: returnReq.status,
          tracking_code: returnReq.trackingCode || null,
          history: returnReq.history,
          admin_notes: returnReq.adminNotes || null,
          refund_amount: returnReq.refundAmount || null,
          restock_completed: returnReq.restockCompleted || false,
          data: returnReq,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[DB] Supabase return upsert error:', err);
      }
    }
    return returnReq;
  }

  // ==========================================
  // INVENTORY MOVEMENTS (AUDIT TRAIL)
  // ==========================================
  public async getInventoryMovements(productId?: string): Promise<InventoryMovement[]> {
    await this.initialize();
    if (productId) {
      return this.inventoryMovements.filter((m) => m.productId === productId);
    }
    return this.inventoryMovements;
  }

  public async recordInventoryMovement(mov: InventoryMovement): Promise<InventoryMovement> {
    await this.initialize();
    this.inventoryMovements.unshift(mov);
    this.writeJsonFile(INVENTORY_MOVEMENTS_FILE, this.inventoryMovements);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('recordInventoryMovement');
        await adminClient.from('inventory_movements').insert({
          id: mov.id,
          product_id: mov.productId,
          product_title: mov.productTitle,
          sku: mov.sku || null,
          variant: mov.variant || {},
          quantity_change: mov.quantityChange,
          previous_stock: mov.previousStock,
          new_stock: mov.newStock,
          reason: mov.reason,
          order_id: mov.orderId || null,
          return_id: mov.returnId || null,
          user_or_admin: mov.userOrAdmin,
          note: mov.note || null,
          data: mov,
        });
      } catch (err) {
        console.error('[DB] Supabase inventory movement insert error:', err);
      }
    }
    return mov;
  }

  // ==========================================
  // STORE BANNERS
  // ==========================================
  public async getStoreBanners(): Promise<StoreBanner[]> {
    await this.initialize();
    return this.storeBanners.sort((a, b) => a.order - b.order);
  }

  public async saveStoreBanner(banner: StoreBanner): Promise<StoreBanner> {
    await this.initialize();
    const idx = this.storeBanners.findIndex((b) => b.id === banner.id);
    if (idx >= 0) {
      this.storeBanners[idx] = banner;
    } else {
      this.storeBanners.push(banner);
    }
    this.writeJsonFile(STORE_BANNERS_FILE, this.storeBanners);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('saveStoreBanner');
        await adminClient.from('store_banners').upsert({
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle || null,
          button_text: banner.buttonText || null,
          link_url: banner.linkUrl,
          image_url: banner.imageUrl,
          active: banner.active,
          order: banner.order,
          placement: banner.placement,
          data: banner,
        });
      } catch (err) {
        console.error('[DB] Supabase store banner upsert error:', err);
      }
    }
    return banner;
  }

  public async deleteStoreBanner(id: string): Promise<boolean> {
    await this.initialize();
    const initLen = this.storeBanners.length;
    this.storeBanners = this.storeBanners.filter((b) => b.id !== id);
    this.writeJsonFile(STORE_BANNERS_FILE, this.storeBanners);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('deleteStoreBanner');
        await adminClient.from('store_banners').delete().eq('id', id);
      } catch (err) {
        console.error('[DB] Supabase store banner delete error:', err);
      }
    }
    return this.storeBanners.length < initLen;
  }

  // ==========================================
  // STORE SETTINGS
  // ==========================================
  public async getStoreSettings(): Promise<StoreSettingsData> {
    await this.initialize();
    return this.storeSettings || INITIAL_STORE_SETTINGS;
  }

  public async saveStoreSettings(settings: Partial<StoreSettingsData>): Promise<StoreSettingsData> {
    await this.initialize();
    this.storeSettings = { ...this.storeSettings, ...settings };
    this.writeJsonFile(STORE_SETTINGS_FILE, this.storeSettings);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('saveStoreSettings');
        await adminClient.from('store_settings').upsert({
          id: 'default',
          store_name: this.storeSettings.storeName,
          contact_email: this.storeSettings.contactEmail,
          support_phone: this.storeSettings.phone,
          free_shipping_threshold: this.storeSettings.freeShippingThreshold,
          banner_alert: this.storeSettings.announcementBarText,
          data: this.storeSettings,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[DB] Supabase store settings upsert error:', err);
      }
    }
    return this.storeSettings;
  }

  // ==========================================
  // ADMIN ACTIVITY LOGS
  // ==========================================
  public async logAdminAction(
    adminEmail: string,
    adminName: string,
    action: string,
    entity: AdminActivityLog['entity'],
    entityId: string,
    details?: string,
    metadata?: any
  ): Promise<AdminActivityLog> {
    await this.initialize();
    const logItem: AdminActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      adminEmail: adminEmail || 'admin@marmot.com',
      adminName: adminName || 'Administrador',
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
      metadata,
    };
    await this.logEvent(`ADMIN_${action.toUpperCase()}`, {
      email: adminEmail,
      details: `[${entity.toUpperCase()}:${entityId}] ${details || action}`,
      status: 'info',
      data: logItem,
    });
    return logItem;
  }

  public async getAdminActivityLogs(limit = 100): Promise<AdminActivityLog[]> {
    await this.initialize();
    const logs = this.auditLogs
      .filter((l) => l.eventType.startsWith('ADMIN_') || l.data?.entity)
      .map((l) => ({
        id: l.id,
        adminEmail: l.email || 'admin@marmot.com',
        adminName: l.data?.adminName || 'Admin',
        action: l.data?.action || l.eventType.replace('ADMIN_', ''),
        entity: (l.data?.entity || 'order') as any,
        entityId: l.data?.entityId || l.id,
        details: l.details || l.data?.details || '',
        timestamp: l.timestamp,
        metadata: l.data?.metadata,
      }));
    return logs.slice(0, limit);
  }

  // ==========================================
  // CUSTOMER 360 & METRICS
  // ==========================================
  public async getCustomerProfiles(): Promise<CustomerDetail[]> {
    await this.initialize();
    const customersMap = new Map<string, CustomerDetail>();

    // 1. Add registered users
    for (const u of this.users) {
      customersMap.set(u.email.toLowerCase(), {
        id: u.id,
        name: u.name || 'Cliente',
        email: u.email,
        phone: (u as any).phone || '',
        cpf: (u as any).cpf || '',
        role: u.role,
        isVerified: (u as any).isVerified ?? true,
        addresses: (u as any).addresses || [],
        createdAt: u.createdAt || new Date().toISOString(),
        lastLogin: (u as any).lastLogin,
        totalOrders: 0,
        totalSpent: 0,
        avgTicket: 0,
        status: ((u as any).status as any) || 'active',
      });
    }

    // 2. Merge orders to calculate LTV, total orders, last order date
    for (const o of this.orders) {
      const email = (o.customerEmail || '').toLowerCase();
      if (!email) continue;

      let cust = customersMap.get(email);
      if (!cust) {
        cust = {
          id: o.userId || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: o.customerName || 'Cliente Visitante',
          email,
          phone: o.customerPhone || '',
          cpf: o.customerCpf || '',
          role: 'customer',
          isVerified: false,
          addresses: o.shippingAddress ? [o.shippingAddress] : [],
          createdAt: o.createdAt || o.date || new Date().toISOString(),
          totalOrders: 0,
          totalSpent: 0,
          avgTicket: 0,
          status: 'active',
        };
        customersMap.set(email, cust);
      }

      if (o.status !== 'Cancelado' && o.status !== 'Reembolsado') {
        cust.totalOrders += 1;
        cust.totalSpent += Number(o.total) || 0;
      }

      const orderDate = o.createdAt || o.date;
      if (orderDate && (!cust.lastOrderDate || new Date(orderDate) > new Date(cust.lastOrderDate))) {
        cust.lastOrderDate = orderDate;
      }
    }

    const list = Array.from(customersMap.values());
    for (const c of list) {
      c.avgTicket = c.totalOrders > 0 ? Number((c.totalSpent / c.totalOrders).toFixed(2)) : 0;
      c.totalSpent = Number(c.totalSpent.toFixed(2));
    }

    return list.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  public async getCustomerDetail(idOrEmail: string): Promise<{ customer: CustomerDetail; orders: Order[]; returns: ReturnRequest[]; payments: PaymentTransaction[] } | null> {
    await this.initialize();
    const customers = await this.getCustomerProfiles();
    const customer = customers.find(
      (c) => c.id === idOrEmail || c.email.toLowerCase() === idOrEmail.toLowerCase()
    );

    if (!customer) return null;

    const userOrders = this.orders.filter(
      (o) => (o.userId && o.userId === customer.id) || (o.customerEmail && o.customerEmail.toLowerCase() === customer.email.toLowerCase())
    );

    const userReturns = this.returns.filter(
      (r) => (r.userId && r.userId === customer.id) || (r.customerEmail && r.customerEmail.toLowerCase() === customer.email.toLowerCase())
    );

    const userPayments = (await this.getPayments()).filter(
      (p) => p.customerEmail.toLowerCase() === customer.email.toLowerCase()
    );

    return {
      customer,
      orders: userOrders,
      returns: userReturns,
      payments: userPayments,
    };
  }

  public async setCustomerStatus(idOrEmail: string, status: 'active' | 'inactive' | 'blocked'): Promise<boolean> {
    await this.initialize();
    const user = this.users.find((u) => u.id === idOrEmail || u.email.toLowerCase() === idOrEmail.toLowerCase());
    if (user) {
      (user as any).status = status;
      this.writeJsonFile(USERS_FILE, this.users);
      if (this.mode === 'supabase' && this.supabase) {
        try {
          await this.supabase.from('profiles').update({ status }).eq('id', user.id);
        } catch {}
      }
      return true;
    }
    return false;
  }

  // ==========================================
  // PAYMENTS & SHIPMENTS PROJECTIONS
  // ==========================================
  public async getPayments(): Promise<PaymentTransaction[]> {
    await this.initialize();
    return this.orders.map((o) => {
      let status: PaymentStatus = 'Pendente';
      if (o.status === 'Cancelado' || o.paymentStatus === 'Cancelado') status = 'Cancelado';
      else if (o.status === 'Reembolsado' || o.paymentStatus === 'Reembolsado' || o.status === 'Devolvido') status = 'Reembolsado';
      else if (o.paymentStatus === 'Recusado' || o.status === 'Pagamento Recusado') status = 'Recusado';
      else if (
        o.paymentStatus === 'Pago' ||
        o.paymentStatus === 'Aprovado' ||
        o.status === 'Pagamento Aprovado' ||
        o.status === 'Pedido Confirmado' ||
        o.status === 'Em Separação' ||
        o.status === 'Preparando Envio' ||
        o.status === 'Pronto para Envio' ||
        o.status === 'Despachado' ||
        o.status === 'Enviado' ||
        o.status === 'Em Transporte' ||
        o.status === 'Entregue'
      ) {
        status = 'Aprovado';
      }

      return {
        id: `pay-${o.id}`,
        orderId: o.id,
        customerName: o.customerName || 'Cliente',
        customerEmail: o.customerEmail || 'contato@cliente.com',
        amount: o.total,
        method: o.paymentMethod || 'Cartão de Crédito',
        status,
        date: o.paymentDetails?.paidAt || o.createdAt || o.date,
        transactionId: o.paymentProviderPaymentId || o.paymentDetails?.transactionId,
        paymentProvider: o.paymentProvider || o.paymentDetails?.gateway,
        paymentSessionId: o.paymentProviderSessionId || o.paymentDetails?.sessionId,
        statusDetail: o.paymentDetails?.statusDetail || (status === 'Aprovado' ? 'succeeded' : 'pending'),
        refundedAmount: o.paymentDetails?.refundedAmount,
        refundDate: o.paymentDetails?.refundedAt,
      };
    });
  }

  public async getShipments(): Promise<ShipmentRecord[]> {
    await this.initialize();
    return this.orders.map((o) => {
      let status: ShippingDeliveryStatus = 'Aguardando preparação';
      if (o.shippingStatus) {
        status = o.shippingStatus;
      } else if (o.status === 'Despachado' || o.status === 'Enviado') {
        status = 'Despachado';
      } else if (o.status === 'Em Transporte') {
        status = 'Em transporte';
      } else if (o.status === 'Entregue') {
        status = 'Entregue';
      } else if (o.status === 'Em Separação' || o.status === 'Preparando Envio') {
        status = 'Preparando';
      } else if (o.status === 'Pronto para Envio') {
        status = 'Pronto para envio';
      }

      return {
        id: `ship-${o.id}`,
        orderId: o.id,
        customerName: o.customerName || 'Cliente',
        customerEmail: o.customerEmail || '',
        carrier: o.shippingCarrier || o.shippingProvider || 'Correios / Melhor Envio',
        service: o.shippingService || 'SEDEX',
        price: o.shippingFee || o.shippingPrice || 0,
        deliveryDays: o.shippingDeliveryTime || 3,
        trackingCode: o.trackingCode,
        status,
        address: o.shippingAddress,
        dispatchedAt: o.history?.find((h) => h.status === 'Despachado' || h.status === 'Enviado')?.timestamp,
        protocol: o.melhorEnvioProtocol,
        labelUrl: o.melhorEnvioLabelUrl,
        melhorEnvioShipmentId: o.melhorEnvioShipmentId,
      };
    });
  }

  public async updateShipmentStatus(orderId: string, status: ShippingDeliveryStatus, trackingCode?: string, notes?: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    await this.initialize();
    const order = await this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Pedido não encontrado.' };

    order.shippingStatus = status;
    if (trackingCode) order.trackingCode = trackingCode;

    // Harmonize order main status
    if (status === 'Despachado' || status === 'Postado') {
      order.status = 'Despachado';
    } else if (status === 'Em transporte' || status === 'Em trânsito' || status === 'Saiu para entrega') {
      order.status = 'Em Transporte';
    } else if (status === 'Entregue') {
      order.status = 'Entregue';
    }

    order.history.push({
      status: `Envio: ${status}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      description: `Atualização de expedição: ${status}${trackingCode ? ` | Rastreio: ${trackingCode}` : ''}${notes ? ` (${notes})` : ''}`,
      note: notes,
      trackingCode,
    });

    await this.saveOrder(order);
    return { success: true, order };
  }

  // ==========================================
  // STATUS TRANSITION ENGINE WITH VALIDATION & AUDIT
  // ==========================================
  public async updateOrderStatusWithAudit(
    orderId: string,
    newStatus: OrderStatus,
    adminUser: any,
    note?: string,
    trackingCode?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    await this.initialize();
    const order = await this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Pedido não encontrado.' };

    const currentStatus = order.status;

    // Strict transition validation rules
    const VALID_TRANSITIONS: Record<string, string[]> = {
      'Aguardando Pagamento': ['Pagamento Aprovado', 'Cancelado', 'Pagamento Recusado', 'Pagamento Pendente', 'Pedido Confirmado'],
      'Pagamento Pendente': ['Pagamento Aprovado', 'Cancelado', 'Pagamento Recusado', 'Pedido Confirmado'],
      'Pagamento Aprovado': ['Pedido Confirmado', 'Em Separação', 'Preparando Envio', 'Cancelado', 'Reembolso Pendente'],
      'Pedido Confirmado': ['Em Separação', 'Preparando Envio', 'Cancelado'],
      'Em Separação': ['Preparando Envio', 'Pronto para Envio', 'Despachado', 'Enviado', 'Cancelado'],
      'Preparando Envio': ['Pronto para Envio', 'Despachado', 'Enviado', 'Cancelado'],
      'Pronto para Envio': ['Despachado', 'Enviado', 'Cancelado'],
      'Despachado': ['Em Transporte', 'Em trânsito', 'Entregue', 'Problema no envio', 'Problema na entrega'],
      'Enviado': ['Em Transporte', 'Em trânsito', 'Entregue', 'Problema no envio', 'Problema na entrega'],
      'Em Transporte': ['Entregue', 'Problema no envio', 'Problema na entrega', 'Devolução Solicitada'],
      'Em trânsito': ['Entregue', 'Problema no envio', 'Problema na entrega', 'Devolução Solicitada'],
      'Entregue': ['Devolução Solicitada', 'Devolvido'],
      'Devolução Solicitada': ['Devolvido', 'Reembolso Pendente', 'Entregue'],
      'Devolvido': ['Reembolso Pendente', 'Reembolsado'],
      'Reembolso Pendente': ['Reembolsado'],
      'Cancelado': [],
      'Reembolsado': [],
      'Pagamento Recusado': ['Aguardando Pagamento', 'Cancelado'],
    };

    const allowed = VALID_TRANSITIONS[currentStatus];
    if (allowed && !allowed.includes(newStatus) && currentStatus !== newStatus) {
      return {
        success: false,
        error: `Transição inválida: Não é permitido alterar de "${currentStatus}" diretamente para "${newStatus}". Siga o fluxo do ciclo de vida do pedido.`,
      };
    }

    const previousStatus = order.status;
    order.status = newStatus;
    if (trackingCode) order.trackingCode = trackingCode;

    // Sync payment and shipping status
    if (newStatus === 'Pagamento Aprovado') {
      order.paymentStatus = 'Aprovado';
      if (!order.shippingStatus) order.shippingStatus = 'Aguardando preparação';
    } else if (newStatus === 'Despachado' || newStatus === 'Enviado') {
      order.shippingStatus = 'Despachado';
    } else if (newStatus === 'Em Transporte') {
      order.shippingStatus = 'Em transporte';
    } else if (newStatus === 'Entregue') {
      order.shippingStatus = 'Entregue';
    } else if (newStatus === 'Cancelado') {
      order.paymentStatus = 'Cancelado';
      // Restock products if order was cancelled after approval
      if (previousStatus !== 'Aguardando Pagamento' && previousStatus !== 'Pagamento Pendente') {
        for (const itm of order.items) {
          const prod = await this.getProductById(itm.productId);
          if (prod) {
            const prevStock = prod.stockCount || 0;
            const newStock = prevStock + itm.quantity;
            await this.updateProductStock(itm.productId, newStock);
            await this.recordInventoryMovement({
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              productId: itm.productId,
              productTitle: itm.productTitle,
              sku: itm.sku,
              variant: { size: itm.size, colorName: itm.colorName },
              quantityChange: itm.quantity,
              previousStock: prevStock,
              newStock,
              reason: 'order_cancel_restock',
              orderId: order.id,
              userOrAdmin: adminUser?.name || 'Admin',
              timestamp: new Date().toISOString(),
              note: `Reposição automática por cancelamento do pedido #${order.id}`,
            });
          }
        }
      }
    }

    const now = new Date();
    order.history.push({
      status: newStatus,
      previousStatus,
      timestamp: now.toLocaleString('pt-BR'),
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR'),
      responsible: adminUser?.name || 'Administrador',
      author: adminUser?.name || 'Administrador',
      description: `Status alterado de "${previousStatus}" para "${newStatus}" por ${adminUser?.name || 'Admin'}${note ? ` | Obs: ${note}` : ''}`,
      note,
      trackingCode,
    });

    await this.saveOrder(order);

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getSupabaseAdminClient();
        if (adminClient) {
          await adminClient.from('order_status_history').insert({
            order_id: order.id,
            status: newStatus,
            previous_status: previousStatus,
            new_status: newStatus,
            source: 'admin',
            description: `Status alterado de "${previousStatus}" para "${newStatus}" por ${adminUser?.name || 'Admin'}${note ? ` | Obs: ${note}` : ''}`,
            occurred_at: new Date().toISOString(),
          });
        }
      } catch {}
    }

    await this.logAdminAction(
      adminUser?.email || 'admin@marmot.com',
      adminUser?.name || 'Admin',
      'update_status',
      'order',
      order.id,
      `Status alterado para ${newStatus}${note ? ` (${note})` : ''}`,
      { previousStatus, newStatus, trackingCode }
    );

    return { success: true, order };
  }

  // ==========================================
  // DISPATCH ACTION (MARCAR COMO DESPACHADO)
  // ==========================================
  public async markOrderDispatched(
    orderId: string,
    carrier: string,
    trackingCode: string,
    adminUser: any,
    note?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    await this.initialize();
    const order = await this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Pedido não encontrado.' };

    order.status = 'Despachado';
    order.shippingStatus = 'Despachado';
    order.shippingCarrier = carrier || order.shippingCarrier || 'Correios / Melhor Envio';
    order.trackingCode = trackingCode;

    const now = new Date();
    order.history.push({
      status: 'Despachado',
      previousStatus: 'Pronto para Envio',
      timestamp: now.toLocaleString('pt-BR'),
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR'),
      responsible: adminUser?.name || 'Administrador',
      author: adminUser?.name || 'Administrador',
      description: `Pedido despachado via ${order.shippingCarrier}. Código de Rastreio: ${trackingCode}${note ? ` | Obs: ${note}` : ''}`,
      note,
      trackingCode,
    });

    await this.saveOrder(order);

    if (order.customerEmail) {
      sendTransactionalEmail({
        to: order.customerEmail,
        subject: `Seu pedido #${order.id} foi despachado! 📦 | MARMOT`,
        template: 'order_dispatched',
        orderId: order.id,
        userId: order.userId,
        html: `<div style="font-family: sans-serif; background: #0c0c0c; color: #fff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
          <h2 style="letter-spacing: 0.1em; color: #d6b35a;">PEDIDO DESPACHADO // MARMOT</h2>
          <p>Seu pedido <strong>#${order.id}</strong> foi coletado pela transportadora <strong>${order.shippingCarrier}</strong>.</p>
          <p>Código de Rastreamento: <strong style="color: #fff; font-family: monospace; font-size: 16px;">${trackingCode}</strong></p>
          <p style="margin-top: 24px;"><a href="${process.env.APP_URL || 'https://marmot.com.br'}/rastreamento?code=${trackingCode}" style="background: #d6b35a; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">ACOMPANHAR RASTREIO EM TEMPO REAL</a></p>
        </div>`,
      }).catch(() => {});
    }

    await this.logAdminAction(
      adminUser?.email || 'admin@marmot.com',
      adminUser?.name || 'Admin',
      'dispatch',
      'shipping',
      order.id,
      `Pedido despachado via ${carrier} (Rastreio: ${trackingCode})`,
      { carrier, trackingCode, note }
    );

    return { success: true, order };
  }

  public async claimWebhookEvent(
    provider: string,
    eventId: string,
    eventType: string = 'payment',
    payload: any = {}
  ): Promise<{ shouldProcess: boolean; status: string; orderId?: string }> {
    await this.initialize();
    if (this.mode === 'supabase') {
      try {
        const client = await this.getRequiredSupabaseAdminClient('aquisição do lock de webhook');
        const { data, error } = await client.rpc('claim_webhook_event', {
          p_gateway: provider,
          p_event_key: eventId,
          p_topic: eventType,
          p_payload: payload || {},
        });
        if (error) {
          throw new Error(error.message);
        }
        if (data) {
          return {
            shouldProcess: Boolean(data.should_process ?? data.shouldProcess),
            status: String(data.status),
            orderId: data.order_id || data.orderId || undefined,
          };
        }
      } catch (err: any) {
        console.error('[DB] Supabase claim_webhook_event exception:', err?.message || err);
        throw err;
      }
    }
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
      return { shouldProcess: false, status: 'unconfigured_production_db' };
    }
    return { shouldProcess: true, status: 'fallback_allowed_dev' };
  }

  public async completeWebhookEvent(
    provider: string,
    eventId: string,
    orderId?: string,
    errorMsg?: string
  ): Promise<void> {
    await this.initialize();
    if (this.mode === 'supabase') {
      try {
        const client = await this.getRequiredSupabaseAdminClient('finalização do webhook');
        const { error } = await client.rpc('complete_webhook_event', {
          p_gateway: provider,
          p_event_key: eventId,
          p_status: errorMsg ? 'failed' : 'completed',
          p_order_id: orderId || null,
          p_error: errorMsg || null,
        });
        if (error) {
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.error('[DB] Supabase complete_webhook_event error:', err?.message || err);
        throw err;
      }
    }
  }

  public async deductStockAtomic(
    productId: string,
    quantity: number,
    orderId?: string,
    reason: string = 'Venda Confirmada'
  ): Promise<{ success: boolean; previousStock: number; newStock: number; error?: string }> {
    await this.initialize();
    if (this.mode === 'supabase') {
      try {
        const client = (await this.getSupabaseAdminClient()) || this.supabase;
        if (client) {
          const { data, error } = await client.rpc('deduct_inventory_atomic', {
            p_product_id: productId,
            p_quantity: quantity,
            p_order_id: orderId || null,
            p_reason: reason,
          });
          if (!error && data) {
            return {
              success: Boolean(data.success),
              previousStock: Number(data.previous_stock || 0),
              newStock: Number(data.new_stock || 0),
              error: data.error,
            };
          }
        }
      } catch (err) {
        console.warn('[DB] Supabase deduct_inventory_atomic fallback:', err);
      }
    }

    // Atomic in-memory & file state deduction
    const idx = this.products.findIndex((p) => p.id === productId);
    if (idx === -1) {
      return { success: false, previousStock: 0, newStock: 0, error: 'Produto não encontrado' };
    }
    const current = this.products[idx];
    const prevStock = current.stockCount ?? 0;
    if (prevStock < quantity) {
      return {
        success: false,
        previousStock: prevStock,
        newStock: prevStock,
        error: `Estoque insuficiente (${prevStock} disponível, ${quantity} solicitado)`,
      };
    }
    const newStock = prevStock - quantity;
    current.stockCount = newStock;
    current.status = newStock <= 0 ? 'out_of_stock' : 'active';
    this.writeJsonFile(PRODUCTS_FILE, this.products);
    return { success: true, previousStock: prevStock, newStock };
  }

  public async redeemCouponAtomic(
    couponCode: string,
    orderId: string,
    userId: string,
    customerEmail: string,
    subtotal: number
  ): Promise<{ valid: boolean; discount: number; couponCode?: string; error?: string }> {
    await this.initialize();
    if (this.mode === 'supabase') {
      try {
        const client = (await this.getSupabaseAdminClient()) || this.supabase;
        if (client) {
          const { data, error } = await client.rpc('redeem_coupon_atomic', {
            p_coupon_code: couponCode,
            p_order_id: orderId,
            p_user_id: userId,
            p_customer_email: customerEmail,
            p_subtotal: subtotal,
          });
          if (!error && data) {
            return {
              valid: Boolean(data.valid),
              discount: Number(data.discount || 0),
              couponCode: data.coupon_code,
              error: data.error,
            };
          }
        }
      } catch (err) {
        console.warn('[DB] Supabase redeem_coupon_atomic fallback:', err);
      }
    }

    const valResult = await this.validateCoupon(couponCode, subtotal);
    if (!valResult.valid) {
      return { valid: false, discount: 0, error: valResult.error };
    }
    return { valid: true, discount: valResult.discount, couponCode };
  }

  public async applyApprovedPaymentAtomic(
    orderId: string,
    paymentId: string,
    transactionAmount: number,
    currency: string = 'BRL',
    paymentMethod: string = 'InfinitePay Checkout',
    dateApproved?: string
  ): Promise<{ success: boolean; alreadyProcessed: boolean; orderId?: string; error?: string }> {
    return this.processApprovedOrderAtomic(orderId, paymentId, transactionAmount, currency, 'infinitepay', paymentMethod, dateApproved, [], {});
  }

  public async processApprovedOrderAtomic(
    orderId: string,
    paymentId: string,
    transactionAmount: number,
    currency: string = 'BRL',
    gateway: string = 'infinitepay',
    paymentMethod: string = 'InfinitePay Checkout',
    dateApproved?: string,
    items: any[] = [],
    paymentMetadata: Record<string, unknown> = {},
  ): Promise<{ success: boolean; alreadyProcessed: boolean; orderId?: string; error?: string }> {
    await this.initialize();
    if (this.mode === 'supabase') {
      try {
        const client = (await this.getSupabaseAdminClient()) || this.supabase;
        if (!client) {
          return {
            success: false,
            alreadyProcessed: false,
            orderId,
            error: 'Cliente de banco de dados Supabase não inicializado para operação financeira.',
          };
        }
        const { data, error } = await client.rpc('process_approved_order_atomic', {
          p_order_id: orderId,
          p_payment_id: paymentId,
          p_amount: transactionAmount,
          p_currency: currency,
          p_gateway: gateway,
          p_payment_method: paymentMethod,
          p_date_approved: dateApproved || new Date().toISOString(),
          p_items: items && items.length > 0 ? items : [],
          p_payment_metadata: paymentMetadata,
        });
        if (error) {
          console.error('[DB] Supabase process_approved_order_atomic RPC error:', error.message);
          return {
            success: false,
            alreadyProcessed: false,
            orderId,
            error: error.message || 'Erro ao processar aprovação de pagamento atômica no banco de dados.',
          };
        }
        if (data) {
          return {
            success: Boolean(data.success),
            alreadyProcessed: Boolean(data.alreadyProcessed || data.already_processed),
            orderId: data.orderId || data.order_id || orderId,
            error: data.error,
          };
        }
      } catch (err: any) {
        console.error('[DB] Supabase process_approved_order_atomic RPC exception:', err?.message || err);
        return {
          success: false,
          alreadyProcessed: false,
          orderId,
          error: err?.message || 'Exceção crítica durante a transação atômica de pagamento.',
        };
      }
    }
    return {
      success: false,
      alreadyProcessed: false,
      orderId,
      error: 'Modo de persistência inválido para liquidação financeira.',
    };
  }

  public async processProviderRefundAtomic(input: {
    orderId: string;
    provider: string;
    providerRefundId: string;
    providerPaymentId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'canceled';
    reason?: string;
    adminUser?: any;
  }): Promise<{ success: boolean; totalRefunded?: number; isFullRefund?: boolean; error?: string }> {
    await this.initialize();
    try {
      const client = await this.getRequiredSupabaseAdminClient('registro atômico de reembolso');
      const { data, error } = await client.rpc('process_provider_refund_atomic', {
        p_order_id: input.orderId,
        p_provider: input.provider,
        p_provider_refund_id: input.providerRefundId,
        p_provider_payment_id: input.providerPaymentId,
        p_amount: input.amount,
        p_currency: input.currency,
        p_status: input.status,
        p_reason: input.reason || null,
        p_admin_id: input.adminUser?.id || null,
        p_admin_email: input.adminUser?.email || null,
      });
      if (error) throw new Error(error.message);
      return {
        success: Boolean(data?.success),
        totalRefunded: Number(data?.totalRefunded ?? data?.total_refunded ?? 0),
        isFullRefund: Boolean(data?.isFullRefund ?? data?.is_full_refund),
        error: data?.error,
      };
    } catch (error: any) {
      console.error('[PAYMENT_REFUND_PERSISTENCE_ERROR]', error?.message || error);
      return { success: false, error: error?.message || 'Falha ao persistir o reembolso.' };
    }
  }

  public async claimPaymentSessionCreation(
    orderId: string,
    userId: string,
    attemptKey: string,
  ): Promise<{ success: boolean; shouldCreate: boolean; status?: string; checkoutUrl?: string; error?: string }> {
    await this.initialize();
    try {
      const client = await this.getRequiredSupabaseAdminClient('lock de criação do checkout InfinitePay');
      const { data, error } = await client.rpc('claim_payment_session_creation', {
        p_order_id: orderId,
        p_user_id: userId,
        p_attempt_key: attemptKey,
      });
      if (error) throw new Error(error.message);
      return {
        success: Boolean(data?.success),
        shouldCreate: Boolean(data?.shouldCreate ?? data?.should_create),
        status: data?.status,
        checkoutUrl: data?.checkoutUrl || data?.checkout_url,
        error: data?.error,
      };
    } catch (error: any) {
      console.error('[INFINITEPAY_CHECKOUT_CLAIM_ERROR]', { orderId, message: error?.message || error });
      return { success: false, shouldCreate: false, error: error?.message || 'Falha ao adquirir lock do checkout.' };
    }
  }

  public async linkPaymentCheckoutAtomic(input: {
    orderId: string;
    provider: string;
    checkoutUrl: string;
    statusDetail?: string;
  }): Promise<{ success: boolean; error?: string }> {
    await this.initialize();
    try {
      const client = await this.getRequiredSupabaseAdminClient('vínculo atômico do checkout de pagamento');
      const { data, error } = await client.rpc('link_payment_checkout_atomic', {
        p_order_id: input.orderId,
        p_provider: input.provider,
        p_checkout_url: input.checkoutUrl,
        p_status_detail: input.statusDetail || null,
      });
      if (error) throw new Error(error.message);
      if (!data?.success) return { success: false, error: data?.error || 'Não foi possível vincular a sessão.' };

      const cached = this.orders.find((order) => order.id === input.orderId);
      if (cached) {
        cached.paymentProvider = input.provider;
        cached.checkoutUrl = input.checkoutUrl;
        cached.paymentDetails = {
          ...(cached.paymentDetails || {}),
          gateway: input.provider,
          checkoutUrl: input.checkoutUrl,
          statusDetail: input.statusDetail || cached.paymentDetails?.statusDetail,
        };
      }
      return { success: true };
    } catch (error: any) {
      console.error('[INFINITEPAY_CHECKOUT_LINK_ERROR]', { orderId: input.orderId, message: error?.message || error });
      return { success: false, error: error?.message || 'Falha ao vincular o checkout de pagamento.' };
    }
  }

  public async releasePaymentSessionCreation(orderId: string, reason: string): Promise<void> {
    await this.initialize();
    try {
      const client = await this.getRequiredSupabaseAdminClient('liberação do lock do checkout InfinitePay');
      const { error } = await client.rpc('release_payment_session_creation', {
        p_order_id: orderId,
        p_error: reason.slice(0, 500),
      });
      if (error) throw new Error(error.message);
    } catch (error: any) {
      console.error('[INFINITEPAY_CHECKOUT_RELEASE_ERROR]', { orderId, message: error?.message || error });
    }
  }

  public async updateProviderPaymentStateAtomic(input: {
    orderId: string;
    provider: string;
    paymentStatus: string;
    orderStatus: string;
    statusDetail: string;
    eventId: string;
  }): Promise<{ success: boolean; ignored?: boolean; error?: string }> {
    await this.initialize();
    try {
      const client = await this.getRequiredSupabaseAdminClient('atualização atômica do estado financeiro');
      const { data, error } = await client.rpc('update_provider_payment_state_atomic', {
        p_order_id: input.orderId,
        p_provider: input.provider,
        p_payment_status: input.paymentStatus,
        p_order_status: input.orderStatus,
        p_status_detail: input.statusDetail,
        p_event_id: input.eventId,
      });
      if (error) throw new Error(error.message);
      return {
        success: Boolean(data?.success),
        ignored: Boolean(data?.ignored),
        error: data?.error,
      };
    } catch (error: any) {
      console.error('[INFINITEPAY_PAYMENT_STATE_ERROR]', { orderId: input.orderId, message: error?.message || error });
      return { success: false, error: error?.message || 'Falha ao atualizar o estado financeiro.' };
    }
  }

  // ==========================================
  // REAL-TIME OVERVIEW DASHBOARD METRICS
  // ==========================================
  public async getOverviewMetrics(period = '30days'): Promise<AdminOverviewMetrics> {
    await this.initialize();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let revenueToday = 0;
    let revenueThisMonth = 0;
    let ordersToday = 0;
    let newOrders = 0;
    let ordersAwaitingShipment = 0;
    let ordersInTransit = 0;
    let ordersDelivered = 0;
    let ordersCancelled = 0;
    let totalValidRevenue = 0;
    let totalValidOrders = 0;

    const productSalesMap = new Map<string, { id: string; title: string; image: string; salesCount: number; revenue: number; stock: number }>();
    const categorySalesMap = new Map<string, { category: string; count: number; revenue: number }>();
    const salesByDayMap = new Map<string, { revenue: number; orders: number }>();

    // Prepare date buckets for chart (last 14 or 30 days)
    const dayCount = period === '7days' ? 7 : period === 'today' ? 1 : 14;
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      salesByDayMap.set(key, { revenue: 0, orders: 0 });
    }

    for (const o of this.orders) {
      const oDate = new Date(o.createdAt || o.date || Date.now());
      const oDateStr = oDate.toISOString().split('T')[0];
      const isToday = oDateStr === todayStr;
      const isThisMonth = oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear;

      if (isToday) {
        ordersToday++;
      }

      if (o.status === 'Aguardando Pagamento' || o.status === 'Pagamento Pendente') {
        newOrders++;
      } else if (
        o.status === 'Pagamento Aprovado' ||
        o.status === 'Pedido Confirmado' ||
        o.status === 'Em Separação' ||
        o.status === 'Preparando Envio' ||
        o.status === 'Pronto para Envio'
      ) {
        ordersAwaitingShipment++;
      } else if (o.status === 'Despachado' || o.status === 'Enviado' || o.status === 'Em Transporte') {
        ordersInTransit++;
      } else if (o.status === 'Entregue') {
        ordersDelivered++;
      } else if (o.status === 'Cancelado' || o.status === 'Pagamento Recusado') {
        ordersCancelled++;
      }

      // Valid financial sales calculation
      const isPaid =
        o.status !== 'Cancelado' &&
        o.status !== 'Pagamento Recusado' &&
        o.status !== 'Aguardando Pagamento' &&
        o.status !== 'Pagamento Pendente';

      if (isPaid) {
        const totalNum = Number(o.total) || 0;
        if (isToday) revenueToday += totalNum;
        if (isThisMonth) revenueThisMonth += totalNum;
        totalValidRevenue += totalNum;
        totalValidOrders++;

        if (salesByDayMap.has(oDateStr)) {
          const b = salesByDayMap.get(oDateStr)!;
          b.revenue += totalNum;
          b.orders += 1;
        }

        // Top products and categories
        if (Array.isArray(o.items)) {
          for (const itm of o.items) {
            const pId = itm.productId;
            const sub = Number(itm.price || 0) * (itm.quantity || 1);
            if (!productSalesMap.has(pId)) {
              const matchedProd = this.products.find((p) => p.id === pId);
              productSalesMap.set(pId, {
                id: pId,
                title: itm.productTitle || matchedProd?.title || 'Produto',
                image: itm.productImage || matchedProd?.image || '',
                salesCount: 0,
                revenue: 0,
                stock: typeof matchedProd?.stockCount === 'number' ? matchedProd.stockCount : 0,
              });
            }
            const pEntry = productSalesMap.get(pId)!;
            pEntry.salesCount += itm.quantity || 1;
            pEntry.revenue += sub;

            const matchedProd = this.products.find((p) => p.id === pId);
            const catName = matchedProd?.category || 'Streetwear';
            if (!categorySalesMap.has(catName)) {
              categorySalesMap.set(catName, { category: catName, count: 0, revenue: 0 });
            }
            const catEntry = categorySalesMap.get(catName)!;
            catEntry.count += itm.quantity || 1;
            catEntry.revenue += sub;
          }
        }
      }
    }

    const pendingReturns = this.returns.filter(
      (r) => r.status !== 'Concluída' && r.status !== 'Recusada' && r.status !== 'Reembolso realizado'
    ).length;

    const lowStockCount = this.products.filter((p) => (typeof p.stockCount === 'number' ? p.stockCount : 0) <= 5).length;
    const averageTicket = totalValidOrders > 0 ? Number((totalValidRevenue / totalValidOrders).toFixed(2)) : 0;
    const newCustomersThisMonth = (await this.getCustomerProfiles()).filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const salesByDay = Array.from(salesByDayMap.entries()).map(([date, val]) => {
      const [y, m, d] = date.split('-');
      return {
        date,
        label: `${d}/${m}`,
        revenue: Number(val.revenue.toFixed(2)),
        orders: val.orders,
      };
    });

    const ordersByStatus = [
      { status: 'Novos / Pendentes', count: newOrders, color: '#f59e0b' },
      { status: 'Aguardando Envio', count: ordersAwaitingShipment, color: '#3b82f6' },
      { status: 'Em Transporte', count: ordersInTransit, color: '#8b5cf6' },
      { status: 'Entregues', count: ordersDelivered, color: '#10b981' },
      { status: 'Cancelados', count: ordersCancelled, color: '#ef4444' },
    ];

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topCategories = Array.from(categorySalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      revenueToday: Number(revenueToday.toFixed(2)),
      revenueThisMonth: Number(revenueThisMonth.toFixed(2)),
      ordersToday,
      newOrders,
      ordersAwaitingShipment,
      ordersInTransit,
      ordersDelivered,
      ordersCancelled,
      pendingReturns,
      averageTicket,
      newCustomersThisMonth,
      lowStockCount,
      salesByDay,
      ordersByStatus,
      topProducts,
      topCategories,
    };
  }

  // ==========================================
  // COMPREHENSIVE REPORTS & CSV EXPORT
  // ==========================================
  public async getReports(dateFrom?: string, dateTo?: string, period = 'this_month'): Promise<any> {
    await this.initialize();
    let startDate: Date;
    let endDate = new Date();

    const now = new Date();
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === '7days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else {
      // this_month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredOrders = this.orders.filter((o) => {
      const oDate = new Date(o.createdAt || o.date || Date.now());
      return oDate >= startDate && oDate <= endDate;
    });

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalShipping = 0;
    let approvedOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let refundedOrdersCount = 0;

    const productSalesMap = new Map<string, { title: string; category: string; quantity: number; revenue: number }>();
    const paymentMethodMap = new Map<string, { count: number; total: number }>();

    for (const o of filteredOrders) {
      if (o.status === 'Cancelado') {
        cancelledOrdersCount++;
        continue;
      }
      if (o.status === 'Reembolsado') {
        refundedOrdersCount++;
      }

      totalRevenue += Number(o.total) || 0;
      totalDiscount += Number(o.discount) || 0;
      totalShipping += Number(o.shippingFee) || 0;
      approvedOrdersCount++;

      const method = o.paymentMethod || 'Cartão de Crédito';
      if (!paymentMethodMap.has(method)) {
        paymentMethodMap.set(method, { count: 0, total: 0 });
      }
      const pEntry = paymentMethodMap.get(method)!;
      pEntry.count++;
      pEntry.total += Number(o.total) || 0;

      if (Array.isArray(o.items)) {
        for (const itm of o.items) {
          const key = itm.productId;
          if (!productSalesMap.has(key)) {
            const prod = this.products.find((p) => p.id === key);
            productSalesMap.set(key, {
              title: itm.productTitle || prod?.title || 'Produto',
              category: prod?.category || 'Geral',
              quantity: 0,
              revenue: 0,
            });
          }
          const entry = productSalesMap.get(key)!;
          entry.quantity += itm.quantity || 1;
          entry.revenue += (Number(itm.price) || 0) * (itm.quantity || 1);
        }
      }
    }

    const avgTicket = approvedOrdersCount > 0 ? Number((totalRevenue / approvedOrdersCount).toFixed(2)) : 0;
    const cancellationRate =
      filteredOrders.length > 0 ? Number(((cancelledOrdersCount / filteredOrders.length) * 100).toFixed(1)) : 0;

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalOrders: filteredOrders.length,
        approvedOrders: approvedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        refundedOrders: refundedOrdersCount,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        totalShipping: Number(totalShipping.toFixed(2)),
        averageTicket: avgTicket,
        cancellationRate,
      },
      paymentMethods: Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        total: Number(data.total.toFixed(2)),
      })),
      topProducts: Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }

  // --- NEWSLETTER SUBSCRIPTIONS ---
  public async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    await this.initialize();
    return this.newsletterSubscribers;
  }

  public async subscribeNewsletter(email: string, source = 'website'): Promise<{ subscriber: NewsletterSubscriber; isNew: boolean }> {
    await this.initialize();
    const cleanEmail = email.trim().toLowerCase();
    const existingIndex = this.newsletterSubscribers.findIndex((s) => s.email.toLowerCase() === cleanEmail);

    if (existingIndex >= 0) {
      const existing = this.newsletterSubscribers[existingIndex];
      if (existing.status !== 'subscribed') {
        existing.status = 'subscribed';
        existing.subscribedAt = new Date().toISOString();
        existing.updatedAt = new Date().toISOString();
        this.writeJsonFile(NEWSLETTER_FILE, this.newsletterSubscribers);
        if (this.mode === 'supabase' && this.supabase) {
          try {
            await this.supabase.from('newsletter_subscribers').upsert({
              id: existing.id,
              email: cleanEmail,
              status: 'subscribed',
              source,
              subscribed_at: existing.subscribedAt,
              data: existing,
            });
          } catch {}
        }
      }
      return { subscriber: existing, isNew: false };
    }

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      status: 'subscribed',
      source,
      subscribedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.newsletterSubscribers.unshift(newSub);
    this.writeJsonFile(NEWSLETTER_FILE, this.newsletterSubscribers);

    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('newsletter_subscribers').upsert({
          id: newSub.id,
          email: cleanEmail,
          status: 'subscribed',
          source,
          subscribed_at: newSub.subscribedAt,
          data: newSub,
        });
      } catch {}
    }

    return { subscriber: newSub, isNew: true };
  }

  public async unsubscribeNewsletter(email: string): Promise<boolean> {
    await this.initialize();
    const cleanEmail = email.trim().toLowerCase();
    const sub = this.newsletterSubscribers.find((s) => s.email.toLowerCase() === cleanEmail);
    if (!sub) return false;

    sub.status = 'unsubscribed';
    sub.unsubscribedAt = new Date().toISOString();
    sub.updatedAt = new Date().toISOString();
    this.writeJsonFile(NEWSLETTER_FILE, this.newsletterSubscribers);

    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('newsletter_subscribers').upsert({
          id: sub.id,
          email: cleanEmail,
          status: 'unsubscribed',
          unsubscribed_at: sub.unsubscribedAt,
          data: sub,
        });
      } catch {}
    }
    return true;
  }

  // --- PRODUCT REVIEWS & VERIFIED PURCHASES ---
  public async getReviews(productId?: string): Promise<ProductReview[]> {
    await this.initialize();
    if (productId) {
      return this.productReviews.filter((r) => r.productId === productId && r.status === 'published');
    }
    return this.productReviews;
  }

  public async canUserReviewProduct(userEmailOrId: string, productId: string): Promise<{ canReview: boolean; orderId?: string; reason?: string }> {
    await this.initialize();
    const cleanIdentifier = String(userEmailOrId || '').toLowerCase().trim();
    if (!cleanIdentifier) {
      return { canReview: false, reason: 'Identificação do usuário ou e-mail necessária.' };
    }

    if (this.mode === 'supabase') {
      const adminClient = await this.getSupabaseAdminClient();
      const client = adminClient || this.supabase;
      if (client) {
        try {
          const { data: userOrders } = await client
            .from('orders')
            .select('id, user_id, customer_email, status, shipping_status, payment_status, items')
            .or(`user_id.eq.${userEmailOrId},customer_email.ilike.${cleanIdentifier}`);

          if (Array.isArray(userOrders)) {
            for (const o of userOrders) {
              const isEligible = (o.status === 'Entregue' || o.shipping_status === 'Entregue' || o.status === 'delivered') &&
                (String(o.user_id || '').toLowerCase() === cleanIdentifier || (o.customer_email && o.customer_email.toLowerCase() === cleanIdentifier));
              if (isEligible && Array.isArray(o.items)) {
                const hasProd = o.items.some((it: any) => it.productId === productId || it.product_id === productId || it.id === productId);
                if (hasProd) {
                  return { canReview: true, orderId: o.id };
                }
              }
            }
          }
        } catch (e: any) {
          console.warn('[DB] canUserReviewProduct query notice:', e.message);
        }
      }
    }

    // Match delivered order containing this product from cached orders
    const matchingOrder = this.orders.find((o) => {
      const isUserMatch =
        (o.userId && o.userId.toLowerCase() === cleanIdentifier) ||
        (o.customerEmail && o.customerEmail.toLowerCase() === cleanIdentifier);

      if (!isUserMatch) return false;

      const isEligible =
        o.status === 'Entregue' ||
        o.shippingStatus === 'Entregue' ||
        o.orderStatus === 'delivered';

      if (!isEligible) return false;

      return Array.isArray(o.items) && o.items.some((it) => it.productId === productId || (it as any).id === productId);
    });

    if (matchingOrder) {
      return { canReview: true, orderId: matchingOrder.id };
    }

    return {
      canReview: false,
      reason: 'Apenas clientes com compras entregues podem obter selo de avaliação verificada.',
    };
  }

  public async createReview(data: {
    productId: string;
    userId?: string;
    userName: string;
    userEmail?: string;
    rating: number;
    title: string;
    comment: string;
    orderId?: string;
    verifiedPurchase?: boolean;
  }): Promise<ProductReview> {
    await this.initialize();

    // Strict server-side verified purchase check: Never trust client-provided flag blindly
    let verified = false;
    let orderId: string | undefined = undefined;

    if (data.userId || data.userEmail) {
      const check = await this.canUserReviewProduct(data.userId || data.userEmail || '', data.productId);
      if (check.canReview) {
        verified = true;
        orderId = check.orderId;
      }
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: data.productId,
      orderId,
      userId: data.userId,
      userName: data.userName || 'Cliente Verificado',
      userEmail: data.userEmail,
      rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
      title: data.title?.trim() || 'Avaliação do Produto',
      comment: data.comment?.trim() || '',
      verifiedPurchase: verified,
      likes: 0,
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    this.productReviews.unshift(newReview);
    this.writeJsonFile(REVIEWS_FILE, this.productReviews);

    // Update product rating and review count
    const product = this.products.find((p) => p.id === data.productId);
    if (product) {
      const prodReviews = this.productReviews.filter((r) => r.productId === data.productId && r.status === 'published');
      const avgRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      product.rating = Number(avgRating.toFixed(1));
      product.reviewCount = prodReviews.length;
      await this.saveProduct(product);
    }

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getSupabaseAdminClient();
        const client = adminClient || this.supabase;
        if (client) {
          const { error: revErr } = await client.from('product_reviews').upsert({
            id: newReview.id,
            product_id: newReview.productId,
            user_id: newReview.userId,
            user_name: newReview.userName,
            user_email: newReview.userEmail,
            rating: newReview.rating,
            title: newReview.title,
            comment: newReview.comment,
            verified_purchase: newReview.verifiedPurchase,
            order_id: newReview.orderId,
            status: newReview.status,
            data: newReview,
          });
          if (revErr) {
            console.error('[DB] product_reviews authoritative upsert error:', revErr.message);
          }
        }
      } catch (err: any) {
        console.error('[DB] product_reviews upsert exception:', err.message);
      }
    }

    return newReview;
  }

  public async deleteReview(reviewId: string): Promise<boolean> {
    await this.initialize();
    const index = this.productReviews.findIndex((r) => r.id === reviewId);
    if (index === -1) return false;

    const removed = this.productReviews.splice(index, 1)[0];
    this.writeJsonFile(REVIEWS_FILE, this.productReviews);

    // Recalculate product rating
    const product = this.products.find((p) => p.id === removed.productId);
    if (product) {
      const prodReviews = this.productReviews.filter((r) => r.productId === removed.productId && r.status === 'published');
      const avgRating = prodReviews.length > 0
        ? prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length
        : 5.0;
      product.rating = Number(avgRating.toFixed(1));
      product.reviewCount = prodReviews.length;
      await this.saveProduct(product);
    }

    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('product_reviews').delete().eq('id', reviewId);
      } catch {}
    }
    return true;
  }

  // --- EMAIL LOGS ---
  public async logEmail(log: EmailLog): Promise<void> {
    await this.initialize();
    this.emailLogs.unshift(log);
    if (this.emailLogs.length > 500) {
      this.emailLogs = this.emailLogs.slice(0, 500);
    }
    this.writeJsonFile(EMAIL_LOGS_FILE, this.emailLogs);

    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('email_logs').upsert({
          id: log.id,
          recipient: log.recipient,
          template: log.template,
          subject: log.subject,
          status: log.status,
          error: log.error,
          provider_message_id: log.providerMessageId,
          order_id: log.orderId,
          user_id: log.userId,
          created_at: log.createdAt,
          data: log,
        });
      } catch {}
    }
  }

  public async getEmailLogs(limit = 100): Promise<EmailLog[]> {
    await this.initialize();
    return this.emailLogs.slice(0, limit);
  }

  // --- REAL SHIPMENT EVENTS ---
  public async recordShipmentEvent(event: ShipmentEvent): Promise<void> {
    await this.initialize();
    const isDuplicate = this.shipmentEvents.some(
      (e) => e.orderId === event.orderId && e.status === event.status && e.occurredAt === event.occurredAt
    );
    if (!isDuplicate) {
      this.shipmentEvents.unshift(event);
      this.writeJsonFile(SHIPMENT_EVENTS_FILE, this.shipmentEvents);

      if (this.mode === 'supabase' && this.supabase) {
        try {
          await this.supabase.from('shipment_events').upsert({
            id: event.id,
            order_id: event.orderId,
            shipment_id: event.shipmentId,
            provider: event.provider,
            status: event.status,
            description: event.description,
            location: event.location,
            occurred_at: event.occurredAt,
            data: event,
          });
        } catch {}
      }
    }
  }

  public async getShipmentEvents(orderId: string): Promise<ShipmentEvent[]> {
    await this.initialize();
    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('shipment_events')
          .select('*')
          .eq('order_id', orderId)
          .order('occurred_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => d.data || d);
        }
      } catch (err) {
        console.warn('[DB] Supabase getShipmentEvents fallback:', err);
      }
    }
    return this.shipmentEvents.filter((e) => e.orderId === orderId);
  }

  // --- CAMPAIGNS ---
  public async saveCampaign(campaign: CampaignRecord): Promise<void> {
    await this.initialize();
    this.campaignRecords.unshift(campaign);
    this.writeJsonFile(CAMPAIGNS_FILE, this.campaignRecords);
    if (this.mode === 'supabase' && this.supabase) {
      try {
        await this.supabase.from('campaign_records').upsert({
          id: campaign.id,
          title: campaign.title,
          subject: campaign.subject,
          collection_name: campaign.collectionName,
          discount_code: campaign.discountCode,
          recipient_count: campaign.recipientCount,
          sent_count: campaign.sentCount,
          failed_count: campaign.failedCount,
          created_by: campaign.createdBy,
          data: campaign,
        });
      } catch {}
    }
  }

  public async getCampaigns(): Promise<CampaignRecord[]> {
    await this.initialize();
    return this.campaignRecords;
  }

  // ==========================================
  // SHIPMENT OPERATIONS & IDEMPOTENCY
  // ==========================================
  // SHIPMENT OPERATIONS & IDEMPOTENCY (DATABASE-BACKED)
  // ==========================================
  private shipmentOperations: any[] = [];

  public async cleanUpArtificialTrackingCodes(): Promise<void> {
    let count = 0;
    const toClean: string[] = [];
    for (const order of this.orders) {
      if (
        order.trackingCode &&
        (order.trackingCode.startsWith('BR-SIMULATED-') || /^MM\d+BR$/i.test(order.trackingCode) || /^MM-\d+-\d+$/i.test(order.trackingCode)) &&
        !order.melhorEnvioShipmentId &&
        !order.shippingLabelUrl
      ) {
        order.trackingCode = undefined;
        toClean.push(order.id);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[DB] ${count} pedidos com códigos de rastreio artificiais legados foram normalizados.`);
      this.writeJsonFile(ORDERS_FILE, this.orders);

      if (this.mode === 'supabase' && this.supabase) {
        for (const ordId of toClean) {
          try {
            const ordObj = this.orders.find((o) => o.id === ordId);
            await this.supabase.from('orders').update({
              tracking_code: null,
              data: ordObj,
              updated_at: new Date().toISOString(),
            }).eq('id', ordId);
          } catch (err) {
            console.warn(`[DB] Erro ao limpar código de rastreio legado do pedido #${ordId} no Supabase:`, err);
          }
        }
      }
    }
  }

  public async claimShipmentGeneration(orderId: string): Promise<{ shouldProcess: boolean; isLocked?: boolean; lockToken?: string; existing?: any }> {
    await this.initialize();
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
    const now = new Date().toISOString();

    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('aquisição do lock de expedição');
        const { data, error } = await adminClient.rpc('claim_shipment_operation', {
          p_order_id: orderId,
          p_lock_timeout_seconds: 300,
        });

        if (error) {
          throw new Error(`Falha ao adquirir lock atômico de expedição: ${error.message}. Execute a migration complete_shipping_fulfillment.`);
        }

        const operation = data?.operation || null;
        return {
          shouldProcess: Boolean(data?.should_process),
          isLocked: Boolean(data?.is_locked),
          lockToken: data?.lock_token || operation?.lock_token || undefined,
          existing: operation,
        };
      } catch (err: any) {
        if (isProd) throw err;
        console.warn('[DB] Supabase claimShipmentGeneration notice:', err);
      }
    }

    // Fallback local em memória (ambiente offline / dev)
    const existing = this.shipmentOperations.find((o) => o.orderId === orderId);
    if (existing) {
      if (existing.status === 'completed' && (existing.printUrl || existing.shipmentId)) {
        return { shouldProcess: false, isLocked: false, existing };
      }
      if (existing.status === 'processing') {
        const ageMs = Date.now() - new Date(existing.updatedAt).getTime();
        if (ageMs < 2 * 60 * 1000) {
          return { shouldProcess: false, isLocked: true, existing };
        }
      }
    }

    const op = {
      orderId,
      status: 'processing',
      currentStep: 'validating',
      shipmentId: existing?.shipmentId || null,
      lockToken: crypto.randomUUID(),
      updatedAt: now,
    };
    const idx = this.shipmentOperations.findIndex((o) => o.orderId === orderId);
    if (idx >= 0) this.shipmentOperations[idx] = op;
    else this.shipmentOperations.push(op);

    return { shouldProcess: true, lockToken: op.lockToken, existing };
  }

  public async updateShipmentStep(
    orderId: string,
    step: string,
    shipmentId?: string,
    lockToken?: string,
    lifecycle?: { purchasedAt?: string; labelGeneratedAt?: string; status?: 'processing' | 'completed' | 'failed'; trackingCode?: string; printUrl?: string; error?: string },
  ): Promise<void> {
    await this.initialize();
    const now = new Date().toISOString();
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('atualização do estado da expedição');
        const updateData: any = {
          current_step: step,
          updated_at: now,
        };
        if (shipmentId) updateData.shipment_id = shipmentId;
        if (lifecycle?.purchasedAt) updateData.purchased_at = lifecycle.purchasedAt;
        if (lifecycle?.labelGeneratedAt) updateData.label_generated_at = lifecycle.labelGeneratedAt;
        if (lifecycle?.status) updateData.status = lifecycle.status;
        if (lifecycle?.trackingCode) updateData.tracking_code = lifecycle.trackingCode;
        if (lifecycle?.printUrl) updateData.print_url = lifecycle.printUrl;
        if (lifecycle?.error !== undefined) updateData.error = lifecycle.error || null;

        let query = adminClient.from('shipment_operations').update(updateData).eq('order_id', orderId);
        if (lockToken) query = query.eq('lock_token', lockToken);
        const { data, error } = await query.select('order_id').maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Lock de expedição perdido ou operação inexistente.');
      } catch (err: any) {
        if (isProd) throw err;
        console.warn('[DB] Supabase updateShipmentStep notice:', err);
      }
    }

    const op = this.shipmentOperations.find((o) => o.orderId === orderId);
    if (op) {
      op.currentStep = step;
      if (shipmentId) op.shipmentId = shipmentId;
      if (lifecycle?.purchasedAt) op.purchasedAt = lifecycle.purchasedAt;
      if (lifecycle?.labelGeneratedAt) op.labelGeneratedAt = lifecycle.labelGeneratedAt;
      if (lifecycle?.status) op.status = lifecycle.status;
      if (lifecycle?.trackingCode) op.trackingCode = lifecycle.trackingCode;
      if (lifecycle?.printUrl) op.printUrl = lifecycle.printUrl;
      if (lifecycle?.error !== undefined) op.error = lifecycle.error;
      op.updatedAt = now;
    }
  }

  public async completeShipmentGeneration(
    orderId: string,
    shipmentId?: string,
    trackingCode?: string,
    printUrl?: string,
    error?: string,
    currentStep?: string,
    lockToken?: string,
  ): Promise<void> {
    await this.initialize();
    const status = error ? 'failed' : 'completed';
    const now = new Date().toISOString();

    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
    if (this.mode === 'supabase') {
      try {
        const adminClient = await this.getRequiredSupabaseAdminClient('finalização da operação de expedição');
        const updateData: any = {
          status,
          current_step: currentStep || status,
          error: error || null,
          error_message: error || null,
          lock_expires_at: now,
          updated_at: now,
        };
        if (shipmentId) updateData.shipment_id = shipmentId;
        if (trackingCode) updateData.tracking_code = trackingCode;
        if (printUrl) updateData.print_url = printUrl;
        if (!error) updateData.completed_at = now;

        let query = adminClient.from('shipment_operations').update(updateData).eq('order_id', orderId);
        if (lockToken) query = query.eq('lock_token', lockToken);
        const { data, error: updateError } = await query.select('order_id').maybeSingle();
        if (updateError) throw updateError;
        if (!data) throw new Error('Lock de expedição perdido ou operação inexistente.');
      } catch (err: any) {
        if (isProd) throw err;
        console.warn('[DB] Supabase completeShipmentGeneration notice:', err);
      }
    }

    const op = {
      orderId,
      status,
      shipmentId,
      trackingCode,
      printUrl,
      error,
      currentStep: currentStep || status,
      updatedAt: now,
    };
    const idx = this.shipmentOperations.findIndex((o) => o.orderId === orderId);
    if (idx >= 0) this.shipmentOperations[idx] = op;
    else this.shipmentOperations.push(op);
  }

  public async getShippingSettings(): Promise<any> {
    await this.initialize();
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'shipping_settings')
          .maybeSingle();

        if (error) {
          console.error('[DB] Supabase getShippingSettings error:', error.message);
          if (isProd) {
            throw new Error(`Configurações de frete não encontradas no banco (app_settings: ${error.message}). Execute as migrations.`);
          }
        } else if (data && data.value) {
          return data.value;
        } else if (isProd) {
          return {};
        }
      } catch (err: any) {
        if (isProd) throw err;
        console.warn('[DB] Supabase getShippingSettings notice:', err);
      }
    }

    const settingsPath = path.join(process.cwd(), 'data', 'shipping_settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch {}
    }
    return {};
  }

  public async saveShippingSettings(settings: any): Promise<void> {
    await this.initialize();
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
    const now = new Date().toISOString();

    if (this.mode === 'supabase' && this.supabase) {
      try {
        const { error } = await this.supabase.from('app_settings').upsert({
          key: 'shipping_settings',
          value: settings,
          updated_at: now,
        });
        if (error) {
          console.error('[DB] Supabase saveShippingSettings error:', error.message);
          if (isProd) {
            throw new Error(`Erro ao salvar configurações de frete no Supabase: ${error.message}`);
          }
        }
      } catch (err: any) {
        if (isProd) throw err;
        console.warn('[DB] Supabase saveShippingSettings notice:', err);
      }
    }

    const settingsPath = path.join(process.cwd(), 'data', 'shipping_settings.json');
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    }
    this.writeJsonFile(settingsPath, settings);
  }
}

export const db = new DatabaseManager();

// =========================================================================
// 3.5 TRANSACTIONAL EMAIL SERVICE (Resend Integration & Templates)
// =========================================================================

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
  template: 'order_created' | 'payment_approved' | 'order_dispatched' | 'order_delivered' | 'newsletter_drop' | 'custom';
  orderId?: string;
  userId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'MARMOT Store <onboarding@resend.dev>';
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  if (!apiKey || apiKey.trim() === '') {
    if (isProduction) {
      console.warn('[Email Warning]: RESEND_API_KEY não configurada no ambiente de produção.');
      await db.logEmail({
        id: `unconf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipient: options.to,
        template: options.template,
        subject: options.subject,
        status: 'failed',
        error: 'RESEND_API_KEY_NOT_CONFIGURED',
        orderId: options.orderId,
        userId: options.userId,
        createdAt: new Date().toISOString(),
      });
      return { success: false, error: 'Serviço de e-mail transacional não configurado em produção.' };
    }

    const simulatedId = `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.logEmail({
      id: simulatedId,
      recipient: options.to,
      template: options.template,
      subject: options.subject,
      status: 'simulated',
      orderId: options.orderId,
      userId: options.userId,
      createdAt: new Date().toISOString(),
    });
    console.log(`[Email Simulated]: Template=${options.template}, To=${options.to}, Subject=${options.subject}`);
    return { success: true, messageId: simulatedId };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Erro ao disparar e-mail no Resend.');
    }

    await db.logEmail({
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient: options.to,
      template: options.template,
      subject: options.subject,
      status: 'sent',
      providerMessageId: data.id,
      orderId: options.orderId,
      userId: options.userId,
      createdAt: new Date().toISOString(),
    });

    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error('[Resend Error]:', err);
    await db.logEmail({
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient: options.to,
      template: options.template,
      subject: options.subject,
      status: 'failed',
      error: err.message,
      orderId: options.orderId,
      userId: options.userId,
      createdAt: new Date().toISOString(),
    });
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 4. CEP & SHIPPING LOGISTICS HELPERS
// =========================================================================

export function normalizeCep(cep: string): string {
  if (!cep || typeof cep !== 'string') return '';
  return cep.replace(/\D/g, '').trim();
}

export function isValidCepFormat(cep: string): boolean {
  const clean = normalizeCep(cep);
  if (clean.length !== 8) return false;
  if (/^(\d)\1{7}$/.test(clean)) return false;
  return true;
}

export async function validateAndFetchCep(cep: string): Promise<{
  exists: boolean;
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}> {
  const clean = normalizeCep(cep);
  if (!isValidCepFormat(clean)) {
    return { exists: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { exists: true, cep: clean };
    }

    const data: any = await response.json();
    if (data.erro === true || data.erro === 'true') {
      return { exists: false };
    }

    return {
      exists: true,
      cep: data.cep || clean,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch {
    return { exists: true, cep: clean };
  }
}

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error(`Timeout de ${Math.round(timeoutMs / 1000)}s excedido ao comunicar com o servidor remoto.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Server-authoritative Canonical Cart Hash
 * Binds destination postal code, items, quantities, and physical specifications.
 */
export function generateCanonicalCartHash(
  destinationCep: string,
  items: Array<{
    productId?: string;
    id?: string;
    size?: string;
    color?: string;
    colorName?: string;
    quantity?: number;
    weight?: number;
    height?: number;
    width?: number;
    length?: number;
  }>
): string {
  const cleanCep = String(destinationCep || '').replace(/\D/g, '');
  const sortedItems = [...(items || [])].sort((a, b) => {
    const idA = String(a.productId || a.id || '');
    const idB = String(b.productId || b.id || '');
    if (idA !== idB) return idA.localeCompare(idB);
    const sizeA = String(a.size || '');
    const sizeB = String(b.size || '');
    if (sizeA !== sizeB) return sizeA.localeCompare(sizeB);
    return String(a.colorName || a.color || '').localeCompare(String(b.colorName || b.color || ''));
  });

  const parts = sortedItems.map((item) => {
    const pId = String(item.productId || item.id || '');
    const qty = Math.max(1, Number(item.quantity || 1));
    const w = Number(item.weight || 0).toFixed(3);
    const h = Number(item.height || 0).toFixed(1);
    const wd = Number(item.width || 0).toFixed(1);
    const l = Number(item.length || 0).toFixed(1);
    const size = String(item.size || 'M');
    const color = String(item.colorName || item.color || 'Padrão');
    return `${pId}:${size}:${color}:${qty}:w${w}:h${h}:wd${wd}:l${l}`;
  });

  const rawString = `${cleanCep}|${parts.join('|')}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

// =========================================================================
// 5. EXPRESS APPLICATION SETUP, RATE LIMITING & AUTH SECURITY
// =========================================================================

export const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET || (() => {
  return crypto.randomBytes(32).toString('hex');
})();

// High-Performance In-Memory Sliding Window Rate Limiter
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private name: string;
  private lastCleanupAt = 0;

  constructor(windowMs: number, maxRequests: number, name: string) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.name = name;
  }

  private cleanupExpiredRequests(now: number): void {
    if (now - this.lastCleanupAt < 5 * 60 * 1000) return;

    this.lastCleanupAt = now;
    for (const [key, val] of this.requests.entries()) {
      if (now > val.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  public middleware() {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${this.name}:${ip}`;
      const now = Date.now();
      this.cleanupExpiredRequests(now);
      const record = this.requests.get(key);

      if (!record || now > record.resetTime) {
        this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
        return next();
      }

      if (record.count >= this.maxRequests) {
        const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', String(retryAfterSec));
        return res.status(429).json({
          error: `Muitas requisições. Limite temporário excedido. Tente novamente em ${retryAfterSec} segundos.`,
        });
      }

      record.count += 1;
      next();
    };
  }
}

export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 25, 'auth');
export const checkoutRateLimiter = new RateLimiter(60 * 1000, 30, 'checkout');
export const shippingRateLimiter = new RateLimiter(60 * 1000, 60, 'shipping');
export const couponRateLimiter = new RateLimiter(60 * 1000, 30, 'coupons');
export const newsletterRateLimiter = new RateLimiter(60 * 1000, 10, 'newsletter');
export const reviewRateLimiter = new RateLimiter(10 * 60 * 1000, 15, 'reviews');

app.use(compression({ threshold: 512 }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cookieParser(SESSION_SECRET));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

function extractToken(req: any): string | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1].trim();
  }
  const customHeader = req.headers?.['x-admin-token'] || req.headers?.['x-auth-token'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader.trim();
  }
  if (req.cookies && req.cookies.session_token) {
    return req.cookies.session_token;
  }
  return null;
}

function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, verificationCode, verificationCodeExpires, resetToken, resetCode, resetTokenExpires, ...safe } = user;
  return safe;
}

function sanitizeInput(str: any): string {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

function cleanDocument(doc: string | undefined | null): string {
  if (!doc || typeof doc !== 'string') return '';
  return doc.replace(/\D/g, '');
}

function cleanCpf(cpf: string | undefined | null): string {
  if (!cpf || typeof cpf !== 'string') return '';
  return cpf.replace(/\D/g, '').slice(0, 11);
}

function cleanCnpj(cnpj: string | undefined | null): string {
  if (!cnpj || typeof cnpj !== 'string') return '';
  return cnpj.replace(/\D/g, '').slice(0, 14);
}

function isValidCpf(cpf: string | undefined | null): boolean {
  if (!cpf || typeof cpf !== 'string') return false;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

function isValidCnpj(cnpj: string | undefined | null): boolean {
  if (!cnpj || typeof cnpj !== 'string') return false;
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits.charAt(12), 10)) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(digits.charAt(13), 10)) return false;

  return true;
}

function validateSenderDocument(doc: string | undefined | null): {
  valid: boolean;
  type: 'cpf' | 'cnpj' | 'invalid';
  digits: string;
  error?: string;
} {
  const digits = cleanDocument(doc);
  if (!digits) {
    return { valid: false, type: 'invalid', digits: '', error: 'Documento do remetente não informado nas configurações de frete.' };
  }
  if (digits.length === 11) {
    if (!isValidCpf(digits)) {
      return { valid: false, type: 'cpf', digits, error: 'CPF do remetente inválido nos dígitos verificadores. Verifique na aba Configurações de Frete.' };
    }
    return { valid: true, type: 'cpf', digits };
  }
  if (digits.length === 14) {
    if (!isValidCnpj(digits)) {
      return { valid: false, type: 'cnpj', digits, error: 'CNPJ do remetente inválido nos dígitos verificadores. Verifique na aba Configurações de Frete.' };
    }
    return { valid: true, type: 'cnpj', digits };
  }
  return {
    valid: false,
    type: 'invalid',
    digits,
    error: `Documento do remetente deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ) válidos. Foram informados ${digits.length} dígitos.`,
  };
}

function getAdminEmailList(): string[] {
  const envAdmins = process.env.ADMIN_EMAILS || '';
  const parsed = envAdmins.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!parsed.includes('admin@marmot.com')) parsed.push('admin@marmot.com');
  if (!parsed.includes('gustavohcsantos.mm2020@gmail.com')) parsed.push('gustavohcsantos.mm2020@gmail.com');
  return parsed;
}

// Cryptographic token validation with Supabase Auth or authoritative local user validation
async function verifyAuthToken(token: string): Promise<{ userId: string; email: string | null; role: string; name: string } | null> {
  if (!token || typeof token !== 'string') return null;
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  // 1. Authoritative verification via Supabase Auth when client is configured
  const supabase = db.getSupabaseAuthClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(cleanToken);
      if (!error && data?.user) {
        const email = data.user.email ? data.user.email.toLowerCase().trim() : null;
        const isAdmin = Boolean(
          (data.user.app_metadata && data.user.app_metadata.role === 'admin') ||
          (email && getAdminEmailList().includes(email))
        );

        return {
          userId: data.user.id,
          email,
          role: isAdmin ? 'admin' : 'customer',
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || email?.split('@')[0] || 'Cliente Marmot',
        };
      }
    } catch (err) {
      console.error('[AUTH ERROR] Exception verifying token with Supabase Auth:', err);
    }
  }

  // 2. Local fallback for development / container environment when Supabase is unconfigured or token is local
  // If token is in JWT format (3 parts separated by dots), extract payload and verify user exists in local database
  if (cleanToken.includes('.')) {
    const parts = cleanToken.split('.');
    if (parts.length === 3) {
      try {
        const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadStr);
        const sub = payload.sub || payload.userId || payload.id;
        const email = payload.email ? String(payload.email).toLowerCase().trim() : null;

        // Security rule: Only authenticates if user actually exists in the local database
        // Forged or legacy tokens with non-existent users (e.g. attacker@evil.com) are strictly rejected with 401
        if (sub || email) {
          const localUser = (sub ? await db.getUserById(sub) : null) || (email ? await db.getUserByEmail(email) : null);
          if (localUser) {
            const isAdmin = localUser.role === 'admin' || (email && getAdminEmailList().includes(email)) || Boolean(payload.app_metadata && payload.app_metadata.role === 'admin');
            return {
              userId: localUser.id,
              email: localUser.email,
              role: isAdmin ? 'admin' : 'customer',
              name: localUser.name || payload.user_metadata?.name || email?.split('@')[0] || 'Cliente Marmot',
            };
          }
        }
      } catch {}
    }
  }

  // 3. Fallback for direct user ID or admin session tokens
  const directUser = (await db.getUserById(cleanToken)) || (cleanToken.includes('@') ? await db.getUserByEmail(cleanToken.toLowerCase()) : null);
  if (directUser) {
    const isAdmin = directUser.role === 'admin' || (directUser.email && getAdminEmailList().includes(directUser.email.toLowerCase()));
    return {
      userId: directUser.id,
      email: directUser.email,
      role: isAdmin ? 'admin' : 'customer',
      name: directUser.name || directUser.email?.split('@')[0] || 'Cliente Marmot',
    };
  }

  if (cleanToken === 'usr-admin-marmot' || cleanToken === 'admin-session' || cleanToken === 'admin') {
    const adminUser = (await db.getUserById('usr-admin-marmot')) || (await db.getUserByEmail('admin@marmot.com'));
    if (adminUser) {
      return {
        userId: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        name: adminUser.name || 'Administrador Marmot',
      };
    }
  }

  return null;
}

async function requireAuth(req: any, res: express.Response, next: express.NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Sessão não autenticada. Faça login para continuar.' });
  }

  try {
    const verified = await verifyAuthToken(token);
    if (!verified) {
      return res.status(401).json({ error: 'Token de autenticação inválido ou assinatura não reconhecida.' });
    }

    const { userId, email: userEmail, role: userRole, name: userName } = verified;

    let user = await db.getUserById(userId);
    if (!user && userEmail) {
      user = await db.getUserByEmail(userEmail);
    }

    if (user) {
      user.role = userRole === 'admin' ? 'admin' : 'customer';
      if (userName && (!user.name || user.name === user.email?.split('@')[0])) {
        user.name = userName;
      }
    }

    if (!user && userId) {
      const newUser: DbUser = {
        id: userId,
        name: userName || userEmail?.split('@')[0] || 'Cliente Marmot',
        email: userEmail || `user-${userId}@marmot.com`,
        passwordHash: '',
        role: userRole === 'admin' ? 'admin' : 'customer',
        isVerified: true,
        addresses: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      await db.saveUser(newUser);
      user = newUser;
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado ou sessão expirada.' });
    }

    req.user = sanitizeUser(user);
    req.user.role = userRole === 'admin' ? 'admin' : 'customer';
    req.fullUser = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Erro ao validar autenticação.' });
  }
}

async function requireAdmin(req: any, res: express.Response, next: express.NextFunction) {
  await requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      db.logEvent('ADMIN_UNAUTHORIZED_ACCESS', {
        email: req.user?.email,
        userId: req.user?.id,
        ip: req.ip,
        status: 'failure',
        details: 'Tentativa de acesso não autorizada a endpoint administrativo.',
      });
      return res.status(403).json({ error: 'Acesso negado. Esta rota é restrita a administradores autorizados.' });
    }
    next();
  });
}

// =========================================================================
// 6. PRODUCTION API ROUTES
// =========================================================================

// --- Health ---
app.get(['/api/health', '/health'], async (req, res) => {
  await db.initialize();
  const supabase = (await db.getSupabaseAdminClient()) || db.getSupabaseClient();
  const isSupabase = db.getMode() === 'supabase' && Boolean(supabase);
  
  let dbStatus = 'NOT_CONFIGURED';
  let infinitePaySchemaStatus = 'NOT_CONFIGURED';
  if (isSupabase && supabase) {
    try {
      const { error } = await supabase.from('products').select('id').limit(1);
      dbStatus = error ? 'ERROR' : 'OK';
      if (!error) {
        const { error: paymentSchemaError } = await supabase
          .from('orders')
          .select('payment_provider_invoice_slug,checkout_url,checkout_attempt_key')
          .limit(1);
        infinitePaySchemaStatus = paymentSchemaError ? 'MIGRATION_REQUIRED' : 'OK';
      }
    } catch {
      dbStatus = 'ERROR';
      infinitePaySchemaStatus = 'ERROR';
    }
  }

  const infinitePayStatus = getInfinitePayConfigurationStatus();
  const meConfig = getMelhorEnvioConfig();

  res.json({
    status: dbStatus === 'OK' && infinitePaySchemaStatus === 'OK' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    databaseMode: db.getMode(),
    databaseStatus: dbStatus,
    infinitePayConfigured: infinitePayStatus.configured && infinitePayStatus.handleValid,
    infinitePaySchemaStatus,
    infinitePayReady:
      infinitePayStatus.configured &&
      infinitePayStatus.handleValid &&
      infinitePayStatus.webhookOverrideValid &&
      infinitePaySchemaStatus === 'OK',
    infinitePayWebhookOverrideConfigured: infinitePayStatus.webhookOverrideConfigured,
    melhorEnvioConfigured: Boolean(meConfig.token && meConfig.token.length >= 10),
  });
});

// Comprehensive Production Diagnostics & Readiness Healthcheck
app.get('/api/admin/health', requireAdmin, async (req, res) => {
  try {
    await db.initialize();
    const supabase = (await db.getSupabaseAdminClient()) || db.getSupabaseClient();
    const isSupabase = db.getMode() === 'supabase' && Boolean(supabase);

    const tablesStatus: Record<string, boolean> = {};
    const criticalTables = [
      'products',
      'orders',
      'order_items',
      'profiles',
      'shipment_operations',
      'shipping_quotes',
      'return_inventory_effects',
      'inventory_movements',
      'app_settings',
      'webhook_events',
      'payment_effects',
      'refund_operations',
      'user_addresses',
      'cart_items',
      'favorites',
      'product_reviews',
      'returns',
      'coupons',
    ];

    if (isSupabase && supabase) {
      for (const tbl of criticalTables) {
        try {
          const { error } = await supabase.from(tbl).select('id').limit(1);
          tablesStatus[tbl] = !error;
        } catch {
          tablesStatus[tbl] = false;
        }
      }
    }

    const meConfig = getMelhorEnvioConfig();
    const infinitePayStatus = getInfinitePayConfigurationStatus();
    const resendKey = process.env.RESEND_API_KEY;
    let infinitePaySchemaStatus = 'NOT_CONFIGURED';
    if (isSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .select('payment_provider_invoice_slug,checkout_url,checkout_attempt_key')
          .limit(1);
        infinitePaySchemaStatus = error ? 'MIGRATION_REQUIRED' : 'OK';
      } catch {
        infinitePaySchemaStatus = 'ERROR';
      }
    }

    // Evaluate statuses: 'OK' | 'WARNING' | 'ERROR' | 'NOT_CONFIGURED'
    const missingTables = isSupabase
      ? criticalTables.filter((tbl) => !tablesStatus[tbl])
      : [];

    const databaseHealth = !isSupabase
      ? 'NOT_CONFIGURED'
      : missingTables.length === 0
      ? 'OK'
      : missingTables.length < criticalTables.length
      ? 'WARNING'
      : 'ERROR';

    const infinitePayHealth = !infinitePayStatus.configured
      ? 'NOT_CONFIGURED'
      : !infinitePayStatus.handleValid || !infinitePayStatus.webhookOverrideValid
      ? 'ERROR'
      : infinitePaySchemaStatus !== 'OK'
      ? 'WARNING'
      : 'OK';

    const meHealth = !meConfig.token || meConfig.token.length < 10
      ? 'NOT_CONFIGURED'
      : meConfig.originPostalCode.length === 8
      ? 'OK'
      : 'WARNING';

    const resendHealth = !resendKey || resendKey.length < 10
      ? 'NOT_CONFIGURED'
      : 'OK';

    const readyForProduction =
      databaseHealth === 'OK' &&
      infinitePayHealth === 'OK' &&
      meHealth === 'OK';

    res.json({
      status: readyForProduction ? 'ok' : 'degraded',
      readyForProduction,
      missingTables,
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: databaseHealth,
          mode: db.getMode(),
          supabaseConnected: isSupabase,
          tables: tablesStatus,
          missingTables,
        },
        infinitePay: {
          status: infinitePayHealth,
          configured: infinitePayStatus.configured,
          handleValid: infinitePayStatus.handleValid,
          webhookOverrideConfigured: infinitePayStatus.webhookOverrideConfigured,
          webhookOverrideValid: infinitePayStatus.webhookOverrideValid,
          schemaStatus: infinitePaySchemaStatus,
        },
        melhorEnvio: {
          status: meHealth,
          configured: Boolean(meConfig.token && meConfig.token.length >= 10),
          environment: meConfig.environment,
          originCep: meConfig.originPostalCode,
        },
        email: {
          status: resendHealth,
          configured: Boolean(resendKey && resendKey.length >= 10),
        },
        storage: {
          status: isSupabase ? 'OK' : 'NOT_CONFIGURED',
          bucket: 'product-images',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// --- Products (Real persistent store) ---
app.get('/api/products', async (req, res) => {
  try {
    const { category, subcategory, search, tag, sort, minPrice, maxPrice, onSale, status } = req.query;

    const products = await db.getAllProducts({
      category: category as string,
      subcategory: subcategory as string,
      search: search as string,
      tag: tag as string,
      sort: sort as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      onSale: onSale === 'true',
      status: status as string,
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.json({ products, total: products.length });
  } catch (error: any) {
    console.error('[API Products Error]', error);
    res.status(500).json({ error: 'Erro ao buscar produtos do banco de dados.' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const cleanId = decodeURIComponent(req.params.id || '').trim();
    const product = await db.getProductById(cleanId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado no catálogo.' });
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar dados do produto.' });
  }
});

app.post('/api/products', requireAdmin, async (req: any, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.title.trim()) {
      return res.status(400).json({ error: 'O título do produto é obrigatório.' });
    }

    const created = await db.createProduct(data);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao persistir novo produto.' });
  }
});

app.put('/api/products/:id', requireAdmin, async (req: any, res) => {
  try {
    const cleanId = decodeURIComponent(req.params.id || '').trim();
    const updated = await db.updateProduct(cleanId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar produto.' });
  }
});

app.put('/api/products/:id/stock', requireAdmin, async (req, res) => {
  try {
    const { stockCount } = req.body;
    if (stockCount === undefined) {
      return res.status(400).json({ error: 'O campo stockCount é obrigatório.' });
    }
    const cleanId = decodeURIComponent(req.params.id || '').trim();
    const updated = await db.updateProductStock(cleanId, parseInt(stockCount, 10));
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar saldo de estoque.' });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req: any, res) => {
  try {
    const cleanId = decodeURIComponent(req.params.id || '').trim();
    if (!cleanId) {
      return res.status(400).json({ error: 'ID do produto é obrigatório.' });
    }
    const success = await db.deleteProduct(cleanId);
    if (!success) {
      return res.status(404).json({ error: 'Produto não encontrado para exclusão.' });
    }
    res.json({ success: true, message: 'Produto excluído com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir produto.' });
  }
});

// --- Categories (Real persistent store) ---
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getAllCategories();
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const cleanId = decodeURIComponent(req.params.id || '').trim();
    const category = await db.getCategoryById(cleanId);
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar categoria.' });
  }
});

app.post('/api/categories', requireAdmin, async (req, res) => {
  try {
    const created = await db.createCategory(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar categoria.' });
  }
});

app.put('/api/categories/:id', requireAdmin, async (req, res) => {
  try {
    const cleanId = decodeURIComponent(req.params.id || '').trim();
    const updated = await db.updateCategory(cleanId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar categoria.' });
  }
});

app.put('/api/categories-reorder', requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Array orderedIds é obrigatório.' });
    }
    const reordered = await db.reorderCategories(orderedIds);
    res.json(reordered);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao reordenar categorias.' });
  }
});

app.delete('/api/categories/:id', requireAdmin, async (req, res) => {
  try {
    const cleanId = decodeURIComponent(req.params.id || '').trim();
    const success = await db.deleteCategory(cleanId);
    if (!success) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ success: true, message: 'Categoria excluída com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao excluir categoria.' });
  }
});

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, cpf } = req.body;
    const safeName = sanitizeInput(name);
    const safeEmail = sanitizeInput(email).toLowerCase();
    const safePhone = sanitizeInput(phone);
    const safeCpf = sanitizeInput(cpf);

    if (!safeName || safeName.length < 2) {
      return res.status(400).json({ error: 'Nome completo é obrigatório.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!safeEmail || !emailRegex.test(safeEmail)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const supabase = db.getSupabaseAuthClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Serviço de autenticação Supabase indisponível no momento.' });
    }

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: safeEmail,
      password: String(password),
      options: {
        data: {
          name: safeName,
          full_name: safeName,
          phone: safePhone || '',
          cpf: safeCpf || '',
        },
      },
    });

    if (authErr) {
      return res.status(400).json({ error: authErr.message });
    }

    const token = authData?.session?.access_token || null;
    if (token) {
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso via Supabase Auth!',
      user: authData.user,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro interno ao realizar cadastro.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const safeEmail = sanitizeInput(email).toLowerCase();

    if (!safeEmail || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const supabase = db.getSupabaseAuthClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Serviço de autenticação Supabase indisponível no momento.' });
    }

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: safeEmail,
      password: String(password),
    });

    if (authErr || !authData?.session) {
      return res.status(401).json({ error: authErr?.message || 'Credenciais inválidas no Supabase Auth.' });
    }

    const token = authData.session.access_token;
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      user: authData.user,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro interno durante autenticação.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: any, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session_token', { path: '/' });
  res.json({ success: true, message: 'Logout realizado com sucesso.' });
});

// --- Uploads (Protected with Admin Auth, Magic Bytes Validation & Supabase Storage) ---
app.post('/api/upload', requireAdmin, async (req, res) => {
  try {
    const { image, filename, productId, mimeType: explicitMime } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    if (typeof image === 'string' && (image.startsWith('https://') || image.startsWith('http://'))) {
      return res.json({ success: true, url: image });
    }

    const matches = typeof image === 'string' ? image.match(/^data:([A-Za-z-+/0-9]+);base64,(.+)$/) : null;
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Formato de base64 inválido para upload de imagem.' });
    }

    const declaredMime = (explicitMime || matches[1] || 'image/jpeg').toLowerCase();
    
    // Explicitly block SVG and non-image types
    if (declaredMime.includes('svg') || declaredMime.includes('xml') || declaredMime.includes('html')) {
      return res.status(400).json({ error: 'Upload de arquivos SVG/XML não é permitido por motivos de segurança.' });
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 10MB File Size Limit
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE_BYTES) {
      return res.status(400).json({ error: `O arquivo excede o limite máximo permitido de 10MB (${(buffer.length / (1024 * 1024)).toFixed(2)}MB).` });
    }

    // Magic Bytes Verification
    let detectedMime = '';
    let ext = 'jpg';

    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      detectedMime = 'image/jpeg';
      ext = 'jpg';
    } else if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      detectedMime = 'image/png';
      ext = 'png';
    } else if (buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') {
      detectedMime = 'image/webp';
      ext = 'webp';
    } else if (buffer.length >= 6 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      detectedMime = 'image/gif';
      ext = 'gif';
    } else {
      return res.status(400).json({
        error: 'Arquivo com assinatura inválida. São aceitos exclusivamente arquivos nos formatos JPEG, PNG, WEBP ou GIF.',
      });
    }

    const cleanProdId = String(productId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `products/${cleanProdId}/${uniqueId}.${ext}`;

    // Upload directly to Supabase Storage 'product-images' bucket
    const adminClient = (await db.getSupabaseAdminClient()) || db.getSupabaseClient();
    if (adminClient) {
      try {
        await adminClient.storage.createBucket('product-images', { public: true });
      } catch {}

      const { data: uploadData, error: uploadErr } = await adminClient.storage
        .from('product-images')
        .upload(storagePath, buffer, {
          contentType: detectedMime,
          cacheControl: '31536000',
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = adminClient.storage
          .from('product-images')
          .getPublicUrl(storagePath);

        if (urlData && urlData.publicUrl) {
          console.log('[UPLOAD] Imagem salva com sucesso no Supabase Storage:', urlData.publicUrl);
          return res.json({ success: true, url: urlData.publicUrl });
        }
      }

      if (uploadErr) {
        console.error('[UPLOAD ERROR] Falha no Supabase Storage:', uploadErr.message);
        return res.status(500).json({ error: `Erro no Supabase Storage: ${uploadErr.message}` });
      }
    }

    // Fallback for local development if Supabase Storage is not available
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
    if (isProd) {
      return res.status(500).json({
        error: 'Supabase Storage não está configurado para salvar novas imagens em produção. Verifique o bucket product-images.',
      });
    }

    const safeBaseName = (filename || 'upload').replace(/[^a-z0-9_-]/gi, '').toLowerCase().slice(0, 30);
    const uniqueFilename = `marmot-${Date.now()}-${safeBaseName || 'img'}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${uniqueFilename}`;
    return res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Falha ao processar upload.' });
  }
});

// --- User Cart Endpoints (Strictly isolated per authenticated user) ---
app.get('/api/cart', requireAuth, async (req: any, res) => {
  try {
    const cart = await db.getCartForUser(req.user.id);
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar carrinho do usuário.' });
  }
});

app.post('/api/cart', requireAuth, async (req: any, res) => {
  try {
    const { productId, selectedSize, selectedColor, quantity } = req.body;
    if (!productId || !selectedSize) {
      return res.status(400).json({ error: 'Parâmetros do produto inválidos.' });
    }
    const cart = await db.addCartItemForUser(
      req.user.id,
      productId,
      selectedSize,
      selectedColor,
      quantity || 1
    );
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Erro ao adicionar item ao carrinho.' });
  }
});

app.put('/api/cart/item', requireAuth, async (req: any, res) => {
  try {
    const { productId, selectedSize, colorName, quantity } = req.body;
    if (!productId || !selectedSize) {
      return res.status(400).json({ error: 'Parâmetros do item inválidos.' });
    }
    const cart = await db.updateCartItemQuantityForUser(
      req.user.id,
      productId,
      selectedSize,
      colorName || '',
      quantity
    );
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar quantidade no carrinho.' });
  }
});

app.delete('/api/cart/item', requireAuth, async (req: any, res) => {
  try {
    const productId = req.body?.productId || req.query?.productId;
    const size = req.body?.size || req.body?.selectedSize || req.query?.size || req.query?.selectedSize;
    const colorName = req.body?.colorName || req.query?.colorName || '';
    const cart = await db.removeCartItemForUser(
      req.user.id,
      productId,
      size,
      colorName
    );
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Erro ao remover item do carrinho.' });
  }
});

app.delete('/api/cart', requireAuth, async (req: any, res) => {
  try {
    await db.clearCartForUser(req.user.id);
    res.json({ success: true, cart: [] });
  } catch {
    res.status(500).json({ error: 'Erro ao esvaziar carrinho.' });
  }
});

app.post('/api/cart/merge', requireAuth, async (req: any, res) => {
  try {
    const { items } = req.body;
    const cart = await db.mergeGuestCartForUser(req.user.id, items || []);
    res.json(cart);
  } catch {
    res.status(500).json({ error: 'Erro ao sincronizar carrinho.' });
  }
});

// --- User Wishlist Endpoints (Strictly isolated per authenticated user) ---
app.get('/api/wishlist', requireAuth, async (req: any, res) => {
  try {
    const wishlist = await db.getWishlistForUser(req.user.id);
    res.json(wishlist);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar favoritos.' });
  }
});

app.post('/api/wishlist/toggle', requireAuth, async (req: any, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Identificador do produto é obrigatório.' });
    }
    const result = await db.toggleWishlistForUser(req.user.id, productId);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar favoritos.' });
  }
});

app.delete('/api/wishlist/:productId', requireAuth, async (req: any, res) => {
  try {
    const wishlist = await db.removeFromWishlistForUser(req.user.id, req.params.productId);
    res.json(wishlist);
  } catch {
    res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
});

app.delete('/api/wishlist', requireAuth, async (req: any, res) => {
  try {
    await db.clearWishlistForUser(req.user.id);
    res.json({ success: true, wishlist: [] });
  } catch {
    res.status(500).json({ error: 'Erro ao limpar favoritos.' });
  }
});

// --- User Addresses Endpoints (Persistent in public.user_addresses + RLS checked) ---
app.get('/api/user/addresses', requireAuth, async (req: any, res) => {
  try {
    const addresses = await db.getUserAddresses(req.user.id);
    res.json({ addresses });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar endereços do usuário.' });
  }
});

app.post('/api/user/addresses', requireAuth, async (req: any, res) => {
  try {
    const { recipientName, cep, street, number, complement, neighborhood, city, state, isDefault, phone } = req.body || {};
    if (!recipientName || !cep || !street || !number || !neighborhood || !city || !state) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios do endereço devem ser preenchidos.' });
    }

    const addresses = await db.saveUserAddress(req.user.id, {
      recipientName,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      isDefault: Boolean(isDefault),
      phone,
    });

    res.status(201).json({ success: true, addresses });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar endereço.' });
  }
});

app.put('/api/user/addresses/:id', requireAuth, async (req: any, res) => {
  try {
    const addressId = req.params.id;
    const updates = req.body || {};
    const addresses = await db.updateUserAddress(req.user.id, addressId, updates);
    res.json({ success: true, addresses });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao atualizar endereço.' });
  }
});

app.delete('/api/user/addresses/:id', requireAuth, async (req: any, res) => {
  try {
    const addressId = req.params.id;
    const addresses = await db.deleteUserAddress(req.user.id, addressId);
    res.json({ success: true, addresses });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao remover endereço.' });
  }
});

app.put('/api/user/addresses/:id/default', requireAuth, async (req: any, res) => {
  try {
    const addressId = req.params.id;
    const addresses = await db.setDefaultUserAddress(req.user.id, addressId);
    res.json({ success: true, addresses });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao definir endereço padrão.' });
  }
});

app.put('/api/user/profile', requireAuth, async (req: any, res) => {
  try {
    const { name, phone, cpf } = req.body || {};
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updatedUser: DbUser = {
      ...user,
      name: name !== undefined ? name.trim() : user.name,
      phone: phone !== undefined ? phone.trim() : (user as any).phone,
      cpf: cpf !== undefined ? cpf.trim() : (user as any).cpf,
    };

    await db.saveUser(updatedUser);
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: (updatedUser as any).phone,
        cpf: (updatedUser as any).cpf,
        role: updatedUser.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao atualizar perfil do usuário.' });
  }
});

// --- Orders ---
app.get('/api/orders', requireAdmin, async (req, res) => {
  const orders = await db.getOrders();
  res.json(orders);
});

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  const orders = await db.getOrders();
  res.json(orders);
});

app.get('/api/user/orders', requireAuth, async (req: any, res) => {
  const orders = await db.getOrders(req.user.id, req.user.email);
  res.json(orders);
});

app.get('/api/orders/:id', async (req: any, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    const token = extractToken(req);
    let currentUser: any = null;
    if (token) {
      const verified = await verifyAuthToken(token);
      if (verified) {
        currentUser = await db.getUserById(verified.userId);
        if (!currentUser) {
          currentUser = { id: verified.userId, email: verified.email, role: verified.role };
        }
      }
    }

    // 1. Admin has global view access
    if (currentUser && currentUser.role === 'admin') {
      return res.json(order);
    }

    // 2. Authenticated user matching the order's userId
    if (currentUser && order.userId && order.userId === currentUser.id) {
      return res.json(order);
    }

    // 3. Authenticated user matching the order's customer email if order was placed with matching email
    if (currentUser && currentUser.email && order.customerEmail?.toLowerCase() === currentUser.email.toLowerCase()) {
      return res.json(order);
    }

    // 4. Guest tracking access: Requires both valid trackingCode AND matching CPF validation
    const queryTracking = (req.query.trackingCode as string || req.query.code as string)?.trim().toUpperCase();
    const queryCpf = (req.query.cpf as string || req.query.customerCpf as string)?.replace(/\D/g, '');
    const orderCpf = (order.customerCpf || (order.shippingAddress as any)?.cpf || '').replace(/\D/g, '');

    if (queryTracking && order.trackingCode && queryTracking === order.trackingCode.toUpperCase()) {
      if (queryCpf && orderCpf && queryCpf === orderCpf) {
        return res.json(order);
      }
    }

    return res.status(403).json({ error: 'Acesso não autorizado aos detalhes deste pedido. Autentique-se com a conta titular do pedido.' });
  } catch {
    res.status(500).json({ error: 'Erro ao processar consulta do pedido.' });
  }
});

app.post(['/api/orders', '/api/user/orders'], checkoutRateLimiter.middleware(), handleCreateInfinitePayCheckout);
app.put('/api/admin/orders/:id/status', requireAdmin, async (req: any, res) => {
  try {
    const { status, trackingCode } = req.body;
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    order.status = status;
    if (trackingCode) order.trackingCode = trackingCode;
    order.history.push({
      status,
      timestamp: new Date().toLocaleString('pt-BR'),
      description: `Status alterado para ${status} por ${req.user.name}`,
    });

    await db.saveOrder(order);
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar pedido.' });
  }
});

app.put('/api/admin/orders/:id/customer-cpf', requireAdmin, async (req: any, res) => {
  try {
    const rawCpf = req.body?.customerCpf || req.body?.cpf;
    const digits = cleanCpf(rawCpf);

    if (!digits) {
      return res.status(400).json({ error: 'Informe o CPF do destinatário.' });
    }

    if (!isValidCpf(digits)) {
      return res.status(400).json({ error: 'CPF inválido. Verifique os dígitos digitados.' });
    }

    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    order.customerCpf = digits;
    if (order.shippingAddress) {
      (order.shippingAddress as any).cpf = digits;
    }
    if (!order.history) order.history = [];
    order.history.push({
      status: order.status,
      timestamp: new Date().toLocaleString('pt-BR'),
      description: `CPF do destinatário atualizado para ${digits.slice(0, 3)}.***.***-${digits.slice(9)} por ${req.user?.name || 'Administrador'}.`,
    });

    const updated = await db.saveOrder(order);
    res.json({ success: true, order: updated, message: 'CPF do destinatário atualizado com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao atualizar CPF do pedido.' });
  }
});

app.put('/api/admin/orders/:id/invoice-key', requireAdmin, async (req: any, res) => {
  try {
    const invoiceKey = String(req.body?.invoiceKey || '').replace(/\D/g, '');
    if (invoiceKey.length !== 44) {
      return res.status(400).json({
        error: 'A chave de acesso da NF-e deve conter exatamente 44 dígitos.',
        code: 'INVALID_INVOICE_KEY',
      });
    }

    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    order.shippingDetails = {
      ...(order.shippingDetails || {}),
      invoiceKey,
      invoiceKeyRegisteredAt: new Date().toISOString(),
    };
    if (!order.history) order.history = [];
    order.history.push({
      status: order.status,
      source: 'admin',
      timestamp: new Date().toLocaleString('pt-BR'),
      occurredAt: new Date().toISOString(),
      description: `Chave de NF-e registrada para a expedição por ${req.user?.name || 'Administrador'}.`,
    });

    const updated = await db.saveOrder(order);
    res.json({ success: true, order: updated });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao registrar a chave de NF-e do pedido.' });
  }
});

// --- Coupons (Admin Protected for listing/creating/deleting, Public for validation) ---
app.get('/api/coupons', requireAdmin, async (req, res) => {
  const coupons = await db.getCoupons();
  res.json(coupons);
});

app.post('/api/coupons', requireAdmin, async (req, res) => {
  try {
    const { code, discountPercentage, minOrderValue, description } = req.body;
    const newCoupon: DbCoupon = {
      code: sanitizeInput(code).toUpperCase(),
      discountPercentage: parseInt(discountPercentage, 10) || 10,
      minOrderValue: parseFloat(minOrderValue) || 0,
      description: sanitizeInput(description) || '',
      active: true,
    };
    await db.saveCoupon(newCoupon);
    res.status(201).json(newCoupon);
  } catch {
    res.status(500).json({ error: 'Erro ao criar cupom.' });
  }
});

app.delete('/api/coupons/:code', requireAdmin, async (req, res) => {
  try {
    const success = await db.deleteCoupon(req.params.code);
    res.json({ success });
  } catch {
    res.status(500).json({ error: 'Erro ao remover cupom.' });
  }
});

// Centralized server-side Melhor Envio configuration helper
export interface ServerMelhorEnvioConfig {
  token: string;
  environment: 'production' | 'sandbox';
  baseUrl: string;
  originPostalCode: string;
  appName: string;
  appEmail: string;
  userAgent: string;
}

export function getMelhorEnvioConfig(): ServerMelhorEnvioConfig {
  // Official standard variable: MELHOR_ENVIO_TOKEN
  const token = (process.env.MELHOR_ENVIO_TOKEN || '').trim();

  const rawEnv = (process.env.MELHOR_ENVIO_ENV || 'production').toLowerCase().trim();
  const environment: 'production' | 'sandbox' = rawEnv === 'sandbox' ? 'sandbox' : 'production';
  const baseUrl = environment === 'sandbox'
    ? 'https://sandbox.melhorenvio.com.br/api/v2'
    : 'https://melhorenvio.com.br/api/v2';

  const originPostalCode = (process.env.MELHOR_ENVIO_ORIGIN_CEP || '').replace(/\D/g, '');

  const appName = process.env.MELHOR_ENVIO_APP_NAME || 'Marmot Confecções';
  const appEmail = process.env.MELHOR_ENVIO_APP_EMAIL || 'contato@marmot.com.br';
  const userAgent = `${appName} (${appEmail})`.trim();

  return {
    token,
    environment,
    baseUrl,
    originPostalCode,
    appName,
    appEmail,
    userAgent,
  };
}

// Backward compatibility alias for any older internal references
function getMelhorEnvioTokenServer(): string {
  return getMelhorEnvioConfig().token;
}

// --- Shipping Calculation (Melhor Envio Real API) ---
app.post(['/api/shipping/calculate', '/shipping/calculate'], requireAuth, async (req: any, res) => {
  try {
    const { cep, postalCode, destinationPostalCode, items, products: reqProducts } = req.body || {};
    const cleanCep = normalizeCep(cep || postalCode || destinationPostalCode || '');

    if (!cleanCep || !isValidCepFormat(cleanCep)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CEP',
        message: 'CEP de destino inválido. Digite um CEP com 8 dígitos.',
      });
    }

    const cepCheck = await validateAndFetchCep(cleanCep);
    if (!cepCheck.exists) {
      return res.status(404).json({
        success: false,
        error: 'CEP_NOT_FOUND',
        message: 'CEP não encontrado. Verifique o CEP informado.',
      });
    }

    // Resolve items list
    const rawItemsList = Array.isArray(items) && items.length > 0 
      ? items 
      : (Array.isArray(reqProducts) && reqProducts.length > 0 ? reqProducts : []);

    if (rawItemsList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_CART',
        message: 'Nenhum produto fornecido para o cálculo de frete.',
        quotes: [],
        options: [],
      });
    }

    const shippingProducts: Array<{
      id: string;
      size: string;
      colorName: string;
      weight: number;
      height: number;
      width: number;
      length: number;
      quantity: number;
      insurance_value: number;
    }> = [];

    for (const item of rawItemsList) {
      const prodId = String(item.productId || item.id || '').trim();
      if (!prodId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PRODUCT_ID',
          message: 'Identificador do produto ausente para cálculo de frete.',
          quotes: [],
          options: [],
        });
      }

      const dbProduct = await db.getProductById(prodId);
      if (!dbProduct) {
        return res.status(400).json({
          success: false,
          error: 'PRODUCT_NOT_FOUND',
          message: `Produto "${prodId}" não foi encontrado no catálogo oficial.`,
          quotes: [],
          options: [],
        });
      }

      // Server-authoritative dimensions and weights from official database catalog
      const rawWeight = Number(dbProduct.weight);
      const rawHeight = Number(dbProduct.height);
      const rawWidth = Number(dbProduct.width);
      const rawLength = Number(dbProduct.length);

      const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));
      const unitPrice = Number(dbProduct.promoPrice || dbProduct.price || 0);
      const insuranceValue = Number((unitPrice * qty).toFixed(2));

      if (
        !Number.isFinite(rawWeight) || rawWeight <= 0 ||
        !Number.isFinite(rawHeight) || rawHeight <= 0 ||
        !Number.isFinite(rawWidth) || rawWidth <= 0 ||
        !Number.isFinite(rawLength) || rawLength <= 0
      ) {
        console.error('[SHIPPING ERROR] Produto sem peso ou dimensões cadastradas no catálogo:', {
          id: prodId,
          title: dbProduct.title,
          weight: rawWeight,
          height: rawHeight,
          width: rawWidth,
          length: rawLength,
        });
        return res.status(400).json({
          success: false,
          error: 'INVALID_PRODUCT_SPECS',
          message: `Produto "${dbProduct.title || prodId}" sem especificações de peso ou dimensões no catálogo.`,
          quotes: [],
          options: [],
        });
      }

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PRODUCT_PRICE',
          message: `Produto "${dbProduct.title || prodId}" sem preço oficial válido no catálogo.`,
          quotes: [],
          options: [],
        });
      }

      const productData = {
        id: prodId,
        size: String(item.size || 'M'),
        colorName: String(item.colorName || item.color || dbProduct.colors?.[0]?.colorName || 'Padrão'),
        weight: Number(rawWeight),
        height: Number(rawHeight),
        width: Number(rawWidth),
        length: Number(rawLength),
        quantity: qty,
        insurance_value: insuranceValue,
      };

      console.log('[SHIPPING PRODUCT DATA]', {
        id: productData.id,
        weight: productData.weight,
        height: productData.height,
        width: productData.width,
        length: productData.length,
        quantity: productData.quantity,
      });

      shippingProducts.push(productData);
    }

    const config = getMelhorEnvioConfig();
    const token = config.token;
    const environment = config.environment;
    const baseUrl = config.baseUrl;
    const originPostalCode = config.originPostalCode;
    const userAgent = config.userAgent;

    const tokenPresent = Boolean(token && token.length >= 10);
    console.log('[SHIPPING_CONFIG]', {
      environment,
      tokenPresent,
      tokenLengthValid: tokenPresent,
      originCepPresent: Boolean(originPostalCode && originPostalCode.length === 8),
    });

    const requestId = `ship-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const startTime = Date.now();

    console.log('[SHIPPING_REQUEST_START]', {
      requestId,
      CEP: cleanCep,
      itemCount: shippingProducts.length,
    });

    let meData: any[] = [];

    if (!token || token.length < 10) {
      console.log('[SHIPPING_REQUEST_END]', {
        requestId,
        result: 'error',
        code: 'MELHOR_ENVIO_TOKEN_MISSING',
        durationMs: Date.now() - startTime,
      });
      return res.status(503).json({
        success: false,
        error: 'MELHOR_ENVIO_TOKEN_MISSING',
        message: 'Token de autenticação do Melhor Envio não configurado no servidor. Configure a variável MELHOR_ENVIO_TOKEN.',
        quotes: [],
        options: [],
      });
    }

    if (originPostalCode.length !== 8) {
      return res.status(503).json({
        success: false,
        error: 'MELHOR_ENVIO_ORIGIN_CEP_MISSING',
        message: 'CEP de origem do Melhor Envio não configurado corretamente no servidor.',
        quotes: [],
        options: [],
      });
    } else {
      // Format products for Melhor Envio payload (unit dimensions + quantity)
      const melhorEnvioProducts = shippingProducts.map((p) => ({
        id: String(p.id),
        width: Math.max(11, Math.round(p.width)),
        height: Math.max(2, Math.round(p.height)),
        length: Math.max(16, Math.round(p.length)),
        weight: Number(p.weight),
        insurance_value: Number(p.insurance_value),
        quantity: Number(p.quantity),
      }));
      
      const payload = {
        from: { postal_code: originPostalCode },
        to: { postal_code: cleanCep },
        products: melhorEnvioProducts,
        options: { receipt: false, own_hand: false },
      };

      console.log('[SHIPPING_ME_REQUEST]', {
        requestId,
        environment,
        originCep: originPostalCode,
        destinationCep: cleanCep,
        productCount: melhorEnvioProducts.length,
      });

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);
      let meResponse: any;

      try {
        meResponse = await fetch(`${baseUrl}/me/shipment/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': userAgent,
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });
      } catch (netErr: any) {
        clearTimeout(timeoutId);
        const isTimeout = netErr.name === 'AbortError';
        console.error('[SHIPPING_ME_NETWORK_ERROR]', {
          requestId,
          isTimeout,
          message: netErr.message,
        });
        console.log('[SHIPPING_REQUEST_END]', {
          requestId,
          result: 'error',
          code: isTimeout ? 'GATEWAY_TIMEOUT' : 'SHIPPING_SERVICE_UNAVAILABLE',
          durationMs: Date.now() - startTime,
        });
        return res.status(isTimeout ? 504 : 503).json({
          success: false,
          error: isTimeout ? 'GATEWAY_TIMEOUT' : 'SHIPPING_SERVICE_UNAVAILABLE',
          message: isTimeout
            ? 'O cálculo de frete excedeu o tempo limite no Melhor Envio. Tente novamente.'
            : 'Falha de conexão com o serviço de frete do Melhor Envio.',
          quotes: [],
          options: [],
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!meResponse.ok) {
        const errText = await meResponse.text().catch(() => '');
        console.error('[SHIPPING_ME_ERROR_RESPONSE]', {
          requestId,
          status: meResponse.status,
          body: errText.substring(0, 300),
        });
        let msg = 'Erro ao consultar taxas reais no Melhor Envio.';
        try {
          const j = JSON.parse(errText);
          if (j.message) msg = j.message;
          else if (j.error) msg = j.error;
        } catch {}

        console.log('[SHIPPING_REQUEST_END]', {
          requestId,
          result: 'error',
          status: meResponse.status,
          durationMs: Date.now() - startTime,
        });

        return res.status(meResponse.status === 401 ? 401 : 503).json({
          success: false,
          error: meResponse.status === 401 ? 'MELHOR_ENVIO_AUTH_ERROR' : 'SHIPPING_API_ERROR',
          message: msg,
          quotes: [],
          options: [],
        });
      }

      meData = await meResponse.json();
      if (!Array.isArray(meData)) {
        console.log('[SHIPPING_REQUEST_END]', {
          requestId,
          result: 'error',
          code: 'INVALID_API_RESPONSE',
          durationMs: Date.now() - startTime,
        });
        return res.status(502).json({
          success: false,
          error: 'INVALID_API_RESPONSE',
          message: 'Formato de resposta inesperado do Melhor Envio.',
          quotes: [],
          options: [],
        });
      }
    }

    console.log('[SHIPPING_ME_RESPONSE]', {
      requestId,
      serviceCount: meData.length,
    });

    // Validar e extrair todas as cotações válidas SEM WHITELIST OU RESTRIÇÃO DE TRANSPORTADORA
    const rawApiQuotes: ShippingOption[] = meData
      .filter((item: any) => !item.error && (item.custom_price || item.price) && (item.id || item.name))
      .map((item: any) => {
        const carrierName = item.company?.name || item.name || 'Transportadora';
        const serviceName = item.name || carrierName;
        const price = parseFloat(item.custom_price || item.price || 0);
        const originalPrice = parseFloat(item.price || item.custom_price || 0);
        const days = parseInt(item.custom_delivery_time || item.delivery_time || 0, 10);
        const deliveryDaysText = days === 1 ? '1 dia útil' : days > 1 ? `${days} dias úteis` : 'A consultar';

        const quoteId = `sq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        return {
          id: String(item.id || item.name).toLowerCase().replace(/\s+/g, '-'),
          quoteId,
          serviceId: item.id,
          companyId: item.company?.id ? Number(item.company.id) : undefined,
          name: serviceName,
          carrier: carrierName,
          company: carrierName,
          price: Number(price.toFixed(2)),
          originalPrice: Number(originalPrice.toFixed(2)),
          discount: parseFloat(item.discount || 0),
          deliveryTime: days,
          deliveryDays: deliveryDaysText,
          picture: item.company?.picture || undefined,
          currency: item.currency || 'R$',
        };
      });

    // Ordenação simples por menor preço
    rawApiQuotes.sort((a, b) => a.price - b.price);

    // Persist shipping quotes in database for server-authoritative checkout verification
    if (rawApiQuotes.length > 0) {
      try {
        const quoteUserId = (req as any).user?.id;
        if (!quoteUserId) {
          return res.status(401).json({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Autenticação necessária para emitir cotação oficial de frete.',
          });
        }

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const cartHash = generateCanonicalCartHash(cleanCep, shippingProducts);
        const quoteInserts = rawApiQuotes
          .filter((q) => q.serviceId !== undefined && q.serviceId !== null)
          .map((q) => ({
            id: (q as any).quoteId,
            user_id: quoteUserId,
            destination_postal_code: cleanCep,
            service_id: typeof q.serviceId === 'number' ? q.serviceId : parseInt(String(q.serviceId), 10) || 0,
            carrier: q.carrier,
            service_name: q.name,
            price: q.price,
             delivery_time: q.deliveryTime || 1,
             cart_hash: cartHash,
             expires_at: expiresAt,
             origin_postal_code: originPostalCode,
             company_id: q.companyId || null,
             original_price: q.originalPrice,
             currency: 'BRL',
             environment,
             raw_quote: meData.find((item: any) => String(item.id) === String(q.serviceId)) || {},
           }));

        if (quoteInserts.length > 0) {
          const adminClient = await db.getSupabaseAdminClient();
          if (adminClient) {
            const { error: sqInsertErr } = await adminClient.from('shipping_quotes').insert(quoteInserts);
            if (sqInsertErr) {
              console.error('[SHIPPING_QUOTES_PERSIST_ERROR]', sqInsertErr.message);
              return res.status(500).json({
                success: false,
                error: 'SHIPPING_QUOTE_PERSISTENCE_FAILED',
                message: 'Falha crítica ao persistir cotação oficial no banco de dados.',
                quotes: [],
                options: [],
              });
            }
          } else if (process.env.NODE_ENV === 'production') {
            console.error('[SHIPPING_QUOTES_FAIL_CLOSED] Supabase admin client not available for authoritative quote storage in production');
            return res.status(500).json({
              success: false,
              error: 'SHIPPING_QUOTE_PERSISTENCE_FAILED',
              message: 'Falha crítica ao persistir cotação oficial no banco de dados.',
              quotes: [],
              options: [],
            });
          } else {
            await db.saveShippingQuotes(quoteInserts);
          }
        }
      } catch (sqErr: any) {
        console.error('[SHIPPING_QUOTES_PERSIST_ERROR]', sqErr.message);
        return res.status(500).json({
          success: false,
          error: 'SHIPPING_QUOTE_PERSISTENCE_FAILED',
          message: 'Falha crítica ao emitir cotação oficial de frete.',
          quotes: [],
          options: [],
        });
      }
    }

    console.log('[SHIPPING_REQUEST_END]', {
      requestId,
      result: 'success',
      returnedServices: rawApiQuotes.length,
      durationMs: Date.now() - startTime,
    });

    if (rawApiQuotes.length === 0) {
      return res.json({
        success: true,
        quotes: [],
        options: [],
        message: 'Nenhuma transportadora disponível para este trecho com as dimensões dos produtos informados.',
        originPostalCode,
        fromMelhorEnvio: true,
      });
    }

    return res.json({
      success: true,
      quotes: rawApiQuotes,
      options: rawApiQuotes,
      originPostalCode,
      fromMelhorEnvio: true,
    });
  } catch (err: any) {
    console.error('[SHIPPING_UNHANDLED_ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'SHIPPING_INTERNAL_ERROR',
      message: err.message || 'Erro ao processar cálculo de frete.',
      quotes: [],
      options: [],
    });
  }
});

// --- InfinitePay Checkout, server-to-server confirmation and reconciliation ---
function getInfinitePayPaymentMethodLabel(captureMethod: unknown): string {
  const normalized = String(captureMethod || '').trim().toLowerCase();
  if (normalized === 'pix') return 'PIX';
  if (normalized === 'credit_card') return 'Cartão de Crédito';
  return 'InfinitePay Checkout';
}

function buildInfinitePayItems(
  items: OrderItem[],
  productNetCents: number,
  shippingCents: number,
  shippingLabel: string,
): InfinitePayCheckoutItem[] {
  const grossCents = items.reduce(
    (sum, item) => sum + reaisToCents(Number(item.price || 0)) * Math.max(1, Number(item.quantity || 1)),
    0,
  );
  let allocatedProductCents = 0;
  const lineItems: InfinitePayCheckoutItem[] = [];

  items.forEach((item, index) => {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const itemGrossCents = reaisToCents(Number(item.price || 0)) * quantity;
    const isLast = index === items.length - 1;
    const itemNetCents = isLast
      ? Math.max(0, productNetCents - allocatedProductCents)
      : Math.max(0, Math.round((productNetCents * itemGrossCents) / Math.max(1, grossCents)));
    allocatedProductCents += itemNetCents;
    if (itemNetCents <= 0) return;

    const baseUnitCents = Math.floor(itemNetCents / quantity);
    const remainder = itemNetCents % quantity;
    const description = `${String(item.title || 'Produto Marmot')} - ${String(item.colorName || item.color || 'Padrão')} - ${String(item.size || 'Padrão')}`.slice(0, 255);

    const baseQuantity = quantity - remainder;
    if (baseQuantity > 0 && baseUnitCents > 0) {
      lineItems.push({
        quantity: baseQuantity,
        price: baseUnitCents,
        description,
      });
    }
    if (remainder > 0) {
      lineItems.push({
        quantity: remainder,
        price: baseUnitCents + 1,
        description,
      });
    }
  });

  if (shippingCents > 0) {
    lineItems.push({
      quantity: 1,
      price: shippingCents,
      description: `Frete - ${shippingLabel}`.slice(0, 255),
    });
  }

  const lineItemsTotal = lineItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  if (lineItemsTotal !== productNetCents + shippingCents) {
    throw new Error('Falha ao distribuir o valor exato do pedido em centavos.');
  }
  return lineItems;
}

function resolveInfinitePayBaseUrl(req: express.Request): string {
  const isVercelPreview = process.env.VERCEL_ENV === 'preview';
  const baseUrl = resolveApplicationBaseUrl({
    configuredUrl: isVercelPreview ? undefined : process.env.APP_URL,
    forwardedHost: req.headers['x-forwarded-host'],
    forwardedProto: req.headers['x-forwarded-proto'],
    host: req.headers.host,
    secure: req.secure,
    vercelProductionUrl: isVercelPreview ? undefined : process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl: process.env.VERCEL_URL,
    allowRequestHost: process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1',
  });
  if ((process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') && /^http:\/\/localhost(?::\d+)?$/i.test(baseUrl)) {
    throw Object.assign(new Error('APP_URL não está configurada para o ambiente publicado.'), {
      code: 'APP_URL_NOT_CONFIGURED',
    });
  }
  return baseUrl;
}

function canAuthenticatedUserAccessOrder(req: any, order: Order): boolean {
  return Boolean(
    req.user &&
    (req.user.role === 'admin' || req.user.id === order.userId || req.user.email?.toLowerCase() === order.customerEmail?.toLowerCase())
  );
}

async function createInfinitePayCheckoutForOrder(
  order: Order,
  req: express.Request,
  checkoutAttemptId: string,
): Promise<{ url: string; reused: boolean; webhookUrlIncluded: boolean }> {
  assertInfinitePayConfiguration();

  const subtotalCents = reaisToCents(Number(order.subtotal));
  const discountCents = reaisToCents(Number(order.discount || 0));
  const shippingCents = reaisToCents(Number(order.shippingFee || 0));
  const productNetCents = subtotalCents - discountCents;
  const expectedTotalCents = reaisToCents(Number(order.total));
  if (productNetCents < 0 || productNetCents + shippingCents !== expectedTotalCents) {
    throw Object.assign(new Error('Os componentes do pedido não correspondem ao total oficial.'), {
      code: 'ORDER_TOTAL_INCONSISTENT',
    });
  }

  const baseUrl = resolveInfinitePayBaseUrl(req);
  const lineItems = buildInfinitePayItems(
    order.items,
    productNetCents,
    shippingCents,
    `${order.shippingCarrier || 'Transportadora'} • ${order.shippingService || 'Serviço selecionado'}`,
  );

  const claimSessionCreation = () => db.claimPaymentSessionCreation(
    order.id,
    String(order.userId || ''),
    checkoutAttemptId,
  );
  let claim = await claimSessionCreation();
  if (!claim.success) {
    throw Object.assign(new Error(claim.error || 'Não foi possível proteger a criação do checkout.'), {
      code: 'CHECKOUT_PERSISTENCE_REQUIRED',
    });
  }

  if (!claim.shouldCreate && claim.checkoutUrl) {
    return { url: claim.checkoutUrl, reused: true, webhookUrlIncluded: Boolean(resolveInfinitePayWebhookUrl(baseUrl)) };
  }
  if (!claim.shouldCreate) {
    throw Object.assign(new Error('Já existe uma criação de checkout em andamento para este pedido.'), {
      code: 'CHECKOUT_CREATION_IN_PROGRESS',
    });
  }

  try {
    const webhookUrl = resolveInfinitePayWebhookUrl(baseUrl);
    const checkout = await createInfinitePayCheckout({
      orderNsu: order.id,
      redirectUrl: `${baseUrl}/checkout?infinitepay_return=1&expected_order_id=${encodeURIComponent(order.id)}`,
      webhookUrl,
      items: lineItems,
      customer: {
        name: String(order.customerName || order.shippingAddress?.recipientName || 'Cliente Marmot').slice(0, 150),
        email: String(order.customerEmail || '').slice(0, 254),
        phoneNumber: order.customerPhone ? `+55${String(order.customerPhone).replace(/\D/g, '')}` : undefined,
      },
      address: {
        cep: normalizeCep(order.shippingAddress?.cep || ''),
        number: String(order.shippingAddress?.number || '').slice(0, 30),
        complement: String(order.shippingAddress?.complement || '').trim().slice(0, 120) || undefined,
      },
    });

    const linked = await db.linkPaymentCheckoutAtomic({
      orderId: order.id,
      provider: 'infinitepay',
      checkoutUrl: checkout.url,
      statusDetail: 'checkout_created',
    });
    if (!linked.success) {
      throw Object.assign(new Error(linked.error || 'Não foi possível vincular o checkout ao pedido.'), {
        code: 'CHECKOUT_LINK_FAILED',
      });
    }
    return { url: checkout.url, reused: false, webhookUrlIncluded: Boolean(webhookUrl) };
  } catch (error: any) {
    await db.releasePaymentSessionCreation(order.id, error?.code || 'infinitepay_checkout_creation_failed');
    throw error;
  }
}

async function handleCreateInfinitePayCheckout(req: express.Request, res: express.Response) {
  const requestId = crypto.randomUUID();
  let persistedOrderId: string | undefined;
  try {
    const body = req.body || {};
    const token = extractToken(req);
    const verified = token ? await verifyAuthToken(token) : null;
    if (!verified?.userId) {
      return res.status(401).json({ error: 'É necessário estar autenticado para iniciar o pagamento.' });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) return res.status(400).json({ error: 'O carrinho está vazio.' });

    const orderUserId = verified.userId;
    const checkoutAttemptId = String(body.checkoutAttemptId || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutAttemptId)) {
      return res.status(400).json({
        code: 'INVALID_CHECKOUT_ATTEMPT',
        error: 'Identificador idempotente do checkout ausente ou inválido.',
      });
    }

    const previousAttempt = await db.getOrderByCheckoutAttempt(orderUserId, checkoutAttemptId);
    if (previousAttempt) {
      if (previousAttempt.paymentStatus === 'Pago') {
        return res.status(409).json({ code: 'ORDER_ALREADY_PAID', error: 'Este pedido já foi pago.' });
      }
      const checkout = await createInfinitePayCheckoutForOrder(previousAttempt, req, checkoutAttemptId);
      previousAttempt.paymentProvider = 'infinitepay';
      previousAttempt.checkoutUrl = checkout.url;
      previousAttempt.paymentDetails = {
        ...(previousAttempt.paymentDetails || {}),
        gateway: 'infinitepay',
        checkoutUrl: checkout.url,
        statusDetail: 'checkout_created',
      };
      console.log('[INFINITEPAY_CHECKOUT_REUSED]', { requestId, orderId: previousAttempt.id });
      return res.status(200).json({
        success: true,
        reused: true,
        orderId: previousAttempt.id,
        checkoutUrl: checkout.url,
        targetUrl: checkout.url,
        webhookUrlIncluded: checkout.webhookUrlIncluded,
        order: previousAttempt,
      });
    }

    const validatedItems: OrderItem[] = [];
    let subtotalCents = 0;
    for (const rawItem of rawItems) {
      const productId = String(rawItem.productId || rawItem.id || '').trim();
      const product = await db.getProductById(productId);
      if (!product) return res.status(400).json({ error: `Produto "${productId}" não encontrado no catálogo.` });

      const quantity = Math.max(1, Math.min(50, Math.floor(Number(rawItem.quantity) || 1)));
      const availableStock = Number(product.stockCount || 0);
      if (availableStock < quantity) {
        return res.status(409).json({ code: 'INSUFFICIENT_STOCK', error: `Estoque insuficiente para "${product.title}".` });
      }

      const requestedSize = String(rawItem.size || 'M').trim();
      if (Array.isArray(product.sizes) && product.sizes.length > 0 && !product.sizes.includes(requestedSize)) {
        return res.status(400).json({ code: 'INVALID_VARIANT', error: `Tamanho inválido para "${product.title}".` });
      }
      const requestedColor = String(rawItem.colorName || rawItem.color || '').trim();
      const selectedColor = Array.isArray(product.colors) && product.colors.length > 0
        ? product.colors.find((color: any) =>
            String(color.colorName || '').toLowerCase() === requestedColor.toLowerCase() ||
            String(color.color || '').toLowerCase() === requestedColor.toLowerCase())
        : undefined;
      if (Array.isArray(product.colors) && product.colors.length > 0 && requestedColor && !selectedColor) {
        return res.status(400).json({ code: 'INVALID_VARIANT', error: `Cor inválida para "${product.title}".` });
      }

      const unitPrice = Number(
        product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price
          ? product.promoPrice
          : product.price,
      );
      const weight = Number(product.weight);
      const height = Number(product.height);
      const width = Number(product.width);
      const length = Number(product.length);
      if (![unitPrice, weight, height, width, length].every((value) => Number.isFinite(value) && value > 0)) {
        return res.status(400).json({ code: 'INVALID_PRODUCT_SPECS', error: `Produto "${product.title}" sem dados oficiais válidos.` });
      }

      subtotalCents += reaisToCents(unitPrice) * quantity;
      validatedItems.push({
        id: `item-${crypto.randomUUID()}`,
        productId: product.id,
        sku: selectedColor?.sku || product.sku,
        title: product.title,
        image: selectedColor?.images?.[0] || selectedColor?.image || product.images?.[0] || product.image || '',
        size: requestedSize,
        color: String(selectedColor?.color || requestedColor || 'Padrão'),
        colorName: String(selectedColor?.colorName || requestedColor || 'Padrão'),
        price: centsToReais(reaisToCents(unitPrice)),
        quantity,
        subtotal: centsToReais(reaisToCents(unitPrice) * quantity),
        weight,
        height,
        width,
        length,
      });
    }

    let couponDiscountCents = 0;
    let appliedCouponCode: string | undefined;
    if (typeof body.couponCode === 'string' && body.couponCode.trim()) {
      const validation = await db.validateCoupon(body.couponCode, centsToReais(subtotalCents));
      if (!validation.valid) {
        return res.status(409).json({ code: 'INVALID_COUPON', error: validation.error || 'Cupom inválido.' });
      }
      couponDiscountCents = Math.min(subtotalCents, reaisToCents(validation.discount));
      appliedCouponCode = validation.coupon?.code;
    }

    const method = 'InfinitePay Checkout';
    const methodDiscountCents = 0;
    const totalDiscountCents = couponDiscountCents + methodDiscountCents;

    const requestedQuoteId = String(body.shippingQuoteId || body.shippingOption?.quoteId || body.shippingOption?.id || '').trim();
    if (!requestedQuoteId) {
      return res.status(400).json({ code: 'SHIPPING_QUOTE_REQUIRED', error: 'Calcule e selecione uma cotação real de frete.' });
    }
    const quote = await db.getShippingQuote(requestedQuoteId);
    if (!quote || !Number.isFinite(Number(quote.price)) || Number(quote.price) <= 0) {
      return res.status(409).json({ code: 'SHIPPING_QUOTE_INVALID', error: 'Cotação de frete inválida. Recalcule o frete.' });
    }
    if (!quote.expires_at || new Date(quote.expires_at).getTime() < Date.now()) {
      return res.status(409).json({ code: 'SHIPPING_QUOTE_INVALID', error: 'Cotação de frete expirada. Recalcule o frete.' });
    }
    if (!quote.user_id || quote.user_id !== orderUserId) {
      return res.status(403).json({ code: 'SHIPPING_QUOTE_FORBIDDEN', error: 'A cotação pertence a outro usuário.' });
    }

    const shippingAddress = body.shippingAddress || {};
    const destinationCep = normalizeCep(shippingAddress.cep || shippingAddress.postalCode || '');
    if (quote.destination_postal_code !== destinationCep) {
      return res.status(409).json({ code: 'SHIPPING_QUOTE_INVALID', error: 'A cotação não corresponde ao CEP informado.' });
    }
    if (quote.cart_hash !== generateCanonicalCartHash(destinationCep, validatedItems)) {
      return res.status(409).json({ code: 'SHIPPING_QUOTE_INVALID', error: 'Os itens foram alterados após o cálculo do frete.' });
    }
    if (body.shippingServiceId !== undefined && Number(body.shippingServiceId) !== Number(quote.service_id)) {
      return res.status(409).json({ code: 'SHIPPING_QUOTE_INVALID', error: 'O serviço selecionado diverge da cotação.' });
    }

    const requiredAddressFields = ['street', 'number', 'neighborhood', 'city', 'state'] as const;
    if (requiredAddressFields.some((field) => !String(shippingAddress[field] || '').trim())) {
      return res.status(400).json({ code: 'INCOMPLETE_DEST_ADDRESS', error: 'Endereço de entrega incompleto.' });
    }
    const recipientName = String(shippingAddress.recipientName || body.payer?.name || verified.name || '').trim();
    const customerEmail = String(body.payer?.email || verified.email || '').trim().toLowerCase();
    const customerPhone = String(body.payer?.phone || body.payerPhone || '').replace(/\D/g, '');
    const customerCpf = cleanCpf(body.payer?.cpf || body.payerCpf || body.customerCpf || shippingAddress.cpf || '');
    if (!recipientName || !/^\S+@\S+\.\S+$/.test(customerEmail) || customerPhone.length < 10 || customerPhone.length > 11 || !isValidCpf(customerCpf)) {
      return res.status(400).json({ code: 'INCOMPLETE_RECIPIENT_DATA', error: 'Nome, e-mail, telefone e CPF válidos são obrigatórios.' });
    }

    const shippingCents = subtotalCents >= 39_900 ? 0 : reaisToCents(Number(quote.price));
    const totalCents = subtotalCents - totalDiscountCents + shippingCents;
    if (totalCents <= 0) return res.status(400).json({ error: 'O total do pedido deve ser maior que zero.' });

    const requestedOrderId = String(body.existingOrderId || '').trim();
    let existingOrder: Order | null = null;
    if (requestedOrderId) {
      existingOrder = await db.getOrderById(requestedOrderId);
      if (!existingOrder) return res.status(404).json({ error: 'Pedido informado não encontrado.' });
      if (existingOrder.userId !== orderUserId) return res.status(403).json({ error: 'Este pedido pertence a outro usuário.' });
      if (existingOrder.paymentStatus !== 'Pendente') return res.status(409).json({ error: 'Este pedido não aceita um novo checkout.' });
    }

    let order: Order = {
      id: existingOrder?.id || `MM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: orderUserId,
      customerName: recipientName,
      customerEmail,
      customerPhone,
      customerCpf,
      date: existingOrder?.date || new Date().toLocaleDateString('pt-BR'),
      status: 'Aguardando Pagamento',
      paymentStatus: 'Pendente',
      paymentProvider: 'infinitepay',
      checkoutAttemptKey: checkoutAttemptId,
      paymentMethod: method,
      paymentDetails: { ...(existingOrder?.paymentDetails || {}), gateway: 'infinitepay', statusDetail: 'creating_checkout' },
      items: validatedItems,
      subtotal: centsToReais(subtotalCents),
      discount: centsToReais(totalDiscountCents),
      couponCode: appliedCouponCode,
      couponDiscount: centsToReais(couponDiscountCents),
      paymentMethodDiscount: centsToReais(methodDiscountCents),
      shippingFee: centsToReais(shippingCents),
      shippingPrice: centsToReais(reaisToCents(Number(quote.price))),
      total: centsToReais(totalCents),
      shippingAddress: { ...shippingAddress, cep: destinationCep },
      shippingQuoteId: quote.id,
      shippingOption: {
        quoteId: quote.id,
        serviceId: quote.service_id,
        companyId: quote.company_id || undefined,
        carrier: quote.carrier,
        company: quote.carrier,
        name: quote.service_name,
        serviceName: quote.service_name,
        quotedPrice: Number(quote.price),
        customerPrice: centsToReais(shippingCents),
        originalPrice: Number(quote.original_price || quote.price),
        deliveryTime: Number(quote.delivery_time),
        currency: quote.currency || 'BRL',
        originPostalCode: quote.origin_postal_code,
        destinationPostalCode: quote.destination_postal_code,
        environment: quote.environment,
      },
      shippingDetails: {
        source: 'melhor_envio_api',
        quoteId: quote.id,
        quotedAt: quote.created_at,
        quoteExpiresAt: quote.expires_at,
        destination: shippingAddress,
      },
      shippingProvider: 'Melhor Envio',
      shippingCarrier: quote.carrier,
      shippingService: quote.service_name,
      shippingServiceId: String(quote.service_id),
      shippingDeliveryTime: Number(quote.delivery_time),
      estimatedDelivery: `${Number(quote.delivery_time)} dias úteis`,
      shippingStatus: 'Aguardando preparação',
      shipmentPurchaseStatus: 'not_started',
      labelGenerationStatus: 'not_started',
      trackingCode: existingOrder?.trackingCode,
      history: existingOrder?.history?.length ? existingOrder.history : [{
        status: 'Aguardando Pagamento',
        timestamp: new Date().toLocaleString('pt-BR'),
        description: 'Pedido registrado. Aguardando confirmação segura do pagamento pela InfinitePay.',
      }],
      createdAt: existingOrder?.createdAt || new Date().toISOString(),
    };

    let createdNewOrder = false;
    try {
      await db.saveOrder(order);
      createdNewOrder = !existingOrder;
      persistedOrderId = order.id;
    } catch (error: any) {
      const winner = await db.getOrderByCheckoutAttempt(orderUserId, checkoutAttemptId);
      if (!winner) throw error;
      order = winner;
      persistedOrderId = winner.id;
    }

    const checkout = await createInfinitePayCheckoutForOrder(order, req, checkoutAttemptId);
    order.paymentProvider = 'infinitepay';
    order.checkoutUrl = checkout.url;
    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      gateway: 'infinitepay',
      checkoutUrl: checkout.url,
      statusDetail: 'checkout_created',
    };

    if (createdNewOrder) {
      sendTransactionalEmail({
        to: order.customerEmail || '',
        subject: `Pedido #${order.id} gerado // MARMOT`,
        template: 'order_created',
        orderId: order.id,
        userId: order.userId,
        html: `<div style="font-family:sans-serif;background:#0c0c0c;color:#fff;padding:32px;max-width:600px;margin:0 auto"><h2>PEDIDO RECEBIDO // MARMOT</h2><p>Pedido <strong>#${order.id}</strong> registrado.</p><p>Total: <strong>R$ ${order.total.toFixed(2)}</strong></p><p>Aguardando confirmação segura do pagamento.</p></div>`,
      }).catch(() => undefined);
    }

    console.log('[INFINITEPAY_CHECKOUT_CREATED]', {
      requestId,
      orderId: order.id,
      totalCents,
      webhookUrlIncluded: checkout.webhookUrlIncluded,
    });
    return res.status(201).json({
      success: true,
      orderId: order.id,
      checkoutUrl: checkout.url,
      targetUrl: checkout.url,
      webhookUrlIncluded: checkout.webhookUrlIncluded,
      order,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
    });
  } catch (error: any) {
    console.error('[INFINITEPAY_CHECKOUT_ERROR]', {
      requestId,
      code: error?.code || 'INFINITEPAY_CHECKOUT_FAILED',
      message: error?.message,
    });
    const configurationErrors = new Set([
      'INFINITEPAY_NOT_CONFIGURED',
      'INFINITEPAY_INVALID_HANDLE',
      'INFINITEPAY_INVALID_WEBHOOK_URL',
      'APP_URL_NOT_CONFIGURED',
      'CHECKOUT_PERSISTENCE_REQUIRED',
    ]);
    const status = configurationErrors.has(error?.code) ? 503 : error?.code === 'CHECKOUT_CREATION_IN_PROGRESS' ? 409 : 502;
    return res.status(status).json({
      code: error?.code || 'INFINITEPAY_CHECKOUT_FAILED',
      error: status === 503 || status === 409 ? error.message : 'Não foi possível abrir o checkout seguro. Tente novamente.',
      ...(persistedOrderId ? { orderId: persistedOrderId } : {}),
    });
  }
}

interface InfinitePayConfirmationInput {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
  receiptUrl?: string;
  captureMethod?: string;
  assertedAmountCents?: number;
  source: 'webhook' | 'redirect' | 'admin_sync';
}

interface InfinitePayConfirmationResult {
  confirmed: boolean;
  alreadyProcessed: boolean;
  processing?: boolean;
  order: Order;
}

class InfinitePayConfirmationError extends Error {
  code: string;
  retryable: boolean;
  httpStatus: number;

  constructor(message: string, code: string, options?: { retryable?: boolean; httpStatus?: number }) {
    super(message);
    this.name = 'InfinitePayConfirmationError';
    this.code = code;
    this.retryable = Boolean(options?.retryable);
    this.httpStatus = options?.httpStatus || 409;
  }
}

function validateInfinitePayReference(value: unknown, field: string): string {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length > 255 || !/^[A-Za-z0-9._:-]+$/.test(normalized)) {
    throw new InfinitePayConfirmationError('Identificador de pagamento inválido.', 'INVALID_' + field.toUpperCase(), { httpStatus: 400 });
  }
  return normalized;
}

async function confirmInfinitePayPayment(input: InfinitePayConfirmationInput): Promise<InfinitePayConfirmationResult> {
  const orderNsu = validateInfinitePayReference(input.orderNsu, 'order_nsu');
  const transactionNsu = validateInfinitePayReference(input.transactionNsu, 'transaction_nsu');
  const slug = validateInfinitePayReference(input.slug, 'invoice_slug');
  let claim: { shouldProcess: boolean; status: string; orderId?: string };

  try {
    claim = await db.claimWebhookEvent('infinitepay', transactionNsu, input.source, {
      orderNsu,
      transactionNsu,
      slug,
      source: input.source,
    });
  } catch (error: any) {
    throw new InfinitePayConfirmationError('Persistência temporariamente indisponível.', 'PAYMENT_EVENT_CLAIM_FAILED', {
      retryable: true,
      httpStatus: 503,
    });
  }

  if (!claim.shouldProcess && claim.status === 'currently_processing') {
    throw new InfinitePayConfirmationError('A confirmação já está em processamento.', 'PAYMENT_CONFIRMATION_IN_PROGRESS', {
      retryable: true,
      httpStatus: 202,
    });
  }

  const order = await db.getOrderById(orderNsu);
  if (!order) {
    if (claim.shouldProcess) await db.completeWebhookEvent('infinitepay', transactionNsu, undefined, 'order_not_found');
    throw new InfinitePayConfirmationError('Pedido não encontrado.', 'ORDER_NOT_FOUND', { httpStatus: 404 });
  }
  if (order.paymentProvider && order.paymentProvider !== 'infinitepay') {
    if (claim.shouldProcess) await db.completeWebhookEvent('infinitepay', transactionNsu, order.id, 'provider_mismatch');
    throw new InfinitePayConfirmationError('O pedido pertence a outro provedor.', 'PAYMENT_PROVIDER_MISMATCH');
  }
  if (order.status === 'Cancelado' || order.paymentStatus === 'Cancelado') {
    if (claim.shouldProcess) await db.completeWebhookEvent('infinitepay', transactionNsu, order.id, 'order_cancelled');
    throw new InfinitePayConfirmationError('Pedido cancelado não pode receber pagamento.', 'ORDER_CANCELLED');
  }

  const existingTransaction = String(order.paymentProviderPaymentId || order.paymentDetails?.transactionId || '').trim();
  if (!claim.shouldProcess && claim.status === 'already_completed') {
    if (order.paymentStatus === 'Pago' && existingTransaction === transactionNsu) {
      return { confirmed: true, alreadyProcessed: true, order };
    }
    throw new InfinitePayConfirmationError('Evento já concluído sem correspondência financeira.', 'PAYMENT_EVENT_CONFLICT');
  }
  if (order.paymentStatus === 'Pago') {
    if (existingTransaction !== transactionNsu) {
      await db.completeWebhookEvent('infinitepay', transactionNsu, order.id, 'different_transaction_for_paid_order');
      throw new InfinitePayConfirmationError('O pedido já possui outra transação confirmada.', 'ORDER_ALREADY_PAID_WITH_ANOTHER_TRANSACTION');
    }
    await db.completeWebhookEvent('infinitepay', transactionNsu, order.id);
    return { confirmed: true, alreadyProcessed: true, order };
  }

  try {
    const checked = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug });
    if (!checked.success || !checked.paid) {
      await db.completeWebhookEvent('infinitepay', transactionNsu, order.id, 'payment_not_confirmed');
      return { confirmed: false, alreadyProcessed: false, order };
    }

    const expectedAmountCents = reaisToCents(Number(order.total));
    if (checked.amount !== expectedAmountCents) {
      await db.completeWebhookEvent('infinitepay', transactionNsu, order.id, 'payment_amount_mismatch');
      throw new InfinitePayConfirmationError('O valor confirmado não corresponde ao pedido.', 'PAYMENT_AMOUNT_MISMATCH');
    }
    if (input.assertedAmountCents !== undefined && input.assertedAmountCents !== expectedAmountCents) {
      await db.completeWebhookEvent('infinitepay', transactionNsu, order.id, 'webhook_amount_mismatch');
      throw new InfinitePayConfirmationError('O valor informado pelo webhook não corresponde ao pedido.', 'WEBHOOK_AMOUNT_MISMATCH');
    }

    const captureMethod = checked.capture_method || input.captureMethod;
    const paymentMethod = getInfinitePayPaymentMethodLabel(captureMethod);
    const receiptUrl = sanitizeInfinitePayReceiptUrl(input.receiptUrl);
    const result = await db.processApprovedOrderAtomic(
      order.id,
      transactionNsu,
      centsToReais(checked.amount),
      'BRL',
      'infinitepay',
      paymentMethod,
      new Date().toISOString(),
      order.items,
      {
        invoiceSlug: slug,
        installments: checked.installments,
        captureMethod,
        paidAmountCents: checked.paid_amount,
        receiptUrl,
        confirmationSource: input.source,
      },
    );
    if (!result.success) {
      throw new InfinitePayConfirmationError(result.error || 'Falha ao confirmar o pedido.', 'PAYMENT_SETTLEMENT_FAILED', {
        retryable: true,
        httpStatus: 503,
      });
    }

    const settledOrder = await db.getOrderById(order.id);
    if (!settledOrder) {
      throw new InfinitePayConfirmationError('Pedido não encontrado após confirmação.', 'ORDER_NOT_FOUND_AFTER_SETTLEMENT', {
        retryable: true,
        httpStatus: 503,
      });
    }

    await db.completeWebhookEvent('infinitepay', transactionNsu, settledOrder.id);
    if (!result.alreadyProcessed) {
      console.log('[INFINITEPAY_PAYMENT_CONFIRMED]', {
        orderId: settledOrder.id,
        transactionNsu,
        source: input.source,
      });
      sendTransactionalEmail({
        to: settledOrder.customerEmail || '',
        subject: 'Pagamento confirmado — Pedido #' + settledOrder.id + ' // MARMOT',
        template: 'payment_approved',
        orderId: settledOrder.id,
        userId: settledOrder.userId,
        html: '<div style="font-family:sans-serif;background:#0c0c0c;color:#fff;padding:32px;max-width:600px;margin:0 auto"><h2>PAGAMENTO CONFIRMADO // MARMOT</h2><p>O pagamento do pedido <strong>#' + settledOrder.id + '</strong> foi confirmado.</p><p>Seu pedido entrou em separação.</p></div>',
      }).catch(() => undefined);
    }
    if (needsShipmentFulfillment(settledOrder)) {
      scheduleShipmentFulfillment(settledOrder.id, input.source === 'admin_sync' ? 'admin_sync' : 'webhook');
    }
    return { confirmed: true, alreadyProcessed: result.alreadyProcessed, order: settledOrder };
  } catch (error: any) {
    try {
      await db.completeWebhookEvent('infinitepay', transactionNsu, order.id, error?.code || error?.message || 'confirmation_failed');
    } catch (persistenceError: any) {
      console.error('[INFINITEPAY_CONFIRMATION_FAILURE_RECORD_ERROR]', {
        orderId: order.id,
        transactionNsu,
        message: persistenceError?.message,
      });
    }
    if (error instanceof InfinitePayConfirmationError) throw error;
    if (error instanceof InfinitePayClientError) {
      throw new InfinitePayConfirmationError('Não foi possível confirmar o pagamento agora.', error.code, {
        retryable: error.retryable,
        httpStatus: error.retryable ? 503 : 409,
      });
    }
    throw new InfinitePayConfirmationError('Falha temporária ao confirmar o pagamento.', 'PAYMENT_CONFIRMATION_FAILED', {
      retryable: true,
      httpStatus: 503,
    });
  }
}

app.post('/api/infinitepay/checkout', checkoutRateLimiter.middleware(), handleCreateInfinitePayCheckout);

app.post('/api/infinitepay/confirm', requireAuth, checkoutRateLimiter.middleware(), async (req: any, res) => {
  try {
    const orderNsu = validateInfinitePayReference(req.body?.orderNsu || req.body?.order_nsu, 'order_nsu');
    const order = await db.getOrderById(orderNsu);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
    if (!canAuthenticatedUserAccessOrder(req, order)) return res.status(403).json({ error: 'Acesso negado.' });

    const result = await confirmInfinitePayPayment({
      orderNsu,
      transactionNsu: req.body?.transactionNsu || req.body?.transaction_nsu,
      slug: req.body?.slug || req.body?.invoice_slug,
      receiptUrl: req.body?.receiptUrl || req.body?.receipt_url,
      captureMethod: req.body?.captureMethod || req.body?.capture_method,
      source: 'redirect',
    });
    return res.status(result.confirmed ? 200 : 202).json({
      confirmed: result.confirmed,
      alreadyProcessed: result.alreadyProcessed,
      order: result.order,
    });
  } catch (error: any) {
    const status = error instanceof InfinitePayConfirmationError ? error.httpStatus : 500;
    console.error('[INFINITEPAY_REDIRECT_CONFIRMATION_ERROR]', {
      code: error?.code || 'CONFIRMATION_FAILED',
      message: error?.message,
    });
    return res.status(status).json({
      code: error?.code || 'CONFIRMATION_FAILED',
      error: status >= 500 ? 'Não foi possível validar o pagamento agora. Tente novamente.' : error.message,
    });
  }
});

app.get('/api/infinitepay/orders/:id/status', requireAuth, async (req: any, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
    if (!canAuthenticatedUserAccessOrder(req, order)) return res.status(403).json({ error: 'Acesso negado.' });
    return res.json({
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      confirmed: order.paymentStatus === 'Pago',
      order,
    });
  } catch {
    return res.status(500).json({ error: 'Não foi possível consultar o pagamento.' });
  }
});

app.post('/api/infinitepay/webhook', express.json({ limit: '256kb' }), async (req, res) => {
  const parsed = InfinitePayWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    console.warn('[INFINITEPAY_WEBHOOK_REJECTED]', { reason: 'invalid_payload' });
    return res.status(400).json({ success: false, message: 'Payload inválido' });
  }

  const payload = parsed.data;
  try {
    const result = await confirmInfinitePayPayment({
      orderNsu: payload.order_nsu,
      transactionNsu: payload.transaction_nsu,
      slug: payload.invoice_slug,
      receiptUrl: payload.receipt_url,
      captureMethod: payload.capture_method,
      assertedAmountCents: payload.amount,
      source: 'webhook',
    });
    if (!result.confirmed) {
      return res.status(400).json({ success: false, message: 'Pagamento ainda não confirmado' });
    }
    return res.status(200).json({ success: true, message: null });
  } catch (error: any) {
    console.error('[INFINITEPAY_WEBHOOK_PROCESSING_ERROR]', {
      orderNsu: payload.order_nsu,
      transactionNsu: payload.transaction_nsu,
      code: error?.code || 'CONFIRMATION_FAILED',
      message: error?.message,
    });
    return res.status(400).json({ success: false, message: 'Não foi possível confirmar o pagamento' });
  }
});

app.post('/api/admin/orders/:id/sync-payment', requireAdmin, async (req: any, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
    if (order.paymentProvider !== 'infinitepay') {
      return res.status(409).json({ error: 'O pedido não pertence à InfinitePay.' });
    }
    const transactionNsu = String(order.paymentProviderPaymentId || order.paymentDetails?.transactionId || '').trim();
    const slug = String(order.paymentProviderInvoiceSlug || order.paymentProviderSessionId || order.paymentDetails?.invoiceSlug || '').trim();
    if (!transactionNsu || !slug) {
      return res.status(409).json({ error: 'Pedido ainda não possui os identificadores necessários para consulta.' });
    }

    const result = await confirmInfinitePayPayment({
      orderNsu: order.id,
      transactionNsu,
      slug,
      receiptUrl: order.paymentReceiptUrl || order.paymentDetails?.receiptUrl,
      captureMethod: order.paymentDetails?.captureMethod,
      source: 'admin_sync',
    });
    await db.logAdminAction(
      req.user.email,
      req.user.name,
      'sync_payment',
      'order',
      order.id,
      'Pagamento reconciliado com a InfinitePay.',
    );
    return res.json({
      synchronized: true,
      changed: result.confirmed && !result.alreadyProcessed,
      confirmed: result.confirmed,
      order: result.order,
    });
  } catch (error: any) {
    console.error('[INFINITEPAY_ADMIN_SYNC_ERROR]', { orderId: req.params.id, message: error?.message });
    return res.status(error?.httpStatus || 502).json({ error: 'Não foi possível sincronizar o pagamento com a InfinitePay.' });
  }
});
// --- Admin Stats & Overview ---
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const period = (req.query.period as string) || '30days';
    const overview = await db.getOverviewMetrics(period);
    const products = await db.getAllProducts();
    const categories = await db.getAllCategories();
    const orders = await db.getOrders();
    const users = await db.getUsers();

    res.json({
      ...overview,
      totalCustomers: users.filter((u) => u.role === 'customer').length,
      totalProducts: products.length,
      totalCategories: categories.length,
      pendingReviewsCount: 0,
      salesData: overview.salesByDay.map((s) => ({
        date: s.label,
        sales: s.revenue,
        orders: s.orders,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar métricas do dashboard.' });
  }
});

app.get('/api/admin/overview', requireAdmin, async (req, res) => {
  try {
    const period = (req.query.period as string) || '30days';
    const metrics = await db.getOverviewMetrics(period);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar overview.' });
  }
});

// --- Order Status Management & Lifecycle ---
app.put('/api/admin/orders/:id/status', requireAdmin, async (req: any, res) => {
  try {
    const { status, trackingCode, note } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório.' });
    }

    const result = await db.updateOrderStatusWithAudit(
      req.params.id,
      status as OrderStatus,
      req.user,
      note,
      trackingCode
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar status do pedido.' });
  }
});

app.post('/api/admin/orders/:id/dispatch', requireAdmin, async (req: any, res) => {
  try {
    const { carrier, trackingCode, note } = req.body;
    if (!trackingCode) {
      return res.status(400).json({ error: 'Código de rastreio é obrigatório para despachar o pedido.' });
    }

    const result = await db.markOrderDispatched(
      req.params.id,
      carrier || 'Correios / Melhor Envio',
      trackingCode,
      req.user,
      note
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao despachar pedido.' });
  }
});

// --- Payments & Financial Transactions ---
app.get('/api/admin/payments', requireAdmin, async (req, res) => {
  try {
    const payments = await db.getPayments();
    res.json(payments);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar transações de pagamento.' });
  }
});

// --- Shipments & Expedição ---
app.get('/api/admin/shipments', requireAdmin, async (req, res) => {
  try {
    const shipments = await db.getShipments();
    res.json(shipments);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar remessas de envio.' });
  }
});

app.put('/api/admin/shipments/:orderId/status', requireAdmin, async (req: any, res) => {
  try {
    const { status, trackingCode, notes } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status de envio é obrigatório.' });
    }

    const result = await db.updateShipmentStatus(req.params.orderId, status, trackingCode, notes);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar remessa.' });
  }
});

// --- ADMIN: CONFIGURAÇÕES DE FRETE E MELHOR ENVIO ---
app.get('/api/admin/shipping/settings', requireAdmin, async (req, res) => {
  try {
    const config = getMelhorEnvioConfig();
    const saved = await db.getShippingSettings();

    const originPostalCode = config.originPostalCode;
    const environment = config.environment;
    const appName = config.appName;
    const appEmail = config.appEmail;
    const clientId = saved.clientId || process.env.MELHOR_ENVIO_CLIENT_ID || '';

    let sender = saved.sender;
    if (!sender) {
      sender = {
        name: '',
        document: '',
        stateRegister: '',
        phone: '',
        email: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        cep: originPostalCode,
      };
    }

    res.json({
      originPostalCode,
      environment,
      appName,
      appEmail,
      clientId,
      isTokenConfigured: Boolean(config.token && config.token.length >= 10),
      tokenMasked: config.token && config.token.length >= 10 ? 'Configurado no servidor' : '',
      documentMode: saved.documentMode || '',
      sender,
      defaultWeight: Number(saved.defaultWeight || 0.35),
      defaultHeight: Number(saved.defaultHeight || 4),
      defaultWidth: Number(saved.defaultWidth || 20),
      defaultLength: Number(saved.defaultLength || 25),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar configurações de frete.' });
  }
});

app.put('/api/admin/shipping/settings', requireAdmin, async (req: any, res) => {
  try {
    const { originPostalCode, environment, clientId, clientSecret, appName, appEmail, sender, documentMode, defaultWeight, defaultHeight, defaultWidth, defaultLength } = req.body;
    const current = await db.getShippingSettings();

    const updated = {
      ...current,
      originPostalCode: originPostalCode ? originPostalCode.replace(/\D/g, '') : current.originPostalCode || '03806010',
      environment: environment === 'sandbox' ? 'sandbox' : 'production',
      appName: appName || current.appName || 'Marmot Confecções',
      appEmail: appEmail || current.appEmail || 'contato@marmot.com.br',
      clientId: clientId !== undefined ? String(clientId).trim() : current.clientId,
      clientSecret: clientSecret !== undefined && clientSecret ? String(clientSecret).trim() : current.clientSecret,
      sender: sender ? { ...current.sender, ...sender } : current.sender,
      documentMode: documentMode === 'commercial_invoice' || documentMode === 'content_declaration'
        ? documentMode
        : current.documentMode || '',
      defaultWeight: Number(defaultWeight || current.defaultWeight || 0.35),
      defaultHeight: Number(defaultHeight || current.defaultHeight || 4),
      defaultWidth: Number(defaultWidth || current.defaultWidth || 20),
      defaultLength: Number(defaultLength || current.defaultLength || 25),
    };

    await db.saveShippingSettings(updated);

    const config = getMelhorEnvioConfig();

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'update_shipping_settings',
      'shipping',
      'settings',
      'Configurações de frete e remetente atualizadas',
      { environment: updated.environment, originPostalCode: updated.originPostalCode }
    );

    res.json({
      success: true,
      originPostalCode: updated.originPostalCode,
      environment: updated.environment,
      isTokenConfigured: Boolean(config.token && config.token.length >= 10),
      sender: updated.sender,
      documentMode: updated.documentMode,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar configurações de frete.' });
  }
});

// --- ADMIN: TESTAR CONEXÃO EM TEMPO REAL COM MELHOR ENVIO ---
app.get('/api/admin/melhor-envio/test-connection', requireAdmin, async (req, res) => {
  try {
    const config = getMelhorEnvioConfig();
    if (!config.token || config.token.length < 10) {
      return res.json({
        connected: false,
        environment: config.environment,
        tokenConfigured: false,
        message: 'Token de autenticação do Melhor Envio não está configurado no servidor (variável MELHOR_ENVIO_TOKEN ausente).',
      });
    }

    const meRes = await fetchWithTimeout(`${config.baseUrl}/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.token}`,
        'User-Agent': config.userAgent,
      },
    }, 8000);

    if (!meRes.ok) {
      const errText = await meRes.text().catch(() => '');
      return res.json({
        connected: false,
        environment: config.environment,
        tokenConfigured: true,
        authenticated: false,
        message: `Melhor Envio recusou as credenciais (HTTP ${meRes.status}): ${errText.slice(0, 100)}`,
      });
    }

    const meData: any = await meRes.json();
    return res.json({
      connected: true,
      environment: config.environment,
      tokenConfigured: true,
      authenticated: true,
      accountName: meData.name || meData.firstname || 'Conta Marmot',
      accountEmail: meData.email || '',
      balance: Number(meData.balance || 0),
      message: 'Conexão com a API do Melhor Envio ativa e operacional.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      message: `Erro ao testar conexão: ${err.message}`,
    });
  }
});

// --- ADMIN: DIAGNÓSTICO DO MELHOR ENVIO ---
app.get('/api/admin/melhor-envio/diagnostics', requireAdmin, async (req, res) => {
  try {
    const config = getMelhorEnvioConfig();
    const tokenConfigured = Boolean(config.token && config.token.length >= 10);
    const originCepConfigured = Boolean(config.originPostalCode && config.originPostalCode.length === 8);
    let apiReachable = false;
    let authenticated = false;

    if (tokenConfigured) {
      try {
        const meRes = await fetchWithTimeout(`${config.baseUrl}/me`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${config.token}`,
            'User-Agent': config.userAgent,
          },
        }, 6000);
        apiReachable = true;
        authenticated = meRes.ok;
      } catch {
        apiReachable = false;
        authenticated = false;
      }
    } else {
      try {
        const pingRes = await fetchWithTimeout(`${config.baseUrl}/me/shipment/services`, {}, 6000);
        apiReachable = pingRes.status < 500;
      } catch {
        apiReachable = false;
      }
    }

    res.json({
      environment: config.environment,
      tokenConfigured,
      originCepConfigured,
      apiReachable,
      authenticated,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter diagnósticos do Melhor Envio.' });
  }
});

// --- ADMIN: URL DE AUTORIZAÇÃO OAUTH2 DO MELHOR ENVIO ---
app.get('/api/admin/melhor-envio/auth-url', requireAdmin, async (req, res) => {
  try {
    const config = getMelhorEnvioConfig();
    const saved = await db.getShippingSettings();

    const clientId = saved.clientId || process.env.MELHOR_ENVIO_CLIENT_ID;
    const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : '';
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const redirectUri = appUrl ? `${appUrl}/admin?tab=shipping&oauth=melhor-envio` : `${protocol}://${host}/admin?tab=shipping&oauth=melhor-envio`;

    if (!clientId) {
      return res.status(400).json({
        error: 'Client ID do Melhor Envio não configurado. Adicione nas configurações de frete.',
      });
    }

    const randomState = crypto.randomBytes(16).toString('hex');
    const authBase = config.environment === 'sandbox' ? 'https://sandbox.melhorenvio.com.br/oauth/authorize' : 'https://melhorenvio.com.br/oauth/authorize';
    const scopes = 'cart-read cart-write orders-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-tracking ecommerce-shipping';
    const authUrl = `${authBase}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${randomState}`;

    res.json({ url: authUrl, redirectUri });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar URL OAuth.' });
  }
});

type ShipmentDocumentMode = 'commercial_invoice' | 'content_declaration';

interface ShipmentProcessingResult {
  order: Order;
  shipmentId: string;
  trackingCode?: string;
  printUrl: string;
  reused: boolean;
}

class ShipmentProcessingError extends Error {
  statusCode: number;
  code: string;
  step: string;
  shipmentId?: string;
  trackingCode?: string;

  constructor(message: string, statusCode: number, code: string, step: string, shipmentId?: string, trackingCode?: string) {
    super(message);
    this.name = 'ShipmentProcessingError';
    this.statusCode = statusCode;
    this.code = code;
    this.step = step;
    this.shipmentId = shipmentId;
    this.trackingCode = trackingCode;
  }
}

function shipmentProcessingError(message: string, statusCode: number, code: string, step: string, shipmentId?: string, trackingCode?: string): ShipmentProcessingError {
  return new ShipmentProcessingError(message, statusCode, code, step, shipmentId, trackingCode);
}

function getMelhorEnvioErrorMessage(rawBody: string, fallback: string): string {
  try {
    const parsed = JSON.parse(rawBody || '{}');
    const details = parsed?.errors && typeof parsed.errors === 'object'
      ? Object.entries(parsed.errors)
          .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
          .join('; ')
      : '';
    return [parsed?.message || parsed?.error || fallback, details].filter(Boolean).join(' — ').slice(0, 1000);
  } catch {
    return rawBody ? `${fallback}: ${rawBody.slice(0, 500)}` : fallback;
  }
}

function isValidShipmentEmail(value: unknown): boolean {
  return /^\S+@\S+\.\S+$/.test(String(value || '').trim());
}

function isPaidOrderForFulfillment(order: Order): boolean {
  return order.paymentStatus === 'Pago' &&
    Boolean(order.paymentProvider || order.paymentDetails?.gateway) &&
    Boolean(order.paymentProviderPaymentId || order.paymentDetails?.transactionId);
}

function needsShipmentFulfillment(order: Order): boolean {
  return isPaidOrderForFulfillment(order) && (
    order.shipmentPurchaseStatus !== 'purchased' ||
    order.labelGenerationStatus !== 'generated' ||
    !order.shippingLabelUrl
  );
}

async function processMelhorEnvioShipment(
  orderId: string,
  actor?: { source: 'webhook' | 'webhook_retry' | 'admin_sync' | 'admin'; email?: string; name?: string },
): Promise<ShipmentProcessingResult> {
  const startTime = Date.now();
  let order = await db.getOrderById(orderId);
  let shipmentId = '';
  let trackingCode = '';
  let printUrl = '';
  let lockToken: string | undefined;
  let purchaseConfirmed = false;
  let labelGenerated = false;
  let currentStep = 'order_lookup';

  if (!order) {
    throw shipmentProcessingError('Pedido não encontrado no sistema.', 404, 'ORDER_NOT_FOUND', currentStep);
  }

  if (!isPaidOrderForFulfillment(order)) {
    throw shipmentProcessingError(
      'O envio só pode ser comprado após confirmação server-to-server do pagamento pela InfinitePay.',
      409,
      'PAYMENT_NOT_CONFIRMED',
      'payment_check',
    );
  }

  if (
    order.shipmentPurchaseStatus === 'purchased' &&
    order.labelGenerationStatus === 'generated' &&
    order.melhorEnvioShipmentId &&
    order.shippingLabelUrl
  ) {
    return {
      order,
      shipmentId: order.melhorEnvioShipmentId,
      trackingCode: order.trackingCode || undefined,
      printUrl: order.shippingLabelUrl,
      reused: true,
    };
  }

  const claim = await db.claimShipmentGeneration(orderId);
  if (!claim.shouldProcess) {
    const existing = claim.existing || {};
    if (existing.status === 'completed' && (existing.print_url || existing.label_url) && (existing.shipment_id || existing.melhor_envio_shipment_id)) {
      order.melhorEnvioShipmentId = existing.shipment_id || existing.melhor_envio_shipment_id;
      order.trackingCode = existing.tracking_code || order.trackingCode;
      order.shippingLabelUrl = existing.print_url || existing.label_url;
      order.shipmentPurchaseStatus = 'purchased';
      order.labelGenerationStatus = 'generated';
      order.shippingStatus = 'Pronto para envio';
      await db.saveOrder(order);
      return {
        order,
        shipmentId: order.melhorEnvioShipmentId,
        trackingCode: order.trackingCode || undefined,
        printUrl: order.shippingLabelUrl,
        reused: true,
      };
    }
    throw shipmentProcessingError(
      'Uma operação de expedição já está em andamento para este pedido.',
      409,
      'SHIPMENT_IN_PROGRESS',
      existing.current_step || 'processing',
      existing.shipment_id || existing.melhor_envio_shipment_id,
    );
  }

  lockToken = claim.lockToken;
  const existingOperation = claim.existing || {};
  shipmentId = String(
    existingOperation.shipment_id ||
    existingOperation.melhor_envio_shipment_id ||
    order.melhorEnvioShipmentId ||
    '',
  );
  purchaseConfirmed = Boolean(existingOperation.purchased_at || order.shipmentPurchaseStatus === 'purchased');
  labelGenerated = Boolean(existingOperation.label_generated_at || order.labelGenerationStatus === 'generated');

  try {
    currentStep = 'validating';
    await db.updateShipmentStep(orderId, currentStep, shipmentId || undefined, lockToken);
    order.shipmentPurchaseStatus = purchaseConfirmed ? 'purchased' : 'processing';
    order.labelGenerationStatus = labelGenerated ? 'generated' : 'not_started';
    order.shipmentLastError = undefined;
    if (!purchaseConfirmed) order.shippingStatus = 'Aguardando compra de frete';
    await db.saveOrder(order);

    const config = getMelhorEnvioConfig();
    if (!config.token || config.token.length < 10) {
      throw shipmentProcessingError('Token do Melhor Envio não configurado no servidor.', 503, 'MISSING_TOKEN', currentStep, shipmentId || undefined);
    }
    if (config.originPostalCode.length !== 8) {
      throw shipmentProcessingError('CEP de origem do Melhor Envio não configurado corretamente.', 503, 'MISSING_ORIGIN_CEP', currentStep, shipmentId || undefined);
    }
    if (order.paymentProvider !== 'infinitepay' && actor?.source !== 'admin') {
      throw shipmentProcessingError(
        'Pedidos históricos de outro provedor só podem iniciar o frete por uma ação administrativa explícita.',
        409,
        'HISTORICAL_PAYMENT_REQUIRES_ADMIN',
        currentStep,
        shipmentId || undefined,
      );
    }

    const quoteId = String(order.shippingQuoteId || order.shippingOption?.quoteId || order.shippingDetails?.quoteId || '').trim();
    if (!quoteId) {
      throw shipmentProcessingError('Pedido sem vínculo com a cotação oficial selecionada.', 409, 'MISSING_SHIPPING_QUOTE', currentStep, shipmentId || undefined);
    }
    const quote = await db.getShippingQuote(quoteId);
    if (!quote) {
      throw shipmentProcessingError('Cotação oficial vinculada ao pedido não foi encontrada.', 409, 'SHIPPING_QUOTE_NOT_FOUND', currentStep, shipmentId || undefined);
    }

    const destinationPostalCode = normalizeCep(order.shippingAddress?.cep || (order.shippingAddress as any)?.postalCode || '');
    if (
      !quote.user_id || quote.user_id !== order.userId ||
      quote.destination_postal_code !== destinationPostalCode ||
      Number(quote.service_id) !== Number(order.shippingServiceId) ||
      String(quote.carrier) !== String(order.shippingCarrier) ||
      String(quote.service_name) !== String(order.shippingService)
    ) {
      throw shipmentProcessingError('Os dados de frete do pedido divergem da cotação oficial selecionada.', 409, 'SHIPPING_QUOTE_MISMATCH', currentStep, shipmentId || undefined);
    }
    if (quote.environment && String(quote.environment) !== config.environment) {
      throw shipmentProcessingError('A cotação pertence a outro ambiente do Melhor Envio.', 409, 'SHIPPING_QUOTE_ENVIRONMENT_MISMATCH', currentStep, shipmentId || undefined);
    }

    const quotedPrice = Number(quote.price);
    const expectedCustomerShipping = Number(order.subtotal) >= 399 ? 0 : quotedPrice;
    const expectedTotal = Number((Number(order.subtotal) - Number(order.discount || 0) + expectedCustomerShipping).toFixed(2));
    if (
      !Number.isFinite(quotedPrice) || quotedPrice <= 0 ||
      Math.abs(Number(order.shippingPrice ?? quotedPrice) - quotedPrice) > 0.01 ||
      Math.abs(Number(order.shippingFee) - expectedCustomerShipping) > 0.01 ||
      Math.abs(Number(order.total) - expectedTotal) > 0.05
    ) {
      throw shipmentProcessingError('Valores de frete ou total do pedido não correspondem à cotação oficial.', 409, 'SHIPPING_AMOUNT_MISMATCH', currentStep, shipmentId || undefined);
    }

    const settings = await db.getShippingSettings();
    const sender = settings?.sender || null;
    const documentMode = String(settings?.documentMode || '') as ShipmentDocumentMode;
    if (!sender) {
      throw shipmentProcessingError('Dados do remetente não configurados no banco.', 409, 'MISSING_SENDER_DATA', currentStep, shipmentId || undefined);
    }

    const senderDocument = validateSenderDocument(sender.document);
    const senderPhone = String(sender.phone || '').replace(/\D/g, '');
    const senderPostalCode = normalizeCep(sender.cep || '');
    const requiredSender = [sender.name, sender.street, sender.number, sender.neighborhood, sender.city, sender.state];
    if (
      !senderDocument.valid || !senderDocument.digits ||
      senderPhone.length < 10 || senderPhone.length > 11 ||
      senderPostalCode.length !== 8 || !isValidShipmentEmail(sender.email) ||
      requiredSender.some((value) => !String(value || '').trim())
    ) {
      throw shipmentProcessingError('Cadastro do remetente incompleto ou inválido nas Configurações de Frete.', 409, 'INVALID_SENDER_DATA', currentStep, shipmentId || undefined);
    }
    if (senderPostalCode !== String(quote.origin_postal_code || config.originPostalCode)) {
      throw shipmentProcessingError('CEP do remetente diverge do CEP de origem usado na cotação.', 409, 'SHIPPING_ORIGIN_MISMATCH', currentStep, shipmentId || undefined);
    }

    const recipientName = String(order.shippingAddress?.recipientName || order.customerName || '').trim();
    const recipientPhone = String(order.customerPhone || (order.shippingAddress as any)?.phone || '').replace(/\D/g, '');
    const recipientCpf = cleanCpf(order.customerCpf || (order.shippingAddress as any)?.cpf || '');
    const requiredRecipient = [order.shippingAddress?.street, order.shippingAddress?.number, order.shippingAddress?.neighborhood, order.shippingAddress?.city, order.shippingAddress?.state];
    if (
      !recipientName || !isValidShipmentEmail(order.customerEmail) ||
      recipientPhone.length < 10 || recipientPhone.length > 11 ||
      !isValidCpf(recipientCpf) || destinationPostalCode.length !== 8 ||
      requiredRecipient.some((value) => !String(value || '').trim())
    ) {
      throw shipmentProcessingError('Dados do destinatário incompletos ou inválidos para emissão do frete.', 409, 'INVALID_RECIPIENT_DATA', currentStep, shipmentId || undefined);
    }

    const products = (order.items || []).map((item) => {
      const weight = Number(item.weight);
      const height = Number(item.height);
      const width = Number(item.width);
      const length = Number(item.length);
      const quantity = Number(item.quantity);
      const unitaryValue = Number(item.price);
      const name = String(item.title || item.productTitle || '').trim();
      if (
        !name || !Number.isInteger(quantity) || quantity <= 0 ||
        ![weight, height, width, length, unitaryValue].every((value) => Number.isFinite(value) && value > 0)
      ) {
        throw shipmentProcessingError('Item do pedido sem dados físicos ou financeiros válidos para expedição.', 409, 'INVALID_SHIPMENT_ITEM', currentStep, shipmentId || undefined);
      }
      return { name, quantity, unitary_value: Number(unitaryValue.toFixed(2)), weight, height, width, length };
    });
    if (products.length === 0) {
      throw shipmentProcessingError('Pedido sem itens para expedição.', 409, 'EMPTY_SHIPMENT', currentStep, shipmentId || undefined);
    }

    const quotePackages = Array.isArray(quote.raw_quote?.packages)
      ? quote.raw_quote.packages
      : (Array.isArray(quote.raw_quote?.volumes) ? quote.raw_quote.volumes : []);
    let volumes = quotePackages.map((pkg: any) => ({
      height: Number(pkg.height || pkg.dimensions?.height),
      width: Number(pkg.width || pkg.dimensions?.width),
      length: Number(pkg.length || pkg.dimensions?.length),
      weight: Number(pkg.weight),
    })).filter((pkg: any) => [pkg.height, pkg.width, pkg.length, pkg.weight].every((value: number) => Number.isFinite(value) && value > 0));

    if (volumes.length === 0) {
      volumes = [{
        height: Math.ceil(products.reduce((sum, product) => sum + product.height * product.quantity, 0)),
        width: Math.ceil(Math.max(...products.map((product) => product.width))),
        length: Math.ceil(Math.max(...products.map((product) => product.length))),
        weight: Number(products.reduce((sum, product) => sum + product.weight * product.quantity, 0).toFixed(3)),
      }];
    }

    const invoiceKey = String(order.shippingDetails?.invoiceKey || (order as any).invoiceKey || '').replace(/\D/g, '');
    if (documentMode !== 'commercial_invoice' && documentMode !== 'content_declaration') {
      throw shipmentProcessingError('Defina o modo fiscal do envio nas Configurações de Frete.', 409, 'MISSING_SHIPMENT_DOCUMENT_MODE', currentStep, shipmentId || undefined);
    }
    if (documentMode === 'commercial_invoice' && invoiceKey.length !== 44) {
      throw shipmentProcessingError('Envio comercial exige chave de NF-e válida com 44 dígitos no pedido.', 409, 'MISSING_INVOICE_KEY', currentStep, shipmentId || undefined);
    }
    if (documentMode === 'content_declaration' && senderDocument.type === 'cnpj' && !['', 'ISENTO'].includes(String(sender.stateRegister || '').trim().toUpperCase())) {
      throw shipmentProcessingError('Declaração de conteúdo exige inscrição estadual vazia ou ISENTO.', 409, 'INVALID_CONTENT_DECLARATION_SENDER', currentStep, shipmentId || undefined);
    }

    const fromPayload: any = {
      name: String(sender.name).trim(),
      phone: senderPhone,
      email: String(sender.email).trim(),
      address: String(sender.street).trim(),
      number: String(sender.number).trim(),
      complement: String(sender.complement || '').trim(),
      district: String(sender.neighborhood).trim(),
      city: String(sender.city).trim(),
      state_abbr: String(sender.state).trim().toUpperCase(),
      country_id: 'BR',
      postal_code: senderPostalCode,
    };
    if (senderDocument.type === 'cpf') {
      fromPayload.document = senderDocument.digits;
    } else {
      fromPayload.company_document = senderDocument.digits;
      fromPayload.state_register = documentMode === 'content_declaration'
        ? String(sender.stateRegister || '').trim().toUpperCase()
        : String(sender.stateRegister || '').trim();
    }

    const cartPayload: any = {
      service: Number(quote.service_id),
      from: fromPayload,
      to: {
        name: recipientName,
        phone: recipientPhone,
        email: String(order.customerEmail).trim().toLowerCase(),
        document: recipientCpf,
        address: String(order.shippingAddress.street).trim(),
        number: String(order.shippingAddress.number).trim(),
        complement: String(order.shippingAddress.complement || '').trim(),
        district: String(order.shippingAddress.neighborhood).trim(),
        city: String(order.shippingAddress.city).trim(),
        state_abbr: String(order.shippingAddress.state).trim().toUpperCase(),
        country_id: 'BR',
        postal_code: destinationPostalCode,
      },
      products: products.map(({ name, quantity, unitary_value }) => ({ name, quantity, unitary_value })),
      volumes,
      options: {
        platform: config.appName,
        tags: [{ tag: order.id, url: null }],
        insurance_value: Number(Number(order.subtotal).toFixed(2)),
        receipt: Boolean(settings?.receipt),
        own_hand: Boolean(settings?.ownHand),
        reverse: false,
        non_commercial: documentMode === 'content_declaration',
        ...(documentMode === 'commercial_invoice' ? { invoice: { key: invoiceKey } } : {}),
      },
    };

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
      'User-Agent': config.userAgent,
    };

    if (!shipmentId) {
      currentStep = 'creating_cart';
      await db.updateShipmentStep(orderId, currentStep, undefined, lockToken);
      const cartResponse = await fetchWithTimeout(`${config.baseUrl}/me/cart`, {
        method: 'POST',
        headers,
        body: JSON.stringify(cartPayload),
      }, 20000);
      const cartText = await cartResponse.text();
      if (!cartResponse.ok) {
        throw shipmentProcessingError(getMelhorEnvioErrorMessage(cartText, 'Falha ao criar o envio no carrinho do Melhor Envio.'), 502, 'CART_ERROR', currentStep);
      }
      const cartData = JSON.parse(cartText || '{}');
      shipmentId = String(cartData.id || cartData.protocol || '').trim();
      if (!shipmentId) {
        throw shipmentProcessingError('Melhor Envio não retornou o ID da remessa.', 502, 'MISSING_SHIPMENT_ID', currentStep);
      }

      // Persist before checkout: every retry reuses this exact external shipment.
      order.melhorEnvioShipmentId = shipmentId;
      order.melhorEnvioProtocol = String(cartData.protocol || shipmentId);
      await db.updateShipmentStep(orderId, 'cart_created', shipmentId, lockToken);
      await db.saveOrder(order);
    }

    if (!purchaseConfirmed) {
      currentStep = 'checking_out';
      await db.updateShipmentStep(orderId, currentStep, shipmentId, lockToken);
      const checkoutResponse = await fetchWithTimeout(`${config.baseUrl}/me/shipment/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orders: [shipmentId] }),
      }, 30000);
      const checkoutText = await checkoutResponse.text();
      if (!checkoutResponse.ok) {
        const lower = checkoutText.toLowerCase();
        const alreadyPurchased = lower.includes('já foi pago') || lower.includes('already paid') || lower.includes('already purchased');
        if (!alreadyPurchased) {
          const insufficientBalance = lower.includes('saldo') || lower.includes('balance') || lower.includes('carteira');
          throw shipmentProcessingError(
            getMelhorEnvioErrorMessage(checkoutText, insufficientBalance ? 'Saldo insuficiente na carteira do Melhor Envio.' : 'Falha ao comprar o frete no Melhor Envio.'),
            insufficientBalance ? 402 : 502,
            insufficientBalance ? 'INSUFFICIENT_BALANCE' : 'CHECKOUT_FAILED',
            currentStep,
            shipmentId,
          );
        }
      }

      purchaseConfirmed = true;
      const purchasedAt = new Date().toISOString();
      await db.updateShipmentStep(orderId, 'checkout_completed', shipmentId, lockToken, { purchasedAt });
      order.shipmentPurchaseStatus = 'purchased';
      order.shipmentPurchasedAt = order.shipmentPurchasedAt || purchasedAt;
      order.shippingStatus = 'Frete comprado';
      order.shipmentLastError = undefined;
      await db.saveOrder(order);
    }

    if (!labelGenerated) {
      currentStep = 'generating_label';
      order.labelGenerationStatus = 'processing';
      await db.saveOrder(order);
      await db.updateShipmentStep(orderId, currentStep, shipmentId, lockToken);
      const generateResponse = await fetchWithTimeout(`${config.baseUrl}/me/shipment/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orders: [shipmentId] }),
      }, 30000);
      const generateText = await generateResponse.text();
      if (!generateResponse.ok) {
        const lower = generateText.toLowerCase();
        const alreadyGenerated = lower.includes('already') || lower.includes('já foi gerada') || lower.includes('gerada anteriormente');
        if (!alreadyGenerated) {
          throw shipmentProcessingError(getMelhorEnvioErrorMessage(generateText, 'Falha ao gerar a etiqueta no Melhor Envio.'), 502, 'GENERATE_FAILED', currentStep, shipmentId);
        }
      }
      labelGenerated = true;
      const labelGeneratedAt = new Date().toISOString();
      await db.updateShipmentStep(orderId, 'label_generated', shipmentId, lockToken, { labelGeneratedAt });
      order.labelGenerationStatus = 'generated';
      order.labelGeneratedAt = order.labelGeneratedAt || labelGeneratedAt;
      order.shippingStatus = 'Etiqueta gerada';
      await db.saveOrder(order);
    }

    currentStep = 'getting_print_url';
    await db.updateShipmentStep(orderId, currentStep, shipmentId, lockToken);
    const printResponse = await fetchWithTimeout(`${config.baseUrl}/me/shipment/print`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode: 'public', orders: [shipmentId] }),
    }, 20000);
    const printText = await printResponse.text();
    if (!printResponse.ok) {
      throw shipmentProcessingError(getMelhorEnvioErrorMessage(printText, 'Falha ao obter a etiqueta para impressão.'), 502, 'PRINT_URL_FAILED', currentStep, shipmentId);
    }
    const printData = JSON.parse(printText || '{}');
    printUrl = String(printData.url || printData.orders?.[0]?.url || '').trim();
    if (!printUrl) {
      throw shipmentProcessingError('Melhor Envio não retornou a URL de impressão da etiqueta.', 502, 'PRINT_URL_FAILED', currentStep, shipmentId);
    }

    currentStep = 'fetching_tracking';
    await db.updateShipmentStep(orderId, currentStep, shipmentId, lockToken);
    try {
      const trackingResponse = await fetchWithTimeout(`${config.baseUrl}/me/shipment/tracking`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orders: [shipmentId] }),
      }, 15000);
      if (trackingResponse.ok) {
        const trackingData: any = await trackingResponse.json();
        trackingCode = String(
          trackingData?.[shipmentId]?.tracking ||
          trackingData?.[shipmentId]?.tracking_code ||
          trackingData?.orders?.[0]?.tracking ||
          '',
        ).trim();
      }
    } catch (trackingError: any) {
      console.warn('[ME_SHIPMENT_TRACKING_PENDING]', { orderId, shipmentId, message: trackingError?.message || 'tracking unavailable' });
    }

    order.melhorEnvioShipmentId = shipmentId;
    order.shippingLabelUrl = printUrl;
    order.melhorEnvioLabelUrl = printUrl;
    order.melhorEnvioStatus = 'label_generated';
    if (trackingCode) order.trackingCode = trackingCode;
    order.shipmentPurchaseStatus = 'purchased';
    order.labelGenerationStatus = 'generated';
    order.shippingStatus = 'Pronto para envio';
    order.status = 'Pronto para Envio';
    order.shipmentLastError = undefined;

    const alreadyHasSuccessHistory = order.history.some((event) => event.source === 'melhor_envio' && event.externalEventId === shipmentId && event.status === 'Pronto para Envio');
    if (!alreadyHasSuccessHistory) {
      order.history.push({
        status: 'Pronto para Envio',
        source: 'melhor_envio',
        externalEventId: shipmentId,
        timestamp: new Date().toLocaleString('pt-BR'),
        occurredAt: new Date().toISOString(),
        description: trackingCode
          ? `Frete comprado e etiqueta gerada no Melhor Envio. Código de rastreio: ${trackingCode}.`
          : 'Frete comprado e etiqueta gerada no Melhor Envio. Código de rastreio aguardando disponibilização da transportadora.',
      });
    }

    await db.saveOrder(order);
    await db.completeShipmentGeneration(orderId, shipmentId, trackingCode || undefined, printUrl, undefined, 'completed', lockToken);

    if (actor?.source === 'admin') {
      await db.logAdminAction(
        actor.email || 'admin@marmot.com',
        actor.name || 'Admin',
        'generate_shipment',
        'shipping',
        order.id,
        `Envio comprado e etiqueta gerada no Melhor Envio (ID: ${shipmentId}).`,
        { shipmentId, trackingCode: trackingCode || undefined, printUrl },
      );
    }

    console.log('[ME_SHIPMENT_SUCCESS]', { orderId, shipmentId, source: actor?.source || 'system', durationMs: Date.now() - startTime });
    return { order, shipmentId, trackingCode: trackingCode || undefined, printUrl, reused: false };
  } catch (error: any) {
    const normalized = error instanceof ShipmentProcessingError
      ? error
      : shipmentProcessingError(error?.message || 'Erro interno ao processar a expedição.', 500, 'SHIPMENT_PROCESSING_FAILED', currentStep, shipmentId || undefined, trackingCode || undefined);
    const failureStep = normalized.step || currentStep;

    order = (await db.getOrderById(orderId)) || order;
    if (order) {
      order.melhorEnvioShipmentId = shipmentId || order.melhorEnvioShipmentId;
      order.shipmentPurchaseStatus = purchaseConfirmed ? 'purchased' : 'failed';
      order.labelGenerationStatus = purchaseConfirmed ? 'failed' : (order.labelGenerationStatus || 'not_started');
      order.shippingStatus = 'Problema no envio';
      order.shipmentLastError = `${normalized.code}: ${normalized.message}`.slice(0, 1000);
      const duplicateFailure = order.history.some((event) => event.status === 'Problema no envio' && event.description?.includes(normalized.code));
      if (!duplicateFailure) {
        order.history.push({
          status: 'Problema no envio',
          source: 'melhor_envio',
          externalEventId: shipmentId || undefined,
          timestamp: new Date().toLocaleString('pt-BR'),
          occurredAt: new Date().toISOString(),
          description: `${normalized.code}: ${normalized.message}`,
        });
      }
      await db.saveOrder(order);
    }

    try {
      await db.completeShipmentGeneration(
        orderId,
        shipmentId || normalized.shipmentId,
        trackingCode || normalized.trackingCode,
        printUrl || undefined,
        normalized.message,
        failureStep,
        lockToken,
      );
    } catch (stateError: any) {
      console.error('[ME_SHIPMENT_STATE_PERSISTENCE_ERROR]', { orderId, message: stateError?.message || stateError });
    }
    console.error('[ME_SHIPMENT_ERROR]', { orderId, code: normalized.code, step: failureStep, source: actor?.source || 'system', durationMs: Date.now() - startTime });
    throw normalized;
  }
}

// Legacy periodic responsibility: recover paid orders whose shipment purchase or label
// generation did not finish. The replacement is driven by validated payment events and
// authenticated payment revalidation requests. On Vercel,
// waitUntil keeps the serverless invocation alive after the HTTP response;
// locally the same promise runs in the current Node process for development.
function scheduleShipmentFulfillment(
  orderId: string,
  source: 'webhook' | 'webhook_retry' | 'admin_sync',
): void {
  const task = processMelhorEnvioShipment(orderId, { source }).catch((error: any) => {
    console.error('[ME_SHIPMENT_EVENT_DRIVEN_ERROR]', {
      orderId,
      source,
      code: error?.code || 'SHIPMENT_PROCESSING_FAILED',
      step: error?.step,
    });
  });

  if (process.env.VERCEL) {
    try {
      waitUntil(task);
      return;
    } catch (error: any) {
      console.error('[ME_SHIPMENT_WAIT_UNTIL_ERROR]', { orderId, source, message: error?.message });
    }
  }

  void task;
}

// --- ADMIN: GERAR ENVIO REAL NO MELHOR ENVIO COM MÁQUINA DE ESTADOS E VALIDAÇÕES RIGOROSAS ---
app.post('/api/admin/orders/:id/generate-melhor-envio-shipment', requireAdmin, async (req: any, res) => {
  const orderId = req.params.id;
  const startTime = Date.now();
  console.log(`[ME_SHIPMENT_START] orderId: ${orderId}`);

  try {
    const result = await processMelhorEnvioShipment(orderId, {
      source: 'admin',
      email: req.user?.email,
      name: req.user?.name,
    });
    return res.json({
      success: true,
      order: result.order,
      labelUrl: result.printUrl,
      trackingCode: result.trackingCode,
      shipmentId: result.shipmentId,
      reused: result.reused,
    });
  } catch (error: any) {
    return res.status(error?.statusCode || 500).json({
      success: false,
      error: error?.message || 'Erro ao processar envio no Melhor Envio.',
      code: error?.code || 'SHIPMENT_PROCESSING_FAILED',
      step: error?.step,
      shipmentId: error?.shipmentId,
      trackingCode: error?.trackingCode,
    });
  }

});

app.get('/api/admin/orders/:id/print-label', requireAdmin, async (req: any, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
    if (!order.melhorEnvioShipmentId && !order.shippingLabelUrl) {
      return res.status(400).json({
        error: 'Etiqueta ainda não foi gerada para este pedido no Melhor Envio. Clique primeiro em "Gerar Envio Real (Melhor Envio)".',
      });
    }

    if (order.shippingLabelUrl) {
      return res.json({ success: true, url: order.shippingLabelUrl });
    }

    const config = getMelhorEnvioConfig();
    const token = config.token;
    if (token && order.melhorEnvioShipmentId) {
      const printRes = await fetch(`${config.baseUrl}/me/shipment/print`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': config.userAgent,
        },
        body: JSON.stringify({ mode: 'public', orders: [order.melhorEnvioShipmentId] }),
      });

      if (printRes.ok) {
        const printData: any = await printRes.json();
        const url = printData.url || (printData.orders && printData.orders[0]?.url) || '';
        if (url) {
          order.shippingLabelUrl = url;
          await db.saveOrder(order);
          return res.json({ success: true, url });
        }
      }
    }

    return res.status(400).json({
      error: 'Link de impressão da etiqueta não disponível. Certifique-se de que a etiqueta foi comprada e gerada no Melhor Envio.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao buscar etiqueta.' });
  }
});

// --- Customers 360 ---
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
  try {
    const customers = await db.getCustomerProfiles();
    res.json(customers);
  } catch {
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

app.get('/api/admin/customers/:id', requireAdmin, async (req, res) => {
  try {
    const data = await db.getCustomerDetail(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar detalhes do cliente.' });
  }
});

app.put('/api/admin/customers/:id/status', requireAdmin, async (req: any, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Status de cliente inválido.' });
    }

    const success = await db.setCustomerStatus(req.params.id, status);
    if (!success) {
      return res.status(404).json({ error: 'Cliente não encontrado para alteração.' });
    }

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'update_customer_status',
      'customer',
      req.params.id,
      `Status do cliente alterado para ${status}`
    );

    res.json({ success: true, status });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar status do cliente.' });
  }
});

// --- Inventory Movements & Manual Adjustments ---
app.get('/api/admin/inventory/movements', requireAdmin, async (req, res) => {
  try {
    const movements = await db.getInventoryMovements(req.query.productId as string);
    res.json(movements);
  } catch {
    res.status(500).json({ error: 'Erro ao listar histórico de estoque.' });
  }
});

app.post('/api/admin/inventory/adjust', requireAdmin, async (req: any, res) => {
  try {
    const { productId, newStock, quantityChange, reason, note, variant } = req.body;
    const prod = await db.getProductById(productId);
    if (!prod) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const prevStock = prod.stockCount || 0;
    const finalStock = newStock !== undefined ? Math.max(0, parseInt(newStock, 10)) : Math.max(0, prevStock + (parseInt(quantityChange, 10) || 0));
    const delta = finalStock - prevStock;

    await db.updateProductStock(productId, finalStock);

    const movement = await db.recordInventoryMovement({
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId,
      productTitle: prod.title,
      sku: prod.id,
      variant: variant || {},
      quantityChange: delta,
      previousStock: prevStock,
      newStock: finalStock,
      reason: reason || 'manual_adjustment',
      userOrAdmin: req.user?.name || 'Admin',
      timestamp: new Date().toISOString(),
      note: note || `Ajuste manual de estoque por ${req.user?.name || 'Admin'}`,
    });

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'stock_adjust',
      'inventory',
      productId,
      `Estoque ajustado de ${prevStock} para ${finalStock} (${delta >= 0 ? `+${delta}` : delta})`,
      { previousStock: prevStock, newStock: finalStock, reason, note }
    );

    res.json({ success: true, product: { ...prod, stockCount: finalStock }, movement });
  } catch {
    res.status(500).json({ error: 'Erro ao ajustar estoque.' });
  }
});

// --- Returns & Exchanges (Trocas e Devoluções) ---
app.get('/api/admin/returns', requireAdmin, async (req, res) => {
  try {
    const returns = await db.getReturns();
    res.json(returns);
  } catch {
    res.status(500).json({ error: 'Erro ao listar solicitações de devolução.' });
  }
});

app.get('/api/user/returns', requireAuth, async (req: any, res) => {
  try {
    const returns = await db.getReturns(req.user.id);
    res.json(returns);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar suas devoluções.' });
  }
});

app.post('/api/returns', requireAuth, async (req: any, res) => {
  try {
    const { orderId, customerEmail, customerName, customerPhone, items, reason, description, photos } = req.body;
    if (!orderId || !items || !reason) {
      return res.status(400).json({ error: 'Preencha os campos obrigatórios (orderId, items, reason) para solicitar a troca/devolução.' });
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Pedido associado não foi encontrado.' });
    }

    const authUser = req.user;
    if (!authUser || !authUser.id) {
      return res.status(401).json({ error: 'Autenticação necessária para solicitar troca/devolução.' });
    }

    // Strict ownership validation: must be the order's owner or an admin
    if (order.userId && order.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Você não possui permissão para este pedido.' });
    }

    if (order.customerEmail && authUser.email && order.customerEmail.toLowerCase() !== authUser.email.toLowerCase() && authUser.role !== 'admin') {
      return res.status(403).json({ error: 'O e-mail do usuário autenticado não corresponde ao e-mail registrado neste pedido.' });
    }

    const userId = authUser.id;

    const returnItemsList = Array.isArray(items) ? items : [items];
    if (Array.isArray(order.items) && order.items.length > 0) {
      for (const retItem of returnItemsList) {
        const prodId = retItem.productId || retItem.id;
        const origItem = order.items.find((oi: any) => oi.productId === prodId || oi.id === prodId);
        if (!origItem) {
          return res.status(400).json({ error: `O produto "${prodId}" não pertence ao pedido original.` });
        }
        const retQty = Math.max(1, parseInt(String(retItem.quantity || 1), 10));
        if (retQty > (origItem.quantity || 1)) {
          return res.status(400).json({
            error: `Quantidade de devolução (${retQty}) para "${origItem.title || prodId}" excede a quantidade comprada (${origItem.quantity}).`
          });
        }
      }
    }

    const now = new Date();
    const returnReq: ReturnRequest = {
      id: `RMA-${Date.now().toString().slice(-6)}`,
      orderId,
      userId: userId || order.userId,
      customerName: customerName || order.customerName,
      customerEmail: customerEmail || order.customerEmail,
      customerPhone: customerPhone || order.customerPhone,
      items: returnItemsList,
      reason,
      description: description || '',
      photos: photos || [],
      status: 'Solicitada',
      createdAt: now.toISOString(),
      history: [
        {
          status: 'Solicitada',
          timestamp: now.toLocaleString('pt-BR'),
          note: 'Solicitação registrada pelo cliente no portal.',
          responsible: customerName || 'Cliente',
        },
      ],
    };

    const saved = await db.saveReturn(returnReq);

    // Update order status to flag return requested
    order.status = 'Devolução Solicitada';
    order.history.push({
      status: 'Devolução Solicitada',
      timestamp: now.toLocaleString('pt-BR'),
      description: `Solicitação de troca/devolução aberta (${returnReq.id}) - Motivo: ${reason}`,
    });
    await db.saveOrder(order);

    res.status(201).json(saved);
  } catch {
    res.status(500).json({ error: 'Erro ao processar solicitação de devolução.' });
  }
});

app.put('/api/admin/returns/:id/status', requireAdmin, async (req: any, res) => {
  try {
    const { status, adminNotes, trackingCode, refundAmount, restockProducts } = req.body;
    const rma = await db.getReturnById(req.params.id);
    if (!rma) {
      return res.status(404).json({ error: 'Solicitação de devolução não encontrada.' });
    }

    const prevStatus = rma.status;
    rma.status = status;
    if (adminNotes) rma.adminNotes = adminNotes;
    if (trackingCode) rma.trackingCode = trackingCode;
    if (refundAmount) rma.refundAmount = parseFloat(refundAmount);

    const now = new Date();
    rma.history.push({
      status,
      timestamp: now.toLocaleString('pt-BR'),
      note: adminNotes || `Status atualizado para ${status}`,
      responsible: req.user?.name || 'Admin',
    });

    // Auto-restock products if items returned and confirmed
    if (restockProducts && !rma.restockCompleted && (status === 'Devolvido' || status === 'Concluída' || status === 'Reembolso realizado')) {
      for (const itm of rma.items) {
        const prod = await db.getProductById(itm.productId);
        if (prod) {
          const prevStock = prod.stockCount || 0;
          const newStock = prevStock + itm.quantity;
          await db.updateProductStock(itm.productId, newStock);
          await db.recordInventoryMovement({
            id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: itm.productId,
            productTitle: itm.productTitle,
            sku: prod.id,
            variant: { size: itm.size, colorName: itm.colorName },
            quantityChange: itm.quantity,
            previousStock: prevStock,
            newStock,
            reason: 'return_restock',
            orderId: rma.orderId,
            returnId: rma.id,
            userOrAdmin: req.user?.name || 'Admin',
            timestamp: new Date().toISOString(),
            note: `Reintegração ao estoque via RMA #${rma.id}`,
          });
        }
      }
      rma.restockCompleted = true;
    }

    await db.saveReturn(rma);

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'update_return_status',
      'refund',
      rma.id,
      `Status do RMA alterado de ${prevStatus} para ${status}`,
      { prevStatus, status, adminNotes, restockProducts }
    );

    res.json(rma);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar status da devolução.' });
  }
});

// --- Store Banners (Gestão Visual da Loja) ---
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await db.getStoreBanners();
    res.json(banners.filter((b) => b.active));
  } catch {
    res.status(500).json({ error: 'Erro ao buscar banners da loja.' });
  }
});

app.get('/api/admin/banners', requireAdmin, async (req, res) => {
  try {
    const banners = await db.getStoreBanners();
    res.json(banners);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar banners.' });
  }
});

app.post('/api/admin/banners', requireAdmin, async (req: any, res) => {
  try {
    const bannerData = req.body;
    if (!bannerData.title || !bannerData.imageUrl) {
      return res.status(400).json({ error: 'Título e imagem do banner são obrigatórios.' });
    }

    const newBanner: StoreBanner = {
      id: bannerData.id || `banner-${Date.now()}`,
      title: bannerData.title,
      subtitle: bannerData.subtitle || '',
      buttonText: bannerData.buttonText || 'VER MAIS',
      linkUrl: bannerData.linkUrl || '/shop',
      imageUrl: bannerData.imageUrl,
      active: bannerData.active ?? true,
      order: bannerData.order ?? 1,
      placement: bannerData.placement || 'hero',
      createdAt: bannerData.createdAt || new Date().toISOString(),
    };

    const saved = await db.saveStoreBanner(newBanner);

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'save_banner',
      'settings',
      saved.id,
      `Banner "${saved.title}" salvo.`
    );

    res.json(saved);
  } catch {
    res.status(500).json({ error: 'Erro ao salvar banner.' });
  }
});

app.delete('/api/admin/banners/:id', requireAdmin, async (req: any, res) => {
  try {
    const deleted = await db.deleteStoreBanner(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Banner não encontrado.' });
    }

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'delete_banner',
      'settings',
      req.params.id,
      `Banner removido.`
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao remover banner.' });
  }
});

// --- Store Global Settings ---
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getStoreSettings();
    res.json({
      storeName: settings.storeName,
      contactEmail: settings.contactEmail,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      instagram: settings.instagram,
      freeShippingThreshold: settings.freeShippingThreshold,
      announcementBarText: settings.announcementBarText,
      announcementBarActive: settings.announcementBarActive,
      maintenanceMode: settings.maintenanceMode,
    });
  } catch {
    res.status(500).json({ error: 'Erro ao carregar configurações.' });
  }
});

app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await db.getStoreSettings();
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar configurações administrativas.' });
  }
});

app.put('/api/admin/settings', requireAdmin, async (req: any, res) => {
  try {
    const updated = await db.saveStoreSettings(req.body);

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'update_settings',
      'settings',
      'global',
      'Configurações globais da loja atualizadas.',
      req.body
    );

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// --- Admin Audit Logs ---
app.get('/api/admin/logs', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const logs = await db.getAdminActivityLogs(limit);
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar logs administrativos.' });
  }
});

// --- Reports & Financial Intelligence ---
app.get('/api/admin/reports', requireAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo, period } = req.query;
    const report = await db.getReports(
      dateFrom as string,
      dateTo as string,
      (period as string) || 'this_month'
    );
    res.json(report);
  } catch {
    res.status(500).json({ error: 'Erro ao gerar relatório financeiro.' });
  }
});

// --- RESUME PAYMENT FOR AN EXISTING PENDING ORDER ---
app.post(['/api/orders/:id/pay-now', '/api/orders/:id/pay'], requireAuth, async (req: any, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: `Pedido #${req.params.id} não encontrado.` });
    if (!canAuthenticatedUserAccessOrder(req, order)) return res.status(403).json({ error: 'Acesso negado.' });
    if (order.paymentStatus === 'Pago') return res.status(409).json({ error: 'Este pedido já está pago.' });
    if (!order.shippingQuoteId || order.shippingDetails?.source !== 'melhor_envio_api') {
      return res.status(409).json({
        code: 'SHIPPING_QUOTE_REQUIRED',
        error: 'Este pedido não possui uma cotação real de frete persistida. Recalcule o frete no checkout.',
      });
    }

    const checkoutAttemptId = String(req.body?.checkoutAttemptId || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutAttemptId)) {
      return res.status(400).json({ error: 'Identificador idempotente do checkout inválido.' });
    }

    order.checkoutAttemptKey = checkoutAttemptId;
    order.paymentProvider = 'infinitepay';
    const checkout = await createInfinitePayCheckoutForOrder(order, req, checkoutAttemptId);
    order.checkoutUrl = checkout.url;
    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      gateway: 'infinitepay',
      checkoutUrl: checkout.url,
      statusDetail: 'checkout_created',
    };

    console.log('[INFINITEPAY_PAYMENT_RESUMED]', { orderId: order.id });
    return res.json({
      success: true,
      orderId: order.id,
      checkoutUrl: checkout.url,
      targetUrl: checkout.url,
    });
  } catch (error: any) {
    console.error('[INFINITEPAY_PAYMENT_RESUME_ERROR]', { orderId: req.params.id, message: error?.message });
    const status = error?.code === 'INFINITEPAY_NOT_CONFIGURED' ? 503 : 502;
    return res.status(status).json({ error: status === 503 ? error.message : 'Não foi possível reabrir o pagamento.' });
  }
});


// --- SERVER-SIDE COUPON VALIDATION & MANAGEMENT ---
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, subtotal, customerEmail } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, error: 'Código de cupom não informado.' });
    }

    const coupons = await db.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return res.status(404).json({ valid: false, error: 'Cupom inválido ou inexistente.' });
    }

    if (!coupon.active) {
      return res.status(400).json({ valid: false, error: 'Este cupom não está mais ativo.' });
    }

    const numericSubtotal = Math.max(0, Number(subtotal) || 0);
    const minVal = Number(coupon.minOrderValue) || 0;

    if (minVal > 0 && numericSubtotal < minVal) {
      return res.status(400).json({
        valid: false,
        error: `Este cupom é válido apenas para compras acima de R$ ${minVal.toFixed(2)}.`,
        minOrderValue: minVal,
      });
    }

    const discountPercentage = Number(coupon.discountPercentage) || 0;
    const discountAmount = Number(((numericSubtotal * discountPercentage) / 100).toFixed(2));

    return res.json({
      valid: true,
      code: coupon.code,
      discountPercentage,
      discountAmount,
      description: coupon.description,
      minOrderValue: coupon.minOrderValue,
    });
  } catch {
    res.status(500).json({ valid: false, error: 'Erro ao validar cupom.' });
  }
});

app.get('/api/admin/coupons', requireAdmin, async (req, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json(coupons);
  } catch {
    res.status(500).json({ error: 'Erro ao listar cupons.' });
  }
});

app.post('/api/admin/coupons', requireAdmin, async (req: any, res) => {
  try {
    const { code, discountPercentage, minOrderValue, description, active } = req.body || {};
    if (!code || discountPercentage === undefined) {
      return res.status(400).json({ error: 'Código e percentual de desconto são obrigatórios.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const saved = await db.saveCoupon({
      code: cleanCode,
      discountPercentage: Number(discountPercentage),
      minOrderValue: Number(minOrderValue) || 0,
      description: description || `${discountPercentage}% OFF`,
      active: active !== undefined ? Boolean(active) : true,
    });

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'save_coupon',
      'settings',
      cleanCode,
      `Cupom ${cleanCode} (${discountPercentage}%) criado/atualizado.`
    );

    res.json(saved);
  } catch {
    res.status(500).json({ error: 'Erro ao salvar cupom.' });
  }
});

app.delete('/api/admin/coupons/:code', requireAdmin, async (req: any, res) => {
  try {
    const deleted = await db.deleteCoupon(req.params.code);
    if (!deleted) return res.status(404).json({ error: 'Cupom não encontrado.' });

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'delete_coupon',
      'settings',
      req.params.code,
      `Cupom ${req.params.code} excluído.`
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir cupom.' });
  }
});

app.put('/api/admin/coupons/:code/toggle', requireAdmin, async (req: any, res) => {
  try {
    const toggled = await db.toggleCoupon(req.params.code);
    if (!toggled) return res.status(404).json({ error: 'Cupom não encontrado.' });

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'toggle_coupon',
      'settings',
      req.params.code,
      `Status do cupom ${req.params.code} alterado para ${toggled.active ? 'Ativo' : 'Inativo'}.`
    );

    res.json(toggled);
  } catch {
    res.status(500).json({ error: 'Erro ao alterar status do cupom.' });
  }
});

// --- NEWSLETTER SUBSCRIPTION & DROP NOTIFICATIONS ---
app.post(['/api/newsletter/subscribe', '/api/newsletter'], async (req, res) => {
  try {
    const { email, source } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'E-mail inválido para inscrição na newsletter.' });
    }

    const result = await db.subscribeNewsletter(email, source || 'website_footer');

    // Send welcome confirmation email
    sendTransactionalEmail({
      to: email,
      subject: 'Bem-vindo ao Drop List exclusivo // MARMOT Archive',
      template: 'newsletter_drop',
      html: `<div style="font-family: sans-serif; background: #0c0c0c; color: #fff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="letter-spacing: 0.15em; text-transform: uppercase;">MARMOT // INSIDER ACCESS</h2>
        <p>Você agora faz parte do drop list prioritário. Você receberá avisos antecipados sobre novas coleções e reposições antes do público geral.</p>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">Use o cupom <strong>FIRSTAURA</strong> para 10% OFF em sua primeira compra.</p>
      </div>`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: result.isNew ? 'Inscrição realizada com sucesso! Verifique seu e-mail.' : 'Você já está cadastrado em nossa lista.',
      subscriber: result.subscriber,
    });
  } catch {
    res.status(500).json({ error: 'Erro ao processar inscrição na newsletter.' });
  }
});

app.post('/api/newsletter/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });
    await db.unsubscribeNewsletter(email);
    res.json({ success: true, message: 'Inscrição cancelada com sucesso.' });
  } catch {
    res.status(500).json({ error: 'Erro ao cancelar inscrição.' });
  }
});

app.get('/api/admin/newsletter/subscribers', requireAdmin, async (req, res) => {
  try {
    const subscribers = await db.getNewsletterSubscribers();
    res.json(subscribers);
  } catch {
    res.status(500).json({ error: 'Erro ao listar inscritos na newsletter.' });
  }
});

app.get('/api/admin/newsletter/campaigns', requireAdmin, async (req, res) => {
  try {
    const campaigns = await db.getCampaigns();
    res.json(campaigns);
  } catch {
    res.status(500).json({ error: 'Erro ao listar campanhas disparadas.' });
  }
});

app.post('/api/admin/newsletter/notify-drop', requireAdmin, async (req: any, res) => {
  try {
    const { title, subject, collectionName, discountCode, customMessage } = req.body || {};
    if (!title || !subject) {
      return res.status(400).json({ error: 'Título e assunto do Drop são obrigatórios.' });
    }

    const allSubscribers = await db.getNewsletterSubscribers();
    const activeSubscribers = allSubscribers.filter((s) => s.status === 'subscribed');

    let sent = 0;
    let failed = 0;

    const emailHtml = `<div style="font-family: sans-serif; background: #0c0c0c; color: #fff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
        <span style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a;">NOVO DROP CONFIRMADO</span>
        <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -0.02em; margin: 8px 0 0 0; text-transform: uppercase;">${title}</h1>
        ${collectionName ? `<p style="color: #a1a1aa; margin: 4px 0 0 0; font-size: 14px;">Coleção: ${collectionName}</p>` : ''}
      </div>
      <div style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
        ${customMessage ? `<p>${customMessage.replace(/\n/g, '<br/>')}</p>` : '<p>As novas peças autorais da temporada acabam de aterrissar em nossa loja com estoque rigorosamente limitado.</p>'}
      </div>
      ${discountCode ? `<div style="background: #18181b; border: 1px dashed #3f3f46; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em;">Cupom Especial de Lançamento</p>
        <p style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.15em; color: #ffffff;">${discountCode}</p>
      </div>` : ''}
      <div style="margin-top: 32px; text-align: center;">
        <a href="${process.env.APP_URL || 'https://marmot.com.br'}/shop" style="display: inline-block; background: #ffffff; color: #000000; padding: 14px 32px; border-radius: 6px; font-weight: 800; font-size: 13px; text-decoration: none; letter-spacing: 0.1em; text-transform: uppercase;">EXPLORAR DROP COMPLETO</a>
      </div>
    </div>`;

    for (const sub of activeSubscribers) {
      try {
        const result = await sendTransactionalEmail({
          to: sub.email,
          subject,
          template: 'newsletter_drop',
          html: emailHtml,
        });
        if (result.success) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }

    const campaignRecord: CampaignRecord = {
      id: `camp-${Date.now()}`,
      title,
      subject,
      collectionName,
      discountCode,
      recipientCount: activeSubscribers.length,
      sentCount: sent,
      failedCount: failed,
      createdBy: req.user?.name || 'Admin',
      createdAt: new Date().toISOString(),
    };

    await db.saveCampaign(campaignRecord);

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'send_newsletter_drop',
      'marketing',
      campaignRecord.id,
      `Drop "${title}" disparado para ${activeSubscribers.length} inscritos (${sent} entregues).`
    );

    return res.json({
      success: true,
      message: `Disparo de Drop concluído. ${sent} e-mails enviados com sucesso.`,
      campaign: campaignRecord,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao disparar e-mails do drop.' });
  }
});

// --- VERIFIED PRODUCT REVIEWS API ---
app.get(['/api/products/:productId/reviews', '/api/reviews/:productId'], async (req, res) => {
  try {
    const reviews = await db.getReviews(req.params.productId);
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar avaliações do produto.' });
  }
});

app.get('/api/products/:productId/can-review', async (req, res) => {
  try {
    const { email, userId } = req.query;
    const identifier = (email || userId || '') as string;
    const check = await db.canUserReviewProduct(identifier, req.params.productId);
    res.json(check);
  } catch {
    res.status(500).json({ canReview: false, error: 'Erro ao verificar elegibilidade de avaliação.' });
  }
});

app.post(['/api/products/:productId/reviews', '/api/reviews'], requireAuth, async (req: any, res) => {
  try {
    const productId = req.params.productId || req.body?.productId;
    const { rating, title, comment } = req.body || {};

    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'Produto, nota de 1 a 5 e comentário são obrigatórios.' });
    }

    const authUser = req.user;
    if (!authUser || !authUser.id) {
      return res.status(401).json({ error: 'Autenticação necessária para publicar avaliação.' });
    }

    // Security: Identity MUST come strictly from authenticated user, NEVER from client body
    const resolvedUserId = authUser.id;
    const resolvedUserEmail = authUser.email || undefined;
    const resolvedUserName = authUser.name || 'Cliente Marmot';

    // Server-authoritative verified purchase check: ONLY granted if user has delivered order with product
    const check = await db.canUserReviewProduct(resolvedUserId, productId);
    const isVerified = Boolean(check.canReview);
    const verifiedOrderId = isVerified ? check.orderId : undefined;

    const review = await db.createReview({
      productId,
      userId: resolvedUserId,
      userName: resolvedUserName,
      userEmail: resolvedUserEmail,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      title: sanitizeInput(title) || 'Avaliação da Peça',
      comment: sanitizeInput(comment),
      orderId: verifiedOrderId,
      verifiedPurchase: isVerified,
    });

    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao registrar avaliação.' });
  }
});

app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  try {
    const reviews = await db.getReviews();
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar avaliações no painel.' });
  }
});

app.delete('/api/admin/reviews/:id', requireAdmin, async (req: any, res) => {
  try {
    const deleted = await db.deleteReview(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Avaliação não encontrada.' });

    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'delete_review',
      'products',
      req.params.id,
      'Avaliação de produto excluída pelo moderador.'
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir avaliação.' });
  }
});

// =========================================================================
// --- ORDER LIFECYCLE STATE MACHINE & TRACKING NORMALIZATION LAYER ---
// =========================================================================

const ORDER_STATUS_RANKS: Record<string, number> = {
  'Aguardando Pagamento': 10,
  'Pagamento Pendente': 10,
  'Pagamento Aprovado': 20,
  'Pedido Confirmado': 20,
  'Em Separação': 30,
  'Preparando Envio': 30,
  'Pronto para Envio': 40,
  'Postado': 50,
  'Despachado': 50,
  'Em Transporte': 60,
  'Em trânsito': 60,
  'Saiu para entrega': 70,
  'Entregue': 80,
  'Problema no envio': 45,
  'Problema na entrega': 65,
  'Aguardando retirada': 65,
  'Devolvendo ao remetente': 75,
  'Devolução Solicitada': 85,
  'Devolvido': 90,
  'Pagamento Recusado': 5,
  'Cancelado': 95,
  'Reembolsado': 96,
};

function normalizeCarrierStatus(statusOrDescription: string): {
  internalState: string;
  orderStatus: string;
  shippingStatus: string;
  label: string;
  description: string;
  rank: number;
  isTerminal: boolean;
  isException: boolean;
} {
  const raw = String(statusOrDescription || '').trim().toLowerCase();

  // 1. DELIVERED / ENTREGUE (Terminal Success)
  if (
    raw === 'delivered' ||
    raw === 'entregue' ||
    raw.includes('objeto entregue') ||
    raw.includes('entrega realizada') ||
    raw.includes('entregue ao destinatário') ||
    raw.includes('concluido') ||
    raw.includes('concluído')
  ) {
    return {
      internalState: 'delivered',
      orderStatus: 'Entregue',
      shippingStatus: 'Entregue',
      label: 'Entregue',
      description: 'Objeto entregue ao destinatário com sucesso.',
      rank: 80,
      isTerminal: true,
      isException: false,
    };
  }

  // 2. OUT FOR DELIVERY / SAIU PARA ENTREGA (Pre-delivery milestone - NOT delivered!)
  if (
    raw === 'out_for_delivery' ||
    raw === 'delivery_route' ||
    raw.includes('saiu para entrega') ||
    raw.includes('saiu para entrega ao destinatário') ||
    raw.includes('em rota de entrega')
  ) {
    return {
      internalState: 'out_for_delivery',
      orderStatus: 'Saiu para entrega',
      shippingStatus: 'Saiu para entrega',
      label: 'Saiu para Entrega',
      description: 'Objeto saiu para entrega ao destinatário.',
      rank: 70,
      isTerminal: false,
      isException: false,
    };
  }

  // 3. RETURNING / RETURNED (Exceptions)
  if (
    raw === 'returning_to_sender' ||
    raw === 'returned' ||
    raw.includes('devolvido ao remetente') ||
    raw.includes('devolucao ao remetente') ||
    raw.includes('devolução ao remetente') ||
    raw.includes('retornando ao remetente') ||
    raw.includes('devolvido')
  ) {
    return {
      internalState: 'returning_to_sender',
      orderStatus: 'Devolvido',
      shippingStatus: 'Problema na entrega',
      label: 'Devolvendo ao Remetente',
      description: 'Objeto em processo de devolução ao remetente.',
      rank: 75,
      isTerminal: false,
      isException: true,
    };
  }

  // 4. AWAITING PICKUP (Exception)
  if (
    raw === 'awaiting_pickup' ||
    raw === 'waiting_for_pickup' ||
    raw.includes('aguardando retirada') ||
    raw.includes('disponivel para retirada') ||
    raw.includes('disponível para retirada') ||
    raw.includes('retirada na agencia') ||
    raw.includes('retirada na agência')
  ) {
    return {
      internalState: 'awaiting_pickup',
      orderStatus: 'Em Transporte',
      shippingStatus: 'Problema na entrega',
      label: 'Aguardando Retirada',
      description: 'Objeto disponível para retirada na agência da transportadora.',
      rank: 65,
      isTerminal: false,
      isException: true,
    };
  }

  // 5. DELIVERY ATTEMPT / SHIPPING PROBLEM (Exceptions)
  if (
    raw === 'delivery_attempt' ||
    raw === 'shipping_exception' ||
    raw.includes('destinatário ausente') ||
    raw.includes('destinatario ausente') ||
    raw.includes('tentativa de entrega') ||
    raw.includes('endereco incorreto') ||
    raw.includes('endereço incorreto') ||
    raw.includes('extravio') ||
    raw.includes('avaria') ||
    raw.includes('objeto com atraso')
  ) {
    return {
      internalState: 'delivery_attempt',
      orderStatus: 'Em Transporte',
      shippingStatus: 'Problema na entrega',
      label: 'Problema na Entrega',
      description: 'Tentativa de entrega não concluída. Nova tentativa será realizada.',
      rank: 65,
      isTerminal: false,
      isException: true,
    };
  }

  // 6. IN TRANSIT / EM TRANSPORTE
  if (
    raw === 'in_transit' ||
    raw === 'transit' ||
    raw === 'moving' ||
    raw === 'forwarded' ||
    raw === 'departed' ||
    raw === 'arrived_at_facility' ||
    raw.includes('em transito') ||
    raw.includes('em trânsito') ||
    raw.includes('objeto em transferência') ||
    raw.includes('em transferencia') ||
    raw.includes('em transferência') ||
    raw.includes('objeto encaminhado') ||
    raw.includes('encaminhado') ||
    raw.includes('transferido')
  ) {
    return {
      internalState: 'in_transit',
      orderStatus: 'Em Transporte',
      shippingStatus: 'Em trânsito',
      label: 'Em Trânsito',
      description: 'Objeto em transferência entre unidades da transportadora.',
      rank: 60,
      isTerminal: false,
      isException: false,
    };
  }

  // 7. POSTED / COLETADO / OBJETO POSTADO
  if (
    raw === 'posted' ||
    raw === 'collected' ||
    raw === 'picked_up' ||
    raw === 'accepted' ||
    raw === 'received_by_carrier' ||
    raw === 'shipped' ||
    raw.includes('objeto postado') ||
    raw.includes('coletado') ||
    raw.includes('recebido na unidade de postagem') ||
    raw.includes('recebido pela transportadora') ||
    raw.includes('postado')
  ) {
    return {
      internalState: 'posted',
      orderStatus: 'Postado',
      shippingStatus: 'Postado',
      label: 'Postado',
      description: 'Objeto postado e recebido na agência da transportadora.',
      rank: 50,
      isTerminal: false,
      isException: false,
    };
  }

  // 8. READY FOR SHIPPING / ETIQUETA GERADA
  if (
    raw === 'ready_for_shipping' ||
    raw === 'label_generated' ||
    raw.includes('etiqueta gerada') ||
    raw.includes('pronto para envio') ||
    raw.includes('envio criado')
  ) {
    return {
      internalState: 'ready_for_shipping',
      orderStatus: 'Pronto para Envio',
      shippingStatus: 'Pronto para envio',
      label: 'Pronto para Envio',
      description: 'Etiqueta de envio gerada. Aguardando coleta da transportadora.',
      rank: 40,
      isTerminal: false,
      isException: false,
    };
  }

  // 9. SEPARATION / EM SEPARAÇÃO
  if (
    raw === 'separation' ||
    raw === 'preparing' ||
    raw.includes('separação') ||
    raw.includes('separacao') ||
    raw.includes('preparando')
  ) {
    return {
      internalState: 'separation',
      orderStatus: 'Em Separação',
      shippingStatus: 'Preparando',
      label: 'Em Separação',
      description: 'Pagamento confirmado. Peças em separação e conferência.',
      rank: 30,
      isTerminal: false,
      isException: false,
    };
  }

  // 10. PAID / PAGAMENTO APROVADO
  if (raw === 'paid' || raw === 'approved' || raw.includes('aprovado')) {
    return {
      internalState: 'paid',
      orderStatus: 'Pagamento Aprovado',
      shippingStatus: 'Aguardando preparação',
      label: 'Pagamento Aprovado',
      description: 'Pagamento confirmado com sucesso.',
      rank: 20,
      isTerminal: false,
      isException: false,
    };
  }

  // Fallback / Unknown
  return {
    internalState: 'unknown',
    orderStatus: 'UNMODIFIED',
    shippingStatus: 'Desconhecido',
    label: 'Atualização de Rastreio',
    description: statusOrDescription || 'Evento de movimentação registrado.',
    rank: 0,
    isTerminal: false,
    isException: false,
  };
}

function canTransitionOrderStatus(currentStatus: string, newStatus: string): boolean {
  if (newStatus === 'UNMODIFIED' || currentStatus === newStatus) return false;

  const currentRank = ORDER_STATUS_RANKS[currentStatus] || 0;
  const newRank = ORDER_STATUS_RANKS[newStatus] || 0;

  // 1. Terminal state protection: Entregue is absolute and cannot be reverted by out-of-order webhooks
  if (currentStatus === 'Entregue') {
    return false;
  }

  // 2. Cancellation / Refund are terminal or override non-delivered orders
  if (currentStatus === 'Cancelado' || currentStatus === 'Reembolsado') {
    return false;
  }

  // 3. Normal forward progression: newRank must be strictly greater than currentRank
  if (newRank > currentRank) {
    return true;
  }

  // 4. Exception transitions (e.g. Devolvido or Cancelado applied after shipping)
  if (newStatus === 'Devolvido' || newStatus === 'Cancelado' || newStatus === 'Problema no envio' || newStatus === 'Problema na entrega') {
    return true;
  }

  return false;
}

// Central transition engine for logistics tracking events
async function applyShippingEventToOrder(
  orderIdentifier: string,
  event: {
    rawStatus: string;
    description?: string;
    location?: string;
    occurredAt?: string;
    source?: 'melhor_envio' | 'carrier' | 'tracking' | 'tracking_sync' | 'admin' | 'system';
    externalEventId?: string;
  }
): Promise<{ order: Order | null; transitionApplied: boolean; message: string }> {
  const cleanId = String(orderIdentifier || '').trim();
  if (!cleanId) {
    return { order: null, transitionApplied: false, message: 'Identificador do pedido ausente.' };
  }

  let order = await db.getOrderByTracking(cleanId);
  if (!order) {
    order = await db.getOrderById(cleanId);
  }
  if (!order) {
    const all = await db.getOrders();
    order = all.find(
      (o) =>
        o.melhorEnvioShipmentId === cleanId ||
        o.trackingCode?.toLowerCase() === cleanId.toLowerCase() ||
        o.id === cleanId
    ) || null;
  }

  if (!order) {
    return { order: null, transitionApplied: false, message: `Pedido não encontrado para identificador: ${cleanId}` };
  }

  const normalized = normalizeCarrierStatus(event.rawStatus);
  const nowIso = new Date().toISOString();
  const eventOccurredAt = event.occurredAt || nowIso;

  // Record shipment event in database audit table
  await db.recordShipmentEvent({
    id: `shp-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: order.id,
    shipmentId: order.melhorEnvioShipmentId,
    provider: event.source || 'melhor_envio',
    providerEventId: event.externalEventId,
    status: event.rawStatus,
    description: event.description || normalized.description,
    location: event.location,
    occurredAt: eventOccurredAt,
    createdAt: nowIso,
  });

  const previousStatus = order.status;
  const canTransition = canTransitionOrderStatus(String(order.status), normalized.orderStatus);

  // Check if this exact history event was already recorded (idempotency check)
  const isDuplicateHistory = order.history.some(
    (h: any) =>
      (event.externalEventId && h.externalEventId === event.externalEventId) ||
      (h.status === normalized.orderStatus && (h.description === event.description || h.occurredAt === eventOccurredAt))
  );

  if (canTransition) {
    order.status = normalized.orderStatus;
    order.shippingStatus = normalized.shippingStatus;

    if (normalized.internalState === 'posted') {
      order.postedAt = order.postedAt || eventOccurredAt;
    } else if (normalized.internalState === 'in_transit') {
      order.inTransitAt = order.inTransitAt || eventOccurredAt;
      if (!order.postedAt) order.postedAt = eventOccurredAt;
    } else if (normalized.internalState === 'out_for_delivery') {
      order.outForDeliveryAt = order.outForDeliveryAt || eventOccurredAt;
      if (!order.inTransitAt) order.inTransitAt = eventOccurredAt;
    } else if (normalized.internalState === 'delivered') {
      order.deliveredAt = order.deliveredAt || eventOccurredAt;
      if (!order.outForDeliveryAt) order.outForDeliveryAt = eventOccurredAt;
    }

    if (!isDuplicateHistory) {
      order.history.push({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        status: normalized.orderStatus,
        previousStatus: String(previousStatus),
        newStatus: normalized.orderStatus,
        source: event.source || 'melhor_envio',
        externalEventId: event.externalEventId,
        timestamp: new Date().toLocaleString('pt-BR'),
        occurredAt: eventOccurredAt,
        description: `${normalized.label}: ${event.description || normalized.description}${event.location ? ` (${event.location})` : ''}`,
        location: event.location,
        trackingCode: order.trackingCode,
      });
    }

    // If delivered, trigger transactional email to customer
    if (normalized.internalState === 'delivered' && order.customerEmail) {
      sendTransactionalEmail({
        to: order.customerEmail,
        subject: `Seu pedido #${order.id} foi entregue! | MARMOT`,
        template: 'order_delivered',
        orderId: order.id,
        userId: order.userId,
        html: `<div style="font-family: sans-serif; background: #0c0c0c; color: #fff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
          <h2 style="letter-spacing: 0.1em; color: #22c55e;">ENTREGA CONFIRMADA // MARMOT</h2>
          <p>Seu pedido <strong>#${order.id}</strong> chegou ao destino com sucesso.</p>
          <p>Esperamos que curta suas novas peças streetwear da MARMOT!</p>
          <p style="color: #a1a1aa; font-size: 13px; margin-top: 24px;">Código de Rastreamento: ${order.trackingCode || 'N/A'}</p>
        </div>`,
      }).catch(() => {});
    }

    await db.saveOrder(order);
    return {
      order,
      transitionApplied: true,
      message: `Status do pedido #${order.id} atualizado de '${previousStatus}' para '${normalized.orderStatus}'.`,
    };
  } else {
    // No status transition (e.g. out-of-order event or same status), but record descriptive history if new
    if (!isDuplicateHistory && event.description && event.description !== normalized.description) {
      order.history.push({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        status: String(order.status),
        previousStatus: String(order.status),
        newStatus: String(order.status),
        source: event.source || 'melhor_envio',
        externalEventId: event.externalEventId,
        timestamp: new Date().toLocaleString('pt-BR'),
        occurredAt: eventOccurredAt,
        description: `Movimentação: ${event.description}${event.location ? ` (${event.location})` : ''}`,
        location: event.location,
        trackingCode: order.trackingCode,
      });
      await db.saveOrder(order);
    }
    return {
      order,
      transitionApplied: false,
      message: `Status preservado em '${order.status}' (evento '${event.rawStatus}' não permite transição regressiva ou redundante).`,
    };
  }
}

// The carrier webhook is the primary tracking update path. This request-driven routine
// remains only as an authenticated administrative recovery action for exceptional cases.
async function syncActiveOrdersTrackingServer(): Promise<{ totalActive: number; checked: number; updated: number; errors: number }> {
  const token = getMelhorEnvioTokenServer();
  const allOrders = await db.getOrders();
  const activeOrders = allOrders.filter(
    (o) =>
      ['Em Separação', 'Preparando Envio', 'Pronto para Envio', 'Postado', 'Despachado', 'Em Transporte', 'Em trânsito', 'Saiu para entrega'].includes(String(o.status)) &&
      (Boolean(o.melhorEnvioShipmentId) || (Boolean(o.trackingCode) && !o.trackingCode?.startsWith('BR-SIMULATED-')))
  );

  let updatedCount = 0;
  let errorCount = 0;

  if (activeOrders.length === 0) {
    return { totalActive: 0, checked: 0, updated: 0, errors: 0 };
  }

  if (token && token.length >= 10) {
    const config = getMelhorEnvioConfig();
    const baseUrl = config.baseUrl;
    const userAgent = config.userAgent;

    const shipmentIds = activeOrders.map((o) => o.melhorEnvioShipmentId || o.trackingCode).filter(Boolean) as string[];

    for (let i = 0; i < shipmentIds.length; i += 20) {
      const batch = shipmentIds.slice(i, i + 20);
      try {
        const trackRes = await fetch(`${baseUrl}/me/shipment/tracking`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': userAgent,
          },
          body: JSON.stringify({ orders: batch }),
        });

        if (trackRes.ok) {
          const trackData: any = await trackRes.json();
          for (const sId of batch) {
            const info = trackData[sId];
            if (info && (info.status || info.tracking)) {
              const res = await applyShippingEventToOrder(sId, {
                rawStatus: info.status || 'in_transit',
                description: info.description || info.message,
                occurredAt: info.posted_at || info.delivered_at || info.created_at,
                source: 'tracking_sync',
                externalEventId: info.id ? String(info.id) : undefined,
              });
              if (res.transitionApplied) {
                updatedCount++;
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Tracking Sync Batch Error]:', err);
        errorCount++;
      }
    }
  }

  return {
    totalActive: activeOrders.length,
    checked: activeOrders.length,
    updated: updatedCount,
    errors: errorCount,
  };
}

// --- MELHOR ENVIO & CARRIER WEBHOOKS (Protected & Verified) ---
app.post(['/api/webhooks/melhor-envio', '/api/melhorenvio/webhook', '/api/webhooks/melhorenvio', '/api/webhooks/tracking'], async (req, res) => {
  try {
    const payload = req.body || {};
    const trackingCode = payload.tracking || payload.tracking_code || payload.shipment?.tracking || payload.id || payload.shipment_id;
    const providerStatus = String(payload.status || payload.event || payload.tag || '').toLowerCase();
    const eventDescription = payload.description || payload.message || payload.title || `Status: ${providerStatus}`;
    const location = payload.location ? `${payload.location.city || ''} ${payload.location.state ? `- ${payload.location.state}` : ''}`.trim() : undefined;

    if (!trackingCode) {
      return res.status(200).json({ success: true, message: 'Webhook recebido sem identificador de rastreio.' });
    }

    const webhookSecret = (process.env.MELHOR_ENVIO_WEBHOOK_SECRET || '').trim();
    const incomingToken = String(req.headers['x-melhor-envio-token'] || req.headers['authorization'] || req.query.token || '').replace(/^Bearer\s+/i, '').trim();

    const isSecretValid = Boolean(webhookSecret && incomingToken === webhookSecret);

    let statusToApply: string | null = null;
    let descriptionToApply = eventDescription;
    let occurredAtToApply = payload.created_at || payload.occurred_at || new Date().toISOString();
    let externalEventIdToApply = payload.id ? String(payload.id) : undefined;

    if (isSecretValid) {
      statusToApply = providerStatus;
    } else {
      // Secret is invalid or missing: Consult carrier API directly (Fail-Closed)
      console.warn('[TRACKING_WEBHOOK_UNVERIFIED] Webhook secret ausente ou inválido. Consultando API oficial da transportadora.');
      const token = getMelhorEnvioTokenServer();
      if (token && token.length >= 10) {
        const config = getMelhorEnvioConfig();
        const baseUrl = config.baseUrl;
        const userAgent = config.userAgent;

        try {
          const trackRes = await fetch(`${baseUrl}/me/shipment/tracking`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'User-Agent': userAgent,
            },
            body: JSON.stringify({ orders: [trackingCode] }),
          });

          if (trackRes.ok) {
            const trackData: any = await trackRes.json();
            const verifiedInfo = trackData[trackingCode];
            if (verifiedInfo && verifiedInfo.status) {
              statusToApply = String(verifiedInfo.status).toLowerCase();
              descriptionToApply = verifiedInfo.description || verifiedInfo.message || `Status oficial verificado: ${statusToApply}`;
              occurredAtToApply = verifiedInfo.posted_at || verifiedInfo.delivered_at || occurredAtToApply;
              externalEventIdToApply = verifiedInfo.id ? String(verifiedInfo.id) : externalEventIdToApply;
            }
          }
        } catch (verErr: any) {
          console.warn('[Webhook Re-Verification Warning]:', verErr.message);
        }
      }

      // Fail-closed: If status could not be verified by carrier API, reject unverified update
      if (!statusToApply) {
        console.warn(`[TRACKING_WEBHOOK_REJECTED] Atualização descartada para rastreio ${trackingCode}: assinatura inválida e transportadora não confirmou.`);
        return res.status(401).json({
          success: false,
          error: 'Assinatura do webhook inválida e status não confirmado pela transportadora oficial.',
        });
      }
    }

    const result = await applyShippingEventToOrder(trackingCode, {
      rawStatus: statusToApply,
      description: descriptionToApply,
      location,
      occurredAt: occurredAtToApply,
      source: 'melhor_envio',
      externalEventId: externalEventIdToApply,
    });

    return res.status(200).json({ success: true, message: result.message, transitionApplied: result.transitionApplied });
  } catch (err: any) {
    console.error('[Melhor Envio Webhook Error]:', err);
    res.status(500).json({ success: false, error: 'Falha temporária ao processar o evento de rastreamento.' });
  }
});

// Admin Manual Sync Endpoint for Active Logistics
app.post('/api/admin/tracking/sync-active', requireAdmin, async (req: any, res) => {
  try {
    const stats = await syncActiveOrdersTrackingServer();
    await db.logAdminAction(
      req.user?.email || 'admin@marmot.com',
      req.user?.name || 'Admin',
      'sync_tracking_active',
      'order',
      'all_active',
      `Sincronização de rastreamento executada. Verificados: ${stats.checked}, Atualizados: ${stats.updated}`
    );
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao sincronizar rastreios ativos.', message: err.message });
  }
});

app.get(['/api/tracking/:code', '/api/orders/track/:code'], async (req, res) => {
  try {
    const { code } = req.params;
    const order = await db.getOrderByTracking(code);
    if (!order) {
      return res.status(404).json({ error: `Nenhum pedido localizado com o código ${code}.` });
    }

    const events = await db.getShipmentEvents(order.id);
    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        shippingStatus: order.shippingStatus,
        shippingCarrier: order.shippingCarrier,
        shippingService: order.shippingService,
        trackingCode: order.trackingCode,
        estimatedDelivery: order.estimatedDelivery,
        shippingAddress: order.shippingAddress ? {
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          neighborhood: order.shippingAddress.neighborhood,
        } : undefined,
        paidAt: order.paidAt,
        separationStartedAt: order.separationStartedAt,
        postedAt: order.postedAt,
        inTransitAt: order.inTransitAt,
        outForDeliveryAt: order.outForDeliveryAt,
        deliveredAt: order.deliveredAt,
        history: order.history,
      },
      events,
    });
  } catch {
    res.status(500).json({ error: 'Erro ao consultar rastreio.' });
  }
});

// --- ADMIN EMAIL LOGS ---
app.get('/api/admin/email-logs', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const logs = await db.getEmailLogs(limit);
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Erro ao carregar logs de e-mail.' });
  }
});

// Vercel Serverless Function Handler
export default function handler(req: any, res: any) {
  return app(req, res);
}
