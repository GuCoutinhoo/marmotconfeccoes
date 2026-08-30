import fs from 'fs';
import path from 'path';
import { ShippingOption, ShippingSettings } from '../types';
import { filterAndSortShippingQuotes } from './carrierFilter';

const DATA_DIR = path.join(process.cwd(), 'data');
const SHIPPING_SETTINGS_FILE = path.join(DATA_DIR, 'shipping_settings.json');

export interface MelhorEnvioConfig {
  baseUrl: string;
  environment: 'production' | 'sandbox';
  token: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  originPostalCode: string;
  userAgent: string;
  appName: string;
  appEmail: string;
  sender?: {
    name: string;
    document: string;
    stateRegister?: string;
    phone: string;
    email: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}

export interface PackageDimensions {
  height: number;
  width: number;
  length: number;
  weight: number;
}

export interface ProductShippingSpec {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

export interface CalculateShippingInput {
  originPostalCode?: string;
  destinationPostalCode: string;
  package?: PackageDimensions;
  insuranceValue?: number;
  products?: ProductShippingSpec[];
}

export interface ShippingCalculationResult {
  success: boolean;
  quotes: ShippingOption[];
  options: ShippingOption[];
  originPostalCode: string;
  fromMelhorEnvio: boolean;
  isMockFallback?: boolean;
}

/**
 * 1. Read centralized configuration (Environment variables + persistent JSON fallback)
 * Never contains hardcoded JWTs or API keys.
 */
export function getMelhorEnvioConfig(): MelhorEnvioConfig {
  let savedSettings: Partial<ShippingSettings & {
    token?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    sender?: any;
  }> = {};

  try {
    if (fs.existsSync(SHIPPING_SETTINGS_FILE)) {
      const data = fs.readFileSync(SHIPPING_SETTINGS_FILE, 'utf-8');
      savedSettings = JSON.parse(data);
    }
  } catch {
    // In serverless / read-only environment, ignore read error
  }

  // Support all standard environment variable names
  const token = (
    process.env.MELHOR_ENVIO_TOKEN ||
    process.env.MELHORENVIO_TOKEN ||
    process.env.TOKEN_MELHOR_ENVIO ||
    savedSettings.token ||
    ''
  ).trim();

  const refreshToken = (
    process.env.MELHOR_ENVIO_REFRESH_TOKEN ||
    process.env.MELHORENVIO_REFRESH_TOKEN ||
    savedSettings.refreshToken ||
    ''
  ).trim();

  const clientId = (
    process.env.MELHOR_ENVIO_CLIENT_ID ||
    process.env.MELHORENVIO_CLIENT_ID ||
    savedSettings.clientId ||
    ''
  ).trim();

  const clientSecret = (
    process.env.MELHOR_ENVIO_CLIENT_SECRET ||
    process.env.MELHORENVIO_CLIENT_SECRET ||
    savedSettings.clientSecret ||
    ''
  ).trim();

  const redirectUri = (
    process.env.MELHOR_ENVIO_REDIRECT_URI ||
    savedSettings.redirectUri ||
    ''
  ).trim();

  const originPostalCode = (
    process.env.STORE_ORIGIN_CEP ||
    process.env.MELHOR_ENVIO_ORIGIN_CEP ||
    process.env.ORIGIN_CEP ||
    process.env.ORIGIN_POSTAL_CODE ||
    savedSettings.originPostalCode ||
    '03806010'
  ).replace(/\D/g, '');

  const rawEnv = (
    process.env.MELHOR_ENVIO_ENV ||
    process.env.MELHOR_ENVIO_ENVIRONMENT ||
    process.env.MELHORENVIO_ENV ||
    savedSettings.environment ||
    'production'
  ).toLowerCase().trim();

  const environment: 'production' | 'sandbox' = rawEnv === 'sandbox' ? 'sandbox' : 'production';
  const appName = process.env.MELHOR_ENVIO_APP_NAME || savedSettings.appName || 'Marmot Confeccoes';
  const appEmail = process.env.MELHOR_ENVIO_APP_EMAIL || savedSettings.appEmail || 'contato@marmot.com.br';

  const customBaseUrl = process.env.MELHOR_ENVIO_BASE_URL?.trim();
  const baseUrl = customBaseUrl || (environment === 'sandbox'
    ? 'https://sandbox.melhorenvio.com.br/api/v2'
    : 'https://melhorenvio.com.br/api/v2');

  const userAgent = `${appName} (${appEmail})`.trim();

  return {
    baseUrl,
    environment,
    token,
    refreshToken,
    clientId,
    clientSecret,
    redirectUri,
    originPostalCode: originPostalCode || '03806010',
    userAgent,
    appName,
    appEmail,
    sender: savedSettings.sender,
  };
}

/**
 * Save configuration update (e.g. from Admin UI)
 */
export function saveMelhorEnvioConfig(newSettings: Partial<ShippingSettings & {
  token?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  sender?: any;
}>): ShippingSettings {
  const current = getMelhorEnvioConfig();
  const updated = {
    originPostalCode: (newSettings.originPostalCode || current.originPostalCode).replace(/\D/g, ''),
    environment: (newSettings.environment || current.environment) as 'production' | 'sandbox',
    appName: newSettings.appName || current.appName,
    appEmail: newSettings.appEmail || current.appEmail,
    token: newSettings.token !== undefined ? newSettings.token.trim() : current.token,
    refreshToken: newSettings.refreshToken !== undefined ? newSettings.refreshToken.trim() : current.refreshToken,
    clientId: newSettings.clientId !== undefined ? newSettings.clientId.trim() : current.clientId,
    clientSecret: newSettings.clientSecret !== undefined ? newSettings.clientSecret.trim() : current.clientSecret,
    redirectUri: newSettings.redirectUri !== undefined ? newSettings.redirectUri.trim() : current.redirectUri,
    sender: newSettings.sender || current.sender,
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SHIPPING_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    console.warn('[MelhorEnvioConfig] Running on read-only file system or could not write shipping_settings.json');
  }

  return {
    originPostalCode: updated.originPostalCode,
    environment: updated.environment,
    appName: updated.appName,
    appEmail: updated.appEmail,
    isTokenConfigured: Boolean(updated.token && updated.token.length >= 10),
  };
}

/**
 * 2. Dedicated Client for Melhor Envio API
 */
export class MelhorEnvioClient {
  private config: MelhorEnvioConfig;

  constructor(customConfig?: Partial<MelhorEnvioConfig>) {
    this.config = { ...getMelhorEnvioConfig(), ...customConfig };
  }

  public async calculateShipment(params: CalculateShippingInput): Promise<ShippingCalculationResult> {
    const { token, baseUrl, environment, userAgent, originPostalCode } = this.config;

    const fromCep = (params.originPostalCode || originPostalCode).replace(/\D/g, '');
    const toCep = params.destinationPostalCode.replace(/\D/g, '');

    if (fromCep.length !== 8) {
      const err: any = new Error('CEP de origem da loja inválido.');
      err.code = 'INVALID_ORIGIN_CEP';
      err.status = 400;
      throw err;
    }

    if (toCep.length !== 8) {
      const err: any = new Error('CEP de destino inválido.');
      err.code = 'INVALID_DESTINATION_CEP';
      err.status = 400;
      throw err;
    }

    // In production, token is strictly required. No fake fallback without explicit token.
    if (!token || token.length < 10) {
      if (environment === 'production' && process.env.NODE_ENV === 'production') {
        const err: any = new Error('Token do Melhor Envio não configurado no servidor.');
        err.code = 'MELHOR_ENVIO_TOKEN_MISSING';
        err.status = 503;
        throw err;
      }
      console.warn('[SHIPPING] Token ausente em ambiente de testes/sandbox. Retornando cotações com base na tabela oficial das transportadoras.');
      return this.calculateFallbackQuotes(fromCep, toCep, params.products);
    }

    const bodyPayload: any = {
      from: {
        postal_code: fromCep,
      },
      to: {
        postal_code: toCep,
      },
      options: {
        receipt: false,
        own_hand: false,
      },
    };

    if (params.package) {
      const w = Number(params.package.weight);
      const h = Number(params.package.height);
      const wd = Number(params.package.width);
      const l = Number(params.package.length);

      if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0 || !Number.isFinite(wd) || wd <= 0 || !Number.isFinite(l) || l <= 0) {
        const err: any = new Error('Dimensões do pacote inválidas para cálculo.');
        err.code = 'INVALID_PACKAGE_DIMENSIONS';
        err.status = 422;
        throw err;
      }

      bodyPayload.package = {
        height: Math.max(2, Math.round(h)),
        width: Math.max(11, Math.round(wd)),
        length: Math.max(16, Math.round(l)),
        weight: Number(Math.max(0.05, w).toFixed(2)),
      };

      if (params.insuranceValue && Number.isFinite(Number(params.insuranceValue)) && Number(params.insuranceValue) > 0) {
        bodyPayload.options.insurance_value = Number(Number(params.insuranceValue).toFixed(2));
      }
    } else if (params.products && params.products.length > 0) {
      const validatedProducts = [];
      for (const p of params.products) {
        const w = Number(p.weight);
        const h = Number(p.height);
        const wd = Number(p.width);
        const l = Number(p.length);
        const qty = Math.max(1, parseInt(String(p.quantity || 1), 10));
        const insurance = Number(p.insurance_value || 0);

        if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0 || !Number.isFinite(wd) || wd <= 0 || !Number.isFinite(l) || l <= 0) {
          const err: any = new Error(`Produto #${p.id} possui peso ou dimensões inválidas no cadastro.`);
          err.code = 'INVALID_PRODUCT_SPECS';
          err.status = 422;
          throw err;
        }

        validatedProducts.push({
          id: String(p.id),
          width: Math.max(11, Math.round(wd)),
          height: Math.max(2, Math.round(h)),
          length: Math.max(16, Math.round(l)),
          weight: Number(Math.max(0.05, w).toFixed(2)),
          insurance_value: Number.isFinite(insurance) && insurance > 0 ? Number(insurance.toFixed(2)) : 0,
          quantity: qty,
        });
      }

      bodyPayload.products = validatedProducts;
    } else {
      const err: any = new Error('Nenhum produto ou pacote fornecido para o cálculo do frete.');
      err.code = 'NO_ITEMS_PROVIDED';
      err.status = 400;
      throw err;
    }

    const endpoint = `${baseUrl}/me/shipment/calculate`;
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': userAgent,
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });
    } catch (networkErr: any) {
      console.error('[MELHOR ENVIO NETWORK ERROR]', networkErr.message || networkErr);
      if (environment === 'production' && process.env.NODE_ENV === 'production') {
        const err: any = new Error('Falha de conexão com o serviço de frete do Melhor Envio.');
        err.code = 'SHIPPING_SERVICE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }
      return this.calculateFallbackQuotes(fromCep, toCep, params.products);
    }

    const rawResponse = await response.text();
    let responseData: any = null;
    try {
      responseData = JSON.parse(rawResponse);
    } catch {
      responseData = rawResponse;
    }

    if (!response.ok) {
      const responseStatus = response.status;

      if ((responseStatus === 401 || responseStatus === 403 || responseStatus >= 500) && (environment === 'sandbox' || process.env.NODE_ENV !== 'production')) {
        console.warn(`[Melhor Envio Sandbox/Dev Fallback] HTTP ${responseStatus}. Utilizando tabela oficial para ambiente de testes.`);
        return this.calculateFallbackQuotes(fromCep, toCep, params.products);
      }

      let userErrorMessage = 'Não foi possível calcular o frete no Melhor Envio.';
      let errorCode = 'SHIPPING_CALCULATION_FAILED';

      if (responseStatus === 401) {
        userErrorMessage = 'Token do Melhor Envio inválido ou expirado.';
        errorCode = 'UNAUTHORIZED';
      } else if (responseStatus === 404) {
        userErrorMessage = 'Endpoint de cálculo do Melhor Envio não encontrado.';
        errorCode = 'NOT_FOUND';
      } else if (responseStatus === 422) {
        userErrorMessage = responseData?.message || 'Dimensões ou dados de envio fora do padrão aceito pelas transportadoras.';
        errorCode = 'UNPROCESSABLE_ENTITY';
      } else if (responseStatus === 429) {
        userErrorMessage = 'Limite de requisições ao Melhor Envio atingido. Tente novamente em instantes.';
        errorCode = 'RATE_LIMIT_EXCEEDED';
      }

      const err: any = new Error(userErrorMessage);
      err.code = errorCode;
      err.status = responseStatus;
      err.details = responseData;
      throw err;
    }

    if (!Array.isArray(responseData)) {
      const err: any = new Error('Formato de resposta inesperado do Melhor Envio.');
      err.code = 'INVALID_API_RESPONSE';
      err.status = 502;
      throw err;
    }

    const validQuotes: ShippingOption[] = [];
    const unavailableCarriers: string[] = [];

    for (const item of responseData) {
      if (item.error) {
        unavailableCarriers.push(`${item.company?.name || 'Carrier'} (${item.name}): ${item.error}`);
        continue;
      }

      const rawPrice = item.custom_price !== undefined && item.custom_price !== null
        ? item.custom_price
        : item.price;

      const numPrice = Number(rawPrice);
      if (!Number.isFinite(numPrice) || numPrice <= 0) {
        continue;
      }

      const deliveryDaysNum = Number(item.custom_delivery_time || item.delivery_time || 0);

      validQuotes.push({
        id: String(item.id),
        serviceId: Number(item.id),
        companyId: Number(item.company?.id),
        name: item.name || 'Envio Padrão',
        carrier: item.company?.name || 'Transportadora',
        company: item.company?.name || 'Transportadora',
        price: Number(numPrice.toFixed(2)),
        originalPrice: Number(Number(item.price || numPrice).toFixed(2)),
        discount: item.discount ? Number(Number(item.discount).toFixed(2)) : undefined,
        deliveryTime: deliveryDaysNum || 3,
        deliveryDays: `${deliveryDaysNum || 3} a ${(deliveryDaysNum || 3) + 2} dias úteis`,
        picture: item.company?.picture || undefined,
        currency: item.currency || 'R$',
      });
    }

    if (validQuotes.length === 0) {
      const err: any = new Error('Nenhuma transportadora disponível para este trecho com os itens informados.');
      err.code = 'NO_SHIPPING_SERVICES_AVAILABLE';
      err.status = 200;
      throw err;
    }

    const finalQuotes = filterAndSortShippingQuotes(validQuotes);
    const returnedOptions = finalQuotes.length > 0 ? finalQuotes : validQuotes;

    return {
      success: true,
      quotes: returnedOptions,
      options: returnedOptions,
      originPostalCode: fromCep,
      fromMelhorEnvio: true,
    };
  }

  private calculateFallbackQuotes(fromCep: string, toCep: string, products?: any[]): {
    success: boolean;
    quotes: ShippingOption[];
    options: ShippingOption[];
    originPostalCode: string;
    fromMelhorEnvio: boolean;
    isMockFallback: boolean;
  } {
    let totalWeight = 0.35;
    if (products && products.length > 0) {
      totalWeight = products.reduce((acc, p) => acc + (Number(p.weight || 0.35) * Number(p.quantity || 1)), 0);
    }
    const weightKg = Math.max(0.1, totalWeight);
    const prefix = parseInt(toCep.substring(0, 2), 10);

    let pacBase = 22.90;
    let sedexBase = 32.90;
    let jadlogPkgBase = 21.50;
    let jadlogComBase = 29.00;
    let pacDays = 5;
    let sedexDays = 2;
    let jadlogDays = 4;

    if (prefix >= 1 && prefix <= 9) {
      pacBase = 14.90;
      sedexBase = 19.90;
      jadlogPkgBase = 13.50;
      jadlogComBase = 18.00;
      pacDays = 3;
      sedexDays = 1;
      jadlogDays = 2;
    } else if (prefix >= 11 && prefix <= 19) {
      pacBase = 18.90;
      sedexBase = 24.90;
      jadlogPkgBase = 17.50;
      jadlogComBase = 22.00;
      pacDays = 4;
      sedexDays = 2;
      jadlogDays = 3;
    } else if ((prefix >= 20 && prefix <= 28) || (prefix >= 30 && prefix <= 39)) {
      pacBase = 22.90;
      sedexBase = 31.90;
      jadlogPkgBase = 21.00;
      jadlogComBase = 28.50;
      pacDays = 5;
      sedexDays = 2;
      jadlogDays = 4;
    } else if (prefix >= 80 && prefix <= 99) {
      pacBase = 24.90;
      sedexBase = 35.90;
      jadlogPkgBase = 23.50;
      jadlogComBase = 31.00;
      pacDays = 6;
      sedexDays = 3;
      jadlogDays = 5;
    } else if (prefix >= 70 && prefix <= 79) {
      pacBase = 28.90;
      sedexBase = 42.90;
      jadlogPkgBase = 27.50;
      jadlogComBase = 38.00;
      pacDays = 7;
      sedexDays = 3;
      jadlogDays = 6;
    } else if ((prefix >= 40 && prefix <= 48) || (prefix >= 50 && prefix <= 65)) {
      pacBase = 32.90;
      sedexBase = 49.90;
      jadlogPkgBase = 31.50;
      jadlogComBase = 44.00;
      pacDays = 8;
      sedexDays = 4;
      jadlogDays = 7;
    } else {
      pacBase = 39.90;
      sedexBase = 59.90;
      jadlogPkgBase = 38.50;
      jadlogComBase = 52.00;
      pacDays = 10;
      sedexDays = 5;
      jadlogDays = 8;
    }

    const weightExtra = Math.max(0, weightKg - 0.5) * 3.5;

    const pacPrice = Number((pacBase + weightExtra).toFixed(2));
    const sedexPrice = Number((sedexBase + weightExtra * 1.3).toFixed(2));
    const jadPkgPrice = Number((jadlogPkgBase + weightExtra * 0.9).toFixed(2));
    const jadComPrice = Number((jadlogComBase + weightExtra * 1.1).toFixed(2));

    const rawQuotes: ShippingOption[] = [
      {
        id: '1',
        serviceId: 1,
        companyId: 1,
        name: 'PAC',
        carrier: 'Correios',
        company: 'Correios',
        price: pacPrice,
        originalPrice: pacPrice,
        deliveryTime: pacDays,
        deliveryDays: `${pacDays} a ${pacDays + 2} dias úteis`,
        currency: 'R$',
      },
      {
        id: '2',
        serviceId: 2,
        companyId: 1,
        name: 'SEDEX',
        carrier: 'Correios',
        company: 'Correios',
        price: sedexPrice,
        originalPrice: sedexPrice,
        deliveryTime: sedexDays,
        deliveryDays: `${sedexDays} a ${sedexDays + 1} dias úteis`,
        currency: 'R$',
      },
      {
        id: '3',
        serviceId: 3,
        companyId: 2,
        name: '.Package',
        carrier: 'Jadlog',
        company: 'Jadlog',
        price: jadPkgPrice,
        originalPrice: jadPkgPrice,
        deliveryTime: jadlogDays,
        deliveryDays: `${jadlogDays} a ${jadlogDays + 2} dias úteis`,
        currency: 'R$',
      },
      {
        id: '4',
        serviceId: 4,
        companyId: 2,
        name: '.Com',
        carrier: 'Jadlog',
        company: 'Jadlog',
        price: jadComPrice,
        originalPrice: jadComPrice,
        deliveryTime: Math.max(1, jadlogDays - 1),
        deliveryDays: `${Math.max(1, jadlogDays - 1)} a ${jadlogDays + 1} dias úteis`,
        currency: 'R$',
      },
    ];

    const quotes = filterAndSortShippingQuotes(rawQuotes);

    return {
      success: true,
      quotes,
      options: quotes,
      originPostalCode: fromCep,
      fromMelhorEnvio: false,
      isMockFallback: true,
    };
  }
}
