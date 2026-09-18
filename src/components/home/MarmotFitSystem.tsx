import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  DEFAULT_FIT_SYSTEM_CONFIG,
  type FitSystemConfig,
  type FitKey,
} from '../../types/fitSystem';

export type { FitKey };

interface MarmotFitSystemProps {
  onNavigate: (page: string, param?: string) => void;
  onQuickView?: (product: Product) => void;
  products?: Product[];
}

interface LookProductItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  category: string;
}

interface LookDisplayItem extends LookProductItem {
  variantKey: string;
  colorName?: string;
}

interface LookDefinition {
  lookNumber: 1 | 2;
  lookTitle: string;
  imageSrc: string;
  focusPiece: string;
  description: string;
  products: LookProductItem[];
}

interface FitCategoryDefinition {
  key: FitKey;
  code: string;
  name: string;
  shortDescription: string;
  detailedConcept: string;
  looks: [LookDefinition, LookDefinition];
}

const FIT_SYSTEM_DATA: Record<FitKey, FitCategoryDefinition> = {
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
        imageSrc: '/01_BOXY_look_1_camiseta_heavy_boxy.png',
        focusPiece: 'Camiseta Heavy Boxy 260g',
        description:
          'Construção estruturada com caimento reto no tronco e corte rente à linha da cintura.',
        products: [
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            price: 179.9,
            image: '/Camiseta Heavy Boxy - Preto.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA BAGGY',
            price: 299.9,
            image: '/calca_cargo_baggy_preto.png',
            category: 'CALÇAS',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // MOLETOM HEAVY BOXY',
        imageSrc: '/02_BOXY_look_2_moletom_heavy_boxy.png',
        focusPiece: 'Moletom Heavy Boxy 400g',
        description:
          'Moletom encorpado sem elástico apertado na barra, proporções largas e caimento reto imponente.',
        products: [
          {
            id: 'prod-mol-008',
            slug: 'moletom-heavy-boxy',
            title: 'MOLETOM HEAVY BOXY',
            price: 349.9,
            image: '/uploads/products/prod-mol-008/2d380b21451a9f61.webp',
            category: 'MOLETONS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image: '/calca_balloon_preto.jpg',
            category: 'CALÇAS',
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
        imageSrc: '/03_OVERSIZED_look_1_camiseta_raglan_oversized.png',
        focusPiece: 'Jaqueta Utility + Cargo',
        description:
          'Composição oversized com jaqueta ampla, base neutra e calça cargo de volume relaxado.',
        products: [
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            price: 459.9,
            image: '/jaqueta_utility_preto.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/calca_cargo_baggy_preto.png',
            category: 'CARGOS',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // JAQUETA VARSITY OVERSIZED',
        imageSrc: '/04_OVERSIZED_look_2_jaqueta_varsity_oversized.png',
        focusPiece: 'Jaqueta Varsity Oversized',
        description:
          'Silhueta colegial americana reinterpretada com proporções generosas, mangas amplas e lã encorpada.',
        products: [
          {
            id: 'prod-jaq-017',
            slug: 'jaqueta-varsity-oversized',
            title: 'JAQUETA VARSITY OVERSIZED',
            price: 489.9,
            image: '/jaqueta_varsity_preto.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/calca_cargo_baggy_preto.png',
            category: 'CARGOS',
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
        imageSrc: '/05_BAGGY_look_1_camiseta_raw_hem.png',
        focusPiece: 'Camiseta Raw Hem',
        description:
          'Barra com acabamento a fio combinada com a calça baggy para uma transição relaxada e volumosa.',
        products: [
          {
            id: 'prod-cam-008',
            slug: 'camiseta-raw-hem',
            title: 'CAMISETA RAW HEM',
            price: 189.9,
            image: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/calca_cargo_baggy_preto.png',
            category: 'CARGOS',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // CAMISETA WASHED VINTAGE + BAGGY',
        imageSrc: '/06_BAGGY_look_2_camiseta_washed_vintage.png',
        focusPiece: 'Camiseta Washed Vintage',
        description:
          'Lavagem estonada vintage de toque aveludado e caimento com queda encorpada sobre calça baggy.',
        products: [
          {
            id: 'prod-cam-010',
            slug: 'camiseta-washed-vintage',
            title: 'CAMISETA WASHED VINTAGE',
            price: 189.9,
            image: '/uploads/products/prod-cam-010/ebb62961e5bdfebc.webp',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/calca_cargo_baggy_preto.png',
            category: 'CARGOS',
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
        imageSrc: '/07_UTILITY_look_1_jaqueta_utility.png',
        focusPiece: 'Jaqueta Utility Ripstop',
        description:
          'Construção militar tática com múltiplos compartimentos e modelagem técnica contemporânea.',
        products: [
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            price: 459.9,
            image: '/jaqueta_utility_preto.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/calca_cargo_baggy_preto.png',
            category: 'CARGOS',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // MOLETOM HALF ZIP UTILITY',
        imageSrc: '/08_UTILITY_look_2_moletom_half_zip_utility.png',
        focusPiece: 'Moletom Half Zip Utility',
        description:
          'Gola alta com zíper tratorado, punhos estruturados e visual utilitário para sobreposições de inverno.',
        products: [
          {
            id: 'prod-mol-007',
            slug: 'moletom-half-zip-utility',
            title: 'MOLETOM HALF ZIP UTILITY',
            price: 349.9,
            image: '/uploads/products/prod-mol-007/824eb8663f330877.webp',
            category: 'MOLETONS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/calca_cargo_baggy_preto.png',
            category: 'CARGOS',
          },
        ],
      },
    ],
  },
};

const FIT_ORDER: FitKey[] = ['BOXY', 'OVERSIZED', 'BAGGY', 'UTILITY'];

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const MarmotFitSystem: React.FC<MarmotFitSystemProps> = ({
  onNavigate,
  onQuickView,
  products = [],
}) => {
  const [selectedFit, setSelectedFit] = useState<FitKey>('BOXY');
  const [selectedLookNumber, setSelectedLookNumber] = useState<1 | 2>(1);

  // Dynamic configuration loaded from /api/fit-system (persisted by Admin Panel)
  const [fitConfig, setFitConfig] = useState<FitSystemConfig>(DEFAULT_FIT_SYSTEM_CONFIG);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/fit-system', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && isMounted) {
            setFitConfig(data);
          }
        }
      } catch (err) {
        console.warn('[MarmotFitSystem] Usando dados locais do sistema de caimento:', err);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeFit = fitConfig[selectedFit] || DEFAULT_FIT_SYSTEM_CONFIG[selectedFit] || FIT_SYSTEM_DATA[selectedFit];
  const activeLook =
    activeFit.looks.find((look: any) => look.lookNumber === selectedLookNumber) ||
    activeFit.looks[0];

  const handleFitSelect = (fitKey: FitKey) => {
    if (fitKey !== selectedFit) {
      setSelectedFit(fitKey);
      setSelectedLookNumber(1);
    }
  };

  const resolveStoreProduct = (item: { id?: string; slug?: string }) =>
    products.find(
      (product) => product.id === item.id || product.slug === item.slug,
    );

  const resolveFullProduct = (item: LookProductItem): Product => {
    const storeProduct = resolveStoreProduct(item);
    if (storeProduct) {
      return {
        ...storeProduct,
        image: item.image || storeProduct.image,
        category: item.category || storeProduct.category,
      };
    }

    return {
      id: item.id,
      slug: item.slug || item.id,
      title: item.title,
      subtitle: item.category,
      description: `${item.title} - Caimento ${activeFit.name}`,
      price: item.price,
      category: item.category,
      subcategory: item.category,
      collection: activeFit.name,
      tags: [activeFit.name],
      rating: 4.9,
      reviewCount: 14,
      stockCount: 10,
      sku: `SKU-${item.id}`,
      sizes: ['P', 'M', 'G', 'GG'],
      colors: [
        {
          colorName: 'Padrão',
          colorHex: '#121212',
          color: 'Preto',
          image: item.image,
          images: [item.image],
        },
      ],
      image: item.image,
      images: [item.image],
      details: [`Caimento ${activeFit.name}`],
      careInstructions: [],
    };
  };


  const KNOWN_FIT_CARD_IMAGES: Record<
    string,
    { color1: string; color2?: string }
  > = {
    'prod-cam-004': {
      color1: '/Camiseta Heavy Boxy - Preto.png',
      color2: '/Camiseta Heavy Boxy - Branco.png',
    },
    'prod-cal-002': {
      color1: '/calca_cargo_baggy_preto.png',
    },
    'prod-mol-008': {
      color1: '/uploads/products/prod-mol-008/2d380b21451a9f61.webp',
    },
    'prod-cal-001': {
      color1: '/calca_balloon_preto.jpg',
    },
    'prod-jaq-016': {
      color1: '/jaqueta_utility_preto.png',
    },
    'prod-jaq-017': {
      color1: '/jaqueta_varsity_preto.png',
    },
    'prod-cam-008': {
      color1: '/uploads/products/prod-cam-008/c1c4bef72959eab2.webp',
    },
    'prod-cam-010': {
      color1: '/uploads/products/prod-cam-010/ebb62961e5bdfebc.webp',
      color2: '/uploads/products/prod-cam-010/7bea6b9c3c3cecad.webp',
    },
    'prod-mol-007': {
      color1: '/uploads/products/prod-mol-007/824eb8663f330877.webp',
    },
  };

  const isValidFitProductImage = (src?: string | null) => {
    if (!src || typeof src !== 'string') return false;

    const normalized = src.toLowerCase();
    return (
      !normalized.includes('unsplash.com') &&
      !normalized.includes('fit_card') &&
      !normalized.includes('placeholder')
    );
  };

  /**
   * Retorna no máximo DUAS VARIAÇÕES DE COR reais da mesma peça.
   *
   * IMPORTANTE:
   * - uma segunda foto da MESMA cor não conta como COR 2;
   * - cada entrada de `storeProduct.colors` representa uma cor;
   * - usamos no máximo UMA imagem por cor;
   * - a galeria geral (`storeProduct.images`) NÃO é usada para inventar outra cor.
   */
  const resolveTwoProductVariants = (
    item: any,
    storeProduct?: Product,
  ): Array<{ image: string; colorKey: string }> => {
    const known = KNOWN_FIT_CARD_IMAGES[item?.id];

    const variants: Array<{ image?: string | null; colorKey: string }> = [];

    const pushVariant = (image: string | undefined | null, colorKey: string) => {
      if (!isValidFitProductImage(image)) return;
      variants.push({ image, colorKey });
    };

    // 1) Configuração explícita do Fit System — sempre tem prioridade.
    pushVariant(
      item?.color1Image || item?.color1Original,
      String(item?.color1Name || 'fit-color-1').trim().toLowerCase(),
    );
    pushVariant(
      item?.color2Image || item?.color2Original,
      String(item?.color2Name || 'fit-color-2').trim().toLowerCase(),
    );

    // 2) Cores REAIS cadastradas no produto da loja.
    // Pegamos somente a primeira imagem válida de CADA cor, evitando confundir
    // fotos diferentes da mesma cor com uma segunda opção de cor.
    const storeColors = Array.isArray((storeProduct as any)?.colors)
      ? (storeProduct as any).colors
      : [];

    storeColors.forEach((color: any, colorIndex: number) => {
      const colorImage =
        color?.image ||
        (Array.isArray(color?.images)
          ? color.images.find((img: string) => isValidFitProductImage(img))
          : undefined);

      const colorKey = String(
        color?.id ||
          color?.colorName ||
          color?.name ||
          color?.color ||
          color?.colorHex ||
          color?.hex ||
          `store-color-${colorIndex + 1}`,
      )
        .trim()
        .toLowerCase();

      pushVariant(colorImage, colorKey);
    });

    // 3) Mapeamento local conhecido. Só entra como fallback de cor real.
    pushVariant(known?.color1, 'known-color-1');
    pushVariant(known?.color2, 'known-color-2');

    // 4) Imagem principal só pode servir como OPÇÃO 1.
    // Nunca usamos a galeria geral para criar uma falsa OPÇÃO 2.
    pushVariant((storeProduct as any)?.image || item?.image, 'main-color');

    const seenImages = new Set<string>();
    const seenColors = new Set<string>();
    const uniqueVariants: Array<{ image: string; colorKey: string }> = [];

    for (const variant of variants) {
      if (!variant.image) continue;

      const normalizedImage = variant.image.trim();
      const normalizedColor = variant.colorKey || normalizedImage;

      if (seenImages.has(normalizedImage)) continue;
      if (seenColors.has(normalizedColor)) continue;

      seenImages.add(normalizedImage);
      seenColors.add(normalizedColor);
      uniqueVariants.push({
        image: normalizedImage,
        colorKey: normalizedColor,
      });

      if (uniqueVariants.length === 2) break;
    }

    return uniqueVariants;
  };

  /**
   * A faixa inferior representa SOMENTE as peças presentes no look atual.
   *
   * OPÇÃO 1 = parte de cima na primeira cor + parte de baixo na primeira cor.
   * OPÇÃO 2 = parte de cima na segunda cor + parte de baixo na segunda cor.
   *
   * A OPÇÃO 2 só existe quando TODAS as peças do look possuem uma segunda
   * variação de cor REAL. Assim nunca repetimos a mesma cor só para preencher.
   */
  const sourceLookPieces: any[] =
    Array.isArray((activeLook as any).pieces) &&
    (activeLook as any).pieces.length > 0
      ? (activeLook as any).pieces
      : Array.isArray((activeLook as any).products)
        ? (activeLook as any).products
        : [];

  const lookPieceVariants = sourceLookPieces.map((piece: any) => {
    const storeProduct = resolveStoreProduct(piece);
    const variants = resolveTwoProductVariants(piece, storeProduct);

    return {
      piece,
      storeProduct,
      variants,
      resolvedTitle: storeProduct?.title || piece.title,
      resolvedPrice: storeProduct?.price ?? piece.price,
      resolvedCategory: storeProduct?.category || piece.category,
      resolvedSlug: piece.slug || storeProduct?.slug || piece.id,
    };
  });

  const hasCompleteOption1 =
    lookPieceVariants.length > 0 &&
    lookPieceVariants.every((entry) => Boolean(entry.variants[0]?.image));

  const hasCompleteOption2 =
    lookPieceVariants.length > 0 &&
    lookPieceVariants.every((entry) => Boolean(entry.variants[1]?.image));

  const optionIndexes: number[] = [
    ...(hasCompleteOption1 ? [0] : []),
    ...(hasCompleteOption2 ? [1] : []),
  ];

  const displayLookProducts: LookDisplayItem[] = optionIndexes
    .flatMap((optionIndex) =>
      lookPieceVariants.map((entry) => ({
        id: entry.piece.id,
        slug: entry.resolvedSlug,
        title: entry.resolvedTitle,
        price: entry.resolvedPrice,
        image: entry.variants[optionIndex].image,
        category: entry.resolvedCategory,
        colorName: `OPÇÃO ${optionIndex + 1}`,
        variantKey: `${entry.piece.id}-option-${optionIndex + 1}`,
      } satisfies LookDisplayItem)),
    )
    .slice(0, 4);

  const productGridColumns =
    displayLookProducts.length >= 4
      ? 'lg:grid-cols-4'
      : displayLookProducts.length === 3
        ? 'lg:grid-cols-3'
        : 'lg:grid-cols-2';

  return (
    <section
      id="marmot-fit-system"
      className="relative overflow-hidden text-[#090909]"
      style={{
        background:
          'radial-gradient(ellipse at 50% 47%, rgba(255,255,255,0.98) 0%, rgba(247,247,245,0.96) 44%, rgba(238,238,235,0.98) 100%)',
      }}
    >
      {/* HERO */}
      <div className="relative mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        {/* topo editorial inspirado na referência */}
        <div className="relative z-20 hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
          <div className="flex items-center gap-5">
            <span className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-700">
              MARMOT FIT SYSTEM / {activeFit.code}
            </span>
            <span className="h-px flex-1 bg-black/20" />
          </div>

          <div />

          <div className="flex items-center justify-end gap-5">
            <span className="h-px flex-1 bg-black/20" />
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="group flex shrink-0 items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-900 transition-opacity hover:opacity-60 cursor-pointer"
            >
              <span>GUIA DE CAIMENTO</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        <div className="relative z-20 flex h-[28px] items-center justify-between border-b border-zinc-200/60 pb-3 lg:hidden">
          <span className="font-mono text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.26em] text-zinc-600">
            MARMOT FIT SYSTEM • {activeFit.code}
          </span>

          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="group flex items-center gap-2 font-mono text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.22em] text-zinc-900 transition-opacity hover:opacity-60 cursor-pointer"
          >
            <span>GUIA DE CAIMENTO</span>
            <ArrowUpRight className="h-3.5 w-3.5 stroke-[2] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* hero principal */}
        <div className="relative mt-4 grid grid-cols-1 gap-6 lg:min-h-[470px] lg:grid-cols-[minmax(400px,1.08fr)_minmax(280px,0.82fr)_minmax(440px,1.08fr)] lg:items-center lg:gap-x-5 xl:gap-x-7">
          {/* esquerda */}
          <div className="relative z-20 flex flex-col justify-center lg:pr-1 xl:pr-3">
            <div className="max-w-[560px]">
              <span className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.3em] text-zinc-400 sm:text-[12.5px]">
                MODELAGEM & SILHUETAS
              </span>

              <h2 className="font-black uppercase tracking-[-0.055em] text-zinc-950 leading-[0.87] text-[clamp(54px,4.55vw,78px)]">
                <span className="block whitespace-nowrap">ESCOLHA O</span>
                <span className="block whitespace-nowrap">CAIMENTO.</span>
              </h2>

              <p className="mt-3 max-w-[420px] font-sans text-[16px] font-normal leading-[1.28] text-zinc-700 sm:text-[16.5px] lg:mt-4 lg:text-[17px] xl:max-w-[430px]">
                Cada peça veste de um jeito. Descubra a silhueta que melhor combina com o seu estilo.
              </p>

              <div className="mt-4 lg:mt-5">
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="group inline-flex h-[44px] items-center justify-center gap-3 rounded-[2px] border border-zinc-700 bg-transparent px-7 text-[11px] font-extrabold uppercase tracking-[0.23em] text-zinc-950 transition-all hover:border-zinc-950 hover:bg-white/80 cursor-pointer sm:h-[46px] sm:text-[12px]"
                >
                  <span>EXPLORAR FITS</span>
                  <ArrowRight className="h-4 w-4 stroke-[2] transition-transform group-hover:translate-x-1" />
                </button>

                <div className="mt-3.5 flex items-center gap-3.5 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-zinc-600 sm:text-[10px]">
                  <span>BOXY</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-400" />
                  <span>OVERSIZED</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-400" />
                  <span>BAGGY</span>
                </div>
              </div>
            </div>
          </div>

          {/* centro */}
          <div className="relative z-30 hidden h-[455px] items-end justify-center lg:flex xl:h-[485px]">
            <div
              aria-hidden="true"
              className="absolute bottom-[30px] left-1/2 h-[74px] w-[340px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.09),rgba(0,0,0,0)_72%)] blur-[2px]"
            />

            <img
              key={`${selectedFit}-${selectedLookNumber}`}
              src={(activeLook as any).mainImage || activeLook.imageSrc || (activeLook as any).mainImageOriginal}
              alt={activeLook.lookTitle}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute bottom-[20px] left-1/2 z-10 h-[485px] w-auto max-w-none -translate-x-1/2 object-contain object-bottom xl:h-[520px]"
              style={{ marginTop: 0 }}
            />

            <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2">
              <div className="flex items-center gap-[16px] whitespace-nowrap">
                {activeFit.looks.map((look, index) => {
                  const isLookActive = selectedLookNumber === look.lookNumber;

                  return (
                    <React.Fragment key={look.lookNumber}>
                      {index > 0 && (
                        <span className="font-mono text-[9px] font-medium text-black/20">
                          /
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedLookNumber(look.lookNumber)}
                        className="group relative pb-[8px]"
                        aria-pressed={isLookActive}
                      >
                        <span
                          className={`font-mono text-[9px] font-semibold uppercase tracking-[0.24em] transition-colors duration-200 ${
                            isLookActive
                              ? 'text-black'
                              : 'text-black/28 group-hover:text-black/55'
                          }`}
                        >
                          LOOK {look.lookNumber}
                        </span>

                        <span
                          className={`absolute bottom-0 left-0 h-px transition-all duration-200 ${
                            isLookActive
                              ? 'w-full bg-black'
                              : 'w-0 bg-black/0'
                          }`}
                        />
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* direita */}
          <div className="relative z-20 lg:pl-0">
            <div className="flex flex-col gap-2.5">
              {FIT_ORDER.map((fitKey) => {
                const fitItem = (fitConfig && fitConfig[fitKey]) || FIT_SYSTEM_DATA[fitKey];
                const isActive = selectedFit === fitKey;

                return (
                  <button
                    key={fitKey}
                    type="button"
                    onClick={() => handleFitSelect(fitKey)}
                    className={`group relative grid min-h-[78px] grid-cols-[76px_1fr_1.15fr_30px] items-center rounded-[2px] border border-zinc-200/90 bg-white/70 px-5 py-3.5 text-left transition-all cursor-pointer backdrop-blur-[1px] ${
                      isActive
                        ? 'border-zinc-200 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.18)]'
                        : 'hover:border-zinc-300 hover:bg-white'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-y-0 left-0 w-1.5 bg-[#F4C400]" />
                    )}

                    <div className="flex h-full items-center justify-center pr-5">
                      <span className="font-sans text-[20px] font-black leading-none tracking-[-0.04em] text-zinc-700 lg:text-[21px] xl:text-[22px]">
                        {fitItem.code}
                      </span>
                    </div>

                    <div className="border-l border-black/10 pl-5 pr-5">
                      <span className="block font-black text-[20px] uppercase tracking-[-0.03em] text-zinc-950 leading-none lg:text-[21px] xl:text-[22px]">
                        {fitItem.name}
                      </span>
                    </div>

                    <div className="border-l border-black/10 pl-5 pr-4">
                      <p className="font-sans text-[13px] leading-[1.22] text-zinc-800 lg:text-[13.5px] xl:text-[14px]">
                        {fitItem.shortDescription}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <ArrowRight className="h-[18px] w-[18px] stroke-[1.8] text-zinc-700 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* seletor de look no mobile */}
            <div className="mt-5 border-t border-black/10 pt-3 lg:hidden">
              <div className="flex items-center gap-4">
                {activeFit.looks.map((look, index) => {
                  const isLookActive = selectedLookNumber === look.lookNumber;

                  return (
                    <React.Fragment key={look.lookNumber}>
                      {index > 0 && (
                        <span className="font-mono text-[9px] text-black/20">/</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedLookNumber(look.lookNumber)}
                        className="group relative pb-[6px]"
                        aria-pressed={isLookActive}
                      >
                        <span
                          className={`font-mono text-[9px] font-semibold uppercase tracking-[0.18em] ${
                            isLookActive ? 'text-black' : 'text-black/30'
                          }`}
                        >
                          LOOK {look.lookNumber}
                        </span>

                        <span
                          className={`absolute bottom-0 left-0 h-px ${
                            isLookActive ? 'w-full bg-black' : 'w-0'
                          }`}
                        />
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* produtos */}
      <div className="relative z-20 w-full bg-transparent">
        <div className="mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-[44px] items-center justify-between border-t border-black/10">
            <div className="flex min-w-0 flex-1 items-center gap-[14px] pr-5">
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                PEÇAS DESTE LOOK
              </span>

              <span className="h-px flex-1 bg-black/14" />
            </div>

            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="group flex shrink-0 items-center gap-2.5 pl-5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-55 cursor-pointer"
            >
              VER MAIS PRODUTOS
              <ArrowRight className="h-[13px] w-[13px] stroke-[1.45] transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div
            className={`grid grid-cols-1 gap-2.5 pb-5 sm:grid-cols-2 sm:pb-6 lg:pb-6 ${productGridColumns}`}
          >
            {displayLookProducts.map((item, index) => {
              const formattedPrice = item.price.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              const showColorName = Boolean(item.colorName);
              const normalizedCategory = (item.category || '').toUpperCase();
              const normalizedTitle = (item.title || '').toUpperCase();
              const isBottomPiece =
                normalizedCategory.includes('CALÇ') ||
                normalizedCategory.includes('CARGO') ||
                normalizedTitle.includes('CALÇA') ||
                normalizedTitle.includes('CARGO');

              return (
                <div
                  key={`${selectedFit}-${selectedLookNumber}-${item.variantKey}-${index}`}
                  onClick={() => onNavigate('product', item.slug || item.id)}
                  className="group relative flex h-[122px] sm:h-[126px] lg:h-[130px] w-full overflow-hidden rounded-[3px] border border-zinc-200/90 bg-white transition-all duration-200 hover:border-zinc-950 hover:shadow-xs cursor-pointer select-none"
                >
                  {/* imagem da variação: mais presença visual, sem criar espaços mortos */}
                  <div className="flex h-full w-[43%] shrink-0 items-center justify-center overflow-hidden bg-[#ECEAE6] sm:w-[42%]">
                    <img
                      src={item.image}
                      alt={
                        showColorName
                          ? `${item.title} - ${item.colorName}`
                          : item.title
                      }
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-contain object-center transition-transform duration-500 ease-out ${
                        isBottomPiece
                          ? 'scale-[1.38] group-hover:scale-[1.42]'
                          : 'scale-[1.28] group-hover:scale-[1.32]'
                      }`}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('Heavy%20Boxy') && !target.src.includes('Heavy Boxy')) {
                          target.src = '/Camiseta Heavy Boxy - Preto.png';
                        }
                      }}
                    />
                  </div>

                  {/* informações */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between bg-white p-2.5 sm:p-3 lg:p-3">
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 font-bold text-[11px] uppercase leading-[1.15] tracking-tight text-zinc-900 transition-colors group-hover:text-black sm:text-xs">
                        {item.title}
                      </h4>

                      {showColorName && (
                        <p className="mt-1 font-mono text-[8px] font-extrabold uppercase tracking-[0.2em] text-zinc-500 sm:text-[8.5px]">
                          {item.colorName}
                        </p>
                      )}

                      <p className="mt-1 text-[12px] font-extrabold leading-none tracking-tight text-zinc-950 sm:text-[12.5px]">
                        R$ {formattedPrice}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 transition-colors group-hover:text-zinc-900 sm:text-[9px]">
                        VER PEÇA
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2] text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-950" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};