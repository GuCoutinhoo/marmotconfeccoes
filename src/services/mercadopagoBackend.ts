import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  getMercadoPagoConfig,
  getPaymentClient,
  getPreferenceClient,
  verifyMercadoPagoWebhookSignature,
} from './mercadopagoService';
import { Order, OrderItem } from '../types';
import {
  buildMercadoPagoCallbackFields,
  resolveMercadoPagoCallbackBaseUrl,
  resolveMercadoPagoPictureUrl,
} from './mercadoPagoPreferenceUrls';

// In-memory set of processed webhook event IDs to guarantee strict idempotency
const processedWebhookEvents = new Set<string>();

/**
 * Calculates exact subtotal and items from backend database.
 * Never trust client prices or totals.
 */
export function calculateOrderSecurityTotals(
  items: Array<{ productId: string; quantity: number }>,
  productsStore: any[],
  couponsStore: any[],
  couponCode?: string,
  paymentMethod?: string,
  shippingFee: number = 0
): {
  verifiedItems: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
} {
  let subtotal = 0;
  const verifiedItems: OrderItem[] = [];

  for (const item of items) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const prod = productsStore.find((p: any) => p.id === item.productId || p.slug === item.productId);

    if (!prod) {
      throw new Error(`Produto #${item.productId} não encontrado no catálogo oficial.`);
    }

    const unitPrice = Number(prod.promoPrice ?? prod.price ?? 0);
    const itemSubtotal = Number((unitPrice * qty).toFixed(2));

    subtotal += itemSubtotal;

    verifiedItems.push({
      productId: String(prod.id),
      sku: prod.sku || `SKU-${prod.id}`,
      productTitle: prod.title || 'Produto Marmot',
      productImage: prod.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      size: (item as any).size || 'M',
      colorName: (item as any).colorName || 'Black',
      price: unitPrice,
      quantity: qty,
      subtotal: itemSubtotal,
      weight: prod.weight || 0.35,
      height: prod.height || 4,
      width: prod.width || 20,
      length: prod.length || 25,
    });
  }

  subtotal = Number(subtotal.toFixed(2));

  // Validate coupon discount
  let couponDiscount = 0;
  if (couponCode && couponCode.trim().length > 0) {
    const coupon = couponsStore.find((c: any) => c.code === couponCode.trim().toUpperCase() && c.active);
    if (coupon) {
      if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
        couponDiscount = Number(((subtotal * (coupon.discountPercentage || 0)) / 100).toFixed(2));
      }
    }
  }

  // PIX discount (5% discount on products when paying with PIX)
  const isPix = paymentMethod === 'PIX' || paymentMethod === 'pix';
  const pixDiscount = isPix ? Number(((subtotal - couponDiscount) * 0.05).toFixed(2)) : 0;

  const totalDiscount = Number((couponDiscount + pixDiscount).toFixed(2));
  const validShippingFee = Number(Math.max(0, shippingFee).toFixed(2));
  const grandTotal = Number(Math.max(0, subtotal - totalDiscount + validShippingFee).toFixed(2));

  return {
    verifiedItems,
    subtotal,
    discount: totalDiscount,
    shippingFee: validShippingFee,
    total: grandTotal,
  };
}

/**
 * Creates a Mercado Pago Payment (Transparent Checkout for PIX, Card or Boleto)
 */
export async function createMercadoPagoPayment(params: {
  orderId: string;
  totalAmount: number;
  paymentMethod: 'PIX' | 'Cartão de Crédito' | 'Boleto Bancário';
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  cardToken?: string;
  installments?: number;
  issuerId?: string;
  paymentMethodId?: string;
  description?: string;
  idempotencyKey?: string;
}) {
  const config = getMercadoPagoConfig();
  const payment = getPaymentClient(params.idempotencyKey || `order-${params.orderId}-${params.paymentMethod}`);

  const cleanCpf = params.payer.identification?.number?.replace(/\D/g, '') || '';
  if (!/^\d{11}$/.test(cleanCpf)) {
    throw new Error('CPF válido do pagador é obrigatório para processar o pagamento.');
  }
  const firstName = params.payer.first_name || 'Cliente';
  const lastName = params.payer.last_name || 'Marmot';

  if (params.paymentMethod === 'PIX') {
    const callbackBaseUrl = resolveMercadoPagoCallbackBaseUrl({
      callbackUrl: process.env.MERCADOPAGO_CALLBACK_URL,
      appUrl: process.env.APP_URL,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      vercelUrl: process.env.VERCEL_URL,
    });
    const callbackFields = buildMercadoPagoCallbackFields(callbackBaseUrl, params.orderId);
    const body = {
      transaction_amount: Number(params.totalAmount.toFixed(2)),
      description: params.description || `Pedido Marmot Streetwear #${params.orderId}`,
      payment_method_id: 'pix',
      payer: {
        email: params.payer.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: cleanCpf,
        },
      },
      external_reference: params.orderId,
      ...(callbackFields.notification_url ? { notification_url: callbackFields.notification_url } : {}),
    };

    console.log(`[MercadoPago PIX] Criando cobrança PIX para Pedido #${params.orderId} (R$ ${params.totalAmount})`);
    const response = await payment.create({ body });
    return response;
  }

  if (params.paymentMethod === 'Cartão de Crédito') {
    if (!params.cardToken) {
      throw new Error('Token do cartão é obrigatório para processar pagamento transparente.');
    }

    const callbackBaseUrl = resolveMercadoPagoCallbackBaseUrl({
      callbackUrl: process.env.MERCADOPAGO_CALLBACK_URL,
      appUrl: process.env.APP_URL,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      vercelUrl: process.env.VERCEL_URL,
    });
    const callbackFields = buildMercadoPagoCallbackFields(callbackBaseUrl, params.orderId);
    const body = {
      transaction_amount: Number(params.totalAmount.toFixed(2)),
      token: params.cardToken,
      description: params.description || `Pedido Marmot Streetwear #${params.orderId}`,
      installments: Math.max(1, Number(params.installments) || 1),
      payment_method_id: params.paymentMethodId || 'master',
      ...(params.issuerId ? { issuer_id: Number(params.issuerId) || undefined } : {}),
      payer: {
        email: params.payer.email,
        identification: {
          type: 'CPF',
          number: cleanCpf,
        },
      },
      external_reference: params.orderId,
      ...(callbackFields.notification_url ? { notification_url: callbackFields.notification_url } : {}),
    };

    console.log(`[MercadoPago Card] Processando cartão para Pedido #${params.orderId} (R$ ${params.totalAmount})`);
    const response = await payment.create({ body });
    return response;
  }

  if (params.paymentMethod === 'Boleto Bancário') {
    const callbackBaseUrl = resolveMercadoPagoCallbackBaseUrl({
      callbackUrl: process.env.MERCADOPAGO_CALLBACK_URL,
      appUrl: process.env.APP_URL,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      vercelUrl: process.env.VERCEL_URL,
    });
    const callbackFields = buildMercadoPagoCallbackFields(callbackBaseUrl, params.orderId);
    const body = {
      transaction_amount: Number(params.totalAmount.toFixed(2)),
      description: params.description || `Pedido Marmot Streetwear #${params.orderId}`,
      payment_method_id: 'bolbradesco',
      payer: {
        email: params.payer.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: cleanCpf,
        },
      },
      external_reference: params.orderId,
      ...(callbackFields.notification_url ? { notification_url: callbackFields.notification_url } : {}),
    };

    console.log(`[MercadoPago Boleto] Criando Boleto para Pedido #${params.orderId} (R$ ${params.totalAmount})`);
    const response = await payment.create({ body });
    return response;
  }

  throw new Error(`Método de pagamento não suportado: ${params.paymentMethod}`);
}

/**
 * Creates a Mercado Pago Checkout Pro Preference (Redirect / Modal Checkout)
 */
export async function createMercadoPagoPreference(params: {
  orderId: string;
  items: Array<{ title: string; unitPrice: number; quantity: number; pictureUrl?: string }>;
  shippingFee: number;
  payerEmail: string;
  payerName: string;
  baseUrl: string;
}) {
  const preference = getPreferenceClient();

  const preferenceItems = params.items.map((item, index) => {
    const pictureUrl = resolveMercadoPagoPictureUrl(item.pictureUrl, params.baseUrl);
    return {
      id: `item-${index + 1}`,
      title: item.title,
      unit_price: Number(item.unitPrice.toFixed(2)),
      quantity: Math.max(1, item.quantity),
      currency_id: 'BRL',
      ...(pictureUrl ? { picture_url: pictureUrl } : {}),
    };
  });

  if (params.shippingFee > 0) {
    preferenceItems.push({
      id: 'shipping-fee',
      title: 'Frete e Entrega',
      unit_price: Number(params.shippingFee.toFixed(2)),
      quantity: 1,
      currency_id: 'BRL',
      picture_url: 'https://www.melhorenvio.com.br/images/shipping-companies/correios.png',
    });
  }

  const cleanBase = params.baseUrl.replace(/\/$/, '');
  const callbackBaseUrl = resolveMercadoPagoCallbackBaseUrl({
    callbackUrl: process.env.MERCADOPAGO_CALLBACK_URL,
    appUrl: cleanBase,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl: process.env.VERCEL_URL,
  });

  const body = {
    items: preferenceItems,
    payer: {
      email: params.payerEmail,
      name: params.payerName,
    },
    ...buildMercadoPagoCallbackFields(callbackBaseUrl, params.orderId),
    external_reference: params.orderId,
    statement_descriptor: 'MARMOT STREET',
  };

  const response = await preference.create({ body });
  return response;
}

/**
 * Direct Backend Inquiry to confirm payment status authentically from Mercado Pago API
 */
export async function fetchMercadoPagoPaymentStatus(paymentId: string | number) {
  const payment = getPaymentClient();
  const paymentData = await payment.get({ id: String(paymentId) });
  return paymentData;
}

/**
 * Checks idempotency for incoming webhooks
 */
export function isWebhookEventProcessed(eventId: string): boolean {
  if (processedWebhookEvents.has(eventId)) {
    return true;
  }
  // Store up to 10,000 IDs to avoid memory leaks
  if (processedWebhookEvents.size > 10000) {
    const firstKey = processedWebhookEvents.values().next().value;
    if (firstKey) processedWebhookEvents.delete(firstKey);
  }
  processedWebhookEvents.add(eventId);
  return false;
}
