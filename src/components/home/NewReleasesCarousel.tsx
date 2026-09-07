import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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

// Exact curated items featured in the drop with coherent product photography
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
    id: 'drop-moletom-box-hoodie',
    slug: 'moletom-box-hoodie',
    title: 'Moletom Box Heavy Hoodie',
    categoryName: 'VESTUÁRIO',
    price: 289.90,
    installments: 'ou 3x de R$ 96,63 sem juros',
    pixPrice: 'R$ 275,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Chumbo Washed', hex: '#2B2B30' },
      { name: 'Off-Black', hex: '#18181A' },
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
  {
    id: 'drop-calca-cargo-ripstop',
    slug: 'calca-cargo-tactical',
    title: 'Calça Cargo Tactical Ripstop',
    categoryName: 'VESTUÁRIO',
    price: 279.90,
    installments: 'ou 3x de R$ 93,30 sem juros',
    pixPrice: 'R$ 265,91 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Preto', hex: '#18181B' },
      { name: 'Oliva Militar', hex: '#3E4238' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'drop-corta-vento-utility',
    slug: 'corta-vento-anorak-utility',
    title: 'Corta-Vento Anorak Utility',
    categoryName: 'VESTUÁRIO',
    price: 349.90,
    installments: 'ou 3x de R$ 116,63 sem juros',
    pixPrice: 'R$ 332,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Preto / Cinza', hex: '#212124' },
      { name: 'Gelo', hex: '#D6D6CE' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'drop-bone-dad-hat-corduroy',
    slug: 'bone-dad-hat-corduroy',
    title: 'Boné Dad Hat Corduroy',
    categoryName: 'ACESSÓRIOS',
    price: 139.90,
    installments: 'ou 3x de R$ 46,63 sem juros',
    pixPrice: 'R$ 132,91 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Marrom Tabaco', hex: '#4E3629' },
      { name: 'Verde Floresta', hex: '#26382B' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'drop-meia-crew-jacquard',
    slug: 'meia-crew-jacquard-2pack',
    title: 'Meia Crew Jacquard 2-Pack',
    categoryName: 'ACESSÓRIOS',
    price: 69.90,
    installments: 'ou 2x de R$ 34,95 sem juros',
    pixPrice: 'R$ 66,41 no PIX (5% OFF)',
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Off-White & Preto', hex: '#EBE8DE' },
    ],
    colorCountText: '1 opção',
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

  // Monitora a rolagem para disparar a animação APENAS quando o usuário descer (de cima do hero para baixo).
  // Quando estiver perto, a animação suave transiciona o fundo de branco para a imagem.
  // Quando rolar de baixo para cima, a seção e seus elementos permanecem visíveis sem re-animar.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let isScrollingDown = true;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) > 2) {
        isScrollingDown = diff > 0;
      }
      lastScrollY = currentScrollY;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      // 1. Reset silencioso: Se o usuário estiver acima da seção (no topo/Hero/Categorias)
      // e a seção estiver completamente abaixo da viewport (fora do campo visual)
      if (rect.top >= windowHeight) {
        setHasEntered(false);
        return;
      }

      // 2. Disparo da animação: Apenas ao rolar para BAIXO quando o topo da seção estiver perto da viewport
      if (isScrollingDown && rect.top <= windowHeight * 0.98 && rect.bottom >= 0) {
        setHasEntered(true);
        return;
      }

      // 3. Ao rolar para CIMA (de baixo para cima):
      // A seção NUNCA deve re-animar ou ficar invisível. Mantém-se visível em estado final.
      if (!isScrollingDown && rect.bottom >= 0 && rect.top < windowHeight) {
        setHasEntered(true);
      }
    };

    const initialScrollY = window.scrollY || window.pageYOffset || 0;
    const initialRect = el.getBoundingClientRect();
    const initialWindowHeight = window.innerHeight || document.documentElement.clientHeight;

    if (initialScrollY > 200 || (initialRect.top < initialWindowHeight * 0.85 && initialRect.bottom > 0)) {
      setHasEntered(true);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
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
      className="relative w-full overflow-hidden py-10 sm:py-12 md:py-14 lg:py-16 xl:py-20 select-none bg-[#09090B]"
    >
      {/* =========================================================================
          BACKGROUND ART: Imagem deslocada para cima conforme solicitado,
          revelando a frase "NEW DROP" por completo acima dos cards.
         ========================================================================= */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={
          hasEntered
            ? { opacity: 1 }
            : shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 0 }
        }
        transition={{
          duration: 1.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#09090B]"
        aria-hidden="true"
      >
        <img
          src="/lancamento-hero-v1.png"
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.triedFallback1) {
              target.dataset.triedFallback1 = 'true';
              target.src = '/lançamento hero v1.png';
            } else if (!target.dataset.triedFallback2) {
              target.dataset.triedFallback2 = 'true';
              target.src = '/categoria design v4.original.png';
            }
          }}
          className="w-full h-[108%] max-w-none object-cover object-top -translate-y-1.5 sm:-translate-y-2 md:-translate-y-3 lg:-translate-y-3.5 select-none"
        />

        {/* Suave véu no topo para que os textos do cabeçalho e controles fiquem super legíveis */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/40 via-black/15 to-transparent pointer-events-none" />

        {/* Leve sombra suave atrás da área dos cards para destacá-los das montanhas */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_50%_at_50%_52%,rgba(9,9,11,0.45)_0%,rgba(9,9,11,0.12)_70%,transparent_100%)] pointer-events-none" />
      </motion.div>

      {/* =========================================================================
          CONTEÚDO DA SEÇÃO (LAYOUT PRESERVADO COM ALTURA EQUILIBRADA)
         ========================================================================= */}
      <div className="relative z-10 w-full max-w-[1740px] mx-auto px-3 sm:px-5 md:px-6 lg:px-7 xl:px-8">
        {/* CABEÇALHO EDITORIAL: Compacto, alinhado e refinado */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 lg:mb-7 xl:mb-8">
          <div className="max-w-xl">
            {/* Tag DIRETO DO ATELIÊ com ícone refinado */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={hasEntered ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.22em] text-[#FF6B00] mb-1"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-[#FF6B00] shrink-0">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
              <span>DIRETO DO ATELIÊ</span>
            </motion.div>

            {/* Título Principal Compacto */}
            <motion.h2
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={
                hasEntered
                  ? { opacity: 1, y: 0 }
                  : shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 8 }
              }
              transition={{
                duration: 0.5,
                delay: 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-[30px] font-black uppercase tracking-[-0.02em] text-white leading-none whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
            >
              ÚLTIMOS LANÇAMENTOS
            </motion.h2>

            {/* Subtítulo Editorial */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={hasEntered ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
              className="text-zinc-300 text-xs sm:text-[12.5px] font-normal tracking-wide mt-1 max-w-lg leading-snug drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]"
            >
              Novas peças. Tiragem limitada. Feitas para não passar despercebidas.
            </motion.p>
          </div>

          {/* DROP / 003 ───── VER TODOS ↗ + Setas de Navegação Compactas */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
            animate={hasEntered ? { opacity: 1, x: 0 } : shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
            transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
            className="flex items-center self-start lg:self-end gap-2.5 sm:gap-3 flex-wrap pb-0.5"
          >
            <div className="flex items-center bg-black/40 backdrop-blur-md px-3 py-1.2 rounded-[2px] border border-white/10">
              <span className="font-mono text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-zinc-300">
                DROP / 003
              </span>
              <span className="w-4 sm:w-6 h-px mx-2.5 inline-block bg-white/25" />
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="text-[#FF6B00] hover:text-[#FFA040] font-bold text-[11px] sm:text-xs tracking-[0.15em] uppercase flex items-center gap-1 transition-colors cursor-pointer group"
              >
                <span>VER TODOS</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </button>
            </div>

            {/* Setas de Navegação Compactas 34x34px */}
            <div className="flex items-center gap-1 ml-0.5">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-8.5 h-8.5 rounded-[2px] bg-black/75 hover:bg-black text-zinc-300 hover:text-white border border-white/15 hover:border-[#FF6B00]/70 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm backdrop-blur-md"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-8.5 h-8.5 rounded-[2px] bg-black/75 hover:bg-black text-zinc-300 hover:text-white border border-white/15 hover:border-[#FF6B00]/70 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm backdrop-blur-md"
                aria-label="Próximo"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            CARROSSEL: Mais produtos adicionados, altura confortável e proporção perfeita
           ========================================================================= */}
        <div
          ref={scrollRef}
          className="flex gap-3.5 sm:gap-4 lg:gap-4.5 overflow-x-auto scrollbar-none pb-2.5 pt-0.5 scroll-smooth snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          {CANONICAL_DROP_ITEMS.map((item, index) => {
            const isFav = isInWishlist(item.id);
            const isAccessory = item.categoryName === 'ACESSÓRIOS';

            return (
              <motion.article
                key={item.id}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 14, x: -4 }
                }
                animate={
                  hasEntered
                    ? { opacity: 1, y: 0, x: 0 }
                    : shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 14, x: -4 }
                }
                transition={{
                  duration: 0.45,
                  delay: 0.12 + index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative w-[215px] sm:w-[240px] md:w-[255px] lg:w-[calc((100%-3*1.125rem)/3.65)] xl:w-[calc((100%-3.5*1.125rem)/4.15)] max-w-[285px] shrink-0 snap-start bg-[#F6F5F0] rounded-[3px] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.45)] border border-[#E4E1D8] flex flex-col justify-between transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.6)] cursor-pointer"
                onClick={() => handleCardClick(item)}
              >
                {/* ÁREA VISUAL DA FOTO: Proporção elegante (1/1.12) com altura ajustada */}
                <div className="relative aspect-[1/1.12] w-full bg-[#EAE7DF] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isAccessory
                        ? 'scale-[1.05] group-hover:scale-[1.08]'
                        : 'scale-100 group-hover:scale-[1.025]'
                    }`}
                  />

                  {/* Badge Refinado NOVO / 003 */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="bg-[#111113]/88 backdrop-blur-md text-[#F5F4F0] text-[8px] sm:text-[8.5px] font-mono font-medium uppercase tracking-[0.22em] px-2 py-0.5 rounded-[1px] shadow-xs inline-block border border-white/12">
                      NOVO / 003
                    </span>
                  </div>

                  {/* Botão de Favorito Discreto */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistClick(e, item)}
                    className="absolute top-2.5 right-2.5 z-20 w-6.5 h-6.5 rounded-full bg-[#F6F5F0]/92 backdrop-blur-md shadow-2xs border border-black/8 hover:border-black/20 flex items-center justify-center text-[#2C2B28] hover:text-[#FF6B00] active:scale-95 transition-all cursor-pointer"
                    aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart
                      className={`w-3 h-3 transition-colors ${
                        isFav ? 'fill-red-500 text-red-500' : 'text-[#2C2B28] stroke-[1.5]'
                      }`}
                    />
                  </button>
                </div>

                {/* ÁREA DE INFORMAÇÕES: Compacta, nítida e proporcional */}
                <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 flex flex-col justify-between bg-[#F6F5F0] text-[#141312] flex-1">
                  <div>
                    {/* Categoria */}
                    <span className="block text-[8.5px] sm:text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-[#7A7871] mb-0.5">
                      {item.categoryName}
                    </span>

                    {/* Título do Produto */}
                    <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-[#141312] tracking-[-0.015em] leading-snug line-clamp-1 group-hover:text-black transition-colors">
                      {item.title}
                    </h3>

                    {/* Divisor sutil no card */}
                    <div className="relative w-full h-px bg-[#E4E1D8] my-1.5">
                      <span className="absolute left-0 top-0 h-px w-5 bg-[#FF6B00] transition-all duration-350 ease-out group-hover:w-10" />
                    </div>

                    {/* Bloco de Preços */}
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[15px] sm:text-[16px] font-bold text-[#141312] tracking-tight leading-tight">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-[10px] text-[#6E6C65] font-normal leading-tight">
                        {item.installments}
                      </div>
                      <div className="text-[10.5px] font-bold text-[#E65100] leading-tight">
                        {item.pixPrice}
                      </div>
                    </div>
                  </div>

                  {/* Cores e Contagem com respiro compacto */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#E4E1D8]">
                    <div className="flex items-center gap-1.2">
                      {item.colors.map((c, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: c.hex }}
                          className="w-2.2 h-2.2 rounded-full border border-black/15 shadow-2xs inline-block"
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="text-[9.5px] sm:text-[10px] text-[#7A7871] font-mono font-medium">
                      {item.colorCountText}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* PARTE INFERIOR: Barra sutil e compacta */}
        <div className="relative pt-2 sm:pt-2.5 mt-0.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 border-t border-white/10 pt-2 sm:pt-2.5">
            {/* MARMOT / EST. 2018 */}
            <div className="flex items-center gap-2 text-left">
              <span className="font-black tracking-[0.24em] text-[10px] uppercase text-zinc-300">
                MARMOT
              </span>
              <span className="text-zinc-600 font-mono text-[8.5px]">•</span>
              <span className="text-zinc-500 font-mono text-[8.5px] tracking-wider uppercase">
                EST. 2018
              </span>
            </div>

            {/* EXPLORAR • VESTIR • PERTENCER */}
            <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] font-mono uppercase text-zinc-400/80">
              <span className="w-5 sm:w-8 h-px bg-zinc-600/40 inline-block" />
              <span>EXPLORAR</span>
              <span className="text-zinc-600">•</span>
              <span>VESTIR</span>
              <span className="text-zinc-600">•</span>
              <span>PERTENCER</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
