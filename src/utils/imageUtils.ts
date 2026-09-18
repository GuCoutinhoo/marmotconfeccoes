import React from 'react';

/**
 * Robust, deterministic image utility for product and category image loading.
 * STRICT RULE: A product must NEVER display an image that belongs to another product or person.
 * Fallback is ALWAYS the official neutral Marmot placeholder SVG.
 */

export const NEUTRAL_PRODUCT_PLACEHOLDER = '/placeholder-product.svg';

/**
 * Returns the guaranteed neutral official Marmot placeholder image URL.
 * NEVER uses Unsplash, random hashes, or photos of other clothes/models.
 */
export function getProductFallbackImage(_category?: string, _seed?: string): string {
  return NEUTRAL_PRODUCT_PLACEHOLDER;
}

/**
 * Normalizes an image URL, ensuring it is not empty, broken base64 or invalid.
 * If invalid or absent, returns the neutral placeholder.
 */
export function getValidProductImageUrl(url?: string | null, _category?: string, _seed?: string): string {
  if (!url || typeof url !== 'string') {
    return NEUTRAL_PRODUCT_PLACEHOLDER;
  }

  const trimmed = url.trim();
  if (trimmed.length < 3) {
    return NEUTRAL_PRODUCT_PLACEHOLDER;
  }

  // Broken, truncated or legacy base64 strings
  if (trimmed.startsWith('data:image')) {
    if (trimmed.length < 50 || !trimmed.includes(';base64,')) {
      return NEUTRAL_PRODUCT_PLACEHOLDER;
    }
  }

  return trimmed;
}

/**
 * React onError handler for <img> elements to gracefully swap to neutral placeholder without infinite loops.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  _category?: string,
  _seed?: string
) {
  const target = e.currentTarget;
  if (!target) return;

  const alreadyFallenBack = target.getAttribute('data-fallback-applied');
  if (alreadyFallenBack === 'true') {
    return;
  }

  target.setAttribute('data-fallback-applied', 'true');
  target.src = NEUTRAL_PRODUCT_PLACEHOLDER;
}

/**
 * Retorna classes de enquadramento limpo por categoria de produto sem scale artificial.
 * Mantém foco anatômico na peça respeitando a resolução 1:1 original da imagem,
 * sem aplicar transform: scale(...) que degradaria nitidez ou textura em telas de alta densidade.
 */
export function getProductCardImageFraming(category?: string): string {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'jaquetas':
      return 'object-cover object-[center_top]';
    case 'moletons':
      return 'object-cover object-[center_16%]';
    case 'camisetas':
      return 'object-cover object-[center_18%]';
    case 'calcas':
      return 'object-cover object-[center_35%]';
    case 'tenis':
    case 'acessorios':
      return 'object-cover object-center';
    default:
      return 'object-cover object-[center_top]';
  }
}
