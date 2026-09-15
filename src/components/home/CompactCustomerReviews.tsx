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
    <section className="py-10 sm:py-12 lg:py-14 bg-[#FAFAFA] border-b border-zinc-200/90 select-none">
      <div className="w-full px-7 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
              <span className="text-[10px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-500">
                PROVA SOCIAL // FEEDBACK REAL
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-[#0B0B0E] leading-none">
              AVALIAÇÕES DE COMPRADORES
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span className="text-[#0B0B0E] font-bold">4.9 / 5.0</span>
            <span>•</span>
            <span>+1.400 Avaliações Verificadas</span>
          </div>
        </div>

        {/* Compact Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white border border-zinc-200/90 p-5 rounded-[2px] space-y-3 hover:border-zinc-400 transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex text-zinc-900 gap-0.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current text-[#0B0B0E]" />
                  ))}
                </div>

                {rev.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-[2px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Compra Verificada
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-[13px] text-zinc-800 leading-relaxed italic">
                "{rev.comment}"
              </p>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-[#0B0B0E] block">{rev.author}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{rev.location}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono text-right max-w-[150px] truncate">
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
