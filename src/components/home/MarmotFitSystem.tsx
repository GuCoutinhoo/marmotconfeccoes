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
            image: '/Camiseta Heavy Boxy - Preto.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cam-003',
            slug: 'camiseta-drop-shoulder',
            title: 'CAMISETA DROP SHOULDER',
            price: 159.9,
            image: '/Camiseta Drop Shoulder - Cinza.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA BAGGY',
            price: 299.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CALÇAS',
          },
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            price: 459.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png',
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
            image: '/uploads/products/prod-mol-008/6977d400eb581174.webp',
            category: 'MOLETONS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/preto/01-4baf0ddb3e08244f.png',
            category: 'CALÇAS',
          },
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            price: 189.9,
            image: '/Camiseta Heavy Boxy - Branco.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/verde/01-04ce78f411ae78e5.png',
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
            image: '/Camiseta Raglan Oversized - Branco e Preto.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-007-alt',
            slug: 'camiseta-raglan-oversized',
            title: 'RAGLAN OVERSIZED PRETA/CINZA',
            price: 189.9,
            image: '/Camiseta Raglan Oversized - Preto e Cinza.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-007',
            slug: 'calca-cargo-balloon',
            title: 'CALÇA CARGO BALLOON',
            price: 329.9,
            image:
              'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
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
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            price: 189.9,
            image: '/Camiseta Heavy Boxy - Branco.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-jaq-017-alt',
            slug: 'jaqueta-varsity-oversized',
            title: 'VARSITY OVERSIZED PRETA',
            price: 489.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png',
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
            image: '/Camiseta Raw Hem - Branco.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-008-alt',
            slug: 'camiseta-raw-hem',
            title: 'CAMISETA RAW HEM VERDE',
            price: 189.9,
            image: '/Camiseta Raw Hem - Verde.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/marrom/01-7420fefd4335acc4.png',
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
            image: '/Camiseta Washed Vintage - Cinza escuro.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-010-alt',
            slug: 'camiseta-washed-vintage',
            title: 'WASHED VINTAGE CINZA CLARO',
            price: 189.9,
            image: '/Camiseta Washed Vintage - Cinza Claro.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-007',
            slug: 'calca-cargo-balloon',
            title: 'CALÇA CARGO BALLOON',
            price: 329.9,
            image:
              'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
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
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-jaq-016-alt',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY PRETA',
            price: 459.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-crg-010',
            slug: 'calca-cargo-tactical',
            title: 'CALÇA CARGO TACTICAL',
            price: 359.9,
            image:
              'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80',
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
            image: '/uploads/products/prod-mol-007/62667afc0ce10cbd.webp',
            category: 'MOLETONS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-cam-004',
            slug: 'camiseta-heavy-boxy',
            title: 'CAMISETA HEAVY BOXY',
            price: 189.9,
            image: '/Camiseta Heavy Boxy - Preto.png',
            category: 'CAMISETAS',
          },
          {
            id: 'prod-cal-001',
            slug: 'calca-balloon',
            title: 'CALÇA BALLOON',
            price: 319.9,
            image:
              'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/preto/01-4baf0ddb3e08244f.png',
            category: 'CALÇAS',
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

  const resolveProductData = (item: LookProductItem) => {
    const storeProduct = resolveStoreProduct(item);

    return {
      id: storeProduct?.id || item.id,
      title: storeProduct?.title || item.title,
      price: storeProduct?.promoPrice ?? storeProduct?.price ?? item.price,
      image: storeProduct?.images?.[0] || storeProduct?.image || item.image,
      category: storeProduct?.category || item.category,
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
      <div className="relative mx-auto w-[calc(100%-32px)] max-w-[1494px] pt-[48px] lg:w-[89.4%] lg:pt-[54px]">
        {/* topo editorial */}
        <div className="relative z-20 flex h-[28px] items-center justify-between">
          <span className="relative z-10 bg-[#f2f2ef]/80 pr-5 font-mono text-[10px] font-bold uppercase tracking-[0.29em] text-black">
            MARMOT FIT SYSTEM / {activeFit.code}
          </span>

          <div className="pointer-events-none absolute left-[205px] right-[185px] top-1/2 h-px -translate-y-1/2 bg-black/24" />

          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="group relative z-10 flex items-center gap-3 bg-[#f2f2ef]/80 pl-5 font-mono text-[10px] font-bold uppercase tracking-[0.27em] text-black transition-opacity hover:opacity-60"
          >
            GUIA DE CAIMENTO
            <ArrowUpRight className="h-[14px] w-[14px] stroke-[1.65] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 3 colunas */}
        <div className="relative mt-[31px] grid min-h-[568px] grid-cols-1 items-end gap-0 lg:grid-cols-[31.8%_31.1%_37.1%]">
          {/* esquerda */}
          <div className="relative z-20 self-start pt-[19px] lg:pr-3">
            <h2 className="font-anton text-[56px] font-bold uppercase leading-[0.95] text-black sm:text-[76px] lg:text-[90px] lg:leading-[92.7px]">
              ESCOLHA O
              <br />
              CAIMENTO.
            </h2>

            <p className="mt-[20px] max-w-[420px] font-sans text-[16px] font-normal leading-[1.45] tracking-[-0.012em] text-[#1D1D1D] lg:text-[18px]">
              Cada peça veste de um jeito.
              <br />
              Descubra a silhueta que melhor
              <br className="hidden xl:block" /> combina com o seu estilo.
            </p>

            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="group mt-[27px] flex h-[46px] w-[242px] items-center justify-center gap-5 border border-black/65 bg-transparent font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white"
            >
              EXPLORAR FITS
              <ArrowRight className="h-4 w-4 stroke-[1.65] transition-transform group-hover:translate-x-1" />
            </button>

            <div className="mt-[25px] flex items-center gap-[22px] font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-black">
              <span>BOXY</span>
              <span className="h-[3px] w-[3px] rounded-full bg-black" />
              <span>OVERSIZED</span>
              <span className="h-[3px] w-[3px] rounded-full bg-black" />
              <span>BAGGY</span>
            </div>
          </div>

          {/* modelo + seletor de look */}
          <div className="relative z-30 hidden h-[568px] items-end justify-center lg:flex">
            <div
              aria-hidden="true"
              className="absolute bottom-[48px] left-1/2 h-[115px] w-[470px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.075),rgba(0,0,0,0)_70%)] blur-[2px]"
            />

            <img
              key={`${selectedFit}-${selectedLookNumber}`}
              src={activeLook.imageSrc}
              alt={activeLook.lookTitle}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute bottom-[49px] left-1/2 z-10 h-[625px] w-auto max-w-none -translate-x-1/2 object-contain object-bottom xl:h-[650px]"
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

          {/* direita */}
          <div className="relative z-20 self-start pt-[17px] lg:pl-[31px]">
            {/* FITS */}
            <div className="flex flex-col gap-[13px]">
              {FIT_ORDER.map((fitKey) => {
                const fitItem = FIT_SYSTEM_DATA[fitKey];
                const isActive = selectedFit === fitKey;

                return (
                  <button
                    key={fitKey}
                    type="button"
                    onClick={() => handleFitSelect(fitKey)}
                    className="group relative grid h-[90px] w-full grid-cols-[52px_132px_1px_minmax(0,1fr)_30px] items-center gap-x-[18px] border border-white/95 bg-white/88 text-left shadow-[0_4px_22px_rgba(0,0,0,0.018)] transition-colors hover:bg-white"
                  >
                    {isActive && (
                      <span className="absolute inset-y-0 left-0 w-[4px] bg-[#F6C800]" />
                    )}

                    <span className="pl-[29px] font-bebas text-[23px] font-bold leading-none text-black">
                      {fitItem.code}
                    </span>

                    <span className="font-anton text-[26px] font-bold uppercase leading-none tracking-[-0.01em] text-black">
                      {fitItem.name}
                    </span>

                    <span className="h-[55px] w-px bg-black/16" />

                    <p className="max-w-[245px] pr-1 font-sans text-[15.5px] font-normal leading-[1.25] tracking-[-0.013em] text-[#171717]">
                      {fitItem.shortDescription}
                    </p>

                    <ArrowRight className="h-[22px] w-[22px] justify-self-end stroke-[1.35] text-black transition-transform group-hover:translate-x-1" />
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
        <div className="mx-auto w-[calc(100%-32px)] max-w-[1494px] lg:w-[89.4%]">
          <div className="flex h-[50px] items-center justify-between border-t border-black/10">
            <div className="flex min-w-0 flex-1 items-center gap-[14px] pr-5">
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                PEÇAS DESTE LOOK
              </span>

              <span className="hidden shrink-0 font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-black/35 sm:inline">
                {activeFit.name} / LOOK 0{selectedLookNumber}
              </span>

              <span className="h-px flex-1 bg-black/14" />
            </div>

            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="group flex shrink-0 items-center gap-3 pl-5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-55"
            >
              VER MAIS PRODUTOS
              <ArrowRight className="h-[14px] w-[14px] stroke-[1.45] transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-[12px] pb-[44px] sm:grid-cols-2 sm:pb-[50px] lg:grid-cols-4 lg:pb-[56px]">
            {activeLook.products.slice(0, 4).map((item) => {
              const resolved = resolveProductData(item);

              return (
                <article
                  key={`${selectedFit}-${selectedLookNumber}-${item.id}`}
                  onClick={() =>
                    onNavigate('product', resolved.id)
                  }
                  className="group relative grid h-[184px] cursor-pointer grid-cols-[45%_55%] overflow-hidden border border-black/[0.07] bg-white/72 text-left transition-all duration-250 hover:border-black/25"
                >
                  <div className="relative h-full overflow-hidden bg-[#ECECE9]">
                    <img
                      src={resolved.image}
                      alt={resolved.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                    />

                    {resolved.category && (
                      <div className="absolute left-2.5 top-2.5 z-20">
                        <span className="inline-block rounded-[1px] bg-black/85 px-1.5 py-0.5 font-mono text-[7.5px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-xs">
                          {resolved.category}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex h-full min-w-0 flex-col justify-between bg-white/88 p-[15px] lg:p-[17px]">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-black/45">
                        <span>{activeFit.name}</span>
                        <span className="h-1 w-1 rounded-full bg-black/25" />
                        <span>LOOK 0{selectedLookNumber}</span>
                      </div>

                      <h3 className="mt-1.5 line-clamp-2 font-bebas text-[18px] font-bold uppercase leading-[1.08] tracking-[0.01em] text-black">
                        {resolved.title}
                      </h3>
                    </div>

                    <div className="mt-auto border-t border-black/[0.07] pt-2.5">
                      <div className="flex items-end justify-between gap-1.5">
                        <div className="min-w-0">
                          <span className="block font-mono text-[13.5px] font-bold leading-none tracking-tight text-black">
                            {formatPrice(resolved.price)}
                          </span>

                          <span className="mt-1 block font-sans text-[10px] font-normal leading-none tracking-tight text-black/50">
                            até 6x sem juros
                          </span>
                        </div>

                        <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border border-black/15 bg-black/[0.03] text-black transition-all duration-200 group-hover:border-black group-hover:bg-black group-hover:text-white">
                          <ArrowUpRight className="h-3.5 w-3.5 stroke-[1.85] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};