import React from 'react';
import { ArrowRight, Tag, Percent, Sparkles } from 'lucide-react';

interface PromoHorizontalBannerProps {
  onNavigate: (page: string, param?: string) => void;
}

export const PromoHorizontalBanner: React.FC<PromoHorizontalBannerProps> = ({ onNavigate }) => {
  return (
    <section className="py-16 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          onClick={() => onNavigate('shop')}
          className="group relative rounded-3xl overflow-hidden border border-[#262626] hover:border-[#D6B35A] cursor-pointer bg-gradient-to-r from-stone-950 via-[#161616] to-stone-900 p-8 sm:p-12 transition-all duration-500 shadow-2xl"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D6B35A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#D6B35A] text-black px-3.5 py-1 rounded text-xs font-black uppercase tracking-widest">
                <Percent className="w-3.5 h-3.5 stroke-[3]" />
                <span>OFERTA DE TEMPO LIMITADO</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#EFECE6] leading-none group-hover:text-[#D6B35A] transition-colors">
                ATÉ 40% OFF — PEÇAS SELECIONADAS
              </h2>

              <p className="text-xs sm:text-sm text-[#777777] font-medium leading-relaxed">
                Aproveite descontos exclusivos nas últimas unidades da coleção de inverno. Cupom automático aplicado no checkout.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
              <div className="bg-[#080808] border border-[#262626] px-5 py-3.5 rounded-2xl text-center">
                <span className="text-[10px] text-[#777777] uppercase font-bold block">CUPOM ATIVO</span>
                <span className="font-mono text-lg font-black text-[#D6B35A]">AURA40</span>
              </div>

              <span className="bg-[#D6B35A] text-black font-extrabold text-xs uppercase tracking-wider py-4 px-8 rounded-2xl transition-all inline-flex items-center gap-2 group-hover:bg-[#EFECE6] shadow-xl">
                VER PEÇAS EM OFERTA <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
