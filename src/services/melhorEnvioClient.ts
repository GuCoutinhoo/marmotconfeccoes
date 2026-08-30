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
      const err: any = new Error('Token do Melhor Envio não configurado no servidor. Configure o token no painel administrativo.');
      err.code = 'MELHOR_ENVIO_TOKEN_MISSING';
      err.status = 503;
      throw err;
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
      const err: any = new Error('Falha de conexão com o serviço de frete do Melhor Envio.');
      err.code = 'SHIPPING_SERVICE_UNAVAILABLE';
      err.status = 503;
      throw err;
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
}
