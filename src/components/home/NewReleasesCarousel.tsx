import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface NewReleasesCarouselProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

interface DropProductItem {
  id: string;
  slug: string;
  title: string;
  categoryName: 'VESTUÁRIO' | 'ACESSÓRIOS';
  price: number;
  installments: string;
  pixPrice: string;
  image: string;
  colors: { name: string; hex: string }[];
  colorCountText: string;
}

// Exact 5 items featured in the drop with coherent product photography
const CANONICAL_DROP_ITEMS: DropProductItem[] = [
  {
    id: 'drop-camiseta-atelie-mountain',
    slug: 'camiseta-atelie-mountain',
    title: 'Camiseta Ateliê Mountain',
    categoryName: 'VESTUÁRIO',
    price: 149.90,
    installments: 'ou 3x de R$ 49,97 sem juros',
    pixPrice: 'R$ 142,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Off-White', hex: '#EAE5D9' },
      { name: 'Preto', hex: '#18181B' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'drop-bone-5-panel-washed',
    slug: 'bone-5-panel-washed',
    title: 'Boné 5 Panel Washed',
    categoryName: 'ACESSÓRIOS',
    price: 149.90,
    installments: 'ou 3x de R$ 49,97 sem juros',
    pixPrice: 'R$ 142,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Preto Washed', hex: '#232326' },
      { name: 'Grafite', hex: '#4B4B52' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'drop-camiseta-good-days',
    slug: 'camiseta-good-days',
    title: 'Camiseta Good Days',
    categoryName: 'VESTUÁRIO',
    price: 129.90,
    installments: 'ou 3x de R$ 43,30 sem juros',
    pixPrice: 'R$ 123,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Preto', hex: '#18181B' },
      { name: 'Carvão', hex: '#37373C' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'drop-bucket-hat-explore',
    slug: 'bucket-hat-explore',
    title: 'Bucket Hat Explore',
    categoryName: 'ACESSÓRIOS',
    price: 159.90,
    installments: 'ou 3x de R$ 53,30 sem juros',
    pixPrice: 'R$ 151,91 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Areia Washed', hex: '#D7CDBB' },
      { name: 'Verde Musgo', hex: '#44483D' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'drop-shoulder-bag-urban',
    slug: 'shoulder-bag-urban',
    title: 'Shoulder Bag Urban',
    categoryName: 'ACESSÓRIOS',
    price: 189.90,
    installments: 'ou 3x de R$ 63,30 sem juros',
    pixPrice: 'R$ 180,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Preto', hex: '#18181B' },
      { name: 'Grafite', hex: '#3B3B42' },
    ],
    colorCountText: '2 cores',
  },
];

export const NewReleasesCarousel: React.FC<NewReleasesCarouselProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  // Scroll progress for the section relative to viewport:
  // "start end": when section top touches viewport bottom (progress = 0)
  // "end start": when section bottom leaves viewport top (progress = 1)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Ultra-smooth, gradual scroll-driven background transition
  // The smoothstep cubic ease eliminates any sharp snapping or sudden opacity jumps
  const bgOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    [0, 1, 1, 0],
    {
      ease: (t) => t * t * (3 - 2 * t),
    }
  );

  // Trigger content entrance animations whenever entering the section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setHasEntered(entry.isIntersecting);
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardEl = scrollRef.current.querySelector('article');
      const scrollAmount = cardEl ? cardEl.clientWidth + 24 : 380;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Convert a DropProductItem into a full Product object for compatibility
  const toFullProduct = (item: DropProductItem): Product => {
    const existing = products.find((p) => p.slug === item.slug || p.title.toLowerCase() === item.title.toLowerCase());
    if (existing) return existing;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: 'Edição limitada DROP 003',
      description: 'Peça exclusiva da tiragem limitada DROP 003. Confeccionada com corte streetwear premium e acabamento de ateliê.',
      price: item.price,
      category: item.categoryName === 'VESTUÁRIO' ? 'camisetas' : 'acessorios',
      subcategory: item.categoryName === 'VESTUÁRIO' ? 'Camisetas' : 'Acessórios',
      collection: 'DROP / 003',
      tags: ['Lançamento', 'Drop 003', 'Edição Limitada', item.categoryName],
      rating: 4.9,
      reviewCount: 14,
      stockCount: 8,
      sku: `MM-DRP-${item.slug.slice(0, 8).toUpperCase()}`,
      sizes: item.categoryName === 'VESTUÁRIO' ? ['P', 'M', 'G', 'GG'] : ['ÚNICO'],
      colors: item.colors.map((c) => ({
        color: c.name,
        colorName: c.name,
        colorHex: c.hex,
      })),
      image: item.image,
      images: [item.image],
      details: [
        'Modelagem streetwear oversized com caimento estruturado',
        'Tecido pré-encolhido com toque aveludado',
        'Estampa e bordado de alta densidade direto do ateliê',
        'Tiragem exclusiva e limitada numerada',
      ],
      careInstructions: [
        'Lavar à máquina em ciclo delicado',
        'Não utilizar alvejante',
        'Secar à sombra para preservar a pigmentação',
      ],
      isNewRelease: true,
    };
  };

  const handleCardClick = (item: DropProductItem) => {
    const fullProd = toFullProduct(item);
    const matched = products.find((p) => p.slug === item.slug || p.id === item.id);
    if (matched) {
      onNavigate('product', matched.id);
    } else {
      onQuickView(fullProd);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent, item: DropProductItem) => {
    e.stopPropagation();
    const fullProd = toFullProduct(item);
    toggleWishlist(fullProd);
    const inWish = isInWishlist(fullProd.id);
    showToast(
      inWish ? 'Item removido dos favoritos' : 'Item salvo nos favoritos!',
      inWish ? 'info' : 'success'
    );
  };

  return (
    <section
      ref={sectionRef}
      id="ultimos-lancamentos-drop"
      className="relative w-full overflow-hidden pt-8 sm:pt-10 md:pt-12 pb-7 sm:pb-8 md:pb-9 select-none bg-[#09090B]"
    >
      {/* =========================================================================
          CAMADA 1: FUNDO ESCURO EDITORIAL
          CAMADA 2: IMAGEM ORIGINAL "categoria design" COM TRANSIÇÃO SUAVE DE ESCURECIMENTO
         ========================================================================= */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out bg-[#080808] flex items-center justify-center"
        aria-hidden="true"
      >
        <img
          src="/categoria-design-original.png"
          alt=""
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.triedFallback) {
              target.dataset.triedFallback = 'true';
              target.src = '/categoria design v4.original.png';
            }
          }}
          className="w-full h-full object-cover object-center select-none"
        />
      </motion.div>

      {/* =========================================================================
          CAMADA 3: CONTEÚDO DA SEÇÃO
         ========================================================================= */}
      <div className="relative z-10 w-full max-w-[1640px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
        {/* CABEÇALHO REFINADO COM COMPOSIÇÃO EQUILIBRADA */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div className="max-w-2xl">
            {/* Tag DIRETO DO ATELIÊ com estrela técnica */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={hasEntered ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.24em] text-[#FF6B00] mb-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#FF6B00] shrink-0">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
              <span>DIRETO DO ATELIÊ</span>
            </motion.div>

            {/* Título Principal */}
            <motion.h2
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={
                hasEntered
                  ? {
                      opacity: 1,
                      y: [12, -2, 0],
                    }
                  : shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 12 }
              }
              transition={{
                duration: 0.55,
                delay: 0.1,
                times: [0, 0.65, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[42px] font-black uppercase tracking-[-0.02em] text-white leading-none whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
            >
              ÚLTIMOS LANÇAMENTOS
            </motion.h2>

            {/* Subtítulo com tipografia editorial */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={hasEntered ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="text-zinc-400 text-xs sm:text-sm font-normal tracking-wide mt-2 max-w-lg leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            >
              Peças recém-saídas da confecção com estoques limitados e tiragem exclusiva.
            </motion.p>
          </div>

          {/* Bloco à direita: DROP / 003, Linha, VER TODOS e Navegação */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
            animate={hasEntered ? { opacity: 1, x: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            className="flex items-center self-start lg:self-end gap-3 sm:gap-4 flex-wrap pb-1"
          >
            <div className="flex items-center">
              <span className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.22em] text-zinc-300">
                DROP / 003
              </span>
              <span className="w-5 sm:w-8 h-px mx-3 sm:mx-4 inline-block bg-white/25" />
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="text-[#FF6B00] hover:text-[#FFA040] font-black text-xs sm:text-[13px] tracking-[0.16em] uppercase flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>VER TODOS</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
            </div>

            {/* Setas de Navegação */}
            <div className="flex items-center gap-2 ml-1 sm:ml-2">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-none bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/20 hover:border-[#FF6B00]/70 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md backdrop-blur-sm"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4.5 h-4.5 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-none bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/20 hover:border-[#FF6B00]/70 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md backdrop-blur-sm"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4.5 h-4.5 stroke-[2]" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            CAROUSEL ROW: 3 CARDS COMPLETOS + PEEK INTENCIONAL DO PRÓXIMO CARD
           ========================================================================= */}
        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 md:gap-6 overflow-x-auto scrollbar-none pb-3 pt-1 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {CANONICAL_DROP_ITEMS.map((item, index) => {
            const isFav = isInWishlist(item.id);
            return (
              <motion.article
                key={item.id}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 20, scale: 0.985 }
                }
                animate={
                  hasEntered
                    ? { opacity: 1, y: 0, scale: 1 }
                    : shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 20, scale: 0.985 }
                }
                transition={{
                  duration: 0.5,
                  delay: 0.25 + index * 0.05,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="group relative w-[285px] sm:w-[325px] md:w-[355px] lg:w-[370px] xl:w-[385px] shrink-0 snap-start bg-white rounded-none overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-zinc-200/90 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_48px_rgba(0,0,0,0.5)] cursor-pointer"
                onClick={() => handleCardClick(item)}
              >
                {/* Área da Fotografia do Produto */}
                <div className="relative aspect-[4/4.1] w-full bg-[#F3F4F6] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />

                  {/* NOVO DROP Badge refinado */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="bg-black/90 backdrop-blur-md text-white text-[9px] sm:text-[9.5px] font-mono font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-none shadow-sm inline-block border border-white/10">
                      NOVO DROP
                    </span>
                  </div>

                  {/* Botão de Favorito Minimalista */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistClick(e, item)}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-black/5 flex items-center justify-center text-zinc-700 hover:text-red-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isFav ? 'fill-red-500 text-red-500' : 'text-zinc-700 stroke-[2]'
                      }`}
                    />
                  </button>
                </div>

                {/* Corpo do Card com Espaçamento e Respiro */}
                <div className="p-4 sm:p-5 flex flex-col justify-between bg-white text-zinc-900 flex-1">
                  <div>
                    {/* Categoria */}
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-zinc-400 mb-1">
                      {item.categoryName}
                    </span>

                    {/* Título do Produto */}
                    <h3 className="text-[15px] sm:text-[16px] font-black text-zinc-950 tracking-[-0.01em] leading-snug line-clamp-1 group-hover:text-[#FF6B00] transition-colors">
                      {item.title}
                    </h3>

                    {/* Divisor Delicado com Acento Laranja */}
                    <div className="relative w-full h-px bg-zinc-200/80 my-3">
                      <span className="absolute left-0 top-0 h-px w-8 bg-[#FF6B00] transition-all duration-300 group-hover:w-16" />
                    </div>

                    {/* Bloco de Preços */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[17px] sm:text-[18px] font-black text-zinc-950 tracking-tight">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-[11px] sm:text-[11.5px] text-zinc-500 font-medium">
                        {item.installments}
                      </div>
                      <div className="text-[11px] sm:text-[11.5px] font-black text-[#E65100]">
                        {item.pixPrice}
                      </div>
                    </div>
                  </div>

                  {/* Cores e Contagem */}
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      {item.colors.map((c, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: c.hex }}
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs inline-block"
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="text-[10.5px] sm:text-[11px] text-zinc-400 font-mono font-medium">
                      {item.colorCountText}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* =========================================================================
            RODAPÉ VISUAL COMPACTO DA SEÇÃO
           ========================================================================= */}
        <div className="relative pt-4 sm:pt-5 mt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/15 pt-3 sm:pt-4">
            {/* Bottom-Left Branding: MARMOT EST. 2018 */}
            <div className="flex flex-col text-left">
              <span className="font-black tracking-[0.25em] text-xs uppercase text-zinc-300">
                MARMOT
              </span>
              <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
                EST. 2018
              </span>
            </div>

            {/* Bottom-Right Motto: —— EXPLORAR   VESTIR   PERTENCER */}
            <div className="flex items-center gap-3 text-[10px] sm:text-xs tracking-[0.25em] font-mono uppercase text-zinc-400">
              <span className="w-8 sm:w-12 h-px bg-zinc-500/50 inline-block" />
              <span>EXPLORAR</span>
              <span>VESTIR</span>
              <span>PERTENCER</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
