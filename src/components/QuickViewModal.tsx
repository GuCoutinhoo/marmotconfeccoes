import React, { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { X, Heart, ShoppingBag, Check, ShieldCheck, Ruler } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { SizeGuideModal } from './SizeGuideModal';

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
    product.colors?.[0] || { colorName: 'Obsidian Black', color: 'black', colorHex: '#121212' }
  );

  // Dynamic gallery based on selected color
  const images = React.useMemo(() => {
    if (selectedColor?.images && Array.isArray(selectedColor.images) && selectedColor.images.length > 0) {
      return selectedColor.images;
    }
    if (selectedColor?.featuredImage || selectedColor?.image) {
      return [selectedColor.featuredImage || selectedColor.image!];
    }
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    if ((product as any).image) {
      return [(product as any).image];
    }
    return ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'];
  }, [selectedColor, product]);

  const [selectedImage, setSelectedImage] = useState<string>(images[0]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Reset selected image when color variant changes
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-4xl bg-white border border-[#E4E4E7] rounded-2xl text-[#18181B] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col md:flex-row">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-[#71717A] hover:text-[#18181B] bg-white/90 border border-[#E4E4E7] rounded-full transition-colors cursor-pointer shadow-sm"
            aria-label="Fechar espiada rápida"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Gallery */}
          <div className="w-full md:w-1/2 p-6 bg-[#F8F9FA] border-b md:border-b-0 md:border-r border-[#E4E4E7] flex flex-col justify-between">
            <div className="relative aspect-square rounded-xl overflow-hidden border border-[#E4E4E7] mb-4 bg-white shadow-xs">
              <img
                src={selectedImage || images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              {product.promoPrice && (
                <span className="absolute top-3 left-3 bg-[#F4C400] text-[#0B0B0E] text-[10px] font-black px-2.5 py-1 uppercase tracking-wider rounded shadow-xs">
                  OFF {Math.round(((product.price - product.promoPrice) / product.price) * 100)}%
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer ${
                      (selectedImage || images[0]) === img ? 'border-[#18181B] ring-2 ring-[#18181B]/20' : 'border-[#E4E4E7] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Info */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-[#71717A] mb-1">
                <span>{product.collection}</span>
                <span>•</span>
                <span className="text-[#B45309]">{product.category}</span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#18181B] mb-2">{product.title}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                {product.promoPrice ? (
                  <>
                    <span className="text-2xl font-black text-[#18181B]">
                      R$ {product.promoPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm text-[#71717A] line-through">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-[#18181B]">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <span className="text-xs text-[#71717A]">
                  ou 10x de R$ {(effectivePrice / 10).toFixed(2).replace('.', ',')}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed mb-6 whitespace-pre-line line-clamp-4">
                {product.description}
              </p>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-[#52525B] mb-2">
                    Cor: <span className="text-[#18181B] font-bold">{selectedColor.colorName}</span>
                  </p>
                  <div className="flex gap-2">
                    {(product.colors || []).map((c) => (
                      <button
                        key={c.colorName}
                        onClick={() => handleSelectColor(c)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          selectedColor.colorName === c.colorName
                            ? 'border-[#18181B] ring-2 ring-[#18181B]/30 scale-110'
                            : 'border-[#E4E4E7] hover:border-[#18181B]'
                        }`}
                        style={{ backgroundColor: c.colorHex }}
                        title={c.colorName}
                      >
                        {selectedColor.colorName === c.colorName && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold text-[#52525B]">Tamanho:</p>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[11px] text-[#B45309] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Ruler className="w-3 h-3" /> Guia de Medidas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['Único']).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-lg border cursor-pointer select-none touch-manipulation active:scale-95 transition-all duration-75 ${
                        selectedSize === sz
                          ? 'bg-[#18181B] text-white border-[#18181B]'
                          : 'bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B] active:bg-[#E4E4E7]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-[#E4E4E7]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#F4C400] text-[#0B0B0E] font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-[#E5B500] active:scale-95 transition-all duration-75 cursor-pointer select-none touch-manipulation flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" /> Adicionar ao Carrinho
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded-xl border transition-all duration-75 cursor-pointer select-none touch-manipulation active:scale-90 ${
                    isFavorite
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-white text-[#71717A] border-[#E4E4E7] hover:text-rose-600 hover:border-rose-200'
                  }`}
                  aria-label="Adicionar aos favoritos"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onViewFullDetails(product.id);
                }}
                className="w-full text-center text-xs text-[#71717A] hover:text-[#18181B] underline py-1 cursor-pointer"
              >
                Ver página completa do produto
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
