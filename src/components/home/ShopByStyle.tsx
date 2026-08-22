import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

interface ShopByStyleProps {
  onNavigate: (page: string, param?: string) => void;
}

export const ShopByStyle: React.FC<ShopByStyleProps> = ({ onNavigate }) => {
  const styles = [
    {
      id: 'oversized',
      name: 'Oversized',
      title: 'Boxy & Oversized Fit',
      subtitle: 'Modelagem ampla de ombros caídos, gola 3cm encorpada e tecido 260g',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      tag: 'Corte Boxy Heavy',
      slug: 'oversized',
      gridSpan: 'lg:col-span-3 h-[420px]',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      title: 'Minimalist Clean',
      subtitle: 'Sem estampas, foco no algodão puro e acabamento impecável',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      tag: 'Essencial Básico',
      slug: 'moletons',
      gridSpan: 'lg:col-span-3 h-[420px]',
    },
    {
      id: 'urban',
      name: 'Urban',
      title: 'Urban Underground',
      subtitle: 'Estampas marcantes em silk-screen, gráficos autorais e lifestyle das ruas',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      tag: 'Graphic Streetwear',
      slug: 'camisetas',
      gridSpan: 'lg:col-span-2 h-[380px]',
    },
    {
      id: 'utility',
      name: 'Utility',
      title: 'Utility & Techwear',
      subtitle: 'Nylon impermeável, zíperes selados, múltiplos bolsos e mosquetões',
      image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
      tag: 'Utilitário Impermeável',
      slug: 'jaquetas',
      gridSpan: 'lg:col-span-2 h-[380px]',
    },
    {
      id: 'essentials',
      name: 'Essentials',
      title: 'Core Essentials',
      subtitle: 'Peças chaves e duradouras para composição diária de sobreposições',
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
      tag: 'Permanente Archive',
      slug: 'calcas',
      gridSpan: 'lg:col-span-2 h-[380px]',
    },
  ];

  return (
    <section className="py-20 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>ESTÉTICAS & SILHUETAS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#EFECE6]">
              COMPRE POR ESTILO
            </h2>
            <p className="text-xs text-[#777777] mt-1 max-w-lg">
              Explore linhas conceituais projetadas para cada proposta de visual urbano.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline flex items-center gap-1.5"
          >
            Explorar Todos os Estilos <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Large Editorial Style Blocks (Bento Asymmetric Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {styles.map((st) => (
            <div
              key={st.id}
              onClick={() => onNavigate('shop', st.slug)}
              className={`group relative rounded-3xl overflow-hidden border border-[#262626] hover:border-[#D6B35A] cursor-pointer bg-[#161616] transition-all duration-500 shadow-xl ${st.gridSpan}`}
            >
              <img
                src={st.image}
                alt={st.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-8 flex flex-col justify-end">
                <span className="bg-[#D6B35A] text-black text-[10px] font-black uppercase px-3 py-1 rounded w-fit mb-3 shadow">
                  {st.tag}
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-[#EFECE6] uppercase tracking-tight group-hover:text-[#D6B35A] transition-colors">
                  {st.name} — {st.title}
                </h3>

                <p className="text-xs text-[#777777] mt-2 max-w-md line-clamp-2 leading-relaxed">
                  {st.subtitle}
                </p>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-black text-[#D6B35A] group-hover:translate-x-1.5 transition-transform">
                  EXPLORAR PEÇAS {st.name.toUpperCase()} <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
