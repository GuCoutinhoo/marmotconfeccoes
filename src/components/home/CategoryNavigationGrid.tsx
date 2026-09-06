import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { INITIAL_8_CATEGORIES } from '../../data/categories';
import { handleProductImageError } from '../../utils/imageUtils';

interface CategoryNavigationGridProps {
  onNavigate: (page: string, param?: string) => void;
}

// Curated high-fashion streetwear editorial imagery for cohesive lookbook aesthetics
const CATEGORY_EDITORIAL_ASSETS: Record<
  string,
  {
    image: string;
    subheading: string;
  }
> = {
  camisetas: {
    image: '/categories/categoria-camisetas.png',
    subheading: 'Heavyweight 260g & Boxy Fit',
  },
  moletons: {
    image: '/categories/categoria-moletons.png',
    subheading: 'Hoodies Densos 400g/m²',
  },
  jaquetas: {
    image: '/categories/categoria-jaquetas.png',
    subheading: 'Puffers & Varsity Outerwear',
  },
  calcas: {
    image: '/categories/categoria-calcas.png',
    subheading: 'Baggy Denim & Wide Leg',
  },
  shorts: {
    image: '/categories/categoria-shorts.png',
    subheading: 'Mesh Basketball & Sweat Shorts',
  },
  tenis: {
    image: '/categories/categoria-tenis.png',
    subheading: 'Sneakers Chunky & Solados Tratorados',
  },
  acessorios: {
    image: '/categories/categoria-acessorios.png',
    subheading: 'Bags Táticas, Correntes & EDC',
  },
};

export const CategoryNavigationGrid: React.FC<CategoryNavigationGridProps> = ({ onNavigate }) => {
  const { categories } = useStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Ensure streetwear categories excluding Cargos as requested
  const baseCategories = categories && categories.length > 0 ? categories : INITIAL_8_CATEGORIES;
  const displayCategories = baseCategories.filter(
    (cat) => cat.slug?.toLowerCase() !== 'cargos' && cat.id?.toLowerCase() !== 'cargos'
  );

  // Track scroll limits & active slide
  const handleScrollUpdate = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 12);
    setCanScrollRight(scrollLeft < maxScroll - 12);

    // Calculate approximate active slide
    const firstCard = el.querySelector<HTMLElement>('[data-category-card]');
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth + 24;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveSlideIndex(Math.min(index, displayCategories.length - 1));
    }
  }, [displayCategories.length]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    handleScrollUpdate();
    el.addEventListener('scroll', handleScrollUpdate, { passive: true });
    window.addEventListener('resize', handleScrollUpdate);

    return () => {
      el.removeEventListener('scroll', handleScrollUpdate);
      window.removeEventListener('resize', handleScrollUpdate);
    };
  }, [handleScrollUpdate]);

  // Scroll smoothly by exact card width + gap
  const scrollByDirection = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const firstCard = el.querySelector<HTMLElement>('[data-category-card]');
    const step = firstCard ? firstCard.offsetWidth + 24 : el.clientWidth * 0.8;

    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  // Mouse drag handlers for fluid interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.35;

    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
    }

    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleCardClick = (slug: string) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    onNavigate('shop', slug);
  };

  return (
    <section
      id="category-showcase-section"
      className="py-10 sm:py-12 lg:py-14 bg-white border-b border-[#E4E4E7] select-none overflow-hidden relative"
    >
      <div className="w-full max-w-[1820px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ========================================================= */}
        {/* CABEÇALHO ELEVADO COM HIERARQUIA TIPOGRÁFICA E CONTROLES  */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-[#B45309] rounded-full inline-block animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#B45309]">
                SILHUETAS STREETWEAR // MARMOT ARCHIVE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black uppercase tracking-tight text-[#0B0B0E] leading-none">
              COMPRE POR CATEGORIA
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-xl font-normal leading-relaxed">
              Modelagens autorais desenvolvidas para caimento estruturado, tecidos pesados e acabamento de ateliê.
            </p>
          </div>

          {/* Canto superior direito: Link limpo + Indicador de slide + Setas refinadas */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 self-start md:self-end">
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-800 hover:text-black hover:underline inline-flex items-center gap-1.5 cursor-pointer transition-colors group"
            >
              <span>VER TODO O CATÁLOGO</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </button>

            {/* Slide Index Badge */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-400 px-2.5 py-1 bg-zinc-100 rounded-[2px] border border-zinc-200">
              <span className="text-black font-extrabold">{String(activeSlideIndex + 1).padStart(2, '0')}</span>
              <span>/</span>
              <span>{String(displayCategories.length).padStart(2, '0')}</span>
            </div>

            {/* Seta de navegação suave e visível */}
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => scrollByDirection('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-[2px] border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="Categorias anteriores"
                aria-label="Ver categorias anteriores"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={() => scrollByDirection('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-[2px] bg-[#0B0B0E] hover:bg-zinc-800 text-white disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="Próximas categorias"
                aria-label="Ver próximas categorias"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARROSSEL HORIZONTAL DE CATEGORIAS: 3 CARDS COMPLETOS + 4º CARD CORTADO   */}
        {/* ========================================================================= */}
        <div className="relative group/carousel">
          {/* Floating Left Action Arrow (Desktop) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByDirection('left')}
              className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-[2px] bg-black/85 hover:bg-black text-white backdrop-blur-md border border-white/20 items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Deslizar para a esquerda"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Floating Right Action Arrow (Desktop) */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByDirection('right')}
              className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-[2px] bg-black/85 hover:bg-black text-white backdrop-blur-md border border-white/20 items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
              aria-label="Deslizar para a direita"
            >
              <ChevronRight className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Track Horizontal com matemática precisa:
              - Mobile (< md): 1 card completo + corte sutil do 2º (w-[80vw])
              - Tablet (md): 2 cards completos + corte do 3º (calc((100% - 20px)/2.25))
              - Desktop (lg & xl): 3 cards completos + ~28% do 4º card cortado (calc((100% - 3*24px)/3.28))
          */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 cursor-grab active:cursor-grabbing"
          >
            {displayCategories.map((cat, index) => {
              const slugKey = cat.slug?.toLowerCase() || cat.id?.toLowerCase() || '';
              const asset = CATEGORY_EDITORIAL_ASSETS[slugKey];
              // Keep the new category images
              const cardImage =
                cat.image && (cat.image.startsWith('/categories/') || cat.image.startsWith('/uploads/'))
                  ? cat.image
                  : asset?.image || cat.image;
              const cardSubheading = cat.tagline || cat.description || asset?.subheading;

              return (
                <article
                  key={cat.id || cat.slug || index}
                  data-category-card
                  onClick={() => handleCardClick(cat.slug)}
                  className="group relative h-[420px] sm:h-[460px] lg:h-[480px] xl:h-[510px] w-[82vw] sm:w-[calc((100%-20px)/2.2)] md:w-[calc((100%-40px)/2.8)] lg:w-[calc((100%-60px)/3.35)] xl:w-[calc((100%-72px)/4.25)] shrink-0 snap-start rounded-[2px] overflow-hidden bg-[#18181B] border border-zinc-200/90 hover:border-zinc-900 cursor-pointer shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] transition-all duration-500 ease-out"
                >
                  {/* Foto editorial padronizada com a nova imagem da categoria */}
                  <img
                    src={cardImage}
                    alt={cat.name}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.90] group-hover:brightness-100 select-none"
                    onError={(e) => handleProductImageError(e, cat.slug, `cat-${index}`)}
                  />

                  {/* Gradiente Inferior Robusto & Conteúdo Editorial Completo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-40% to-transparent p-4 sm:p-6 lg:p-7 flex flex-col justify-end z-20 pointer-events-none">
                    <div className="space-y-1.5 transform transition-transform duration-300 group-hover:-translate-y-1">
                      {/* Título de Categoria em Destaque Imponente */}
                      <h3 className="text-xl sm:text-2xl lg:text-[28px] font-black text-white uppercase tracking-tight leading-none group-hover:text-[#F4C400] transition-colors">
                        {cat.name}
                      </h3>

                      {/* Subtítulo / Descrição de Caimento */}
                      <p className="text-xs sm:text-[13px] text-zinc-300 font-medium line-clamp-1 pt-0.5 leading-snug">
                        {cardSubheading}
                      </p>

                      {/* Subcategorias em chips discretos */}
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <p className="text-[11px] font-mono text-zinc-400/90 line-clamp-1 pt-1 tracking-wide">
                          {cat.subcategories.slice(0, 3).join(' • ')}
                        </p>
                      )}
                    </div>

                    {/* Botão de Ação / Barra Explorar */}
                    <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-white group-hover:text-[#F4C400] transition-colors">
                      <span className="text-[10.5px] sm:text-xs font-mono font-bold uppercase tracking-[0.14em]">
                        EXPLORAR COLEÇÃO
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 group-hover:bg-[#F4C400] group-hover:text-black flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 shadow-sm">
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Indicador de Deslizar em Telas Menores */}
        <div className="mt-4 sm:hidden flex items-center justify-center gap-1 text-[11px] font-mono text-zinc-400">
          <Compass className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Deslize para ver todas as silhuetas</span>
        </div>
      </div>
    </section>
  );
};
