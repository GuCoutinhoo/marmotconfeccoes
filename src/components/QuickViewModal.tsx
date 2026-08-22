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

  const images = (product.images && product.images.length > 0)
    ? product.images
    : [(product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'];

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<ProductVariant>(product.colors?.[0] || { colorName: 'Obsidian Black', color: 'black', colorHex: '#121212' });
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-4xl bg-[#161616] border border-[#262626] rounded-xl text-[#EFECE6] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col md:flex-row">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-[#777777] hover:text-[#EFECE6] bg-[#080808] border border-[#262626] rounded-full transition-colors"
            aria-label="Fechar espiada rápida"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Gallery */}
          <div className="w-full md:w-1/2 p-6 bg-[#080808] flex flex-col justify-between">
            <div className="relative aspect-square rounded-lg overflow-hidden border border-[#262626] mb-4 bg-black/40">
              <img
                src={selectedImage || images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              {product.promoPrice && (
                <span className="absolute top-3 left-3 bg-[#D6B35A] text-black text-[10px] font-black px-2.5 py-1 uppercase tracking-wider rounded">
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
                    className={`relative w-16 h-16 rounded border overflow-hidden shrink-0 transition-all ${
                      (selectedImage || images[0]) === img ? 'border-[#D6B35A] ring-1 ring-[#D6B35A]' : 'border-[#262626] opacity-60 hover:opacity-100'
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
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-[#777777] mb-1">
                <span>{product.collection}</span>
                <span>•</span>
                <span className="text-[#D6B35A]">{product.category}</span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#EFECE6] mb-2">{product.title}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                {product.promoPrice ? (
                  <>
                    <span className="text-2xl font-black text-[#D6B35A]">
                      R$ {product.promoPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm text-[#777777] line-through">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-[#EFECE6]">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <span className="text-xs text-[#777777]">
                  ou 10x de R$ {(effectivePrice / 10).toFixed(2).replace('.', ',')}
                </span>
              </div>

              <p className="text-xs text-[#777777] leading-relaxed mb-6 line-clamp-3">
                {product.description}
              </p>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-[#777777] mb-2">
                    Cor: <span className="text-[#EFECE6] font-bold">{selectedColor.colorName}</span>
                  </p>
                  <div className="flex gap-2">
                    {(product.colors || []).map((c) => (
                      <button
                        key={c.colorName}
                        onClick={() => setSelectedColor(c)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor.colorName === c.colorName
                            ? 'border-[#D6B35A] ring-2 ring-[#D6B35A]/40 scale-110'
                            : 'border-[#262626] hover:border-[#EFECE6]'
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
                  <p className="text-xs font-semibold text-[#777777]">Tamanho:</p>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[11px] text-[#D6B35A] hover:underline flex items-center gap-1 font-semibold"
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
                      className={`px-3.5 py-2 text-xs font-bold rounded border cursor-pointer select-none touch-manipulation active:scale-95 transition-all duration-75 ${
                        selectedSize === sz
                          ? 'bg-[#D6B35A] text-black border-[#D6B35A]'
                          : 'bg-[#080808] text-[#777777] border-[#262626] hover:border-[#D6B35A] hover:text-[#EFECE6] active:bg-[#1a1a1a]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-[#262626]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#D6B35A] text-black font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded hover:bg-[#EFECE6] active:bg-white active:scale-95 transition-all duration-75 cursor-pointer select-none touch-manipulation flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Adicionar ao Carrinho
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded border transition-all duration-75 cursor-pointer select-none touch-manipulation active:scale-90 ${
                    isFavorite
                      ? 'bg-[#D6B35A] text-black border-[#D6B35A]'
                      : 'bg-[#080808] text-[#777777] border-[#262626] hover:text-[#EFECE6] active:bg-[#262626]'
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
                className="w-full text-center text-xs text-[#777777] hover:text-[#EFECE6] underline py-1"
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
