import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

export interface MercadoPagoSettings {
  environment: 'sandbox' | 'production';
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  clientSecret?: string;
  autoReturn?: 'approved' | 'all';
}

const DATA_DIR = path.join(process.cwd(), 'data');
const MP_CONFIG_FILE = path.join(DATA_DIR, 'mercadopago_config.json');

// Memory cache for active client
let cachedClient: MercadoPagoConfig | null = null;
let cachedAccessToken: string | null = null;

export function getMercadoPagoConfig(): MercadoPagoSettings {
  const defaultConfig: MercadoPagoSettings = {
    environment: (process.env.MERCADOPAGO_ENV as 'sandbox' | 'production') || 'sandbox',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET || '',
    autoReturn: 'approved',
  };

  try {
    if (fs.existsSync(MP_CONFIG_FILE)) {
      const raw = fs.readFileSync(MP_CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(raw);
      return {
        ...defaultConfig,
        ...saved,
        // Environment variables take precedence if explicitly populated and not set in file
        publicKey: saved.publicKey || defaultConfig.publicKey,
        accessToken: saved.accessToken || defaultConfig.accessToken,
        webhookSecret: saved.webhookSecret || defaultConfig.webhookSecret,
        environment: saved.environment || defaultConfig.environment,
      };
    }
  } catch (err) {
    console.error('[MercadoPago Config] Error reading config file:', err);
  }

  return defaultConfig;
}

export function saveMercadoPagoConfig(updates: Partial<MercadoPagoSettings>): MercadoPagoSettings {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const current = getMercadoPagoConfig();
    const updated: MercadoPagoSettings = {
      ...current,
      ...updates,
    };

    fs.writeFileSync(MP_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    
    // Invalidate client cache on settings change
    cachedClient = null;
    cachedAccessToken = null;

    return updated;
  } catch (err) {
    console.error('[MercadoPago Config] Error saving config file:', err);
    throw err;
  }
}

/**
 * Returns a configured MercadoPago SDK client instance.
 * Lazily initialized to avoid boot errors.
 */
export function getMercadoPagoClient(): MercadoPagoConfig {
  const config = getMercadoPagoConfig();
  const token = config.accessToken;

  if (!token || token.trim().length === 0) {
    throw new Error('Access Token do Mercado Pago não configurado no servidor.');
  }

  if (!cachedClient || cachedAccessToken !== token) {
    cachedClient = new MercadoPagoConfig({
      accessToken: token.trim(),
      options: {
        timeout: 10000,
        idempotencyKey: crypto.randomUUID(),
      },
    });
    cachedAccessToken = token;
  }

  return cachedClient;
}

/**
 * Creates an SDK Payment instance with fresh idempotency key
 */
export function getPaymentClient(idempotencyKey?: string): Payment {
  const config = getMercadoPagoConfig();
  const token = config.accessToken;

  if (!token || token.trim().length === 0) {
    throw new Error('Access Token do Mercado Pago não configurado.');
  }

  const client = new MercadoPagoConfig({
    accessToken: token.trim(),
    options: {
      timeout: 10000,
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
    },
  });

  return new Payment(client);
}

/**
 * Creates an SDK Preference instance
 */
export function getPreferenceClient(): Preference {
  const client = getMercadoPagoClient();
  return new Preference(client);
}

/**
 * Official Mercado Pago Webhook HMAC-SHA256 Signature Verification
 * Documentation: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 * 
 * Signature header format:
 *   ts=1700000000,v1=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * Template:
 *   id:[data.id_url];request-id:[x-request-id_header];ts:[ts_from_header];
 */
export function verifyMercadoPagoWebhookSignature(params: {
  xSignatureHeader?: string;
  xRequestIdHeader?: string;
  dataId?: string;
  webhookSecret?: string;
}): boolean {
  const secret = params.webhookSecret || getMercadoPagoConfig().webhookSecret;

  // If no webhook secret is configured yet in sandbox, log warning but allow graceful setup check
  if (!secret || secret.trim().length === 0) {
    console.warn('[MercadoPago Webhook] Aviso: Webhook Secret não configurado. Validação de assinatura ignorada para ambiente de desenvolvimento/teste.');
    return true;
  }

  const signatureHeader = params.xSignatureHeader;
  const requestId = params.xRequestIdHeader;
  const dataId = params.dataId;

  if (!signatureHeader) {
    console.error('[MercadoPago Webhook] Header x-signature ausente.');
    return false;
  }

  try {
    // Parse ts and hash parts
    const parts = signatureHeader.split(',');
    let ts = '';
    let hashV1 = '';

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hashV1 = value;
    }

    if (!ts || !hashV1) {
      console.error('[MercadoPago Webhook] Formato inválido no header x-signature:', signatureHeader);
      return false;
    }

    // Build the manifest string
    // Format: "id:[data.id];request-id:[x-request-id];ts:[ts];"
    let manifest = '';
    if (dataId) manifest += `id:${dataId};`;
    if (requestId) manifest += `request-id:${requestId};`;
    manifest += `ts:${ts};`;

    // Compute HMAC-SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'utf-8'),
      Buffer.from(hashV1, 'utf-8')
    );

    if (!isValid) {
      console.error('[MercadoPago Webhook] Assinatura HMAC inválida.');
    }

    return isValid;
  } catch (err: any) {
    console.error('[MercadoPago Webhook] Erro ao validar assinatura:', err.message);
    return false;
  }
}
