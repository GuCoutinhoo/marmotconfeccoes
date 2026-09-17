import React, { useState } from 'react';
import { Product } from '../../types';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

interface MarmotFitSystemProps {
  onNavigate: (page: string, param?: string) => void;
  onQuickView?: (product: Product) => void;
  products?: Product[];
}

export type FitKey = 'BOXY' | 'OVERSIZED' | 'BAGGY' | 'UTILITY';

interface LookProductItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  category: string;
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
            image: '/fit_card_heavy_boxy.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cam-003',
            slug: 'camiseta-drop-shoulder',
            title: 'CAMISETA DROP SHOULDER',
            price: 159.9,
            image: '/fit_card_drop_shoulder.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA BAGGY',
            price: 299.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CALÇAS',
          },
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            price: 459.9,
            image: '/fit_card_jaqueta_utility.png',
            category: 'JAQUETAS',
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
            image: '/fit_card_mol_boxy.png',
            category: 'MOLETONS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image: '/fit_card_calca_balloon.png',
            category: 'CALÇAS',
          },
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            price: 189.9,
            image: '/fit_card_boxy_branco.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CARGOS',
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
        lookTitle: 'LOOK 1 // CAMISETA RAGLAN OVERSIZED',
        imageSrc: '/03_OVERSIZED_look_1_camiseta_raglan_oversized.png',
        focusPiece: 'Camiseta Raglan Oversized',
        description:
          'Mangas raglan com costuras diagonais contínuas e modelagem com volume streetwear amplo.',
        products: [
          {
            id: 'prod-cam-007',
            slug: 'camiseta-raglan-oversized',
            title: 'CAMISETA RAGLAN OVERSIZED',
            price: 189.9,
            image: '/fit_card_raglan_branco.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-007',
            slug: 'camiseta-raglan-oversized',
            title: 'RAGLAN OVERSIZED PRETA/CINZA',
            price: 189.9,
            image: '/fit_card_raglan_preto.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image: '/fit_card_calca_balloon.png',
            category: 'CALÇAS',
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
            image: '/fit_card_varsity.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            price: 189.9,
            image: '/fit_card_boxy_branco.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY PRETA',
            price: 459.9,
            image: '/fit_card_jaqueta_utility.png',
            category: 'JAQUETAS',
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
            image: '/fit_card_raw_hem_branco.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-008',
            slug: 'camiseta-raw-hem',
            title: 'CAMISETA RAW HEM VERDE',
            price: 189.9,
            image: '/fit_card_raw_hem_verde.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image: '/fit_card_calca_balloon.png',
            category: 'CALÇAS',
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
            image: '/fit_card_washed_escuro.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-010',
            slug: 'camiseta-washed-vintage',
            title: 'WASHED VINTAGE CINZA CLARO',
            price: 189.9,
            image: '/fit_card_washed_claro.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image: '/fit_card_calca_balloon.png',
            category: 'CALÇAS',
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
            image: '/fit_card_jaqueta_utility.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-005',
            slug: 'camiseta-pocket-utility',
            title: 'CAMISETA POCKET UTILITY',
            price: 179.9,
            image: '/fit_card_pocket_utility.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image: '/fit_card_calca_balloon.png',
            category: 'CALÇAS',
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
            image: '/fit_card_mol_utility.png',
            category: 'MOLETONS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: '/fit_card_calca_baggy.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            price: 189.9,
            image: '/fit_card_heavy_boxy.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            price: 459.9,
            image: '/fit_card_jaqueta_utility.png',
            category: 'JAQUETAS',
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

  const activeFit = FIT_SYSTEM_DATA[selectedFit];
  const activeLook =
    activeFit.looks.find((look) => look.lookNumber === selectedLookNumber) ||
    activeFit.looks[0];

  const handleFitSelect = (fitKey: FitKey) => {
    if (fitKey !== selectedFit) {
      setSelectedFit(fitKey);
      setSelectedLookNumber(1);
    }
  };

  const resolveStoreProduct = (item: LookProductItem) =>
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
      <div className="relative mx-auto w-full max-w-[1820px] px-4 sm:px-6 lg:px-8 pt-7 sm:pt-9">
        {/* topo editorial */}
        <div className="relative z-20 flex h-[28px] items-center justify-between border-b border-zinc-200/60 pb-3">
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

        {/* 3 colunas */}
        <div className="relative mt-6 grid min-h-[520px] lg:min-h-[580px] grid-cols-1 items-stretch gap-8 lg:gap-0 lg:grid-cols-[38%_26%_36%]">
          {/* esquerda: composição mais compacta e com ritmo vertical controlado */}
          <div className="relative z-20 flex h-full flex-col justify-center pb-2 lg:pr-8">
            <div className="flex max-w-[500px] flex-col">
              <span className="mb-1.5 block text-xs sm:text-[12px] font-extrabold uppercase tracking-[0.28em] text-zinc-400">
                MODELAGEM & SILHUETAS
              </span>

              <h2 className="text-4xl sm:text-5xl lg:text-[60px] xl:text-[68px] font-black uppercase tracking-[-0.035em] text-zinc-950 leading-[0.9]">
                ESCOLHA O
                <br />
                CAIMENTO.
              </h2>

              <p className="mt-3.5 lg:mt-4 max-w-[470px] font-sans text-base sm:text-[16px] font-normal leading-[1.45] text-zinc-600">
                Cada peça tem sua própria estrutura. Descubra a silhueta que melhor expressa seu estilo e presença no dia a dia.
              </p>

              <div className="mt-4 lg:mt-[18px]">
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="group inline-flex h-12 items-center justify-center gap-3 rounded-[3px] border-2 border-zinc-950 bg-zinc-950 px-7 text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-black active:scale-[0.98] cursor-pointer"
                >
                  <span>EXPLORAR FITS</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.2] transition-transform group-hover:translate-x-1" />
                </button>

                <div className="mt-2.5 flex items-center gap-3 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  <span>BOXY</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-300" />
                  <span>OVERSIZED</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-300" />
                  <span>BAGGY</span>
                </div>
              </div>
            </div>
          </div>

          {/* modelo + seletor de look */}
          <div className="relative z-30 hidden h-[520px] lg:h-[550px] items-end justify-center lg:flex">
            <div
              aria-hidden="true"
              className="absolute bottom-[40px] left-1/2 h-[95px] w-[400px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.075),rgba(0,0,0,0)_70%)] blur-[2px]"
            />

            <img
              key={`${selectedFit}-${selectedLookNumber}`}
              src={activeLook.imageSrc}
              alt={activeLook.lookTitle}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute bottom-[40px] left-1/2 z-10 h-[550px] w-auto max-w-none -translate-x-1/2 object-contain object-bottom xl:h-[580px] mt-0 pt-[20px]"
              style={{ marginTop: 0, paddingTop: '20px' }}
            />

            {/* seletor de look — ligado visualmente ao modelo */}
            <div className="absolute bottom-[8px] left-1/2 z-20 -translate-x-1/2">
              <div className="flex items-center gap-[15px] whitespace-nowrap">
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
                        className="group relative pb-[6px]"
                        aria-pressed={isLookActive}
                      >
                        <span
                          className={`font-mono text-[9px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 ${
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

          {/* direita: stack mais compacto e centralizado verticalmente */}
          <div className="relative z-20 pt-2 lg:flex lg:h-full lg:items-center lg:pt-0 lg:pl-7">
            <div className="flex w-full flex-col gap-2 sm:gap-2.5">
              {FIT_ORDER.map((fitKey) => {
                const fitItem = FIT_SYSTEM_DATA[fitKey];
                const isActive = selectedFit === fitKey;

                return (
                  <button
                    key={fitKey}
                    type="button"
                    onClick={() => handleFitSelect(fitKey)}
                    className={`group relative flex items-center justify-between rounded-[3px] border px-3.5 py-3.5 sm:px-4 sm:py-4 lg:px-[18px] lg:py-[14px] text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-zinc-950 bg-white shadow-xs'
                        : 'border-zinc-200/90 bg-white/90 hover:bg-white hover:border-zinc-400'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-y-0 left-0 w-1.5 bg-[#F4C400] rounded-l-[3px]" />
                    )}

                    <div className="flex min-w-0 items-center gap-3 sm:gap-3.5 pl-1.5">
                      <span className="shrink-0 font-mono text-[11px] sm:text-xs font-extrabold tracking-wider text-zinc-400 transition-colors group-hover:text-zinc-900">
                        {fitItem.code}
                      </span>

                      <div className="min-w-0">
                        <span className="block text-sm sm:text-[15px] lg:text-base font-extrabold uppercase tracking-tight text-zinc-950 leading-none">
                          {fitItem.name}
                        </span>
                        <p className="mt-1 font-sans text-[11.5px] sm:text-xs lg:text-[12.5px] font-normal leading-[1.35] text-zinc-500">
                          {fitItem.shortDescription}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="ml-3 h-4 w-4 shrink-0 stroke-[2] text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-zinc-950" />
                  </button>
                );
              })}
            </div>

            {/* seletor de look no mobile */}
            <div className="mt-4 border-t border-black/10 pt-3 lg:hidden">
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
        <div className="mx-auto w-full max-w-[1820px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-[50px] items-center justify-between border-t border-black/10">
            <div className="flex min-w-0 flex-1 items-center gap-[14px] pr-5">
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                PEÇAS COM ESTE CAIMENTO
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pb-7 sm:pb-8 lg:pb-10">
            {activeLook.products.slice(0, 4).map((item, index) => {
              const formattedPrice = item.price.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              const isTop =
                !item.category?.toUpperCase().includes('CALÇ') &&
                !item.title?.toUpperCase().includes('CALÇA');

              return (
                <div
                  key={`${selectedFit}-${selectedLookNumber}-${item.id}-${index}`}
                  onClick={() => onNavigate('product', item.slug || item.id)}
                  className="group relative flex h-[138px] sm:h-[146px] w-full overflow-hidden rounded-[3px] border border-zinc-200/90 bg-white transition-all duration-200 hover:border-zinc-950 hover:shadow-xs cursor-pointer select-none"
                >
                  {/* Imagem do Produto (à esquerda, flush) */}
                  <div className="h-full w-[44%] sm:w-[46%] shrink-0 overflow-hidden bg-[#EEEEEC]">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-cover ${
                        isTop ? 'object-top' : 'object-center'
                      } transition-transform duration-500 ease-out group-hover:scale-105`}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('fit_card')) {
                          target.src = '/fit_card_heavy_boxy.png';
                        }
                      }}
                    />
                  </div>

                  {/* Informações (à direita: Título, Preço e Seta) */}
                  <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 min-w-0 bg-white">
                    <div>
                      <h4 className="font-bold text-xs sm:text-[13px] uppercase tracking-tight text-zinc-900 group-hover:text-black line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 font-extrabold text-[13.5px] sm:text-sm tracking-tight text-zinc-950 leading-none">
                        R$ {formattedPrice}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-900 transition-colors">
                        VER PEÇA
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2] text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-0.5" />
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