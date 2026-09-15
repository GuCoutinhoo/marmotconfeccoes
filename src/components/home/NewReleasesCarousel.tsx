import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Product } from '../../types';
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { getValidProductImageUrl, handleProductImageError } from '../../utils/imageUtils';

interface NewReleasesCarouselProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

// Mapeamento de cores para swatches discretos nos cards
const getColorHex = (colorName: string = '', fallbackHex: string = ''): string => {
  if (fallbackHex && fallbackHex.startsWith('#')) return fallbackHex;
  const lower = colorName.toLowerCase();
  if (lower.includes('preto') || lower.includes('black')) return '#18181B';
  if (lower.includes('off') || lower.includes('branco') || lower.includes('white')) return '#FAFAFA';
  if (lower.includes('grafite') || lower.includes('chumbo')) return '#3F3F46';
  if (lower.includes('cinza') || lower.includes('grey') || lower.includes('gray')) return '#71717A';
  if (lower.includes('bege') || lower.includes('areia') || lower.includes('sand')) return '#D4C5B0';
  if (lower.includes('marrom') || lower.includes('brown')) return '#5C4033';
  if (lower.includes('oliva') || lower.includes('militar') || lower.includes('verde')) return '#4A5320';
  if (lower.includes('azul') || lower.includes('blue') || lower.includes('jeans')) return '#4B6B94';
  return '#27272A';
};

// Obtenção das cores para os swatches de 2 cores
const getCardSwatches = (productId: string, colors?: { colorName?: string; colorHex?: string }[]) => {
  if (productId === 'prod-cal-001') {
    return [{ hex: '#18181B' }, { hex: '#D4C5B0' }];
  }
  if (productId === 'prod-cal-002') {
    return [{ hex: '#18181B' }, { hex: '#4A5320' }];
  }
  if (productId === 'prod-cal-003') {
    return [{ hex: '#18181B' }, { hex: '#3F3F46' }];
  }
  if (productId === 'prod-cal-004') {
    return [{ hex: '#18181B' }, { hex: '#5C4033' }];
  }
  if (productId === 'prod-mol-001') {
    return [{ hex: '#18181B' }, { hex: '#71717A' }];
  }
  if (colors && colors.length >= 2) {
    return [
      { hex: getColorHex(colors[0].colorName, colors[0].colorHex) },
      { hex: getColorHex(colors[1].colorName, colors[1].colorHex) },
    ];
  }
  if (colors && colors.length === 1) {
    return [
      { hex: getColorHex(colors[0].colorName, colors[0].colorHex) },
      { hex: '#71717A' },
    ];
  }
  return [{ hex: '#18181B' }, { hex: '#71717A' }];
};

// Formatação editorial da categoria
const getDisplayCategory = (cat: string): string => {
  const c = (cat || '').toLowerCase().trim();
  if (c === 'calcas' || c === 'cargos') return 'CALÇAS';
  if (c === 'moletons') return 'MOLETONS';
  if (c === 'shorts') return 'SHORTS';
  if (c === 'jaquetas') return 'JAQUETAS';
  if (c === 'camisetas') return 'CAMISETAS';
  if (c === 'tenis') return 'TÊNIS';
  return (cat || 'LANÇAMENTO').toUpperCase();
};

export const NewReleasesCarousel: React.FC<NewReleasesCarouselProps> = ({
  products,
  onQuickView: _onQuickView,
  onNavigate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isSectionInView, setIsSectionInView] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Mouse drag support
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Curadoria ordenada para corresponder exatamente à imagem de referência editorial:
  // 1: Calça Balloon, 2: Calça Cargo Baggy, 3: Calça Cargo Multi Pocket, 4: Calça Carpenter
  // Seguido imediatamente por Moletons, Shorts, Jaquetas e Camisetas
  const releaseProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const priorityIds = [
      'prod-cal-001', // Calça Balloon
      'prod-cal-002', // Calça Cargo Baggy
      'prod-cal-003', // Calça Cargo Multi Pocket
      'prod-cal-004', // Calça Carpenter
      'prod-mol-001', // Moletom Anorak
      'prod-sho-001', // Shorts Baggy Denim
      'prod-mol-002', // Moletom Asymmetric Zip
      'prod-sho-002', // Shorts Cargo Baggy
      'prod-jaq-001', // Jaqueta Anorak
      'prod-sho-003', // Shorts Denim Washed
      'prod-mol-003', // Moletom Distressed
      'prod-sho-004', // Shorts Distressed
      'prod-mol-004', // Moletom Double Hood
      'prod-sho-005', // Shorts Flame
      'prod-jaq-002', // Jaqueta Bomber
      'prod-sho-006', // Shorts Graphic
      'prod-mol-005', // Moletom Double Layer
      'prod-sho-007', // Shorts Mesh Sport
    ];

    const priorityMap = new Map<string, number>();
    priorityIds.forEach((id, idx) => priorityMap.set(id, idx));

    // Pool de lançamentos
    const pool = products.filter(
      (p) =>
        p.isNewRelease ||
        p.tags?.some((t) => t.toLowerCase().includes('lançamento') || t.toLowerCase().includes('novo'))
    );
    const baseList = pool.length >= 12 ? pool : products;

    return [...baseList].sort((a, b) => {
      const pA = priorityMap.has(a.id) ? priorityMap.get(a.id)! : 999;
      const pB = priorityMap.has(b.id) ? priorityMap.get(b.id)! : 999;
      return pA - pB;
    });
  }, [products]);

  // Viewport tracking para reveal suave
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

      if (rect.top >= windowHeight) {
        setIsSectionInView(false);
        return;
      }

      if (isScrollingDown && rect.top <= windowHeight * 0.88 && rect.bottom >= 0) {
        setIsSectionInView(true);
        return;
      }

      if (!isScrollingDown && rect.bottom >= 0 && rect.top < windowHeight) {
        setIsSectionInView(true);
      }
    };

    const initialScrollY = window.scrollY || window.pageYOffset || 0;
    const initialRect = el.getBoundingClientRect();
    const initialWindowHeight = window.innerHeight || document.documentElement.clientHeight;

    if (initialScrollY > 100 || (initialRect.top < initialWindowHeight * 0.88 && initialRect.bottom > 0)) {
      setIsSectionInView(true);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Total de 7 posições de slide conforme imagem de referência ("01 — 07")
  const totalSlides = 7;

  const handleScrollPosition = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) {
      setActiveSlideIndex(0);
      return;
    }

    const progress = Math.min(1, Math.max(0, container.scrollLeft / maxScroll));
    const currentSlide = Math.min(totalSlides, Math.max(1, Math.round(progress * (totalSlides - 1)) + 1));
    setActiveSlideIndex(currentSlide - 1);
  }, [totalSlides]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -270 : 270;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isMouseDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
  };

  const handleCardClick = (productId: string) => {
    if (hasMovedRef.current) return;
    onNavigate('product', productId);
  };

  const currentIndexStr = String(activeSlideIndex + 1).padStart(2, '0');
  const totalCountStr = String(totalSlides).padStart(2, '0');

  return (
    <section
      ref={sectionRef}
      id="ultimos-lancamentos-drop"
      className="py-6 sm:py-7 lg:py-8 bg-[#F6F5F2] border-b border-zinc-200/90 select-none overflow-hidden"
    >
      {/* ========================================================= */}
      {/* CABEÇALHO COMPACTO: TÍTULO EM UMA LINHA + CONTROLES       */}
      {/* ========================================================= */}
      <div className="w-full px-7 sm:px-8">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={
            isSectionInView
              ? { opacity: 1, y: 0 }
              : shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 10 }
          }
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4 sm:mb-5 lg:mb-6"
        >
          {/* Eyebrow: NOVA TEMPORADA • DROP 2026 */}
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.26em] text-black">
              NOVA TEMPORADA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400] inline-block mx-1" />
            <span className="text-[10px] sm:text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-zinc-500">
              DROP 2026
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-1">
            {/* Bloco Título em Linha Única + Descrição Compacta */}
            <div className="flex flex-col gap-1 min-w-0">
              <h2
                className="font-anton uppercase tracking-[-0.03em] text-[#0B0B0E] leading-none whitespace-nowrap"
                style={{ fontSize: '52.72px', fontWeight: 'normal' }}
              >
                ÚLTIMOS LANÇAMENTOS
              </h2>
              <p className="text-xs sm:text-[13px] text-zinc-500 font-normal leading-normal mt-0.5 max-w-xl">
                Peças recém-chegadas. Desenvolvidas para um estilo real, dentro e fora da cidade.
              </p>
            </div>

            {/* Controles de Navegação Alinhados à Direita (Idênticos à Referência) */}
            <div className="flex items-center gap-3 sm:gap-4 self-start lg:self-end shrink-0 pb-0.5">
              {/* Link Ver Todos */}
              <button
                type="button"
                onClick={() => onNavigate('shop', 'novidades')}
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black hover:text-zinc-600 inline-flex items-center gap-1 cursor-pointer transition-colors underline underline-offset-4 decoration-black group whitespace-nowrap"
              >
                <span>VER TODOS OS LANÇAMENTOS</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              {/* Divisor Vertical */}
              <div className="w-[1px] h-4 bg-zinc-300 mx-0.5 hidden sm:block" />

              {/* Contador Numérico: "01 — 07" */}
              <div className="font-mono text-xs sm:text-[13px] font-semibold tracking-wider text-zinc-800 whitespace-nowrap">
                <span>{currentIndexStr}</span>
                <span className="text-zinc-400 font-normal mx-1.5">—</span>
                <span className="text-zinc-500">{totalCountStr}</span>
              </div>

              {/* Botões Quadrados de Navegação [ < ] [ > ] */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="w-9 h-9 sm:w-10 sm:h-10 border border-black bg-white hover:bg-zinc-100 text-black rounded-[3px] transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                  aria-label="Lançamentos anteriores"
                  title="Lançamentos anteriores"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="w-9 h-9 sm:w-10 sm:h-10 border border-black bg-[#F5C400] hover:bg-[#E5B500] text-black rounded-[3px] transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                  aria-label="Próximos lançamentos"
                  title="Próximos lançamentos"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* CARROSSEL DE CARDS COMPACTOS                              */}
      {/* 4 CARDS COMPLETOS + 5º PARCIAL (14px-18px GAP)           */}
      {/* ========================================================= */}
      <div
        ref={scrollRef}
        onScroll={handleScrollPosition}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        style={{
          paddingTop: '2px',
          paddingLeft: '32px',
          paddingBottom: '12px',
          paddingRight: '48px',
          marginLeft: '30px',
        }}
      >
        {releaseProducts.map((product) => {
          const isFavorite = isInWishlist(product.id);
          const primaryImage =
            product.colors?.[0]?.image ||
            product.image ||
            (product.images && product.images.length > 0 ? product.images[0] : '');
          const displayImage = getValidProductImageUrl(primaryImage, product.category, product.id);
          const effectivePrice = product.promoPrice || product.price;
          const pixPrice = effectivePrice * 0.95;
          const categoryLabel = getDisplayCategory(product.category);
          const swatches = getCardSwatches(product.id, product.colors);

          return (
            <article
              key={product.id}
              onClick={() => handleCardClick(product.id)}
              className="group relative shrink-0 w-[220px] sm:w-[235px] md:w-[245px] lg:w-[255px] xl:w-[265px] rounded-[4px] bg-white border border-zinc-200/90 overflow-hidden cursor-pointer select-none shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-black transition-all duration-300 snap-start flex flex-col"
            >
              {/* ÁREA DA FOTOGRAFIA: Proporção compacta (~1:1.12), roupas 100% visíveis */}
              <div className="relative aspect-[1/1.12] w-full overflow-hidden bg-[#EAE7E1]">
                {/* Badge "NOVO DROP" */}
                <span className="absolute top-2.5 left-2.5 z-10 bg-black/90 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] shadow-2xs">
                  NOVO DROP
                </span>

                {/* Botão de Favorito Compacto */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-zinc-900 flex items-center justify-center shadow-2xs hover:shadow-xs transition-all active:scale-90 cursor-pointer backdrop-blur-[2px]"
                  aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                  title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${
                      isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-zinc-900 stroke-[1.8] fill-none'
                    }`}
                  />
                </button>

                {/* Fotografia Principal */}
                <img
                  src={displayImage}
                  alt={product.title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  onError={(e) => handleProductImageError(e, product.category, product.id)}
                />

                {/* Botão de Espiada Rápida que sobe suavemente no hover */}
                <div className="absolute bottom-2 left-2 right-2 z-20 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      _onQuickView(product);
                    }}
                    className="w-full bg-white/95 hover:bg-[#0B0B0E] text-[#0B0B0E] hover:text-white py-1.5 px-2 rounded-[2px] text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs border border-zinc-200 hover:border-black transition-colors"
                  >
                    <span>Espiada Rápida</span>
                  </button>
                </div>
              </div>

              {/* ÁREA INFERIOR: Informações do Produto Compactas e Claras */}
              <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 bg-white border-t border-zinc-100">
                <div className="space-y-0.5">
                  {/* Categoria */}
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400 block leading-tight">
                    {categoryLabel}
                  </span>

                  {/* Nome do Produto */}
                  <h3 className="text-[13px] sm:text-[13.5px] font-black uppercase tracking-tight text-[#0B0B0E] group-hover:text-zinc-700 transition-colors line-clamp-1 leading-snug">
                    {product.title}
                  </h3>
                </div>

                {/* Bloco de Preço e Ação */}
                <div className="pt-2 mt-2 border-t border-zinc-100 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    {/* Preço Principal */}
                    <div className="text-[14px] sm:text-[15px] font-black text-[#0B0B0E] tracking-tight leading-none">
                      R$ {effectivePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    {/* Preço no Pix com badge 5% PIX */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[11px] sm:text-xs font-bold text-zinc-700">
                        R$ {pixPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-[#8A5E00] bg-[#FEF9C3] px-1 py-0.5 rounded-[2px]">
                        5% PIX
                      </span>
                    </div>

                    {/* Swatches de Cores */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="flex items-center -space-x-0.5">
                        {swatches.map((swatch, sIdx) => (
                          <span
                            key={sIdx}
                            className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-2xs inline-block"
                            style={{ backgroundColor: swatch.hex }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        {product.colors && product.colors.length > 0 ? `${product.colors.length} cores` : '2 cores'}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Seta Circular Compacto */}
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-black text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0 shadow-2xs">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* RODAPÉ DA SEÇÃO (IDÊNTICO À REFERÊNCIA)                   */}
      {/* ========================================================= */}
      <div className="w-full px-7 sm:px-8">
        <div className="w-full border-t border-zinc-300 mt-6 sm:mt-7 pt-3 sm:pt-3.5 flex items-center justify-between select-none">
          {/* Lado Esquerdo */}
          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[10.5px] tracking-[0.22em] text-zinc-500 uppercase">
            <span className="font-bold text-black">MARMOT</span>
            <span className="text-zinc-300">|</span>
            <span>STREETWEAR BRASILEIRO</span>
          </div>

          {/* Lado Direito: Slogan + Indicador de Barras */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] sm:text-[10.5px] tracking-[0.22em] text-zinc-500 uppercase hidden sm:inline-block">
              MAIS QUE ROUPA, É ATITUDE.
            </span>
            <div className="flex items-center gap-1">
              <span className="w-6 h-[2px] bg-black rounded-full" />
              <span className="w-6 h-[2px] bg-zinc-300 rounded-full" />
              <span className="w-6 h-[2px] bg-zinc-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

