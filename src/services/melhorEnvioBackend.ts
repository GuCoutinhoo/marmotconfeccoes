import fs from 'fs';
import path from 'path';
import { ShippingOption, ShippingSettings, Order } from '../types';
import { validateAndFetchCep, normalizeCep } from './cepService';
import { getMelhorEnvioConfig, saveMelhorEnvioConfig, MelhorEnvioClient, ProductShippingSpec } from './melhorEnvioClient';

export interface ShippingItemInput {
  productId: string;
  quantity: number;
}

export interface CalculateShippingParams {
  destinationPostalCode: string;
  items: ShippingItemInput[];
  productsStore: any[];
}

export const getShippingConfig = getMelhorEnvioConfig;
export const saveShippingConfig = saveMelhorEnvioConfig;

function getMelhorEnvioBaseUrl(environment: 'production' | 'sandbox'): string {
  return environment === 'sandbox'
    ? 'https://sandbox.melhorenvio.com.br/api/v2'
    : 'https://melhorenvio.com.br/api/v2';
}

/**
 * Calculates shipping quotes via the official Melhor Envio API.
 * NEVER returns fake/mock quotes. If the API fails or CEP is invalid/inexistent, it throws an error.
 */
export async function calculateMelhorEnvioShipping({
  destinationPostalCode,
  items,
  productsStore,
}: CalculateShippingParams): Promise<{ options: ShippingOption[]; originPostalCode: string; fromMelhorEnvio: boolean }> {
  const cleanDestination = normalizeCep(destinationPostalCode);
  if (cleanDestination.length !== 8) {
    throw new Error('CEP inválido. Digite um CEP válido.');
  }

  const client = new MelhorEnvioClient();
  const config = getMelhorEnvioConfig();

  // Validate items and resolve dimensions
  const productList: ProductShippingSpec[] = [];

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const prod = productsStore.find((p) => String(p.id) === String(item.productId) || String(p.slug) === String(item.productId));
      const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));

      if (!prod) {
        throw new Error(`Produto #${item.productId} não encontrado no catálogo.`);
      }

      const price = Number(prod.promoPrice || prod.price || 0);
      const weight = Number(prod.weight || 0.35);
      const height = Number(prod.height || 4);
      const width = Number(prod.width || 20);
      const length = Number(prod.length || 25);

      productList.push({
        id: String(prod.id || item.productId),
        width: Math.max(11, Math.round(width)),
        height: Math.max(2, Math.round(height)),
        length: Math.max(16, Math.round(length)),
        weight: Number(Math.max(0.05, weight).toFixed(2)),
        insurance_value: Number(price.toFixed(2)),
        quantity: qty,
      });
    }
  }

  const result = await client.calculateShipment({
    originPostalCode: config.originPostalCode,
    destinationPostalCode: cleanDestination,
    products: productList,
  });

  return {
    options: result.options,
    originPostalCode: result.originPostalCode,
    fromMelhorEnvio: true,
  };
}


/**
 * 1. Prepares/Creates a shipment in Melhor Envio Cart (POST /api/v2/me/cart)
 */
export async function createMelhorEnvioShipment(order: Order, productsStore: any[]): Promise<{ shipmentId: string; protocol?: string; rawResponse?: any }> {
  const config = getShippingConfig();
  if (!config.token || config.token.trim().length < 10) {
    throw new Error('Token do Melhor Envio não configurado no servidor.');
  }

  const baseUrl = getMelhorEnvioBaseUrl(config.environment);
  const cleanOrigin = normalizeCep(config.originPostalCode);
  const cleanDest = normalizeCep(order.shippingAddress.cep);

  // Build physical package products
  const products: any[] = [];
  for (const item of order.items) {
    const prod = productsStore.find((p) => p.id === item.productId);
    const weight = Math.max(0.1, Number(prod?.weight || item.weight || 0.35));
    const height = Math.max(2, Number(prod?.height || item.height || 4));
    const width = Math.max(11, Number(prod?.width || item.width || 20));
    const length = Math.max(16, Number(prod?.length || item.length || 25));

    products.push({
      name: item.productTitle,
      quantity: item.quantity,
      unitary_value: item.price,
      weight,
      height,
      width,
      length,
    });
  }

  const payload = {
    service: Number(order.shippingServiceId) || 1, // 1 = PAC, 2 = SEDEX, 3 = .Package Jadlog, 4 = .Com Jadlog
    from: {
      name: config.appName,
      phone: '11999990000',
      email: config.appEmail,
      document: '00000000000',
      address: 'Avenida Celso Garcia',
      number: '1200',
      complement: 'Galpão 03',
      district: 'Brás',
      city: 'São Paulo',
      state_abbr: 'SP',
      country_id: 'BR',
      postal_code: cleanOrigin,
    },
    to: {
      name: order.shippingAddress.recipientName || order.customerName || 'Cliente Marmot',
      phone: order.customerPhone ? order.customerPhone.replace(/\D/g, '') : '11988421092',
      email: order.customerEmail || 'cliente@marmot.com',
      document: order.customerCpf ? order.customerCpf.replace(/\D/g, '') : '00000000000',
      address: order.shippingAddress.street,
      number: order.shippingAddress.number || 'S/N',
      complement: order.shippingAddress.complement || '',
      district: order.shippingAddress.neighborhood,
      city: order.shippingAddress.city,
      state_abbr: order.shippingAddress.state,
      country_id: 'BR',
      postal_code: cleanDest,
    },
    products,
    volumes: [
      {
        height: Math.max(4, Math.max(...products.map((p) => p.height))),
        width: Math.max(15, Math.max(...products.map((p) => p.width))),
        length: Math.max(20, Math.max(...products.map((p) => p.length))),
        weight: products.reduce((acc, p) => acc + p.weight * p.quantity, 0),
      },
    ],
    options: {
      insurance_value: order.subtotal,
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: true,
    },
  };

  const response = await fetch(`${baseUrl}/me/cart`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': `${config.appName} (${config.appEmail})`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[MelhorEnvio createShipment error]:', errorBody);
    throw new Error(`Erro ao registrar envio no Melhor Envio (HTTP ${response.status}): ${errorBody.slice(0, 150)}`);
  }

  const data = await response.json();
  const shipmentId = String(data.id || data.protocol || `ME-${Date.now()}`);

  return {
    shipmentId,
    protocol: data.protocol,
    rawResponse: data,
  };
}

/**
 * 2. Buys/Checkouts the shipment (POST /api/v2/me/shipment/checkout)
 */
export async function checkoutMelhorEnvioShipment(shipmentId: string): Promise<any> {
  const config = getShippingConfig();
  const baseUrl = getMelhorEnvioBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/me/shipment/checkout`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': `${config.appName} (${config.appEmail})`,
    },
    body: JSON.stringify({
      orders: [shipmentId],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Erro ao pagar/comprar envio no Melhor Envio: ${errText.slice(0, 150)}`);
  }

  return response.json();
}

/**
 * 3. Generates label (POST /api/v2/me/shipment/generate)
 */
export async function generateMelhorEnvioLabel(shipmentId: string): Promise<any> {
  const config = getShippingConfig();
  const baseUrl = getMelhorEnvioBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/me/shipment/generate`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': `${config.appName} (${config.appEmail})`,
    },
    body: JSON.stringify({
      orders: [shipmentId],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Erro ao gerar etiqueta no Melhor Envio: ${errText.slice(0, 150)}`);
  }

  return response.json();
}

/**
 * 4. Prints label / gets official printable URL (POST /api/v2/me/shipment/print)
 */
export async function printMelhorEnvioLabel(shipmentId: string): Promise<{ url: string }> {
  const config = getShippingConfig();
  const baseUrl = getMelhorEnvioBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/me/shipment/print`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': `${config.appName} (${config.appEmail})`,
    },
    body: JSON.stringify({
      mode: 'public',
      orders: [shipmentId],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Erro ao obter link de impressão da etiqueta: ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  const printUrl = data.url || (data.orders && data.orders[0]?.url) || '';

  return { url: printUrl };
}

/**
 * 5. Consults shipment tracking (POST /api/v2/me/shipment/tracking)
 */
export async function trackMelhorEnvioShipment(orders: string[]): Promise<any> {
  const config = getShippingConfig();
  const baseUrl = getMelhorEnvioBaseUrl(config.environment);

  const response = await fetch(`${baseUrl}/me/shipment/tracking`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': `${config.appName} (${config.appEmail})`,
    },
    body: JSON.stringify({
      orders,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Erro ao consultar rastreamento: ${errText.slice(0, 150)}`);
  }

  return response.json();
}
