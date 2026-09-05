import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { INITIAL_8_CATEGORIES } from '../../data/categories';

interface CategoryNavigationGridProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CategoryNavigationGrid: React.FC<CategoryNavigationGridProps> = ({ onNavigate }) => {
  const { categories } = useStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Ensure 8 streetwear categories
  const displayCategories = categories && categories.length >= 8 ? categories : INITIAL_8_CATEGORIES;

  // Track scroll limits
  const handleScrollUpdate = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  }, []);

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
  }, [handleScrollUpdate, displayCategories]);

  // Scroll smoothly by card width
  const scrollByDirection = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const firstCard = el.querySelector<HTMLElement>('[data-category-card]');
    const step = firstCard ? firstCard.offsetWidth + 24 : el.clientWidth * 0.75;

    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  // Mouse drag handlers
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
    const walk = (x - startXRef.current) * 1.3;

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
      className="py-16 sm:py-20 bg-white border-b border-[#E4E4E7] select-none overflow-hidden"
    >
      {/* Container harmonioso alinhado com o restante do site */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* ========================================================= */}
        {/* CABEÇALHO COM HIERARQUIA EQUILIBRADA E CONTROLES SUAVES   */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 sm:mb-10">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#B45309] block mb-1.5">
              SILHUETAS STREETWEAR
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[#111113] leading-tight">
              COMPRE POR CATEGORIA
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 max-w-lg font-normal leading-relaxed">
              Explore o catálogo completo de peças divididas por silhueta e utilidade streetwear.
            </p>
          </div>

          {/* Canto superior direito: Link limpo + Setas refinadas */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0 self-start sm:self-end">
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-800 hover:text-black hover:underline inline-flex items-center gap-1.5 cursor-pointer transition-colors group"
            >
              <span>VER TODO O CATÁLOGO</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </button>

            <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => scrollByDirection('left')}
                disabled={!canScrollLeft}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-none border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Categorias anteriores"
                aria-label="Ver categorias anteriores"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2]" />
              </button>

              <button
                type="button"
                onClick={() => scrollByDirection('right')}
                disabled={!canScrollRight}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-[#09090B] hover:bg-zinc-800 text-white disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Próximas categorias"
                aria-label="Ver próximas categorias"
              >
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VITRINE HORIZONTAL REFINADA (3 CARDS POR VEZ NO DESKTOP)  */}
        {/* ========================================================= */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 cursor-grab active:cursor-grabbing"
        >
          {displayCategories.map((cat, index) => (
            <article
              key={cat.id || cat.slug || index}
              data-category-card
              onClick={() => handleCardClick(cat.slug)}
              className="group relative h-[460px] sm:h-[500px] lg:h-[530px] w-[78vw] sm:w-[calc(50%-12px)] lg:w-[calc((100%-48px)/3)] shrink-0 snap-start rounded-none overflow-hidden bg-zinc-900 border border-zinc-200/70 hover:border-zinc-900/40 cursor-pointer shadow-xs hover:shadow-lg transition-all duration-300"
            >
              {/* Imagem proporcional e nítida */}
              <img
                src={cat.image}
                alt={cat.name}
                loading={index < 3 ? 'eager' : 'lazy'}
                decoding="async"
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out brightness-[0.93] group-hover:brightness-100"
              />

              {/* Overlay suave com gradiente natural */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-6 sm:p-7 flex flex-col justify-end z-10 pointer-events-none">
                <div className="flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-mono font-bold tracking-[0.16em] text-[#F4C400] uppercase block">
                      {cat.productCount ? `${cat.productCount} PEÇAS` : 'CATÁLOGO'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-[#F4C400] transition-colors">
                      {cat.name}
                    </h3>
                    {cat.tagline && (
                      <p className="text-xs text-zinc-300/90 font-normal line-clamp-1 pt-0.5">
                        {cat.tagline}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white/95 group-hover:text-[#F4C400] shrink-0 pb-0.5 group-hover:translate-x-1 transition-all duration-200">
                    <span>EXPLORAR</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};
