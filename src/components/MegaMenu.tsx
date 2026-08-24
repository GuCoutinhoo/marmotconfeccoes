import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Flame, Sparkles, Layers } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categorySlug: string) => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const { categories } = useStore();

  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-2xl border-b border-[#E4E4E7] shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-[#18181B] z-[90] animate-fadeIn hidden md:block"
    >
      <div className="max-w-7xl mx-auto px-8 py-7 grid grid-cols-12 gap-8">
        {/* Categories Grid */}
        <div className="col-span-8 grid grid-cols-3 gap-5 border-r border-[#E4E4E7] pr-8">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.slug}
              onClick={() => {
                onSelectCategory(cat.slug);
                onClose();
              }}
              className="group cursor-pointer p-3 rounded-xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E4E4E7] transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[13.5px] text-[#18181B] group-hover:text-[#B45309] transition-colors">
                  {cat.name}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#71717A] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-[#B45309] transition-all" />
              </div>
              <p className="text-[11.5px] text-[#71717A] line-clamp-1">{cat.tagline || cat.description}</p>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {(cat.subcategories || []).slice(0, 2).map((sub, idx) => (
                  <span key={idx} className="text-[9.5px] font-mono uppercase tracking-wider text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 rounded-md border border-[#E4E4E7]">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Featured Drop Banner */}
        <div className="col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-[#B45309] uppercase tracking-[0.2em] mb-2 font-mono">
              <Flame className="w-3.5 h-3.5 fill-current" /> DROP EM DESTAQUE
            </div>
            <h3 className="text-[15px] font-black tracking-tight mb-1.5 text-[#18181B]">Vol. 04: Cyber Dystopia</h3>
            <p className="text-[12px] text-[#52525B] leading-relaxed mb-4">
              Silhuetas utilitárias e tecidos heavyweight 260g/m² com tingimento garment dye artesanal.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#B45309]">
              <Sparkles className="w-3.5 h-3.5" /> EDIÇÃO LIMITADA NUMERADA
            </div>
          </div>

          <div
            onClick={() => {
              onSelectCategory('cargos');
              onClose();
            }}
            className="group cursor-pointer relative h-36 rounded-xl overflow-hidden border border-[#E4E4E7] hover:border-[#18181B] transition-all mt-4"
          >
            <img
              src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80"
              alt="Drop em Destaque"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-4 flex flex-col justify-end">
              <span className="text-[11.5px] font-black text-white uppercase tracking-wider group-hover:text-[#F4C400] transition-colors flex items-center gap-1.5">
                Conhecer Coleção <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

