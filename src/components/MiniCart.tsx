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
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#161616] border-l border-[#262626] text-[#EFECE6] h-full flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#262626] flex items-center justify-between bg-[#080808]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D6B35A]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#EFECE6]">Seu Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)})</h3>
          </div>
          <button
            onClick={closeMiniCart}
            className="p-1.5 text-[#777777] hover:text-[#EFECE6] bg-[#161616] border border-[#262626] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="p-4 bg-[#161616] border-b border-[#262626]">
          <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
            <span className="flex items-center gap-1.5 text-[#777777]">
              <Truck className="w-4 h-4 text-[#D6B35A]" />
              {isFreeShippingEligible ? (
                <strong className="text-[#D6B35A]">Parabéns! Você ganhou Frete Grátis!</strong>
              ) : (
                <>Faltam <strong className="text-[#EFECE6]">R$ {freeShippingRemaining.toFixed(2).replace('.', ',')}</strong> para Frete Grátis</>
              )}
            </span>
          </div>
          <div className="w-full h-2 bg-[#080808] rounded-full overflow-hidden border border-[#262626]">
            <div
              className="h-full bg-[#D6B35A] transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-[#777777] flex flex-col items-center">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-3 text-[#777777]" />
              <p className="text-sm font-bold text-[#EFECE6] uppercase tracking-wider">Seu carrinho está vazio</p>
              <p className="text-xs text-[#777777] mt-1 max-w-xs">
                Explore os drops e encontre peças exclusivas para o seu estilo.
              </p>
              <button
                onClick={handleGoToCatalog}
                className="mt-6 px-6 py-2.5 bg-[#D6B35A] text-black text-xs font-bold uppercase tracking-wider rounded hover:bg-[#EFECE6] transition-colors"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemPrice = item.product.promoPrice || item.product.price;
              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.colorName}-${idx}`}
                  className="flex gap-3 p-3 bg-[#080808] border border-[#262626] rounded-lg relative group"
                >
                  <img
                    src={item.product.images?.[0] || (item.product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                    alt={item.product.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded bg-black shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-[#EFECE6] leading-tight line-clamp-2">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor.colorName)}
                          className="text-[#777777] hover:text-red-400 p-0.5"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-[#777777] mt-1">
                        Tam: <strong className="text-[#EFECE6]">{item.selectedSize}</strong> | Cor: <strong className="text-[#EFECE6]">{item.selectedColor.colorName}</strong>
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#262626] rounded bg-[#161616]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.colorName, item.quantity - 1)}
                          className="p-1 text-[#777777] hover:text-[#EFECE6]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#EFECE6] font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.colorName, item.quantity + 1)}
                          className="p-1 text-[#777777] hover:text-[#EFECE6]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#EFECE6]">
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
          <div className="p-5 border-t border-[#262626] bg-[#080808] space-y-3">
            {/* Coupon Box */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-[#D6B35A]/10 border border-[#D6B35A]/40 rounded text-xs">
                <div className="flex items-center gap-1.5 text-[#D6B35A] font-bold">
                  <Tag className="w-3.5 h-3.5" /> Cupom {appliedCoupon.code} (-R$ {discountAmount.toFixed(2).replace('.', ',')})
                </div>
                <button onClick={removeCoupon} className="text-xs text-[#777777] hover:text-[#EFECE6] underline">
                  Remover
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Cupom de desconto (ex: FIRSTAURA)"
                  className="flex-1 bg-[#161616] border border-[#262626] text-xs px-3 py-2 rounded text-[#EFECE6] focus:outline-none focus:border-[#D6B35A] uppercase font-mono"
                />
                <button
                  type="submit"
                  className="bg-[#262626] hover:bg-[#EFECE6] hover:text-black text-[#EFECE6] font-bold text-xs px-3 py-2 rounded transition-colors"
                >
                  Aplicar
                </button>
              </form>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-[#777777] pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#EFECE6]">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#D6B35A] font-bold">
                  <span>Desconto Cupom</span>
                  <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#EFECE6] pt-2 border-t border-[#262626]">
                <span>TOTAL</span>
                <span className="text-[#D6B35A] text-base">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Checkout CTAs */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleGoToCheckout}
                className="w-full bg-[#D6B35A] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded hover:bg-[#EFECE6] transition-colors flex items-center justify-center gap-2"
              >
                Finalizar Compra <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleGoToCheckout}
                className="w-full bg-transparent hover:bg-[#161616] text-[#777777] hover:text-[#EFECE6] font-semibold text-xs py-2 rounded transition-colors text-center block"
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
