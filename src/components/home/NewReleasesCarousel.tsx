import React, { useRef } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { ProductSkeleton } from '../ProductSkeleton';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

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

  const isProductsEmpty = !products || products.length === 0;

  let newReleases = products.filter(
    (p) => p.isNewRelease || p.tags.includes('Lançamento')
  );
  if (newReleases.length < 8) {
    newReleases = [...newReleases, ...products.filter((p) => !newReleases.includes(p))].slice(0, 8);
  } else {
    newReleases = newReleases.slice(0, 8);
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-20 bg-[#F8F9FA] border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309] mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DIRETO DO ATELIÊ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#18181B]">
              ÚLTIMOS LANÇAMENTOS
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-1 max-w-lg">
              Peças recém-saídas da confecção com estoques limitados e tiragem exclusiva.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs sm:text-sm font-bold uppercase text-[#B45309] hover:text-[#18181B] hover:underline flex items-center gap-1.5 mr-2 cursor-pointer"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                className="p-2.5 rounded-full bg-white border border-[#E4E4E7] text-[#18181B] hover:bg-[#18181B] hover:text-white shadow-sm transition-all cursor-pointer"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2.5 rounded-full bg-white border border-[#E4E4E7] text-[#18181B] hover:bg-[#18181B] hover:text-white shadow-sm transition-all cursor-pointer"
                aria-label="Próximo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Slider */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-none pb-4 scroll-smooth snap-x snap-mandatory"
        >
          {isProductsEmpty ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`skel-${idx}`} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
                <ProductSkeleton />
              </div>
            ))
          ) : (
            newReleases.map((product) => (
              <div
                key={product.id}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start"
              >
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  onProductClick={(id) => onNavigate('product', id)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
