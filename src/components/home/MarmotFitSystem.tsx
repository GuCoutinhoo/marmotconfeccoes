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
    detailedConcept: 'Corte geométrico e quadrado, mangas amplas que caem na altura do cotovelo e comprimento rente ao cinto.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // CAMISETA HEAVY BOXY',
        imageSrc: '/fit_system_model_boxy.png',
        focusPiece: 'Camiseta Heavy Boxy 260g',
        description: 'Construção estruturada com caimento reto no tronco e corte rente à linha da cintura.',
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
        description: 'Moletom encorpado sem elástico apertado na barra, proporções largas e caimento reto imponente.',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/preto/01-4baf0ddb3e08244f.png',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/verde/01-04ce78f411ae78e5.png',
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
    detailedConcept: 'Linhas caídas nos ombros com corte generoso no tórax e comprimento equilibrado para fluidez de movimento.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // CAMISETA RAGLAN OVERSIZED',
        imageSrc: '/fit_system_model_oversized.png',
        focusPiece: 'Camiseta Raglan Oversized',
        description: 'Mangas raglan com costuras diagonais contínuas e modelagem com volume streetwear amplo.',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
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
            image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
            category: 'CARGOS',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // JAQUETA VARSITY OVERSIZED',
        imageSrc: '/04_OVERSIZED_look_2_jaqueta_varsity_oversized.png',
        focusPiece: 'Jaqueta Varsity Oversized',
        description: 'Silhueta colegial americana reinterpretada com proporções generosas, mangas amplas e lã encorpada.',
        products: [
          {
            id: 'prod-jaq-017',
            slug: 'jaqueta-varsity-oversized',
            title: 'JAQUETA VARSITY OVERSIZED',
            price: 489.9,
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png',
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
    detailedConcept: 'Caimento relaxado com acumulo natural sobre o tênis, conferindo proporção solta e autêntica.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // CAMISETA RAW HEM + BAGGY',
        imageSrc: '/fit_system_model_baggy.png',
        focusPiece: 'Camiseta Raw Hem',
        description: 'Barra com acabamento a fio combinada com a calça baggy para uma transição relaxada e volumosa.',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/marrom/01-7420fefd4335acc4.png',
            category: 'CALÇAS',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // CAMISETA WASHED VINTAGE + BAGGY',
        imageSrc: '/06_BAGGY_look_2_camiseta_washed_vintage.png',
        focusPiece: 'Camiseta Washed Vintage',
        description: 'Lavagem estonada vintage de toque aveludado e caimento com queda encorpada sobre calça baggy.',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
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
            image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
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
    shortDescription: 'Construção funcional com presença técnica e proporções amplas.',
    detailedConcept: 'Bolsos cargo modulares, tecidos com resistência técnica e modelagem tática estruturada.',
    looks: [
      {
        lookNumber: 1,
        lookTitle: 'LOOK 1 // JAQUETA UTILITY MODULAR',
        imageSrc: '/fit_system_model_utility.png',
        focusPiece: 'Jaqueta Utility Ripstop',
        description: 'Construção militar tática com múltiplos compartimentos e modelagem técnica contemporânea.',
        products: [
          {
            id: 'prod-jaq-016',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY',
            price: 459.9,
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/verde/01-647103d9e03cd00e.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-cal-002',
            slug: 'calca-cargo-baggy',
            title: 'CALÇA CARGO BAGGY',
            price: 339.9,
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
            category: 'CARGOS',
          },
          {
            id: 'prod-jaq-016-alt',
            slug: 'jaqueta-utility',
            title: 'JAQUETA UTILITY PRETA',
            price: 459.9,
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-utility/preto/01-7b885c4486cf213c.png',
            category: 'JAQUETAS',
          },
          {
            id: 'prod-crg-010',
            slug: 'calca-cargo-tactical',
            title: 'CALÇA CARGO TACTICAL',
            price: 359.9,
            image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80',
            category: 'CARGOS',
          },
        ],
      },
      {
        lookNumber: 2,
        lookTitle: 'LOOK 2 // MOLETOM HALF ZIP UTILITY',
        imageSrc: '/08_UTILITY_look_2_moletom_half_zip_utility.png',
        focusPiece: 'Moletom Half Zip Utility',
        description: 'Gola alta com zíper tratorado, punhos estruturados e visual utilitário para sobreposições de inverno.',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
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
            image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/preto/01-4baf0ddb3e08244f.png',
            category: 'CALÇAS',
          },
        ],
      },
    ],
  },
};

const FIT_ORDER: FitKey[] = ['BOXY', 'OVERSIZED', 'BAGGY', 'UTILITY'];

export const MarmotFitSystem: React.FC<MarmotFitSystemProps> = ({
  onNavigate,
}) => {
  const [selectedFit, setSelectedFit] = useState<FitKey>('BOXY');
  const [selectedLookNumber, setSelectedLookNumber] = useState<1 | 2>(1);

  const activeFit = FIT_SYSTEM_DATA[selectedFit];
  const activeLook =
    activeFit.looks.find((l) => l.lookNumber === selectedLookNumber) ||
    activeFit.looks[0];

  const handleFitSelect = (fitKey: FitKey) => {
    setSelectedFit(fitKey);
  };

  return (
    <section
      id="marmot-fit-system"
      className="bg-[#ECEBE7] text-[#111111] select-none border-b border-zinc-300/80 pt-5 sm:pt-6 lg:pt-8 pb-5 sm:pb-6 lg:pb-8"
    >
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* ========================================================= */}
        {/* 1. TOPO DA SECTION: LINHA EDITORIAL COM MARMOT FIT SYSTEM */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between pb-3.5 sm:pb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-600">
              MARMOT FIT SYSTEM &nbsp;/&nbsp; {activeFit.code}
            </span>
            <div className="w-24 sm:w-48 lg:w-72 h-px bg-zinc-300 shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:text-zinc-600 flex items-center gap-1.5 transition-colors cursor-pointer group shrink-0"
          >
            <span>GUIA DE CAIMENTO</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. CORPO PRINCIPAL: 3 COLUNAS (ESQUERDA, CENTRO, DIREITA) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-2 sm:py-4">
          {/* ------------------------------------------------------- */}
          {/* LADO ESQUERDO: TÍTULO EM 2 LINHAS + TEXTO + CTA         */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-4 flex flex-col justify-center lg:pr-4">
            <h2 className="font-anton text-5xl sm:text-6xl lg:text-[72px] xl:text-[80px] font-normal uppercase text-black leading-[0.88] tracking-tight mb-4 sm:mb-5">
              ESCOLHA O<br />
              CAIMENTO.
            </h2>

            <p className="text-[14px] sm:text-[15px] lg:text-[15.5px] text-[#444444] font-normal leading-relaxed mb-6 max-w-[340px]">
              Cada peça veste de um jeito.
              <br />
              Descubra a silhueta que melhor combina com o seu estilo.
            </p>

            {/* Botão Explorar Fits */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center gap-3 px-6 sm:px-7 py-3 bg-transparent hover:bg-black text-black hover:text-white border border-black text-[11px] sm:text-[11.5px] font-mono font-bold uppercase tracking-[0.22em] transition-all duration-200 cursor-pointer group"
              >
                <span>EXPLORAR FITS</span>
                <ArrowRight className="w-4 h-4 stroke-[2] transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Micro Breadcrumb dos Fits */}
            <div className="flex items-center gap-3 text-[10.5px] sm:text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500 pt-1">
              <span>BOXY</span>
              <span className="text-zinc-400">•</span>
              <span>OVERSIZED</span>
              <span className="text-zinc-400">•</span>
              <span>BAGGY</span>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* CENTRO: MODELO FULL BODY (SEM CARD, PÉS TOCANDO O PISO) */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-4 flex flex-col items-center justify-end relative h-[480px] sm:h-[540px] lg:h-[600px] xl:h-[640px]">
            <img
              key={`${selectedFit}-${selectedLookNumber}`}
              src={activeLook.imageSrc}
              alt={activeLook.lookTitle}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-auto max-w-full object-contain object-bottom select-none pointer-events-none transition-all duration-300"
            />
          </div>

          {/* ------------------------------------------------------- */}
          {/* LADO DIREITO: 4 CARDS DE FIT IDENTICOS À IMAGEM          */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {FIT_ORDER.map((fitKey) => {
                const fitItem = FIT_SYSTEM_DATA[fitKey];
                const isActive = selectedFit === fitKey;

                return (
                  <div
                    key={fitKey}
                    onClick={() => handleFitSelect(fitKey)}
                    className={`group relative w-full h-[76px] sm:h-[82px] px-4 sm:px-5 transition-all duration-150 cursor-pointer flex items-center justify-between bg-white border ${
                      isActive
                        ? 'border-zinc-200/90 shadow-none'
                        : 'border-transparent hover:border-zinc-200/60'
                    }`}
                  >
                    {/* Borda Amarela Fina de Destaque no Item Ativo */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#F4C400]" />
                    )}

                    <div className="flex items-center gap-3 sm:gap-4 flex-1 pr-3 min-w-0">
                      {/* Código: 01, 02, 03, 04 */}
                      <span
                        className={`font-mono text-sm sm:text-[14px] font-bold w-6 shrink-0 transition-colors ${
                          isActive ? 'text-black' : 'text-zinc-400'
                        }`}
                      >
                        {fitItem.code}
                      </span>

                      {/* Nome do Fit */}
                      <span
                        className={`font-anton text-lg sm:text-xl lg:text-[22px] font-normal uppercase tracking-tight w-24 sm:w-28 shrink-0 transition-colors ${
                          isActive ? 'text-black' : 'text-zinc-800'
                        }`}
                      >
                        {fitItem.name}
                      </span>

                      {/* Divisor Vertical Interno */}
                      <div className="w-px h-7 bg-zinc-200 shrink-0" />

                      {/* Descrição Curta do Fit */}
                      <p className="text-[11.5px] sm:text-[12px] text-[#555555] font-normal leading-snug line-clamp-2 flex-1 max-w-[210px]">
                        {fitItem.shortDescription}
                      </p>
                    </div>

                    {/* Seta de Direcionamento */}
                    <div
                      className={`shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-black translate-x-0.5'
                          : 'text-zinc-400 group-hover:text-black group-hover:translate-x-0.5'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 stroke-[1.8]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. PARTE INFERIOR: PEÇAS COM ESTE CAIMENTO (PRODUTOS)     */}
        {/* ========================================================= */}
        <div className="pt-4 sm:pt-6">
          {/* Cabeçalho com linha divisora contínua */}
          <div className="flex items-center justify-between gap-4 mb-3.5 sm:mb-4">
            <span className="font-mono text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-black shrink-0">
              PEÇAS COM ESTE CAIMENTO
            </span>

            <div className="flex-1 h-px bg-zinc-300" />

            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="font-mono text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:text-zinc-600 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 group"
            >
              <span>VER MAIS PRODUTOS</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Grid dos 4 Cards Horizontais dos Produtos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {activeLook.products.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('product', item.id)}
                className="group bg-white border border-zinc-200/80 flex items-stretch transition-all duration-150 hover:border-zinc-400 cursor-pointer overflow-hidden h-[124px] sm:h-[130px]"
              >
                {/* Foto do Produto */}
                <div className="w-[124px] sm:w-[130px] h-full bg-[#E8E7E3] shrink-0 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Nome + Preço + Seta */}
                <div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-anton text-[13.5px] sm:text-[14px] font-normal uppercase tracking-wide text-black leading-tight line-clamp-2 group-hover:text-zinc-700 transition-colors">
                      {item.title}
                    </h4>
                    <span className="font-sans text-[12.5px] sm:text-[13px] font-normal text-zinc-500 block mt-1">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-start text-black pt-1">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.8] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. BARRA DE RODAPÉ EDITORIAL DA SEÇÃO                     */}
        {/* ========================================================= */}
        <div className="mt-5 sm:mt-6 px-5 py-3.5 bg-[#0A0A0C] text-[#D4D4D4] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[10.5px] font-mono uppercase tracking-[0.22em]">
          <span>ROUPAS PARA MOVIMENTAR O REAL.</span>
          <span>MARMOT® DESDE 2018</span>
        </div>
      </div>
    </section>
  );
};
