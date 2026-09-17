import React, { useState, memo, useCallback } from 'react';
import { Product } from '../types';
import { Eye, Check, ArrowRight, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getValidProductImageUrl, handleProductImageError, getProductCardImageFraming } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onProductClick: (productId: string) => void;
  priorityBadge?: string;
  variant?: 'standard' | 'editorial';
  size?: 'standard' | 'compact';
  hideNewReleaseBadge?: boolean;
  editorialIndex?: number;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
  priorityBadge,
  variant = 'standard',
  size = 'standard',
  hideNewReleaseBadge = false,
  editorialIndex,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredColorImage, setHoveredColorImage] = useState<string | null>(null);
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isCompact = size === 'compact';
  const isFavorite = isInWishlist(product.id);
  const primaryImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');
  const rawImages = (product.images && product.images.length > 0)
    ? (primaryImage && product.images[0] !== primaryImage ? [primaryImage, ...product.images.filter(x => x !== primaryImage)] : product.images)
    : (primaryImage ? [primaryImage] : []);
  
  const images = rawImages.length > 0
    ? rawImages.map((img, idx) => getValidProductImageUrl(img, product.category, `${product.id}-${idx}`))
    : [getValidProductImageUrl(null, product.category, product.id)];
  
  const rawDisplay = hoveredColorImage || images[currentImageIndex] || images[0];
  const displayImage = getValidProductImageUrl(rawDisplay, product.category, product.id);

  const effectivePrice = product.promoPrice || product.price;
  const installmentCount = 3;
  const installmentValue = effectivePrice / installmentCount;
  const pixPrice = effectivePrice * 0.95;

  const formattedPrice = effectivePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedInstallment = installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedPix = pixPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const categoryLabel = (product.subcategory || product.category || 'Streetwear').toUpperCase();

  const colorsList = product.colors && product.colors.length > 0
    ? product.colors
    : [{ colorName: 'Padrão', colorHex: '#121212', color: 'black' }];
  const colorsCountText = `${colorsList.length} ${colorsList.length === 1 ? 'cor' : 'cores'}`;

  const handleQuickAddSize = useCallback((e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    const added = addToCart(product, size, product.colors?.[0] || colorsList[0], 1);
    if (added) {
      setAddedSize(size);
      setTimeout(() => setAddedSize(null), 1600);
    }
  }, [addToCart, product, colorsList]);

  return (
    <article
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col bg-white border border-black/[0.06] hover:border-black/15 transition-all duration-300 overflow-hidden select-none font-sans ${
        isCompact
          ? 'rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)]'
          : 'rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)]'
      }`}
    >
      {/* 1. IMAGEM DO PRODUTO (Aproximadamente 65% a 70% da altura visual do card, object-fit: cover, sem padding ao redor) */}
      <div 
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F6F6F6] cursor-pointer"
        onClick={() => onProductClick(product.slug || product.id)}
      >
        <img
          src={displayImage}
          alt={product.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${getProductCardImageFraming(product.category)}`}
          onError={(e) => handleProductImageError(e, product.category, product.id)}
          onMouseEnter={() => !hoveredColorImage && images.length > 1 && setCurrentImageIndex(1)}
          onMouseLeave={() => !hoveredColorImage && setCurrentImageIndex(0)}
        />

        {/* 2. FAVORITO: Botão circular branco no canto superior direito, tamanho discreto, coração preto fino */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute z-20 rounded-full bg-white/95 hover:bg-white text-black flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all duration-200 cursor-pointer ${
            isCompact
              ? 'top-2.5 right-2.5 w-7 h-7 sm:w-7.5 sm:h-7.5'
              : 'top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 sm:w-8.5 sm:h-8.5'
          }`}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={`transition-all duration-200 stroke-[1.3] ${
              isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'
            } ${
              isFavorite ? 'fill-black text-black' : 'fill-transparent text-black'
            }`}
          />
        </button>

        {/* Quick View discreto acessível ao passar o mouse */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className={`absolute z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full bg-white/95 hover:bg-white text-black flex items-center gap-1.5 shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-black/[0.04] uppercase font-sans font-medium tracking-wider cursor-pointer ${
            isCompact
              ? 'top-2.5 left-2.5 h-6 px-2 text-[8.5px]'
              : 'top-3.5 left-3.5 h-7 px-2.5 text-[9.5px]'
          }`}
          aria-label="Espiada rápida"
          title="Espiada rápida"
        >
          <Eye className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} stroke-[1.4] text-black`} />
          <span className="hidden sm:inline">Espiar</span>
        </button>

        {/* Seleção rápida de tamanhos (discreto ao passar o mouse na base da foto) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="absolute bottom-2.5 left-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="mx-auto w-fit bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs border border-black/[0.06] flex items-center gap-1">
              {product.sizes.slice(0, 5).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={(e) => handleQuickAddSize(e, sz)}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-sans font-semibold transition-colors cursor-pointer ${
                    addedSize === sz
                      ? 'bg-black text-white'
                      : 'text-zinc-700 hover:bg-black hover:text-white'
                  }`}
                  title={`Adicionar tamanho ${sz}`}
                >
                  {addedSize === sz ? <Check className="w-2.5 h-2.5 mx-auto" /> : sz}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. ÁREA DE INFORMAÇÕES: Hierarquia vertical limpa com espaçamentos rigorosos */}
      <div className={`flex flex-col justify-between flex-1 ${
        isCompact ? 'p-3 sm:p-3.5' : 'p-4 sm:p-5 lg:p-6'
      }`}>
        <div>
          {/* CATEGORIA */}
          <p className={`font-sans font-medium uppercase tracking-[0.16em] text-[#555555] leading-none ${
            isCompact ? 'text-[9px] sm:text-[9.5px] mb-1.5' : 'text-[10.5px] sm:text-[11px] mb-2'
          }`}>
            {categoryLabel}
          </p>

          {/* NOME DO PRODUTO */}
          <h3
            onClick={() => onProductClick(product.slug || product.id)}
            className={`font-sans font-bold uppercase tracking-[-0.02em] text-black hover:text-zinc-700 transition-colors cursor-pointer ${
              isCompact
                ? 'text-[12.5px] sm:text-[13.5px] leading-tight line-clamp-1 mb-2'
                : 'text-[15px] sm:text-[16px] leading-[0.95] line-clamp-2 mb-3 sm:mb-3.5'
            }`}
          >
            {product.title}
          </h3>

          {/* PREÇO */}
          <div className={`flex items-baseline gap-2 ${isCompact ? 'mb-1' : 'mb-1.5'}`}>
            <span className={`font-sans font-extrabold tracking-[-0.035em] text-black ${
              isCompact
                ? 'text-[17px] sm:text-[18.5px] leading-tight'
                : 'text-[21px] sm:text-[23px] leading-[0.95]'
            }`}>
              R$ {formattedPrice}
            </span>
            {product.promoPrice && product.price > product.promoPrice && (
              <span className="font-sans text-[10px] sm:text-[11px] text-zinc-400 line-through font-normal tracking-normal">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* PARCELAMENTO */}
          <p className={`font-sans font-normal text-[#555555] leading-tight mb-0.5 ${
            isCompact ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-[11.5px]'
          }`}>
            ou 3x de R$ {formattedInstallment} sem juros
          </p>

          {/* PIX */}
          <p className={`font-sans font-normal text-[#555555] leading-tight ${
            isCompact ? 'text-[10px] sm:text-[10.5px] mb-2.5 sm:mb-3' : 'text-[11px] sm:text-[11.5px] mb-4 sm:mb-5'
          }`}>
            R$ {formattedPix} no Pix
          </p>
        </div>

        {/* 4. DIVISOR + ÁREA DAS CORES E CTA */}
        <div className={`border-t border-[#EAEAEA] flex items-center justify-between ${
          isCompact ? 'pt-2.5 gap-2' : 'pt-3.5 gap-3'
        }`}>
          {/* Lado Esquerdo: Swatches + Separador Vertical + Quantidade de Cores */}
          <div className="flex items-center min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              {colorsList.slice(0, 4).map((color, idx) => {
                const hex = color.colorHex || '#171717';
                const isWhite = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff';
                return (
                  <button
                    key={color.colorHex || color.colorName || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const img = (color.images && color.images.length > 0) ? color.images[0] : (color.featuredImage || color.image || null);
                      if (img) setHoveredColorImage(img);
                    }}
                    onMouseEnter={() => {
                      const img = (color.images && color.images.length > 0) ? color.images[0] : (color.featuredImage || color.image || null);
                      if (img) setHoveredColorImage(img);
                    }}
                    onMouseLeave={() => setHoveredColorImage(null)}
                    className={`rounded-full transition-transform duration-150 hover:scale-110 cursor-pointer ${
                      isCompact ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'
                    } ${
                      isWhite ? 'border border-black/25' : 'border border-black/10'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={color.colorName || color.color || `Cor ${idx + 1}`}
                    aria-label={color.colorName || color.color || `Cor ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Separador vertical fino */}
            <div className={`w-[1px] bg-[#D4D4D4] shrink-0 ${
              isCompact ? 'h-2.5 mx-1.5 sm:mx-2' : 'h-3 mx-2 sm:mx-2.5'
            }`} />

            {/* Quantidade de cores */}
            <span className={`font-sans font-normal text-[#333333] whitespace-nowrap truncate select-none ${
              isCompact ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-[11.5px]'
            }`}>
              {colorsCountText}
            </span>
          </div>

          {/* Lado Direito: CTA - Círculo preto com seta fina branca apontando para direita */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product.slug || product.id);
            }}
            className={`rounded-full bg-black hover:bg-zinc-800 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs shrink-0 group/cta ${
              isCompact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-9 h-9 sm:w-10 sm:h-10'
            }`}
            aria-label={`Ver detalhes de ${product.title}`}
            title="Ver produto"
          >
            <ArrowRight className={`text-white stroke-[1.4] transition-transform duration-200 group-hover/cta:translate-x-0.5 ${
              isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'
            }`} />
          </button>
        </div>
      </div>
    </article>
  );
};

export const ProductCard = memo(ProductCardComponent);
