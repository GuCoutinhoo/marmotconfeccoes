import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface BannerHeroProps {
  onNavigate: (page: string, param?: string) => void;
}

const HERO_IMAGE = '/hero-v2.png';

export const BannerHero: React.FC<BannerHeroProps> = ({ onNavigate }) => {
  return (
    <section 
      className="relative w-full bg-[#0B0B0E] text-white overflow-hidden -mt-[62px] sm:-mt-[66px] h-screen min-h-[640px]"
    >
      {/* Full Bleed Background Image - Spanning 100% width and height behind header */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <img
          src={HERO_IMAGE}
          alt="Marmot Confecções - Feito Diferente"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[72%_top] sm:object-[68%_top] lg:object-[65%_top] xl:object-[center_top] brightness-100 contrast-[1.02]"
        />

        {/* Gradiente sutilíssimo no lado esquerdo, deixando a imagem bem clara e natural */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 via-35% to-transparent lg:from-black/25 lg:via-transparent to-transparent pointer-events-none" />
        
        {/* Gradiente leve no topo para leitura do header */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content Container - Full Height Flex layout */}
      <div className="relative z-10 w-full h-full px-7 sm:px-8 flex flex-col justify-between pt-22 sm:pt-26 lg:pt-28 pb-5 sm:pb-8">
        {/* Main Composition: Left Title & CTA + Right Discreet Editorial Text */}
        <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-8 my-auto">
          
          {/* LEFT: Massive Editorial Headline + Yellow Button */}
          <div className="flex flex-col items-start max-w-[760px]">
            <h1 className="font-black uppercase tracking-[-0.04em] text-white leading-[0.88] select-none">
              <span className="block pl-[80px] text-[56px] sm:text-[80px] md:text-[96px] lg:text-[112px] xl:text-[124px] 2xl:text-[132px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
                FEITO
              </span>
              <span className="block pl-[80px] text-[56px] sm:text-[80px] md:text-[96px] lg:text-[112px] xl:text-[124px] 2xl:text-[132px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
                DIFERENTE.
              </span>
            </h1>

            {/* Premium Yellow CTA Button */}
            <button
              onClick={() => onNavigate('shop')}
              className="mt-6 sm:mt-8 ml-[88px] h-[54px] sm:h-[60px] px-8 sm:px-10 bg-[#F4C400] hover:bg-[#ffd21a] text-[#0B0B0E] font-black text-sm sm:text-[15px] uppercase tracking-[0.1em] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl hover:shadow-[0_12px_28px_rgba(244,196,0,0.45)] cursor-pointer group shrink-0"
            >
              <span>COMPRAR NOVO DROP</span>
              <ArrowRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

        </div>

        {/* Scroll down indicator */}
        <div 
          onClick={() => {
            const nextSec = document.getElementById('category-showcase-section');
            if (nextSec) {
              nextSec.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollBy({ top: 600, behavior: 'smooth' });
            }
          }}
          className="self-center flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-[10px] font-mono tracking-[0.25em] uppercase select-none group pt-2"
        >
          <span>EXPLORAR COLEÇÃO</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce text-[#F4C400]" />
        </div>
      </div>
    </section>
  );
};
