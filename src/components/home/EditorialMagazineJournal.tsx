import React from 'react';
import { ArrowRight } from 'lucide-react';
import drop3Webp from '../../assets/drop-3.webp';
import drop3Png from '../../assets/drop-3.png';
import look1Webp from '../../assets/look-1.webp';
import look1Png from '../../assets/look-1.png';
import look2Webp from '../../assets/look-2.webp';
import look2Png from '../../assets/look-2.png';

interface EditorialMagazineJournalProps {
  onNavigate: (page: string, param?: string) => void;
}

export const EditorialMagazineJournal: React.FC<EditorialMagazineJournalProps> = ({ onNavigate }) => {
  return (
    <section
      id="editorial-lookbook"
      className="py-6 sm:py-10 lg:py-14 bg-[#ffffff] select-none"
    >
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-4 sm:space-y-6">
        {/* =========================================================================
            1. BANNER PRINCIPAL: DROP 03 (BUILT FOR THE STREETS)
           ========================================================================= */}
        <div
          onClick={() => onNavigate('shop')}
          className="relative group cursor-pointer overflow-hidden rounded-[2px] bg-[#111216] aspect-[1916/821] w-full min-h-[220px] sm:min-h-[340px] md:min-h-[460px] lg:min-h-[560px] transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <picture className="w-full h-full block">
            <source srcSet={drop3Webp} type="image/webp" />
            <source srcSet="/drop-3.webp" type="image/webp" />
            <img
              src={drop3Png}
              alt="Drop 03 - Built for the Streets"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback1) {
                  target.dataset.triedFallback1 = 'true';
                  target.src = '/drop-3.png';
                } else if (!target.dataset.triedFallback2) {
                  target.dataset.triedFallback2 = 'true';
                  target.src = '/drop 3.png';
                }
              }}
              className="w-full h-full object-cover object-center block select-none group-hover:scale-[1.006] transition-transform duration-500"
            />
          </picture>

          {/* Botão EXPLORAR O DROP - posicionado precisamente abaixo do texto conforme drop modelo.png */}
          <div
            className="absolute left-[7.8%] top-[61.5%] z-10"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('shop');
            }}
          >
            <button
              type="button"
              className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-6 md:px-8 py-1.5 sm:py-2.5 md:py-3.5 bg-black/80 hover:bg-white text-white hover:text-black border border-white/60 hover:border-white text-[10px] sm:text-xs md:text-sm font-mono font-medium uppercase tracking-[0.16em] sm:tracking-[0.2em] transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-sm group/btn rounded-[1px]"
            >
              <span>EXPLORAR O DROP</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. GRID INFERIOR: LOOK 01 & LOOK 02
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* LOOK 01: OVERSIZED ESSENTIALS */}
          <div
            onClick={() => onNavigate('shop')}
            className="relative group cursor-pointer overflow-hidden rounded-[2px] bg-[#111216] aspect-[1672/941] w-full min-h-[190px] sm:min-h-[260px] md:min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <picture className="w-full h-full block">
              <source srcSet={look1Webp} type="image/webp" />
              <source srcSet="/look-1.webp" type="image/webp" />
              <img
                src={look1Png}
                alt="Look 01 - Oversized Essentials"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback1) {
                    target.dataset.triedFallback1 = 'true';
                    target.src = '/look-1.png';
                  } else if (!target.dataset.triedFallback2) {
                    target.dataset.triedFallback2 = 'true';
                    target.src = '/look 1.png';
                  }
                }}
                className="w-full h-full object-cover object-center block select-none group-hover:scale-[1.006] transition-transform duration-500"
              />
            </picture>

            {/* Botão EXPLORAR - posicionado precisamente abaixo do texto de Look 01 */}
            <div
              className="absolute left-[6.3%] top-[76%] z-10"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('shop');
              }}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 md:px-7 py-1.5 sm:py-2.5 md:py-3 bg-black/80 hover:bg-white text-white hover:text-black border border-white/60 hover:border-white text-[10px] sm:text-xs md:text-sm font-mono font-medium uppercase tracking-[0.16em] sm:tracking-[0.2em] transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-sm group/btn rounded-[1px]"
              >
                <span>EXPLORAR</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>

          {/* LOOK 02: UTILITY SERIES */}
          <div
            onClick={() => onNavigate('shop')}
            className="relative group cursor-pointer overflow-hidden rounded-[2px] bg-[#111216] aspect-[1672/941] w-full min-h-[190px] sm:min-h-[260px] md:min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <picture className="w-full h-full block">
              <source srcSet={look2Webp} type="image/webp" />
              <source srcSet="/look-2.webp" type="image/webp" />
              <img
                src={look2Png}
                alt="Look 02 - Utility Series"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback1) {
                    target.dataset.triedFallback1 = 'true';
                    target.src = '/look-2.png';
                  } else if (!target.dataset.triedFallback2) {
                    target.dataset.triedFallback2 = 'true';
                    target.src = '/look 2.png';
                  }
                }}
                className="w-full h-full object-cover object-center block select-none group-hover:scale-[1.006] transition-transform duration-500"
              />
            </picture>

            {/* Botão EXPLORAR - posicionado precisamente abaixo do texto de Look 02 */}
            <div
              className="absolute left-[6.0%] top-[76%] z-10"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('shop');
              }}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 md:px-7 py-1.5 sm:py-2.5 md:py-3 bg-black/80 hover:bg-white text-white hover:text-black border border-white/60 hover:border-white text-[10px] sm:text-xs md:text-sm font-mono font-medium uppercase tracking-[0.16em] sm:tracking-[0.2em] transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-sm group/btn rounded-[1px]"
              >
                <span>EXPLORAR</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
