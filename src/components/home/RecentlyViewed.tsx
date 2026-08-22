import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { Clock, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface RecentlyViewedProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const { recentViewed } = useCart();

  const displayProducts = recentViewed.length > 0
    ? recentViewed.slice(0, 4)
    : products.slice(0, 4);

  const title = recentViewed.length > 0
    ? 'VISTOS RECENTEMENTE POR VOCÊ'
    : 'RECOMENDADOS PARA O SEU ESTILO';

  return (
    <section className="py-16 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
          {recentViewed.length > 0 ? (
            <Clock className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>SUA NAVEGAÇÃO</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6] mb-8">
          {title}
        </h2>

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
