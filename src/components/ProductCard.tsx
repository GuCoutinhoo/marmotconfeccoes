import React, { useState, memo, useCallback } from 'react';
import { Product } from '../types';
import { Eye, Check, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getValidProductImageUrl, handleProductImageError, getProductCardImageFraming } from '../utils/imageUtils';
import { MarmotPrice, MarmotBadge, MarmotFavoriteButton, MarmotColorSwatches } from './ui/MarmotElements';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onProductClick: (productId: string) => void;
  priorityBadge?: string;
  variant?: 'standard' | 'editorial';
  hideNewReleaseBadge?: boolean;
  editorialIndex?: number;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
  priorityBadge,
  variant = 'standard',
  hideNewReleaseBadge = false,
  editorialIndex,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredColorImage, setHoveredColorImage] = useState<string | null>(null);
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

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
  const pixPrice = effectivePrice * 0.95;
  const installmentValue = effectivePrice / 6;

  const handleQuickAddSize = useCallback((e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    const added = addToCart(product, size, product.colors[0], 1);
    if (added) {
      setAddedSize(size);
      setTimeout(() => setAddedSize(null), 1600);
    }
  }, [addToCart, product]);

  // Unified single-badge priority logic to eliminate clutter
  const discountPercent = product.promoPrice && product.price > product.promoPrice
    ? Math.round(((product.price - product.promoPrice) / product.price) * 100)
    : null;

  const isEditorial = variant === 'editorial';

  return (
    <article
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col bg-white rounded-[3px] overflow-hidden transition-all duration-300 select-none ${
        isEditorial
          ? 'border border-[#E4E1D8] hover:border-[#0B0B0E] shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_22px_44px_rgba(0,0,0,0.12)]'
          : 'border border-zinc-200/90 hover:border-[#0B0B0E] hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]'
      }`}
    >
      {/* Linha de Destaque Amarela na Parte de Baixo no Hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-[#F4C400] transition-colors duration-300 z-30 pointer-events-none" />

      {/* 1. Image Container (Vertical Editorial Ratio 3:4) */}
      <div 
        className={`relative aspect-[3/4] w-full overflow-hidden cursor-pointer ${
          isEditorial ? 'bg-[#EFECE6] border-b border-[#E6E3DB]' : 'bg-[#F4F4F5]'
        }`}
        onClick={() => onProductClick(product.id)}
      >
        <img
          src={displayImage}
          alt={product.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.03] ${getProductCardImageFraming(product.category)}`}
          onError={(e) => handleProductImageError(e, product.category, product.id)}
          onMouseEnter={() => !hoveredColorImage && images.length > 1 && setCurrentImageIndex(1)}
          onMouseLeave={() => !hoveredColorImage && setCurrentImageIndex(0)}
        />

        {/* Top Badges (Curated, editorial index + status) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
          {isEditorial ? (
            <>
              {editorialIndex !== undefined && (
                <div className="flex items-center gap-1 bg-[#0B0B0E]/90 text-white backdrop-blur-xs px-2 py-0.5 rounded-[2px] border border-black/20 shadow-2xs font-mono text-[10px] font-bold tracking-[0.16em]">
                  <span className="text-[#F4C400] text-[11px] font-black">
                    {editorialIndex < 10 ? `0${editorialIndex}` : editorialIndex}
                  </span>
                  <span className="text-zinc-500 font-light">//</span>
                  <span className="text-zinc-300 text-[8.5px] tracking-[0.2em]">DROP</span>
                </div>
              )}
              {priorityBadge ? (
                <MarmotBadge variant="rank">{priorityBadge}</MarmotBadge>
              ) : discountPercent ? (
                <span className="inline-flex items-center justify-center h-[20px] px-2 text-[9.5px] font-mono font-bold uppercase tracking-[0.14em] rounded-[2px] bg-[#0B0B0E] text-[#F4C400] border border-[#0B0B0E] shadow-2xs">
                  -{discountPercent}%
                </span>
              ) : null}
            </>
          ) : (
            <>
              {priorityBadge ? (
                <MarmotBadge variant="rank">{priorityBadge}</MarmotBadge>
              ) : discountPercent ? (
                <MarmotBadge variant="sale">-{discountPercent}% OFF</MarmotBadge>
              ) : (!hideNewReleaseBadge && product.isNewRelease) ? (
                <MarmotBadge variant="new">NOVO DROP</MarmotBadge>
              ) : product.isBestSeller ? (
                <MarmotBadge variant="limited">MAIS BUSCADO</MarmotBadge>
              ) : null}
            </>
          )}
        </div>

        {/* Favorite Button (Refined, discrete circle with Marmot hover) */}
        <div className="absolute top-3 right-3 z-20">
          <MarmotFavoriteButton
            isFavorite={isFavorite}
            onClick={() => toggleWishlist(product)}
            size="md"
            className={isEditorial ? 'bg-white/90 hover:bg-[#0B0B0E] text-zinc-700 hover:text-[#F4C400] border border-black/10 hover:border-[#0B0B0E] shadow-2xs' : ''}
          />
        </div>

        {/* Quick Interaction Bar (Slides up seamlessly on hover) */}
        <div className="absolute bottom-3 left-3 right-3 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250 ease-out space-y-1.5 pointer-events-none group-hover:pointer-events-auto">
          {/* Quick Sizes Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className={`p-1.5 rounded-[2px] flex items-center justify-between gap-1 shadow-md backdrop-blur-xs ${
              isEditorial ? 'bg-[#0B0B0E]/95 border border-zinc-700' : 'bg-white/95 border border-zinc-200/90'
            }`}>
              <div className="flex items-center justify-between w-full gap-1">
                {product.sizes.slice(0, 5).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => handleQuickAddSize(e, sz)}
                    className={`flex-1 py-1 px-1 rounded-[2px] text-[9.5px] font-mono font-bold uppercase transition-all duration-150 cursor-pointer ${
                      isEditorial
                        ? addedSize === sz
                          ? 'bg-[#F4C400] text-[#0B0B0E]'
                          : 'bg-zinc-800 hover:bg-[#F4C400] hover:text-[#0B0B0E] text-zinc-100'
                        : addedSize === sz
                          ? 'bg-[#0B0B0E] text-[#F4C400]'
                          : 'bg-zinc-100 hover:bg-[#0B0B0E] hover:text-white text-zinc-900'
                    }`}
                    title={`Adicionar tamanho ${sz}`}
                  >
                    {addedSize === sz ? <Check className={`w-3 h-3 mx-auto ${isEditorial ? 'text-[#0B0B0E] stroke-[3]' : ''}`} /> : sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick View Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className={`w-full text-[10.5px] font-bold uppercase tracking-[0.16em] py-2 px-3 rounded-[2px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer group/qv ${
              isEditorial
                ? 'bg-white hover:bg-[#0B0B0E] text-[#0B0B0E] hover:text-[#F4C400] border border-zinc-300 hover:border-[#0B0B0E]'
                : 'bg-white/95 hover:bg-[#0B0B0E] hover:text-white text-[#0B0B0E] border border-zinc-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5 group-hover/qv:text-[#F4C400] transition-colors" />
            <span>Espiada Rápida</span>
          </button>
        </div>
      </div>

      {/* 2. Product Info (Consistent Editorial Layout) */}
      <div className={`flex flex-col justify-between flex-1 ${isEditorial ? 'bg-[#FAF9F6] p-4 sm:p-5 gap-3.5 relative' : 'p-3.5 sm:p-4 gap-2.5'}`}>
        <div className="space-y-1.5">
          {/* Editorial Micro-Label (Category + Weight + Yellow Atelier Accent) */}
          <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[10.5px] text-zinc-400 uppercase tracking-[0.2em] font-mono leading-none">
            <div className="flex items-center gap-2 min-w-0">
              {isEditorial && (
                <div className="w-3.5 h-[2px] bg-[#F4C400] shrink-0 rounded-full" />
              )}
              <span className={`truncate ${isEditorial ? 'font-bold text-zinc-500 tracking-[0.22em]' : ''}`}>
                {product.subcategory || product.category}
              </span>
            </div>
            {product.fabricWeight && (
              <span className={`shrink-0 ${
                isEditorial 
                  ? 'font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500 bg-black/5 border border-black/5 px-1.5 py-0.5 rounded-[2px]'
                  : 'text-zinc-500 font-medium ml-1.5'
              }`}>
                {product.fabricWeight}
              </span>
            )}
          </div>

          {/* Product Title (More prominent, strong typography) */}
          <h3
            onClick={() => onProductClick(product.id)}
            className={`font-black uppercase tracking-tight text-[#0B0B0E] group-hover:text-zinc-700 transition-colors cursor-pointer line-clamp-2 leading-[1.25] ${
              isEditorial
                ? 'text-[15px] sm:text-[16px] min-h-[2.5em] pt-0.5 tracking-[-0.02em]'
                : 'text-[13px] sm:text-[14px] min-h-[2.4em]'
            }`}
          >
            {product.title}
          </h3>
        </div>

        {/* Price Block & Color Swatches */}
        <div className={`pt-3 ${isEditorial ? 'border-t border-[#EAE7DF] space-y-2.5' : 'border-t border-zinc-100/90 space-y-2'}`}>
          {isEditorial ? (
            <div className="flex flex-col gap-1">
              {/* Primary Price + Strikethrough if on promo */}
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] sm:text-[19px] font-black text-[#0B0B0E] tracking-tight leading-none">
                  R$ {effectivePrice.toFixed(2).replace('.', ',')}
                </span>
                {product.promoPrice && product.price > product.promoPrice && (
                  <span className="text-xs text-zinc-400 line-through font-mono font-normal">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {/* PIX with clear atelier benefit */}
              <div className="text-[11.5px] sm:text-[12px] font-medium text-zinc-700 flex items-center gap-1.5">
                <span className="text-[#0B0B0E] font-bold">R$ {pixPrice.toFixed(2).replace('.', ',')}</span>
                <span className="text-zinc-300">•</span>
                <span className="inline-flex items-center gap-1 text-[#8A5E00] font-bold text-[10px] uppercase tracking-wider bg-[#FEF9C3] border border-[#FDE047]/60 px-1.5 py-0.5 rounded-[2px]">
                  <span className="w-1 h-1 bg-[#F4C400] rounded-full" />
                  5% no PIX
                </span>
              </div>

              {/* Installment subtle and secondary */}
              <p className="text-[10.5px] font-mono text-zinc-400 font-normal">
                ou 6x de R$ {installmentValue.toFixed(2).replace('.', ',')} sem juros
              </p>
            </div>
          ) : (
            <MarmotPrice
              price={effectivePrice}
              originalPrice={product.promoPrice ? product.price : undefined}
              size="sm"
            />
          )}

          {/* Color Indicators + Atelier Circle Arrow for Editorial */}
          <div className="flex items-center justify-between pt-0.5">
            {product.colors && product.colors.length > 0 ? (
              <MarmotColorSwatches
                colors={product.colors}
                onSelectColor={(c) => {
                  const img = (c.images && c.images.length > 0) ? c.images[0] : (c.featuredImage || c.image || null);
                  if (img) setHoveredColorImage(img);
                }}
                onHoverColor={(c) => {
                  if (c) {
                    const img = (c.images && c.images.length > 0) ? c.images[0] : (c.featuredImage || c.image || null);
                    if (img) setHoveredColorImage(img);
                  } else {
                    setHoveredColorImage(null);
                  }
                }}
              />
            ) : <div />}

            {/* Marmot Circular Arrow Button (matching CategoryNavigationGrid) */}
            {isEditorial && (
              <button
                type="button"
                onClick={() => onProductClick(product.id)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-300 bg-white group-hover:border-[#0B0B0E] group-hover:bg-[#0B0B0E] text-zinc-700 group-hover:text-[#F4C400] flex items-center justify-center transition-all duration-300 cursor-pointer shadow-2xs shrink-0"
                aria-label="Ver detalhes do produto"
                title="Ver detalhes do produto"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[2] transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export const ProductCard = memo(ProductCardComponent);
