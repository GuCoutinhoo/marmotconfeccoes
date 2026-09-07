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

// Exact 5 items featured in the reference image
const CANONICAL_DROP_ITEMS: DropProductItem[] = [
  {
    id: 'drop-camiseta-atelie-mountain',
    slug: 'camiseta-atelie-mountain',
    title: 'Camiseta Ateliê Mountain',
    categoryName: 'VESTUÁRIO',
    price: 149.90,
    installments: 'ou 3x de R$ 49,97 sem juros',
    pixPrice: 'R$ 142,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
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

  // Trigger content entrance animations at 15% - 25% intersection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasEntered(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.72;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
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
      className="relative w-full overflow-hidden min-h-[clamp(540px,42.85vw,860px)] flex flex-col justify-between pt-7 sm:pt-8 md:pt-9 pb-8 sm:pb-9 md:pb-10 select-none bg-[#FAFAFA]"
    >
      {/* =========================================================================
          CAMADA 1: FUNDO CLARO ORIGINAL DA PÁGINA (bg-[#FAFAFA])
          CAMADA 2: IMAGEM "categoria design v4" (DE PONTA A PONTA, SEM CORTES)
         ========================================================================= */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out bg-[#080808] flex items-center justify-center"
        aria-hidden="true"
      >
        <img
          src="/categoria design v4.png"
          alt=""
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.triedFallback) {
              target.dataset.triedFallback = 'true';
              target.src = '/categoria-design-v4.png';
            }
          }}
          className="w-full h-full object-cover object-center select-none"
        />
      </motion.div>

      {/* =========================================================================
          CAMADA 3: CONTEÚDO DA SEÇÃO ACIMA DA IMAGEM
         ========================================================================= */}
      <div className="relative z-10 w-full max-w-[1780px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* CABEÇALHO: DIRETO DO ATELIÊ, ÚLTIMOS LANÇAMENTOS + FOGO AO LADO */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div className="max-w-3xl">
            {/* Step 1 in Entrance: "DIRETO DO ATELIÊ" with Orange Spark */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={hasEntered ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex items-center gap-2 text-xs sm:text-[13px] font-black uppercase tracking-[0.22em] text-[#FF6B00] mb-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#FF6B00] shrink-0">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
              <span>DIRETO DO ATELIÊ</span>
            </motion.div>

            {/* Step 2 in Entrance: "ÚLTIMOS LANÇAMENTOS" */}
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
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] xl:text-[46px] font-black uppercase tracking-[-0.02em] text-white leading-none whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]"
            >
              ÚLTIMOS LANÇAMENTOS
            </motion.h2>

            {/* Step 3 in Entrance: Editorial Subtitle */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={hasEntered ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="text-zinc-300 text-xs sm:text-sm md:text-[14px] font-normal tracking-normal mt-2 max-w-xl leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
            >
              Peças recém-saídas da confecção com estoques limitados e tiragem exclusiva.
            </motion.p>
          </div>

          {/* Top Right Controls: DROP / 003, Divider, VER TODOS -> and Nav Arrows */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
            animate={hasEntered ? { opacity: 1, x: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            className="flex items-center self-start lg:self-end gap-3 sm:gap-4 flex-wrap"
          >
            <div className="flex items-center">
              <span className="font-mono text-xs sm:text-[13px] font-bold tracking-[0.2em] text-zinc-300">
                DROP / 003
              </span>
              <span className="w-7 sm:w-10 h-px mx-3 sm:mx-4 inline-block bg-white/30" />
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="text-[#FF6B00] hover:text-[#FFA040] font-black text-xs sm:text-[13px] tracking-[0.16em] uppercase flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>VER TODOS</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
            </div>

            {/* Carousel Arrow Buttons */}
            <div className="flex items-center gap-2 ml-1.5 sm:ml-3">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-md bg-[#13141A]/90 hover:bg-black text-zinc-300 hover:text-white border border-white/20 hover:border-[#FF6B00]/70 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4.5 h-4.5 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-md bg-[#13141A]/90 hover:bg-black text-zinc-300 hover:text-white border border-white/20 hover:border-[#FF6B00]/70 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4.5 h-4.5 stroke-[2]" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            CAROUSEL ROW: LIGHT CARDS CONTRASTING ON BACKGROUND
           ========================================================================= */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {CANONICAL_DROP_ITEMS.map((item, index) => {
            const isFav = isInWishlist(item.id);
            return (
              <motion.article
                key={item.id}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 25, scale: 0.985 }
                }
                animate={
                  hasEntered
                    ? { opacity: 1, y: 0, scale: 1 }
                    : shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 25, scale: 0.985 }
                }
                transition={{
                  duration: 0.5,
                  delay: 0.3 + index * 0.06,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="group relative w-[240px] sm:w-[260px] md:w-[280px] lg:w-[295px] shrink-0 snap-start bg-white rounded-none overflow-hidden shadow-2xl border border-zinc-200/80 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] cursor-pointer"
                onClick={() => handleCardClick(item)}
              >
                {/* Product Image Area */}
                <div className="relative aspect-[4/3.8] w-full bg-[#EBECEF] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* NOVO DROP Badge on Top-Left */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="bg-black/95 text-white text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none shadow-sm inline-block">
                      NOVO DROP
                    </span>
                  </div>

                  {/* Wishlist Heart Button on Top-Right */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistClick(e, item)}
                    className="absolute top-2.5 right-2.5 z-20 w-7.5 h-7.5 rounded-full bg-white/95 shadow-md flex items-center justify-center text-zinc-700 hover:text-red-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isFav ? 'fill-red-500 text-red-500' : 'text-zinc-700 stroke-[2]'
                      }`}
                    />
                  </button>
                </div>

                {/* Card White Body */}
                <div className="p-3.5 sm:p-4 flex flex-col justify-between bg-white text-zinc-900">
                  <div>
                    {/* Category Label */}
                    <span className="block text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-zinc-400 mb-1">
                      {item.categoryName}
                    </span>

                    {/* Title */}
                    <h3 className="text-[14px] sm:text-[15px] font-black text-zinc-950 tracking-tight leading-tight line-clamp-1">
                      {item.title}
                    </h3>

                    {/* Subtle Horizontal Divider with Orange Accent Bar on the Left */}
                    <div className="relative w-full h-px bg-zinc-200 my-2.5 sm:my-3">
                      <span className="absolute left-0 top-0 h-px w-7 bg-[#FF6B00] transition-all duration-300 group-hover:w-12" />
                    </div>

                    {/* Pricing Block */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[16px] sm:text-[17px] font-black text-zinc-950 tracking-tight">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-[10.5px] sm:text-[11px] text-zinc-500 font-medium">
                        {item.installments}
                      </div>
                      <div className="text-[10.5px] sm:text-[11px] font-black text-[#E65100]">
                        {item.pixPrice}
                      </div>
                    </div>
                  </div>

                  {/* Swatches & Color Count */}
                  <div className="flex items-center gap-1.5 mt-2.5 sm:mt-3 pt-2 border-t border-zinc-100">
                    <div className="flex items-center gap-1">
                      {item.colors.map((c, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: c.hex }}
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs inline-block"
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="text-[10.5px] text-zinc-500 font-medium ml-1">
                      {item.colorCountText}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* =========================================================================
            BOTTOM BRANDING
           ========================================================================= */}
        <div className="relative pt-4 sm:pt-5 mt-1">
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
