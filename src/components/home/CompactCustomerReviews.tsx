import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';

export const CompactCustomerReviews: React.FC = () => {
  const reviews = [
    {
      author: 'Lucas M. Vasconcelos',
      location: 'São Paulo - SP',
      verified: true,
      rating: 5,
      productName: 'T-Shirt Heavyweight 260g',
      comment: 'A malha dessa t-shirt é de outro patamar. Gola canelada grossa de 3cm que não deforma nem enrola após as lavagens.',
    },
    {
      author: 'Matheus B. Sampaio',
      location: 'Curitiba - PR',
      verified: true,
      rating: 5,
      productName: 'Hoodie Heavyweight 400g',
      comment: 'Esquenta de verdade no inverno do sul. O capuz fica estruturado e volumoso sem ficar caído nos ombros.',
    },
    {
      author: 'Gabriel F. Castro',
      location: 'Rio de Janeiro - RJ',
      verified: true,
      rating: 5,
      productName: 'Calça Cargo Tactical Ripstop',
      comment: 'Caimento impecável com tênis chunky. A modelagem baggy veste com a silhueta exata do lookbook.',
    },
  ];

  return (
    <section id="avaliacoes-compradores" className="relative w-full bg-[#F6F5F2] text-[#090909] select-none border-b border-black/[0.08]">
      {/* Transição Editorial Minimalista Marmot */}
      <div className="w-full pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10">
        <div className="mx-auto w-[calc(100%-32px)] max-w-[1494px] lg:w-[89.4%]">
          <div className="relative flex items-center justify-center">
            {/* Divisor horizontal fino e elegante */}
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-black/[0.13]" />
            </div>

            {/* Microtexto central com assinatura amarela Marmot */}
            <div className="relative z-10 flex items-center gap-2.5 bg-[#F6F5F2] px-5 py-1">
              <span className="h-[3px] w-[10px] bg-[#F6C800] shrink-0" />
              <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.28em] text-black/75">
                MARMOT / EXPERIÊNCIA REAL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo das Avaliações */}
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1494px] pb-14 sm:pb-16 lg:pb-20 lg:w-[89.4%]">
        <div className="mb-6 sm:mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-[3px] w-[8px] bg-[#F6C800] inline-block" />
              <span className="font-mono text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.24em] text-black/55">
                PROVA SOCIAL // FEEDBACK REAL
              </span>
            </div>
            <h2 className="font-anton text-2xl sm:text-3xl lg:text-[34px] font-normal uppercase tracking-tight text-[#0B0B0E] leading-none">
              AVALIAÇÕES DE COMPRADORES
            </h2>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-black/60">
            <span className="font-bold text-[#0B0B0E]">4.9 / 5.0</span>
            <span>•</span>
            <span>+1.400 Avaliações Verificadas</span>
          </div>
        </div>

        {/* Compact Review Cards Grid */}
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-3 lg:gap-5">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-[2px] border border-black/[0.08] bg-white p-5 transition-all duration-200 hover:border-black/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-black">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current text-black" />
                  ))}
                </div>

                {rev.verified && (
                  <span className="inline-flex items-center gap-1 rounded-[1px] bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] font-bold text-black/75">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Compra Verificada
                  </span>
                )}
              </div>

              <p className="text-xs italic leading-relaxed text-black/80 sm:text-[13px]">
                "{rev.comment}"
              </p>

              <div className="flex items-center justify-between border-t border-black/[0.06] pt-3 text-[11px]">
                <div>
                  <span className="block font-bold text-black">{rev.author}</span>
                  <span className="font-mono text-[10px] text-black/40">{rev.location}</span>
                </div>
                <span className="max-w-[150px] truncate font-mono text-[10px] text-black/55 text-right">
                  {rev.productName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
