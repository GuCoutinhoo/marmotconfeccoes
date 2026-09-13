import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getValidProductImageUrl, handleProductImageError } from '../utils/imageUtils';

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
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div className="w-full max-w-md bg-white border-l border-zinc-200 text-[#0B0B0E] h-full flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#0B0B0E]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#0B0B0E]">
              SEU CARRINHO ({cart.reduce((a, b) => a + b.quantity, 0)})
            </h3>
          </div>
          <button
            type="button"
            onClick={closeMiniCart}
            className="p-1.5 text-zinc-400 hover:text-[#0B0B0E] bg-white border border-zinc-200 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200">
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-600">
              <Truck className="w-3.5 h-3.5 text-[#0B0B0E]" />
              {isFreeShippingEligible ? (
                <strong className="text-emerald-700 font-sans font-bold">Frete Grátis Liberado!</strong>
              ) : (
                <>Faltam <strong className="text-[#0B0B0E]">R$ {freeShippingRemaining.toFixed(2).replace('.', ',')}</strong> para Frete Grátis</>
              )}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 rounded-[1px] overflow-hidden">
            <div
              className="h-full bg-[#F4C400] transition-all duration-500 rounded-[1px]"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 flex flex-col items-center">
              <ShoppingBag className="w-10 h-10 stroke-1 mb-3 text-zinc-300" />
              <p className="text-xs font-mono uppercase tracking-wider text-[#0B0B0E] font-bold">Seu carrinho está vazio</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                Explore os drops e encontre peças com caimento encorpado para o seu estilo.
              </p>
              <button
                type="button"
                onClick={handleGoToCatalog}
                className="mt-6 px-6 py-2.5 bg-[#F4C400] text-[#0B0B0E] text-xs font-bold uppercase tracking-wider rounded-[2px] hover:bg-[#E5B500] transition-colors cursor-pointer"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemPrice = item.product.promoPrice || item.product.price;
              const rawItemImage =
                (item.selectedColor?.images && item.selectedColor.images.length > 0)
                  ? item.selectedColor.images[0]
                  : (item.selectedColor?.featuredImage || item.selectedColor?.image || item.product.images?.[0] || (item.product as any).image);
              const itemImage = getValidProductImageUrl(rawItemImage, item.product.category, `${item.product.id}-${item.selectedColor?.colorName}`);

              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor?.colorName}-${idx}`}
                  className="flex gap-3 p-3 bg-[#FAFAFA] border border-zinc-200/80 rounded-[2px] relative group"
                >
                  <img
                    src={itemImage}
                    alt={item.product.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleProductImageError(e, item.product.category, item.product.id)}
                    className="w-16 h-20 object-cover object-top rounded-[1px] bg-zinc-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black uppercase tracking-tight text-[#0B0B0E] leading-snug line-clamp-2">
                          {item.product.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor?.colorName)}
                          className="text-zinc-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[10.5px] font-mono text-zinc-500 mt-1">
                        Tam: <strong className="text-[#0B0B0E]">{item.selectedSize}</strong> | Cor: <strong className="text-[#0B0B0E]">{item.selectedColor?.colorName}</strong>
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-200/60">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-200 rounded-[1px] bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor?.colorName, item.quantity - 1)}
                          className="px-1.5 py-0.5 text-zinc-500 hover:text-[#0B0B0E] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 text-xs font-bold text-[#0B0B0E] font-mono">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor?.colorName, item.quantity + 1)}
                          className="px-1.5 py-0.5 text-zinc-500 hover:text-[#0B0B0E] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#0B0B0E]">
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
          <div className="p-4 sm:p-5 border-t border-zinc-200 bg-[#FAFAFA] space-y-3">
            {/* Coupon Box */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-[2px] text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold font-mono">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" /> {appliedCoupon.code} (-R$ {discountAmount.toFixed(2).replace('.', ',')})
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs text-zinc-500 hover:text-[#0B0B0E] underline cursor-pointer"
                >
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
                  className="flex-1 bg-white border border-zinc-200 text-xs px-3 py-2 rounded-[2px] text-[#0B0B0E] focus:outline-none focus:border-[#0B0B0E] uppercase font-mono placeholder-zinc-400"
                />
                <button
                  type="submit"
                  className="bg-[#0B0B0E] hover:bg-zinc-800 text-white font-bold text-xs uppercase px-3 py-2 rounded-[2px] transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </form>
            )}

            {/* Price Calculations */}
            <div className="space-y-1 text-xs text-zinc-600 pt-1">
              <div className="flex justify-between font-mono">
                <span>Subtotal</span>
                <span className="font-bold text-[#0B0B0E]">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-mono font-bold">
                  <span>Desconto</span>
                  <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-sm font-black text-[#0B0B0E] pt-2 border-t border-zinc-200">
                <span className="font-sans">TOTAL</span>
                <span className="font-mono text-base text-[#0B0B0E]">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Checkout CTAs */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleGoToCheckout}
                className="w-full bg-[#F4C400] text-[#0B0B0E] font-black text-xs uppercase tracking-[0.14em] py-3.5 px-4 rounded-[2px] hover:bg-[#E5B500] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Finalizar Compra</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
