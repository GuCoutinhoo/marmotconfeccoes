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
    <section className="py-10 sm:py-14 lg:py-16 bg-[#F8F9FA] border-b border-[#E4E4E7] relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DESTAQUE DE ATELIÊ // SIGNATURE PIECE</span>
          </div>
          <span className="text-xs font-mono text-[#71717A] uppercase">
            SKU #{product.sku || 'MM-JAQ-017'}
          </span>
        </div>

        {/* Split Layout: Image Left | Details Right */}
        <div className="bg-white border border-[#DCDCE0] rounded-[2px] p-5 sm:p-7 lg:p-8 xl:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-center">
          {/* Left Side: Product Image - High-end Editorial Framing without internal letterbox padding */}
          <div className="lg:col-span-5 relative aspect-[3/4] sm:aspect-[4/5] rounded-[2px] overflow-hidden bg-[#18181B] border border-[#DCDCE0] group w-full mx-auto shadow-sm">
            <img
              src={productImage}
              alt={product.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 select-none"
              onError={(e) => handleProductImageError(e, product.category, product.id)}
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
              <span className="bg-[#18181B]/95 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-[2px] tracking-wider shadow-sm backdrop-blur-sm">
                {product.category === 'jaquetas' ? 'OUTERWEAR ATELIER 2026' : 'SIGNATURE PIECE'}
              </span>
              <span className="bg-[#F4C400] text-[#0B0B0E] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-[2px] tracking-wider w-fit shadow-sm">
                MODELAGEM OVERSIZED
              </span>
            </div>

            <button
              onClick={() => onQuickView(product)}
              className="absolute bottom-3 right-3 bg-white/95 hover:bg-[#18181B] hover:text-white border border-[#DCDCE0] text-[#18181B] px-3 py-2 rounded-[2px] backdrop-blur-md transition-colors flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer shadow-sm z-10"
            >
              <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Espiada Rápida</span>
            </button>
          </div>

          {/* Right Side: Product Details & Purchase CTA */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase tracking-wider mb-2">
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.subcategory}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[#18181B] leading-tight">
                {product.title}
              </h2>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex text-[#B45309] gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 5) ? 'fill-current' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#18181B]">{(product.rating || 5.0).toFixed(1)}</span>
                <span className="text-xs text-[#71717A]">({product.reviewCount || 30} avaliações verificadas)</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed font-medium whitespace-pre-line">
              {product.description}
            </p>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8F9FA] p-3.5 sm:p-4 rounded-[2px] border border-[#DCDCE0]">
              <div>
                <span className="text-[#71717A] text-[10px] uppercase font-bold block">Construção</span>
                <span className="font-bold text-[#18181B]">
                  {product.category === 'jaquetas' ? 'Mangas Contrastantes & Punhos Listrados' : '400g/m² Heavyweight'}
                </span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] uppercase font-bold block">Modelagem</span>
                <span className="font-bold text-[#18181B]">
                  {product.category === 'jaquetas' ? 'Varsity Oversized Boxy' : 'Oversized Estruturado'}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline flex-wrap gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl font-black text-[#18181B]">
                R$ {effectivePrice.toFixed(2).replace('.', ',')}
              </span>
              {product.promoPrice && (
                <span className="text-sm font-bold text-[#71717A] line-through">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              )}
              <span className="text-xs text-[#B45309] font-mono font-bold">
                R$ {(effectivePrice * 0.95).toFixed(2).replace('.', ',')} no PIX (5% OFF)
              </span>
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#52525B] block">
                  Cor: <span className="text-[#18181B] font-mono">{selectedColor?.colorName || selectedColor?.color}</span>
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
                        className={`h-9 px-3 rounded-[2px] text-xs font-bold uppercase transition-all flex items-center gap-2 border cursor-pointer ${
                          isSelected
                            ? 'bg-[#18181B] text-white border-[#18181B] shadow-sm font-black'
                            : 'bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
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
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#52525B] block">
                Selecione o Tamanho: <span className="text-[#18181B] font-mono">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || ['P', 'M', 'G', 'GG', 'XG']).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-11 h-11 rounded-[2px] text-xs font-bold uppercase transition-colors border cursor-pointer ${
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
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 px-6 rounded-[2px] font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2.5 cursor-pointer ${
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
                className="py-4 px-6 rounded-[2px] bg-white border border-[#DCDCE0] text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#18181B] font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Ver Detalhes <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#71717A] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#B45309]" />
              <span>Garantia de caimento autoral • Troca grátis em até 30 dias • Envio direto de São Paulo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

