import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
    image: '/categories/categoria-camisetas.png',
    fallbackImage: '/categoria camiseta.png',
    objectPosition: 'center 14%',
  },
  {
    id: 'moletons',
    slug: 'moletons',
    name: 'MOLETONS',
    image: '/categories/categoria-moletons.png',
    fallbackImage: '/categoria moletom.png',
    objectPosition: 'center 8%',
  },
  {
    id: 'jaquetas',
    slug: 'jaquetas',
    name: 'JAQUETAS',
    image: '/categories/categoria-jaquetas.png',
    fallbackImage: '/categoria jaqueta.png',
    objectPosition: 'center 14%',
  },
  {
    id: 'calcas',
    slug: 'calcas',
    name: 'CALÇAS',
    image: '/categories/categoria-calcas.png',
    fallbackImage: '/categoria calca.png',
    objectPosition: 'center 35%',
  },
  {
    id: 'shorts',
    slug: 'shorts',
    name: 'SHORTS',
    image: '/categories/categoria-shorts.png',
    fallbackImage: '/categoria shorts.png',
    objectPosition: 'center 15%',
  },
  {
    id: 'tenis',
    slug: 'tenis',
    name: 'TÊNIS',
    image: '/categories/categoria-tenis.png',
    fallbackImage: '/categoria tenis.png',
    objectPosition: 'center 62%',
  },
  {
    id: 'acessorios',
    slug: 'acessorios',
    name: 'ACESSÓRIOS',
    image: '/categories/categoria-acessorios.png',
    fallbackImage: '/categoria acessorios.png',
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

  // Sincronização de imagens salvas
  useEffect(() => {
    ensureCategoryImagesStoredInLocalStorage().catch((err) => {
      console.warn('Erro ao sincronizar imagens com localStorage:', err);
    });
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
      className="pt-[50px] pb-[9px] bg-[#F7F7F5] select-none overflow-hidden"
      style={{
        paddingTop: '50px',
        paddingBottom: '9px',
      }}
    >
      {/* ========================================================= */}
      {/* CABEÇALHO DA SEÇÃO - REFINAMENTO DE HIERARQUIA E RESPIRO */}
      {/* ========================================================= */}
      <div className="w-full px-7 sm:px-8 mb-[36px] sm:mb-[42px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* BLOCO ESQUERDO */}
          <div className="flex flex-col items-start text-left">
            {/* 1. MARMOT - Fade + leve movimento de baixo para cima */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans text-[11px] font-bold text-[#000000] uppercase tracking-[0.32em] mb-[6px] select-none"
              style={{
                marginBottom: '6px',
                color: '#000000',
              }}
            >
              MARMOT
            </motion.p>

            {/* 2. TÍTULO - Reveal vertical com overflow hidden */}
            <div className="overflow-hidden">
              <motion.h2
                initial={shouldReduceMotion ? { y: 0 } : { y: '100%' }}
                animate={isInView ? { y: 0 } : {}}
                transition={{
                  duration: 0.58,
                  ease: [0.16, 1, 0.3, 1],
                  delay: shouldReduceMotion ? 0 : 0.08,
                }}
                className="font-anton text-3xl sm:text-4xl md:text-5xl lg:text-[56px] xl:text-[60px] font-normal uppercase text-black leading-[0.92] tracking-tight select-none whitespace-normal sm:whitespace-nowrap -ml-1"
                style={{
                  color: '#000000',
                  fontWeight: 'normal',
                  paddingLeft: '0px',
                  paddingRight: '0px',
                  paddingTop: '0px',
                  paddingBottom: '0px',
                  marginLeft: '-4px',
                }}
              >
                COMPRE POR CATEGORIA
              </motion.h2>
            </div>

            {/* 3. SUBTÍTULO - Fade suave logo depois */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.52,
                ease: [0.16, 1, 0.3, 1],
                delay: shouldReduceMotion ? 0 : 0.16,
              }}
              className="font-sans text-[14.5px] sm:text-[15.5px] text-[#52525B] font-normal mt-[1px] leading-normal select-none tracking-[-0.01em]"
              style={{
                marginTop: '1px',
              }}
            >
              As peças que constroem a coleção.
            </motion.p>
          </div>

          {/* BLOCO DIREITO: "Ver todas →" + CONTROLES entram discretamente pela direita */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.55,
              ease: [0.16, 1, 0.3, 1],
              delay: shouldReduceMotion ? 0 : 0.2,
            }}
            className="flex items-center gap-5 sm:gap-6 self-start md:self-end pb-1 sm:pb-1.5"
          >
            <div className="h-7 sm:h-8 w-[1px] bg-[#D4D4D8] hidden sm:block" />

            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-sm sm:text-[15px] font-medium text-[#0A0A0A] hover:text-black inline-flex items-center gap-2 cursor-pointer transition-colors group select-none"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-4 h-4 text-[#F4C400] stroke-[2.2] transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>

            <div className="flex items-center gap-2">
              {/* Botão Anterior: fundo claro, borda fina, cantos 8px, ícone preto */}
              <button
                type="button"
                onClick={handleScrollPrev}
                aria-label="Categoria anterior"
                className="w-10 h-10 sm:w-11 sm:h-11 marmot-category-btn border border-[#D4D4D8] bg-[#FAFAFA] hover:bg-[#F4F4F5] text-[#171717] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                style={{ borderRadius: '8px' }}
              >
                <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2]" />
              </button>

              {/* Botão Próximo: fundo amarelo, ícone preto */}
              <button
                type="button"
                onClick={handleScrollNext}
                aria-label="Próxima categoria"
                className="w-10 h-10 sm:w-11 sm:h-11 marmot-category-btn bg-[#f4c400] hover:bg-[#e0b400] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                style={{
                  borderRadius: '8px',
                  color: '#ffffff',
                  backgroundColor: '#f4c400',
                }}
              >
                <ArrowRight
                  className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2] text-black"
                  style={{
                    backgroundColor: '#f4c400',
                    color: '#000000',
                  }}
                />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CARROSSEL HORIZONTAL DE CATEGORIAS                        */}
      {/* Cards com stagger 80-100ms, opacity 0->1, y 30->0, scale 1.03->1 */}
      {/* ========================================================= */}
      <div
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex items-stretch gap-4 overflow-hidden scrollbar-none pb-0 cursor-grab active:cursor-grabbing pl-7 sm:pl-8 pr-8 sm:pr-12"
        style={{
          paddingBottom: '0px',
          overflowX: 'hidden',
          overflowY: 'hidden',
        }}
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
            className="marmot-category-card group relative shrink-0 aspect-[4/5.15] w-[80vw] sm:w-[48vw] md:w-[42vw] lg:w-[calc((100vw-32px-48px)/3.52)] xl:w-[calc((100vw-32px-48px)/3.52)] max-w-[500px] overflow-hidden bg-[#111113] cursor-pointer select-none"
            style={{
              borderRadius: '12px',
            }}
          >
            {/* Imagem de Fundo com entrada suave scale 1.03 -> 1 */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-30% to-transparent pointer-events-none" />

            {/* Textos no canto inferior esquerdo */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7 lg:p-8 z-10">
              <h3 className="font-anton text-2xl sm:text-[28px] lg:text-[32px] xl:text-[36px] font-black text-white uppercase tracking-wide leading-tight drop-shadow-xs">
                {item.name}
              </h3>
              <div className="mt-1.5 sm:mt-2 flex items-center gap-2 text-[#F4C400] text-sm sm:text-[15px] lg:text-[16px] font-medium transition-colors">
                <span>Ver coleção</span>
                <ArrowRight className="w-4 h-4 text-[#F4C400] stroke-[2] transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
