import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { ProductSkeleton } from '../ProductSkeleton';
import { ArrowRight } from 'lucide-react';

interface BestsellersRankingProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const BestsellersRanking: React.FC<BestsellersRankingProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const isProductsEmpty = !products || products.length === 0;

  let bestsellers = products.filter((p) => p.isBestSeller || p.tags?.includes('Mais Vendido'));
  if (bestsellers.length < 8) {
    bestsellers = [...bestsellers, ...products.filter((p) => !bestsellers.includes(p))].slice(0, 8);
  } else {
    bestsellers = bestsellers.slice(0, 8);
  }

  return (
    <section className="py-10 sm:py-12 lg:py-14 bg-white border-b border-zinc-200/90 select-none">
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* SECTION HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
              <span className="text-[10px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-500">
                CURADORIA // BESTSELLERS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-black uppercase tracking-tight text-[#0B0B0E] leading-none">
              OS MAIS PROCURADOS
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-500 font-normal leading-relaxed mt-1.5 max-w-xl">
              Peças com maior índice de recompra e destaque pela modelagem estruturada e malha de alta densidade.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B0B0E] hover:text-zinc-600 inline-flex items-center gap-1.5 cursor-pointer transition-colors group self-start sm:self-end pb-0.5"
          >
            <span>VER CATÁLOGO COMPLETO</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        {/* 8 Bestsellers Grid (Unified Editorial Cards with 01, 02, 03... numbering) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
          {isProductsEmpty ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`bs-skel-${idx}`} className="flex flex-col h-full">
                <ProductSkeleton />
              </div>
            ))
          ) : (
            bestsellers.map((product, index) => (
              <div key={product.id} className="flex flex-col h-full">
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  onProductClick={(id) => onNavigate('product', id)}
                  priorityBadge={String(index + 1).padStart(2, '0')}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
