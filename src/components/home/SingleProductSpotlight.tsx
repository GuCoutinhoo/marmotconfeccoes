import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { ShoppingBag, Star, ShieldCheck, Sparkles, ArrowRight, Eye, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { getValidProductImageUrl, handleProductImageError } from '../../utils/imageUtils';
import { MarmotPrice, MarmotBadge } from '../ui/MarmotElements';

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
  const { addToCart } = useCart();
  const { showToast } = useToast();

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

  const rawProductImage = selectedColor?.image || selectedColor?.featuredImage || product.images?.[0] || product.image;
  const productImage = getValidProductImageUrl(rawProductImage, product.category, product.id);

  const handleAddToCart = () => {
    const success = addToCart(product, selectedSize, selectedColor);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    }
  };

  const effectivePrice = product.promoPrice || product.price;

  return (
    <section className="py-10 sm:py-12 lg:py-14 bg-[#FAFAFA] border-b border-zinc-200/90 select-none overflow-hidden relative">
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        {/* Top Header info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
            <span className="text-[10px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-500">
              DESTAQUE DE ATELIÊ // SIGNATURE PIECE
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest hidden sm:inline">
            SKU #{product.sku || 'MM-JAQ-017'}
          </span>
        </div>

        {/* Split Architectural Container: Image Left | Details Right */}
        <div className="bg-white border border-zinc-200/90 rounded-[2px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-xs">
          {/* Left Side: Product Image */}
          <div className="lg:col-span-5 relative w-full h-[460px] sm:h-[540px] lg:h-auto min-h-[460px] sm:min-h-[540px] lg:min-h-full bg-[#111113] border-b lg:border-b-0 lg:border-r border-zinc-200 group overflow-hidden flex flex-col">
            <img
              src={productImage}
              alt={product.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top sm:object-center group-hover:scale-[1.02] transition-transform duration-700 select-none flex-1"
              onError={(e) => handleProductImageError(e, product.category, product.id)}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
              <MarmotBadge variant="new">
                {product.category === 'jaquetas' ? 'OUTERWEAR ATELIER' : 'SIGNATURE PIECE'}
              </MarmotBadge>
              <MarmotBadge variant="sale">
                MODELAGEM OVERSIZED
              </MarmotBadge>
            </div>

            {/* Quick View */}
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-[#0B0B0E] hover:text-white border border-zinc-300 text-[#0B0B0E] px-3.5 py-2 rounded-[2px] backdrop-blur-xs transition-colors flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] cursor-pointer shadow-xs z-10"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Espiada Rápida</span>
            </button>
          </div>

          {/* Right Side: Product Details */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              {/* Category Breadcrumb */}
              <div className="flex items-center gap-2 text-[10.5px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.subcategory}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-[#0B0B0E] leading-tight mb-2.5">
                {product.title}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-zinc-900 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating || 5) ? 'fill-current text-[#0B0B0E]' : 'opacity-25'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#0B0B0E]">{(product.rating || 5.0).toFixed(1)}</span>
                <span className="text-xs text-zinc-400">({product.reviewCount || 30} avaliações)</span>
              </div>

              {/* Description */}
              <div className="space-y-1 text-[13px] text-zinc-600 font-normal mb-5 leading-relaxed">
                {product.description
                  .split('\n')
                  .filter(Boolean)
                  .map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
              </div>

              {/* Integrated Editorial Specs (No heavy administrative box) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-zinc-100 mb-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block mb-1 font-semibold">
                    CONSTRUÇÃO
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-[#0B0B0E] block tracking-tight">
                    {product.category === 'jaquetas' ? 'Mangas Contrastantes & Punhos Listrados' : '400g/m² Heavyweight'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block mb-1 font-semibold">
                    MODELAGEM
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-[#0B0B0E] block tracking-tight">
                    {product.category === 'jaquetas' ? 'Varsity Oversized Boxy' : 'Oversized Estruturado'}
                  </span>
                </div>
              </div>

              {/* Price Block */}
              <div className="mb-6">
                <MarmotPrice
                  price={effectivePrice}
                  originalPrice={product.promoPrice ? product.price : undefined}
                  size="lg"
                />
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-5">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600 block mb-2">
                    COR SELECIONADA: <strong className="text-[#0B0B0E] font-sans font-extrabold">{selectedColor?.colorName || selectedColor?.color}</strong>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.colors.map((c) => {
                      const isSelected = (selectedColor?.colorHex || selectedColor?.color) === (c.colorHex || c.color);
                      return (
                        <button
                          key={c.colorHex || c.colorName || c.color}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`h-8.5 px-3 rounded-[2px] text-xs font-bold uppercase transition-all flex items-center gap-2 border cursor-pointer ${
                            isSelected
                              ? 'bg-[#0B0B0E] text-white border-[#0B0B0E] shadow-2xs'
                              : 'bg-[#F4F4F5] text-zinc-700 border-zinc-200 hover:border-[#0B0B0E] hover:text-[#0B0B0E]'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
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
                <label className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600 block mb-2">
                  TAMANHO: <strong className="text-[#0B0B0E] font-sans font-extrabold">{selectedSize}</strong>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['P', 'M', 'G', 'GG', 'XG']).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`w-10 h-10 rounded-[2px] font-mono font-bold text-xs uppercase transition-all border cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-[#0B0B0E] text-[#F4C400] border-[#0B0B0E] shadow-2xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-[#0B0B0E] hover:text-[#0B0B0E]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 px-6 rounded-[2px] font-black text-xs sm:text-[13px] uppercase tracking-[0.14em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] active:scale-[0.99]'
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
                  type="button"
                  onClick={() => onNavigate('product', product.id)}
                  className="py-3.5 px-6 rounded-[2px] bg-white border border-zinc-300 hover:border-[#0B0B0E] text-[#0B0B0E] font-bold text-xs uppercase tracking-[0.14em] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Ver Detalhes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Guarantee Assurance */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-3 border-t border-zinc-100">
              <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0" />
              <span>Garantia de caimento autoral • Troca grátis em até 30 dias • Envio direto de São Paulo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
