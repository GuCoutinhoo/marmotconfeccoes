// Utility to manage category images and ensure persistence in browser localStorage
import { Category } from '../types';

export const CATEGORY_IMAGE_STORAGE_KEY = '@marmot_cached_category_images';
export const CATEGORY_STORAGE_KEY = '@marmot_cached_categories';
export const CATEGORY_IMAGES_VERSION_KEY = '@marmot_category_images_version';
export const CURRENT_CATEGORY_IMAGES_VERSION = '20260906_v2';

export const DEFAULT_CATEGORY_IMAGE_URLS: Record<string, string> = {
  camisetas: '/categories/categoria-camisetas.png?v=20260906_v2',
  moletons: '/categories/categoria-moletons.png?v=20260906_v2',
  jaquetas: '/categories/categoria-jaquetas.png?v=20260906_v2',
  calcas: '/categories/categoria-calcas.png?v=20260906_v2',
  shorts: '/categories/categoria-shorts.png?v=20260906_v2',
  tenis: '/categories/categoria-tenis.png?v=20260906_v2',
  acessorios: '/categories/categoria-acessorios.png?v=20260906_v2',
};

// Normalize slug/id for consistent key lookup
export function normalizeCategorySlug(raw: string): string {
  if (!raw) return '';
  const clean = raw.toLowerCase().trim();
  if (clean === 'calca' || clean === 'calça' || clean === 'calcas' || clean === 'calças') return 'calcas';
  if (clean === 'camiseta' || clean === 'camisetas') return 'camisetas';
  if (clean === 'moletom' || clean === 'moletons') return 'moletons';
  if (clean === 'jaqueta' || clean === 'jaquetas') return 'jaquetas';
  if (clean === 'short' || clean === 'shorts') return 'shorts';
  if (clean === 'tenis' || clean === 'tênis') return 'tenis';
  if (clean === 'acessorio' || clean === 'acessorios' || clean === 'acessório' || clean === 'acessórios') return 'acessorios';
  return clean;
}

/**
 * Retrieve the saved category image map from localStorage
 */
export function getAllStoredCategoryImages(): Record<string, string> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(CATEGORY_IMAGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CategoryImageStorage] Erro ao ler imagens do localStorage:', err);
  }
  return {};
}

/**
 * Retrieve a specific category image from localStorage (or fallback)
 */
export function getStoredCategoryImage(slugOrId: string): string | null {
  const norm = normalizeCategorySlug(slugOrId);
  const storedMap = getAllStoredCategoryImages();
  if (storedMap[norm]) {
    return storedMap[norm];
  }

  // Check in cached categories array
  try {
    const rawCats = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (rawCats) {
      const cats: Category[] = JSON.parse(rawCats);
      if (Array.isArray(cats)) {
        const found = cats.find(
          (c) => normalizeCategorySlug(c.slug || c.id) === norm
        );
        if (found?.image && !found.image.includes('unsplash.com')) {
          return found.image;
        }
      }
    }
  } catch {}

  return DEFAULT_CATEGORY_IMAGE_URLS[norm] || null;
}

/**
 * Save a single category image to localStorage
 */
export function saveCategoryImageToLocalStorage(slugOrId: string, imageSrc: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const norm = normalizeCategorySlug(slugOrId);
  if (!norm || !imageSrc) return;

  try {
    const current = getAllStoredCategoryImages();
    current[norm] = imageSrc;
    localStorage.setItem(CATEGORY_IMAGE_STORAGE_KEY, JSON.stringify(current));
    localStorage.setItem(CATEGORY_IMAGES_VERSION_KEY, CURRENT_CATEGORY_IMAGES_VERSION);

    // Also update inside @marmot_cached_categories if present
    const rawCats = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (rawCats) {
      const cats: Category[] = JSON.parse(rawCats);
      if (Array.isArray(cats)) {
        const updated = cats.map((c) => {
          if (normalizeCategorySlug(c.slug || c.id) === norm) {
            return { ...c, image: imageSrc };
          }
          return c;
        });
        localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updated));
      }
    }
  } catch (err) {
    console.warn('[CategoryImageStorage] Erro ao salvar imagem no localStorage:', err);
  }
}

/**
 * Compress an image via Canvas and convert to Base64 data URL
 * This allows saving actual image bytes in localStorage reliably (< 50KB each).
 */
export function convertImageToOptimizedDataUrl(imgUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 540; // High clarity for thumbnail while keeping size tiny (~35KB)
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imgUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        
        // Try webp first, fallback to jpeg
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', 0.82);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        }

        resolve(dataUrl || imgUrl);
      } catch (e) {
        resolve(imgUrl);
      }
    };
    img.onerror = () => {
      resolve(imgUrl);
    };
    img.src = imgUrl;
  });
}

/**
 * Ensures all category images are saved in localStorage.
 * Converts each category image into a cached data URL or persistent asset URL in localStorage.
 */
export async function ensureCategoryImagesStoredInLocalStorage(forceRefresh = false): Promise<Record<string, string>> {
  if (typeof window === 'undefined' || !window.localStorage) return {};

  const currentVersion = localStorage.getItem(CATEGORY_IMAGES_VERSION_KEY);
  const isOutdated = currentVersion !== CURRENT_CATEGORY_IMAGES_VERSION;
  const stored = getAllStoredCategoryImages();

  // If already saved with current version and has all keys and not forced, return immediately
  const slugs = Object.keys(DEFAULT_CATEGORY_IMAGE_URLS);
  const hasAllSlugs = slugs.every((s) => !!stored[s] && !stored[s].includes('unsplash.com'));

  if (!forceRefresh && !isOutdated && hasAllSlugs) {
    return stored;
  }

  console.log('[CategoryImageStorage] Sincronizando imagens das categorias no localStorage...');

  const updatedMap: Record<string, string> = { ...stored };

  // First ensure default URLs are recorded
  for (const slug of slugs) {
    const defaultUrl = DEFAULT_CATEGORY_IMAGE_URLS[slug];
    if (isOutdated || !updatedMap[slug] || updatedMap[slug].includes('unsplash.com')) {
      updatedMap[slug] = defaultUrl;
    }
  }

  // Save preliminary map so it is instantly available
  try {
    localStorage.setItem(CATEGORY_IMAGE_STORAGE_KEY, JSON.stringify(updatedMap));
    localStorage.setItem(CATEGORY_IMAGES_VERSION_KEY, CURRENT_CATEGORY_IMAGES_VERSION);
  } catch {}

  // Next, asynchronously convert to optimized base64 data URLs to guarantee offline persistence in localStorage
  for (const slug of slugs) {
    const url = DEFAULT_CATEGORY_IMAGE_URLS[slug];
    try {
      const dataUrl = await convertImageToOptimizedDataUrl(url);
      if (dataUrl && dataUrl.startsWith('data:image/')) {
        updatedMap[slug] = dataUrl;
        // Save incrementally to prevent loss if quota is near
        try {
          localStorage.setItem(CATEGORY_IMAGE_STORAGE_KEY, JSON.stringify(updatedMap));
        } catch (storageErr) {
          console.warn('[CategoryImageStorage] Quota storage warning:', storageErr);
          break;
        }
      }
    } catch (conversionErr) {
      console.warn(`[CategoryImageStorage] Falha ao converter imagem ${slug} para base64:`, conversionErr);
    }
  }

  // Update cached categories with the new images
  try {
    const rawCats = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (rawCats) {
      const cats: Category[] = JSON.parse(rawCats);
      if (Array.isArray(cats)) {
        const syncedCats = cats.map((c) => {
          const norm = normalizeCategorySlug(c.slug || c.id);
          return {
            ...c,
            image: updatedMap[norm] || DEFAULT_CATEGORY_IMAGE_URLS[norm] || c.image,
          };
        });
        localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(syncedCats));
      }
    }
    localStorage.setItem(CATEGORY_IMAGES_VERSION_KEY, CURRENT_CATEGORY_IMAGES_VERSION);
  } catch (err) {
    console.warn('[CategoryImageStorage] Erro ao sincronizar categorias no localStorage:', err);
  }

  return updatedMap;
}
