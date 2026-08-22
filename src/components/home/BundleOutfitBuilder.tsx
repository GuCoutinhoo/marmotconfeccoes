import React, { useState } from 'react';
import { Product } from '../../types';
import { ShoppingBag, Check, Plus, Tag, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface BundleOutfitBuilderProps {
  products: Product[];
  onNavigate: (page: string, param?: string) => void;
}

export const BundleOutfitBuilder: React.FC<BundleOutfitBuilderProps> = ({
  products,
  onNavigate,
}) => {
  const { addToCart } = useCart();

  // Select 3 items for the outfit bundle
  const bundleItem1 = products.find((p) => p.id === 'prod-004') || products[0]; // Hoodie
  const bundleItem2 = products.find((p) => p.id === 'prod-008') || products[1]; // Cargo Pant
  const bundleItem3 = products.find((p) => p.id === 'prod-011') || products[2]; // Cap 5 Panel

  const bundleItems = [bundleItem1, bundleItem2, bundleItem3].filter(Boolean) as Product[];

  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1, 2]);

  if (bundleItems.length === 0) return null;

  const toggleItem = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const activeItems = bundleItems.filter((_, idx) => selectedIndices.includes(idx));

  const originalTotal = activeItems.reduce(
    (acc, item) => acc + (item.promoPrice || item.price),
    0
  );

  const discountPercent = activeItems.length === 3 ? 15 : activeItems.length === 2 ? 10 : 0;
  const discountValue = (originalTotal * discountPercent) / 100;
  const finalTotal = originalTotal - discountValue;

  const handleAddBundleToCart = () => {
    activeItems.forEach((item) => {
      const defaultSize = item.sizes?.[0] || 'M';
      const defaultColor = item.colors?.[0] || { colorName: 'Black', color: 'black', hex: '#111111' };
      addToCart(item, defaultSize, defaultColor);
    });
  };

  return (
    <section className="py-20 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-[#D6B35A]/10 border border-[#D6B35A]/30 text-[#D6B35A] px-3 py-1 rounded-full text-xs font-black uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" /> BUNDLE & SAVE (COMBO COMPLETO)
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#EFECE6]">
            COMPLETE O LOOK & ECONOMIZE ATÉ 15%
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] mt-2">
            Combine as peças chaves da estação. Adicione os 3 itens juntos ao carrinho e garanta 15% de desconto automático.
          </p>
        </div>

        {/* Bundle Content Box */}
        <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Products Row with Plus signs */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
              {bundleItems.map((item, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(idx)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#080808] border-[#D6B35A]'
                        : 'bg-[#161616] border-[#262626] opacity-50'
                    }`}
                  >
                    {/* Checkbox badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#D6B35A] text-black' : 'bg-[#262626] text-[#777777]'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>

                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black mb-3">
                      <img
                        src={item.images?.[0] || (item as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <span className="text-[9px] text-[#D6B35A] font-bold uppercase">{item.category}</span>
                      <h4 className="text-xs font-bold text-[#EFECE6] line-clamp-1 mt-0.5">
                        {item.title}
                      </h4>
                      <p className="text-xs font-black text-[#EFECE6] mt-1">
                        R$ {(item.promoPrice || item.price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Calculation & Checkout Panel */}
            <div className="lg:col-span-4 bg-[#080808] border border-[#262626] p-6 rounded-xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <span className="text-xs font-bold uppercase text-[#777777]">Itens Selecionados</span>
                <span className="text-xs font-black text-[#D6B35A] uppercase">{activeItems.length} de 3 Peças</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#777777]">
                  <span>Subtotal Original:</span>
                  <span className="line-through">R$ {originalTotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-[#D6B35A] font-bold">
                    <span>Desconto Combo ({discountPercent}% OFF):</span>
                    <span>- R$ {discountValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-[#EFECE6] pt-3 border-t border-[#262626]">
                  <span>VALOR DO COMBO:</span>
                  <span className="text-xl text-[#D6B35A]">
                    R$ {finalTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <button
                disabled={activeItems.length === 0}
                onClick={handleAddBundleToCart}
                className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] disabled:opacity-50 font-black text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <ShoppingBag className="w-4 h-4" /> ADICIONAR COMBO AO CARRINHO
              </button>

              <p className="text-[10px] text-[#777777] text-center">
                Trocas individuais permitidas. Frete grátis incluído neste pedido.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
