export type CategoryId = string;

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
  rating: number; // 1 to 5
  date: string;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  userImage?: string;
  likes?: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  promoPrice?: number;
  category: string;
  subcategory: string;
  collection: string; // e.g. "Vol. 04: Cyber Dystopia", "Core Archive"
  tags: string[];
  rating: number;
  reviewCount: number;
  stockCount: number;
  sku: string;
  sizes: string[]; // e.g. ['P', 'M', 'G', 'GG', 'XG'] or ['38', '39', '40', '41', '42']
  colors: ProductVariant[];
  image?: string;
  images: string[];
  details: string[]; // Composition, weight, embroidery etc.
  composition?: string[];
  careInstructions: string[];
  reviews?: Review[];
  // Physical specs for shipping (Melhor Envio)
  weight?: number; // kg, ex: 0.35 (350g)
  height?: number; // cm, ex: 4
  width?: number; // cm, ex: 20
  length?: number; // cm, ex: 25
  isNewRelease?: boolean;
  isBestSeller?: boolean;
  featured?: boolean;
  status?: 'active' | 'draft' | 'archived' | 'out_of_stock';
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline?: string;
  image: string;
  subcategories: string[];
  productCount: number;
  order?: number;
  active?: boolean;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: ProductVariant;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number; // percentage e.g. 10 = 10% or value in R$
  discountPercentage?: number;
  minOrderValue?: number;
  description?: string;
  active?: boolean;
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
  deliveryTime: number; // in business days
  deliveryDays: string;
  picture?: string;
  currency?: string;
  error?: string;
}

export interface ShippingSettings {
  originPostalCode: string;
  environment: 'production' | 'sandbox';
  isTokenConfigured: boolean;
  appName?: string;
  appEmail?: string;
}

export interface MercadoPagoAdminSettings {
  environment: 'sandbox' | 'production';
  isPublicKeyConfigured: boolean;
  isAccessTokenConfigured: boolean;
  isWebhookSecretConfigured: boolean;
  publicKeyMasked: string;
  accessTokenMasked: string;
  webhookSecretMasked: string;
  webhookUrl: string;
}

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

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: UserRole;
  isVerified: boolean;
  addresses: Address[];
  createdAt?: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  email?: string;
  userId?: string;
  ip?: string;
  details?: string;
  status: 'success' | 'failure' | 'warning';
}

export type OrderStatus =
  | 'Aguardando Pagamento'
  | 'Pagamento Pendente'
  | 'Pagamento Aprovado'
  | 'Pedido Confirmado'
  | 'Em Separação'
  | 'Preparando Envio'
  | 'Pronto para Envio'
  | 'Postado'
  | 'Enviado'
  | 'Despachado'
  | 'Em Transporte'
  | 'Saiu para entrega'
  | 'Entregue'
  | 'Pagamento Recusado'
  | 'Cancelado'
  | 'Devolução Solicitada'
  | 'Devolvido'
  | 'Problema no envio'
  | 'Problema na entrega'
  | 'Reembolso Pendente'
  | 'Reembolsado';

export type PaymentStatus = 'Pendente' | 'Pago' | 'Aprovado' | 'Recusado' | 'Cancelado' | 'Estornado' | 'Reembolsado';

export type ShippingDeliveryStatus =
  | 'Aguardando preparação'
  | 'Preparando'
  | 'Envio criado'
  | 'Etiqueta gerada'
  | 'Pronto para envio'
  | 'Aguardando postagem'
  | 'Postado'
  | 'Despachado'
  | 'Em trânsito'
  | 'Em transporte'
  | 'Saiu para entrega'
  | 'Entregue'
  | 'Problema no envio'
  | 'Problema na entrega';

export interface OrderItem {
  productId: string;
  sku?: string;
  productTitle: string;
  title?: string;
  productImage: string;
  image?: string;
  size: string;
  colorName: string;
  color?: string;
  price: number;
  quantity: number;
  subtotal?: number;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
}

export interface OrderStatusHistoryItem {
  id?: string;
  orderId?: string;
  status: string;
  previousStatus?: string;
  newStatus?: string;
  source?: 'mercado_pago' | 'melhor_envio' | 'carrier' | 'tracking' | 'tracking_sync' | 'admin' | 'system';
  externalEventId?: string;
  timestamp: string;
  occurredAt?: string;
  date?: string;
  time?: string;
  responsible?: string;
  author?: string;
  description: string;
  location?: string;
  note?: string;
  trackingCode?: string;
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCpf?: string;
  date: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingDeliveryStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto Bancário';
  paymentDetails?: {
    pixQrCode?: string;
    pixCopiaECola?: string;
    cardBrand?: string;
    cardLastDigits?: string;
    installments?: number;
    barcode?: string;
    transactionId?: string;
    gateway?: string;
    paidAt?: string;
    refundedAt?: string;
    refundedAmount?: number;
    // Mercado Pago Fields
    mercadoPagoPaymentId?: string;
    mercadoPagoPreferenceId?: string;
    mercadoPagoStatus?: string;
    mercadoPagoStatusDetail?: string;
    mercadoPagoInitPoint?: string;
    ticketUrl?: string;
  };
  shippingAddress: Address;
  shippingCarrier: string;
  shippingProvider?: string;
  shippingService?: string;
  shippingServiceId?: string | number;
  shippingPrice?: number;
  shippingDeliveryTime?: number;
  shippingDestinationPostalCode?: string;
  trackingCode?: string;
  estimatedDelivery: string;
  // Lifecycle Timestamps
  paidAt?: string;
  separationStartedAt?: string;
  postedAt?: string;
  inTransitAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  // Melhor Envio Integration Fields
  melhorEnvioShipmentId?: string;
  melhorEnvioProtocol?: string;
  melhorEnvioLabelUrl?: string;
  shippingLabelUrl?: string;
  melhorEnvioStatus?: string;
  history: OrderStatusHistoryItem[];
  notes?: string;
  createdAt?: string;
}

export type ReturnReason =
  | 'Tamanho incorreto'
  | 'Produto diferente'
  | 'Produto com defeito'
  | 'Produto danificado'
  | 'Arrependimento'
  | 'Outro';

export type ReturnStatus =
  | 'Solicitada'
  | 'Em análise'
  | 'Aprovada'
  | 'Recusada'
  | 'Aguardando postagem'
  | 'Produto em transporte'
  | 'Produto recebido'
  | 'Em inspeção'
  | 'Reembolso autorizado'
  | 'Reembolso realizado'
  | 'Concluída';

export interface ReturnItem {
  productId: string;
  productTitle: string;
  productImage?: string;
  size: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: ReturnItem[];
  reason: ReturnReason;
  description: string;
  photos?: string[];
  status: ReturnStatus;
  trackingCode?: string;
  requestedAt: string;
  updatedAt: string;
  history: {
    status: ReturnStatus;
    timestamp: string;
    note?: string;
    author: string;
  }[];
  adminNotes?: string;
  refundAmount?: number;
  restockCompleted?: boolean;
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
  mercadoPagoPaymentId?: string;
  preferenceId?: string;
  merchantOrderId?: string;
  statusDetail?: string;
  refundedAmount?: number;
  refundReason?: string;
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
  deliveryDays: number | string;
  trackingCode?: string;
  status: ShippingDeliveryStatus;
  address: Address;
  dispatchedAt?: string;
  protocol?: string;
  labelUrl?: string;
  melhorEnvioShipmentId?: string;
  notes?: string;
}

export type InventoryMovementReason =
  | 'order_sale'
  | 'order_cancel_restock'
  | 'return_restock'
  | 'manual_adjustment'
  | 'initial_stock'
  | 'loss_writeoff';

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
  reason: InventoryMovementReason;
  orderId?: string;
  returnId?: string;
  userOrAdmin: string;
  timestamp: string;
  note?: string;
}

export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: UserRole;
  isVerified: boolean;
  addresses: Address[];
  createdAt: string;
  lastLogin?: string;
  totalOrders: number;
  totalSpent: number;
  avgTicket: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
}

export type AdminCustomer = CustomerDetail;

export interface PaymentRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  date: string;
  transactionId?: string;
  mercadoPagoPaymentId?: string;
  preferenceId?: string;
  merchantOrderId?: string;
  statusDetail?: string;
  refundedAmount?: number;
  refundReason?: string;
  refundDate?: string;
}

export interface AdminReportData {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  totalOrders: number;
  averageTicket: number;
  cancellationRate: number;
  returnRate: number;
  salesTimeline: { date: string; revenue: number; orders: number }[];
  paymentMethodsBreakdown: { method: string; count: number; total: number; percentage: number }[];
  topCategories: { category: string; count: number; revenue: number }[];
}

export interface AdminActivityLog {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  entity?: 'order' | 'product' | 'category' | 'inventory' | 'return' | 'refund' | 'coupon' | 'customer' | 'settings' | 'shipping' | string;
  entityType?: string;
  entityId?: string;
  description: string;
  details?: any;
  timestamp: string;
  metadata?: any;
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
  placement: 'hero' | 'middle' | 'popup' | 'announcement';
  createdAt?: string;
}

export interface StoreSettingsData {
  storeName: string;
  contactEmail: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  freeShippingThreshold?: number;
  defaultPostalCode?: string;
  originPostalCode?: string;
  announcementBarText?: string;
  announcementBarActive?: boolean;
  maintenanceMode?: boolean;
}

export type StoreSettings = StoreSettingsData;

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
  salesByDay: { date: string; label: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number; color: string }[];
  topProducts: { id: string; title: string; image: string; salesCount: number; revenue: number; stock: number }[];
  topCategories: { category: string; count: number; revenue: number }[];
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  totalCustomers: number;
  lowStockCount: number;
  pendingReviewsCount: number;
  salesData: { date: string; sales: number; orders: number }[];
  topProducts: { id: string; title: string; salesCount: number; revenue: number; image: string }[];
}
