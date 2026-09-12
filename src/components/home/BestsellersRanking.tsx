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

  let bestsellers = products.filter((p) => p.isBestSeller || p.tags.includes('Mais Vendido'));
  if (bestsellers.length < 8) {
    bestsellers = [...bestsellers, ...products.filter((p) => !bestsellers.includes(p))].slice(0, 8);
  } else {
    bestsellers = bestsellers.slice(0, 8);
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-b border-[#E4E4E7]">
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 sm:pb-8 border-b border-[#E4E4E7] mb-8 sm:mb-10 lg:mb-12">
          <div>
            {/* Minimalist Atelier Tag */}
            <div className="flex items-center gap-2 text-[10.5px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#B45309] mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] inline-block" />
              <span>CURADORIA & DEMANDA // DROP RANKING</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-[#18181B] leading-none">
              OS MAIS PROCURADOS
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#71717A] mt-2.5 max-w-xl font-normal leading-relaxed">
              Modelagens autorais desenvolvidas para caimento boxy e matéria-prima de alta gramatura. As silhuetas de maior procura e recompra no ateliê.
            </p>
          </div>

          {/* Integrated Editorial CTA */}
          <div className="flex items-center gap-4 shrink-0 sm:self-end mt-2 sm:mt-0">
            <div className="hidden xl:flex items-center text-[11px] font-mono font-semibold text-[#71717A] pr-4 border-r border-[#E4E4E7]">
              <span>[ 08 PEÇAS EM DESTAQUE ]</span>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="group inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-[#18181B] hover:bg-[#18181B] text-[#18181B] hover:text-white transition-all duration-200 rounded-[2px] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-2xs"
            >
              <span>Ver Todo o Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* 8 Bestsellers Grid with Spacious Editorial Respiration */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7 xl:gap-8">
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
                  rankingIndex={index + 1}
                  totalRanking={8}
                  showCategory={false}
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
