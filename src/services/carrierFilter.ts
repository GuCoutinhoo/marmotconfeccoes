import { ShippingOption } from '../types';

/**
 * Whitelist definition and priority ranking for Melhor Envio carriers.
 *
 * Priority Order:
 * 1. Correios (Company ID: 1)
 * 2. Jadlog (Company ID: 2)
 * 3. Loggi (Company ID: 8)
 * 4. Azul Cargo Express (Company ID: 9)
 * 5. J&T Express (Company ID: 10)
 *
 * Hidden / Blocked Carriers:
 * - Buslog (Company ID: 3)
 * - Total Express (Company ID: 6)
 * - LATAM Cargo (Company ID: 4)
 * - Any other carrier not listed in the whitelist.
 */

export interface AllowedCarrierRule {
  companyId: number;
  canonicalName: string;
  matchPattern: RegExp;
  priority: number;
}

export const ALLOWED_CARRIER_RULES: AllowedCarrierRule[] = [
  {
    companyId: 1,
    canonicalName: 'Correios',
    matchPattern: /correios|empresa brasileira de correios/i,
    priority: 1,
  },
  {
    companyId: 2,
    canonicalName: 'Jadlog',
    matchPattern: /jadlog|jad\s*log/i,
    priority: 2,
  },
  {
    companyId: 8,
    canonicalName: 'Loggi',
    matchPattern: /loggi/i,
    priority: 3,
  },
  {
    companyId: 9,
    canonicalName: 'Azul Cargo Express',
    matchPattern: /azul\s*cargo|azul/i,
    priority: 4,
  },
  {
    companyId: 10,
    canonicalName: 'J&T Express',
    matchPattern: /j&t|jt\s*express|j\s*and\s*t/i,
    priority: 5,
  },
];

export interface CarrierMatchResult {
  allowed: boolean;
  priority: number;
  canonicalName: string;
  companyId?: number;
}

/**
 * Evaluates whether a shipping quote comes from an approved carrier,
 * prioritizing company ID when available.
 */
export function matchCarrier(item: {
  companyId?: number;
  company?: { id?: number; name?: string } | string;
  carrier?: string;
  name?: string;
}): CarrierMatchResult {
  const companyId = Number(
    item.companyId !== undefined
      ? item.companyId
      : typeof item.company === 'object' && item.company !== null
      ? item.company.id
      : undefined
  );

  // 1. Match by Company ID (preferred and definitive)
  if (Number.isFinite(companyId) && companyId > 0) {
    const matchedRule = ALLOWED_CARRIER_RULES.find((r) => r.companyId === companyId);
    if (matchedRule) {
      return {
        allowed: true,
        priority: matchedRule.priority,
        canonicalName: matchedRule.canonicalName,
        companyId: matchedRule.companyId,
      };
    }
    // If company ID was explicitly provided but is not in our whitelist, reject it immediately (e.g. Buslog: 3, Total: 6)
    return {
      allowed: false,
      priority: 9999,
      canonicalName: '',
      companyId,
    };
  }

  // 2. Fallback: match by company name or carrier name string
  const textToCheck = [
    typeof item.company === 'string' ? item.company : (item.company?.name || ''),
    item.carrier || '',
    item.name || '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Explicitly reject known non-whitelisted carriers by name
  if (/buslog|total\s*express|latam\s*cargo|via\s*brasil/i.test(textToCheck)) {
    return {
      allowed: false,
      priority: 9999,
      canonicalName: '',
    };
  }

  const matchedRule = ALLOWED_CARRIER_RULES.find((r) => r.matchPattern.test(textToCheck));
  if (matchedRule) {
    return {
      allowed: true,
      priority: matchedRule.priority,
      canonicalName: matchedRule.canonicalName,
      companyId: matchedRule.companyId,
    };
  }

  return {
    allowed: false,
    priority: 9999,
    canonicalName: '',
  };
}

/**
 * Filters a list of shipping quotes to keep only the whitelisted carriers:
 * - Correios
 * - Jadlog
 * - Loggi
 * - Azul Cargo Express
 * - J&T Express
 *
 * Sorts them by carrier priority (Correios > Jadlog > Loggi > Azul Cargo Express > J&T Express)
 * and within each carrier group, sorts by price (lowest to highest).
 * Preserves the actual modalities and pricing returned by Melhor Envio.
 */
export function filterAndSortShippingQuotes<T extends ShippingOption>(quotes: T[]): T[] {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return [];
  }

  // 1. Keep only allowed carriers
  const allowedQuotes: Array<{ quote: T; priority: number }> = [];

  for (const quote of quotes) {
    const match = matchCarrier(quote);
    if (match.allowed) {
      allowedQuotes.push({
        quote: {
          ...quote,
          // Guarantee canonical carrier name if not present
          carrier: quote.carrier || match.canonicalName,
          company: quote.company || match.canonicalName,
        },
        priority: match.priority,
      });
    }
  }

  // 2. Sort by Carrier Priority (1..5), then by Price (asc)
  allowedQuotes.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    const priceA = Number(a.quote.price) || 0;
    const priceB = Number(b.quote.price) || 0;
    return priceA - priceB;
  });

  return allowedQuotes.map((item) => item.quote);
}
