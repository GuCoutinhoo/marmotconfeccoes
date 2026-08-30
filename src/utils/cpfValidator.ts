/**
 * CPF and CNPJ Validation and Formatting Utilities for Marmot E-Commerce & Melhor Envio
 * Conforms to Brazilian Federal Revenue (Receita Federal) Modulo 11 Algorithm
 */

/**
 * Strips all non-numeric characters from a string.
 */
export function cleanDocument(doc: string | undefined | null): string {
  if (!doc || typeof doc !== 'string') return '';
  return doc.replace(/\D/g, '');
}

/**
 * Strips all non-numeric characters from a CPF string (max 11 digits).
 */
export function cleanCpf(cpf: string | undefined | null): string {
  if (!cpf || typeof cpf !== 'string') return '';
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/**
 * Strips all non-numeric characters from a CNPJ string (max 14 digits).
 */
export function cleanCnpj(cnpj: string | undefined | null): string {
  if (!cnpj || typeof cnpj !== 'string') return '';
  return cnpj.replace(/\D/g, '').slice(0, 14);
}

/**
 * Validates a Brazilian CPF using strict digit verification algorithm (Modulo 11).
 * Rejects invalid lengths, non-numeric strings, and repeated-digit sequences (e.g. 000.000.000-00, 111.111.111-11).
 */
export function isValidCpf(cpf: string | undefined | null): boolean {
  if (!cpf || typeof cpf !== 'string') return false;
  const digits = cpf.replace(/\D/g, '');

  // Must have exactly 11 digits
  if (digits.length !== 11) return false;

  // Reject blacklisted sequences of all identical digits
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // 1st Check Digit (weight 10 down to 2)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.charAt(9), 10)) return false;

  // 2nd Check Digit (weight 11 down to 2)
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

/**
 * Validates a Brazilian CNPJ using strict digit verification algorithm (Modulo 11).
 * Rejects invalid lengths, non-numeric strings, and repeated-digit sequences (e.g. 00.000.000/0000-00, 11.111.111/1111-11).
 */
export function isValidCnpj(cnpj: string | undefined | null): boolean {
  if (!cnpj || typeof cnpj !== 'string') return false;
  const digits = cnpj.replace(/\D/g, '');

  // Must have exactly 14 digits
  if (digits.length !== 14) return false;

  // Reject blacklisted sequences of all identical digits
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // 1st Check Digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits.charAt(12), 10)) return false;

  // 2nd Check Digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits.charAt(i), 10) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(digits.charAt(13), 10)) return false;

  return true;
}

/**
 * Validates a Brazilian document as either valid CPF (11 digits) or valid CNPJ (14 digits).
 */
export function validateSenderDocument(doc: string | undefined | null): {
  valid: boolean;
  type: 'cpf' | 'cnpj' | 'invalid';
  digits: string;
  error?: string;
} {
  const digits = cleanDocument(doc);
  if (!digits) {
    return { valid: false, type: 'invalid', digits: '', error: 'Documento do remetente não informado.' };
  }
  if (digits.length === 11) {
    if (!isValidCpf(digits)) {
      return { valid: false, type: 'cpf', digits, error: 'CPF do remetente inválido nos dígitos verificadores.' };
    }
    return { valid: true, type: 'cpf', digits };
  }
  if (digits.length === 14) {
    if (!isValidCnpj(digits)) {
      return { valid: false, type: 'cnpj', digits, error: 'CNPJ do remetente inválido nos dígitos verificadores.' };
    }
    return { valid: true, type: 'cnpj', digits };
  }
  return {
    valid: false,
    type: 'invalid',
    digits,
    error: `Documento do remetente deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ) válidos. Foram informados ${digits.length} dígitos.`,
  };
}

/**
 * Formats a raw or partial CPF string into the visual mask `000.000.000-00`.
 */
export function formatCpf(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formats a raw or partial CNPJ string into the visual mask `00.000.000/0000-00`.
 */
export function formatCnpj(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Formats either CPF or CNPJ based on digit length.
 */
export function formatDocument(value: string | undefined | null): string {
  const digits = cleanDocument(value);
  if (digits.length <= 11) return formatCpf(digits);
  return formatCnpj(digits);
}

/**
 * Masks a CPF for LGPD / Privacy compliance (e.g. `***.***.***-09`).
 */
export function maskCpf(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return 'Não informado';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) {
    if (digits.length >= 2) return `***.***.***-${digits.slice(-2)}`;
    return 'Não informado';
  }
  return `***.***.***-${digits.slice(9, 11)}`;
}
