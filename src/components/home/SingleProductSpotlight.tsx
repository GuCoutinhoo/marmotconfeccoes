import React, { useState } from 'react';
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

  // Select hero product (first heavyweight piece or first active product)
  const product = products.find((p) => p.isBestSeller || p.isNewRelease) || products[0];

  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.[0] || { colorName: 'Preto Ônix', color: 'black', colorHex: '#121212' }
  );
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const rawProductImage = product.images?.[0] || product.image;
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
    <section className="py-20 bg-[#F8F9FA] border-b border-[#E4E4E7] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DESTAQUE DE ATELIÊ // SIGNATURE PIECE</span>
          </div>
          <span className="text-xs font-mono text-[#71717A] uppercase">
            SKU #{product.sku || 'MRM-HD-004'}
          </span>
        </div>

        {/* Split Layout: Image Left | Details Right */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center shadow-md">
          {/* Left Side: Large Product Image */}
          <div className="lg:col-span-6 relative aspect-[3/4] sm:aspect-[4/5] rounded-xl overflow-hidden bg-[#F4F4F5] border border-[#E4E4E7] group">
            <img
              src={productImage}
              alt={product.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_top] group-hover:scale-105 transition-transform duration-500"
              onError={(e) => handleProductImageError(e, product.category, product.id)}
            />
            {/* Badge */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <span className="bg-[#18181B] text-white text-[10px] font-black uppercase px-3 py-1 rounded-md shadow-sm">
                MALHA HEAVY 400G/M²
              </span>
            </div>

            <button
              onClick={() => onQuickView(product)}
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-[#18181B] hover:text-white border border-[#E4E4E7] text-[#18181B] p-3 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 text-xs font-bold uppercase shadow-sm cursor-pointer"
            >
              <Eye className="w-4 h-4" /> Espiada Rápida
            </button>
          </div>

          {/* Right Side: Product Details & Purchase CTA */}
          <div className="lg:col-span-6 space-y-6">
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
                        i < Math.floor(product.rating) ? 'fill-current' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#18181B]">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-[#71717A]">({product.reviewCount} avaliações verificadas)</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed font-medium">
              {product.description}
            </p>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8F9FA] p-4 rounded-xl border border-[#E4E4E7]">
              <div>
                <span className="text-[#71717A] text-[10px] uppercase font-bold block">Gramatura</span>
                <span className="font-bold text-[#18181B]">400g/m² Heavyweight</span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] uppercase font-bold block">Capuz</span>
                <span className="font-bold text-[#18181B]">Duplo Estruturado (Sem Cordão)</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-[#18181B]">
                R$ {effectivePrice.toFixed(2).replace('.', ',')}
              </span>
              {product.promoPrice && (
                <span className="text-sm font-bold text-[#71717A] line-through">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              )}
              <span className="text-xs text-[#B45309] font-mono font-bold ml-2">
                R$ {(effectivePrice * 0.95).toFixed(2).replace('.', ',')} no PIX (5% OFF)
              </span>
            </div>

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
                    className={`w-11 h-11 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
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
                className={`flex-1 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] cursor-pointer ${
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
                className="py-4 px-6 rounded-xl bg-white border border-[#E4E4E7] text-[#18181B] hover:bg-[#F4F4F5] hover:border-[#18181B] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
