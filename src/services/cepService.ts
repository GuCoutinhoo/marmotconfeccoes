/**
 * Utility service for Brazilian Postal Codes (CEP)
 * Formats, normalizes, validates syntax and queries authentic address existence via ViaCEP.
 */

export interface CepValidationResult {
  isValidFormat: boolean;
  exists: boolean;
  isServiceUnavailable?: boolean;
  normalizedCep: string;
  formattedCep: string;
  errorMessage?: string;
  address?: {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    ibge?: string;
  };
}

/**
 * Normalizes any CEP input to exactly 8 numeric digits
 */
export function normalizeCep(value: string | undefined | null): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 8);
}

/**
 * Formats an 8-digit numeric CEP to standard 00000-000 format
 */
export function formatCep(value: string | undefined | null): string {
  const clean = normalizeCep(value);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

/**
 * Checks if a string has valid Brazilian CEP format (either 00000-000 or 8 digits)
 */
export function isValidCepFormat(value: string | undefined | null): boolean {
  if (!value) return false;
  const clean = normalizeCep(value);
  if (clean.length !== 8) return false;
  // Check for repeated dummy strings like 00000000
  if (/^(\d)\1{7}$/.test(clean)) return false;
  return true;
}

/**
 * Consults real CEP existence via ViaCEP API.
 * Distinguishes clearly between:
 * - Invalid format
 * - Non-existent CEP (ViaCEP returns erro: true)
 * - Service unavailable (network/HTTP failure)
 */
export async function validateAndFetchCep(rawCep: string): Promise<CepValidationResult> {
  const normalized = normalizeCep(rawCep);
  const formatted = formatCep(normalized);

  if (!isValidCepFormat(rawCep) || normalized.length !== 8) {
    return {
      isValidFormat: false,
      exists: false,
      normalizedCep: normalized,
      formattedCep: formatted,
      errorMessage: 'CEP inválido. Digite um CEP válido.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        isValidFormat: true,
        exists: false,
        isServiceUnavailable: true,
        normalizedCep: normalized,
        formattedCep: formatted,
        errorMessage: 'Não foi possível validar o CEP neste momento. Tente novamente.',
      };
    }

    const data = await response.json();

    if (data.erro === true || data.erro === 'true') {
      return {
        isValidFormat: true,
        exists: false,
        normalizedCep: normalized,
        formattedCep: formatted,
        errorMessage: 'CEP não encontrado. Verifique o CEP informado.',
      };
    }

    return {
      isValidFormat: true,
      exists: true,
      normalizedCep: normalized,
      formattedCep: formatted,
      address: {
        cep: data.cep || formatted,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: (data.uf || '').toUpperCase(),
        ibge: data.ibge,
      },
    };
  } catch (error: any) {
    console.warn(`[CEP Service] Failed to validate CEP ${normalized}:`, error.message);
    return {
      isValidFormat: true,
      exists: false,
      isServiceUnavailable: true,
      normalizedCep: normalized,
      formattedCep: formatted,
      errorMessage: 'Não foi possível validar o CEP neste momento. Tente novamente.',
    };
  }
}
