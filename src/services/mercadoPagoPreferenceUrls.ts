export type MercadoPagoCallbackFields = {
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved';
  notification_url?: string;
};

function isLocalOrPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local')
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return true;

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

/**
 * Mercado Pago requires externally reachable HTTPS URLs for automatic returns
 * and webhook notifications. Localhost/private addresses must not be sent in
 * preference payloads because the API rejects them.
 */
export function isPublicHttpsUrl(value: string | undefined): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !isLocalOrPrivateHostname(url.hostname)
    );
  } catch {
    return false;
  }
}

function normalizeHttpsCandidate(value: string | undefined): string | undefined {
  const cleanValue = String(value || '').trim().replace(/\/$/, '');
  if (!cleanValue) return undefined;
  return cleanValue.includes('://') ? cleanValue : `https://${cleanValue}`;
}

export function resolveMercadoPagoCallbackBaseUrl(options: {
  callbackUrl?: string;
  appUrl?: string;
  vercelProductionUrl?: string;
  vercelUrl?: string;
}): string | undefined {
  const candidates = [
    options.callbackUrl,
    options.vercelProductionUrl,
    options.vercelUrl,
    options.appUrl,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeHttpsCandidate(candidate);
    if (normalized && isPublicHttpsUrl(normalized)) return normalized;
  }

  return undefined;
}

export function buildMercadoPagoCallbackFields(
  baseUrl: string | undefined,
  orderId: string,
): MercadoPagoCallbackFields {
  const cleanBaseUrl = String(baseUrl || '').replace(/\/$/, '');
  if (!isPublicHttpsUrl(cleanBaseUrl)) return {};

  return {
    back_urls: {
      success: `${cleanBaseUrl}/checkout?mp_return=success&order_id=${encodeURIComponent(orderId)}`,
      failure: `${cleanBaseUrl}/checkout?mp_return=failure&order_id=${encodeURIComponent(orderId)}`,
      pending: `${cleanBaseUrl}/checkout?mp_return=pending&order_id=${encodeURIComponent(orderId)}`,
    },
    auto_return: 'approved',
    notification_url: `${cleanBaseUrl}/api/mercado-pago/webhook`,
  };
}

/** Only forward public HTTPS images to Mercado Pago. */
export function resolveMercadoPagoPictureUrl(
  imageUrl: string | undefined,
  baseUrl: string | undefined,
): string | undefined {
  if (!imageUrl) return undefined;

  try {
    const absoluteUrl = new URL(imageUrl);
    return isPublicHttpsUrl(absoluteUrl.toString()) ? absoluteUrl.toString() : undefined;
  } catch {
    if (!baseUrl || !isPublicHttpsUrl(baseUrl)) return undefined;

    try {
      const absoluteUrl = new URL(imageUrl, `${baseUrl.replace(/\/$/, '')}/`);
      return isPublicHttpsUrl(absoluteUrl.toString()) ? absoluteUrl.toString() : undefined;
    } catch {
      return undefined;
    }
  }
}
