import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Truck,
  Package,
  ShoppingBag,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  MapPin,
  Plus,
} from 'lucide-react';
import { Order, Address, ShippingOption } from '../types';
import { validateAndFetchCep, normalizeCep, isValidCepFormat, formatCep } from '../services/cepService';
import { isValidCpf, formatCpf, cleanCpf } from '../utils/cpfValidator';
import { getValidProductImageUrl, handleProductImageError } from '../utils/imageUtils';

interface CheckoutPageProps {
  onNavigate: (page: string, param?: string) => void;
}

function getCheckoutAuthHeaders(includeJson = false): Record<string, string> {
  const token = localStorage.getItem('@marmot_auth_token') || localStorage.getItem('marmot_auth_token') || '';
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    cart,
    subtotal,
    discountAmount,
    appliedCoupon,
    applyCoupon,
    clearCart,
    selectedShipping,
    setSelectedShipping,
    shippingPostalCode,
    setShippingPostalCode,
    shippingOptions,
    isCalculatingShipping,
    shippingError,
    calculateShipping,
  } = useCart();

  const cartItems = cart || [];
  const cartSubtotal = subtotal || 0;
  const cartDiscount = discountAmount || 0;
  const isFreeShipping = cartSubtotal >= 399;

  const { user, registerOrder, addAddress, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const authRedirectHandledRef = useRef(false);

  // Strict Authentication Guard: Unauthenticated visitors cannot access Checkout
  useEffect(() => {
    if (!authLoading && !user) {
      if (authRedirectHandledRef.current) return;
      authRedirectHandledRef.current = true;
      showToast('Login Obrigatório', 'Faça login ou crie uma conta para finalizar sua compra.', 'info');
      onNavigate('account', 'login');
    }
  }, [user, authLoading, onNavigate, showToast]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingCepLookup, setLoadingCepLookup] = useState(false);
  const [cepValidationError, setCepValidationError] = useState<string | null>(null);

  // Address Selection State for Authenticated Users
  const userSavedAddresses = user?.addresses || [];
  const defaultSavedAddress = userSavedAddresses.find((a) => a.isDefault) || userSavedAddresses[0];

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    return defaultSavedAddress?.id || 'new';
  });

  const [saveAddressToAccount, setSaveAddressToAccount] = useState<boolean>(true);

  // Address State
  const [address, setAddress] = useState<Address>(() => {
    const savedUserAddr = defaultSavedAddress;
    const initialCep = savedUserAddr?.cep || (shippingPostalCode ? formatCep(shippingPostalCode) : '');
    return {
      id: savedUserAddr?.id || 'addr-1',
      recipientName: savedUserAddr?.recipientName || (user ? user.name : ''),
      cep: initialCep ? formatCep(initialCep) : '',
      street: savedUserAddr?.street || '',
      number: savedUserAddr?.number || '',
      complement: savedUserAddr?.complement || '',
      neighborhood: savedUserAddr?.neighborhood || '',
      city: savedUserAddr?.city || '',
      state: savedUserAddr?.state || '',
      isDefault: savedUserAddr?.isDefault || false,
    };
  });

  const [contactEmail, setContactEmail] = useState(user ? user.email : '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactCpf, setContactCpf] = useState(user?.cpf ? formatCpf(user.cpf) : '');
  const [cpfError, setCpfError] = useState<string | null>(null);
  // Keep contact info and CPF synced if user finishes loading
  useEffect(() => {
    if (user) {
      if (!contactEmail && user.email) setContactEmail(user.email);
      if (!contactPhone && user.phone) setContactPhone(user.phone);
      if (!contactCpf && user.cpf) setContactCpf(formatCpf(user.cpf));
    }
  }, [user]);

  // Keep address updated if user finishes loading
  useEffect(() => {
    if (user && userSavedAddresses.length > 0 && selectedAddressId === 'new' && !address.street) {
      const def = defaultSavedAddress;
      if (def) {
        setSelectedAddressId(def.id);
        setAddress({
          ...def,
          cep: formatCep(def.cep),
        });
        const clean = normalizeCep(def.cep);
        if (isValidCepFormat(clean)) {
          calculateShipping(clean);
        }
      }
    }
  }, [user]);

  // Handler for selecting an existing saved address
  const handleSelectSavedAddress = (savedAddr: Address) => {
    setSelectedAddressId(savedAddr.id);
    const formatted = {
      ...savedAddr,
      cep: formatCep(savedAddr.cep),
    };
    setAddress(formatted);
    setCepValidationError(null);

    const clean = normalizeCep(savedAddr.cep);
    if (isValidCepFormat(clean)) {
      calculateShipping(clean);
    }
    showToast('Endereço Selecionado', `${savedAddr.street}, ${savedAddr.number} (${savedAddr.city})`, 'info');
  };

  const handleSelectNewAddressMode = () => {
    setSelectedAddressId('new');
    setAddress({
      id: `addr-${Date.now()}`,
      recipientName: user ? user.name : '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      isDefault: false,
    });
  };

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');

  const checkoutAttemptIdRef = useRef<string>(crypto.randomUUID());
  const checkoutRequestInFlightRef = useRef(false);

  // Completed Order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [retryOrderId, setRetryOrderId] = useState<string | null>(null);
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(false);
  const [infinitePayReturn, setInfinitePayReturn] = useState<{
    orderNsu: string;
    transactionNsu: string;
    slug: string;
    receiptUrl?: string;
    captureMethod?: string;
  } | null>(null);

  // The return page never trusts URL parameters as proof of payment. It sends
  // the provider identifiers to the backend, which verifies them with
  // InfinitePay payment_check before any financial state is changed.
  const getPersistedOrder = async (orderId: string): Promise<Order> => {
    const response = await fetch('/api/infinitepay/orders/' + encodeURIComponent(orderId) + '/status', {
      headers: getCheckoutAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.order) throw new Error(data.error || 'Não foi possível consultar o pedido.');
    return data.order as Order;
  };

  const confirmInfinitePayReturn = async (references: {
    orderNsu: string;
    transactionNsu: string;
    slug: string;
    receiptUrl?: string;
    captureMethod?: string;
  }): Promise<Order> => {
    const response = await fetch('/api/infinitepay/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCheckoutAuthHeaders() },
      body: JSON.stringify(references),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 202) {
      throw new Error(data.error || 'Não foi possível validar o pagamento.');
    }
    if (!data.order) throw new Error('O backend não retornou o pedido validado.');
    return data.order as Order;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('infinitepay_return') !== '1') return;

    const expectedOrderId = params.get('expected_order_id') || '';
    const orderNsu = params.get('order_nsu') || '';
    const transactionNsu = params.get('transaction_nsu') || '';
    const slug = params.get('slug') || '';
    const receiptUrl = params.get('receipt_url') || undefined;
    const captureMethod = params.get('capture_method') || undefined;

    let cancelled = false;
    const validateReturn = async () => {
      setIsVerifyingStatus(true);
      try {
        if (!expectedOrderId || !orderNsu || expectedOrderId !== orderNsu || !transactionNsu || !slug) {
          if (expectedOrderId) {
            const pendingOrder = await getPersistedOrder(expectedOrderId);
            if (!cancelled) {
              setCompletedOrder(pendingOrder);
              registerOrder(pendingOrder);
              setRetryOrderId(pendingOrder.id);
              setStep(3);
            }
          }
          throw new Error('O retorno da InfinitePay não contém todos os identificadores esperados.');
        }

        const references = { orderNsu, transactionNsu, slug, receiptUrl, captureMethod };
        if (!cancelled) setInfinitePayReturn(references);
        const order = await confirmInfinitePayReturn(references);
        if (cancelled) return;

        setCompletedOrder(order);
        registerOrder(order);
        setStep(3);
        if (order.paymentStatus === 'Pago') {
          clearCart();
          setRetryOrderId(null);
          showToast('Pagamento confirmado!', 'Pedido #' + order.id + ' confirmado com segurança.', 'success');
        } else {
          setRetryOrderId(order.id);
          showToast('Pagamento ainda não confirmado', 'A InfinitePay não confirmou este pagamento. Seu carrinho foi preservado.', 'info');
        }
      } catch (error: any) {
        if (!cancelled) {
          showToast('Erro ao validar pagamento', error?.message || 'Tente verificar novamente em instantes.', 'error');
        }
      } finally {
        if (!cancelled) setIsVerifyingStatus(false);
      }
    };

    validateReturn();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVerifyPaymentNow = async () => {
    if (!completedOrder) return;
    setIsVerifyingStatus(true);
    try {
      const updatedOrder = infinitePayReturn
        ? await confirmInfinitePayReturn(infinitePayReturn)
        : await getPersistedOrder(completedOrder.id);
      setCompletedOrder(updatedOrder);
      registerOrder(updatedOrder);
      if (updatedOrder.paymentStatus === 'Pago') {
        clearCart();
        setRetryOrderId(null);
        showToast('Pagamento confirmado!', 'Pedido #' + updatedOrder.id + ' aprovado.', 'success');
      } else {
        showToast('Ainda não confirmado', 'A InfinitePay ainda não confirmou o pagamento.', 'info');
      }
    } catch (error: any) {
      showToast('Erro', error?.message || 'Não foi possível consultar o pedido.', 'error');
    } finally {
      setIsVerifyingStatus(false);
    }
  };


  // Calculate live shipping on page load if address CEP is present
  useEffect(() => {
    const clean = normalizeCep(address.cep);
    if (isValidCepFormat(clean) && clean.length === 8 && shippingOptions.length === 0) {
      calculateShipping(clean);
    }
  }, []);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setAddress((prev) => ({ ...prev, cep: formatted }));
    setCepValidationError(null);
  };

  // Auto-fill CEP via ViaCEP + Trigger Melhor Envio Calculation
  const handleCepBlur = async () => {
    const cleanCep = normalizeCep(address.cep);
    console.log('[CHECKOUT CALCULAR AGORA] Botão ou blur acionado com CEP:', cleanCep, 'Raw:', address.cep);

    if (!isValidCepFormat(cleanCep) || cleanCep.length !== 8) {
      const msg = `[Validação Bloqueou] CEP "${address.cep || ''}" inválido. Digite 8 dígitos numéricos.`;
      console.warn('[CHECKOUT CALCULAR AGORA]', msg);
      setCepValidationError(msg);
      showToast('Atenção', msg, 'error');
      return;
    }

    setLoadingCepLookup(true);
    setCepValidationError(null);

    try {
      console.log('[CHECKOUT CALCULAR AGORA] Consultando ViaCEP para endereço:', cleanCep);
      const cepCheck = await validateAndFetchCep(cleanCep);
      console.log('[CHECKOUT CALCULAR AGORA] Retorno ViaCEP:', cepCheck);

      if (cepCheck.address) {
        setAddress((prev) => ({
          ...prev,
          street: cepCheck.address?.street || prev.street,
          neighborhood: cepCheck.address?.neighborhood || prev.neighborhood,
          city: cepCheck.address?.city || prev.city,
          state: cepCheck.address?.state || prev.state,
        }));
        showToast('Endereço Identificado', `${cepCheck.address.city} - ${cepCheck.address.state}`, 'success');
      } else if (!cepCheck.exists) {
        console.warn('[CHECKOUT CALCULAR AGORA] ViaCEP não localizou endereço exato, mas prosseguindo com cotação de frete.');
      }

      // Always trigger calculateShipping
      console.log('[CHECKOUT CALCULAR AGORA] Chamando calculateShipping(', cleanCep, ')...');
      await calculateShipping(cleanCep);
    } catch (err: any) {
      console.error('[CHECKOUT CALCULAR AGORA] Erro:', err);
    } finally {
      setLoadingCepLookup(false);
    }
  };

  // Active shipping fee
  const activeShippingOption = selectedShipping || (shippingOptions.length > 0 ? shippingOptions[0] : null);
  const rawShippingFee = activeShippingOption ? (isFreeShipping ? 0 : activeShippingOption.price) : 0;

  // Calculations
  const shippingFee = rawShippingFee;
  const grandTotal = Math.max(0, cartSubtotal - cartDiscount + shippingFee);

  const handleApplyCouponForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    if (applyCoupon(couponCodeInput)) {
      setCouponCodeInput('');
    }
  };

  const handleProceedToPayment = async () => {
    if (cartItems.length === 0) {
      showToast('Carrinho Vazio', 'Adicione produtos antes de prosseguir.', 'error');
      return;
    }

    const cleanCep = normalizeCep(address.cep);
    if (!isValidCepFormat(cleanCep) || cleanCep.length !== 8) {
      showToast('CEP inválido', 'Digite um CEP válido para calcular a entrega.', 'error');
      return;
    }
    if (cepValidationError) {
      showToast('CEP inválido', cepValidationError, 'error');
      return;
    }
    if (!address.recipientName.trim()) {
      showToast('Dados incompletos', 'Informe o nome completo do destinatário.', 'error');
      return;
    }
    if (!address.street.trim() || !address.number.trim()) {
      showToast('Dados incompletos', 'Preencha o logradouro e número da entrega.', 'error');
      return;
    }
    if (!contactEmail.trim()) {
      showToast('Dados incompletos', 'Informe seu e-mail para receber a confirmação.', 'error');
      return;
    }

    const cleanCustomerCpf = cleanCpf(contactCpf);
    if (!cleanCustomerCpf) {
      setCpfError('Informe seu CPF para continuar.');
      showToast('CPF Obrigatório', 'Informe seu CPF para emissão da etiqueta de envio.', 'error');
      return;
    }
    if (!isValidCpf(cleanCustomerCpf)) {
      setCpfError('Informe um CPF válido.');
      showToast('CPF Inválido', 'Por favor, informe um CPF válido com os 11 dígitos corretos.', 'error');
      return;
    }
    setCpfError(null);

    if (!activeShippingOption) {
      showToast('Frete obrigatório', 'Aguarde o cálculo ou selecione uma opção de frete.', 'error');
      return;
    }

    // Auto-save new address to authenticated user account if requested or new
    if (user && saveAddressToAccount) {
      const alreadyExists = (user.addresses || []).some(
        (a) =>
          normalizeCep(a.cep) === cleanCep &&
          a.street.toLowerCase().trim() === address.street.toLowerCase().trim() &&
          a.number.toLowerCase().trim() === address.number.toLowerCase().trim()
      );

      if (!alreadyExists) {
        try {
          await addAddress({
            recipientName: address.recipientName.trim(),
            cep: cleanCep,
            street: address.street.trim(),
            number: address.number.trim(),
            complement: (address.complement || '').trim(),
            neighborhood: address.neighborhood.trim(),
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            isDefault: (user.addresses || []).length === 0,
          });
        } catch (saveErr) {
          console.warn('[Checkout] Address auto-save warning:', saveErr);
        }
      }
    }

    // Persist the pending order before requesting the hosted InfinitePay link.
    await handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    if (checkoutRequestInFlightRef.current) return;
    if (cartItems.length === 0) {
      showToast('Carrinho Vazio', 'Adicione produtos antes de finalizar.', 'error');
      return;
    }

    checkoutRequestInFlightRef.current = true;
    setIsPlacingOrder(true);
    setIsRedirecting(true);

    try {
      const carrierName = activeShippingOption?.carrier || activeShippingOption?.company || 'Melhor Envio';
      const serviceName = activeShippingOption?.name || 'SEDEX Expresso';
      const cleanCep = normalizeCep(address.cep);

      const authToken = localStorage.getItem('@marmot_auth_token') || localStorage.getItem('marmot_auth_token') || '';
      const orderPayload = {
        ...(retryOrderId ? { existingOrderId: retryOrderId } : {}),
        checkoutAttemptId: checkoutAttemptIdRef.current,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.selectedSize,
          colorName: item.selectedColor.colorName,
        })),
        couponCode: appliedCoupon?.code || (couponCodeInput.trim() ? couponCodeInput.trim() : undefined),
        paymentMethod: 'InfinitePay Checkout',
        shippingAddress: {
          ...address,
          cep: cleanCep,
        },
        shippingCarrier: carrierName,
        shippingService: serviceName,
        shippingQuoteId: activeShippingOption?.quoteId,
        shippingServiceId: activeShippingOption?.serviceId ? String(activeShippingOption.serviceId) : undefined,
        shippingDeliveryTime: activeShippingOption?.deliveryTime,
        payer: {
          email: contactEmail.trim(),
          name: address.recipientName.trim(),
          cpf: cleanCpf(contactCpf),
          phone: contactPhone.trim(),
        },
        payerEmail: contactEmail.trim(),
        payerName: address.recipientName.trim(),
        payerPhone: contactPhone.trim(),
        payerCpf: cleanCpf(contactCpf),
        customerCpf: cleanCpf(contactCpf),
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/infinitepay/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (typeof errData.orderId === 'string' && errData.orderId.trim()) {
          setRetryOrderId(errData.orderId.trim());
        }
        throw new Error(errData.error || 'Erro ao gerar o checkout seguro da InfinitePay.');
      }

      const data = await res.json();
      const targetCheckoutUrl = data.checkoutUrl || data.targetUrl;

      if (!targetCheckoutUrl) {
        throw new Error('Link de pagamento não retornado pela InfinitePay.');
      }

      if (data.order) {
        registerOrder(data.order);
        setCompletedOrder(data.order);
      }
      setRetryOrderId(null);

      setRedirectUrl(targetCheckoutUrl);
      // The cart stays intact until the backend verifies payment with InfinitePay.

      showToast('Redirecionando...', 'Abrindo o Checkout seguro da InfinitePay.', 'info');

      window.location.assign(targetCheckoutUrl);
    } catch (err: any) {
      console.error('[Checkout Place Order Error]', err);
      showToast('Erro ao finalizar pedido', err.message || 'Tente novamente.', 'error');
      setIsRedirecting(false);
      setIsPlacingOrder(false);
      checkoutRequestInFlightRef.current = false;
    }
  };

  return (
    <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-10">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header Steps */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#18181B]">
            CHECKOUT SEGURO • INFINITEPAY
          </h1>

          <div className="flex items-center justify-center gap-4 mt-6 max-w-md mx-auto">
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-[#B45309]' : 'text-[#71717A]'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step >= 1 ? 'bg-[#18181B] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>1</span>
              <span>Dados & Frete</span>
            </div>
            <div className="w-8 h-[1px] bg-[#E4E4E7]" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-[#B45309]' : 'text-[#71717A]'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step >= 2 ? 'bg-[#18181B] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>2</span>
              <span>Pagamento</span>
            </div>
            <div className="w-8 h-[1px] bg-[#E4E4E7]" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-[#B45309]' : 'text-[#71717A]'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step === 3 ? 'bg-[#18181B] text-white' : 'bg-[#F4F4F5] text-[#71717A]'}`}>3</span>
              <span>Confirmação</span>
            </div>
          </div>
        </div>

        {/* Step 3: Order Status & Confirmation View */}
        {step === 3 && completedOrder && (() => {
          const isApproved = completedOrder.status === 'Pagamento Aprovado' || completedOrder.paymentStatus === 'Pago';
          const isRejected = completedOrder.status === 'Pagamento Recusado' || completedOrder.paymentStatus === 'Recusado' || completedOrder.status === 'Cancelado';
          const isPending = !isApproved && !isRejected;

          return (
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 md:p-12 max-w-3xl mx-auto space-y-8 text-center animate-fadeIn shadow-xs">
              
              {/* STATE 1: APPROVED */}
              {isApproved && (
                <>
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pagamento Aprovado • Pedido Confirmado
                    </div>
                    <span className="text-xs font-mono font-bold text-[#B45309] uppercase tracking-widest block mb-1">
                      PEDIDO N° {completedOrder.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#18181B]">
                      OBRIGADO POR COMPRAR NA MARMOT!
                    </h2>
                    <p className="text-xs text-[#71717A] mt-2">
                      Enviamos os detalhes da compra e o comprovante para <strong>{contactEmail || completedOrder.payerEmail}</strong>.
                    </p>
                  </div>
                </>
              )}

              {/* STATE 2: PENDING (User returned without paying or waiting verification) */}
              {isPending && (
                <>
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                      <Clock className="w-3.5 h-3.5" /> Aguardando Pagamento • Pendente
                    </div>
                    <span className="text-xs font-mono font-bold text-[#B45309] uppercase tracking-widest block mb-1">
                      PEDIDO N° {completedOrder.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#18181B]">
                      PAGAMENTO PENDENTE
                    </h2>
                    <p className="text-xs text-[#52525B] mt-2 max-w-lg mx-auto">
                      Seu pedido foi registrado, mas o pagamento <strong>ainda não foi confirmado</strong> pela InfinitePay.
                    </p>
                  </div>

                  <div className="bg-[#FEF3C7]/40 border border-amber-200 p-5 rounded-xl text-left space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" /> Informações sobre o seu pagamento:
                    </div>
                    <p className="text-xs text-[#52525B] leading-relaxed">
                      A confirmação depende da verificação segura entre o servidor da Marmot e a InfinitePay. Seus itens continuam no carrinho enquanto o pedido estiver pendente.
                    </p>
                  </div>
                </>
              )}

              {/* STATE 3: REJECTED */}
              {isRejected && (
                <>
                  <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                      <XCircle className="w-3.5 h-3.5" /> Pagamento Recusado
                    </div>
                    <span className="text-xs font-mono font-bold text-[#B45309] uppercase tracking-widest block mb-1">
                      PEDIDO N° {completedOrder.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#18181B]">
                      PAGAMENTO NÃO CONCLUÍDO
                    </h2>
                    <p className="text-xs text-[#71717A] mt-2 max-w-lg mx-auto">
                      A transação não foi aprovada pela InfinitePay ou pela instituição financeira. Seus itens continuam salvos no carrinho para uma nova tentativa.
                    </p>
                  </div>
                </>
              )}

              {/* Order Details Summary Card */}
              <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-6 rounded-xl text-left space-y-4">
                <div className="flex justify-between text-xs font-bold border-b border-[#E4E4E7] pb-3">
                  <span>Status do Pagamento:</span>
                  <span className={`font-bold ${isApproved ? 'text-emerald-600' : isRejected ? 'text-red-600' : 'text-amber-600'}`}>
                    {completedOrder.paymentStatus || (isApproved ? 'Pago' : isRejected ? 'Recusado' : 'Pendente')}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#E4E4E7] pb-3">
                  <span>Valor Total:</span>
                  <span className="text-[#18181B] font-bold">R$ {completedOrder.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#E4E4E7] pb-3">
                  <span>Transportadora & Serviço:</span>
                  <span className="text-[#52525B] font-medium">{completedOrder.shippingCarrier} ({completedOrder.shippingService})</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#E4E4E7] pb-3">
                  <span>Código de Rastreamento:</span>
                  <span className="text-[#B45309] font-mono">{completedOrder.trackingCode}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#E4E4E7] pb-3">
                  <span>Previsão de Entrega:</span>
                  <span className="text-[#18181B]">{completedOrder.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>Endereço de Entrega:</span>
                  <span className="text-[#71717A] text-right">
                    {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.number} {completedOrder.shippingAddress.complement ? `(${completedOrder.shippingAddress.complement})` : ''} - {completedOrder.shippingAddress.city}/{completedOrder.shippingAddress.state} - CEP {completedOrder.shippingAddress.cep}
                  </span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="space-y-3 pt-2">
                {/* Primary Actions based on State */}
                {isApproved && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => onNavigate('tracking', completedOrder.trackingCode)}
                      className="flex-1 bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-black text-xs uppercase py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Package className="w-4 h-4" /> Rastrear Este Pedido
                    </button>
                    <button
                      onClick={() => onNavigate('home')}
                      className="flex-1 bg-[#F8F9FA] text-[#71717A] hover:text-[#18181B] border border-[#E4E4E7] font-extrabold text-xs uppercase py-4 rounded-xl transition-colors cursor-pointer"
                    >
                      Voltar à Loja
                    </button>
                  </div>
                )}

                {isPending && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleVerifyPaymentNow}
                        disabled={isVerifyingStatus}
                        className="flex-1 bg-[#18181B] text-white hover:bg-black font-bold text-xs uppercase py-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        {isVerifyingStatus ? <Loader2 className="w-4 h-4 animate-spin text-[#F4C400]" /> : <RefreshCw className="w-4 h-4" />}
                        {isVerifyingStatus ? 'Consultando pedido...' : 'Atualizar Status do Pedido'}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 bg-[#F8F9FA] text-[#18181B] border border-[#E4E4E7] hover:border-[#18181B] font-bold text-xs uppercase py-3.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Alterar Método de Pagamento / Voltar
                      </button>
                      <button
                        onClick={() => onNavigate('account')}
                        className="flex-1 bg-[#F8F9FA] text-[#71717A] hover:text-[#18181B] border border-[#E4E4E7] font-bold text-xs uppercase py-3.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Ver Meus Pedidos
                      </button>
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-black text-xs uppercase py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" /> Tentar Novamente / Outro Método
                    </button>
                    <button
                      onClick={() => onNavigate('account')}
                      className="flex-1 bg-[#F8F9FA] text-[#71717A] hover:text-[#18181B] border border-[#E4E4E7] font-extrabold text-xs uppercase py-4 rounded-xl transition-colors cursor-pointer"
                    >
                      Ver Meus Pedidos
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Empty Cart View */}
        {step < 3 && cartItems.length === 0 && (
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-10 max-w-xl mx-auto text-center space-y-5 animate-fadeIn shadow-xs">
            <div className="w-16 h-16 bg-[#F8F9FA] border border-[#E4E4E7] rounded-full flex items-center justify-center mx-auto text-[#18181B]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-[#18181B]">Seu carrinho está vazio</h2>
              <p className="text-xs text-[#71717A] mt-1">
                Adicione peças exclusivas do nosso catálogo para prosseguir com a finalização de compra.
              </p>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase px-8 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              Explorar Catálogo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1 & Step 2 Checkout Form */}
        {step < 3 && cartItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Form Left Column - 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              {step === 1 && (
                <div className="bg-white border border-[#E4E4E7] p-6 sm:p-8 rounded-2xl space-y-6 animate-fadeIn shadow-xs">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#18181B] flex items-center gap-2 border-b border-[#E4E4E7] pb-4">
                    <Truck className="w-4 h-4 text-[#B45309]" /> 1. Endereço e Opção de Envio (Melhor Envio)
                  </h2>

                  {/* Saved Addresses Selector (When user is logged in) */}
                  {user && userSavedAddresses.length > 0 && (
                    <div className="space-y-3 pb-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase text-[#18181B] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#B45309]" /> Meus Endereços Salvos
                        </label>
                        <button
                          type="button"
                          onClick={handleSelectNewAddressMode}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            selectedAddressId === 'new'
                              ? 'bg-[#18181B] text-white font-extrabold'
                              : 'text-[#B45309] hover:bg-[#F4F4F5]'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> Outro Endereço
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {userSavedAddresses.map((savedAddr) => {
                          const isSelected = selectedAddressId === savedAddr.id;
                          return (
                            <div
                              key={savedAddr.id}
                              onClick={() => handleSelectSavedAddress(savedAddr)}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs relative ${
                                isSelected
                                  ? 'bg-[#FEF3C7]/20 border-[#B45309] ring-1 ring-[#B45309]/30'
                                  : 'bg-[#F8F9FA] border-[#E4E4E7] hover:border-[#18181B]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="selected_saved_address"
                                    checked={isSelected}
                                    onChange={() => handleSelectSavedAddress(savedAddr)}
                                    className="accent-[#B45309]"
                                  />
                                  <span className="font-bold text-[#18181B] truncate">{savedAddr.recipientName}</span>
                                </div>
                                {savedAddr.isDefault && (
                                  <span className="text-[9px] bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-1.5 py-0.5 rounded font-mono font-bold">
                                    PADRÃO
                                  </span>
                                )}
                              </div>
                              <p className="text-[#52525B] pl-5 leading-relaxed text-[11px]">
                                {savedAddr.street}, {savedAddr.number}
                                {savedAddr.complement ? ` - ${savedAddr.complement}` : ''}
                                <br />
                                {savedAddr.neighborhood} • {savedAddr.city}/{savedAddr.state}
                                <br />
                                <span className="font-mono text-[10px] text-[#71717A]">CEP: {savedAddr.cep}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#71717A] block mb-1">Nome Completo do Destinatário</label>
                      <input
                        type="text"
                        value={address.recipientName}
                        onChange={(e) => {
                          setAddress({ ...address, recipientName: e.target.value });
                          if (selectedAddressId !== 'new') setSelectedAddressId('new');
                        }}
                        placeholder="Nome do destinatário"
                        className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">E-mail para Confirmação *</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="seuemail@exemplo.com"
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Telefone WhatsApp *</label>
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] flex items-center justify-between mb-1">
                          <span>CPF *</span>
                          {contactCpf && (
                            <span className={`text-[10px] font-mono font-bold ${isValidCpf(contactCpf) ? 'text-emerald-600' : 'text-red-500'}`}>
                              {isValidCpf(contactCpf) ? '✓ Válido' : 'Inválido'}
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={contactCpf}
                          onChange={(e) => {
                            setContactCpf(formatCpf(e.target.value));
                            if (cpfError) setCpfError(null);
                          }}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className={`w-full bg-[#F8F9FA] border px-3.5 py-3 rounded-xl text-xs text-[#18181B] font-mono focus:outline-none ${
                            cpfError ? 'border-red-500 bg-red-50/30' : 'border-[#E4E4E7] focus:border-[#18181B]'
                          }`}
                        />
                        <p className="text-[10px] text-[#71717A] mt-1 leading-tight">
                          Necessário para emissão da etiqueta de envio.
                        </p>
                        {cpfError && (
                          <p className="text-[10px] text-red-600 font-bold mt-0.5">
                            {cpfError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] flex items-center justify-between mb-1">
                          <span>CEP Destino</span>
                          {loadingCepLookup && <Loader2 className="w-3 h-3 animate-spin text-[#B45309]" />}
                        </label>
                        <input
                          type="text"
                          value={address.cep}
                          onChange={(e) => {
                            handleCepChange(e);
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          onBlur={handleCepBlur}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B] font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Rua / Logradouro</label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => {
                            setAddress({ ...address, street: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Avenida, Rua, Travessa..."
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Número</label>
                        <input
                          type="text"
                          value={address.number}
                          onChange={(e) => {
                            setAddress({ ...address, number: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="123"
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Complemento (Apto / Bloco)</label>
                        <input
                          type="text"
                          value={address.complement}
                          onChange={(e) => {
                            setAddress({ ...address, complement: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Apto, Bloco, Casa (opcional)"
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Bairro</label>
                        <input
                          type="text"
                          value={address.neighborhood}
                          onChange={(e) => {
                            setAddress({ ...address, neighborhood: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Bairro"
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Cidade</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => {
                            setAddress({ ...address, city: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Cidade"
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Estado (UF)</label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) => {
                            setAddress({ ...address, state: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="SP"
                          maxLength={2}
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B] uppercase"
                        />
                      </div>
                    </div>

                    {/* Auto-save address checkbox for logged-in user */}
                    {user && (
                      <label className="flex items-center gap-2 pt-1 text-xs text-[#71717A] cursor-pointer hover:text-[#18181B] select-none">
                        <input
                          type="checkbox"
                          checked={saveAddressToAccount}
                          onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                          className="accent-[#18181B] rounded"
                        />
                        <span>Salvar este endereço na minha conta para compras futuras</span>
                      </label>
                    )}
                  </div>

                  {/* Shipping Options Calculated from Melhor Envio */}
                  <div className="pt-4 border-t border-[#E4E4E7]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase text-[#18181B]">Opções de Envio</h3>
                        <span className="text-[10px] text-[#71717A] font-mono">
                          (Origem: SP • Destino: {address.cep || 'Informar CEP'})
                        </span>
                      </div>
                      {isCalculatingShipping && (
                        <div className="flex items-center gap-1.5 text-xs text-[#B45309]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Cotando Melhor Envio...</span>
                        </div>
                      )}
                    </div>

                    {shippingError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{shippingError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCepBlur}
                          disabled={isCalculatingShipping}
                          className="shrink-0 text-[11px] text-[#B45309] font-bold underline hover:text-[#18181B] cursor-pointer"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    )}

                    {shippingOptions.length > 0 ? (
                      <div className="space-y-2">
                        {shippingOptions.map((carrier) => {
                          const isSelected = activeShippingOption?.id === carrier.id || activeShippingOption?.serviceId === carrier.serviceId;
                          const effectivePrice = isFreeShipping ? 0 : carrier.price;

                          return (
                            <label
                              key={carrier.id}
                              onClick={() => setSelectedShipping(carrier)}
                              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#FEF3C7]/30 border-[#B45309] ring-1 ring-[#B45309]/30'
                                  : 'bg-[#F8F9FA] border-[#E4E4E7] hover:border-[#18181B]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="carrier"
                                  checked={isSelected}
                                  onChange={() => setSelectedShipping(carrier)}
                                  className="accent-[#B45309]"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-[#18181B]">{carrier.name}</p>
                                    <span className="text-[10px] text-[#71717A] font-mono">({carrier.carrier || carrier.company})</span>
                                  </div>
                                  <p className="text-[11px] text-[#71717A] mt-0.5">
                                    Previsão de entrega: {carrier.deliveryDays || `${carrier.deliveryTime} dias úteis`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {effectivePrice === 0 ? (
                                  <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                                    GRÁTIS
                                  </span>
                                ) : (
                                  <div>
                                    {carrier.originalPrice && carrier.originalPrice > carrier.price && (
                                      <span className="text-[10px] line-through text-[#A1A1AA] mr-1.5 font-mono">
                                        R$ {carrier.originalPrice.toFixed(2).replace('.', ',')}
                                      </span>
                                    )}
                                    <span className="text-xs font-black text-[#18181B] font-mono">
                                      R$ {effectivePrice.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#F8F9FA] border border-[#E4E4E7] rounded-xl text-center space-y-2">
                        <Truck className="w-5 h-5 text-[#B45309] mx-auto opacity-70" />
                        <p className="text-xs text-[#71717A]">
                          {shippingError
                            ? 'Ocorreu uma falha ao cotar no Melhor Envio. Clique abaixo para tentar novamente.'
                            : 'Digite o seu CEP acima para carregar as cotações em tempo real com as transportadoras.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleCepBlur}
                          disabled={isCalculatingShipping}
                          className="text-xs text-[#B45309] font-bold underline hover:text-[#18181B] disabled:opacity-50 cursor-pointer"
                        >
                          {isCalculatingShipping ? 'Calculando cotação...' : 'Calcular agora'}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    disabled={isRedirecting || isPlacingOrder}
                    className="w-full bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] disabled:opacity-60 disabled:cursor-not-allowed font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-md cursor-pointer"
                  >
                    {isRedirecting || isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>REDIRECIONANDO PARA A INFINITEPAY...</span>
                      </>
                    ) : (
                      <>
                        <span>CONTINUAR PARA O PAGAMENTO</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white border border-[#E4E4E7] p-6 sm:p-8 rounded-2xl space-y-6 animate-fadeIn shadow-xs">
                  <div className="flex justify-between items-center border-b border-[#E4E4E7] pb-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[#18181B] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#B45309]" /> 2. Pagamento seguro
                    </h2>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-[#B45309] font-bold hover:underline cursor-pointer"
                    >
                      Editar Dados & Frete
                    </button>
                  </div>

                  <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-5 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-[#18181B] uppercase flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#B45309]" /> Checkout hospedado pela InfinitePay
                    </p>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                      Você escolherá PIX ou cartão diretamente no ambiente seguro da InfinitePay. A Marmot não recebe nem armazena os dados do seu cartão.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-4 bg-[#F8F9FA] text-[#71717A] hover:text-[#18181B] border border-[#E4E4E7] font-bold text-xs uppercase rounded-xl cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      FINALIZAR COMPRA • R$ {grandTotal.toFixed(2).replace('.', ',')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Summary Column - 5 cols */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E4E4E7] p-6 rounded-2xl space-y-6 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#18181B] border-b border-[#E4E4E7] pb-4 flex justify-between items-center">
                  <span>Resumo do Pedido</span>
                  <span className="text-[#B45309] font-bold">{cartItems.length} Itens</span>
                </h3>

                {/* Items List */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => {
                    const rawItemImage =
                      (item.selectedColor?.images && item.selectedColor.images.length > 0)
                        ? item.selectedColor.images[0]
                        : (item.selectedColor?.featuredImage || item.selectedColor?.image || item.product.images?.[0] || (item.product as any).image);
                    const itemImage = getValidProductImageUrl(rawItemImage, item.product.category, item.product.id);

                    return (
                      <div key={idx} className="flex gap-3 items-center">
                        <img
                          src={itemImage}
                          alt={item.product.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleProductImageError(e, item.product.category, item.product.id)}
                          className="w-12 h-16 object-cover rounded-lg bg-[#F4F4F5] shrink-0 border border-[#E4E4E7]"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-[#18181B] truncate">{item.product.title}</p>
                          <p className="text-[10px] text-[#71717A]">
                            Tam: {item.selectedSize} • Cor: {item.selectedColor.colorName}
                          </p>
                          <p className="text-[11px] font-black text-[#18181B] mt-1">
                            {item.quantity}x R$ {(item.product.promoPrice || item.product.price).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCouponForm} className="flex gap-2 pt-2 border-t border-[#E4E4E7]">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder="Cupom (ex: MARMOT10)"
                    className="flex-1 bg-[#F8F9FA] border border-[#E4E4E7] text-xs px-3 py-2.5 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B] uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-[#18181B] text-white hover:bg-black font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Aplicar
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="bg-[#FEF3C7] border border-[#FDE68A] p-2.5 rounded-xl text-[11px] text-[#92400E] font-bold flex justify-between">
                    <span>Cupom {appliedCoupon.code} ativado</span>
                    <span>-{appliedCoupon.discountPercentage || appliedCoupon.discountValue}% OFF</span>
                  </div>
                )}

                {/* Values Breakdown */}
                <div className="space-y-2 text-xs border-t border-[#E4E4E7] pt-4 text-[#71717A]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-[#18181B] font-mono">R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Desconto Cupom:</span>
                      <span className="font-mono">- R$ {cartDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span>Frete:</span>
                      {activeShippingOption && (
                        <span className="text-[10px] text-[#71717A] font-mono">
                          {activeShippingOption.name} ({activeShippingOption.carrier || activeShippingOption.company}) • {activeShippingOption.deliveryDays}
                        </span>
                      )}
                    </div>
                    <span className="text-[#18181B] font-mono font-bold">
                      {!activeShippingOption ? (
                        <span className="text-[#71717A] font-sans font-normal text-xs">A calcular</span>
                      ) : isFreeShipping ? (
                        <span className="text-emerald-600">GRÁTIS</span>
                      ) : (
                        `R$ ${shippingFee.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black text-[#18181B] pt-2 border-t border-[#E4E4E7]">
                    <span>Total Final:</span>
                    <span className="text-[#18181B] font-mono">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E4E4E7] flex items-center justify-between text-[11px] text-[#71717A]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#B45309] shrink-0" />
                    <span>Ambiente Seguro SSL</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#B45309] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Melhor Envio
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* InfinitePay Checkout redirection overlay */}
        {isRedirecting && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-[#FEF3C7] border border-[#FDE68A] rounded-full flex items-center justify-center mx-auto text-[#B45309]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#B45309] uppercase tracking-widest block mb-1">
                  INFINITEPAY CHECKOUT
                </span>
                <h3 className="text-xl font-black uppercase text-[#18181B]">
                  Redirecionando...
                </h3>
                <p className="text-xs text-[#71717A] mt-2 leading-relaxed">
                  Você está sendo transferido para o Checkout hospedado da InfinitePay. A Marmot não recebe os dados do seu cartão.
                </p>
              </div>

              {redirectUrl && (
                <div className="space-y-3 pt-2">
                  <a
                    href={redirectUrl}
                    className="w-full bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-black text-xs uppercase py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>ABRIR CHECKOUT INFINITEPAY</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[10px] text-[#71717A]">
                    Caso a página não carregue automaticamente em 3 segundos, clique no botão acima.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
