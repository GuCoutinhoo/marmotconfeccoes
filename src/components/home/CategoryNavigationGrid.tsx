import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion, useInView } from 'motion/react';
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
  name: string;
  image: string;
  fallbackImage: string;
  objectPosition: string;
}

const CATEGORY_EDITORIAL_ITEMS: CategoryEditorialItem[] = [
  {
    id: 'camisetas',
    slug: 'camisetas',
    name: 'CAMISETAS',
    image: '/categories/categoria-camisetas.png?v=20260916_v5_new_assets',
    fallbackImage: '/categoria camiseta.png?v=20260916_v5_new_assets',
    objectPosition: 'center 14%',
  },
  {
    id: 'moletons',
    slug: 'moletons',
    name: 'MOLETONS',
    image: '/categories/categoria-moletons.png?v=20260916_v5_new_assets',
    fallbackImage: '/categoria moletom.png?v=20260916_v5_new_assets',
    objectPosition: 'center 8%',
  },
  {
    id: 'jaquetas',
    slug: 'jaquetas',
    name: 'JAQUETAS',
    image: '/categories/categoria-jaquetas.png?v=20260916_v5_new_assets',
    fallbackImage: '/categoria jaqueta.png?v=20260916_v5_new_assets',
    objectPosition: 'center 14%',
  },
  {
    id: 'calcas',
    slug: 'calcas',
    name: 'CALÇAS',
    image: '/categories/categoria-calcas.png?v=20260916_v5_new_assets',
    fallbackImage: '/categoria calca.png?v=20260916_v5_new_assets',
    objectPosition: 'center 35%',
  },
  {
    id: 'shorts',
    slug: 'shorts',
    name: 'SHORTS',
    image: '/categories/categoria-shorts.png?v=20260916_v5_new_assets',
    fallbackImage: '/categoria shorts.png?v=20260916_v5_new_assets',
    objectPosition: 'center 15%',
  },
  {
    id: 'tenis',
    slug: 'tenis',
    name: 'TÊNIS',
    image: '/categories/categoria-tenis.png?v=20260916_v5_new_assets',
    fallbackImage: '/categoria tenis.png?v=20260916_v5_new_assets',
    objectPosition: 'center 62%',
  },
  {
    id: 'acessorios',
    slug: 'acessorios',
    name: 'ACESSÓRIOS',
    image: '/categories/categoria-acessorios.png?v=20260916_v5_new_assets',
    fallbackImage: '/categoria acessorios.png?v=20260916_v5_new_assets',
    objectPosition: 'center 30%',
  },
];

export const CategoryNavigationGrid: React.FC<CategoryNavigationGridProps> = ({ onNavigate }) => {
  const { categories } = useStore();
  const carouselRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.22 });

  // Drag-to-scroll refs
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Sincronização de imagens salvas
  useEffect(() => {
    ensureCategoryImagesStoredInLocalStorage().catch((err) => {
      console.warn('Erro ao sincronizar imagens com localStorage:', err);
    });
  }, []);

  const handleScrollPosition = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) {
      setActiveCategoryIndex(0);
      return;
    }

    const total = CATEGORY_EDITORIAL_ITEMS.length;
    const progress = Math.min(1, Math.max(0, container.scrollLeft / maxScroll));
    const current = Math.min(total, Math.max(1, Math.round(progress * (total - 1)) + 1));
    setActiveCategoryIndex(current - 1);
  }, []);

  // Obter imagem preferencial (localStorage ou asset configurado)
  const getCardImage = useCallback(
    (item: CategoryEditorialItem) => {
      const stored = getStoredCategoryImage(item.slug);
      if (stored) return stored;

      const matchedStoreCat = categories?.find(
        (c) => c.slug?.toLowerCase() === item.slug.toLowerCase()
      );
      if (matchedStoreCat?.image && !matchedStoreCat.image.includes('unsplash.com')) {
        return matchedStoreCat.image;
      }

      return item.image;
    },
    [categories]
  );

  // Scroll controls
  const handleScrollPrev = () => {
    if (!carouselRef.current) return;
    const card = carouselRef.current.querySelector('article');
    const scrollAmount = card ? card.clientWidth + 16 : 450;
    carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const handleScrollNext = () => {
    if (!carouselRef.current) return;
    const card = carouselRef.current.querySelector('article');
    const scrollAmount = card ? card.clientWidth + 16 : 450;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Mouse Drag to Scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isMouseDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeftRef.current = carouselRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    carouselRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
  };

  // Touch Drag para navegação suave em smartphones/tablets
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchScrollLeftRef = useRef(0);
  const isTouchDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchScrollLeftRef.current = carouselRef.current.scrollLeft;
    isTouchDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchDraggingRef.current || !carouselRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartXRef.current - currentX;
    const diffY = touchStartYRef.current - currentY;

    // Se o gesto do dedo for horizontal, desliza o carrossel
    if (Math.abs(diffX) > Math.abs(diffY)) {
      carouselRef.current.scrollLeft = touchScrollLeftRef.current + diffX;
      if (Math.abs(diffX) > 6) {
        hasMovedRef.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    isTouchDraggingRef.current = false;
  };

  const handleCardClick = (slug: string) => {
    if (hasMovedRef.current) return;
    onNavigate('shop', slug);
  };

  return (
    <section
      ref={sectionRef}
      id="category-showcase-section"
      className="pt-[46px] pb-[40px] bg-[#F7F7F5] border-b border-zinc-200/90 select-none overflow-hidden"
    >
      {/* ========================================================= */}
      {/* CABEÇALHO DA SEÇÃO - IMPACTANTE E EDITORIAL               */}
      {/* ========================================================= */}
      <div className="w-full px-7 sm:px-8 mb-8 sm:mb-10 lg:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* BLOCO ESQUERDO */}
          <div className="flex flex-col items-start text-left">
            {/* 1. EYEBROW */}
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.28em] text-black">
                MARMOT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400] inline-block mx-1" />
              <span className="text-[11px] sm:text-xs font-mono font-medium uppercase tracking-[0.24em] text-zinc-500">
                COLEÇÃO
              </span>
            </div>

            {/* 2. TÍTULO - Grande, forte e imponente */}
            <div className="overflow-hidden">
              <motion.h2
                initial={shouldReduceMotion ? { y: 0 } : { y: '100%' }}
                animate={isInView ? { y: 0 } : {}}
                transition={{
                  duration: 0.58,
                  ease: [0.16, 1, 0.3, 1],
                  delay: shouldReduceMotion ? 0 : 0.08,
                }}
                className="font-anton text-4xl sm:text-5xl md:text-[58px] lg:text-[66px] xl:text-[72px] font-normal uppercase text-[#0B0B0E] leading-none tracking-[-0.035em] select-none whitespace-normal sm:whitespace-nowrap"
              >
                COMPRE POR CATEGORIA
              </motion.h2>
            </div>

            {/* 3. SUBTÍTULO COM MAIS RESPIRO */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.52,
                ease: [0.16, 1, 0.3, 1],
                delay: shouldReduceMotion ? 0 : 0.16,
              }}
              className="text-base sm:text-lg text-zinc-500 font-normal mt-2.5 leading-normal select-none"
            >
              As peças que constroem a coleção.
            </motion.p>
          </div>

          {/* BLOCO DIREITO: "VER TODAS AS CATEGORIAS ↗" + SEPARADOR + CONTADOR + SETAS */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.55,
              ease: [0.16, 1, 0.3, 1],
              delay: shouldReduceMotion ? 0 : 0.2,
            }}
            className="flex items-center gap-4 sm:gap-6 self-start md:self-end pb-1 shrink-0"
          >
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-[11.5px] sm:text-[12px] font-black uppercase tracking-[0.15em] text-black hover:text-zinc-600 underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>VER TODAS AS CATEGORIAS</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <div className="hidden sm:block w-px h-4.5 bg-zinc-300/80" />

            {/* Contador: 01 — 06 */}
            <span className="text-xs sm:text-[13px] font-mono font-medium text-zinc-600 tracking-wider">
              {String(activeCategoryIndex + 1).padStart(2, '0')} — {String(CATEGORY_EDITORIAL_ITEMS.length).padStart(2, '0')}
            </span>

            {/* Setas de Navegação [ ← ] [ → ] */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleScrollPrev}
                aria-label="Categoria anterior"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white hover:bg-zinc-100 active:scale-95 border border-zinc-300/90 rounded-[2px] flex items-center justify-center text-black transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={handleScrollNext}
                aria-label="Próxima categoria"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F4C400] hover:bg-[#E5B500] active:scale-95 border border-[#E5B500] rounded-[2px] flex items-center justify-center text-black transition-all cursor-pointer shadow-2xs"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CARROSSEL HORIZONTAL DE CATEGORIAS (520–560px ALTURA)     */}
      {/* ========================================================= */}
      <div
        ref={carouselRef}
        onScroll={handleScrollPosition}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex items-stretch gap-5 sm:gap-6 overflow-x-auto scrollbar-none pb-5 cursor-grab active:cursor-grabbing px-7 sm:px-8"
      >
        {CATEGORY_EDITORIAL_ITEMS.map((item, index) => (
          <motion.article
            key={item.id}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.58,
              delay: shouldReduceMotion ? 0 : 0.22 + index * 0.09,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => handleCardClick(item.slug)}
            className="marmot-category-card group relative shrink-0 w-[310px] sm:w-[350px] md:w-[380px] lg:w-[410px] xl:w-[430px] h-[460px] sm:h-[490px] md:h-[525px] lg:h-[550px] overflow-hidden bg-[#111113] cursor-pointer select-none rounded-[4px] border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-black hover:shadow-[0_16px_40px_rgba(0,0,0,0.16)] transition-all duration-300"
          >
            {/* Imagem de Fundo com proporção preservada (object-cover) */}
            <motion.img
              src={getCardImage(item)}
              alt={item.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              draggable={false}
              initial={shouldReduceMotion ? { scale: 1 } : { scale: 1.03 }}
              animate={isInView ? { scale: 1 } : { scale: 1.03 }}
              transition={{
                duration: 0.62,
                delay: shouldReduceMotion ? 0 : 0.22 + index * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                objectPosition: item.objectPosition || 'center 15%',
              }}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out select-none pointer-events-none brightness-[0.98] contrast-[1.04]"
              onError={(e) => {
                if (e.currentTarget.src !== item.fallbackImage) {
                  e.currentTarget.src = item.fallbackImage;
                }
              }}
            />

            {/* Degradê/overlay escuro na parte inferior para contraste e legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-35% to-transparent pointer-events-none" />

            {/* Textos no canto inferior esquerdo */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-9 z-10">
              <h3 className="font-anton text-2xl sm:text-[30px] lg:text-[34px] xl:text-[38px] font-black text-white uppercase tracking-wide leading-tight drop-shadow-xs">
                {item.name}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-[#F4C400] text-sm sm:text-[15px] font-medium transition-colors">
                <span>Ver coleção</span>
                <ArrowRight className="w-4.5 h-4.5 text-[#F4C400] stroke-[2] transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
