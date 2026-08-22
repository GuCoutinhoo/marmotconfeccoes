import React, { useState } from 'react';
import { Product } from '../types';
import { Heart, Eye, ShoppingBag, Check } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onProductClick: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart, openMiniCart } = useCart();
  const { showToast } = useToast();

  const isFavorite = isInWishlist(product.id);
  const images = (product.images && product.images.length > 0)
    ? product.images
    : [(product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'];
  const primaryImage = images[currentImageIndex] || images[0];
  const secondaryImage = images[1] || primaryImage;

  const effectivePrice = product.promoPrice || product.price;
  const installmentCount = 3;
  const installmentValue = effectivePrice / installmentCount;
  const pixPrice = effectivePrice * 0.95;

  const handleQuickAddSize = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    addToCart(product, size, product.colors[0], 1);
    setAddedSize(size);
    showToast(
      'Adicionado ao Carrinho',
      `${product.title} (Tam. ${size}) foi adicionado.`,
      'success'
    );
    setTimeout(() => setAddedSize(null), 1800);
  };

  return (
    <div className="group relative flex flex-col bg-[#141416] border border-[#242428] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#383840] hover:shadow-xl">
      {/* 1. Image Container with Aspect Ratio */}
      <div 
        className="relative aspect-[3/4] w-full bg-[#0D0D0E] overflow-hidden cursor-pointer"
        onClick={() => onProductClick(product.id)}
      >
        <img
          src={primaryImage}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          onMouseEnter={() => images.length > 1 && setCurrentImageIndex(1)}
          onMouseLeave={() => setCurrentImageIndex(0)}
        />

        {/* Minimalist Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isNewRelease && (
            <span className="bg-[#F4F4F5] text-[#0D0D0E] font-black text-[9px] uppercase px-2.5 py-1 rounded-md tracking-wider shadow-md">
              NOVO DROP
            </span>
          )}
          {product.promoPrice && (
            <span className="bg-[#991B1B] text-[#F4F4F5] font-black text-[9px] uppercase px-2.5 py-1 rounded-md tracking-wider shadow-md">
              -{Math.round(((product.price - product.promoPrice) / product.price) * 100)}% OFF
            </span>
          )}
          {product.isBestSeller && !product.isNewRelease && (
            <span className="bg-[#1F1F24] border border-[#3A3A42] text-[#C5A869] font-bold text-[9px] uppercase px-2.5 py-1 rounded-md tracking-wider shadow-md">
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
          className={`absolute top-3 right-3 z-20 p-2.5 rounded-full backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-[#C5A869] text-black shadow-md'
              : 'bg-black/40 text-[#F4F4F5] hover:bg-[#F4F4F5] hover:text-black'
          }`}
          aria-label="Favoritar produto"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Size Selector Overlay on Hover */}
        <div className="absolute bottom-3 left-3 right-3 z-20 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 space-y-2">
          {/* Quick sizes pills */}
          <div className="bg-[#141416]/95 backdrop-blur-md border border-[#2D2D34] p-2 rounded-xl flex items-center justify-between gap-1 shadow-lg">
            <span className="text-[9px] font-mono font-bold uppercase text-[#71717A] px-1 hidden sm:inline">
              Tam:
            </span>
            <div className="flex items-center justify-between flex-1 gap-1">
              {(product.sizes || ['P', 'M', 'G', 'GG']).slice(0, 5).map((sz) => (
                <button
                  key={sz}
                  onClick={(e) => handleQuickAddSize(e, sz)}
                  className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                    addedSize === sz
                      ? 'bg-emerald-500 text-black'
                      : 'bg-[#202024] hover:bg-[#C5A869] hover:text-black text-[#F4F4F5]'
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
            className="w-full bg-[#18181B]/90 hover:bg-[#222226] text-[#F4F4F5] border border-[#2D2D34] text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-lg backdrop-blur-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Espiada Rápida
          </button>
        </div>
      </div>

      {/* 2. Product Info Section */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3">
        <div>
          {/* Collection / Subcategory */}
          <div className="flex items-center justify-between text-[11px] text-[#71717A] uppercase tracking-wider mb-1 font-mono">
            <span>{product.subcategory || product.collection}</span>
            {product.fabricWeight && (
              <span className="text-[#A1A1AA] font-bold">{product.fabricWeight}</span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onProductClick(product.id)}
            className="text-xs sm:text-sm font-bold text-[#F4F4F5] group-hover:text-[#C5A869] transition-colors cursor-pointer line-clamp-1 leading-snug"
          >
            {product.title}
          </h3>
        </div>

        {/* Price & Installments */}
        <div className="pt-1 border-t border-[#242428]/60 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-black text-[#F4F4F5]">
              R$ {effectivePrice.toFixed(2).replace('.', ',')}
            </span>
            {product.promoPrice && (
              <span className="text-xs text-[#71717A] line-through">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <div className="text-[10px] text-[#A1A1AA] flex flex-col">
            <span>
              ou <strong>{installmentCount}x de R$ {installmentValue.toFixed(2).replace('.', ',')}</strong> sem juros
            </span>
            <span className="text-[#C5A869] font-medium">
              R$ {pixPrice.toFixed(2).replace('.', ',')} no PIX (5% OFF)
            </span>
          </div>

          {/* Color Indicators */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-2">
              {product.colors.map((c, idx) => (
                <span
                  key={idx}
                  className="w-2.5 h-2.5 rounded-full border border-[#3A3A42] inline-block shadow-sm"
                  style={{ backgroundColor: c.colorHex }}
                  title={c.colorName}
                />
              ))}
              <span className="text-[9px] text-[#71717A] font-mono ml-1">
                {product.colors.length} {product.colors.length > 1 ? 'cores' : 'cor'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
