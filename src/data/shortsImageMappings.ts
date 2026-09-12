export interface ShortsVariantImage {
  colorKey: string;
  colorName: string;
  colorHex: string;
  image: string;
}

export interface ShortsImageMapping {
  title: string;
  slug: string;
  defaultImage: string;
  images: string[];
  variants: ShortsVariantImage[];
}

/**
 * Authoritative mapping between Shorts products, their color variants,
 * and the 24 images located in /public.
 */
export const SHORTS_IMAGE_MAPPINGS: Record<string, ShortsImageMapping> = {
  // 1. Shorts Cargo Baggy
  'prod-sho-001': {
    title: 'Shorts Cargo Baggy',
    slug: 'shorts-cargo-baggy',
    defaultImage: '/Shorts Cargo Baggy - cor preto.png',
    images: [
      '/Shorts Cargo Baggy - cor preto.png',
      '/Shorts Cargo Baggy - cor verde oliva.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Cargo Baggy - cor preto.png',
      },
      {
        colorKey: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#556B2F',
        image: '/Shorts Cargo Baggy - cor verde oliva.png',
      },
    ],
  },

  // 2. Shorts Mesh Sport
  'prod-sho-002': {
    title: 'Shorts Mesh Sport',
    slug: 'shorts-mesh-sport',
    defaultImage: '/Shorts Mesh Sport - cor preto.png',
    images: [
      '/Shorts Mesh Sport - cor preto.png',
      '/Shorts Mesh Sport - cor off white.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Mesh Sport - cor preto.png',
      },
      {
        colorKey: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        image: '/Shorts Mesh Sport - cor off white.png',
      },
    ],
  },

  // 3. Shorts Baggy Denim
  'prod-sho-003': {
    title: 'Shorts Baggy Denim',
    slug: 'shorts-baggy-denim',
    defaultImage: '/Shorts Baggy Denim - cor preto.png',
    images: [
      '/Shorts Baggy Denim - cor preto.png',
      '/Shorts Baggy Denim - cor bege.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Baggy Denim - cor preto.png',
      },
      {
        colorKey: 'bege',
        colorName: 'Bege',
        colorHex: '#D2B48C',
        image: '/Shorts Baggy Denim - cor bege.png',
      },
    ],
  },

  // 4. Shorts Denim Washed
  'prod-sho-004': {
    title: 'Shorts Denim Washed',
    slug: 'shorts-denim-washed',
    defaultImage: '/Shorts Denim Washed - cor preto lavado.png',
    images: [
      '/Shorts Denim Washed - cor preto lavado.png',
      '/Shorts Denim Washed - cor azul claro.png',
    ],
    variants: [
      {
        colorKey: 'preto-lavado',
        colorName: 'Preto Lavado',
        colorHex: '#2B2B2B',
        image: '/Shorts Denim Washed - cor preto lavado.png',
      },
      {
        colorKey: 'azul-claro',
        colorName: 'Azul Claro',
        colorHex: '#87CEEB',
        image: '/Shorts Denim Washed - cor azul claro.png',
      },
    ],
  },

  // 5. Shorts Distressed
  'prod-sho-005': {
    title: 'Shorts Distressed',
    slug: 'shorts-distressed',
    defaultImage: '/Shorts Distressed - cor preto.png',
    images: [
      '/Shorts Distressed - cor preto.png',
      '/Shorts Distressed - cor jeans claro.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Distressed - cor preto.png',
      },
      {
        colorKey: 'jeans-claro',
        colorName: 'Jeans Claro',
        colorHex: '#99BADD',
        image: '/Shorts Distressed - cor jeans claro.png',
      },
    ],
  },

  // 6. Shorts Parachute
  'prod-sho-006': {
    title: 'Shorts Parachute',
    slug: 'shorts-parachute',
    defaultImage: '/Shorts Parachute - cor preto.png',
    images: [
      '/Shorts Parachute - cor preto.png',
      '/Shorts Parachute - cor verde oliva.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Parachute - cor preto.png',
      },
      {
        colorKey: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#556B2F',
        image: '/Shorts Parachute - cor verde oliva.png',
      },
    ],
  },

  // 7. Shorts Tech Nylon
  'prod-sho-007': {
    title: 'Shorts Tech Nylon',
    slug: 'shorts-tech-nylon',
    defaultImage: '/Shorts Tech Nylon - cor preto.png',
    images: [
      '/Shorts Tech Nylon - cor preto.png',
      '/Shorts Tech Nylon - cor cinza.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Tech Nylon - cor preto.png',
      },
      {
        colorKey: 'cinza',
        colorName: 'Cinza',
        colorHex: '#708090',
        image: '/Shorts Tech Nylon - cor cinza.png',
      },
    ],
  },

  // 8. Shorts Flame
  'prod-sho-008': {
    title: 'Shorts Flame',
    slug: 'shorts-flame',
    defaultImage: '/Shorts Flame - cor preto.png',
    images: [
      '/Shorts Flame - cor preto.png',
      '/Shorts Flame - cor off white.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Flame - cor preto.png',
      },
      {
        colorKey: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        image: '/Shorts Flame - cor off white.png',
      },
    ],
  },

  // 9. Shorts Minimal
  'prod-sho-009': {
    title: 'Shorts Minimal',
    slug: 'shorts-minimal',
    defaultImage: '/Shorts Minimal - cor preto.png',
    images: [
      '/Shorts Minimal - cor preto.png',
      '/Shorts Minimal - cor bege.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Minimal - cor preto.png',
      },
      {
        colorKey: 'bege',
        colorName: 'Bege',
        colorHex: '#D2B48C',
        image: '/Shorts Minimal - cor bege.png',
      },
    ],
  },

  // 10. Shorts Panel
  'prod-sho-010': {
    title: 'Shorts Panel',
    slug: 'shorts-panel',
    defaultImage: '/Shorts Panel - cor preto.png',
    images: [
      '/Shorts Panel - cor preto.png',
      '/Shorts Panel - cor caqui.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Panel - cor preto.png',
      },
      {
        colorKey: 'caqui',
        colorName: 'Caqui',
        colorHex: '#C3B091',
        image: '/Shorts Panel - cor caqui.png',
      },
    ],
  },

  // 11. Shorts Graphic
  'prod-sho-011': {
    title: 'Shorts Graphic',
    slug: 'shorts-graphic',
    defaultImage: '/Shorts Graphic - cor preto.png',
    images: [
      '/Shorts Graphic - cor preto.png',
      '/Shorts Graphic - cor marrom.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Graphic - cor preto.png',
      },
      {
        colorKey: 'marrom',
        colorName: 'Marrom',
        colorHex: '#5C4033',
        image: '/Shorts Graphic - cor marrom.png',
      },
    ],
  },

  // 12. Shorts Side Stripe
  'prod-sho-012': {
    title: 'Shorts Side Stripe',
    slug: 'shorts-side-stripe',
    defaultImage: '/Shorts Side Stripe - cor preto.png',
    images: [
      '/Shorts Side Stripe - cor preto.png',
      '/Shorts Side Stripe - cor off white.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Side Stripe - cor preto.png',
      },
      {
        colorKey: 'offwhite',
        colorName: 'Off White',
        colorHex: '#F5F5F0',
        image: '/Shorts Side Stripe - cor off white.png',
      },
    ],
  },
};

/**
 * Secondary alias mappings for slug & legacy ID compatibility
 */
const ALIAS_TO_MAPPING_KEY: Record<string, string> = {
  'shorts-cargo-baggy': 'prod-sho-001',
  'shorts-mesh-sport': 'prod-sho-002',
  'shorts-carpenter': 'prod-sho-002',
  'shorts-baggy-denim': 'prod-sho-003',
  'shorts-double-knee': 'prod-sho-003',
  'shorts-denim-washed': 'prod-sho-004',
  'shorts-distressed': 'prod-sho-005',
  'shorts-denim-distressed': 'prod-sho-005',
  'shorts-parachute': 'prod-sho-006',
  'shorts-tech-nylon': 'prod-sho-007',
  'shorts-nylon-utility': 'prod-sho-007',
  'shorts-flame': 'prod-sho-008',
  'shorts-tactical': 'prod-sho-008',
  'shorts-minimal': 'prod-sho-009',
  'shorts-multi-pocket': 'prod-sho-009',
  'shorts-panel': 'prod-sho-010',
  'shorts-panel-construction': 'prod-sho-010',
  'shorts-graphic': 'prod-sho-011',
  'shorts-patchwork': 'prod-sho-011',
  'shorts-side-stripe': 'prod-sho-012',
  'shorts-track-oversized': 'prod-sho-012',
  'prod-sho-014': 'prod-sho-012', // Alias legacy prod-sho-014 to Side Stripe
};

export function getShortsMappingByName(productName?: string | null): ShortsImageMapping | undefined {
  if (!productName) return undefined;
  const clean = productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Direct model title match
  for (const mapping of Object.values(SHORTS_IMAGE_MAPPINGS)) {
    const cleanTitle = mapping.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (clean === cleanTitle || clean.includes(cleanTitle)) {
      return mapping;
    }
  }

  // 2. Specific distinctive product name matches
  if (clean.includes('cargo baggy') || (clean.includes('cargo') && clean.includes('baggy'))) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-001'];
  }
  if (clean.includes('mesh sport') || clean.includes('mesh')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-002'];
  }
  if (clean.includes('baggy denim') || (clean.includes('baggy') && clean.includes('denim'))) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-003'];
  }
  if (clean.includes('denim washed') || clean.includes('washed denim')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-004'];
  }
  if (clean.includes('distressed')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-005'];
  }
  if (clean.includes('parachute')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-006'];
  }
  if (clean.includes('tech nylon') || clean.includes('nylon utility') || clean.includes('utility nylon') || clean.includes('tech')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-007'];
  }
  if (clean.includes('flame') || clean.includes('tactical')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-008'];
  }
  if (clean.includes('minimal') || clean.includes('multi pocket')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-009'];
  }
  if (clean.includes('panel') || clean.includes('panel construction')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-010'];
  }
  if (clean.includes('graphic') || clean.includes('patchwork')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-011'];
  }
  if (clean.includes('side stripe') || clean.includes('track') || clean.includes('raw hem') || clean.includes('stripe')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-012'];
  }
  if (clean.includes('carpenter')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-002'];
  }
  if (clean.includes('double knee')) {
    return SHORTS_IMAGE_MAPPINGS['prod-sho-003'];
  }

  return undefined;
}

export function getShortsImageMapping(
  productIdOrSlugOrTitle?: string | null,
  secondaryTitle?: string | null
): ShortsImageMapping | undefined {
  if (!productIdOrSlugOrTitle && !secondaryTitle) return undefined;

  // 1. Prioritize Product Name / Title match first
  if (secondaryTitle) {
    const bySecTitle = getShortsMappingByName(secondaryTitle);
    if (bySecTitle) return bySecTitle;
  }

  const byPrimaryTitle = getShortsMappingByName(productIdOrSlugOrTitle);
  if (byPrimaryTitle) return byPrimaryTitle;

  const clean = (productIdOrSlugOrTitle || '').toLowerCase().trim();

  // 2. Direct ID match
  if (SHORTS_IMAGE_MAPPINGS[clean]) {
    return SHORTS_IMAGE_MAPPINGS[clean];
  }

  // 3. Alias match
  const aliasTarget = ALIAS_TO_MAPPING_KEY[clean];
  if (aliasTarget && SHORTS_IMAGE_MAPPINGS[aliasTarget]) {
    return SHORTS_IMAGE_MAPPINGS[aliasTarget];
  }

  // 4. Slug match
  for (const mapping of Object.values(SHORTS_IMAGE_MAPPINGS)) {
    if (
      mapping.slug.toLowerCase() === clean ||
      clean.includes(mapping.slug.toLowerCase())
    ) {
      return mapping;
    }
  }

  return undefined;
}
