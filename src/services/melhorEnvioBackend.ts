import { ShippingOption, ShippingSettings, Order } from '../types';
import { normalizeCep } from './cepService';
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
 */
export async function calculateMelhorEnvioShipping({
  destinationPostalCode,
  items,
  productsStore,
}: CalculateShippingParams): Promise<{ options: ShippingOption[]; originPostalCode: string; fromMelhorEnvio: boolean }> {
  const cleanDestination = normalizeCep(destinationPostalCode);
  if (cleanDestination.length !== 8) {
    throw new Error('CEP inválido. Digite um CEP com 8 dígitos.');
  }

  const client = new MelhorEnvioClient();
  const config = getMelhorEnvioConfig();

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
    fromMelhorEnvio: result.fromMelhorEnvio,
  };
}

/**
 * 1. Prepares/Creates a shipment in Melhor Envio Cart (POST /api/v2/me/cart)
 */
export async function createMelhorEnvioShipment(
  order: Order,
  productsStore: any[],
  senderConfig?: any
): Promise<{ shipmentId: string; protocol?: string; rawResponse?: any }> {
  const config = getShippingConfig();
  if (!config.token || config.token.trim().length < 10) {
    throw new Error('Token do Melhor Envio não configurado no servidor.');
  }

  const baseUrl = getMelhorEnvioBaseUrl(config.environment);
  const cleanOrigin = normalizeCep(senderConfig?.cep || config.originPostalCode);
  const cleanDest = normalizeCep(order.shippingAddress.cep);

  if (cleanOrigin.length !== 8) {
    throw new Error('CEP de origem do remetente inválido ou não configurado.');
  }
  if (cleanDest.length !== 8) {
    throw new Error('CEP de destino do pedido inválido.');
  }

  // Sender details validation
  const senderName = senderConfig?.name || config.sender?.name || config.appName;
  const senderDoc = (senderConfig?.document || config.sender?.document || '').replace(/\D/g, '');
  const senderPhone = (senderConfig?.phone || config.sender?.phone || '').replace(/\D/g, '');
  const senderEmail = senderConfig?.email || config.sender?.email || config.appEmail;
  const senderStreet = senderConfig?.street || config.sender?.street;
  const senderNumber = senderConfig?.number || config.sender?.number || 'S/N';
  const senderComplement = senderConfig?.complement || config.sender?.complement || '';
  const senderDistrict = senderConfig?.neighborhood || senderConfig?.district || config.sender?.neighborhood || 'Centro';
  const senderCity = senderConfig?.city || config.sender?.city;
  const senderState = (senderConfig?.state || config.sender?.state || 'SP').toUpperCase();

  if (!senderName || !senderDoc || senderDoc.length < 11 || !senderPhone || !senderStreet || !senderCity) {
    throw new Error(
      'Dados do remetente incompletos para emissão de frete. Configure o nome, CNPJ/CPF, telefone e endereço do remetente nas configurações de frete.'
    );
  }

  // Recipient details validation
  const recipientName = order.shippingAddress.recipientName || order.customerName;
  const recipientDoc = (order.customerCpf || '').replace(/\D/g, '');
  const recipientPhone = (order.customerPhone || '').replace(/\D/g, '');
  const recipientEmail = order.customerEmail || 'cliente@marmot.com.br';

  if (!recipientName || recipientName.trim().length < 3) {
    throw new Error('Nome do destinatário inválido no pedido.');
  }
  if (!recipientDoc || recipientDoc.length < 11) {
    throw new Error('CPF do destinatário obrigatório para emissão da etiqueta de envio.');
  }

  // Build physical package products
  const products: any[] = [];
  for (const item of order.items) {
    const prod = productsStore.find((p) => String(p.id) === String(item.productId) || String(p.slug) === String(item.productId));
    const weight = Math.max(0.05, Number(prod?.weight || item.weight || 0.35));
    const height = Math.max(2, Number(prod?.height || item.height || 4));
    const width = Math.max(11, Number(prod?.width || item.width || 20));
    const length = Math.max(16, Number(prod?.length || item.length || 25));

    products.push({
      name: item.productTitle || (item as any).title || 'Peça de Vestuário Marmot',
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitary_value: Number(Number(item.price || 0).toFixed(2)),
      weight: Number(weight.toFixed(2)),
      height: Math.round(height),
      width: Math.round(width),
      length: Math.round(length),
    });
  }

  const payload: any = {
    service: Number(order.shippingServiceId) || 1,
    from: {
      name: senderName,
      phone: senderPhone,
      email: senderEmail,
      document: senderDoc,
      company_document: senderDoc.length === 14 ? senderDoc : undefined,
      state_register: senderConfig?.stateRegister || config.sender?.stateRegister || undefined,
      address: senderStreet,
      number: senderNumber,
      complement: senderComplement,
      district: senderDistrict,
      city: senderCity,
      state_abbr: senderState,
      country_id: 'BR',
      postal_code: cleanOrigin,
    },
    to: {
      name: recipientName,
      phone: recipientPhone || '11988421092',
      email: recipientEmail,
      document: recipientDoc,
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
        weight: Number(products.reduce((acc, p) => acc + p.weight * p.quantity, 0).toFixed(2)),
      },
    ],
    options: {
      insurance_value: Number(Number(order.subtotal || 0).toFixed(2)),
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: false,
    },
  };

  const response = await fetch(`${baseUrl}/me/cart`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': config.userAgent,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[MelhorEnvio createShipment error]:', response.status, errorBody);
    let friendlyMessage = `Erro ao registrar envio no Melhor Envio (HTTP ${response.status})`;
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.message) friendlyMessage += `: ${errJson.message}`;
      else if (errJson.error) friendlyMessage += `: ${errJson.error}`;
      else if (typeof errJson === 'object') friendlyMessage += `: ${JSON.stringify(errJson).slice(0, 120)}`;
    } catch {
      if (errorBody) friendlyMessage += `: ${errorBody.slice(0, 120)}`;
    }
    throw new Error(friendlyMessage);
  }

  const data = await response.json();
  const shipmentId = String(data.id || data.protocol);

  if (!shipmentId) {
    throw new Error('Melhor Envio não retornou um ID de remessa válido.');
  }

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
      'User-Agent': config.userAgent,
    },
    body: JSON.stringify({
      orders: [shipmentId],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    let msg = `Erro ao pagar/comprar envio no Melhor Envio (HTTP ${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.message?.toLowerCase().includes('saldo') || errJson.error?.toLowerCase().includes('saldo')) {
        msg = 'Saldo insuficiente na sua carteira do Melhor Envio. Adicione créditos para comprar a etiqueta.';
      } else if (errJson.message) {
        msg += `: ${errJson.message}`;
      }
    } catch {
      if (errText) msg += `: ${errText.slice(0, 120)}`;
    }
    throw new Error(msg);
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
      'User-Agent': config.userAgent,
    },
    body: JSON.stringify({
      orders: [shipmentId],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Erro ao gerar etiqueta no Melhor Envio (HTTP ${response.status}): ${errText.slice(0, 150)}`);
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
      'User-Agent': config.userAgent,
    },
    body: JSON.stringify({
      mode: 'public',
      orders: [shipmentId],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Erro ao obter link de impressão da etiqueta (HTTP ${response.status}): ${errText.slice(0, 150)}`);
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
      'User-Agent': config.userAgent,
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
