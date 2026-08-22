import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface RecommendedForYouGridProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const RecommendedForYouGrid: React.FC<RecommendedForYouGridProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const { recentViewed } = useCart();

  // If user has viewed products, pick recommendations or recent, else fallback to popular
  const displayProducts = recentViewed.length > 0
    ? recentViewed.slice(0, 4)
    : products.filter((p) => p.isBestSeller || p.rating >= 4.7).slice(0, 4);

  const title = recentViewed.length > 0
    ? 'RECOMENDADOS COM BASE NO SEU HISTÓRICO'
    : 'RECOMENDADOS PARA O SEU ESTILO';

  return (
    <section className="py-20 bg-[#161616] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              {recentViewed.length > 0 ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>ALGORITMO DE RECOMENDAÇÃO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
              {title}
            </h2>
            <p className="text-xs text-[#777777] mt-1">
              Seleção de peças alinhadas com seu perfil de busca e estilo streetwear.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline flex items-center gap-1.5"
          >
            Ver Mais Opções <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
              onProductClick={(id) => onNavigate('product', id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
