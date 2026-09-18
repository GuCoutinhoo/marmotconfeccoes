export type FitKey = 'BOXY' | 'OVERSIZED' | 'BAGGY' | 'UTILITY';

export interface FitPieceConfig {
  id: string; // Ex: 'prod-cam-004'
  slug: string;
  title: string;
  category: string;
  price: number;
  // Cor 1
  color1Name: string;
  color1Image: string;
  color1Original: string;
  // Cor 2
  hasColor2: boolean;
  color2Name?: string;
  color2Image?: string;
  color2Original?: string;
}

export interface FitLookConfig {
  lookNumber: 1 | 2;
  lookTitle: string;
  mainImage: string;
  mainImageOriginal: string;
  imageSrc?: string;
  focusPiece: string;
  description: string;
  pieces: FitPieceConfig[];
}

export interface FitCategoryConfig {
  key: FitKey;
  code: string;
  name: string;
  shortDescription: string;
  detailedConcept: string;
  looks: [FitLookConfig, FitLookConfig];
}

export type FitSystemConfig = Record<FitKey, FitCategoryConfig>;

export const DEFAULT_FIT_SYSTEM_CONFIG: FitSystemConfig = {
  BOXY: {
    key: 'BOXY',
    code: '01',
    name: 'BOXY',
    shortDescription: 'Mais reto no tronco. Comprimento mais curto.',
    detailedConcept:
      'Corte geométrico e quadrado, mangas amplas que caem na altura do cotovelo e comprimento rente ao cinto.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // CAMISETA HEAVY BOXY',
        mainImage: '/01_BOXY_look_1_camiseta_heavy_boxy.png',
        mainImageOriginal: '/01_BOXY_look_1_camiseta_heavy_boxy.png',
        focusPiece: 'Camiseta Heavy Boxy 260g',
        description:
          'Construção estruturada com caimento reto no tronco e corte rente à linha da cintura.',
        pieces: [
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            category: 'CAMISETAS',
            price: 179.9,
            color1Name: 'PRETO',
            color1Image: '/Camiseta Heavy Boxy - Preto.png',
            color1Original: '/Camiseta Heavy Boxy - Preto.png',
            hasColor2: true,
            color2Name: 'BRANCO',
            color2Image: '/Camiseta Heavy Boxy - Branco.png',
            color2Original: '/Camiseta Heavy Boxy - Branco.png',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA BAGGY',
            category: 'CALÇAS',
            price: 299.9,
            color1Name: 'PRETO',
            color1Image: '/calca_cargo_baggy_preto.png',
            color1Original: '/calca_cargo_baggy_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // MOLETOM HEAVY BOXY',
        mainImage: '/02_BOXY_look_2_moletom_heavy_boxy.png',
        mainImageOriginal: '/02_BOXY_look_2_moletom_heavy_boxy.png',
        focusPiece: 'Moletom Heavy Boxy 400g',
        description:
          'Moletom encorpado sem elástico apertado na barra, proporções largas e caimento reto imponente.',
        pieces: [
          {
            id: 'prod-mol-008',
            slug: 'moletom-heavy-boxy',
            title: 'MOLETOM HEAVY BOXY',
            category: 'MOLETONS',
            price: 349.9,
            color1Name: 'PRETO',
            color1Image: '/uploads/products/prod-mol-008/2d380b21451a9f61.webp',
            color1Original: '/uploads/products/prod-mol-008/2d380b21451a9f61.webp',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            category: 'CALÇAS',
            price: 319.9,
            color1Name: 'PRETO',
            color1Image: '/calca_balloon_preto.jpg',
            color1Original: '/calca_balloon_preto.jpg',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
    ],
  },

  OVERSIZED: {
    key: 'OVERSIZED',
    code: '02',
    name: 'OVERSIZED',
    shortDescription: 'Volume amplo. Ombros deslocados e visual relaxado.',
    detailedConcept:
      'Linhas caídas nos ombros com corte generoso no tórax e comprimento equilibrado para fluidez de movimento.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // SOBREPOSIÇÃO OVERSIZED',
        mainImage: '/03_OVERSIZED_look_1_camiseta_raglan_oversized.png',
        mainImageOriginal: '/03_OVERSIZED_look_1_camiseta_raglan_oversized.png',
        focusPiece: 'Jaqueta Utility + Cargo',
        description:
          'Composição oversized com jaqueta ampla, base neutra e calça cargo de volume relaxado.',
        pieces: [
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            category: 'JAQUETAS',
            price: 459.9,
            color1Name: 'PRETO',
            color1Image: '/jaqueta_utility_preto.png',
            color1Original: '/jaqueta_utility_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            category: 'CARGOS',
            price: 339.9,
            color1Name: 'PRETO',
            color1Image: '/calca_cargo_baggy_preto.png',
            color1Original: '/calca_cargo_baggy_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // JAQUETA VARSITY OVERSIZED',
        mainImage: '/04_OVERSIZED_look_2_jaqueta_varsity_oversized.png',
        mainImageOriginal: '/04_OVERSIZED_look_2_jaqueta_varsity_oversized.png',
        focusPiece: 'Jaqueta Varsity Oversized',
        description:
          'Silhueta colegial americana reinterpretada com proporções generosas, mangas amplas e lã encorpada.',
        pieces: [
          {
            id: 'prod-jaq-017',
            slug: 'jaqueta-varsity-oversized',
            title: 'JAQUETA VARSITY OVERSIZED',
            category: 'JAQUETAS',
            price: 489.9,
            color1Name: 'PRETO',
            color1Image: '/jaqueta_varsity_preto.png',
            color1Original: '/jaqueta_varsity_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            category: 'CARGOS',
            price: 339.9,
            color1Name: 'PRETO',
            color1Image: '/calca_cargo_baggy_preto.png',
            color1Original: '/calca_cargo_baggy_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
    ],
  },

  BAGGY: {
    key: 'BAGGY',
    code: '03',
    name: 'BAGGY',
    shortDescription: 'Maior folga e queda ampla, principalmente nas pernas.',
    detailedConcept:
      'Caimento relaxado com acumulo natural sobre o tênis, conferindo proporção solta e autêntica.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // CAMISETA RAW HEM + BAGGY',
        mainImage: '/05_BAGGY_look_1_camiseta_raw_hem.png',
        mainImageOriginal: '/05_BAGGY_look_1_camiseta_raw_hem.png',
        focusPiece: 'Camiseta Raw Hem',
        description:
          'Barra com acabamento a fio combinada com a calça baggy para uma transição relaxada e volumosa.',
        pieces: [
          {
            id: 'prod-cam-008',
            slug: 'camiseta-raw-hem',
            title: 'CAMISETA RAW HEM',
            category: 'CAMISETAS',
            price: 189.9,
            color1Name: 'PRETO',
            color1Image: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
            color1Original: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            category: 'CARGOS',
            price: 339.9,
            color1Name: 'PRETO',
            color1Image: '/calca_cargo_baggy_preto.png',
            color1Original: '/calca_cargo_baggy_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // CAMISETA WASHED VINTAGE + BAGGY',
        mainImage: '/06_BAGGY_look_2_camiseta_washed_vintage.png',
        mainImageOriginal: '/06_BAGGY_look_2_camiseta_washed_vintage.png',
        focusPiece: 'Camiseta Washed Vintage',
        description:
          'Lavagem estonada vintage de toque aveludado e caimento com queda encorpada sobre calça baggy.',
        pieces: [
          {
            id: 'prod-cam-010',
            slug: 'camiseta-washed-vintage',
            title: 'CAMISETA WASHED VINTAGE',
            category: 'CAMISETAS',
            price: 189.9,
            color1Name: 'CINZA ESCURO',
            color1Image: '/uploads/products/prod-cam-010/ebb62961e5bdfebc.webp',
            color1Original: '/uploads/products/prod-cam-010/ebb62961e5bdfebc.webp',
            hasColor2: true,
            color2Name: 'CINZA CLARO',
            color2Image: '/uploads/products/prod-cam-010/7bea6b9c3c3cecad.webp',
            color2Original: '/uploads/products/prod-cam-010/7bea6b9c3c3cecad.webp',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            category: 'CARGOS',
            price: 339.9,
            color1Name: 'PRETO',
            color1Image: '/calca_cargo_baggy_preto.png',
            color1Original: '/calca_cargo_baggy_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
    ],
  },

  UTILITY: {
    key: 'UTILITY',
    code: '04',
    name: 'UTILITY',
    shortDescription:
      'Construção funcional com presença técnica e proporções amplas.',
    detailedConcept:
      'Bolsos cargo modulares, tecidos com resistência técnica e modelagem tática estruturada.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // JAQUETA UTILITY MODULAR',
        mainImage: '/07_UTILITY_look_1_jaqueta_utility.png',
        mainImageOriginal: '/07_UTILITY_look_1_jaqueta_utility.png',
        focusPiece: 'Jaqueta Utility Ripstop',
        description:
          'Construção militar tática com múltiplos compartimentos e modelagem técnica contemporânea.',
        pieces: [
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            category: 'JAQUETAS',
            price: 459.9,
            color1Name: 'PRETO',
            color1Image: '/jaqueta_utility_preto.png',
            color1Original: '/jaqueta_utility_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            category: 'CARGOS',
            price: 339.9,
            color1Name: 'PRETO',
            color1Image: '/calca_cargo_baggy_preto.png',
            color1Original: '/calca_cargo_baggy_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // MOLETOM HALF ZIP UTILITY',
        mainImage: '/08_UTILITY_look_2_moletom_half_zip_utility.png',
        mainImageOriginal: '/08_UTILITY_look_2_moletom_half_zip_utility.png',
        focusPiece: 'Moletom Half Zip Utility',
        description:
          'Gola alta com zíper tratorado, punhos estruturados e visual utilitário para sobreposições de inverno.',
        pieces: [
          {
            id: 'prod-mol-007',
            slug: 'moletom-half-zip-utility',
            title: 'MOLETOM HALF ZIP UTILITY',
            category: 'MOLETONS',
            price: 349.9,
            color1Name: 'VERDE MILITAR',
            color1Image: '/uploads/products/prod-mol-007/824eb8663f330877.webp',
            color1Original: '/uploads/products/prod-mol-007/824eb8663f330877.webp',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            category: 'CARGOS',
            price: 339.9,
            color1Name: 'PRETO',
            color1Image: '/calca_cargo_baggy_preto.png',
            color1Original: '/calca_cargo_baggy_preto.png',
            hasColor2: false,
            color2Name: '',
            color2Image: '',
            color2Original: '',
          },
        ],
      },
    ],
  },
};
