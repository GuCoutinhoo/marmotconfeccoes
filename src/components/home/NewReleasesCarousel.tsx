import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Product } from '../../types';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard } from '../ProductCard';

interface NewReleasesCarouselProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const NewReleasesCarousel: React.FC<NewReleasesCarouselProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isSectionInView, setIsSectionInView] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Filter diverse, curated release products from store products
  const releaseProducts = useMemo(() => {
    const list = products.filter(
      (p) =>
        p.isNewRelease ||
        p.tags?.some((t) => t.toLowerCase().includes('lançamento') || t.toLowerCase().includes('novo'))
    );

    // If needed, supplement with hero pieces so there is always a rich drop selection
    if (list.length >= 10) return list;
    const additional = products.filter((p) => !list.some((item) => item.id === p.id));
    return [...list, ...additional.slice(0, 12 - list.length)];
  }, [products]);

  // Track viewport entry for smooth editorial reveal
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

  // Update active card counter based on scroll position
  const handleScrollPosition = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const cardWidth = 380; // approximate card width + gap
    const scrollLeft = container.scrollLeft;
    const newIndex = Math.min(
      Math.floor((scrollLeft + 60) / cardWidth),
      releaseProducts.length - 1
    );
    setActiveCardIndex(Math.max(0, newIndex));
  }, [releaseProducts.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      // Scroll by approximately one or two cards width
      const scrollAmount = direction === 'left' ? -390 : 390;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const currentIndexStr = activeCardIndex + 1 < 10 ? `0${activeCardIndex + 1}` : `${activeCardIndex + 1}`;
  const totalCountStr = releaseProducts.length < 10 ? `0${releaseProducts.length}` : `${releaseProducts.length}`;

  return (
    <section
      ref={sectionRef}
      id="ultimos-lancamentos-drop"
      className="py-8 sm:py-10 lg:py-12 xl:py-14 bg-[#F6F5F2] border-b border-[#E4E1D8] select-none overflow-hidden relative"
    >
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* ========================================================= */}
        {/* CABEÇALHO COM A MESMA LÓGICA VISUAL DE "COMPRE POR CATEGORIA" */}
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
          {/* Eyebrow tag com bullet amarelo e assinatura Marmot */}
          <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
            <span className="w-2 h-2 bg-[#F4C400] rounded-full inline-block" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.24em] text-[#9A6A00]">
              NOVA TEMPORADA <span className="text-zinc-400 font-normal">//</span> ATELIER MARMOT DROP 2026
            </span>
            <span className="hidden sm:inline-block w-8 h-[1px] bg-[#E4E1D8]" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            {/* Bloco Título + Descrição harmônica */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[44px] font-black uppercase tracking-[-0.03em] text-[#0B0B0E] leading-none whitespace-nowrap">
                ÚLTIMOS LANÇAMENTOS
              </h2>

              <p className="text-xs sm:text-[13px] lg:text-[14px] text-zinc-600 font-normal leading-normal whitespace-normal sm:whitespace-nowrap">
                Tiragem limitada direto do ateliê. Silhuetas desenvolvidas para caimento encorpado e acabamento autoral.
              </p>
            </div>

            {/* Canto direito: Ver todos os lançamentos + Contador 01 / XX + Controles < > */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0 self-start lg:self-end pb-1">
              <button
                type="button"
                onClick={() => onNavigate('shop', 'novidades')}
                className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-black hover:text-zinc-700 inline-flex items-center gap-2 cursor-pointer transition-colors underline underline-offset-4 decoration-zinc-400 group hover:decoration-black"
              >
                <span>VER TODOS OS LANÇAMENTOS</span>
                <div className="w-5 h-5 rounded-full bg-black/5 group-hover:bg-[#0B0B0E] group-hover:text-[#F4C400] flex items-center justify-center transition-all duration-200">
                  <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Contador numérico de lançamentos com pill Marmot */}
              <div className="flex items-center text-xs sm:text-sm font-mono pl-1 sm:pl-2 bg-white/70 px-3 py-1.5 rounded-[3px] border border-zinc-200/90 shadow-2xs">
                <span className="font-bold text-[#0B0B0E] text-sm sm:text-base">
                  {currentIndexStr}
                </span>
                <span className="text-zinc-400 mx-1.5 font-light">/</span>
                <span className="text-zinc-500 font-medium">{totalCountStr}</span>
              </div>

              {/* Botões de navegação < e > com assinatura Marmot */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-[3px] border border-zinc-300 bg-white/90 hover:bg-[#0B0B0E] hover:text-[#F4C400] hover:border-[#0B0B0E] text-zinc-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs group"
                  aria-label="Lançamentos anteriores"
                  title="Lançamentos anteriores"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] group-hover:-translate-x-0.5 transition-transform duration-200" />
                </button>

                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-[3px] bg-[#0B0B0E] hover:bg-[#18181B] text-white hover:text-[#F4C400] border border-[#0B0B0E] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs group"
                  aria-label="Próximos lançamentos"
                  title="Próximos lançamentos"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* CARROSSEL DE CARDS AMPLIADOS (4 COMPLETOS + PEEK DO 5º)    */}
        {/* ========================================================= */}
        <div
          ref={scrollRef}
          onScroll={handleScrollPosition}
          className="flex gap-5 sm:gap-6 lg:gap-7 xl:gap-8 overflow-x-auto scrollbar-none pb-4 pt-1 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {releaseProducts.map((product, index) => (
            <div
              key={`release-${product.id}`}
              className="w-[275px] sm:w-[310px] md:w-[335px] lg:w-[350px] xl:w-[370px] 2xl:w-[380px] shrink-0 snap-start"
            >
              <ProductCard
                product={product}
                onQuickView={onQuickView}
                onProductClick={(id) => onNavigate('product', id)}
                variant="editorial"
                hideNewReleaseBadge={true}
                editorialIndex={index + 1}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
