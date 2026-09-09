import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
    tagline: 'Heavyweight 260g & Boxy Fit',
    subcategoriesText: 'Graphic Tees • Basic Essential • Acid Wash',
    image: '/categories/categoria-camisetas.png?v=20260907_v4_ultrahd',
    fallbackImage: '/categoria camiseta.png',
    objectPosition: 'center 8%',
  },
  {
    id: 'moletons',
    slug: 'moletons',
    number: '02',
    name: 'MOLETONS',
    tagline: 'Hoodies Densos 400g/m²',
    subcategoriesText: 'Hoodies • Zip Hoodie • Crewneck',
    image: '/categories/categoria-moletons.png?v=20260907_v4_ultrahd',
    fallbackImage: '/categoria moletom.png',
    objectPosition: 'center 2%',
  },
  {
    id: 'jaquetas',
    slug: 'jaquetas',
    number: '03',
    name: 'JAQUETAS',
    tagline: 'Puffers & Varsity Outerwear',
    subcategoriesText: 'Puffers • Windbreakers • Work Jacket',
    image: '/categories/categoria-jaquetas.png?v=20260907_v4_ultrahd',
    fallbackImage: '/categoria jaqueta.png',
    objectPosition: 'center 4%',
  },
  {
    id: 'calcas',
    slug: 'calcas',
    number: '04',
    name: 'CALÇAS',
    tagline: 'Baggy Denim & Wide Leg',
    subcategoriesText: 'Baggy • Wide Leg • Cargo • Track Pants',
    image: '/categories/categoria-calcas.png?v=20260907_v4_ultrahd',
    fallbackImage: '/categoria calca.png',
    objectPosition: 'center 30%',
  },
  {
    id: 'shorts',
    slug: 'shorts',
    number: '05',
    name: 'SHORTS',
    tagline: 'Mesh Basketball & Sweat Shorts',
    subcategoriesText: 'Cargo • Denim • Esportivos',
    image: '/categories/categoria-shorts.png?v=20260907_v4_ultrahd',
    fallbackImage: '/categoria shorts.png',
    objectPosition: 'center 3%',
  },
  {
    id: 'tenis',
    slug: 'tenis',
    number: '06',
    name: 'TÊNIS',
    tagline: 'Sneakers Chunky & Solados Tratorados',
    subcategoriesText: 'Chunky Platform • Retro Runner • Chunky Slides',
    image: '/categories/categoria-tenis.png?v=20260907_v4_ultrahd',
    fallbackImage: '/categoria tenis.png',
    objectPosition: 'center 62%',
  },
  {
    id: 'acessorios',
    slug: 'acessorios',
    number: '07',
    name: 'ACESSÓRIOS',
    tagline: 'Bags Táticas, Correntes & EDC',
    subcategoriesText: 'Bags Táticas • Correntes • Headwear',
    image: '/categories/categoria-acessorios.png?v=20260907_v4_ultrahd',
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

  // Card em destaque à esquerda (1 grande)
  const featuredItem = CATEGORY_EDITORIAL_ITEMS[activeOffset % totalCategories];

  // 4 cards da grade à direita (2x2)
  const gridItems = [
    CATEGORY_EDITORIAL_ITEMS[(activeOffset + 1) % totalCategories],
    CATEGORY_EDITORIAL_ITEMS[(activeOffset + 2) % totalCategories],
    CATEGORY_EDITORIAL_ITEMS[(activeOffset + 3) % totalCategories],
    CATEGORY_EDITORIAL_ITEMS[(activeOffset + 4) % totalCategories],
  ];

  return (
    <section
      id="category-showcase-section"
      ref={sectionRef}
      className="pt-6 sm:pt-8 lg:pt-9 pb-8 sm:pb-10 lg:pb-12 bg-[#F6F5F2] border-b border-[#E4E1D8] select-none overflow-hidden relative"
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
          className="mb-5 sm:mb-6"
        >
          {/* Eyebrow tag com bullet amarelo */}
          <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
            <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
            <span className="text-[10.5px] sm:text-[11.5px] font-mono font-bold uppercase tracking-[0.2em] text-[#CA8A04]">
              SILHUETAS STREETWEAR // MARMOT ARCHIVE
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Bloco Título + Divisor Vertical + Descrição */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] xl:text-[54px] font-black uppercase tracking-[-0.03em] text-[#0B0B0E] leading-[0.88] whitespace-pre-line">
                {'COMPRE POR\nCATEGORIA'}
              </h2>

              <div className="hidden sm:block w-px h-12 sm:h-14 lg:h-16 bg-zinc-300 shrink-0" />

              <p className="text-xs sm:text-[13.5px] lg:text-[14.5px] text-zinc-600 font-normal leading-relaxed max-w-[340px]">
                Modelagens autorais desenvolvidas para caimento estruturado, tecidos pesados e acabamento de ateliê.
              </p>
            </div>

            {/* Canto direito: Ver todo o catálogo + Contador 01 / 07 + Controles < > */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0 self-start lg:self-center">
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
                  {featuredItem.number}
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
        {/* GRADE BENTO EXATA: 1 CARD DESTAQUE (ESQUERDA) + GRADE 2x2 (DIREITA)       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* ======================================================================= */}
          {/* CARD 1: DESTAQUE PRINCIPAL (ESQUERDA - CAMISETAS OU ATIVA)              */}
          {/* ======================================================================= */}
          <motion.article
            key={`featured-${featuredItem.id}-${featuredItem.number}`}
            onClick={() => onNavigate('shop', featuredItem.slug)}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.98 }}
            animate={
              isSectionInView
                ? { opacity: 1, y: 0, scale: 1 }
                : shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 28, scale: 0.98 }
            }
            transition={{
              duration: 0.52,
              delay: 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group relative lg:col-span-5 w-full h-[520px] sm:h-[580px] lg:h-auto min-h-[520px] lg:min-h-[680px] rounded-[3px] overflow-hidden bg-[#121214] border border-zinc-300/80 hover:border-zinc-900 cursor-pointer shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] transition-all duration-300 flex flex-col justify-end"
          >
            {/* Foto Editorial de Fundo */}
            <img
              src={getCardImage(featuredItem)}
              alt={featuredItem.name}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              draggable={false}
              style={{
                objectPosition: featuredItem.objectPosition || 'center 8%',
                transformOrigin: 'center 15%',
              }}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.98] contrast-[1.03] saturate-[1.05] select-none"
              onError={(e) => {
                if (e.currentTarget.src !== featuredItem.fallbackImage) {
                  e.currentTarget.src = featuredItem.fallbackImage;
                }
              }}
            />

            {/* Gradientes para Legibilidade Editorial */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-35% to-transparent pointer-events-none" />

            {/* Bottom Content: Traço Amarelo + Título + Heavyweight + Tags + VER CATEGORIA e Seta */}
            <div className="relative z-20 p-5 sm:p-7 lg:p-8">
              {/* Traço Amarelo Assinatura */}
              <div className="w-12 h-[3.5px] bg-[#F4C400] rounded-full mb-3" />

              {/* Nome da Categoria em Tipografia Imponente */}
              <h3 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-black text-white uppercase tracking-tight leading-none drop-shadow-md">
                {featuredItem.name}
              </h3>

              {/* Tagline / Especificação de Fit */}
              {featuredItem.tagline && (
                <p className="text-xs sm:text-sm font-semibold text-white/95 mt-2.5 drop-shadow-sm leading-snug">
                  {featuredItem.tagline}
                </p>
              )}

              {/* Subcategorias */}
              {featuredItem.subcategoriesText && (
                <p className="text-[11px] sm:text-xs font-mono text-zinc-300 mt-1 tracking-wide drop-shadow-xs">
                  {featuredItem.subcategoriesText}
                </p>
              )}

              {/* Linha Inferior: VER CATEGORIA ─────── ( ↗ ) */}
              <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-white/20 text-white">
                <div className="flex items-center gap-3 flex-1 mr-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-white/90 whitespace-nowrap">
                    VER CATEGORIA
                  </span>
                  <div className="h-px bg-white/30 flex-1 max-w-[170px]" />
                </div>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/40 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300 shadow-md shrink-0">
                  <ArrowUpRight className="w-5 h-5 stroke-[2] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </div>
          </motion.article>

          {/* ======================================================================= */}
          {/* GRADE 2x2 (DIREITA): 4 CARDS EDITORIAIS                                  */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {gridItems.map((item, idx) => (
              <motion.article
                key={`grid-${item.id}-${item.number}-${idx}`}
                onClick={() => onNavigate('shop', item.slug)}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.98 }}
                animate={
                  isSectionInView
                    ? { opacity: 1, y: 0, scale: 1 }
                    : shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 28, scale: 0.98 }
                }
                transition={{
                  duration: 0.52,
                  delay: 0.14 + idx * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative h-[290px] sm:h-[315px] lg:h-[330px] xl:h-[340px] rounded-[3px] overflow-hidden bg-[#121214] border border-zinc-300/80 hover:border-zinc-900 cursor-pointer shadow-sm hover:shadow-[0_16px_32px_rgba(0,0,0,0.16)] transition-all duration-300 flex flex-col justify-end"
              >
                {/* Foto Editorial de Fundo */}
                <img
                  src={getCardImage(item)}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  style={{
                    objectPosition: item.objectPosition || 'center top',
                    transformOrigin: 'center 15%',
                  }}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.98] contrast-[1.03] saturate-[1.05] select-none"
                  onError={(e) => {
                    if (e.currentTarget.src !== item.fallbackImage) {
                      e.currentTarget.src = item.fallbackImage;
                    }
                  }}
                />

                {/* Gradientes para Legibilidade Editorial */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 via-35% to-transparent pointer-events-none" />

                {/* Bottom Content: Traço Amarelo + Título + Subcategorias + Botão Circular com Seta */}
                <div className="relative z-20 p-4 sm:p-5 lg:p-6 flex items-end justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Traço Amarelo */}
                    <div className="w-8 h-[3px] bg-[#F4C400] rounded-full mb-2" />

                    {/* Nome da Categoria */}
                    <h3 className="text-xl sm:text-2xl lg:text-[26px] xl:text-[28px] font-black text-white uppercase tracking-tight leading-none drop-shadow-md truncate">
                      {item.name}
                    </h3>

                    {/* Subcategorias / Descrição */}
                    <p className="text-[11px] sm:text-xs font-mono text-zinc-300 tracking-wide drop-shadow-xs line-clamp-1">
                      {item.subcategoriesText}
                    </p>
                  </div>

                  {/* Botão Circular com Seta Editorial */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/40 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300 shadow-md shrink-0 self-end">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

