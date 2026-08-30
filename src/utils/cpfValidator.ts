/**
 * CPF Validation and Formatting Utilities for Marmot E-Commerce & Melhor Envio
 * Conforms to Brazilian Federal Revenue (Receita Federal) Modulo 11 Algorithm
 */

/**
 * Strips all non-numeric characters from a CPF string.
 */
export function cleanCpf(cpf: string | undefined | null): string {
  if (!cpf || typeof cpf !== 'string') return '';
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/**
 * Validates a Brazilian CPF using strict digit verification algorithm.
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
