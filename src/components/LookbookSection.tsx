import React, { useState } from 'react';
import { LOOKBOOK_LOOKS } from '../data/lookbook';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { ShoppingBag, Eye, Plus, ArrowRight } from 'lucide-react';

interface LookbookSectionProps {
  onQuickViewProduct: (productId: string) => void;
  onNavigateToProduct: (productId: string) => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({
  onQuickViewProduct,
  onNavigateToProduct,
}) => {
  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const activeLook = LOOKBOOK_LOOKS[activeLookIndex];

  return (
    <section className="py-20 bg-[#080808] text-[#EFECE6] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-2 block">
              EDITORIAL STREETWEAR
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#EFECE6]">
              SHOP THE LOOKBOOK
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] mt-2">
              Clique nos pontos destacados da imagem para comprar o outfit completo.
            </p>
          </div>

          <div className="flex gap-2">
            {LOOKBOOK_LOOKS.map((look, idx) => (
              <button
                key={look.id}
                onClick={() => setActiveLookIndex(idx)}
                className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all ${
                  activeLookIndex === idx
                    ? 'bg-[#D6B35A] text-black border-[#D6B35A]'
                    : 'bg-[#161616] text-[#777777] border-[#262626] hover:text-[#EFECE6]'
                }`}
              >
                {look.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Image & Products Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Hotspot Canvas */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#262626] aspect-[4/5] bg-black">
            <img
              src={activeLook.image}
              alt={activeLook.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Hotspots */}
            {(activeLook?.hotspots || []).map((hs) => {
              const product = MOCK_PRODUCTS.find((p) => p.id === hs.productId);
              if (!product) return null;

              return (
                <div
                  key={hs.id}
                  style={{ top: `${hs.topPercent}%`, left: `${hs.leftPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                >
                  <button
                    onClick={() => onQuickViewProduct(product.id)}
                    className="w-8 h-8 rounded-full bg-[#D6B35A] text-black flex items-center justify-center font-bold shadow-2xl animate-pulse hover:scale-125 transition-transform"
                    aria-label={`Ver produto ${product.title}`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Hover Preview Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:flex flex-col bg-[#161616] border border-[#262626] p-2.5 rounded-lg shadow-2xl w-48 z-30 animate-fadeIn pointer-events-none">
                    <span className="text-[10px] text-[#D6B35A] font-bold uppercase">{product.category}</span>
                    <p className="text-xs font-bold text-[#EFECE6] line-clamp-1">{product.title}</p>
                    <p className="text-xs font-black text-[#EFECE6] mt-1">
                      R$ {(product.promoPrice || product.price).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linked Products Cards Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#777777] mb-2">
              Peças Selecionadas neste Outfit ({(activeLook?.hotspots || []).length})
            </h3>

            {(activeLook?.hotspots || []).map((hs) => {
              const product = MOCK_PRODUCTS.find((p) => p.id === hs.productId);
              if (!product) return null;

              return (
                <div
                  key={hs.id}
                  className="p-4 bg-[#161616] border border-[#262626] hover:border-[#D6B35A] rounded-xl flex gap-4 items-center transition-all group"
                >
                  <img
                    src={product.images?.[0] || (product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded bg-black shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#D6B35A] font-bold uppercase tracking-wider">
                      {product.collection}
                    </span>
                    <h4 className="text-xs font-bold text-[#EFECE6] line-clamp-2 mt-0.5 group-hover:text-[#D6B35A] transition-colors">
                      {product.title}
                    </h4>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-black text-[#EFECE6]">
                        R$ {(product.promoPrice || product.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onQuickViewProduct(product.id)}
                        className="text-[11px] font-bold uppercase bg-[#080808] hover:bg-[#EFECE6] hover:text-black border border-[#262626] text-[#EFECE6] px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Espiada
                      </button>

                      <button
                        onClick={() => onNavigateToProduct(product.id)}
                        className="text-[11px] font-bold uppercase text-[#D6B35A] hover:underline px-2 py-1.5 flex items-center gap-1"
                      >
                        Ver Detalhes <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
