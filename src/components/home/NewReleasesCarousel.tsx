import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
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
  categoryName: string;
  price: number;
  installments: string;
  checkoutNote: string;
  image: string;
  colors: { name: string; hex: string }[];
  colorCountText: string;
}

// Curated items matching the exact store catalog products
const CANONICAL_DROP_ITEMS: DropProductItem[] = [
  {
    id: 'prod-cam-001',
    slug: 'camiseta-contrast-stitch',
    title: 'Camiseta Contrast Stitch',
    categoryName: 'CAMISETAS',
    price: 149.90,
    installments: 'ou 3x de R$ 49,97 sem juros',
    checkoutNote: 'R$ 142,41 no PIX (5% OFF)',
    image: '/Camiseta Contrast Stitch - Preto.png',
    colors: [
      { name: 'Preto Washed', hex: '#1C1C1E' },
      { name: 'Areia Off-White', hex: '#EBE6DC' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'prod-jaq-001',
    slug: 'jaqueta-anorak',
    title: 'Jaqueta Anorak',
    categoryName: 'JAQUETAS',
    price: 429.90,
    installments: 'ou 3x de R$ 143,30 sem juros',
    checkoutNote: 'R$ 408,40 no PIX (5% OFF)',
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png',
    colors: [
      { name: 'Preto', hex: '#141416' },
      { name: 'Chumbo', hex: '#3E3E44' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'prod-mol-001',
    slug: 'moletom-anorak',
    title: 'Moletom Anorak',
    categoryName: 'MOLETON',
    price: 349.90,
    installments: 'ou 3x de R$ 116,63 sem juros',
    checkoutNote: 'R$ 332,40 no PIX (5% OFF)',
    image: '/uploads/products/prod-mol-001/a70c68c9e1c10f30.webp',
    colors: [
      { name: 'Preto', hex: '#171719' },
      { name: 'Areia Washed', hex: '#DED8CC' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'prod-cam-002',
    slug: 'camiseta-double-layer',
    title: 'Camiseta Double Layer',
    categoryName: 'CAMISETAS',
    price: 189.90,
    installments: 'ou 3x de R$ 63,30 sem juros',
    checkoutNote: 'R$ 180,41 no PIX (5% OFF)',
    image: '/Camiseta Double Layer - Bege e Marrom.png',
    colors: [
      { name: 'Marrom / Bege', hex: '#4A3B32' },
      { name: 'Areia', hex: '#DCD4C6' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'prod-jaq-002',
    slug: 'jaqueta-bomber-oversized',
    title: 'Jaqueta Bomber Oversized',
    categoryName: 'JAQUETAS',
    price: 459.90,
    installments: 'ou 3x de R$ 153,30 sem juros',
    checkoutNote: 'R$ 436,90 no PIX (5% OFF)',
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png',
    colors: [
      { name: 'Preto', hex: '#151517' },
      { name: 'Grafite', hex: '#3B3B42' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'prod-mol-002',
    slug: 'moletom-asymmetric-zip',
    title: 'Moletom Asymmetric Zip',
    categoryName: 'MOLETON',
    price: 349.90,
    installments: 'ou 3x de R$ 116,63 sem juros',
    checkoutNote: 'R$ 332,40 no PIX (5% OFF)',
    image: '/uploads/products/prod-mol-002/6b050306d7c2139f.webp',
    colors: [
      { name: 'Cinza Grafite', hex: '#2E2E33' },
      { name: 'Off-White', hex: '#E2DED6' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'prod-cal-002',
    slug: 'calca-cargo-baggy',
    title: 'Calça Cargo Baggy',
    categoryName: 'CALÇAS',
    price: 329.90,
    installments: 'ou 3x de R$ 109,97 sem juros',
    checkoutNote: 'R$ 313,41 no PIX (5% OFF)',
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
    colors: [
      { name: 'Preto', hex: '#18181B' },
      { name: 'Oliva Militar', hex: '#3E4238' },
    ],
    colorCountText: '2 cores',
  },
  {
    id: 'prod-jaq-017',
    slug: 'jaqueta-varsity-oversized',
    title: 'Jaqueta Varsity Oversized',
    categoryName: 'JAQUETAS',
    price: 499.90,
    installments: 'ou 3x de R$ 166,63 sem juros',
    checkoutNote: 'R$ 474,91 no PIX (5% OFF)',
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png',
    colors: [
      { name: 'Preto', hex: '#141416' },
      { name: 'Off-White', hex: '#E5E0D8' },
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
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  // Scroll tracking contínuo para profundidade visual, background e parallax cinematográfico
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Parallax horizontal suave na textura tipográfica NEW DROP
  const newDropParallaxX = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : isMobile ? [12, -12] : [24, -24]
  );

  // Monitora o scroll para disparar a coreografia editorial de entrada no momento exato
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();

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

      // 1. Reset silencioso: Se o usuário estiver acima da seção e ela sair da viewport
      if (rect.top >= windowHeight) {
        setHasEntered(false);
        return;
      }

      // 2. Disparo da animação editorial quando 15-20% da seção entrar na viewport
      if (isScrollingDown && rect.top <= windowHeight * 0.86 && rect.bottom >= 0) {
        setHasEntered(true);
        return;
      }

      // 3. Ao rolar para cima: mantém a seção revelada e estável, sem repetições bruscas
      if (!isScrollingDown && rect.bottom >= 0 && rect.top < windowHeight) {
        setHasEntered(true);
      }
    };

    const initialScrollY = window.scrollY || window.pageYOffset || 0;
    const initialRect = el.getBoundingClientRect();
    const initialWindowHeight = window.innerHeight || document.documentElement.clientHeight;

    if (initialScrollY > 200 || (initialRect.top < initialWindowHeight * 0.86 && initialRect.bottom > 0)) {
      setHasEntered(true);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('resize', checkMobile);
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

  // Garante que as fotos e informações venham dos produtos que estão realmente na loja (aba catálogo)
  const displayItems = React.useMemo(() => {
    return CANONICAL_DROP_ITEMS.map((canonicalItem) => {
      const matched = products.find(
        (p) =>
          p.id === canonicalItem.id ||
          p.slug === canonicalItem.slug ||
          p.title.toLowerCase().trim() === canonicalItem.title.toLowerCase().trim()
      );

      if (matched && matched.image) {
        const price = matched.promoPrice || matched.price;
        const installmentsVal = (price / 3).toFixed(2).replace('.', ',');
        const pixVal = (price * 0.95).toFixed(2).replace('.', ',');

        return {
          ...canonicalItem,
          id: matched.id,
          slug: matched.slug,
          title: matched.title,
          price,
          installments: `ou 3x de R$ ${installmentsVal} sem juros`,
          checkoutNote: `R$ ${pixVal} no PIX (5% OFF)`,
          image: matched.image,
          categoryName: (matched.category || canonicalItem.categoryName).toUpperCase(),
          colors:
            matched.colors && matched.colors.length > 0
              ? matched.colors.map((c) => ({
                  name: c.colorName || c.color || 'Padrão',
                  hex: c.colorHex || '#1C1C1E',
                }))
              : canonicalItem.colors,
          colorCountText: `${matched.colors?.length || canonicalItem.colors.length} cores`,
        };
      }

      return canonicalItem;
    });
  }, [products]);

  return (
    <section
      ref={sectionRef}
      id="ultimos-lancamentos-drop"
      className="relative w-full overflow-hidden select-none"
    >
      {/* =========================================================================
          BACKGROUND ART: Split horizontal de fundo exatamente igual à referência
          - Parte superior: Preto profundo (#141414)
          - Parte inferior: Off-white / Cinza claro suave (#ECEAE5)
          - "NEW DROP" gigante em marca d'água no fundo superior
         ========================================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Topo Escuro (cobre o cabeçalho e a metade superior dos cards) */}
        <div className="absolute top-0 inset-x-0 h-[54%] sm:h-[55%] md:h-[56%] lg:h-[57%] bg-[#141414]" />

        {/* Fundo Claro (cobre a metade inferior dos cards e o rodapé da seção) */}
        <div className="absolute bottom-0 inset-x-0 h-[46%] sm:h-[45%] md:h-[44%] lg:h-[43%] bg-[#ECEAE5]" />

        {/* Marca d'Água NEW DROP posicionada no topo, sem ser coberta pelos produtos */}
        <motion.div
          style={{ x: newDropParallaxX }}
          initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 25 }}
          animate={hasEntered ? { opacity: 1, x: 0 } : shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 25 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1 sm:top-1.5 md:top-2 left-1/2 -translate-x-1/2 w-full max-w-[1740px] px-4 sm:px-6 pointer-events-none select-none overflow-hidden flex justify-center"
        >
          <span className="font-black text-[68px] sm:text-[105px] md:text-[140px] lg:text-[170px] xl:text-[195px] leading-none text-white/[0.065] tracking-[-0.035em] whitespace-nowrap">
            NEW DROP
          </span>
        </motion.div>
      </div>

      {/* =========================================================================
          CONTEÚDO DA SEÇÃO
         ========================================================================= */}
      <div className="relative z-10 w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 sm:pt-9 md:pt-11">
        {/* CABEÇALHO */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 sm:mb-10 lg:mb-12">
          <div className="max-w-xl">
            {/* Tag + DIRETO DO ATELIÊ */}
            <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-[#E5A00D] mb-1">
              <span>+</span>
              <span>DIRETO DO ATELIÊ</span>
            </div>

            {/* Título Principal */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] font-black uppercase tracking-tight text-white leading-none">
              ÚLTIMOS LANÇAMENTOS
            </h2>

            {/* Subtítulo */}
            <p className="text-zinc-300 text-xs sm:text-[13.5px] font-normal tracking-wide mt-2">
              Novas peças. Tiragem limitada. Feitas para não passar despercebidas.
            </p>
          </div>

          {/* DROP / 003 ───── VER TODOS → + Setas */}
          <div className="flex items-center self-start lg:self-end gap-3 sm:gap-4 flex-wrap pb-1">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-white/90 uppercase">
                DROP / 003
              </span>
              <span className="w-6 sm:w-10 h-px bg-white/25 inline-block" />
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="text-[#E5A00D] hover:text-[#f8b82e] font-bold text-xs tracking-[0.15em] uppercase flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>VER TODOS</span>
                <span>→</span>
              </button>
            </div>

            {/* Setas de navegação quadradas */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-8 h-8 rounded-[3px] bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white/90 hover:text-white border border-white/10 hover:border-white/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-8 h-8 rounded-[3px] bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white/90 hover:text-white border border-white/10 hover:border-white/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

        {/* CARROSSEL DOS CARDS: Todos com tamanho equilibrado e uniforme, sem bordas brancas */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-4.5 overflow-x-auto scrollbar-none pb-6 pt-1 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {displayItems.map((item, index) => {
            const isFav = isInWishlist(item.id);

            return (
              <motion.article
                key={item.id}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={hasEntered ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.45,
                  delay: isMobile ? 0.15 + index * 0.04 : 0.2 + index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative w-[250px] sm:w-[265px] md:w-[275px] lg:w-[285px] shrink-0 snap-start bg-white rounded-[3px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.22)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                onClick={() => handleCardClick(item)}
              >
                {/* ÁREA DA FOTO (fundo escuro sem bordas visíveis) */}
                <div className="relative aspect-[1/1.08] w-full bg-[#141416] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedFallback) {
                        target.dataset.triedFallback = 'true';
                        target.src = 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80';
                      }
                    }}
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />

                  {/* Badge NOVO / 003 padrão uniforme em todos os cards */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="bg-[#18181A]/85 backdrop-blur-sm text-white text-[8px] sm:text-[8.5px] font-mono font-medium uppercase tracking-[0.2em] px-2 py-0.5 rounded-[2px] border border-white/10 shadow-xs inline-block">
                      NOVO / 003
                    </span>
                  </div>

                  {/* Botão de Favorito */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistClick(e, item)}
                    className="absolute top-2.5 right-2.5 z-20 w-6.5 h-6.5 rounded-full bg-white/90 backdrop-blur-sm shadow-xs border border-black/10 hover:border-black/25 flex items-center justify-center text-[#2C2B28] hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                    aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart
                      className={`w-3.2 h-3.2 transition-colors ${
                        isFav ? 'fill-red-500 text-red-500' : 'text-[#2C2B28] stroke-[1.5]'
                      }`}
                    />
                  </button>
                </div>

                {/* ÁREA DE INFORMAÇÕES */}
                <div className="px-4 py-3.5 flex flex-col justify-between bg-white text-[#141312] flex-1">
                  <div>
                    {/* Categoria */}
                    <span className="block text-[9px] sm:text-[9.5px] font-mono font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-0.5">
                      {item.categoryName}
                    </span>

                    {/* Título do Produto */}
                    <h3 className="text-[13.5px] sm:text-[14px] font-bold text-neutral-900 tracking-tight leading-snug line-clamp-1 group-hover:text-black transition-colors">
                      {item.title}
                    </h3>

                    {/* Preços */}
                    <div className="flex flex-col gap-0.5 mt-2">
                      <div className="text-[15.5px] sm:text-[16px] font-black text-neutral-900 tracking-tight leading-tight">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-[10px] sm:text-[10.5px] text-neutral-500 font-normal leading-tight">
                        {item.installments}
                      </div>
                      <div className="text-[10.5px] sm:text-[11px] font-bold text-[#D97706] leading-tight mt-0.5">
                        {item.checkoutNote}
                      </div>
                    </div>
                  </div>

                  {/* Cores e Contagem */}
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-neutral-100">
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
                    <span className="text-[9.5px] sm:text-[10px] text-neutral-400 font-mono font-medium">
                      {item.colorCountText}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* RODAPÉ INFERIOR: Exatamente no fundo claro como na referência */}
        <div className="pt-3 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-neutral-300/80 pt-3">
            {/* MARMOT • EST. 2018 */}
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-[0.25em] text-[10px] sm:text-[10.5px] uppercase text-neutral-900">
                MARMOT
              </span>
              <span className="text-neutral-400 font-mono text-[9px]">•</span>
              <span className="text-neutral-600 font-mono text-[9px] sm:text-[9.5px] tracking-wider uppercase">
                EST. 2018
              </span>
            </div>

            {/* ────── EXPLORAR • VESTIR • PERTENCER */}
            <div className="flex items-center gap-2.5 text-[9px] sm:text-[9.5px] tracking-[0.22em] font-mono uppercase text-neutral-600">
              <span className="w-8 sm:w-12 h-px bg-neutral-400 hidden sm:inline-block" />
              <span>EXPLORAR</span>
              <span className="text-neutral-400">•</span>
              <span>VESTIR</span>
              <span className="text-neutral-400">•</span>
              <span>PERTENCER</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
