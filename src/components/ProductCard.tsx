import React, { useState, memo, useCallback } from 'react';
import { Product } from '../types';
import { Heart, Eye, ShoppingBag, Check } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getValidProductImageUrl, handleProductImageError, getProductCardImageFraming } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onProductClick: (productId: string) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
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
  const installmentCount = 3;
  const installmentValue = effectivePrice / installmentCount;

  const handleQuickAddSize = useCallback((e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    const added = addToCart(product, size, product.colors[0], 1);
    if (added) {
      setAddedSize(size);
      setTimeout(() => setAddedSize(null), 1800);
    }
  }, [addToCart, product]);

  return (
    <article className="group relative flex flex-col bg-white border border-[#DCDCE0] rounded-[2px] overflow-hidden transition-[border-color,box-shadow] duration-200 hover:border-[#A1A1AA] hover:shadow-[0_12px_30px_rgba(24,24,27,0.07)]">
      {/* 1. Image Container with Aspect Ratio */}
      <div 
        className="relative aspect-[3/4] w-full bg-[#F4F4F5] overflow-hidden cursor-pointer"
        onClick={() => onProductClick(product.id)}
      >
        <img
          src={displayImage}
          alt={product.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full transition-transform duration-500 ease-out ${getProductCardImageFraming(product.category)}`}
          onError={(e) => handleProductImageError(e, product.category, product.id)}
          onMouseEnter={() => !hoveredColorImage && images.length > 1 && setCurrentImageIndex(1)}
          onMouseLeave={() => !hoveredColorImage && setCurrentImageIndex(0)}
        />

        {/* Minimalist Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isNewRelease && (
            <span className="bg-[#18181B] text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-[2px] tracking-wider">
              NOVO DROP
            </span>
          )}
          {product.promoPrice && (
            <span className="bg-[#DC2626] text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-[2px] tracking-wider">
              -{Math.round(((product.price - product.promoPrice) / product.price) * 100)}% OFF
            </span>
          )}
          {product.isBestSeller && !product.isNewRelease && (
            <span className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold text-[10px] uppercase px-2.5 py-1 rounded-[2px] tracking-wider">
              MAIS PROCURADO
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 z-20 p-2.5 rounded-full transition-all cursor-pointer ${
            isFavorite
              ? 'bg-[#18181B] text-[#F4C400] shadow-md'
              : 'bg-white/90 text-[#52525B] hover:bg-white hover:text-black shadow-sm'
          }`}
          aria-label="Favoritar produto"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Size Selector Overlay on Hover */}
        <div className="absolute bottom-3 left-3 right-3 z-20 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 space-y-2 pointer-events-none group-hover:pointer-events-auto">
          {/* Quick sizes pills */}
          <div className="bg-white/95 border border-[#D4D4D8] p-2 rounded-[2px] flex items-center justify-between gap-1 shadow-md">
            <span className="text-[10px] font-mono font-bold uppercase text-[#71717A] px-1 hidden sm:inline">
              Tam:
            </span>
            <div className="flex items-center justify-between flex-1 gap-1">
              {(product.sizes || ['P', 'M', 'G', 'GG']).slice(0, 5).map((sz) => (
                <button
                  key={sz}
                  onClick={(e) => handleQuickAddSize(e, sz)}
                  className={`flex-1 py-1 px-1.5 rounded-[2px] text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    addedSize === sz
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#F4F4F5] hover:bg-[#18181B] hover:text-white text-[#18181B]'
                  }`}
                  title={`Adicionar tamanho ${sz}`}
                >
                  {addedSize === sz ? <Check className="w-3 h-3 mx-auto" /> : sz}
                </button>
              ))}
            </div>
          </div>

          {/* Quick View Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="w-full bg-white/95 hover:bg-[#18181B] hover:text-white text-[#18181B] border border-[#D4D4D8] text-[11px] font-bold uppercase tracking-wider py-2 px-3 rounded-[2px] flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Espiada Rápida
          </button>
        </div>
      </div>

      {/* 2. Product Info Section */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 space-y-2">
        <div>
          {/* Collection / Subcategory */}
          <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] text-[#71717A] uppercase tracking-wider mb-0.5 font-mono">
            <span>{product.subcategory || product.collection}</span>
            {product.fabricWeight && (
              <span className="text-[#52525B] font-bold">{product.fabricWeight}</span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onProductClick(product.id)}
            className="text-xs sm:text-[13px] font-bold text-[#18181B] group-hover:text-[#B45309] transition-colors cursor-pointer line-clamp-2 min-h-[2.4em] leading-[1.25]"
          >
            {product.title}
          </h3>
        </div>

        {/* Price & Installments */}
        <div className="pt-1 border-t border-[#E4E4E7] space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[13.5px] sm:text-[15px] font-black text-[#18181B]">
              R$ {effectivePrice.toFixed(2).replace('.', ',')}
            </span>
            {product.promoPrice && (
              <span className="text-[11px] text-[#71717A] line-through">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <div className="text-[10.5px] sm:text-[11px] text-[#52525B] flex flex-col leading-[1.4]">
            <span>
              ou <strong>{installmentCount}x de R$ {installmentValue.toFixed(2).replace('.', ',')}</strong> sem juros
            </span>
            <span className="text-[#B45309] font-semibold">PIX ou cartão na InfinitePay</span>
          </div>

          {/* Color Indicators */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1.5">
              {product.colors.map((c, idx) => {
                const variantImg = (c.images && c.images.length > 0)
                  ? c.images[0]
                  : (c.featuredImage || c.image || null);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (variantImg) setHoveredColorImage(variantImg);
                    }}
                    onMouseEnter={() => {
                      if (variantImg) setHoveredColorImage(variantImg);
                    }}
                    onMouseLeave={() => {
                      setHoveredColorImage(null);
                    }}
                    className="w-3.5 h-3.5 rounded-full border border-[#D4D4D8] hover:scale-125 hover:border-black transition-transform duration-100 shadow-sm cursor-pointer"
                    style={{ backgroundColor: c.colorHex }}
                    title={c.colorName}
                  />
                );
              })}
              <span className="text-[10px] text-[#71717A] font-mono ml-1">
                {product.colors.length} {product.colors.length > 1 ? 'cores' : 'cor'}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export const ProductCard = memo(ProductCardComponent);

