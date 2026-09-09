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
 * Retorna classes de enquadramento e zoom sob medida por categoria de produto.
 * Valoriza a peça com caimento editorial de streetwear (estilo lookbook),
 * eliminando excessos de fundo cinza distante sem cortar a cabeça do modelo.
 */
export function getProductCardImageFraming(category?: string): string {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'jaquetas':
      // Imagens 9:16 de estúdio: zoom de 20% com foco na peça, mantendo respiro superior
      return 'object-cover object-[center_top] scale-[1.20] origin-[center_10%] group-hover:scale-[1.26] transform-gpu';
    case 'moletons':
      // Moletons: zoom de 12% focado no peito/capuz
      return 'object-cover object-[center_14%] scale-[1.12] origin-[center_16%] group-hover:scale-[1.18] transform-gpu';
    case 'camisetas':
      // Camisetas: zoom de 12% focado na gola e caimento boxy
      return 'object-cover object-[center_15%] scale-[1.12] origin-[center_18%] group-hover:scale-[1.18] transform-gpu';
    case 'calcas':
      // Calças: foco centrado da cintura à barra
      return 'object-cover object-[center_35%] scale-[1.10] origin-[center_40%] group-hover:scale-[1.16] transform-gpu';
    case 'tenis':
    case 'acessorios':
      // Tênis e acessórios: centralização nítida
      return 'object-cover object-center scale-[1.08] origin-center group-hover:scale-[1.14] transform-gpu';
    default:
      return 'object-cover object-[center_top] scale-[1.14] origin-[center_15%] group-hover:scale-[1.20] transform-gpu';
  }
}
