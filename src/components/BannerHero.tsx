import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface BannerHeroProps {
  onNavigate: (page: string, param?: string) => void;
}

const HERO_IMAGE = 'https://i.postimg.cc/Cx5pHWJC/hero-marmot-update.png';

export const BannerHero: React.FC<BannerHeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative w-full bg-[#0B0B0E] text-[#F4F4F5] border-b border-[#202026] overflow-hidden">
      {/* Main Editorial Hero Canvas - Expansive, Flagship Desktop Proportions */}
      <div className="relative min-h-[560px] sm:min-h-[620px] lg:min-h-[720px] xl:min-h-[780px] lg:h-[82vh] max-h-[880px] flex items-center">
        
        {/* Editorial Photo Layer - Positioned with strong presence and natural center blend */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
          {/* Background image container anchored closer to the center-left for seamless composition */}
          <div className="absolute inset-0 lg:left-0 xl:left-[2%]">
            <img
              src={HERO_IMAGE}
              alt="Marmot Confecções - Coleção Streetwear"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[35%_0%] sm:object-[40%_2%] lg:object-[51%_2%] scale-128 sm:scale-136 lg:scale-145 xl:scale-150 brightness-[0.96] contrast-[1.06] saturate-[1.0] transition-transform duration-700"
            />
          </div>

          {/* Desktop Left-to-Right Soft Progressive Vignette (Allows more studio backdrop into the center) */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#0B0B0E] from-0% via-[#0B0B0E]/88 via-22% via-[#0B0B0E]/25 via-44% to-transparent to-72%" />
          
          {/* Mobile & Tablet Bottom-up fade */}
          <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/80 via-45% to-transparent" />

          {/* Soft top & bottom edge blending */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0B0B0E] to-transparent opacity-60" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B0B0E] to-transparent opacity-80" />
        </div>

        {/* Hero Content Container - Full Width starting directly at the left margin (4.5vw), shifted upward for optimal vertical centering */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-[4.5vw] py-10 sm:py-12 lg:py-14 xl:py-16 lg:-translate-y-6 xl:-translate-y-8">
          <div className="max-w-[840px] lg:max-w-[1060px] xl:max-w-[1240px] flex flex-col items-start">
            
            {/* 1. Badge - Scaled Up with Crisp Editorial Presence */}
            <div className="inline-flex items-center gap-3 px-4.5 py-2 sm:py-2.5 bg-[#141418]/95 border border-[#2E2E3C] backdrop-blur-md min-h-[38px] sm:min-h-[42px] shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4C400] shrink-0 animate-pulse shadow-[0_0_8px_rgba(244,196,0,0.6)]" />
              <span className="text-[12.5px] sm:text-[14px] font-mono font-bold tracking-[0.22em] uppercase text-[#F4C400]">
                COLEÇÃO 2026
              </span>
              <span className="text-[#4E4E5D] font-mono text-sm">/</span>
              <span className="text-[12px] sm:text-[13px] font-mono tracking-[0.18em] uppercase text-[#E4E4E7]">
                PESO E PRESENÇA
              </span>
            </div>

            {/* 2. Main Headline - 3-Line Unified Editorial Impact with Increased Scale (15-25% larger) */}
            <div className="mt-5 sm:mt-6 lg:mt-7">
              <h1 
                className="font-black uppercase tracking-[-0.038em]"
                style={{
                  fontSize: 'clamp(34px, 4.7vw, 68px)',
                  lineHeight: 1.02,
                }}
              >
                {/* Linha 1: #F5F5F3 / forte */}
                <span className="block text-[#F5F5F3] drop-shadow-sm">
                  PESO NO TECIDO.
                </span>
                {/* Linha 2: #DDD8CE / warm off-white / soft cream */}
                <span className="block mt-1.5 sm:mt-2 text-[#DDD8CE]">
                  PRESENÇA NO CORPO.
                </span>
                {/* Linha 3: #F4C400 + #F5F5F3 / destaque */}
                <span className="block mt-1.5 sm:mt-2">
                  <span className="text-[#F4C400]">CAIMENTO</span>{' '}
                  <span className="text-[#F5F5F3]">QUE FALA POR SI.</span>
                </span>
              </h1>
            </div>

            {/* 3. Description - Scaled Up with Generous Readability & Line Width */}
            <div className="mt-5 sm:mt-6 lg:mt-7">
              <p className="text-[17px] sm:text-[19px] lg:text-[21px] text-[#A1A1AA] max-w-[740px] font-normal leading-[1.65]">
                Silhuetas amplas, matéria-prima encorpada e construção feita para durar. 
                Peças desenvolvidas com estrutura, peso e presença autoral.
              </p>
            </div>

            {/* 4. Action CTAs - Scaled-Up, High Impact Buttons */}
            <div className="mt-8 sm:mt-9 lg:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('shop')}
                className="h-[58px] sm:h-[64px] px-9 sm:px-11 bg-[#F4C400] hover:bg-[#ffd21a] text-[#0B0B0E] font-black text-sm sm:text-[16px] uppercase tracking-[0.1em] transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_6px_24px_rgba(244,196,0,0.35)] hover:shadow-[0_0_30px_rgba(244,196,0,0.6)] hover:scale-[1.02] active:scale-[0.98] group shrink-0 cursor-pointer border border-[#FFF080]/40"
              >
                <span>EXPLORAR O DROP</span>
                <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigate('shop', 'oversized')}
                className="h-[58px] sm:h-[64px] px-8 sm:px-10 bg-[#14141A]/90 hover:bg-[#1E1E26] text-[#F5F5F3] hover:text-white border border-[#323242] hover:border-[#F4C400]/60 font-bold text-sm sm:text-[16px] uppercase tracking-[0.09em] transition-all duration-200 flex items-center justify-center backdrop-blur-md shrink-0 cursor-pointer shadow-md active:scale-[0.98]"
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
          className="hidden xl:flex absolute bottom-5 right-8 z-20 items-center gap-2 text-[#71717A] hover:text-[#C5A869] transition-colors cursor-pointer text-[10px] font-mono tracking-[0.2em] uppercase select-none group"
        >
          <span>SCROLL</span>
          <div className="w-5 h-5 rounded-full border border-[#2E2E38] flex items-center justify-center group-hover:border-[#C5A869] transition-colors">
            <ChevronDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Sleek, Elevated Editorial Micro-Strip */}
      <div className="border-t border-[#22222A] bg-[#0E0E12]/90 backdrop-blur-md py-3 px-4 sm:px-6 lg:px-[4.5vw]">
        <div className="w-full flex flex-wrap items-center justify-between gap-4 text-[11px] sm:text-[11.5px] font-mono text-[#8E8E98] uppercase tracking-[0.14em]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#e8b600] shrink-0 animate-pulse" />
            <span className="text-[#E4E4E7] font-medium">ALGODÃO PENTEADO 260G A 400G/M²</span>
          </div>

          <div className="hidden md:flex items-center gap-5 lg:gap-7 text-[#A1A1AA]">
            <span className="flex items-center gap-2">
              <span className="text-[#3F3F4C]">•</span>
              <span className="hover:text-white transition-colors">GOLA CANELADA 3CM (NÃO ESGARÇA)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#3F3F4C]">•</span>
              <span className="hover:text-white transition-colors">MODELAGEM BOXY & OVERSIZED</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#3F3F4C]">•</span>
              <span className="hover:text-white transition-colors">ENVIO EXPRESSO EM ATÉ 24H</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#e8b600] font-bold tracking-[0.18em]">
            <span className="w-1.5 h-1.5 bg-[#e8b600] rotate-45" />
            <span>MARMOT // EST. 2024</span>
          </div>
        </div>
      </div>
    </section>
  );
};

