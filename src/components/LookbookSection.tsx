import React, { useState } from 'react';
import { LOOKBOOK_LOOKS } from '../data/lookbook';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Eye, Plus, ArrowRight } from 'lucide-react';

interface LookbookSectionProps {
  onQuickViewProduct: (productId: string) => void;
  onNavigateToProduct: (productId: string) => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({
  onQuickViewProduct,
  onNavigateToProduct,
}) => {
  const { products } = useStore();
  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const activeLook = LOOKBOOK_LOOKS[activeLookIndex];

  return (
    <section className="py-20 bg-white text-[#18181B] border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#B45309] mb-2 block font-mono">
              EDITORIAL STREETWEAR
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#18181B]">
              SHOP THE LOOKBOOK
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-2">
              Clique nos pontos destacados da imagem para comprar o outfit completo.
            </p>
          </div>

          <div className="flex gap-2">
            {LOOKBOOK_LOOKS.map((look, idx) => (
              <button
                key={look.id}
                onClick={() => setActiveLookIndex(idx)}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                  activeLookIndex === idx
                    ? 'bg-[#18181B] text-white border-[#18181B]'
                    : 'bg-[#F8F9FA] text-[#71717A] border-[#E4E4E7] hover:text-[#18181B] hover:border-[#18181B]'
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
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#E4E4E7] aspect-[4/5] bg-[#F4F4F5] shadow-sm">
            <img
              src={activeLook.image}
              alt={activeLook.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Hotspots */}
            {(activeLook?.hotspots || []).map((hs) => {
              const product = products.find((p) => p.id === hs.productId || p.slug === hs.productId);
              if (!product) return null;

              return (
                <div
                  key={hs.id}
                  style={{ top: `${hs.topPercent}%`, left: `${hs.leftPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                >
                  <button
                    onClick={() => onQuickViewProduct(product.id)}
                    className="w-8 h-8 rounded-full bg-[#F4C400] text-[#0B0B0E] flex items-center justify-center font-bold shadow-xl animate-pulse hover:scale-125 transition-transform cursor-pointer"
                    aria-label={`Ver produto ${product.title}`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Hover Preview Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:flex flex-col bg-white border border-[#E4E4E7] p-2.5 rounded-xl shadow-xl w-48 z-30 animate-fadeIn pointer-events-none">
                    <span className="text-[10px] text-[#B45309] font-bold uppercase">{product.category}</span>
                    <p className="text-xs font-bold text-[#18181B] line-clamp-1">{product.title}</p>
                    <p className="text-xs font-black text-[#18181B] mt-1">
                      R$ {(product.promoPrice || product.price).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linked Products Cards Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2 font-mono">
              Peças Selecionadas neste Outfit ({(activeLook?.hotspots || []).length})
            </h3>

            {(activeLook?.hotspots || []).map((hs) => {
              const product = products.find((p) => p.id === hs.productId || p.slug === hs.productId);
              if (!product) return null;

              return (
                <div
                  key={hs.id}
                  className="p-4 bg-white border border-[#E4E4E7] hover:border-[#18181B] rounded-2xl flex gap-4 items-center transition-all group shadow-xs hover:shadow-sm"
                >
                  <img
                    src={product.images?.[0] || (product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded-xl bg-[#F4F4F5] shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#B45309] font-bold uppercase tracking-wider font-mono">
                      {product.collection}
                    </span>
                    <h4 className="text-xs font-bold text-[#18181B] line-clamp-2 mt-0.5 group-hover:text-[#B45309] transition-colors">
                      {product.title}
                    </h4>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-black text-[#18181B]">
                        R$ {(product.promoPrice || product.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onQuickViewProduct(product.id)}
                        className="text-[11px] font-bold uppercase bg-[#F8F9FA] hover:bg-[#18181B] hover:text-white border border-[#E4E4E7] text-[#18181B] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Espiada
                      </button>

                      <button
                        onClick={() => onNavigateToProduct(product.id)}
                        className="text-[11px] font-bold uppercase text-[#B45309] hover:underline px-2 py-1.5 flex items-center gap-1 cursor-pointer"
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
