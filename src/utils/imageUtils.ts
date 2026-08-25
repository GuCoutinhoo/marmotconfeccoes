import React from 'react';

/**
 * Robust image utility for product and category image loading and fail-safe fallbacks.
 */

export const STREETWEAR_FALLBACK_IMAGES: Record<string, string[]> = {
  camisetas: [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80',
  ],
  moletons: [
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80',
  ],
  calcas: [
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80',
  ],
  jaquetas: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
  ],
  acessorios: [
    'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1000&q=80',
  ],
  shorts: [
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=1000&q=80',
  ],
  calcados: [
    'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
  ],
};

/**
 * Returns a guaranteed valid fallback image URL based on category and optional identifier.
 */
export function getProductFallbackImage(category?: string, seed?: string): string {
  const normCat = (category || 'default').toLowerCase().trim();
  const pool = STREETWEAR_FALLBACK_IMAGES[normCat] || STREETWEAR_FALLBACK_IMAGES.default;

  if (!seed) return pool[0];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * Normalizes an image URL, ensuring it is not empty, broken base64 or invalid.
 */
export function getValidProductImageUrl(url?: string | null, category?: string, seed?: string): string {
  if (!url || typeof url !== 'string') {
    return getProductFallbackImage(category, seed);
  }

  const trimmed = url.trim();
  if (trimmed.length < 5) {
    return getProductFallbackImage(category, seed);
  }

  // Broken or truncated base64 strings
  if (trimmed.startsWith('data:image')) {
    if (trimmed.length < 50 || !trimmed.includes(';base64,')) {
      return getProductFallbackImage(category, seed);
    }
  }

  return trimmed;
}

/**
 * React onError handler for <img> elements to gracefully swap to a fallback image without infinite loops.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string,
  seed?: string
) {
  const target = e.currentTarget;
  if (!target) return;

  const alreadyFallenBack = target.getAttribute('data-fallback-applied');
  if (alreadyFallenBack === 'true') {
    // If even the first fallback failed, set to universal streetwear fallback
    target.src = STREETWEAR_FALLBACK_IMAGES.default[0];
    target.setAttribute('data-fallback-applied', 'second');
    return;
  }

  if (alreadyFallenBack === 'second') {
    return;
  }

  target.setAttribute('data-fallback-applied', 'true');
  const fallback = getProductFallbackImage(category, seed);
  target.src = fallback;
}
