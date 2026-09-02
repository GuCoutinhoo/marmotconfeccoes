import React, { useState, useEffect } from 'react';
import { Truck, Check, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { ShippingOption } from '../types';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { validateAndFetchCep, normalizeCep, isValidCepFormat, formatCep } from '../services/cepService';
import { filterAndSortShippingQuotes } from '../services/carrierFilter';

interface ShippingCalculatorProps {
  subtotal?: number;
  productId?: string;
  items?: Array<{ productId: string; quantity: number }>;
  onSelectOption?: (option: ShippingOption) => void;
  initialPostalCode?: string;
  compact?: boolean;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  subtotal: propSubtotal,
  productId,
  items: propItems,
  onSelectOption,
  initialPostalCode,
  compact = false,
}) => {
  const { products } = useStore();
  const {
    cart,
    subtotal: cartSubtotal,
    isFreeShippingEligible,
    selectedShipping,
    setSelectedShipping,
    shippingPostalCode,
    setShippingPostalCode,
  } = useCart();

  const activeSubtotal = propSubtotal !== undefined ? propSubtotal : cartSubtotal;
  const isFree = activeSubtotal >= 399;

  const [cep, setCep] = useState(() => {
    const raw = initialPostalCode || shippingPostalCode || '';
    return formatCep(raw);
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(() => selectedShipping?.id || null);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    // Invalidate previous quotes and errors immediately when CEP changes
    setOptions(null);
    setSelectedOptionId(null);
    setErrorMessage(null);
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCep = normalizeCep(cep);

    console.log('[SHIPPING CALCULATOR COMPONENT] 1. Início. CEP:', cleanCep, 'Raw:', cep, 'productId:', productId, 'cart:', cart.length);

    // 1. Format validation
    if (!isValidCepFormat(cleanCep) || cleanCep.length !== 8) {
      const errorMsg = `[Validação Bloqueou] CEP "${cep}" inválido. Digite 8 dígitos numéricos.`;
      console.warn('[SHIPPING CALCULATOR COMPONENT]', errorMsg);
      setErrorMessage(errorMsg);
      setOptions(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setOptions(null);

    try {
      // 2. Real CEP existence check (ViaCEP) - Non-blocking for Melhor Envio calculation
      console.log('[SHIPPING CALCULATOR COMPONENT] 2. Consultando ViaCEP para:', cleanCep);
      try {
        const cepCheck = await validateAndFetchCep(cleanCep);
        console.log('[SHIPPING CALCULATOR COMPONENT] 2.1 Resposta ViaCEP:', cepCheck);
      } catch (viaCepErr: any) {
        console.warn('[SHIPPING CALCULATOR COMPONENT] Aviso ViaCEP ignorado:', viaCepErr.message);
      }

      // Determine items payload with real catalog specs
      let calculationItems: Array<{
        productId: string;
        id: string;
        quantity: number;
        weight?: number;
        width?: number;
        height?: number;
        length?: number;
        price?: number;
        insurance_value?: number;
      }> = [];

      if (propItems && propItems.length > 0) {
        calculationItems = propItems.map((it) => {
          const prod = products.find((p) => p.id === it.productId || p.slug === it.productId);
          return {
            productId: it.productId,
            id: it.productId,
            quantity: it.quantity || 1,
            weight: prod?.weight !== undefined ? Number(prod.weight) : undefined,
            width: prod?.width !== undefined ? Number(prod.width) : undefined,
            height: prod?.height !== undefined ? Number(prod.height) : undefined,
            length: prod?.length !== undefined ? Number(prod.length) : undefined,
            price: prod ? Number(prod.promoPrice || prod.price) : 150,
            insurance_value: prod ? Number(prod.promoPrice || prod.price) : 150,
          };
        });
      } else if (productId) {
        const prod = products.find((p) => p.id === productId || p.slug === productId);
        calculationItems = [{
          productId,
          id: productId,
          quantity: 1,
          weight: prod?.weight !== undefined ? Number(prod.weight) : undefined,
          width: prod?.width !== undefined ? Number(prod.width) : undefined,
          height: prod?.height !== undefined ? Number(prod.height) : undefined,
          length: prod?.length !== undefined ? Number(prod.length) : undefined,
          price: prod ? Number(prod.promoPrice || prod.price) : 150,
          insurance_value: prod ? Number(prod.promoPrice || prod.price) : 150,
        }];
      } else if (cart.length > 0) {
        calculationItems = cart.map((item, idx) => ({
          productId: item.product.id || `prod-${idx + 1}`,
          id: item.product.id || `prod-${idx + 1}`,
          quantity: item.quantity || 1,
          weight: Number(item.product.weight),
          width: Number(item.product.width),
          height: Number(item.product.height),
          length: Number(item.product.length),
          price: Number(item.product.promoPrice || item.product.price) || 150,
          insurance_value: Number(item.product.promoPrice || item.product.price) || 150,
        }));
      } else if (products.length > 0) {
        const p = products[0];
        calculationItems = [{
          productId: p.id,
          id: p.id,
          quantity: 1,
          weight: Number(p.weight),
          width: Number(p.width),
          height: Number(p.height),
          length: Number(p.length),
          price: Number(p.promoPrice || p.price) || 150,
          insurance_value: Number(p.promoPrice || p.price) || 150,
        }];
      }

      console.log('[SHIPPING CALCULATOR COMPONENT] 3. Disparando POST /api/shipping/calculate com itens:', calculationItems);

      const authToken = localStorage.getItem('@marmot_auth_token') || localStorage.getItem('supabase.auth.token');
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        reqHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          cep: cleanCep,
          postalCode: cleanCep,
          destinationPostalCode: cleanCep,
          items: calculationItems,
        }),
      });

      console.log('[SHIPPING CALCULATOR COMPONENT] 4. Resposta HTTP status:', response.status);

      const data = await response.json().catch(() => ({}));
      console.log('[SHIPPING CALCULATOR COMPONENT] 5. Resposta JSON:', data);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Entre na sua conta para calcular o frete e emitir a cotação oficial.');
        }
        const errMsg = data.message || data.error || `Erro HTTP ${response.status} ao calcular frete no servidor.`;
        throw new Error(errMsg);
      }

      const rawReturnedOptions: ShippingOption[] = data.quotes || data.options || [];
      const returnedOptions = filterAndSortShippingQuotes(rawReturnedOptions);

      if (returnedOptions.length === 0) {
        const noOptMsg = '[Validação] Nenhuma opção de frete disponível para este CEP.';
        setErrorMessage(noOptMsg);
        setOptions(null);
        return;
      }

      // If free shipping applies, adjust display prices
      const processedOptions = returnedOptions.map((opt) => ({
        ...opt,
        price: isFree ? 0 : opt.price,
      }));

      setOptions(processedOptions);
      setShippingPostalCode(cleanCep);

      const firstChoice = processedOptions[0];
      setSelectedOptionId(firstChoice.id);
      setSelectedShipping(firstChoice);

      if (onSelectOption) {
        onSelectOption(firstChoice);
      }
    } catch (err: any) {
      console.error('[SHIPPING CALCULATOR COMPONENT] ❌ Erro:', err);
      setOptions(null);
      setErrorMessage(err.message || 'Não foi possível calcular o frete neste momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: ShippingOption) => {
    setSelectedOptionId(option.id);
    setSelectedShipping(option);
    if (onSelectOption) {
      onSelectOption(option);
    }
  };

  return (
    <div className={`bg-white border border-[#E4E4E7] rounded-2xl shadow-xs ${compact ? 'p-3.5' : 'p-5'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#B45309]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
            {compact ? 'Calcular Frete' : 'Calcular Frete e Prazo'}
          </h4>
        </div>
        {isFree && (
          <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded font-mono font-bold">
            FRETE GRÁTIS ATIVO
          </span>
        )}
      </div>

      <form onSubmit={handleCalculate} className="flex gap-2 mb-2">
        <input
          type="text"
          value={cep}
          onChange={handleCepChange}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1 bg-[#F8F9FA] border border-[#E4E4E7] text-[#18181B] text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#18181B] font-mono tracking-wider placeholder-[#71717A]"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#F4C400] text-[#0B0B0E] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#E5B500] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[90px] cursor-pointer shadow-xs"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Calcular'}
        </button>
      </form>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 mt-2 mb-2 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="text-[11px] text-[#71717A] flex items-center justify-between pt-1">
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[#18181B] transition-colors"
        >
          Não sei meu CEP
        </a>
        <span className="flex items-center gap-1 text-[#B45309] font-semibold text-[10px]">
          <ShieldCheck className="w-3 h-3" /> Envio seguro via Melhor Envio
        </span>
      </div>

      {options && options.length > 0 && (
        <div className="mt-4 space-y-2 pt-3 border-t border-[#E4E4E7]">
          {options.map((opt) => {
            const isSelected = selectedOptionId === opt.id || selectedShipping?.id === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#18181B] bg-[#F8F9FA] text-[#18181B] shadow-xs'
                    : 'border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#18181B]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-[#18181B] bg-[#18181B]' : 'border-[#D4D4D8]'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                  <div>
                    <p className="font-semibold text-[#18181B] leading-tight">
                      {opt.name} <span className="text-[#71717A] font-normal">({opt.carrier || opt.company})</span>
                    </p>
                    <p className="text-[11px] text-[#71717A] mt-0.5">
                      Entrega em {opt.deliveryDays || `${opt.deliveryTime} dias úteis`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {opt.price === 0 ? (
                    <span className="font-bold text-[#92400E] uppercase tracking-wider text-[11px] bg-[#FEF3C7] px-2 py-0.5 rounded">
                      GRÁTIS
                    </span>
                  ) : (
                    <div>
                      {opt.originalPrice && opt.originalPrice > opt.price && (
                        <span className="text-[10px] line-through text-[#71717A] mr-1 font-mono">
                          R$ {opt.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className="font-bold text-[#18181B] font-mono">
                        R$ {opt.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
