import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Tag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface MiniCartProps {
  onNavigate?: (page: string, param?: string) => void;
  onNavigateToCheckout?: () => void;
  onNavigateToCartPage?: () => void;
}

export const MiniCart: React.FC<MiniCartProps> = ({
  onNavigate,
  onNavigateToCheckout,
  onNavigateToCartPage,
}) => {
  const {
    cart,
    isMiniCartOpen,
    closeMiniCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountAmount,
    freeShippingThreshold,
    freeShippingRemaining,
    isFreeShippingEligible,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');

  if (!isMiniCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode) {
      applyCoupon(couponCode);
      setCouponCode('');
    }
  };

  const handleGoToCheckout = () => {
    closeMiniCart();
    if (onNavigateToCheckout) {
      onNavigateToCheckout();
    } else if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleGoToCatalog = () => {
    closeMiniCart();
    if (onNavigate) {
      onNavigate('shop');
    }
  };

  const finalTotal = Math.max(0, subtotal - discountAmount);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white border-l border-[#E4E4E7] text-[#18181B] h-full flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#E4E4E7] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#B45309]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#18181B]">Seu Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)})</h3>
          </div>
          <button
            onClick={closeMiniCart}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] bg-white border border-[#E4E4E7] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="p-4 bg-[#F8F9FA] border-b border-[#E4E4E7]">
          <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
            <span className="flex items-center gap-1.5 text-[#52525B]">
              <Truck className="w-4 h-4 text-[#B45309]" />
              {isFreeShippingEligible ? (
                <strong className="text-emerald-700">Parabéns! Você ganhou Frete Grátis!</strong>
              ) : (
                <>Faltam <strong className="text-[#18181B]">R$ {freeShippingRemaining.toFixed(2).replace('.', ',')}</strong> para Frete Grátis</>
              )}
            </span>
          </div>
          <div className="w-full h-2 bg-[#E4E4E7] rounded-full overflow-hidden border border-[#D4D4D8]">
            <div
              className="h-full bg-[#B45309] transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-[#71717A] flex flex-col items-center">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-3 text-[#A1A1AA]" />
              <p className="text-sm font-bold text-[#18181B] uppercase tracking-wider">Seu carrinho está vazio</p>
              <p className="text-xs text-[#71717A] mt-1 max-w-xs">
                Explore os drops e encontre peças exclusivas para o seu estilo.
              </p>
              <button
                onClick={handleGoToCatalog}
                className="mt-6 px-6 py-2.5 bg-[#F4C400] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5B500] transition-colors shadow-sm"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemPrice = item.product.promoPrice || item.product.price;
              const itemImage =
                (item.selectedColor?.images && item.selectedColor.images.length > 0)
                  ? item.selectedColor.images[0]
                  : (item.selectedColor?.featuredImage || item.selectedColor?.image || item.product.images?.[0] || (item.product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80');

              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.colorName}-${idx}`}
                  className="flex gap-3 p-3 bg-[#F8F9FA] border border-[#E4E4E7] rounded-xl relative group"
                >
                  <img
                    src={itemImage}
                    alt={item.product.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded-lg bg-[#E4E4E7] shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-[#18181B] leading-tight line-clamp-2">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor.colorName)}
                          className="text-[#71717A] hover:text-red-500 p-0.5 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-[#71717A] mt-1">
                        Tam: <strong className="text-[#18181B]">{item.selectedSize}</strong> | Cor: <strong className="text-[#18181B]">{item.selectedColor.colorName}</strong>
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E4E4E7] rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.colorName, item.quantity - 1)}
                          className="p-1 text-[#71717A] hover:text-[#18181B]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#18181B] font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.colorName, item.quantity + 1)}
                          className="p-1 text-[#71717A] hover:text-[#18181B]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#18181B]">
                          R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#E4E4E7] bg-[#F8F9FA] space-y-3">
            {/* Coupon Box */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-xs">
                <div className="flex items-center gap-1.5 text-[#92400E] font-bold">
                  <Tag className="w-3.5 h-3.5" /> Cupom {appliedCoupon.code} (-R$ {discountAmount.toFixed(2).replace('.', ',')})
                </div>
                <button onClick={removeCoupon} className="text-xs text-[#71717A] hover:text-[#18181B] underline">
                  Remover
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Cupom (ex: MARMOT10)"
                  className="flex-1 bg-white border border-[#E4E4E7] text-xs px-3 py-2 rounded-lg text-[#18181B] focus:outline-none focus:border-[#18181B] uppercase font-mono placeholder-[#71717A]"
                />
                <button
                  type="submit"
                  className="bg-[#18181B] hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Aplicar
                </button>
              </form>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-[#52525B] pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#18181B]">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto Cupom</span>
                  <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#18181B] pt-2 border-t border-[#E4E4E7]">
                <span>TOTAL</span>
                <span className="text-[#B45309] text-base">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Checkout CTAs */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleGoToCheckout}
                className="w-full bg-[#F4C400] text-[#0B0B0E] font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl hover:bg-[#E5B500] transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                Finalizar Compra <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleGoToCheckout}
                className="w-full bg-transparent hover:bg-white text-[#71717A] hover:text-[#18181B] font-semibold text-xs py-2 rounded-lg transition-colors text-center block"
              >
                Ver checkout detalhado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
