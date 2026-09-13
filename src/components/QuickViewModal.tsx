import React, { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { X, Heart, ShoppingBag, Check, Ruler } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { SizeGuideModal } from './SizeGuideModal';
import { getValidProductImageUrl, handleProductImageError, getProductCardImageFraming } from '../utils/imageUtils';
import { MarmotPrice, MarmotBadge } from './ui/MarmotElements';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullDetails: (productId: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onViewFullDetails,
}) => {
  if (!isOpen || !product) return null;

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<ProductVariant>(
    product.colors?.[0] || { colorName: 'Preto Ônix', color: 'black', colorHex: '#121212' }
  );

  // Dynamic gallery based on selected color
  const images = React.useMemo(() => {
    let rawList: string[] = [];
    const primaryProductImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');

    if (selectedColor?.images && Array.isArray(selectedColor.images) && selectedColor.images.length > 0) {
      rawList = selectedColor.images;
    } else if (selectedColor?.featuredImage || selectedColor?.image) {
      rawList = [selectedColor.featuredImage || selectedColor.image!];
    } else if (product.images && product.images.length > 0) {
      rawList = primaryProductImage && product.images[0] !== primaryProductImage
        ? [primaryProductImage, ...product.images.filter((x) => x !== primaryProductImage)]
        : product.images;
    } else if (primaryProductImage) {
      rawList = [primaryProductImage];
    }

    if (rawList.length === 0) {
      return [getValidProductImageUrl(null, product.category, product.id)];
    }

    return rawList.map((img, idx) =>
      getValidProductImageUrl(img, product.category, `${product.id}-${idx}`)
    );
  }, [selectedColor, product]);

  const [selectedImage, setSelectedImage] = useState<string>(images[0]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const handleSelectColor = (c: ProductVariant) => {
    setSelectedColor(c);
    const variantImgs = (c.images && c.images.length > 0)
      ? c.images
      : (c.featuredImage ? [c.featuredImage] : (c.image ? [c.image] : product.images || []));
    setSelectedImage(variantImgs[0] || images[0]);
  };

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorite = isInWishlist(product.id);
  const effectivePrice = product.promoPrice || product.price;

  const handleAddToCart = () => {
    const success = addToCart(product, selectedSize, selectedColor, 1);
    if (success) {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
        <div className="relative w-full max-w-4xl bg-white border border-zinc-200/90 rounded-[2px] text-[#0B0B0E] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col md:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 p-2 text-zinc-500 hover:text-[#0B0B0E] bg-white/90 border border-zinc-200 rounded-full transition-colors cursor-pointer shadow-2xs"
            aria-label="Fechar espiada rápida"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Gallery */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 bg-[#FAFAFA] border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col justify-between">
            <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-[2px] overflow-hidden border border-zinc-200 mb-3 bg-[#111113]">
              <img
                src={selectedImage || images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                onError={(e) => handleProductImageError(e, product.category, product.id)}
                className={`w-full h-full object-cover object-top select-none ${getProductCardImageFraming(product.category)}`}
              />
              {product.promoPrice && (
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MarmotBadge variant="sale">
                    OFF {Math.round(((product.price - product.promoPrice) / product.price) * 100)}%
                  </MarmotBadge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-14 h-16 sm:w-16 sm:h-20 rounded-[2px] border overflow-hidden shrink-0 transition-all cursor-pointer bg-zinc-100 ${
                      (selectedImage || images[0]) === img ? 'border-[#0B0B0E] shadow-xs' : 'border-zinc-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => handleProductImageError(e, product.category, `${product.id}-${idx}`)}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Info */}
          <div className="w-full md:w-1/2 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                <span>{product.collection || 'DROP 003'}</span>
                <span>•</span>
                <span>{product.category}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#0B0B0E] leading-tight mb-2.5">
                {product.title}
              </h2>

              {/* Price */}
              <div className="mb-4">
                <MarmotPrice
                  price={effectivePrice}
                  originalPrice={product.promoPrice ? product.price : undefined}
                  size="md"
                />
              </div>

              <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed mb-5 line-clamp-3">
                {product.description}
              </p>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600 mb-2">
                    COR: <span className="text-[#0B0B0E] font-sans font-bold">{selectedColor.colorName || selectedColor.color}</span>
                  </p>
                  <div className="flex gap-2">
                    {product.colors.map((c) => {
                      const isSelected = (selectedColor.colorHex || selectedColor.color) === (c.colorHex || c.color);
                      return (
                        <button
                          key={c.colorHex || c.colorName || c.color}
                          type="button"
                          onClick={() => handleSelectColor(c)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0B0B0E] scale-105'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.colorHex }}
                          title={c.colorName || c.color}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white drop-shadow-xs" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600">TAMANHO:</p>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs text-[#0B0B0E] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Ruler className="w-3 h-3" /> Guia de Medidas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['P', 'M', 'G', 'GG']).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`w-9 h-9 text-xs font-mono font-bold rounded-[2px] border cursor-pointer transition-all ${
                        selectedSize === sz
                          ? 'bg-[#0B0B0E] text-[#F4C400] border-[#0B0B0E]'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-[#0B0B0E] hover:text-[#0B0B0E]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-4 border-t border-zinc-200">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-black text-xs uppercase tracking-[0.14em] py-3.5 px-4 rounded-[2px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar ao Carrinho</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`p-3.5 rounded-[2px] border transition-all cursor-pointer ${
                    isFavorite
                      ? 'bg-[#0B0B0E] text-[#F4C400] border-[#0B0B0E]'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-[#0B0B0E] hover:text-[#0B0B0E]'
                  }`}
                  aria-label="Adicionar aos favoritos"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewFullDetails(product.id);
                }}
                className="w-full text-center text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-[#0B0B0E] py-1 cursor-pointer transition-colors"
              >
                Ver página completa do produto →
              </button>
            </div>
          </div>
        </div>
      </div>

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
      />
    </>
  );
};
