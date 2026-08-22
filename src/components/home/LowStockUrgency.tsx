import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface LowStockUrgencyProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const LowStockUrgency: React.FC<LowStockUrgencyProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const lowStockProducts = products.filter((p) => p.stockCount <= 12).slice(0, 4);

  return (
    <section className="py-16 bg-[#161616] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
              <span>ESTOQUE LIMITADO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
              PRODUTOS QUE ESTÃO ACABANDO
            </h2>
            <p className="text-xs text-[#777777] mt-1">
              Últimas unidades dos nossos drops. Sem previsão de reposição de lote.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {lowStockProducts.map((product) => (
            <div key={product.id} className="relative flex flex-col h-full">
              {/* Urgency Badge */}
              <div className="absolute top-3 left-3 z-20 bg-amber-500 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                <span>Restam apenas {product.stockCount} un.</span>
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
