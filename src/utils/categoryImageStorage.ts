// Utility to manage category images and ensure persistence in browser localStorage
import { Category } from '../types';

export const CATEGORY_IMAGE_STORAGE_KEY = '@marmot_cached_category_images';
export const CATEGORY_STORAGE_KEY = '@marmot_cached_categories';
export const CATEGORY_IMAGES_VERSION_KEY = '@marmot_category_images_version';
export const CURRENT_CATEGORY_IMAGES_VERSION = '20260918_v12_remover_tenis_acessorios';

export const DEFAULT_CATEGORY_IMAGE_URLS: Record<string, string> = {
  camisetas: '/categories/categoria-camisetas.png?v=20260918_v12_remover_tenis_acessorios',
  moletons: '/categories/categoria-moletons.png?v=20260918_v12_remover_tenis_acessorios',
  jaquetas: '/categories/categoria-jaquetas.png?v=20260918_v12_remover_tenis_acessorios',
  calcas: '/categories/categoria-calcas.png?v=20260918_v12_remover_tenis_acessorios',
  cargos: '/categories/categoria-calcas.png?v=20260918_v12_remover_tenis_acessorios',
  shorts: '/categories/categoria-shorts.png?v=20260918_v12_remover_tenis_acessorios',
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
  const defaultUrl = DEFAULT_CATEGORY_IMAGE_URLS[norm];

  if (typeof window !== 'undefined' && window.localStorage) {
    const currentVersion = localStorage.getItem(CATEGORY_IMAGES_VERSION_KEY);
    if (currentVersion !== CURRENT_CATEGORY_IMAGES_VERSION) {
      try {
        localStorage.removeItem(CATEGORY_IMAGE_STORAGE_KEY);
        localStorage.removeItem(CATEGORY_STORAGE_KEY);
        localStorage.setItem(CATEGORY_IMAGES_VERSION_KEY, CURRENT_CATEGORY_IMAGES_VERSION);
      } catch {}
      return defaultUrl || null;
    }
  }

  const storedMap = getAllStoredCategoryImages();

  // If stored image is a compressed low-res dataUrl or outdated, prefer high-res default asset
  if (
    storedMap[norm] &&
    !storedMap[norm].startsWith('data:image/') &&
    (storedMap[norm].includes(CURRENT_CATEGORY_IMAGES_VERSION) || storedMap[norm].startsWith('http'))
  ) {
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
        if (
          found?.image &&
          !found.image.includes('unsplash.com') &&
          !found.image.startsWith('data:image/') &&
          (found.image.includes(CURRENT_CATEGORY_IMAGES_VERSION) || found.image.startsWith('http'))
        ) {
          return found.image;
        }
      }
    }
  } catch {}

  return defaultUrl || null;
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
 * Returns the high-resolution image URL directly without lossy client-side canvas downsampling.
 * Preserves the pristine original resolution and prevents 540px/0.82 compression degradation.
 */
export function convertImageToOptimizedDataUrl(imgUrl: string): Promise<string> {
  return Promise.resolve(imgUrl);
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
  const hasAllSlugs = slugs.every(
    (s) => !!stored[s] && !stored[s].includes('unsplash.com') && (stored[s].includes(CURRENT_CATEGORY_IMAGES_VERSION) || stored[s].startsWith('http'))
  );

  if (!forceRefresh && !isOutdated && hasAllSlugs) {
    return stored;
  }

  console.log('[CategoryImageStorage] Sincronizando imagens das categorias no localStorage...');

  const updatedMap: Record<string, string> = { ...stored };

  // Ensure direct high-resolution URLs are recorded without downscaling
  for (const slug of slugs) {
    const defaultUrl = DEFAULT_CATEGORY_IMAGE_URLS[slug];
    updatedMap[slug] = defaultUrl;
  }

  // Save map with HD asset paths
  try {
    localStorage.setItem(CATEGORY_IMAGE_STORAGE_KEY, JSON.stringify(updatedMap));
    localStorage.setItem(CATEGORY_IMAGES_VERSION_KEY, CURRENT_CATEGORY_IMAGES_VERSION);
  } catch {}

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
