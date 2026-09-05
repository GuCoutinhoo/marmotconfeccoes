import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { ProductSkeleton } from '../ProductSkeleton';
import { Trophy, TrendingUp, ArrowRight } from 'lucide-react';

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
    <section className="py-20 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309] mb-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>FAVORITOS DA COMUNIDADE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#18181B]">
              OS MAIS PROCURADOS
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-1 max-w-lg">
              As peças com maior índice de recompra e destaque pela durabilidade da malha pesada.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs sm:text-sm font-bold uppercase text-[#B45309] hover:text-[#18181B] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            Ver Todo o Catálogo <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 8 Bestsellers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7 xl:gap-8">
          {isProductsEmpty ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`bs-skel-${idx}`} className="flex flex-col h-full">
                <ProductSkeleton />
              </div>
            ))
          ) : (
            bestsellers.map((product, index) => (
              <div key={product.id} className="relative group flex flex-col h-full">
                {/* Discrete Leaderboard Badge */}
                <div className="absolute top-3 left-3 z-20 bg-white/95 text-[#B45309] font-mono font-black text-xs px-2.5 py-1 rounded-md border border-[#E4E4E7] backdrop-blur-md shadow-sm flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[#B45309]" /> #{String(index + 1).padStart(2, '0')}
                </div>

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
