export interface CamisetaVariantImage {
  colorKey: string;
  colorName: string;
  image: string;
}

export interface CamisetaImageMapping {
  defaultImage: string;
  images: string[];
  variants: CamisetaVariantImage[];
}

/**
 * Authoritative mapping between Camisetas products, their color variants,
 * and the 20 new high-resolution images located in /public.
 */
export const CAMISETA_IMAGE_MAPPINGS: Record<string, CamisetaImageMapping> = {
  // 1. Camiseta Contrast Stitch
  'prod-cam-001': {
    defaultImage: '/Camiseta Contrast Stitch - Preto.png',
    images: [
      '/Camiseta Contrast Stitch - Preto.png',
      '/Camiseta Contrast Stitch - Bege.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        image: '/Camiseta Contrast Stitch - Preto.png',
      },
      {
        colorKey: 'bege',
        colorName: 'Bege',
        image: '/Camiseta Contrast Stitch - Bege.png',
      },
    ],
  },

  // 2. Camiseta Double Layer
  'prod-cam-002': {
    defaultImage: '/Camiseta Double Layer - Bege e Marrom.png',
    images: [
      '/Camiseta Double Layer - Bege e Marrom.png',
      '/Camiseta Double Layer - Cinza e Preto.png',
    ],
    variants: [
      {
        colorKey: 'bege-marrom',
        colorName: 'Bege + Marrom',
        image: '/Camiseta Double Layer - Bege e Marrom.png',
      },
      {
        colorKey: 'preto-cinza',
        colorName: 'Preto + Cinza',
        image: '/Camiseta Double Layer - Cinza e Preto.png',
      },
    ],
  },

  // 3. Camiseta Drop Shoulder
  'prod-cam-003': {
    defaultImage: '/Camiseta Drop Shoulder - Marrom.png',
    images: [
      '/Camiseta Drop Shoulder - Marrom.png',
      '/Camiseta Drop Shoulder - Cinza.png',
    ],
    variants: [
      {
        colorKey: 'marrom',
        colorName: 'Marrom',
        image: '/Camiseta Drop Shoulder - Marrom.png',
      },
      {
        colorKey: 'cinza',
        colorName: 'Cinza',
        image: '/Camiseta Drop Shoulder - Cinza.png',
      },
    ],
  },

  // 4. Camiseta Heavy Boxy
  'prod-cam-004': {
    defaultImage: '/Camiseta Heavy Boxy - Preto.png',
    images: [
      '/Camiseta Heavy Boxy - Preto.png',
      '/Camiseta Heavy Boxy - Branco.png',
    ],
    variants: [
      {
        colorKey: 'black',
        colorName: 'Preto',
        image: '/Camiseta Heavy Boxy - Preto.png',
      },
      {
        colorKey: 'offwhite',
        colorName: 'Off White',
        image: '/Camiseta Heavy Boxy - Branco.png',
      },
    ],
  },

  // 5. Camiseta Panel
  'prod-cam-005': {
    defaultImage: '/Camiseta Panel - Bege e Marrom.png',
    images: [
      '/Camiseta Panel - Bege e Marrom.png',
      '/Camiseta Panel - Preto e Cinza.png',
    ],
    variants: [
      {
        colorKey: 'bege-marrom',
        colorName: 'Bege + Marrom',
        image: '/Camiseta Panel - Bege e Marrom.png',
      },
      {
        colorKey: 'preto-cinza',
        colorName: 'Preto + Cinza',
        image: '/Camiseta Panel - Preto e Cinza.png',
      },
    ],
  },

  // 6. Camiseta Pocket Utility
  'prod-cam-006': {
    defaultImage: '/Camiseta Pocket Utility - Verde.png',
    images: [
      '/Camiseta Pocket Utility - Verde.png',
      '/Camiseta Pocket Utility - Preto.png',
    ],
    variants: [
      {
        colorKey: 'verde',
        colorName: 'Verde',
        image: '/Camiseta Pocket Utility - Verde.png',
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        image: '/Camiseta Pocket Utility - Preto.png',
      },
    ],
  },

  // 7. Camiseta Raglan Oversized
  'prod-cam-007': {
    defaultImage: '/Camiseta Raglan Oversized - Branco e Preto.png',
    images: [
      '/Camiseta Raglan Oversized - Branco e Preto.png',
      '/Camiseta Raglan Oversized - Preto e Cinza.png',
    ],
    variants: [
      {
        colorKey: 'preto-branco',
        colorName: 'Preto + Branco',
        image: '/Camiseta Raglan Oversized - Branco e Preto.png',
      },
      {
        colorKey: 'preto-cinza',
        colorName: 'Preto + Cinza',
        image: '/Camiseta Raglan Oversized - Preto e Cinza.png',
      },
    ],
  },

  // 8. Camiseta Raw Hem (Maintains existing catalog image as instructed: no random association for Off-Black)
  'prod-cam-008': {
    defaultImage: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
    images: [
      '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
    ],
    variants: [
      {
        colorKey: 'Preto',
        colorName: 'Off-Black',
        image: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
      },
    ],
  },

  // 9. Camiseta Striped Heavy
  'prod-cam-009': {
    defaultImage: '/Camiseta Striped Heavy - Preto e Branco.png',
    images: [
      '/Camiseta Striped Heavy - Preto e Branco.png',
      '/Camiseta Striped Heavy - Bege e Marrom.png',
    ],
    variants: [
      {
        colorKey: 'branco-e-preto',
        colorName: 'Branco e Preto',
        image: '/Camiseta Striped Heavy - Preto e Branco.png',
      },
      {
        colorKey: 'marrom-e-bege',
        colorName: 'Marrom e Bege',
        image: '/Camiseta Striped Heavy - Bege e Marrom.png',
      },
    ],
  },

  // 10. Camiseta Washed Vintage
  'prod-cam-010': {
    defaultImage: '/Camiseta Washed Vintage - Cinza escuro.png',
    images: [
      '/Camiseta Washed Vintage - Cinza escuro.png',
      '/Camiseta Washed Vintage - Cinza Claro.png',
    ],
    variants: [
      {
        colorKey: 'cinza-escuro',
        colorName: 'Cinza Escuro',
        image: '/Camiseta Washed Vintage - Cinza escuro.png',
      },
      {
        colorKey: 'cinza',
        colorName: 'Cinza',
        image: '/Camiseta Washed Vintage - Cinza Claro.png',
      },
    ],
  },
};

export function getCamisetaImageMapping(productIdOrSlug: string): CamisetaImageMapping | undefined {
  if (!productIdOrSlug) return undefined;
  const clean = productIdOrSlug.toLowerCase().trim();
  if (CAMISETA_IMAGE_MAPPINGS[clean]) {
    return CAMISETA_IMAGE_MAPPINGS[clean];
  }
  // Try matching by slug
  for (const [id, mapping] of Object.entries(CAMISETA_IMAGE_MAPPINGS)) {
    if (id === clean) return mapping;
  }
  return undefined;
}
