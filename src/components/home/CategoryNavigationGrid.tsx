import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  getStoredCategoryImage,
  ensureCategoryImagesStoredInLocalStorage,
} from '../../utils/categoryImageStorage';

interface CategoryNavigationGridProps {
  onNavigate: (page: string, param?: string) => void;
}

interface CategoryEditorialItem {
  id: string;
  slug: string;
  number: string;
  name: string;
  tagline: string;
  subcategoriesText: string;
  image: string;
  fallbackImage: string;
  objectPosition: string;
}

const CATEGORY_EDITORIAL_ITEMS: CategoryEditorialItem[] = [
  {
    id: 'camisetas',
    slug: 'camisetas',
    number: '01',
    name: 'CAMISETAS',
    tagline: 'ESSENCIAL NO SEU ESTILO',
    subcategoriesText: 'Graphic Tees • Heavyweight 260g • Acid Wash',
    image: '/categories/categoria-camisetas.png',
    fallbackImage: '/categoria camiseta.png',
    objectPosition: 'center 14%',
  },
  {
    id: 'moletons',
    slug: 'moletons',
    number: '02',
    name: 'MOLETONS',
    tagline: 'CONFORTO URBANO',
    subcategoriesText: 'Hoodies • Zip Hoodie • Crewneck',
    image: '/categories/categoria-moletons.png',
    fallbackImage: '/categoria moletom.png',
    objectPosition: 'center 8%',
  },
  {
    id: 'jaquetas',
    slug: 'jaquetas',
    number: '03',
    name: 'JAQUETAS',
    tagline: 'PROTEÇÃO COM ATITUDE',
    subcategoriesText: 'Puffers • Windbreakers • Work Jacket',
    image: '/categories/categoria-jaquetas.png',
    fallbackImage: '/categoria jaqueta.png',
    objectPosition: 'center 14%',
  },
  {
    id: 'calcas',
    slug: 'calcas',
    number: '04',
    name: 'CALÇAS',
    tagline: 'LIBERDADE EM MOVIMENTO',
    subcategoriesText: 'Baggy • Wide Leg • Cargo • Track Pants',
    image: '/categories/categoria-calcas.png',
    fallbackImage: '/categoria calca.png',
    objectPosition: 'center 35%',
  },
  {
    id: 'shorts',
    slug: 'shorts',
    number: '05',
    name: 'SHORTS',
    tagline: 'VERÃO SEM LIMITES',
    subcategoriesText: 'Cargo • Denim • Esportivos',
    image: '/categories/categoria-shorts.png',
    fallbackImage: '/categoria shorts.png',
    objectPosition: 'center 15%',
  },
  {
    id: 'tenis',
    slug: 'tenis',
    number: '06',
    name: 'TÊNIS',
    tagline: 'PASSOS DE ATITUDE',
    subcategoriesText: 'Sneakers Chunky • Retro Runner',
    image: '/categories/categoria-tenis.png',
    fallbackImage: '/categoria tenis.png',
    objectPosition: 'center 62%',
  },
  {
    id: 'acessorios',
    slug: 'acessorios',
    number: '07',
    name: 'ACESSÓRIOS',
    tagline: 'DETALHES QUE DEFINEM',
    subcategoriesText: 'Bags Táticas • Correntes • Headwear',
    image: '/categories/categoria-acessorios.png',
    fallbackImage: '/categoria acessorios.png',
    objectPosition: 'center 18%',
  },
];

export const CategoryNavigationGrid: React.FC<CategoryNavigationGridProps> = ({ onNavigate }) => {
  const { categories } = useStore();
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const [activeOffset, setActiveOffset] = useState(0);
  const [isSectionInView, setIsSectionInView] = useState(false);

  // Garante sincronização de imagens em localStorage
  useEffect(() => {
    ensureCategoryImagesStoredInLocalStorage().catch((err) => {
      console.warn('Erro ao sincronizar imagens com localStorage:', err);
    });
  }, []);

  // Monitora rolagem para disparar animação de entrada
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let isScrollingDown = true;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const diff = currentScrollY - lastScrollY;
      if (Math.abs(diff) > 2) {
        isScrollingDown = diff > 0;
      }
      lastScrollY = currentScrollY;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      if (rect.top >= windowHeight) {
        setIsSectionInView(false);
        return;
      }

      if (isScrollingDown && rect.top <= windowHeight * 0.88 && rect.bottom >= 0) {
        setIsSectionInView(true);
        return;
      }

      if (!isScrollingDown && rect.bottom >= 0 && rect.top < windowHeight) {
        setIsSectionInView(true);
      }
    };

    const initialScrollY = window.scrollY || window.pageYOffset || 0;
    const initialRect = el.getBoundingClientRect();
    const initialWindowHeight = window.innerHeight || document.documentElement.clientHeight;

    if (initialScrollY > 100 || (initialRect.top < initialWindowHeight * 0.88 && initialRect.bottom > 0)) {
      setIsSectionInView(true);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const totalCategories = CATEGORY_EDITORIAL_ITEMS.length;

  const handlePrev = () => {
    setActiveOffset((prev) => (prev - 1 + totalCategories) % totalCategories);
  };

  const handleNext = () => {
    setActiveOffset((prev) => (prev + 1) % totalCategories);
  };

  // Obter imagem preferencial (localStorage ou asset de alta definição)
  const getCardImage = (item: CategoryEditorialItem) => {
    const stored = getStoredCategoryImage(item.slug);
    if (stored) return stored;

    // Se no store houver imagem customizada válida
    const matchedStoreCat = categories?.find((c) => c.slug?.toLowerCase() === item.slug);
    if (matchedStoreCat?.image && !matchedStoreCat.image.includes('unsplash.com')) {
      return matchedStoreCat.image;
    }

    return item.image;
  };

  // 5 itens visíveis no layout harmônico de 3 colunas (idêntico à imagem de referência)
  const item0 = CATEGORY_EDITORIAL_ITEMS[activeOffset % totalCategories]; // Coluna 1 (01 CAMISETAS - Tall Hero)
  const item1 = CATEGORY_EDITORIAL_ITEMS[(activeOffset + 1) % totalCategories]; // Coluna 2 Topo (02 MOLETONS)
  const item2 = CATEGORY_EDITORIAL_ITEMS[(activeOffset + 2) % totalCategories]; // Coluna 3 Topo (03 JAQUETAS)
  const item3 = CATEGORY_EDITORIAL_ITEMS[(activeOffset + 3) % totalCategories]; // Coluna 2 Base (04 CALÇAS)
  const item4 = CATEGORY_EDITORIAL_ITEMS[(activeOffset + 4) % totalCategories]; // Coluna 3 Base (05 SHORTS)

  const renderCategoryCard = (
    item: CategoryEditorialItem,
    isTallHero: boolean = false,
    delay: number = 0.08
  ) => {
    return (
      <motion.article
        key={`cat-${item.id}-${item.number}`}
        onClick={() => onNavigate('shop', item.slug)}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 22, scale: 0.98 }}
        animate={
          isSectionInView
            ? { opacity: 1, y: 0, scale: 1 }
            : shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: 22, scale: 0.98 }
        }
        transition={{
          duration: 0.5,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`group relative rounded-[3px] overflow-hidden bg-[#111113] border border-[#27272A] hover:border-zinc-500 cursor-pointer shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.22)] transition-all duration-300 flex flex-col justify-end w-full ${
          isTallHero
            ? 'w-full h-[480px] sm:h-[530px] lg:h-full min-h-[480px] lg:min-h-[680px] xl:min-h-[720px] 2xl:min-h-[750px]'
            : 'h-[290px] sm:h-[315px] lg:h-[335px] xl:h-[350px] 2xl:h-[365px]'
        }`}
      >
        {/* Marca d'água superior esquerda no Card 01 / Destaque principal */}
        {isTallHero && (
          <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-20 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.24em] leading-tight pointer-events-none select-none">
            <p className="font-bold text-[#F4C400]">MARMOT</p>
            <p className="text-zinc-300">URBAN SUPPLY</p>
            <p className="text-zinc-400">EST. 2018</p>
          </div>
        )}

        {/* Foto Editorial de Fundo */}
        <img
          src={getCardImage(item)}
          alt={item.name}
          loading={isTallHero ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          style={{
            objectPosition: item.objectPosition || 'center 15%',
            transformOrigin: 'center 15%',
          }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.98] contrast-[1.03] select-none"
          onError={(e) => {
            if (e.currentTarget.src !== item.fallbackImage) {
              e.currentTarget.src = item.fallbackImage;
            }
          }}
        />

        {/* Gradiente de Iluminação Editorial */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 via-35% to-transparent pointer-events-none" />

        {/* Conteúdo Inferior: Número + Traço Horizontal + Título + Tagline + Botão Circular ( → ) */}
        <div
          className={`relative z-20 flex items-end justify-between gap-3 ${
            isTallHero ? 'p-5 sm:p-6 lg:p-7 xl:p-8' : 'p-4 sm:p-5 lg:p-5.5 xl:p-6'
          }`}
        >
          <div className="space-y-0.5 min-w-0 flex-1">
            {/* Número + Linha de Ateliê em Amarelo Assinatura */}
            <div className="flex items-center gap-2.5 mb-1.5 sm:mb-2">
              <span className="font-mono text-xs sm:text-[13px] font-bold tracking-[0.2em] text-[#F4C400]">
                {item.number}
              </span>
              <div className="w-7 sm:w-9 h-[2px] bg-[#F4C400] rounded-full" />
            </div>

            {/* Nome da Categoria em Tipografia Imponente Branca */}
            <h3
              className={`font-black text-white uppercase tracking-tight leading-none drop-shadow-md ${
                isTallHero
                  ? 'text-3xl sm:text-4xl lg:text-[34px] xl:text-[40px]'
                  : 'text-xl sm:text-2xl lg:text-[24px] xl:text-[27px]'
              }`}
            >
              {item.name}
            </h3>

            {/* Subtítulo / Tagline */}
            <p className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-zinc-300 mt-2 sm:mt-2.5 drop-shadow-xs">
              {item.tagline}
            </p>
          </div>

          {/* Botão Circular com Seta Direita Horizontal ( → ) em Amarelo */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#F4C400]/70 bg-black/30 backdrop-blur-xs flex items-center justify-center text-[#F4C400] group-hover:border-[#F4C400] group-hover:bg-[#F4C400] group-hover:text-[#0B0B0E] transition-all duration-300 shadow-md shrink-0 self-end mb-0.5">
            <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2] transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <section
      id="category-showcase-section"
      ref={sectionRef}
      className="py-8 sm:py-10 lg:py-12 xl:py-14 bg-[#F6F5F2] border-b border-[#E4E1D8] select-none overflow-hidden relative"
    >
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ========================================================= */}
        {/* CABEÇALHO ELEVADO COM HIERARQUIA TIPOGRÁFICA E CONTROLES  */}
        {/* ========================================================= */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={
            isSectionInView
              ? { opacity: 1, y: 0 }
              : shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 14 }
          }
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-7 lg:mb-8"
        >
          {/* Eyebrow tag com bullet amarelo */}
          <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
            <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-[#CA8A04]">
              SILHUETAS STREETWEAR // MARMOT ARCHIVE
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            {/* Bloco Título em 1 linha + Descrição em baixo sem quebrar linha */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[44px] font-black uppercase tracking-[-0.03em] text-[#0B0B0E] leading-none whitespace-nowrap">
                COMPRE POR CATEGORIA
              </h2>

              <p className="text-xs sm:text-[13px] lg:text-[14px] text-zinc-600 font-normal leading-normal whitespace-normal sm:whitespace-nowrap">
                Modelagens autorais desenvolvidas para caimento estruturado, tecidos pesados e acabamento de ateliê.
              </p>
            </div>

            {/* Canto direito: Ver todo o catálogo + Contador 01 / 07 + Controles < > */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0 self-start lg:self-end pb-1">
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-black hover:text-zinc-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors underline underline-offset-4 decoration-zinc-400 group"
              >
                <span>VER TODO O CATÁLOGO</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              {/* Contador de categorias: 01 / 07 */}
              <div className="flex items-center text-xs sm:text-sm font-mono pl-1 sm:pl-2">
                <span className="font-bold text-black text-sm sm:text-base">
                  {item0.number}
                </span>
                <span className="text-zinc-400 mx-1">/</span>
                <span className="text-zinc-400 font-medium">07</span>
              </div>

              {/* Botões < e > */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-[3px] border border-zinc-300 bg-white/80 hover:bg-zinc-100 text-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
                  aria-label="Categoria anterior"
                  title="Categoria anterior"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-[3px] bg-[#0B0B0E] hover:bg-zinc-800 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
                  aria-label="Próxima categoria"
                  title="Próxima categoria"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* GRADE MASTER REBALANCEADA: 1 CARD DESTAQUE (4 COLS) + GRADE 2x2 (8 COLS)   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-6 xl:gap-7 items-stretch">
          {/* COLUNA 1: CARD 01 (HERO TALL - 4 COLS) */}
          <div className="lg:col-span-4 h-full flex flex-col">
            {renderCategoryCard(item0, true, 0.08)}
          </div>

          {/* GRADE 2x2 (DIREITA): 4 CARDS AMPLOS, FORTES E RESPIRADOS (8 COLS) */}
          {/* 02 MOLETONS (topo-esq), 03 JAQUETAS (topo-dir), 04 CALÇAS (base-esq), 05 SHORTS (base-dir) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {renderCategoryCard(item1, false, 0.12)}
            {renderCategoryCard(item2, false, 0.16)}
            {renderCategoryCard(item3, false, 0.20)}
            {renderCategoryCard(item4, false, 0.24)}
          </div>
        </div>
      </div>
    </section>
  );
};

