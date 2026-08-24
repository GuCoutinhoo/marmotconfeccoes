import React from 'react';
import { ArrowRight, Grid } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface CategoryNavigationGridProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CategoryNavigationGrid: React.FC<CategoryNavigationGridProps> = ({ onNavigate }) => {
  const { categories } = useStore();

  return (
    <section id="category-grid-section" className="py-20 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309] mb-1.5">
              <Grid className="w-3.5 h-3.5" />
              <span>NAVEGAÇÃO VISUAL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#18181B]">
              COMPRE POR CATEGORIA
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-1 max-w-lg">
              Explore o catálogo completo de peças divididas por silhueta e utilidade streetwear.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs sm:text-sm font-black uppercase text-[#B45309] hover:text-[#18181B] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            Ver Todo o Catálogo <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Editorial Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.slug}
              onClick={() => onNavigate('shop', cat.slug)}
              className="group relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#E4E4E7] hover:border-[#18181B] cursor-pointer bg-[#F4F4F5] transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              {/* Image with subtle zoom */}
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.98] group-hover:brightness-100"
              />

              {/* Gradient Vignette for Text Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-[10px] font-mono font-bold text-[#F4C400] uppercase tracking-widest block mb-1">
                  {cat.productCount ? `${cat.productCount} Peças` : 'Catálogo'}
                </span>

                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight group-hover:text-[#F4C400] transition-colors">
                  {cat.name}
                </h3>

                <p className="text-[11px] text-[#D4D4D8] mt-1 line-clamp-1 leading-relaxed">
                  {cat.tagline || cat.description}
                </p>

                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-[#F4C400] group-hover:translate-x-1 transition-all">
                  EXPLORAR <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
