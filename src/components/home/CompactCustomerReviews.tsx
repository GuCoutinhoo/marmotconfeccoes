import React from 'react';
import {
  CheckCircle2,
  Star,
} from 'lucide-react';

type Review = {
  id: string;
  author: string;
  location: string;
  verified: boolean;
  rating: number;
  productName: string;
  comment: string;
};

const reviews: Review[] = [
  {
    id: 'review-01',
    author: 'Lucas M. Vasconcelos',
    location: 'São Paulo - SP',
    verified: true,
    rating: 5,
    productName: 'T-Shirt Heavyweight 260g',
    comment:
      'A malha dessa t-shirt é de outro patamar. Gola canelada grossa de 3cm que não deforma nem enrola após as lavagens.',
  },
  {
    id: 'review-02',
    author: 'Matheus B. Sampaio',
    location: 'Curitiba - PR',
    verified: true,
    rating: 5,
    productName: 'Hoodie Heavyweight 400g',
    comment:
      'Esquenta de verdade no inverno do sul. O capuz fica estruturado e volumoso sem ficar caído nos ombros.',
  },
  {
    id: 'review-03',
    author: 'Gabriel F. Castro',
    location: 'Rio de Janeiro - RJ',
    verified: true,
    rating: 5,
    productName: 'Calça Cargo Tactical Ripstop',
    comment:
      'Caimento impecável com tênis chunky. A modelagem baggy veste com a silhueta exata do lookbook.',
  },
];

export const CompactCustomerReviews: React.FC = () => {
  return (
    <section
      id="avaliacoes-compradores"
      className="bg-[#FAFAFA] select-none relative w-full overflow-hidden border-b border-zinc-200/80 pt-7 sm:pt-9 pb-7 sm:pb-9 text-zinc-900"
    >
      <div className="mx-auto max-w-[1840px] px-4 sm:px-6 lg:px-8">
        {/* HEADER UNIFICADO */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-7">
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.24em] text-zinc-400">
                PROVA SOCIAL
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4C400]" />
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                EXPERIÊNCIA REAL
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-[-0.03em] uppercase text-zinc-950 leading-none">
              AVALIAÇÕES DE COMPRADORES
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-500 font-normal mt-1.5">
              Opiniões de quem comprou, vestiu e testou as peças Marmot no dia a dia.
            </p>
          </div>

          {/* SCORE RESUMIDO */}
          <div className="flex items-center gap-3 self-start sm:self-end bg-white px-3.5 py-2 rounded-[3px] border border-zinc-200/90 shadow-2xs">
            <span className="text-2xl sm:text-3xl font-extrabold leading-none tracking-tight text-zinc-950">
              4.9
            </span>

            <div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-3 w-3 fill-[#F4C400] text-[#F4C400]"
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              <div className="mt-1 flex items-center gap-1">
                <CheckCircle2
                  className="h-3 w-3 text-emerald-600"
                  strokeWidth={2}
                />
                <span className="text-[9.5px] font-semibold text-zinc-500 tracking-wide uppercase">
                  +1.400 verificadas
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* CARDS DE AVALIAÇÃO */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
          {reviews.map((review, index) => (
            <article
              key={review.id}
              className="group relative flex min-h-[195px] flex-col overflow-hidden rounded-[3px] border border-zinc-200/90 bg-white p-5 transition-all duration-300 hover:border-zinc-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] lg:min-h-[210px]"
            >
              {/* TOP */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-zinc-400">
                  {String(index + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}
                </span>

                {review.verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-zinc-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-600 border border-zinc-200/60">
                    <CheckCircle2
                      className="h-2.5 w-2.5 text-emerald-600"
                      strokeWidth={2.2}
                    />
                    Verificada
                  </span>
                )}
              </div>

              {/* ESTRELAS E PRODUTO */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-3 w-3 fill-[#F4C400] text-[#F4C400]"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>

                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate max-w-[180px]">
                  {review.productName}
                </span>
              </div>

              {/* COMENTÁRIO */}
              <blockquote className="text-[13px] sm:text-[13.5px] font-normal leading-relaxed text-zinc-700 mb-4">
                "{review.comment}"
              </blockquote>

              {/* AUTOR */}
              <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <strong className="block text-[11px] font-bold uppercase tracking-wide text-zinc-900">
                    {review.author}
                  </strong>
                  <span className="block text-[9.5px] text-zinc-400 uppercase tracking-wider mt-0.5">
                    {review.location}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};