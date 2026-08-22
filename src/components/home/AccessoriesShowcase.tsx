import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { Watch, ArrowRight } from 'lucide-react';

interface AccessoriesShowcaseProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const AccessoriesShowcase: React.FC<AccessoriesShowcaseProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const accessories = products.filter(
    (p) => p.category === 'acessorios' || p.category === 'bones'
  ).slice(0, 4);

  return (
    <section className="py-16 bg-[#161616] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              <Watch className="w-3.5 h-3.5" />
              <span>DETALHES DO OUTFIT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
              ACESSÓRIOS & HEADWEAR
            </h2>
            <p className="text-xs text-[#777777] mt-1">
              Shoulder bags em Nylon Cordura 1000D, correntes em aço cirúrgico 316L e headwear ajustável.
            </p>
          </div>
          <button
            onClick={() => onNavigate('shop', 'acessorios')}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline flex items-center gap-1"
          >
            Ver Todos os Acessórios <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {accessories.map((product) => (
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
