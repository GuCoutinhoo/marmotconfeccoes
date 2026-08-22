import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CartItem, Product, ProductVariant, Coupon, ShippingOption } from '../types';
import { INITIAL_COUPONS } from '../data/coupons';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { validateAndFetchCep, normalizeCep, isValidCepFormat } from '../services/cepService';
import { filterAndSortShippingQuotes } from '../services/carrierFilter';
import {
  supabase,
  isSupabaseConfigured,
  mapSupabaseRowToProduct,
  fetchUserCartFromSupabase,
  saveCartItemToSupabase,
  updateCartItemQuantityInSupabase,
  removeCartItemFromSupabase,
  clearUserCartInSupabase,
  mergeGuestCartIntoSupabase,
} from '../lib/supabaseClient';

interface CartContextData {
  cart: CartItem[];
  cartItems: CartItem[];
  cartHydrated: boolean;
  isHydrated: boolean;
  addToCart: (product: Product, selectedSize: string, selectedColor: ProductVariant, quantity?: number) => boolean;
  removeFromCart: (productId: string, size: string, colorName: string) => void;
  updateQuantity: (productId: string, size: string, colorName: string, quantity: number) => void;
  clearCart: () => void;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  subtotal: number;
  cartSubtotal: number;
  discountAmount: number;
  cartDiscount: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  isFreeShippingEligible: boolean;
  totalCartItems: number;
  recentViewed: Product[];
  addRecentViewed: (product: Product) => void;
  // Shipping State & Methods
  selectedShipping: ShippingOption | null;
  shippingPostalCode: string;
  shippingOptions: ShippingOption[];
  isCalculatingShipping: boolean;
  shippingError: string | null;
  calculateShipping: (postalCode?: string) => Promise<ShippingOption[]>;
  setSelectedShipping: (option: ShippingOption | null) => void;
  setShippingPostalCode: (cep: string) => void;
  resetShipping: () => void;
  shippingFee: number;
  grandTotal: number;
  // Auth redirection trigger for cart
  triggerAuthRequired: (pendingItem?: { product: Product; size: string; color: ProductVariant; quantity: number }) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const FREE_SHIPPING_THRESHOLD = 399.00;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState<boolean>(false);
  const isHydratingRef = useRef<boolean>(false);
  const activeUserIdRef = useRef<string | null>(user?.id || null);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('@aura_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  // Shipping persistence and state
  const [shippingPostalCode, setShippingPostalCodeState] = useState<string>(() => {
    try {
      return localStorage.getItem('@aura_shipping_cep') || '';
    } catch {
      return '';
    }
  });

  const [selectedShipping, setSelectedShippingState] = useState<ShippingOption | null>(() => {
    try {
      const saved = localStorage.getItem('@aura_shipping_selected');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [recentViewed, setRecentViewed] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('@aura_recent_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { showToast } = useToast();

  // Load and synchronize cart strictly for authenticated user (Supabase as Source of Truth)
  useEffect(() => {
    let isCancelled = false;

    async function syncCart() {
      isHydratingRef.current = true;
      setCartHydrated(false);

      if (user && user.id) {
        activeUserIdRef.current = user.id;
        const currentUserId = user.id;
        const activeToken = token || localStorage.getItem('@marmot_auth_token');

        // Check if there are any pending items to add after login
        let pendingItemToAdd: { product: Product; selectedSize: string; selectedColor: ProductVariant; quantity: number } | null = null;
        try {
          const pendingRaw = sessionStorage.getItem('@aura_pending_add_to_cart');
          if (pendingRaw) {
            sessionStorage.removeItem('@aura_pending_add_to_cart');
            pendingItemToAdd = JSON.parse(pendingRaw);
          }
        } catch {}

        // 1. Fetch authenticated user's latest cart directly from Supabase (Source of Truth)
        let loadedCart: CartItem[] = [];
        try {
          const directSupabaseCart = await fetchUserCartFromSupabase(currentUserId);
          if (Array.isArray(directSupabaseCart) && directSupabaseCart.length > 0) {
            loadedCart = directSupabaseCart;
          }
        } catch (sbErr) {
          console.warn('[Cart] Direct Supabase fetch warning:', sbErr);
        }

        // 2. Fallback to backend /api/cart if direct Supabase fetch returned empty
        if (!loadedCart || loadedCart.length === 0) {
          try {
            const res = await fetch('/api/cart', {
              headers: {
                ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
              },
            });
            if (res.ok) {
              const serverCart = await res.json();
              if (Array.isArray(serverCart) && serverCart.length > 0) {
                loadedCart = serverCart;
              }
            }
          } catch (err) {
            console.warn('[Cart] Server fetch fallback warning:', err);
          }
        }

        // 3. Fallback to user-isolated localStorage cached cart
        if (!loadedCart || loadedCart.length === 0) {
          try {
            const cached = localStorage.getItem(`@aura_cart_${currentUserId}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                loadedCart = parsed;
                // Re-sync to Supabase in background
                for (const itm of parsed) {
                  saveCartItemToSupabase(currentUserId, itm);
                }
              }
            }
          } catch {}
        }

        let finalCart = loadedCart || [];

        // If a pending item was queued prior to authentication, add it now
        if (pendingItemToAdd && pendingItemToAdd.product) {
          const existingIdx = finalCart.findIndex(
            (i) =>
              i.product.id === pendingItemToAdd!.product.id &&
              i.selectedSize === pendingItemToAdd!.selectedSize &&
              (i.selectedColor.colorName === pendingItemToAdd!.selectedColor.colorName ||
                i.selectedColor.color === pendingItemToAdd!.selectedColor.color)
          );

          if (existingIdx > -1) {
            finalCart = [...finalCart];
            finalCart[existingIdx] = {
              ...finalCart[existingIdx],
              quantity: finalCart[existingIdx].quantity + (pendingItemToAdd.quantity || 1),
            };
          } else {
            const newItem: CartItem = {
              product: pendingItemToAdd.product,
              selectedSize: pendingItemToAdd.selectedSize,
              selectedColor: pendingItemToAdd.selectedColor,
              quantity: pendingItemToAdd.quantity || 1,
            };
            finalCart = [...finalCart, newItem];
            saveCartItemToSupabase(currentUserId, newItem);
          }

          try {
            showToast(
              'Item Adicionado ao Carrinho!',
              `${pendingItemToAdd.product.title} (${pendingItemToAdd.selectedSize}) foi incluído após o login.`,
              'success'
            );
            setIsMiniCartOpen(true);
          } catch {}
        }

        if (!isCancelled) {
          setCart(finalCart);
          localStorage.setItem(`@aura_cart_${currentUserId}`, JSON.stringify(finalCart));
          isHydratingRef.current = false;
          setCartHydrated(true);
        }
      } else {
        // User logged out or unauthenticated visitor:
        // Clear in-memory cart state completely. NO anonymous/guest persistence.
        activeUserIdRef.current = null;
        localStorage.removeItem('@aura_guest_cart');
        localStorage.removeItem('@aura_cart');

        if (!isCancelled) {
          setCart([]);
          isHydratingRef.current = false;
          setCartHydrated(true);
        }
      }
    }

    syncCart();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, token]);

  // Persist cart to user-isolated storage ONLY when authenticated and hydration is complete
  useEffect(() => {
    if (!cartHydrated || isHydratingRef.current) return;

    if (user?.id && activeUserIdRef.current === user.id) {
      localStorage.setItem(`@aura_cart_${user.id}`, JSON.stringify(cart));
    }
  }, [cart, cartHydrated, user?.id]);

  // Trigger login/signup modal or page when authentication is required for cart/checkout
  const triggerAuthRequired = useCallback((pendingItem?: { product: Product; size: string; color: ProductVariant; quantity: number }) => {
    if (pendingItem) {
      try {
        sessionStorage.setItem(
          '@aura_pending_add_to_cart',
          JSON.stringify({
            product: pendingItem.product,
            selectedSize: pendingItem.size,
            selectedColor: pendingItem.color,
            quantity: pendingItem.quantity,
          })
        );
      } catch {}
    }

    showToast(
      'Login Obrigatório',
      'Faça login ou crie sua conta para adicionar produtos ao carrinho.',
      'info'
    );

    // Dispatch global custom event and navigate to account login
    window.dispatchEvent(
      new CustomEvent('marmot:require-auth', {
        detail: {
          action: 'add_to_cart',
          message: 'Faça login ou crie sua conta para comprar.',
        },
      })
    );
  }, [showToast]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('@aura_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('@aura_coupon');
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (shippingPostalCode) {
      localStorage.setItem('@aura_shipping_cep', shippingPostalCode);
    } else {
      localStorage.removeItem('@aura_shipping_cep');
    }
  }, [shippingPostalCode]);

  useEffect(() => {
    if (selectedShipping) {
      localStorage.setItem('@aura_shipping_selected', JSON.stringify(selectedShipping));
    } else {
      localStorage.removeItem('@aura_shipping_selected');
    }
  }, [selectedShipping]);

  useEffect(() => {
    localStorage.setItem('@aura_recent_viewed', JSON.stringify(recentViewed));
  }, [recentViewed]);

  const resetShipping = useCallback(() => {
    setSelectedShippingState(null);
    setShippingOptions([]);
    setShippingError(null);
  }, []);

  const setShippingPostalCode = useCallback((cep: string) => {
    const clean = normalizeCep(cep);
    setShippingPostalCodeState((prev) => {
      if (prev !== clean) {
        // Invalidate previous quotes immediately if CEP changes
        setSelectedShippingState(null);
        setShippingOptions([]);
        setShippingError(null);
      }
      return clean;
    });
  }, []);

  const setSelectedShipping = useCallback((option: ShippingOption | null) => {
    setSelectedShippingState(option);
  }, []);

  const calculateShipping = useCallback(
    async (postalCodeToUse?: string): Promise<ShippingOption[]> => {
      const rawTarget = postalCodeToUse !== undefined ? postalCodeToUse : shippingPostalCode;
      const targetCep = normalizeCep(rawTarget);

      console.log('[CALCULAR AGORA FRETE] 1. Início do cálculo. CEP:', targetCep, 'Raw:', rawTarget, 'Itens no carrinho:', cart.length);

      if (!isValidCepFormat(targetCep) || targetCep.length !== 8) {
        const errorMsg = `[Validação Bloqueou] CEP "${rawTarget || ''}" inválido. Digite 8 dígitos numéricos.`;
        console.warn('[CALCULAR AGORA FRETE] Bloqueado na validação de formato de CEP:', errorMsg);
        setShippingError(errorMsg);
        setSelectedShippingState(null);
        setShippingOptions([]);
        return [];
      }

      if (!cart || cart.length === 0) {
        const errorMsg = '[Validação Bloqueou] O carrinho está vazio (cart.length === 0). Adicione um produto para calcular o frete.';
        console.warn('[CALCULAR AGORA FRETE] Bloqueado:', errorMsg);
        setShippingError(errorMsg);
        setSelectedShippingState(null);
        setShippingOptions([]);
        return [];
      }

      setIsCalculatingShipping(true);
      setShippingError(null);

      try {
        // Step 1: Optional background ViaCEP address check (non-blocking for shipping calculate)
        console.log('[CALCULAR AGORA FRETE] 2. Consultando ViaCEP para:', targetCep);
        try {
          const cepCheck = await validateAndFetchCep(targetCep);
          console.log('[CALCULAR AGORA FRETE] 2.1 Resposta ViaCEP:', cepCheck);
          if (!cepCheck.exists && !cepCheck.isServiceUnavailable) {
            console.warn('[CALCULAR AGORA FRETE] Aviso: ViaCEP informou CEP não encontrado, mas prosseguindo com a cotação.');
          }
        } catch (cepErr: any) {
          console.warn('[CALCULAR AGORA FRETE] Aviso ViaCEP ignorado para não travar cotação:', cepErr.message);
        }

        // Step 2: Build and log actual product parameters (weight, dimensions, price, id)
        const payloadItems = cart.map((item, idx) => {
          const p = item.product || ({} as any);
          const itemPayload = {
            productId: p.id || `prod-${idx + 1}`,
            id: p.id || `prod-${idx + 1}`,
            quantity: item.quantity || 1,
            weight: Number(p.weight) || 0.35,
            width: Number(p.width) || 20,
            height: Number(p.height) || 4,
            length: Number(p.length) || 25,
            price: Number(p.promoPrice || p.price) || 150,
            insurance_value: Number(p.promoPrice || p.price) || 150,
          };
          console.log(`[CALCULAR AGORA FRETE] 3. Dados do Produto #${idx + 1} (${p.title || 'Sem título'}):`, itemPayload);
          return itemPayload;
        });

        const requestBody = {
          cep: targetCep,
          postalCode: targetCep,
          destinationPostalCode: targetCep,
          items: payloadItems,
        };

        console.log('[CALCULAR AGORA FRETE] 4. Disparando POST /api/shipping/calculate com body:', JSON.stringify(requestBody));

        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        console.log('[CALCULAR AGORA FRETE] 5. Resposta HTTP status:', response.status, response.statusText);

        const data = await response.json().catch(() => ({}));
        console.log('[CALCULAR AGORA FRETE] 6. Resposta JSON recebida:', data);

        if (!response.ok) {
          setSelectedShippingState(null);
          setShippingOptions([]);
          const errorMsg = data.message || data.error || `Erro HTTP ${response.status} ao calcular frete no servidor.`;
          throw new Error(errorMsg);
        }

        const rawOptions: ShippingOption[] = data.quotes || data.options || [];
        const options: ShippingOption[] = filterAndSortShippingQuotes(rawOptions);

        if (options.length === 0) {
          setSelectedShippingState(null);
          setShippingOptions([]);
          setShippingError('[Validação] Nenhuma opção de entrega disponível para este CEP.');
          return [];
        }

        setShippingOptions(options);
        setShippingPostalCodeState(targetCep);
        setShippingError(null);

        // Select cheapest or preserve match
        setSelectedShippingState((current) => {
          if (current) {
            const matched = options.find((o) => o.id === current.id || o.serviceId === current.serviceId);
            if (matched) return matched;
          }
          return options[0];
        });

        return options;
      } catch (err: any) {
        console.error('[CALCULAR AGORA FRETE] ❌ Erro durante o cálculo:', err);
        setSelectedShippingState(null);
        setShippingOptions([]);
        setShippingError(err.message || 'Não foi possível calcular o frete neste momento.');
        return [];
      } finally {
        setIsCalculatingShipping(false);
      }
    },
    [cart, shippingPostalCode]
  );

  const addToCart = (product: Product, selectedSize: string, selectedColor: ProductVariant, quantity = 1): boolean => {
    // 1. Strict Authentication Enforcement: Unauthenticated visitors cannot add items to the cart
    if (!user || !user.id) {
      triggerAuthRequired({ product, size: selectedSize, color: selectedColor, quantity });
      return false;
    }

    // Invalidate old quotes when cart content changes
    setSelectedShippingState(null);
    setShippingOptions([]);

    const cleanQty = Math.max(1, quantity);

    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedSize === selectedSize &&
        (item.selectedColor.colorName === selectedColor.colorName || item.selectedColor.color === selectedColor.color)
    );

    const finalQty = existingIndex > -1 ? cart[existingIndex].quantity + cleanQty : cleanQty;
    const finalItem: CartItem = {
      product,
      selectedSize,
      selectedColor,
      quantity: finalQty,
    };

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          (item.selectedColor.colorName === selectedColor.colorName || item.selectedColor.color === selectedColor.color)
      );

      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + cleanQty };
        return updated;
      }

      return [...prev, { product, selectedSize, selectedColor, quantity: cleanQty }];
    });

    // Sync directly to Supabase as authoritative source
    if (user?.id) {
      saveCartItemToSupabase(user.id, finalItem);

      const activeToken = token || localStorage.getItem('@marmot_auth_token');
      fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          productId: product.id,
          selectedSize,
          selectedColor,
          quantity: cleanQty,
        }),
      }).catch((err) => console.warn('[Cart] Server add sync notice:', err));
    }

    showToast(
      'Adicionado ao Carrinho',
      `${product.title} (${selectedSize} / ${selectedColor.colorName || selectedColor.color})`,
      'success'
    );
    setIsMiniCartOpen(true);
    return true;
  };

  const removeFromCart = (productId: string, size: string, colorName: string) => {
    setSelectedShippingState(null);
    setShippingOptions([]);

    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size &&
            (item.selectedColor.colorName === colorName || item.selectedColor.color === colorName)
          )
      )
    );

    // Sync to Supabase as authoritative source
    if (user?.id) {
      removeCartItemFromSupabase(user.id, productId, size, colorName);

      const activeToken = token || localStorage.getItem('@marmot_auth_token');
      fetch('/api/cart/item', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          productId,
          size,
          colorName,
        }),
      }).catch((err) => console.warn('[Cart] Server remove sync notice:', err));
    }

    showToast('Item removido', 'O produto foi removido do carrinho.', 'info');
  };

  const updateQuantity = (productId: string, size: string, colorName: string, quantity: number) => {
    setSelectedShippingState(null);
    setShippingOptions([]);

    if (quantity <= 0) {
      removeFromCart(productId, size, colorName);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedSize === size &&
          (item.selectedColor.colorName === colorName || item.selectedColor.color === colorName)
        ) {
          return { ...item, quantity };
        }
        return item;
      })
    );

    // Sync to Supabase as authoritative source
    if (user?.id) {
      updateCartItemQuantityInSupabase(user.id, productId, size, colorName, quantity);

      const activeToken = token || localStorage.getItem('@marmot_auth_token');
      fetch('/api/cart/item', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          productId,
          selectedSize: size,
          colorName,
          quantity,
        }),
      }).catch((err) => console.warn('[Cart] Server update sync notice:', err));
    }
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setSelectedShippingState(null);
    setShippingOptions([]);
    setShippingError(null);

    if (user?.id) {
      clearUserCartInSupabase(user.id);
      localStorage.removeItem(`@aura_cart_${user.id}`);

      const activeToken = token || localStorage.getItem('@marmot_auth_token');
      fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      }).catch((err) => console.warn('[Cart] Server clear sync notice:', err));
    } else {
      localStorage.removeItem('@aura_guest_cart');
    }
  };

  const applyCoupon = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    const found = INITIAL_COUPONS.find((c) => c.code === cleanCode);

    if (!found) {
      showToast('Cupom Inválido', 'O código de cupom digitado não existe.', 'error');
      return false;
    }

    if (found.minOrderValue && subtotal < found.minOrderValue) {
      showToast(
        'Valor mínimo não atingido',
        `Este cupom requer um valor mínimo de R$ ${found.minOrderValue.toFixed(2)} no carrinho.`,
        'error'
      );
      return false;
    }

    setAppliedCoupon(found);
    showToast('Cupom Aplicado!', `${found.description}`, 'success');
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupom Removido', 'O cupom de desconto foi removido.', 'info');
  };

  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.promoPrice || item.product.price;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * (appliedCoupon.discountValue || appliedCoupon.discountPercentage || 0)) / 100;
    }
    return Math.min(subtotal, appliedCoupon.discountValue || 0);
  }, [subtotal, appliedCoupon]);

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const isFreeShippingEligible = subtotal >= FREE_SHIPPING_THRESHOLD;

  const shippingFee = useMemo(() => {
    if (!selectedShipping) return 0;
    if (isFreeShippingEligible) return 0;
    return selectedShipping.price || 0;
  }, [selectedShipping, isFreeShippingEligible]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + shippingFee);
  }, [subtotal, discountAmount, shippingFee]);

  const totalCartItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const addRecentViewed = (product: Product) => {
    setRecentViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 10);
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart,
        cartHydrated,
        isHydrated: cartHydrated,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isMiniCartOpen,
        openMiniCart,
        closeMiniCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        cartSubtotal: subtotal,
        discountAmount,
        cartDiscount: discountAmount,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingRemaining,
        isFreeShippingEligible,
        totalCartItems,
        recentViewed,
        addRecentViewed,
        selectedShipping,
        shippingPostalCode,
        shippingOptions,
        isCalculatingShipping,
        shippingError,
        calculateShipping,
        setSelectedShipping,
        setShippingPostalCode,
        shippingFee,
        grandTotal,
        triggerAuthRequired,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

