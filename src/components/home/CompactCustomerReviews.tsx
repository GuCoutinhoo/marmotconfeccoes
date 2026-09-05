import React from 'react';
import { Star, CheckCircle2, MessageSquareQuote } from 'lucide-react';

export const CompactCustomerReviews: React.FC = () => {
  const reviews = [
    {
      author: 'Lucas M. Vasconcelos',
      location: 'São Paulo - SP',
      verified: true,
      rating: 5,
      productName: 'T-Shirt Oversized Heavyweight 260g',
      comment: 'A malha dessa t-shirt é surreal. Gola canelada grossa de 3cm que não deforma nem enrola após as lavagens.',
    },
    {
      author: 'Matheus B. Sampaio',
      location: 'Curitiba - PR',
      verified: true,
      rating: 5,
      productName: 'Hoodie Heavyweight 400g Marmot Black',
      comment: 'Esquenta de verdade no inverno do sul. O capuz fica estruturado e volumoso sem ficar caído nos ombros.',
    },
    {
      author: 'Gabriel F. Castro',
      location: 'Rio de Janeiro - RJ',
      verified: true,
      rating: 5,
      productName: 'Calça Cargo Tactical Ripstop Black',
      comment: 'Caimento impecável com tênis chunky. A barra com regulador em cordão permite usar solta ou estilo jogger.',
    },
  ];

  return (
    <section className="py-16 bg-[#F8F9FA] border-b border-[#E4E4E7]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309] mb-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>PROVA SOCIAL REAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#18181B]">
              AVALIAÇÕES DE COMPRADORES
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#71717A] font-mono">
            <span className="text-[#B45309] font-bold">4.9 / 5.0</span>
            <span>•</span>
            <span>+1.400 Avaliações Verificadas</span>
          </div>
        </div>

        {/* Compact Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 xl:gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E4E4E7] p-6 rounded-2xl space-y-3 hover:border-[#18181B] transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex text-[#B45309] gap-0.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                {rev.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#B45309]">
                    <CheckCircle2 className="w-3 h-3" /> Compra Verificada
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#18181B] leading-relaxed italic">
                "{rev.comment}"
              </p>

              <div className="pt-3 border-t border-[#E4E4E7] flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-[#18181B] block">{rev.author}</span>
                  <span className="text-[10px] text-[#71717A]">{rev.location}</span>
                </div>
                <span className="text-[10px] text-[#52525B] font-mono text-right max-w-[150px] truncate">
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
