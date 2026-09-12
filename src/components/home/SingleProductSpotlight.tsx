import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { ShoppingBag, Star, ShieldCheck, Sparkles, ArrowRight, Eye, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { getValidProductImageUrl, handleProductImageError } from '../../utils/imageUtils';

interface SingleProductSpotlightProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const SingleProductSpotlight: React.FC<SingleProductSpotlightProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const { addToCart, openMiniCart } = useCart();
  const { showToast } = useToast();

  // Priority: Jaqueta Varsity Oversized as requested by the user
  const product = products.find((p) => p.slug === 'jaqueta-varsity-oversized')
    || products.find((p) => p.title.toLowerCase().includes('varsity') && p.category === 'jaquetas')
    || products.find((p) => p.slug.includes('varsity'))
    || products.find((p) => p.category === 'jaquetas' && (p.isBestSeller || p.isNewRelease))
    || products.find((p) => p.category === 'jaquetas')
    || products[0];

  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.[0] || { colorName: 'Preto Ônix', color: 'black', colorHex: '#121212' }
  );
  const [added, setAdded] = useState(false);

  // Synchronize size and color whenever the featured product changes
  useEffect(() => {
    if (product) {
      if (product.sizes?.length) {
        setSelectedSize(product.sizes[0]);
      }
      if (product.colors?.length) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product?.id]);

  if (!product) return null;

  // Use the color-specific image if available, else standard product images
  const rawProductImage = selectedColor?.image || selectedColor?.featuredImage || product.images?.[0] || product.image;
  const productImage = getValidProductImageUrl(rawProductImage, product.category, product.id);

  const handleAddToCart = () => {
    const success = addToCart(product, selectedSize, selectedColor);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  const effectivePrice = product.promoPrice || product.price;

  return (
    <section className="py-7 sm:py-8 lg:py-9 bg-[#F8F9FA] border-b border-[#E4E4E7] relative overflow-hidden">
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[#B45309]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DESTAQUE DE ATELIÊ // SIGNATURE PIECE</span>
          </div>
          <span className="text-[11px] font-mono text-[#71717A] uppercase">
            SKU #{product.sku || 'MM-JAQ-017'}
          </span>
        </div>

        {/* Split Layout: Image Left | Details Right */}
        <div className="bg-white border border-[#DCDCE0] rounded-[3px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-xs">
          {/* Left Side: Product Image fills the full height and width of the left section */}
          <div className="lg:col-span-5 relative w-full h-[460px] sm:h-[540px] lg:h-auto min-h-[460px] sm:min-h-[540px] lg:min-h-full bg-[#18181B] border-b lg:border-b-0 lg:border-r border-[#DCDCE0] group overflow-hidden flex flex-col">
            <img
              src={productImage}
              alt={product.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top sm:object-center group-hover:scale-105 transition-transform duration-700 select-none flex-1"
              onError={(e) => handleProductImageError(e, product.category, product.id)}
            />
            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
              <span className="bg-[#18181B]/95 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-[2px] tracking-wider shadow-sm backdrop-blur-sm">
                {product.category === 'jaquetas' ? 'OUTERWEAR ATELIER 2026' : 'SIGNATURE PIECE'}
              </span>
              <span className="bg-[#F4C400] text-[#0B0B0E] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-[2px] tracking-wider w-fit shadow-sm">
                MODELAGEM OVERSIZED
              </span>
            </div>

            <button
              onClick={() => onQuickView(product)}
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-[#18181B] hover:text-white border border-[#DCDCE0] text-[#18181B] px-3 py-1.5 rounded-[2px] backdrop-blur-md transition-colors flex items-center gap-1.5 text-[11px] font-bold uppercase cursor-pointer shadow-sm z-10"
            >
              <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Espiada Rápida</span>
            </button>
          </div>

          {/* Right Side: Product Details & Purchase CTA matching exact layout */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-9 xl:p-10 flex flex-col justify-between">
            <div>
              {/* Category Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase tracking-wider mb-2">
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.subcategory}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-[#18181B] leading-tight mb-2">
                {product.title}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex text-[#D97706] gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 5) ? 'fill-current' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-[#18181B]">{(product.rating || 5.0).toFixed(1)}</span>
                <span className="text-sm text-[#71717A]">({product.reviewCount || 30} avaliações verificadas)</span>
              </div>

              {/* Description Lines */}
              <div className="space-y-1.5 text-[13px] sm:text-sm text-[#52525B] font-medium mb-6">
                {product.description
                  .split('\n')
                  .filter(Boolean)
                  .map((line, idx) => (
                    <p key={idx} className="leading-snug">{line}</p>
                  ))}
              </div>

              {/* Key Specs Card */}
              <div className="border border-[#DCDCE0] rounded-[2px] p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white mb-6">
                <div>
                  <span className="text-[#71717A] text-[10px] uppercase font-bold tracking-wider block mb-1">
                    Construção
                  </span>
                  <span className="font-bold text-[#18181B] text-sm block">
                    {product.category === 'jaquetas' ? 'Mangas Contrastantes & Punhos Listrados' : '400g/m² Heavyweight'}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A] text-[10px] uppercase font-bold tracking-wider block mb-1">
                    Modelagem
                  </span>
                  <span className="font-bold text-[#18181B] text-sm block">
                    {product.category === 'jaquetas' ? 'Varsity Oversized Boxy' : 'Oversized Estruturado'}
                  </span>
                </div>
              </div>

              {/* Price Box */}
              <div className="flex items-baseline flex-wrap gap-3 mb-5">
                <span className="text-2xl sm:text-3xl font-black text-[#18181B]">
                  R$ {effectivePrice.toFixed(2).replace('.', ',')}
                </span>
                {product.promoPrice && (
                  <span className="text-sm font-bold text-[#71717A] line-through">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <span className="text-xs text-[#B45309] font-mono font-bold">
                  PIX ou cartão na InfinitePay
                </span>
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-5">
                  <label className="text-xs font-bold uppercase text-[#18181B] block mb-2">
                    Cor: <span className="font-bold">{selectedColor?.colorName || selectedColor?.color}</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.colors.map((c) => {
                      const isSelected = (selectedColor?.colorHex || selectedColor?.color) === (c.colorHex || c.color);
                      return (
                        <button
                          key={c.colorHex || c.colorName || c.color}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          title={c.colorName || c.color}
                          className={`h-9 px-3.5 rounded-[2px] text-xs font-bold uppercase transition-all flex items-center gap-2 border cursor-pointer ${
                            isSelected
                              ? 'bg-[#18181B] text-white border-[#18181B] shadow-sm font-black'
                              : 'bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: c.colorHex || '#121212' }}
                          />
                          <span>{c.colorName || c.color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase text-[#18181B] block mb-2">
                  Selecione o Tamanho: <span className="font-bold">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['P', 'M', 'G', 'GG', 'XG']).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`w-10 h-10 rounded-[2px] text-xs font-bold uppercase transition-colors border cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-[#18181B] text-white border-[#18181B] shadow-sm font-black'
                          : 'bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 sm:py-4 px-6 rounded-[2px] font-black text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2.5 cursor-pointer ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500]'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" /> ADICIONADO AO CARRINHO!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 stroke-[2.5]" /> ADICIONAR AO CARRINHO
                    </>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('product', product.id)}
                  className="py-3.5 sm:py-4 px-6 rounded-[2px] bg-white border border-[#DCDCE0] text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#18181B] font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  Ver Detalhes <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Guarantee Banner */}
            <div className="flex items-center gap-2 text-xs text-[#71717A] pt-3">
              <ShieldCheck className="w-4 h-4 text-[#B45309] shrink-0" />
              <span>Garantia de caimento autoral • Troca grátis em até 30 dias • Envio direto de São Paulo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

