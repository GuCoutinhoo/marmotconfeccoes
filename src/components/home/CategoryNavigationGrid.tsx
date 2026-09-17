import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import {
  getStoredCategoryImage,
  ensureCategoryImagesStoredInLocalStorage,
} from '../../utils/categoryImageStorage';

interface CategoryNavigationGridProps {
  onNavigate: (page: string, param?: string) => void;
}

interface CategoryEditorialItem {
  id: string;
  slug: string;
  name: string;
  image: string;
  fallbackImage: string;
  objectPosition: string;
  defaultPieces: number;
}

const CATEGORY_SETS: CategoryEditorialItem[][] = [
  // CONJUNTO 01: Jaquetas (Grande Esquerda), Shorts (Centro Sup), Calças (Direita Sup), Moletons (Centro Inf), Camisetas (Direita Inf)
  [
    {
      id: 'jaquetas',
      slug: 'jaquetas',
      name: 'JAQUETAS',
      image: '/categories/categoria-jaquetas.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria jaqueta.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 20%',
      defaultPieces: 18,
    },
    {
      id: 'shorts',
      slug: 'shorts',
      name: 'SHORTS',
      image: '/categories/categoria-shorts.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria shorts.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 10%',
      defaultPieces: 12,
    },
    {
      id: 'calcas',
      slug: 'calcas',
      name: 'CALÇAS',
      image: '/categories/categoria-calcas.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria calca.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 35%',
      defaultPieces: 20,
    },
    {
      id: 'moletons',
      slug: 'moletons',
      name: 'MOLETONS',
      image: '/categories/categoria-moletons.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria moletom.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 14%',
      defaultPieces: 16,
    },
    {
      id: 'camisetas',
      slug: 'camisetas',
      name: 'CAMISETAS',
      image: '/categories/categoria-camisetas.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria camiseta.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 18%',
      defaultPieces: 24,
    },
  ],
  // CONJUNTO 02: Camisetas (Grande Esquerda), Tênis (Centro Sup), Acessórios (Direita Sup), Shorts (Centro Inf), Moletons (Direita Inf)
  [
    {
      id: 'camisetas',
      slug: 'camisetas',
      name: 'CAMISETAS',
      image: '/categories/categoria-camisetas.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria camiseta.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 18%',
      defaultPieces: 24,
    },
    {
      id: 'tenis',
      slug: 'tenis',
      name: 'TÊNIS',
      image: '/categories/categoria-tenis.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria tenis.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 62%',
      defaultPieces: 14,
    },
    {
      id: 'acessorios',
      slug: 'acessorios',
      name: 'ACESSÓRIOS',
      image: '/categories/categoria-acessorios.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria acessorios.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 30%',
      defaultPieces: 10,
    },
    {
      id: 'shorts',
      slug: 'shorts',
      name: 'SHORTS',
      image: '/categories/categoria-shorts.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria shorts.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 10%',
      defaultPieces: 12,
    },
    {
      id: 'moletons',
      slug: 'moletons',
      name: 'MOLETONS',
      image: '/categories/categoria-moletons.png?v=20260917_v9_novas_imagens_categoria',
      fallbackImage: '/categoria moletom.png?v=20260917_v9_novas_imagens_categoria',
      objectPosition: 'center 14%',
      defaultPieces: 16,
    },
  ],
];

// Variantes de animação refinadas para cada card
const cardLeftVariant = {
  hidden: {
    opacity: 0,
    x: -28,
    y: 28,
    scale: 0.985,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.82,
      ease: [0.22, 1, 0.36, 1],
      delay: 0,
    },
  },
};

const cardTopVariant = {
  hidden: {
    opacity: 0,
    x: 0,
    y: -24,
    scale: 0.985,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.82,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.08,
    },
  },
};

const cardTopRightVariant = {
  hidden: {
    opacity: 0,
    x: 24,
    y: -24,
    scale: 0.985,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.82,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.14,
    },
  },
};

const cardBottomVariant = {
  hidden: {
    opacity: 0,
    x: 0,
    y: 24,
    scale: 0.985,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.82,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.20,
    },
  },
};

const cardBottomRightVariant = {
  hidden: {
    opacity: 0,
    x: 24,
    y: 24,
    scale: 0.985,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.82,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.26,
    },
  },
};

const titleVariant = {
  hidden: {
    opacity: 0,
    y: 38,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.05,
    },
  },
};

export const CategoryNavigationGrid: React.FC<CategoryNavigationGridProps> = ({ onNavigate }) => {
  const { categories } = useStore();
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    ensureCategoryImagesStoredInLocalStorage().catch((err) => {
      console.warn('Erro ao sincronizar imagens com localStorage:', err);
    });
  }, []);

  // Monitora o scroll para disparar a animação sempre que o usuário rolar para baixo ao passar pela seção
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    let ticking = false;

    const checkPosition = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const isScrollingDown = currentScrollY >= lastScrollY;
      lastScrollY = currentScrollY;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      // Se a seção está abaixo da viewport (usuário rolou para cima e está acima dela):
      // Reseta imediatamente para "hidden" para que, na próxima descida, a animação aconteça novamente
      if (rect.top > vh * 0.85) {
        setHasEntered(false);
        ticking = false;
        return;
      }

      // Ao rolar para baixo e a seção entrar no campo de visão:
      if (isScrollingDown && rect.top <= vh * 0.85 && rect.bottom >= 60) {
        setHasEntered(true);
      } else if (!isScrollingDown && rect.top < vh && rect.bottom > 0) {
        // Ao rolar para cima enquanto passa pela seção, mantém os cards visíveis
        setHasEntered(true);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkPosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Verificação inicial
    checkPosition();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const getCardImage = useCallback(
    (item: CategoryEditorialItem) => {
      const stored = getStoredCategoryImage(item.slug);
      if (stored) return stored;

      const matchedStoreCat = categories?.find(
        (c) => c.slug?.toLowerCase() === item.slug.toLowerCase()
      );
      if (matchedStoreCat?.image && !matchedStoreCat.image.includes('unsplash.com')) {
        return matchedStoreCat.image;
      }

      return item.image;
    },
    [categories]
  );

  const handlePrevSet = () => {
    setActiveSetIndex((prev) => (prev === 0 ? CATEGORY_SETS.length - 1 : prev - 1));
  };

  const handleNextSet = () => {
    setActiveSetIndex((prev) => (prev === CATEGORY_SETS.length - 1 ? 0 : prev + 1));
  };

  const currentSet = CATEGORY_SETS[activeSetIndex];
  const item1 = currentSet[0]; // Card Grande Vertical (Esquerda - 2 Linhas)
  const item2 = currentSet[1]; // Card Retangular Superior Meio
  const item3 = currentSet[2]; // Card Retangular Superior Direita
  const item4 = currentSet[3]; // Card Retangular Inferior Meio
  const item5 = currentSet[4]; // Card Retangular Inferior Direita

  // Renderizador do card individual com cantos arredondados e acabamento de alta precisão
  const renderCategoryCard = (
    item: CategoryEditorialItem,
    className: string
  ) => {
    return (
      <article
        onClick={() => onNavigate('shop', item.slug)}
        className={`group relative overflow-hidden bg-[#111113] cursor-pointer select-none rounded-xl sm:rounded-2xl border border-zinc-200/90 hover:border-zinc-400/80 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
      >
        {/* Imagem de Fundo (100% preservada com os assets reais) */}
        <img
          src={getCardImage(item)}
          alt={item.name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          style={{
            objectPosition: item.objectPosition || 'center center',
          }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out select-none pointer-events-none brightness-[0.98] contrast-[1.04]"
          onError={(e) => {
            if (e.currentTarget.src !== item.fallbackImage) {
              e.currentTarget.src = item.fallbackImage;
            }
          }}
        />

        {/* Degradê/overlay escuro na base para legibilidade dos textos */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 via-35% to-transparent pointer-events-none" />

        {/* Textos no canto inferior esquerdo */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-4.5 lg:p-5 z-10 flex flex-col items-start">
          {/* Nome da categoria em Inter / negrito pesado / branco */}
          <h3
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
            className="text-white uppercase leading-none text-xl sm:text-2xl lg:text-[23px] xl:text-[25px] mb-1 sm:mb-1.5"
          >
            {item.name}
          </h3>

          {/* EXPLORAR discreto + pequena seta amarela */}
          <div
            style={{ fontFamily: '"Inter", sans-serif' }}
            className="flex items-center gap-1.5 sm:gap-2 text-white text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
          >
            <span>EXPLORAR</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F5C400] stroke-[2.2] transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="category-showcase-section"
      className="bg-[#FAFAFA] pt-4.5 sm:pt-5 pb-3 sm:pb-3.5 select-none overflow-hidden"
    >
      {/* ========================================================= */}
      {/* CABEÇALHO DA SEÇÃO                                         */}
      {/* ========================================================= */}
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1840px] mx-auto mb-2.5 sm:mb-3">
        <div className="flex items-start sm:items-end justify-between gap-4">
          {/* BLOCO ESQUERDO: TÍTULO + SUBTÍTULO */}
          <div className="flex flex-col items-start text-left">
            <div className="overflow-hidden">
              <motion.h2
                variants={titleVariant}
                initial="hidden"
                animate={hasEntered ? "visible" : "hidden"}
                style={{
                  fontFamily: '"Inter Tight", sans-serif',
                  letterSpacing: '-0.03em',
                  fontSize: '32px',
                  lineHeight: '32px',
                  fontWeight: 800,
                }}
                className="text-[32px] leading-[32px] font-extrabold uppercase text-black select-none will-change-transform font-inter-tight"
              >
                COMPRE POR CATEGORIA
              </motion.h2>
            </div>
            <p
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '12px',
                marginTop: '1px',
              }}
              className="text-[12px] text-zinc-400 font-normal mt-[1px] select-none tracking-normal"
            >
              Explore a coleção e encontre seu próximo look.
            </p>
          </div>

          {/* BLOCO DIREITO: Setas superiores para alternar entre conjuntos de categorias */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrevSet}
              aria-label="Conjunto anterior"
              className="w-9 h-9 sm:w-10 sm:h-10 border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-95 flex items-center justify-center text-black transition-all cursor-pointer rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2]" />
            </button>
            <button
              type="button"
              onClick={handleNextSet}
              aria-label="Próximo conjunto"
              className="w-9 h-9 sm:w-10 sm:h-10 border border-[#F5C400] bg-white hover:bg-amber-50/40 active:scale-95 flex items-center justify-center text-black transition-all cursor-pointer rounded-lg"
            >
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* GRID EXATO DA IMAGEM DE REFERÊNCIA:                        */}
      {/* - Coluna 1 (Esquerda): 1 Card Alto Vertical (2 Linhas)     */}
      {/* - Coluna 2 e 3 (Direita): 4 Cards Retangulares em Grade 2x2*/}
      {/* ========================================================= */}
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1840px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSetIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-rows-2 gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4 h-auto md:h-[460px] lg:h-[495px] xl:h-[530px] 2xl:h-[550px]"
          >
            {/* 1. CARD GRANDE (ESQUERDA - ALTURA TOTAL / 2 LINHAS) */}
            <motion.div
              variants={cardLeftVariant}
              initial="hidden"
              animate={hasEntered ? "visible" : "hidden"}
              className="sm:col-span-2 md:col-span-1 md:row-span-2 md:col-start-1 md:row-start-1 w-full h-[350px] sm:h-[390px] md:h-full will-change-transform"
            >
              {renderCategoryCard(item1, 'w-full h-full')}
            </motion.div>

            {/* 2. CARD RETANGULAR (CENTRO SUPERIOR) */}
            <motion.div
              variants={cardTopVariant}
              initial="hidden"
              animate={hasEntered ? "visible" : "hidden"}
              className="sm:col-span-1 md:col-span-1 md:row-span-1 md:col-start-2 md:row-start-1 w-full h-[175px] sm:h-[200px] md:h-full will-change-transform"
            >
              {renderCategoryCard(item2, 'w-full h-full')}
            </motion.div>

            {/* 3. CARD RETANGULAR (DIREITA SUPERIOR) */}
            <motion.div
              variants={cardTopRightVariant}
              initial="hidden"
              animate={hasEntered ? "visible" : "hidden"}
              className="sm:col-span-1 md:col-span-1 md:row-span-1 md:col-start-3 md:row-start-1 w-full h-[175px] sm:h-[200px] md:h-full will-change-transform"
            >
              {renderCategoryCard(item3, 'w-full h-full')}
            </motion.div>

            {/* 4. CARD RETANGULAR (CENTRO INFERIOR) */}
            <motion.div
              variants={cardBottomVariant}
              initial="hidden"
              animate={hasEntered ? "visible" : "hidden"}
              className="sm:col-span-1 md:col-span-1 md:row-span-1 md:col-start-2 md:row-start-2 w-full h-[175px] sm:h-[200px] md:h-full will-change-transform"
            >
              {renderCategoryCard(item4, 'w-full h-full')}
            </motion.div>

            {/* 5. CARD RETANGULAR (DIREITA INFERIOR) */}
            <motion.div
              variants={cardBottomRightVariant}
              initial="hidden"
              animate={hasEntered ? "visible" : "hidden"}
              className="sm:col-span-1 md:col-span-1 md:row-span-1 md:col-start-3 md:row-start-2 w-full h-[175px] sm:h-[200px] md:h-full will-change-transform"
            >
              {renderCategoryCard(item5, 'w-full h-full')}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
