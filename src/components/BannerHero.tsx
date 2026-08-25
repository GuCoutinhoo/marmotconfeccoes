import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface BannerHeroProps {
  onNavigate: (page: string, param?: string) => void;
}

const HERO_IMAGE = 'https://i.postimg.cc/tTGgns2X/hero-update.png';

export const BannerHero: React.FC<BannerHeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative w-full bg-[#0B0B0E] text-white border-b border-[#E4E4E7] overflow-hidden">
      {/* Main Editorial Hero Canvas - Full Bleed Image */}
      <div className="relative min-h-[560px] sm:min-h-[620px] lg:min-h-[700px] xl:min-h-[760px] flex items-center">
        
        {/* Full Hero Background Image - Spanning 100% width with 0 white smoke/fog */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
          <img
            src={HERO_IMAGE}
            alt="Marmot Confecções - Coleção Streetwear"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[75%_top] sm:object-[70%_top] md:object-[60%_top] lg:object-[center_top] brightness-[0.95] contrast-[1.05]"
          />
          {/* Gentle dark gradient on the left side to guarantee crystal-clear text readability over the full image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent lg:via-black/30 lg:to-transparent" />
          <div className="sm:hidden absolute inset-0 bg-black/30" />
        </div>

        {/* Hero Content Container - High Contrast Editorial Layout */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-[620px] xl:max-w-[700px] flex flex-col items-start">
            
            {/* 1. Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 sm:py-2.5 bg-black/60 border border-white/20 backdrop-blur-md shadow-lg rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4C400] shrink-0 animate-pulse shadow-[0_0_8px_rgba(244,196,0,0.8)]" />
              <span className="text-[12px] sm:text-[13px] font-mono font-bold tracking-[0.2em] uppercase text-[#F4C400]">
                COLEÇÃO 2026
              </span>
              <span className="text-white/40 font-mono text-sm">/</span>
              <span className="text-[11.5px] sm:text-[12.5px] font-mono tracking-[0.16em] uppercase text-zinc-300">
                PSO E PRESENÇA
              </span>
            </div>

            {/* 2. Main Headline - 3-Line High Contrast Editorial Impact */}
            <div className="mt-5 sm:mt-6 lg:mt-7">
              <h1 
                className="font-black uppercase tracking-[-0.035em] text-white drop-shadow-sm"
                style={{
                  fontSize: 'clamp(34px, 4.6vw, 66px)',
                  lineHeight: 1.04,
                }}
              >
                {/* Linha 1 */}
                <span className="block text-white">
                  PESO NO TECIDO.
                </span>
                {/* Linha 2 */}
                <span className="block mt-1.5 sm:mt-2 text-zinc-200">
                  PRESENÇA NO CORPO.
                </span>
                {/* Linha 3 */}
                <span className="block mt-1.5 sm:mt-2">
                  <span className="text-[#F4C400]">CAIMENTO</span>{' '}
                  <span className="text-white">QUE FALA POR SI.</span>
                </span>
              </h1>
            </div>

            {/* 3. Description - High Readability */}
            <div className="mt-5 sm:mt-6 lg:mt-7">
              <p className="text-[16px] sm:text-[18px] lg:text-[19px] text-zinc-200 max-w-[560px] font-normal leading-[1.6] drop-shadow-sm">
                Silhuetas amplas, matéria-prima encorpada e construção feita para durar. 
                Peças desenvolvidas com estrutura, peso e presença autoral.
              </p>
            </div>

            {/* 4. Action CTAs */}
            <div className="mt-8 sm:mt-9 lg:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('shop')}
                className="h-[54px] sm:h-[58px] px-8 sm:px-10 bg-[#F4C400] hover:bg-[#ffd21a] text-[#0B0B0E] font-black text-sm sm:text-[15px] uppercase tracking-[0.1em] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(244,196,0,0.3)] hover:scale-[1.02] active:scale-[0.98] group shrink-0 cursor-pointer rounded-xl"
              >
                <span>EXPLORAR O DROP</span>
                <ArrowRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigate('shop', 'oversized')}
                className="h-[54px] sm:h-[58px] px-7 sm:px-9 bg-black/40 hover:bg-black/60 text-white border border-white/30 hover:border-white font-bold text-sm sm:text-[15px] uppercase tracking-[0.08em] backdrop-blur-sm transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-[0.98] rounded-xl"
              >
                <span>VER CAMISETAS & MOLETONS</span>
              </button>
            </div>

          </div>
        </div>

        {/* Subtle Scroll Indicator */}
        <div 
          onClick={() => {
            const featuredSection = document.getElementById('featured-products');
            if (featuredSection) {
              featuredSection.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollBy({ top: 500, behavior: 'smooth' });
            }
          }}
          className="hidden xl:flex absolute bottom-5 right-8 z-20 items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer text-[10px] font-mono tracking-[0.2em] uppercase select-none group"
        >
          <span>SCROLL</span>
          <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center group-hover:border-white transition-colors">
            <ChevronDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Sleek, Elevated Editorial Micro-Strip */}
      <div className="border-t border-[#E4E4E7] bg-white/95 backdrop-blur-md py-3 px-4 sm:px-6 lg:px-[4.5vw]">
        <div className="w-full flex flex-wrap items-center justify-between gap-4 text-[11px] sm:text-[11.5px] font-mono text-[#71717A] uppercase tracking-[0.14em]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#F4C400] shrink-0 animate-pulse" />
            <span className="text-[#18181B] font-medium">ALGODÃO PENTEADO 260G A 400G/M²</span>
          </div>

          <div className="hidden md:flex items-center gap-5 lg:gap-7 text-[#52525B]">
            <span className="flex items-center gap-2">
              <span className="text-[#D4D4D8]">•</span>
              <span className="hover:text-black transition-colors">GOLA CANELADA 3CM (NÃO ESGARÇA)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#D4D4D8]">•</span>
              <span className="hover:text-black transition-colors">MODELAGEM BOXY & OVERSIZED</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#D4D4D8]">•</span>
              <span className="hover:text-black transition-colors">ENVIO EXPRESSO EM ATÉ 24H</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#B45309] font-bold tracking-[0.18em]">
            <span className="w-1.5 h-1.5 bg-[#B45309] rotate-45" />
            <span>MARMOT // EST. 2024</span>
          </div>
        </div>
      </div>
    </section>
  );
};

