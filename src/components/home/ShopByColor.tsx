import React, { useState } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { Palette, Check, ArrowRight } from 'lucide-react';

interface ShopByColorProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const ShopByColor: React.FC<ShopByColorProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const colorOptions = [
    { id: 'all', name: 'Todas as Cores', hex: 'bg-gradient-to-r from-zinc-900 via-stone-400 to-amber-100' },
    { id: 'black', name: 'Obsidian Black', hex: '#121212' },
    { id: 'white', name: 'Raw Bone / White', hex: '#F0EFEA' },
    { id: 'grey', name: 'Washed Charcoal', hex: '#3A3A3C' },
    { id: 'olive', name: 'Dusty Olive', hex: '#485044' },
    { id: 'khaki', name: 'Tan Sand & Khaki', hex: '#C2B280' },
  ];

  const [activeColor, setActiveColor] = useState('all');

  const filteredProducts = products.filter((p) => {
    if (activeColor === 'all') return true;
    return p.colors.some((c) => c.color === activeColor || c.colorName.toLowerCase().includes(activeColor));
  }).slice(0, 4);

  return (
    <section className="py-16 bg-[#161616] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              <Palette className="w-3.5 h-3.5" />
              <span>PALETA DA ESTAÇÃO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
              COMPRE POR COR
            </h2>
            <p className="text-xs text-[#777777] mt-1">
              Selecione sua tonalidade favorita para visualizar peças coordenadas.
            </p>
          </div>

          {/* Color Chips Selector */}
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((col) => {
              const isSelected = activeColor === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveColor(col.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-[#080808] text-[#EFECE6] border-[#D6B35A] shadow-lg'
                      : 'bg-[#080808] text-[#777777] border-[#262626] hover:text-[#EFECE6]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 ${
                      col.hex.startsWith('bg') ? col.hex : ''
                    }`}
                    style={{ backgroundColor: col.hex.startsWith('#') ? col.hex : undefined }}
                  />
                  <span>{col.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#D6B35A]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtered Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
              onProductClick={(id) => onNavigate('product', id)}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline inline-flex items-center gap-2"
          >
            Ver Catálogo por Tons <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
