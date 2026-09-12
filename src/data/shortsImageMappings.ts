import { Product } from '../types';

export interface ShortsVariantImage {
  colorKey: string;
  colorName: string;
  colorHex: string;
  image: string;
  featuredImage: string;
  images: string[];
}

export interface ShortsImageMapping {
  title: string;
  slug: string;
  sku: string;
  price: number;
  promoPrice?: number;
  defaultImage: string;
  images: string[];
  features: string[];
  variants: ShortsVariantImage[];
}

export const SHORTS_IMAGE_MAPPINGS: Record<string, ShortsImageMapping> = {
  // 1. Shorts Baggy Denim
  'prod-sho-001': {
    title: 'Shorts Baggy Denim',
    slug: 'shorts-baggy-denim',
    sku: 'MM-SHO-001',
    price: 259.90,
    defaultImage: '/Shorts Baggy Denim - cor bege.png',
    images: [
      '/Shorts Baggy Denim - cor bege.png',
      '/Shorts Baggy Denim - cor preto.png',
    ],
    features: [
      'Modelagem baggy streetwear autêntica',
      'Jeans heavyweight 100% algodão premium',
      'Cós estruturado com passantes reforçados',
      'Bolsos frontais e traseiros fundos',
      'Caimento amplo na altura dos joelhos',
      'Pespontos reforçados para alta durabilidade',
    ],
    variants: [
      {
        colorKey: 'bege',
        colorName: 'Bege',
        colorHex: '#C8AD7F',
        image: '/Shorts Baggy Denim - cor bege.png',
        featuredImage: '/Shorts Baggy Denim - cor bege.png',
        images: ['/Shorts Baggy Denim - cor bege.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Baggy Denim - cor preto.png',
        featuredImage: '/Shorts Baggy Denim - cor preto.png',
        images: ['/Shorts Baggy Denim - cor preto.png'],
      },
    ],
  },

  // 2. Shorts Cargo Baggy
  'prod-sho-002': {
    title: 'Shorts Cargo Baggy',
    slug: 'shorts-cargo-baggy',
    sku: 'MM-SHO-002',
    price: 249.90,
    defaultImage: '/Shorts Cargo Baggy - cor verde oliva.png',
    images: [
      '/Shorts Cargo Baggy - cor verde oliva.png',
      '/Shorts Cargo Baggy - cor preto.png',
    ],
    features: [
      'Bolsos cargo laterais fole com fechamento por lapela',
      'Modelagem baggy com corte reto ultra confortável',
      'Sarja peletizada encorpada 100% algodão',
      'Cós com elástico anatômico e cordão interno',
      'Pespontos duplos em áreas de atrito',
      'Estética utilitária e militar urbana',
    ],
    variants: [
      {
        colorKey: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#4A5340',
        image: '/Shorts Cargo Baggy - cor verde oliva.png',
        featuredImage: '/Shorts Cargo Baggy - cor verde oliva.png',
        images: ['/Shorts Cargo Baggy - cor verde oliva.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Cargo Baggy - cor preto.png',
        featuredImage: '/Shorts Cargo Baggy - cor preto.png',
        images: ['/Shorts Cargo Baggy - cor preto.png'],
      },
    ],
  },

  // 3. Shorts Denim Washed
  'prod-sho-003': {
    title: 'Shorts Denim Washed',
    slug: 'shorts-denim-washed',
    sku: 'MM-SHO-003',
    price: 259.90,
    defaultImage: '/Shorts Denim Washed - cor azul claro.png',
    images: [
      '/Shorts Denim Washed - cor azul claro.png',
      '/Shorts Denim Washed - cor preto lavado.png',
    ],
    features: [
      'Lavagem vintage com efeitos de amaciamento exclusivo',
      'Jeans 12oz encorpado com caimento solto',
      'Bolsos funcionais com forro em algodão',
      'Barra clássica com pesponto contrastante',
      'Etiqueta em couro ecológico Marmot Atelier',
      'Toque macio e visual retro dos anos 90',
    ],
    variants: [
      {
        colorKey: 'azul-claro',
        colorName: 'Azul Claro',
        colorHex: '#5E84A6',
        image: '/Shorts Denim Washed - cor azul claro.png',
        featuredImage: '/Shorts Denim Washed - cor azul claro.png',
        images: ['/Shorts Denim Washed - cor azul claro.png'],
      },
      {
        colorKey: 'preto-lavado',
        colorName: 'Preto Lavado',
        colorHex: '#2B2B2B',
        image: '/Shorts Denim Washed - cor preto lavado.png',
        featuredImage: '/Shorts Denim Washed - cor preto lavado.png',
        images: ['/Shorts Denim Washed - cor preto lavado.png'],
      },
    ],
  },

  // 4. Shorts Distressed
  'prod-sho-004': {
    title: 'Shorts Distressed',
    slug: 'shorts-distressed',
    sku: 'MM-SHO-004',
    price: 269.90,
    defaultImage: '/Shorts Distressed - cor jeans claro.png',
    images: [
      '/Shorts Distressed - cor jeans claro.png',
      '/Shorts Distressed - cor preto.png',
    ],
    features: [
      'Puídos e rasgos manuais feitos artesanalmente',
      'Barra desfiada com acabamento em travete de proteção',
      'Jeans denim premium 100% algodão',
      'Modelagem desconstruída com inspiração grunge',
      'Botão e rebites personalizados em metal envelhecido',
      'Caimento solto e atitude streetwear',
    ],
    variants: [
      {
        colorKey: 'jeans-claro',
        colorName: 'Jeans Claro',
        colorHex: '#7898B5',
        image: '/Shorts Distressed - cor jeans claro.png',
        featuredImage: '/Shorts Distressed - cor jeans claro.png',
        images: ['/Shorts Distressed - cor jeans claro.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#181818',
        image: '/Shorts Distressed - cor preto.png',
        featuredImage: '/Shorts Distressed - cor preto.png',
        images: ['/Shorts Distressed - cor preto.png'],
      },
    ],
  },

  // 5. Shorts Flame
  'prod-sho-005': {
    title: 'Shorts Flame',
    slug: 'shorts-flame',
    sku: 'MM-SHO-005',
    price: 249.90,
    defaultImage: '/Shorts Flame - cor off white.png',
    images: [
      '/Shorts Flame - cor off white.png',
      '/Shorts Flame - cor preto.png',
    ],
    features: [
      'Estampa Flame autoral em silk-screen de alta densidade',
      'Moletom careca pesado 320g com toque aveludado',
      'Cintura com elástico largo e cordão em algodão trançado',
      'Bolsos faca laterais e bolso traseiro embutido',
      'Comprimento acima dos joelhos com excelente mobilidade',
      'Design gráfico com DNA contemporâneo Marmot',
    ],
    variants: [
      {
        colorKey: 'off-white',
        colorName: 'Off White',
        colorHex: '#F0EEE9',
        image: '/Shorts Flame - cor off white.png',
        featuredImage: '/Shorts Flame - cor off white.png',
        images: ['/Shorts Flame - cor off white.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Flame - cor preto.png',
        featuredImage: '/Shorts Flame - cor preto.png',
        images: ['/Shorts Flame - cor preto.png'],
      },
    ],
  },

  // 6. Shorts Graphic
  'prod-sho-006': {
    title: 'Shorts Graphic',
    slug: 'shorts-graphic',
    sku: 'MM-SHO-006',
    price: 239.90,
    defaultImage: '/Shorts Graphic - cor marrom.png',
    images: [
      '/Shorts Graphic - cor marrom.png',
      '/Shorts Graphic - cor preto.png',
    ],
    features: [
      'Tipografia e artes conceituais exclusivas Marmot Atelier',
      'Algodão heavyweight respirável de toque macio',
      'Corte reto com fendas laterais para caimento perfeito',
      'Cós ajustável com ponteiras metálicas escovadas',
      'Bolsos laterais com profundidade ideal para smartphone',
      'Visual moderno para compor com sneakers e camisetas oversized',
    ],
    variants: [
      {
        colorKey: 'marrom',
        colorName: 'Marrom',
        colorHex: '#523624',
        image: '/Shorts Graphic - cor marrom.png',
        featuredImage: '/Shorts Graphic - cor marrom.png',
        images: ['/Shorts Graphic - cor marrom.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Graphic - cor preto.png',
        featuredImage: '/Shorts Graphic - cor preto.png',
        images: ['/Shorts Graphic - cor preto.png'],
      },
    ],
  },

  // 7. Shorts Mesh Sport
  'prod-sho-007': {
    title: 'Shorts Mesh Sport',
    slug: 'shorts-mesh-sport',
    sku: 'MM-SHO-007',
    price: 229.90,
    defaultImage: '/Shorts Mesh Sport - cor off white.png',
    images: [
      '/Shorts Mesh Sport - cor off white.png',
      '/Shorts Mesh Sport - cor preto.png',
    ],
    features: [
      'Mesh esportivo premium com camada dupla forrada (zero transparência)',
      'Modelagem inspirada nas bermudas clássicas de basquete dos anos 90',
      'Cós canelado elástico reforçado com cordão de alta resistência',
      'Bolsos com zíper discreto para segurança de itens essenciais',
      'Secagem ultra rápida e respirabilidade incomparável',
      'Patch emborrachado Marmot Athletics na barra',
    ],
    variants: [
      {
        colorKey: 'off-white',
        colorName: 'Off White',
        colorHex: '#F2EFE8',
        image: '/Shorts Mesh Sport - cor off white.png',
        featuredImage: '/Shorts Mesh Sport - cor off white.png',
        images: ['/Shorts Mesh Sport - cor off white.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Mesh Sport - cor preto.png',
        featuredImage: '/Shorts Mesh Sport - cor preto.png',
        images: ['/Shorts Mesh Sport - cor preto.png'],
      },
    ],
  },

  // 8. Shorts Minimal
  'prod-sho-008': {
    title: 'Shorts Minimal',
    slug: 'shorts-minimal',
    sku: 'MM-SHO-008',
    price: 229.90,
    defaultImage: '/Shorts Minimal - cor bege.png',
    images: [
      '/Shorts Minimal - cor bege.png',
      '/Shorts Minimal - cor preto.png',
    ],
    features: [
      'Design clean e monocromático sem estampas ou excessos',
      'Tecido encorpado com toque acetinado e estrutura fluida',
      'Bolsos laterais invisíveis com fecho discreto',
      'Cintura elástica anatômica interna sem marcação',
      'Comprimento equilibrado ideal para looks elegantes do streetwear',
      'Versatilidade extrema para qualquer estação do ano',
    ],
    variants: [
      {
        colorKey: 'bege',
        colorName: 'Bege',
        colorHex: '#C4AA84',
        image: '/Shorts Minimal - cor bege.png',
        featuredImage: '/Shorts Minimal - cor bege.png',
        images: ['/Shorts Minimal - cor bege.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Minimal - cor preto.png',
        featuredImage: '/Shorts Minimal - cor preto.png',
        images: ['/Shorts Minimal - cor preto.png'],
      },
    ],
  },

  // 9. Shorts Panel
  'prod-sho-009': {
    title: 'Shorts Panel',
    slug: 'shorts-panel',
    sku: 'MM-SHO-009',
    price: 269.90,
    defaultImage: '/Shorts Panel - cor caqui.png',
    images: [
      '/Shorts Panel - cor caqui.png',
      '/Shorts Panel - cor preto.png',
    ],
    features: [
      'Construção com recortes geométricos em blocos de tecido contrastantes',
      'Painéis em sarja peletizada e ripstop técnico',
      'Costuras duplas aparentes em linha especial reforçada',
      'Modelagem ampla e estruturada de impacto visual marcante',
      'Bolsos ergonômicos integrados aos recortes',
      'Estética arquitetônica avant-garde',
    ],
    variants: [
      {
        colorKey: 'caqui',
        colorName: 'Caqui',
        colorHex: '#9A8264',
        image: '/Shorts Panel - cor caqui.png',
        featuredImage: '/Shorts Panel - cor caqui.png',
        images: ['/Shorts Panel - cor caqui.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Panel - cor preto.png',
        featuredImage: '/Shorts Panel - cor preto.png',
        images: ['/Shorts Panel - cor preto.png'],
      },
    ],
  },

  // 10. Shorts Parachute
  'prod-sho-010': {
    title: 'Shorts Parachute',
    slug: 'shorts-parachute',
    sku: 'MM-SHO-010',
    price: 249.90,
    defaultImage: '/Shorts Parachute - cor verde oliva.png',
    images: [
      '/Shorts Parachute - cor verde oliva.png',
      '/Shorts Parachute - cor preto.png',
    ],
    features: [
      'Tecido parachute ripstop ultraleve resistente a rasgos e água',
      'Modelagem oversized com reguladores e stoppers metálicos na barra',
      'Cintura com elástico franzido e cordão reforçado',
      'Bolsos laterais amplos e bolsos utilitários com fechamento seguro',
      'Visual técnico com referências à cultura clubber e Y2K',
      'Leveza e conforto absoluto para o dia a dia',
    ],
    variants: [
      {
        colorKey: 'verde-oliva',
        colorName: 'Verde Oliva',
        colorHex: '#44513B',
        image: '/Shorts Parachute - cor verde oliva.png',
        featuredImage: '/Shorts Parachute - cor verde oliva.png',
        images: ['/Shorts Parachute - cor verde oliva.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Parachute - cor preto.png',
        featuredImage: '/Shorts Parachute - cor preto.png',
        images: ['/Shorts Parachute - cor preto.png'],
      },
    ],
  },

  // 11. Shorts Tech Nylon
  'prod-sho-011': {
    title: 'Shorts Tech Nylon',
    slug: 'shorts-tech-nylon',
    sku: 'MM-SHO-011',
    price: 259.90,
    defaultImage: '/Shorts Tech Nylon - cor cinza.png',
    images: [
      '/Shorts Tech Nylon - cor cinza.png',
      '/Shorts Tech Nylon - cor preto.png',
    ],
    features: [
      'Nylon fosco 4-way stretch de alta mobilidade e durabilidade',
      'Tratamento impermeabilizante DWR repelente a água e líquidos',
      'Zíperes selados térmicos à prova de chuva nos bolsos',
      'Fita de fechamento rápido na cintura com fivela magnética Fidlock style',
      'Caimento atlético relaxado ideal para outdoor e cidade',
      'Estética técnica gorpcore de alto padrão',
    ],
    variants: [
      {
        colorKey: 'cinza',
        colorName: 'Cinza',
        colorHex: '#575E6B',
        image: '/Shorts Tech Nylon - cor cinza.png',
        featuredImage: '/Shorts Tech Nylon - cor cinza.png',
        images: ['/Shorts Tech Nylon - cor cinza.png'],
      },
      {
        colorKey: 'preto',
        colorName: 'Preto',
        colorHex: '#121212',
        image: '/Shorts Tech Nylon - cor preto.png',
        featuredImage: '/Shorts Tech Nylon - cor preto.png',
        images: ['/Shorts Tech Nylon - cor preto.png'],
      },
    ],
  },
};

/**
 * Helper to build complete Product objects for the 11 shorts.
 */
export function buildShortsProducts(): Product[] {
  return Object.entries(SHORTS_IMAGE_MAPPINGS).map(([id, mapping], index) => {
    return {
      id,
      slug: mapping.slug,
      title: mapping.title,
      subtitle: mapping.features[0] || 'Shorts Streetwear Autoral',
      description: mapping.features.join('\n'),
      price: mapping.price,
      promoPrice: mapping.promoPrice,
      category: 'shorts',
      subcategory: 'Shorts',
      collection: 'Coleção Marmot Summer & Utility 2026',
      tags: ['Shorts', 'Bermudas', 'Streetwear', 'Lançamento', mapping.title],
      rating: 5.0,
      reviewCount: 14 + (index % 8),
      stockCount: 22 + (index % 10),
      sku: mapping.sku,
      sizes: ['P', 'M', 'G', 'GG', 'XG'],
      colors: mapping.variants.map((v) => ({
        color: v.colorKey,
        colorName: v.colorName,
        colorHex: v.colorHex,
        image: v.image,
        featuredImage: v.featuredImage,
        images: v.images,
        sku: `${mapping.sku}-${v.colorKey.toUpperCase()}`,
        stockCount: 15,
        sizes: ['P', 'M', 'G', 'GG', 'XG'],
      })),
      image: mapping.defaultImage,
      images: mapping.images,
      details: mapping.features,
      careInstructions: [
        'Lavar à máquina em ciclo suave com água fria',
        'Não utilizar alvejantes ou amaciantes agressivos',
        'Secar à sombra em varal (não secar em tambor)',
        'Passar pelo avesso em temperatura média',
      ],
      composition: [
        mapping.title.includes('Denim') || mapping.title.includes('Distressed')
          ? '100% Algodão Denim Heavyweight'
          : mapping.title.includes('Nylon') || mapping.title.includes('Parachute')
          ? '100% Poliamida / Nylon Ripstop DWR'
          : mapping.title.includes('Mesh')
          ? '100% Poliéster Mesh Dupla Camada'
          : '100% Algodão Penteado Heavyweight',
      ],
      weight: 0.42,
      height: 4,
      width: 25,
      length: 30,
      isNewRelease: true,
      isBestSeller: index < 3,
      featured: true,
      status: 'active',
    };
  });
}

export function getShortsImageMapping(idOrSlug: string): ShortsImageMapping | undefined {
  if (!idOrSlug) return undefined;
  const clean = idOrSlug.toLowerCase().trim();
  if (SHORTS_IMAGE_MAPPINGS[clean]) {
    return SHORTS_IMAGE_MAPPINGS[clean];
  }
  for (const [id, mapping] of Object.entries(SHORTS_IMAGE_MAPPINGS)) {
    if (id.toLowerCase() === clean || mapping.slug.toLowerCase() === clean) {
      return mapping;
    }
  }
  return undefined;
}
