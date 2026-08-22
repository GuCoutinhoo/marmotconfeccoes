import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface MostFavoritedGridProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const MostFavoritedGrid: React.FC<MostFavoritedGridProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  // Select ~6 most favorited products
  const favoritedProducts = products
    .filter((p) => p.isBestSeller || p.rating >= 4.8 || p.reviewCount > 15)
    .slice(0, 6);

  const favCounts = ['2.8k', '2.4k', '1.9k', '1.6k', '1.2k', '980'];

  return (
    <section className="py-20 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>WISHLIST TRENDING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#EFECE6]">
              MAIS FAVORITADOS PELA COMUNIDADE
            </h2>
            <p className="text-xs text-[#777777] mt-1 max-w-lg">
              As peças mais salvas nas listas de desejos dos nossos clientes nesta semana.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline flex items-center gap-1.5"
          >
            Explorar Catálogo <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Products Grid with Favorited Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritedProducts.map((product, idx) => (
            <div key={product.id} className="relative group flex flex-col h-full">
              {/* Favorited Heart Badge */}
              <div className="absolute top-3 left-3 z-20 bg-[#080808]/90 border border-[#262626] text-[#EFECE6] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full backdrop-blur flex items-center gap-1.5 shadow-lg">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                <span>{favCounts[idx % favCounts.length]} Salvos</span>
              </div>

              <ProductCard
                product={product}
                onQuickView={onQuickView}
                onProductClick={(id) => onNavigate('product', id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
