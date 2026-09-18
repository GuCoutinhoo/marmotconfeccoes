import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import {
  getStoredCategoryImage,
  ensureCategoryImagesStoredInLocalStorage,
  CURRENT_CATEGORY_IMAGES_VERSION,
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
  // CONJUNTO 01: 4 Colunas Verticais Principais (Camisetas, Moletons, Jaquetas, Calças)
  [
    {
      id: 'camisetas',
      slug: 'camisetas',
      name: 'CAMISETAS',
      image: '/categories/categoria-camisetas.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/categoria camiseta.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 18%',
      defaultPieces: 24,
    },
    {
      id: 'moletons',
      slug: 'moletons',
      name: 'MOLETONS',
      image: '/categories/categoria-moletons.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/categoria moletom.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 14%',
      defaultPieces: 19,
    },
    {
      id: 'jaquetas',
      slug: 'jaquetas',
      name: 'JAQUETAS',
      image: '/categories/categoria-jaquetas.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/categoria jaqueta.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 20%',
      defaultPieces: 19,
    },
    {
      id: 'calcas',
      slug: 'calcas',
      name: 'CALÇAS',
      image: '/categories/categoria-calcas.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/categoria calca.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 35%',
      defaultPieces: 20,
    },
  ],
  // CONJUNTO 02: 4 Colunas Complementares (Cargos, Shorts, Moletons, Jaquetas)
  [
    {
      id: 'cargos',
      slug: 'cargos',
      name: 'CARGOS',
      image: '/categories/categoria-calcas.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/calca_cargo_baggy_preto.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 40%',
      defaultPieces: 12,
    },
    {
      id: 'shorts',
      slug: 'shorts',
      name: 'SHORTS',
      image: '/categories/categoria-shorts.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/categoria shorts.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 10%',
      defaultPieces: 12,
    },
    {
      id: 'camisetas-alt',
      slug: 'camisetas',
      name: 'CAMISETAS',
      image: '/categories/categoria-camisetas.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/categoria camiseta.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 18%',
      defaultPieces: 24,
    },
    {
      id: 'jaquetas-alt',
      slug: 'jaquetas',
      name: 'JAQUETAS',
      image: '/categories/categoria-jaquetas.png?v=20260918_v12_remover_tenis_acessorios',
      fallbackImage: '/categoria jaqueta.png?v=20260918_v12_remover_tenis_acessorios',
      objectPosition: 'center 20%',
      defaultPieces: 19,
    },
  ],
];

export const CategoryNavigationGrid: React.FC<CategoryNavigationGridProps> = ({ onNavigate }) => {
  const { categories, products } = useStore();
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    ensureCategoryImagesStoredInLocalStorage().catch((err) => {
      console.warn('Erro ao sincronizar imagens com localStorage:', err);
    });
  }, []);

  const getCardImage = useCallback(
    (item: CategoryEditorialItem) => {
      // 1. Prioritize real database/store category image if present and valid
      const matchedStoreCat = categories?.find(
        (c) => c.slug?.toLowerCase() === item.slug.toLowerCase()
      );
      if (
        matchedStoreCat?.image &&
        !matchedStoreCat.image.includes('unsplash.com') &&
        !matchedStoreCat.image.startsWith('data:image/')
      ) {
        let img = matchedStoreCat.image;
        if (img.startsWith('/categories/') || img.startsWith('/categoria')) {
          const cleanPath = img.split('?')[0];
          return `${cleanPath}?v=${CURRENT_CATEGORY_IMAGES_VERSION}`;
        }
        return img;
      }

      // 2. High-res stored category image (if not a compressed base64 dataUrl)
      const stored = getStoredCategoryImage(item.slug);
      if (stored && !stored.startsWith('data:image/')) return stored;

      return item.image;
    },
    [categories]
  );

  const getCategoryCount = useCallback(
    (slug: string, defaultPieces: number) => {
      if (!products || products.length === 0) return defaultPieces;
      const count = products.filter(
        (p) =>
          p.category?.toLowerCase() === slug.toLowerCase() ||
          p.subcategory?.toLowerCase() === slug.toLowerCase()
      ).length;
      return count > 0 ? count : defaultPieces;
    },
    [products]
  );

  const handlePrevSet = () => {
    setSlideDirection(-1);
    setActiveSetIndex((prev) => (prev === 0 ? CATEGORY_SETS.length - 1 : prev - 1));
  };

  const handleNextSet = () => {
    setSlideDirection(1);
    setActiveSetIndex((prev) => (prev === CATEGORY_SETS.length - 1 ? 0 : prev + 1));
  };

  const currentSet = CATEGORY_SETS[activeSetIndex];

  // Renderizador do card individual vertical com proporção 9:15 / alta precisão
  const renderCategoryCard = (
    item: CategoryEditorialItem,
    index: number
  ) => {
    const pieces = getCategoryCount(item.slug, item.defaultPieces);

    return (
      <motion.article
        key={item.id}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('shop', item.slug)}
        className="group relative overflow-hidden bg-[#111113] cursor-pointer select-none rounded-xl sm:rounded-2xl border border-zinc-200/90 hover:border-[#F4C400]/70 shadow-xs hover:shadow-[0_12px_28px_rgba(0,0,0,0.14)] transition-all duration-300 aspect-[9/15] min-h-[320px] sm:min-h-[380px] md:min-h-[420px] lg:min-h-[480px] xl:min-h-[520px] w-full flex flex-col justify-end touch-pan-y"
        style={{ touchAction: 'pan-y', willChange: 'opacity, transform' }}
      >
        {/* Linha de acento amarelo animada no rodapé do card (editorial streetwear) */}
        <div className="absolute bottom-0 left-0 h-[3px] bg-[#F4C400] w-0 group-hover:w-full transition-all duration-400 ease-out z-20 pointer-events-none" />

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
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out select-none pointer-events-none brightness-[0.98] contrast-[1.04]"
          onError={(e) => {
            if (e.currentTarget.src !== item.fallbackImage) {
              e.currentTarget.src = item.fallbackImage;
            }
          }}
        />

        {/* Degradê/overlay escuro na base para legibilidade máxima */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-40% to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/95" />

        {/* Textos no canto inferior esquerdo */}
        <div className="relative p-4 sm:p-5 lg:p-5.5 z-10 flex flex-col items-start w-full transform group-hover:translate-y-[-2px] transition-transform duration-300">
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] bg-black/60 backdrop-blur-xs border border-white/10 text-[9.5px] sm:text-[10.5px] font-mono font-medium text-zinc-300 tracking-[0.16em] uppercase mb-1.5 drop-shadow-xs group-hover:border-[#F4C400]/40 group-hover:text-[#F4C400] transition-colors duration-300">
            {pieces} PEÇAS
          </span>
          <h3
            style={{
              fontFamily: '"Inter Tight", "Inter", sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
            className="text-white uppercase leading-none text-xl sm:text-2xl lg:text-[23px] xl:text-[26px] mb-2 drop-shadow-sm"
          >
            {item.name}
          </h3>

          {/* EXPLORAR discreto + pequena seta amarela */}
          <div
            style={{ fontFamily: '"Inter", sans-serif' }}
            className="flex items-center gap-1.5 sm:gap-2 text-white text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase transition-colors group-hover:text-[#F4C400]"
          >
            <span>EXPLORAR</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F5C400] stroke-[2.4] transition-transform duration-200 group-hover:translate-x-1.5" />
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <motion.section
      ref={sectionRef}
      id="category-showcase-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#FAFAFA] pt-6 sm:pt-8 pb-8 sm:pb-10 border-b border-zinc-200/80 select-none overflow-hidden touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
      {/* ========================================================= */}
      {/* CABEÇALHO DA SEÇÃO                                         */}
      {/* ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full px-4 sm:px-6 lg:px-8 max-w-[1840px] mx-auto mb-4 sm:mb-5"
      >
        <div className="flex items-start sm:items-end justify-between gap-4">
          {/* BLOCO ESQUERDO: TÍTULO + SUBTÍTULO */}
          <div className="flex flex-col items-start text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-[-0.03em] uppercase text-zinc-950 leading-none select-none">
              COMPRE POR CATEGORIA
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-500 font-normal mt-1.5 select-none tracking-normal">
              Explore a coleção e encontre seu próximo look.
            </p>
          </div>

          {/* BLOCO DIREITO: Indicadores + Setas para alternar entre os conjuntos de 4 cards */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Indicador de página e bullets interativos */}
            <div className="hidden sm:flex items-center gap-2.5 text-xs font-mono font-medium text-zinc-500 select-none">
              <span>{String(activeSetIndex + 1).padStart(2, '0')} / {String(CATEGORY_SETS.length).padStart(2, '0')}</span>
              <div className="flex items-center gap-1.5">
                {CATEGORY_SETS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSlideDirection(idx > activeSetIndex ? 1 : -1);
                      setActiveSetIndex(idx);
                    }}
                    aria-label={`Ir para conjunto ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeSetIndex ? 'w-5 bg-zinc-900' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Setas anterior / próximo */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevSet}
                aria-label="Conjunto anterior"
                className="w-9 h-9 sm:w-10 sm:h-10 border border-zinc-200/90 bg-white hover:bg-zinc-50 active:scale-95 flex items-center justify-center text-zinc-900 transition-all cursor-pointer rounded-[3px] shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={handleNextSet}
                aria-label="Próximo conjunto"
                className="w-9 h-9 sm:w-10 sm:h-10 border border-[#F4C400] bg-white hover:bg-amber-50/40 active:scale-95 flex items-center justify-center text-zinc-900 transition-all cursor-pointer rounded-[3px] shadow-2xs"
              >
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* GRID DE COLUNAS VERTICAIS IDÊNTICAS:                      */}
      {/* - Cards Altos Verticais lado a lado em 1 linha única       */}
      {/* ========================================================= */}
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1840px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSetIndex}
            initial={{ opacity: 0, x: slideDirection > 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection > 0 ? -24 : 24 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4 xl:gap-5"
          >
            {currentSet.map((item, index) => renderCategoryCard(item, index))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
};
