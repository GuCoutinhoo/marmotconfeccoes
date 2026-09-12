import React, { useState, memo } from 'react';
import { Product } from '../types';
import { Heart, Eye, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { getValidProductImageUrl, handleProductImageError, getProductCardImageFraming } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onProductClick: (productId: string) => void;
  rankingIndex?: number;
  totalRanking?: number;
  showCategory?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
  rankingIndex,
  totalRanking,
  showCategory = true,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredColorImage, setHoveredColorImage] = useState<string | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist();

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

  return (
    <article className="group relative flex flex-col bg-white rounded-[2px] transition-all duration-300">
      {/* 1. Image Container with Clean Editorial Aspect Ratio */}
      <div 
        className="relative aspect-[3/4] w-full bg-[#F5F5F7] rounded-[2px] overflow-hidden cursor-pointer border border-[#EAEAEF] group-hover:border-[#C4C4CA] transition-colors duration-300"
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

        {/* Top-Left: Editorial Ranking Tag OR Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-20 pointer-events-none">
          {rankingIndex !== undefined ? (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-[#18181B] font-mono text-[10px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-[1px] border border-zinc-200/90 shadow-2xs tracking-widest">
              <span className="text-[#B45309] font-black">Nº</span>
              <span>{String(rankingIndex).padStart(2, '0')}</span>
              {totalRanking && (
                <span className="text-zinc-400 font-normal">/ {String(totalRanking).padStart(2, '0')}</span>
              )}
            </div>
          ) : (
            <>
              {product.isNewRelease && (
                <span className="bg-[#18181B] text-white font-mono text-[9px] sm:text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-[1px] tracking-wider shadow-2xs">
                  NOVO DROP
                </span>
              )}
              {product.isBestSeller && !product.isNewRelease && (
                <span className="bg-white/95 text-[#92400E] border border-[#FDE68A] font-mono text-[9px] sm:text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-[1px] tracking-wider shadow-2xs">
                  DESTAQUE
                </span>
              )}
            </>
          )}

          {/* Promo Badge if present */}
          {product.promoPrice && (
            <span className="bg-[#18181B] text-[#F4C400] font-mono text-[9px] sm:text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-[1px] tracking-wider shadow-2xs">
              -{Math.round(((product.price - product.promoPrice) / product.price) * 100)}%
            </span>
          )}
        </div>

        {/* Top-Right: Refined & Discreet Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isFavorite
              ? 'bg-[#18181B] text-[#F4C400] shadow-sm scale-105'
              : 'bg-white/80 hover:bg-white text-zinc-500 hover:text-black backdrop-blur-xs shadow-2xs opacity-85 hover:opacity-100 hover:scale-105'
          }`}
          aria-label="Favoritar produto"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : 'stroke-[1.75]'}`} />
        </button>

        {/* Bottom Overlay: Subtle & Elegant Quick Action Bar on Hover */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product.id);
            }}
            className="flex-1 py-2 px-3 bg-[#18181B]/95 hover:bg-[#18181B] text-white text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider rounded-[1px] transition-colors flex items-center justify-center gap-1.5 backdrop-blur-xs shadow-sm cursor-pointer"
          >
            <span>Ver Peça</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            title="Espiada rápida"
            className="w-8 h-8 bg-white/95 hover:bg-white text-zinc-800 hover:text-black rounded-[1px] transition-colors flex items-center justify-center shrink-0 backdrop-blur-xs shadow-sm border border-zinc-200/80 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Product Info Section - High Perceived Value & Radical Simplicity */}
      <div className="pt-3 pb-1 sm:pt-3.5 flex flex-col justify-between flex-1">
        <div>
          {/* Subtle Category */}
          {showCategory && (product.subcategory || product.category) && (
            <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 block mb-1">
              {product.subcategory || product.category}
            </span>
          )}

          {/* Product Title - Primary Focus */}
          <h3
            onClick={() => onProductClick(product.id)}
            className="text-[13px] sm:text-[14px] font-bold text-[#18181B] group-hover:text-black transition-colors cursor-pointer leading-snug line-clamp-1"
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        {/* Price & Colors - Clean Bottom Alignment */}
        <div className="mt-2.5 pt-2 flex items-center justify-between gap-2 border-t border-zinc-100/90">
          {/* Strong, Legible Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] sm:text-[15px] font-black tracking-tight text-[#18181B]">
              R$ {effectivePrice.toFixed(2).replace('.', ',')}
            </span>
            {product.promoPrice && (
              <span className="text-[11px] text-zinc-400 line-through font-medium">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Clean Color Dots with Tooltip */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center -space-x-1">
                {product.colors.slice(0, 3).map((c, idx) => {
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
                      className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-zinc-300 hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs"
                      style={{ backgroundColor: c.colorHex }}
                      title={c.colorName}
                    />
                  );
                })}
              </div>
              {product.colors.length > 3 && (
                <span className="text-[9.5px] text-zinc-400 font-mono font-medium pl-1">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export const ProductCard = memo(ProductCardComponent);

