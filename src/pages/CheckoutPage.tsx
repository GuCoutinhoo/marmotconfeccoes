import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  CreditCard,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Truck,
  Copy,
  Check,
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

interface CheckoutPageProps {
  onNavigate: (page: string, param?: string) => void;
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

  const { user, addOrder, addAddress } = useAuth();
  const { showToast } = useToast();

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
  const [contactCpf, setContactCpf] = useState(user?.cpf || '');

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

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Cartão' | 'Boleto'>('PIX');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');

  // Completed Order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(false);

  // Check URL params on mount when returning from Mercado Pago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('order_id') || params.get('external_reference');
    const paymentIdParam = params.get('payment_id') || params.get('collection_id');
    const statusParam = params.get('status') || params.get('collection_status');

    if (orderIdParam) {
      (async () => {
        setIsVerifyingStatus(true);
        try {
          // Verify with backend against Mercado Pago API
          const queryParams = new URLSearchParams();
          if (paymentIdParam) queryParams.set('payment_id', paymentIdParam);
          if (statusParam) queryParams.set('status', statusParam);

          const verifyUrl = `/api/mercadopago/verify-payment/${encodeURIComponent(orderIdParam)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
          const res = await fetch(verifyUrl);

          if (res.ok) {
            const data = await res.json();
            const returnedOrder: Order = data.order;
            setCompletedOrder(returnedOrder);
            addOrder(returnedOrder);
            setStep(3);

            if (data.approved || returnedOrder.status === 'Pagamento Aprovado' || returnedOrder.paymentStatus === 'Pago') {
              // Only clear cart upon confirmed payment approval
              clearCart();
              showToast('Pagamento Aprovado!', `Seu pedido #${returnedOrder.id} foi confirmado pelo Mercado Pago.`, 'success');
            } else if (returnedOrder.status === 'Pagamento Recusado' || returnedOrder.paymentStatus === 'Recusado' || data.status === 'rejected') {
              showToast('Pagamento Não Autorizado', 'O pagamento não foi aprovado pelo Mercado Pago. Você pode tentar outro método.', 'error');
            } else {
              // Order is awaiting payment / pending
              showToast('Pagamento Pendente', 'Seu pedido foi registrado, mas o pagamento ainda não foi confirmado.', 'info');
            }
          } else {
            // Fallback to fetch current order state from DB
            const fallbackRes = await fetch(`/api/orders/${encodeURIComponent(orderIdParam)}`);
            if (fallbackRes.ok) {
              const fallbackOrder: Order = await fallbackRes.json();
              setCompletedOrder(fallbackOrder);
              addOrder(fallbackOrder);
              setStep(3);
              if (fallbackOrder.status === 'Pagamento Aprovado' || fallbackOrder.paymentStatus === 'Pago') {
                clearCart();
              }
            }
          }
        } catch (err) {
          console.error('[Return from MP verification error]', err);
        } finally {
          setIsVerifyingStatus(false);
        }
      })();
    }
  }, []);

  const handleVerifyPaymentNow = async () => {
    if (!completedOrder) return;
    setIsVerifyingStatus(true);
    try {
      const paymentId = completedOrder.paymentDetails?.mercadoPagoPaymentId;
      const verifyUrl = `/api/mercadopago/verify-payment/${encodeURIComponent(completedOrder.id)}${paymentId ? `?payment_id=${encodeURIComponent(paymentId)}` : ''}`;
      const res = await fetch(verifyUrl);

      if (res.ok) {
        const data = await res.json();
        const updatedOrder: Order = data.order;
        setCompletedOrder(updatedOrder);
        addOrder(updatedOrder);

        if (data.approved || updatedOrder.status === 'Pagamento Aprovado' || updatedOrder.paymentStatus === 'Pago') {
          clearCart();
          showToast('Pagamento Aprovado!', `Pagamento do pedido #${updatedOrder.id} aprovado com sucesso!`, 'success');
        } else if (updatedOrder.status === 'Pagamento Recusado' || updatedOrder.paymentStatus === 'Recusado') {
          showToast('Pagamento Recusado', 'O pagamento foi recusado pelo Mercado Pago.', 'error');
        } else {
          showToast('Status Atualizado', 'O pedido permanece com pagamento pendente. Aguardando confirmação.', 'info');
        }
      } else {
        showToast('Aviso', 'Não foi possível atualizar o status agora. Tente novamente em instantes.', 'info');
      }
    } catch (err) {
      console.error('[Manual Verify Error]:', err);
      showToast('Erro', 'Falha ao consultar Mercado Pago.', 'error');
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
  const pixDiscountValue = paymentMethod === 'PIX' ? (cartSubtotal - cartDiscount) * 0.05 : 0;
  const shippingFee = rawShippingFee;
  const grandTotal = Math.max(0, cartSubtotal - cartDiscount - pixDiscountValue + shippingFee);

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

    // Directly create preference and redirect to Mercado Pago Checkout
    await handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showToast('Carrinho Vazio', 'Adicione produtos antes de finalizar.', 'error');
      return;
    }

    setIsPlacingOrder(true);
    setIsRedirecting(true);

    try {
      const carrierName = activeShippingOption?.carrier || activeShippingOption?.company || 'Melhor Envio';
      const serviceName = activeShippingOption?.name || 'SEDEX Expresso';
      const cleanCep = normalizeCep(address.cep);

      const targetPaymentMethod = paymentMethod === 'Cartão'
        ? 'Cartão de Crédito'
        : paymentMethod === 'Boleto'
        ? 'Boleto Bancário'
        : paymentMethod === 'PIX'
        ? 'PIX'
        : 'Mercado Pago Checkout Pro';

      const authToken = localStorage.getItem('@marmot_auth_token') || localStorage.getItem('marmot_auth_token') || '';
      const orderPayload = {
        orderId: `MM-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user?.id || undefined,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.selectedSize,
          colorName: item.selectedColor.colorName,
        })),
        couponCode: appliedCoupon?.code || (couponCodeInput.trim() ? couponCodeInput.trim() : undefined),
        paymentMethod: targetPaymentMethod,
        shippingFee,
        shippingAddress: {
          ...address,
          cep: cleanCep,
        },
        shippingCarrier: carrierName,
        shippingService: serviceName,
        shippingServiceId: activeShippingOption?.serviceId ? String(activeShippingOption.serviceId) : undefined,
        shippingDeliveryTime: activeShippingOption?.deliveryTime,
        payer: {
          email: contactEmail,
          name: address.recipientName,
          cpf: contactCpf,
          phone: contactPhone,
        },
        payerEmail: contactEmail,
        payerName: address.recipientName,
        payerPhone: contactPhone,
        payerCpf: contactCpf,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Call backend secure Mercado Pago preference endpoint
      const res = await fetch('/api/mercado-pago/create-preference', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao gerar o checkout do Mercado Pago.');
      }

      const data = await res.json();
      const targetCheckoutUrl = data.targetUrl || data.initPoint || data.sandboxInitPoint;

      if (data.order) {
        addOrder(data.order);
        setCompletedOrder(data.order);
      }

      setRedirectUrl(targetCheckoutUrl);
      // NOTE: Cart is NOT cleared here! Only cleared after verified approval from Mercado Pago.

      showToast('Redirecionando...', 'Abrindo o Checkout Seguro do Mercado Pago.', 'info');

      // Direct redirection to Mercado Pago
      setTimeout(() => {
        window.location.href = targetCheckoutUrl;
      }, 300);
    } catch (err: any) {
      console.error('[Checkout Place Order Error]', err);
      showToast('Erro ao finalizar pedido', err.message || 'Tente novamente.', 'error');
      setIsRedirecting(false);
      setIsPlacingOrder(false);
    }
  };

  const handleCopyPix = () => {
    if (completedOrder?.paymentDetails?.pixCopiaECola) {
      navigator.clipboard.writeText(completedOrder.paymentDetails.pixCopiaECola);
      setCopiedPix(true);
      showToast('PIX Copiado!', 'Código copia e cola salvo na área de transferência.', 'info');
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  return (
    <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Steps */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
            CHECKOUT SEGURO • MERCADO PAGO
          </h1>

          <div className="flex items-center justify-center gap-4 mt-6 max-w-md mx-auto">
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-[#D6B35A]' : 'text-[#777777]'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step >= 1 ? 'bg-[#D6B35A] text-black' : 'bg-[#161616] text-[#777777]'}`}>1</span>
              <span>Dados & Frete</span>
            </div>
            <div className="w-8 h-[1px] bg-[#262626]" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-[#D6B35A]' : 'text-[#777777]'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step >= 2 ? 'bg-[#D6B35A] text-black' : 'bg-[#161616] text-[#777777]'}`}>2</span>
              <span>Pagamento</span>
            </div>
            <div className="w-8 h-[1px] bg-[#262626]" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-[#D6B35A]' : 'text-[#777777]'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step === 3 ? 'bg-[#D6B35A] text-black' : 'bg-[#161616] text-[#777777]'}`}>3</span>
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
            <div className="bg-[#161616] border border-[#262626] rounded-2xl p-8 md:p-12 max-w-3xl mx-auto space-y-8 text-center animate-fadeIn">
              
              {/* STATE 1: APPROVED */}
              {isApproved && (
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pagamento Aprovado • Pedido Confirmado
                    </div>
                    <span className="text-xs font-mono font-bold text-[#D6B35A] uppercase tracking-widest block mb-1">
                      PEDIDO N° {completedOrder.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#EFECE6]">
                      OBRIGADO POR COMPRAR NA MARMOT!
                    </h2>
                    <p className="text-xs text-[#777777] mt-2">
                      Enviamos os detalhes da compra e o comprovante para <strong>{contactEmail || completedOrder.payerEmail}</strong>.
                    </p>
                  </div>
                </>
              )}

              {/* STATE 2: PENDING (User returned without paying or waiting verification) */}
              {isPending && (
                <>
                  <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/40 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                      <Clock className="w-3.5 h-3.5" /> Aguardando Pagamento • Pendente
                    </div>
                    <span className="text-xs font-mono font-bold text-[#D6B35A] uppercase tracking-widest block mb-1">
                      PEDIDO N° {completedOrder.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#EFECE6]">
                      PAGAMENTO PENDENTE
                    </h2>
                    <p className="text-xs text-[#EFECE6]/80 mt-2 max-w-lg mx-auto">
                      Seu pedido foi registrado no sistema, mas o pagamento <strong>ainda não foi confirmado</strong> pelo Mercado Pago.
                    </p>
                  </div>

                  <div className="bg-[#080808] border border-amber-500/20 p-5 rounded-xl text-left space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" /> Informações sobre o seu pagamento:
                    </div>
                    <p className="text-xs text-[#777777] leading-relaxed">
                      Caso já tenha concluído o pagamento via PIX ou Boleto, a compensação pode levar alguns instantes. Se você fechou o checkout antes de pagar, utilize o botão abaixo para concluir o pagamento no Mercado Pago.
                    </p>
                  </div>
                </>
              )}

              {/* STATE 3: REJECTED */}
              {isRejected && (
                <>
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/40 text-red-400 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                      <XCircle className="w-3.5 h-3.5" /> Pagamento Recusado
                    </div>
                    <span className="text-xs font-mono font-bold text-[#D6B35A] uppercase tracking-widest block mb-1">
                      PEDIDO N° {completedOrder.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#EFECE6]">
                      PAGAMENTO NÃO CONCLUÍDO
                    </h2>
                    <p className="text-xs text-[#777777] mt-2 max-w-lg mx-auto">
                      A transação não foi aprovada pelo Mercado Pago ou operadora do cartão. Seus itens continuam salvos no carrinho para você tentar novamente.
                    </p>
                  </div>
                </>
              )}

              {/* PIX Payment Banner if PIX selected & still pending */}
              {isPending && completedOrder.paymentMethod === 'PIX' && completedOrder.paymentDetails?.pixQrCode && (
                <div className="bg-[#080808] border border-[#D6B35A] p-6 rounded-xl space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-[#D6B35A]" />
                      <span className="text-xs font-black uppercase text-[#EFECE6]">Pague via PIX com 5% de Desconto</span>
                    </div>
                    <span className="text-xs font-bold text-[#D6B35A]">R$ {completedOrder.total.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                    <img
                      src={completedOrder.paymentDetails.pixQrCode}
                      alt="QR Code PIX"
                      className="w-40 h-40 bg-white p-2 rounded-lg border border-white"
                    />
                    <div className="space-y-3 flex-1">
                      <p className="text-xs text-[#777777]">
                        Escaneie o QR Code acima pelo app do seu banco ou copie a chave aleatória abaixo:
                      </p>
                      <button
                        onClick={handleCopyPix}
                        className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-3 rounded transition-colors flex items-center justify-center gap-2"
                      >
                        {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedPix ? 'CÓDIGO COPIADO!' : 'COPIAR CHAVE PIX COPIA E COLA'}
                      </button>
                      <p className="text-[10px] text-[#777777] text-center sm:text-left">
                        Aprovação instantânea 24h por dia via Mercado Pago.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details Summary Card */}
              <div className="bg-[#080808] border border-[#262626] p-6 rounded-xl text-left space-y-4">
                <div className="flex justify-between text-xs font-bold border-b border-[#262626] pb-3">
                  <span>Status do Pagamento:</span>
                  <span className={`font-bold ${isApproved ? 'text-emerald-400' : isRejected ? 'text-red-400' : 'text-amber-400'}`}>
                    {completedOrder.paymentStatus || (isApproved ? 'Pago' : isRejected ? 'Recusado' : 'Pendente')}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#262626] pb-3">
                  <span>Valor Total:</span>
                  <span className="text-[#D6B35A] font-bold">R$ {completedOrder.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#262626] pb-3">
                  <span>Transportadora & Serviço:</span>
                  <span className="text-[#D6B35A] font-medium">{completedOrder.shippingCarrier} ({completedOrder.shippingService})</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#262626] pb-3">
                  <span>Código de Rastreamento:</span>
                  <span className="text-[#D6B35A] font-mono">{completedOrder.trackingCode}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-[#262626] pb-3">
                  <span>Previsão de Entrega:</span>
                  <span className="text-[#EFECE6]">{completedOrder.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>Endereço de Entrega:</span>
                  <span className="text-[#777777] text-right">
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
                      className="flex-1 bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-black text-xs uppercase py-4 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" /> Rastrear Este Pedido
                    </button>
                    <button
                      onClick={() => onNavigate('home')}
                      className="flex-1 bg-[#080808] text-[#777777] hover:text-[#EFECE6] border border-[#262626] font-extrabold text-xs uppercase py-4 rounded transition-colors"
                    >
                      Voltar à Loja
                    </button>
                  </div>
                )}

                {isPending && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {completedOrder.paymentDetails?.mercadoPagoInitPoint && (
                        <a
                          href={completedOrder.paymentDetails.mercadoPagoInitPoint}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-black text-xs uppercase py-4 rounded transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" /> Concluir Pagamento no Mercado Pago <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={handleVerifyPaymentNow}
                        disabled={isVerifyingStatus}
                        className="flex-1 bg-[#262626] text-[#EFECE6] hover:bg-[#333333] font-bold text-xs uppercase py-4 rounded transition-colors flex items-center justify-center gap-2"
                      >
                        {isVerifyingStatus ? <Loader2 className="w-4 h-4 animate-spin text-[#D6B35A]" /> : <RefreshCw className="w-4 h-4" />}
                        {isVerifyingStatus ? 'Consultando Mercado Pago...' : 'Verificar Pagamento Agora'}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 bg-[#080808] text-[#D6B35A] border border-[#262626] hover:border-[#D6B35A] font-bold text-xs uppercase py-3.5 rounded transition-colors"
                      >
                        Alterar Método de Pagamento / Voltar
                      </button>
                      <button
                        onClick={() => onNavigate('account')}
                        className="flex-1 bg-[#080808] text-[#777777] hover:text-[#EFECE6] border border-[#262626] font-bold text-xs uppercase py-3.5 rounded transition-colors"
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
                      className="flex-1 bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-black text-xs uppercase py-4 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" /> Tentar Novamente / Outro Método
                    </button>
                    <button
                      onClick={() => onNavigate('account')}
                      className="flex-1 bg-[#080808] text-[#777777] hover:text-[#EFECE6] border border-[#262626] font-extrabold text-xs uppercase py-4 rounded transition-colors"
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
          <div className="bg-[#161616] border border-[#262626] rounded-2xl p-10 max-w-xl mx-auto text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 bg-[#080808] border border-[#262626] rounded-full flex items-center justify-center mx-auto text-[#D6B35A]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-[#EFECE6]">Seu carrinho está vazio</h2>
              <p className="text-xs text-[#777777] mt-1">
                Adicione peças exclusivas do nosso catálogo para prosseguir com a finalização de compra.
              </p>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase px-8 py-3.5 rounded transition-colors inline-flex items-center gap-2"
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
                <div className="bg-[#161616] border border-[#262626] p-6 sm:p-8 rounded-2xl space-y-6 animate-fadeIn">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#EFECE6] flex items-center gap-2 border-b border-[#262626] pb-4">
                    <Truck className="w-4 h-4 text-[#D6B35A]" /> 1. Endereço e Opção de Envio (Melhor Envio)
                  </h2>

                  {/* Saved Addresses Selector (When user is logged in) */}
                  {user && userSavedAddresses.length > 0 && (
                    <div className="space-y-3 pb-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase text-[#EFECE6] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D6B35A]" /> Meus Endereços Salvos
                        </label>
                        <button
                          type="button"
                          onClick={handleSelectNewAddressMode}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                            selectedAddressId === 'new'
                              ? 'bg-[#D6B35A] text-black font-extrabold'
                              : 'text-[#D6B35A] hover:bg-[#262626]'
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
                                  ? 'bg-[#080808] border-[#D6B35A] ring-1 ring-[#D6B35A]/30'
                                  : 'bg-[#080808] border-[#262626] hover:border-[#444444]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="selected_saved_address"
                                    checked={isSelected}
                                    onChange={() => handleSelectSavedAddress(savedAddr)}
                                    className="accent-[#D6B35A]"
                                  />
                                  <span className="font-bold text-[#EFECE6] truncate">{savedAddr.recipientName}</span>
                                </div>
                                {savedAddr.isDefault && (
                                  <span className="text-[9px] bg-[#D6B35A]/15 text-[#D6B35A] border border-[#D6B35A]/40 px-1.5 py-0.5 rounded font-mono font-bold">
                                    PADRÃO
                                  </span>
                                )}
                              </div>
                              <p className="text-[#888888] pl-5 leading-relaxed text-[11px]">
                                {savedAddr.street}, {savedAddr.number}
                                {savedAddr.complement ? ` - ${savedAddr.complement}` : ''}
                                <br />
                                {savedAddr.neighborhood} • {savedAddr.city}/{savedAddr.state}
                                <br />
                                <span className="font-mono text-[10px] text-[#AAAAAA]">CEP: {savedAddr.cep}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#777777] block mb-1">Nome Completo do Destinatário</label>
                      <input
                        type="text"
                        value={address.recipientName}
                        onChange={(e) => {
                          setAddress({ ...address, recipientName: e.target.value });
                          if (selectedAddressId !== 'new') setSelectedAddressId('new');
                        }}
                        placeholder="Nome do destinatário"
                        className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">E-mail para Confirmação</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="seuemail@exemplo.com"
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Telefone WhatsApp</label>
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] flex items-center justify-between mb-1">
                          <span>CEP Destino</span>
                          {loadingCepLookup && <Loader2 className="w-3 h-3 animate-spin text-[#D6B35A]" />}
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
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A] font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Rua / Logradouro</label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => {
                            setAddress({ ...address, street: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Avenida, Rua, Travessa..."
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Número</label>
                        <input
                          type="text"
                          value={address.number}
                          onChange={(e) => {
                            setAddress({ ...address, number: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="123"
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Complemento (Apto / Bloco)</label>
                        <input
                          type="text"
                          value={address.complement}
                          onChange={(e) => {
                            setAddress({ ...address, complement: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Apto, Bloco, Casa (opcional)"
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Bairro</label>
                        <input
                          type="text"
                          value={address.neighborhood}
                          onChange={(e) => {
                            setAddress({ ...address, neighborhood: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Bairro"
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Cidade</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => {
                            setAddress({ ...address, city: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="Cidade"
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Estado (UF)</label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) => {
                            setAddress({ ...address, state: e.target.value });
                            if (selectedAddressId !== 'new') setSelectedAddressId('new');
                          }}
                          placeholder="SP"
                          maxLength={2}
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A] uppercase"
                        />
                      </div>
                    </div>

                    {/* Auto-save address checkbox for logged-in user */}
                    {user && (
                      <label className="flex items-center gap-2 pt-1 text-xs text-[#AAAAAA] cursor-pointer hover:text-[#EFECE6] select-none">
                        <input
                          type="checkbox"
                          checked={saveAddressToAccount}
                          onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                          className="accent-[#D6B35A] rounded"
                        />
                        <span>Salvar este endereço na minha conta para compras futuras</span>
                      </label>
                    )}
                  </div>

                  {/* Shipping Options Calculated from Melhor Envio */}
                  <div className="pt-4 border-t border-[#262626]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase text-[#EFECE6]">Opções de Envio</h3>
                        <span className="text-[10px] text-[#777777] font-mono">
                          (Origem: SP • Destino: {address.cep || 'Informar CEP'})
                        </span>
                      </div>
                      {isCalculatingShipping && (
                        <div className="flex items-center gap-1.5 text-xs text-[#D6B35A]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Cotando Melhor Envio...</span>
                        </div>
                      )}
                    </div>

                    {shippingError && (
                      <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-xs text-red-300 mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{shippingError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCepBlur}
                          disabled={isCalculatingShipping}
                          className="shrink-0 text-[11px] text-[#D6B35A] font-bold underline hover:text-[#EFECE6]"
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
                              className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#080808] border-[#D6B35A]'
                                  : 'bg-[#080808] border-[#262626] hover:border-[#555555]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="carrier"
                                  checked={isSelected}
                                  onChange={() => setSelectedShipping(carrier)}
                                  className="accent-[#D6B35A]"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-[#EFECE6]">{carrier.name}</p>
                                    <span className="text-[10px] text-[#888888] font-mono">({carrier.carrier || carrier.company})</span>
                                  </div>
                                  <p className="text-[11px] text-[#777777] mt-0.5">
                                    Previsão de entrega: {carrier.deliveryDays || `${carrier.deliveryTime} dias úteis`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {effectivePrice === 0 ? (
                                  <span className="text-xs font-black text-[#D6B35A] uppercase tracking-wider">
                                    GRÁTIS
                                  </span>
                                ) : (
                                  <div>
                                    {carrier.originalPrice && carrier.originalPrice > carrier.price && (
                                      <span className="text-[10px] line-through text-[#666666] mr-1.5 font-mono">
                                        R$ {carrier.originalPrice.toFixed(2).replace('.', ',')}
                                      </span>
                                    )}
                                    <span className="text-xs font-black text-[#EFECE6] font-mono">
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
                      <div className="p-4 bg-[#080808] border border-[#262626] rounded-lg text-center space-y-2">
                        <Truck className="w-5 h-5 text-[#D6B35A] mx-auto opacity-70" />
                        <p className="text-xs text-[#777777]">
                          {shippingError
                            ? 'Ocorreu uma falha ao cotar no Melhor Envio. Clique abaixo para tentar novamente.'
                            : 'Digite o seu CEP acima para carregar as cotações em tempo real com as transportadoras.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleCepBlur}
                          disabled={isCalculatingShipping}
                          className="text-xs text-[#D6B35A] font-bold underline hover:text-[#EFECE6] disabled:opacity-50"
                        >
                          {isCalculatingShipping ? 'Calculando cotação...' : 'Calcular agora'}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    disabled={isRedirecting || isPlacingOrder}
                    className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] disabled:opacity-60 disabled:cursor-not-allowed font-extrabold text-xs uppercase tracking-wider py-4 rounded transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-[#D6B35A]/10"
                  >
                    {isRedirecting || isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>REDIRECIONANDO PARA O MERCADO PAGO...</span>
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
                <div className="bg-[#161616] border border-[#262626] p-6 sm:p-8 rounded-2xl space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#262626] pb-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[#EFECE6] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#D6B35A]" /> 2. Método de Pagamento (Mercado Pago)
                    </h2>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-[#D6B35A] font-bold hover:underline"
                    >
                      Editar Dados & Frete
                    </button>
                  </div>

                  {/* Payment Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === 'PIX'
                          ? 'bg-[#080808] border-[#D6B35A] text-[#D6B35A]'
                          : 'bg-[#080808] border-[#262626] text-[#777777] hover:text-[#EFECE6]'
                      }`}
                    >
                      <QrCode className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase">PIX (5% OFF)</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('Cartão')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === 'Cartão'
                          ? 'bg-[#080808] border-[#D6B35A] text-[#D6B35A]'
                          : 'bg-[#080808] border-[#262626] text-[#777777] hover:text-[#EFECE6]'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase">Cartão 10x</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('Boleto')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === 'Boleto'
                          ? 'bg-[#080808] border-[#D6B35A] text-[#D6B35A]'
                          : 'bg-[#080808] border-[#262626] text-[#777777] hover:text-[#EFECE6]'
                      }`}
                    >
                      <FileText className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase">Boleto</span>
                    </button>
                  </div>

                  {/* PIX Explanation */}
                  {paymentMethod === 'PIX' && (
                    <div className="bg-[#080808] border border-[#D6B35A]/40 p-5 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-[#D6B35A] uppercase flex items-center gap-1">
                        <Check className="w-4 h-4" /> Desconto de 5% aplicado automaticamente
                      </p>
                      <p className="text-xs text-[#777777] leading-relaxed">
                        Ao clicar em "Finalizar Pedido", geraremos o QR Code oficial e a chave copia e cola PIX do Mercado Pago.
                      </p>
                    </div>
                  )}

                  {/* Credit Card Form */}
                  {paymentMethod === 'Cartão' && (
                    <div className="space-y-4 bg-[#080808] border border-[#262626] p-5 rounded-xl">
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Número do Cartão</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4532 •••• •••• 8812"
                          className="w-full bg-[#161616] border border-[#262626] px-3.5 py-2.5 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="EX: LUCAS MENDES"
                          className="w-full bg-[#161616] border border-[#262626] px-3.5 py-2.5 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-[#777777] block mb-1">Validade (MM/AA)</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="08/28"
                            className="w-full bg-[#161616] border border-[#262626] px-3.5 py-2.5 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#777777] block mb-1">CVV</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="123"
                            className="w-full bg-[#161616] border border-[#262626] px-3.5 py-2.5 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Parcelamento</label>
                        <select
                          value={cardInstallments}
                          onChange={(e) => setCardInstallments(e.target.value)}
                          className="w-full bg-[#161616] border border-[#262626] px-3.5 py-2.5 rounded text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        >
                          <option value="1">1x de R$ {grandTotal.toFixed(2).replace('.', ',')} sem juros</option>
                          <option value="2">2x de R$ {(grandTotal / 2).toFixed(2).replace('.', ',')} sem juros</option>
                          <option value="3">3x de R$ {(grandTotal / 3).toFixed(2).replace('.', ',')} sem juros</option>
                          <option value="6">6x de R$ {(grandTotal / 6).toFixed(2).replace('.', ',')} sem juros</option>
                          <option value="10">10x de R$ {(grandTotal / 10).toFixed(2).replace('.', ',')} sem juros</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Boleto Info */}
                  {paymentMethod === 'Boleto' && (
                    <div className="bg-[#080808] border border-[#262626] p-5 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-[#EFECE6] uppercase">Instruções para Boleto Bancário</p>
                      <p className="text-xs text-[#777777]">
                        O boleto pode levar até 3 dias úteis para compensar. Os itens ficam reservados por 24 horas.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-4 bg-[#080808] text-[#777777] hover:text-[#EFECE6] border border-[#262626] font-bold text-xs uppercase rounded"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-4 rounded transition-colors flex items-center justify-center gap-2 shadow-xl"
                    >
                      FINALIZAR COMPRA • R$ {grandTotal.toFixed(2).replace('.', ',')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Summary Column - 5 cols */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#161616] border border-[#262626] p-6 rounded-2xl space-y-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#EFECE6] border-b border-[#262626] pb-4 flex justify-between items-center">
                  <span>Resumo do Pedido</span>
                  <span className="text-[#D6B35A]">{cartItems.length} Itens</span>
                </h3>

                {/* Items List */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img
                        src={item.product.images?.[0] || (item.product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                        alt={item.product.title}
                        className="w-12 h-16 object-cover rounded bg-black shrink-0 border border-[#262626]"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-[#EFECE6] truncate">{item.product.title}</p>
                        <p className="text-[10px] text-[#777777]">
                          Tam: {item.selectedSize} • Cor: {item.selectedColor.colorName}
                        </p>
                        <p className="text-[11px] font-black text-[#EFECE6] mt-1">
                          {item.quantity}x R$ {(item.product.promoPrice || item.product.price).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCouponForm} className="flex gap-2 pt-2 border-t border-[#262626]">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder="Cupom (ex: MARMOT10)"
                    className="flex-1 bg-[#080808] border border-[#262626] text-xs px-3 py-2 rounded text-[#EFECE6] focus:outline-none focus:border-[#D6B35A] uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase px-4 py-2 rounded transition-colors"
                  >
                    Aplicar
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="bg-[#D6B35A]/10 border border-[#D6B35A]/40 p-2.5 rounded text-[11px] text-[#D6B35A] font-bold flex justify-between">
                    <span>Cupom {appliedCoupon.code} ativado</span>
                    <span>-{appliedCoupon.discountPercentage || appliedCoupon.discountValue}% OFF</span>
                  </div>
                )}

                {/* Values Breakdown */}
                <div className="space-y-2 text-xs border-t border-[#262626] pt-4 text-[#777777]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-[#EFECE6] font-mono">R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-[#D6B35A]">
                      <span>Desconto Cupom:</span>
                      <span className="font-mono">- R$ {cartDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  {pixDiscountValue > 0 && (
                    <div className="flex justify-between text-[#D6B35A]">
                      <span>Desconto PIX 5%:</span>
                      <span className="font-mono">- R$ {pixDiscountValue.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span>Frete:</span>
                      {activeShippingOption && (
                        <span className="text-[10px] text-[#888888] font-mono">
                          {activeShippingOption.name} ({activeShippingOption.carrier || activeShippingOption.company}) • {activeShippingOption.deliveryDays}
                        </span>
                      )}
                    </div>
                    <span className="text-[#EFECE6] font-mono font-bold">
                      {!activeShippingOption ? (
                        <span className="text-[#777777] font-sans font-normal text-xs">A calcular</span>
                      ) : isFreeShipping ? (
                        <span className="text-[#D6B35A]">GRÁTIS</span>
                      ) : (
                        `R$ ${shippingFee.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black text-[#EFECE6] pt-2 border-t border-[#262626]">
                    <span>Total Final:</span>
                    <span className="text-[#D6B35A] font-mono">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#080808] rounded-lg border border-[#262626] flex items-center justify-between text-[11px] text-[#777777]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#D6B35A] shrink-0" />
                    <span>Ambiente Seguro SSL</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#D6B35A] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Melhor Envio
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mercado Pago Redirection Overlay Modal */}
        {isRedirecting && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#161616] border border-[#D6B35A]/50 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-[#D6B35A]/10 border border-[#D6B35A] rounded-full flex items-center justify-center mx-auto text-[#D6B35A]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#D6B35A] uppercase tracking-widest block mb-1">
                  MERCADO PAGO CHECKOUT
                </span>
                <h3 className="text-xl font-black uppercase text-[#EFECE6]">
                  Redirecionando...
                </h3>
                <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                  Você está sendo transferido com segurança para o ambiente oficial de pagamentos do Mercado Pago (PIX com 5% OFF, Cartão ou Boleto).
                </p>
              </div>

              {redirectUrl && (
                <div className="space-y-3 pt-2">
                  <a
                    href={redirectUrl}
                    className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-black text-xs uppercase py-3.5 px-4 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <span>ABRIR CHECKOUT MERCADO PAGO</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[10px] text-[#666666]">
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
