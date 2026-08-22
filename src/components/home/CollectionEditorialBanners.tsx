import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CollectionEditorialBannersProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CollectionEditorialBanners: React.FC<CollectionEditorialBannersProps> = ({ onNavigate }) => {
  return (
    <section className="py-20 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#D6B35A] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> EDITORIAIS EXCLUSIVOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
              COLEÇÕES AURA ARCHIVE
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Collection Banner 1 */}
          <div
            onClick={() => onNavigate('shop')}
            className="group relative h-[420px] rounded-2xl overflow-hidden border border-[#262626] hover:border-[#D6B35A] cursor-pointer bg-[#161616] transition-all"
          >
            <img
              src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80"
              alt="Vol. 04: Cyber Dystopia"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-75 group-hover:brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-8 sm:p-10 flex flex-col justify-end">
              <span className="text-xs font-mono font-extrabold text-[#D6B35A] uppercase tracking-widest block mb-2">
                DROP SEASON 2026
              </span>
              <h3 className="text-3xl sm:text-4xl font-black uppercase text-[#EFECE6] tracking-tight leading-none group-hover:text-[#D6B35A] transition-colors">
                VOL. 04: CYBER DYSTOPIA
              </h3>
              <p className="text-xs text-[#777777] mt-3 max-w-md leading-relaxed">
                Silhuetas futuristas utilitárias em nylon tático impermeável e estonados industriais.
              </p>
              <div className="mt-6">
                <span className="bg-[#D6B35A] text-black font-black text-xs uppercase px-6 py-3.5 rounded transition-all inline-flex items-center gap-2 group-hover:bg-[#EFECE6]">
                  EXPLORAR COLEÇÃO <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>

          {/* Collection Banner 2 */}
          <div
            onClick={() => onNavigate('shop')}
            className="group relative h-[420px] rounded-2xl overflow-hidden border border-[#262626] hover:border-[#D6B35A] cursor-pointer bg-[#161616] transition-all"
          >
            <img
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80"
              alt="Core Archive"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-75 group-hover:brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-8 sm:p-10 flex flex-col justify-end">
              <span className="text-xs font-mono font-extrabold text-[#D6B35A] uppercase tracking-widest block mb-2">
                PERMANENT ESSENTIALS
              </span>
              <h3 className="text-3xl sm:text-4xl font-black uppercase text-[#EFECE6] tracking-tight leading-none group-hover:text-[#D6B35A] transition-colors">
                CORE ARCHIVE SERIES
              </h3>
              <p className="text-xs text-[#777777] mt-3 max-w-md leading-relaxed">
                O pilar essencial de alta gramatura da nossa marca: camisetas 260g e hoodies 400g sem estampa.
              </p>
              <div className="mt-6">
                <span className="bg-[#080808] border border-[#262626] text-[#EFECE6] font-black text-xs uppercase px-6 py-3.5 rounded transition-all inline-flex items-center gap-2 group-hover:border-[#D6B35A] group-hover:text-[#D6B35A]">
                  VER BÁSICOS DENSOS <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
