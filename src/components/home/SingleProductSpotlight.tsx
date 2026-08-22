import React, { useState } from 'react';
import { Product } from '../../types';
import { ShoppingBag, Star, ShieldCheck, Sparkles, ArrowRight, Eye, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

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

  // Select hero product (Hoodie Heavyweight 400g)
  const product = products.find((p) => p.id === 'prod-004') || products[0];

  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.[0] || { colorName: 'Preto Ônix', color: 'black', colorHex: '#121212' }
  );
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const productImage = product.images?.[0] || (product as any).image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    setAdded(true);
    showToast(
      'Adicionado ao Carrinho',
      `${product.title} (${selectedSize}) foi adicionado com sucesso.`,
      'success'
    );
    openMiniCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const effectivePrice = product.promoPrice || product.price;

  return (
    <section className="py-20 bg-[#111113] border-b border-[#27272A] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#C5A869]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DESTAQUE DE ATELIÊ // SIGNATURE PIECE</span>
          </div>
          <span className="text-xs font-mono text-[#71717A] uppercase">
            SKU #{product.sku || 'MRM-HD-004'}
          </span>
        </div>

        {/* Split Layout: Image Left | Details Right */}
        <div className="bg-[#141416] border border-[#27272A] rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center shadow-xl">
          {/* Left Side: Large Product Image */}
          <div className="lg:col-span-6 relative aspect-[3/4] sm:aspect-[4/5] rounded-xl overflow-hidden bg-[#0D0D0E] border border-[#27272A] group">
            <img
              src={productImage}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            {/* Badge */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <span className="bg-[#F4F4F5] text-[#0D0D0E] text-[10px] font-black uppercase px-3 py-1 rounded-md shadow-md">
                MALHA HEAVY 400G/M²
              </span>
            </div>

            <button
              onClick={() => onQuickView(product)}
              className="absolute bottom-4 right-4 bg-[#18181B]/90 hover:bg-[#F4F4F5] hover:text-black border border-[#2D2D34] text-[#F4F4F5] p-3 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 text-xs font-bold uppercase shadow-lg"
            >
              <Eye className="w-4 h-4" /> Espiada Rápida
            </button>
          </div>

          {/* Right Side: Product Details & Purchase CTA */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C5A869] uppercase tracking-wider mb-2">
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.subcategory}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[#F4F4F5] leading-tight">
                {product.title}
              </h2>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex text-[#C5A869] gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? 'fill-current' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#F4F4F5]">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-[#71717A]">({product.reviewCount} avaliações verificadas)</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed font-medium">
              {product.description}
            </p>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#18181B] p-4 rounded-xl border border-[#27272A]">
              <div>
                <span className="text-[#71717A] text-[10px] uppercase font-bold block">Gramatura</span>
                <span className="font-bold text-[#F4F4F5]">400g/m² Heavyweight</span>
              </div>
              <div>
                <span className="text-[#71717A] text-[10px] uppercase font-bold block">Capuz</span>
                <span className="font-bold text-[#F4F4F5]">Duplo Estruturado (Sem Cordão)</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-[#F4F4F5]">
                R$ {effectivePrice.toFixed(2).replace('.', ',')}
              </span>
              {product.promoPrice && (
                <span className="text-sm font-bold text-[#71717A] line-through">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              )}
              <span className="text-xs text-[#C5A869] font-mono font-bold ml-2">
                R$ {(effectivePrice * 0.95).toFixed(2).replace('.', ',')} no PIX (5% OFF)
              </span>
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#A1A1AA] block">
                Selecione o Tamanho: <span className="text-[#F4F4F5] font-mono">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || ['P', 'M', 'G', 'GG', 'XG']).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-11 h-11 rounded-xl text-xs font-bold uppercase transition-all border ${
                      selectedSize === sz
                        ? 'bg-[#F4F4F5] text-[#0D0D0E] border-[#F4F4F5] shadow-md font-black'
                        : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A] hover:border-[#C5A869]/70 hover:text-[#F4F4F5]'
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
                className={`flex-1 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] ${
                  added
                    ? 'bg-emerald-500 text-black'
                    : 'bg-[#F4F4F5] text-[#0D0D0E] hover:bg-white'
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
                className="py-4 px-6 rounded-xl bg-[#18181B] border border-[#27272A] text-[#F4F4F5] hover:border-[#C5A869]/60 hover:text-[#C5A869] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                Ver Detalhes <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#71717A] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#C5A869]" />
              <span>Garantia de caimento autoral • Troca grátis em até 30 dias • Envio direto de São Paulo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
