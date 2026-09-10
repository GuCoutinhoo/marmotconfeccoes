import { z } from 'zod';

const INFINITEPAY_API_BASE_URL = 'https://api.checkout.infinitepay.io';
const REQUEST_TIMEOUT_MS = 12_000;
export const ALLOWED_INFINITEPAY_CHECKOUT_HOSTS = new Set([
  'checkout.infinitepay.io',
  'checkout.infinitepay.com.br',
]);

const CheckoutItemSchema = z.object({
  quantity: z.number().int().min(1).max(50),
  price: z.number().int().positive(),
  description: z.string().trim().min(1).max(255),
});

export const CreateCheckoutResponseSchema = z.object({
  url: z.string().url(),
}).passthrough();

export const InfinitePayPaymentCheckResponseSchema = z.object({
  success: z.boolean(),
  paid: z.boolean(),
  amount: z.coerce.number().int().nonnegative(),
  paid_amount: z.coerce.number().int().nonnegative().optional(),
  installments: z.coerce.number().int().min(1).max(99).optional(),
  capture_method: z.string().trim().min(1).max(80).optional(),
}).passthrough();

export const InfinitePayWebhookSchema = z.object({
  invoice_slug: z.string().trim().min(1).max(255),
  amount: z.coerce.number().int().nonnegative(),
  paid_amount: z.coerce.number().int().nonnegative().optional(),
  installments: z.coerce.number().int().min(1).max(99).optional(),
  capture_method: z.string().trim().min(1).max(80).optional(),
  transaction_nsu: z.string().trim().min(1).max(255),
  order_nsu: z.string().trim().min(1).max(255),
  receipt_url: z.string().url().optional(),
  items: z.array(CheckoutItemSchema.passthrough()).optional(),
}).passthrough();

export type InfinitePayCheckoutItem = z.infer<typeof CheckoutItemSchema>;
export type InfinitePayPaymentCheckResponse = z.infer<typeof InfinitePayPaymentCheckResponseSchema>;
export type InfinitePayWebhookPayload = z.infer<typeof InfinitePayWebhookSchema>;

export interface InfinitePayCheckoutPayload {
  redirectUrl: string;
  webhookUrl?: string;
  orderNsu: string;
  items: InfinitePayCheckoutItem[];
  customer?: {
    name: string;
    email: string;
    phoneNumber?: string;
  };
  address?: {
    cep: string;
    number: string;
    complement?: string;
  };
}

export class InfinitePayClientError extends Error {
  code: string;
  status?: number;
  retryable: boolean;

  constructor(message: string, code: string, options?: { status?: number; retryable?: boolean }) {
    super(message);
    this.name = 'InfinitePayClientError';
    this.code = code;
    this.status = options?.status;
    this.retryable = Boolean(options?.retryable);
  }
}

function readEnvironmentVariable(name: 'INFINITEPAY_HANDLE' | 'INFINITEPAY_WEBHOOK_URL'): string {
  return String(process.env[name] || '').trim();
}

export function getInfinitePayHandle(): string {
  return readEnvironmentVariable('INFINITEPAY_HANDLE').replace(/^\$/, '');
}

export function getInfinitePayConfigurationStatus() {
  const rawHandle = readEnvironmentVariable('INFINITEPAY_HANDLE');
  const handle = getInfinitePayHandle();
  const webhookOverride = readEnvironmentVariable('INFINITEPAY_WEBHOOK_URL');
  return {
    configured: Boolean(handle),
    handleValid: Boolean(handle) && rawHandle === handle && /^[a-z0-9][a-z0-9._-]{1,99}$/i.test(handle),
    webhookOverrideConfigured: Boolean(webhookOverride),
    webhookOverrideValid: !webhookOverride || isPublicHttpsUrl(webhookOverride),
  } as const;
}

export function assertInfinitePayConfiguration(): string {
  const status = getInfinitePayConfigurationStatus();
  if (!status.configured) {
    throw new InfinitePayClientError('A InfinitePay ainda não foi configurada no servidor.', 'INFINITEPAY_NOT_CONFIGURED');
  }
  if (!status.handleValid) {
    throw new InfinitePayClientError('INFINITEPAY_HANDLE possui formato inválido.', 'INFINITEPAY_INVALID_HANDLE');
  }
  if (!status.webhookOverrideValid) {
    throw new InfinitePayClientError('INFINITEPAY_WEBHOOK_URL precisa ser uma URL HTTPS pública.', 'INFINITEPAY_INVALID_WEBHOOK_URL');
  }
  return getInfinitePayHandle();
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === 'localhost' || normalized === '::1' || normalized.endsWith('.local')) return true;
  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^169\.254\./.test(normalized)) return true;
  const private172 = normalized.match(/^172\.(\d{1,3})\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return true;
  if (/^192\.168\./.test(normalized) || normalized === '0.0.0.0') return true;
  return false;
}

export function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

export function resolveApplicationBaseUrl(input: {
  configuredUrl?: string;
  forwardedHost?: string | string[];
  forwardedProto?: string | string[];
  host?: string;
  secure?: boolean;
  vercelProductionUrl?: string;
  vercelUrl?: string;
  allowRequestHost?: boolean;
}): string {
  const configured = String(input.configuredUrl || '').trim().replace(/\/$/, '');
  if (/^https?:\/\/[^\s]+$/i.test(configured) && !configured.includes('MY_APP_URL')) return configured;

  const vercelHost = String(input.vercelProductionUrl || input.vercelUrl || '').trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  if (input.allowRequestHost) {
    const forwardedHost = Array.isArray(input.forwardedHost) ? input.forwardedHost[0] : input.forwardedHost;
    const forwardedProto = Array.isArray(input.forwardedProto) ? input.forwardedProto[0] : input.forwardedProto;
    const requestHost = String(forwardedHost || input.host || '').split(',')[0].trim();
    const requestProtocol = String(forwardedProto || (input.secure ? 'https' : 'http')).split(',')[0].trim();
    if (requestHost) return `${requestProtocol}://${requestHost}`;
  }

  return 'http://localhost:3000';
}

export function resolveInfinitePayWebhookUrl(baseUrl: string): string | undefined {
  const override = readEnvironmentVariable('INFINITEPAY_WEBHOOK_URL').replace(/\/$/, '');
  if (override) {
    if (!isPublicHttpsUrl(override)) {
      throw new InfinitePayClientError('INFINITEPAY_WEBHOOK_URL precisa ser uma URL HTTPS pública.', 'INFINITEPAY_INVALID_WEBHOOK_URL');
    }
    return override;
  }
  if (!isPublicHttpsUrl(baseUrl)) return undefined;
  return `${baseUrl.replace(/\/$/, '')}/api/infinitepay/webhook`;
}

export function reaisToCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('Valor monetário inválido.');
  return Math.round((value + Number.EPSILON) * 100);
}

export function centsToReais(value: number): number {
  if (!Number.isInteger(value) || value < 0) throw new Error('Valor em centavos inválido.');
  return Number((value / 100).toFixed(2));
}

export function sanitizeInfinitePayCheckoutUrl(value: string): string {
  if (typeof value !== 'string' || value.length > 2048) {
    throw new InfinitePayClientError('A InfinitePay retornou uma URL de checkout inválida.', 'INFINITEPAY_INVALID_CHECKOUT_URL');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new InfinitePayClientError('A InfinitePay retornou uma URL de checkout inválida.', 'INFINITEPAY_INVALID_CHECKOUT_URL');
  }
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    !ALLOWED_INFINITEPAY_CHECKOUT_HOSTS.has(hostname) ||
    Boolean(url.port) ||
    Boolean(url.username) ||
    Boolean(url.password)
  ) {
    throw new InfinitePayClientError('A InfinitePay retornou uma origem de checkout inesperada.', 'INFINITEPAY_INVALID_CHECKOUT_URL');
  }
  return url.toString();
}

export function parseInfinitePayCheckoutResponse(data: unknown): { url: string } {
  const parsed = CreateCheckoutResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new InfinitePayClientError(
      'A InfinitePay retornou uma resposta de checkout inválida.',
      'INFINITEPAY_INVALID_RESPONSE',
    );
  }
  return { url: sanitizeInfinitePayCheckoutUrl(parsed.data.url) };
}

export function sanitizeInfinitePayReceiptUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const trustedHost = hostname === 'infinitepay.io' || hostname.endsWith('.infinitepay.io') ||
      hostname === 'infinitepay.com.br' || hostname.endsWith('.infinitepay.com.br');
    if (url.protocol !== 'https:' || !trustedHost || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

async function postInfinitePay(path: '/links' | '/payment_check', payload: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${INFINITEPAY_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const raw = await response.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new InfinitePayClientError('Resposta inválida recebida da InfinitePay.', 'INFINITEPAY_INVALID_RESPONSE', {
        status: response.status,
        retryable: response.status >= 500,
      });
    }
    if (path === '/links' && process.env.NODE_ENV === 'development') {
      const responseRecord = data && typeof data === 'object' && !Array.isArray(data)
        ? data as Record<string, unknown>
        : {};
      const returnedUrl = typeof responseRecord.url === 'string' ? responseRecord.url : '';
      let checkoutOrigin: { protocol?: string; hostname?: string } = {};
      if (returnedUrl) {
        try {
          const parsedUrl = new URL(returnedUrl);
          checkoutOrigin = {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
          };
        } catch {
          checkoutOrigin = {};
        }
      }
      console.log('[INFINITEPAY_CHECKOUT_RESPONSE]', {
        status: response.status,
        responseKeys: Object.keys(responseRecord).sort(),
        ...checkoutOrigin,
      });
    }
    if (!response.ok) {
      throw new InfinitePayClientError('A InfinitePay recusou temporariamente a solicitação.', 'INFINITEPAY_HTTP_ERROR', {
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
      });
    }
    return data;
  } catch (error: any) {
    if (error instanceof InfinitePayClientError) throw error;
    if (error?.name === 'AbortError') {
      throw new InfinitePayClientError('A InfinitePay excedeu o tempo de resposta.', 'INFINITEPAY_TIMEOUT', { retryable: true });
    }
    throw new InfinitePayClientError('Não foi possível conectar à InfinitePay.', 'INFINITEPAY_NETWORK_ERROR', { retryable: true });
  } finally {
    clearTimeout(timeout);
  }
}

export async function createInfinitePayCheckout(input: InfinitePayCheckoutPayload): Promise<{ url: string }> {
  const handle = assertInfinitePayConfiguration();
  const items = z.array(CheckoutItemSchema).min(1).max(100).parse(input.items);
  const payload = {
    handle,
    redirect_url: input.redirectUrl,
    ...(input.webhookUrl ? { webhook_url: input.webhookUrl } : {}),
    order_nsu: input.orderNsu,
    items,
    ...(input.customer ? {
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        ...(input.customer.phoneNumber ? { phone_number: input.customer.phoneNumber } : {}),
      },
    } : {}),
    ...(input.address ? {
      address: {
        cep: input.address.cep,
        number: input.address.number,
        ...(input.address.complement ? { complement: input.address.complement } : {}),
      },
    } : {}),
  };
  return parseInfinitePayCheckoutResponse(await postInfinitePay('/links', payload));
}

export async function checkInfinitePayPayment(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<InfinitePayPaymentCheckResponse> {
  const handle = assertInfinitePayConfiguration();
  const data = await postInfinitePay('/payment_check', {
    handle,
    order_nsu: input.orderNsu,
    transaction_nsu: input.transactionNsu,
    slug: input.slug,
  });
  return InfinitePayPaymentCheckResponseSchema.parse(data);
}
