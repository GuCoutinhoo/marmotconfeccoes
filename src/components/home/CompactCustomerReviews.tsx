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
      className="
        relative
        w-full
        overflow-hidden
        border-b
        border-zinc-200/90
        bg-white
        py-8
        text-[#0B0B0E]
        sm:py-10
        lg:py-12
      "
    >
      <div className="mx-auto max-w-[1820px] px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div
          className="
            mb-8
            flex
            flex-col
            justify-between
            gap-6
            lg:mb-10
            lg:flex-row
            lg:items-end
          "
        >
          {/* ESQUERDA */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:gap-7">

            <div>
              <span
                className="
                  mb-1.5
                  block
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.32em]
                  text-black
                  sm:text-[11px]
                "
              >
                MARMOT
              </span>

              <h2
                className="
                  font-anton
                  text-[38px]
                  font-normal
                  uppercase
                  leading-[0.92]
                  tracking-tight
                  text-black
                  sm:text-[46px]
                  lg:text-[52px]
                  xl:text-[56px]
                "
              >
                AVALIAÇÕES DE COMPRADORES
              </h2>
            </div>

            {/* DIVISOR */}
            <div className="hidden h-[52px] w-px bg-zinc-300 md:block" />

            {/* TEXTO DE APOIO */}
            <div className="max-w-[330px] pb-[2px]">
              <span
                className="
                  mb-1
                  block
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-black
                  sm:text-[11px]
                "
              >
                EXPERIÊNCIA REAL
              </span>

              <p className="text-[12px] leading-[1.45] text-zinc-500 sm:text-[12.5px]">
                Opiniões de quem comprou, vestiu e colocou as peças
                Marmot no dia a dia.
              </p>
            </div>
          </div>

          {/* SCORE */}
          <div
            className="
              flex
              shrink-0
              items-center
              gap-4
              self-start
              lg:self-end
            "
          >
            <div className="h-[44px] w-[2px] bg-[#F4C400]" />

            <strong
              className="
                font-anton
                text-[42px]
                font-normal
                leading-none
                tracking-tight
                text-black
              "
            >
              4.9
            </strong>

            <div>
              <div className="flex items-center gap-[2px]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="
                      h-[12px]
                      w-[12px]
                      fill-[#F4C400]
                      text-[#F4C400]
                    "
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              <div className="mt-1.5 flex items-center gap-1.5">
                <CheckCircle2
                  className="h-3 w-3 text-emerald-600"
                  strokeWidth={2}
                />

                <span
                  className="
                    font-mono
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.13em]
                    text-zinc-500
                    sm:text-[9px]
                  "
                >
                  +1.400 verificadas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-3
            lg:gap-5
          "
        >
          {reviews.map((review, index) => (
            <article
              key={review.id}
              className="
                group
                relative
                flex
                min-h-[235px]
                flex-col
                overflow-hidden
                rounded-[3px]
                border
                border-zinc-200/90
                bg-white
                p-5
                transition-all
                duration-300
                hover:border-zinc-300
                hover:shadow-[0_8px_24px_rgba(0,0,0,0.055)]
                sm:p-6
                lg:min-h-[250px]
              "
            >
              {/* AMARELO NO HOVER */}
              <span
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[3px]
                  w-0
                  bg-[#F4C400]
                  transition-all
                  duration-500
                  group-hover:w-full
                "
              />

              {/* TOP */}
              <div className="flex items-center justify-between gap-3">
                <span
                  className="
                    font-mono
                    text-[9px]
                    font-bold
                    tracking-[0.18em]
                    text-zinc-400
                  "
                >
                  {String(index + 1).padStart(2, '0')} —{' '}
                  {String(reviews.length).padStart(2, '0')}
                </span>

                {review.verified && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-[2px]
                      bg-[#F5F5F4]
                      px-2
                      py-1
                      font-mono
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-zinc-600
                    "
                  >
                    <CheckCircle2
                      className="h-3 w-3 text-emerald-600"
                      strokeWidth={2}
                    />

                    Verificada
                  </span>
                )}
              </div>

              {/* ESTRELAS */}
              <div className="mt-5 flex gap-[2px]">
                {Array.from({ length: review.rating }).map(
                  (_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="
                        h-[13px]
                        w-[13px]
                        fill-[#F4C400]
                        text-[#F4C400]
                      "
                      strokeWidth={1.6}
                    />
                  )
                )}
              </div>

              {/* REVIEW */}
              <blockquote
                className="
                  mt-4
                  max-w-[430px]
                  text-[13px]
                  font-medium
                  leading-[1.55]
                  tracking-[-0.01em]
                  text-zinc-800
                  sm:text-[14px]
                "
              >
                “{review.comment}”
              </blockquote>

              {/* BOTTOM */}
              <div className="mt-auto pt-6">
                <div
                  className="
                    flex
                    items-end
                    justify-between
                    gap-4
                    border-t
                    border-zinc-200
                    pt-4
                  "
                >
                  <div className="min-w-0">
                    <strong
                      className="
                        block
                        truncate
                        text-[10px]
                        font-black
                        uppercase
                        tracking-tight
                        text-black
                        sm:text-[11px]
                      "
                    >
                      {review.author}
                    </strong>

                    <span
                      className="
                        mt-1
                        block
                        font-mono
                        text-[8px]
                        uppercase
                        tracking-[0.12em]
                        text-zinc-400
                      "
                    >
                      {review.location}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* BOTTOM META */}
        <div
          className="
            mt-4
            flex
            items-center
            justify-between
            border-t
            border-zinc-200
            pt-3
          "
        >
          <span
            className="
              font-mono
              text-[8px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-zinc-400
            "
          >
            MARMOT / EXPERIÊNCIA REAL
          </span>

          <span
            className="
              hidden
              font-mono
              text-[8px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-zinc-400
              sm:block
            "
          >
            FEEDBACK DE COMPRADORES
          </span>
        </div>
      </div>
    </section>
  );
};