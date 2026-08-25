import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Package,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Box,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { getValidProductImageUrl, handleProductImageError } from '../utils/imageUtils';

interface TrackingPageProps {
  initialCode?: string;
  onNavigate: (page: string, param?: string) => void;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({
  initialCode = '',
  onNavigate,
}) => {
  const [searchCode, setSearchCode] = useState(initialCode || 'MRM-892104-BR');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const { orders } = useAuth();
  const userOrders = orders || [];
  const { showToast } = useToast();

  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  const fetchLiveTracking = async (code: string) => {
    if (!code || !code.trim()) return;
    setIsLoadingTracking(true);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setActiveOrder(data.order as Order);
          showToast('Rastreio Localizado', `Pedido #${data.order.id} carregado.`, 'success');
          return;
        }
      }
    } catch {
      // fallback to local list
    } finally {
      setIsLoadingTracking(false);
    }

    const foundInUser = userOrders.find(
      (o) => o.trackingCode?.toLowerCase() === code.trim().toLowerCase() || o.id?.toLowerCase() === code.trim().toLowerCase()
    );

    if (foundInUser) {
      setActiveOrder(foundInUser);
      showToast('Rastreio Localizado', `Pedido ${foundInUser.id} localizado.`, 'success');
    } else {
      showToast('Atenção', 'Nenhum pedido encontrado com este código.', 'info');
    }
  };

  useEffect(() => {
    if (initialCode) {
      setSearchCode(initialCode);
      fetchLiveTracking(initialCode);
    }
  }, [initialCode]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      showToast('Atenção', 'Digite o código de rastreio ou número do pedido.', 'error');
      return;
    }
    await fetchLiveTracking(searchCode);
  };

  const steps: { title: OrderStatus; icon: any; label: string }[] = [
    { title: 'Aguardando Pagamento', icon: Clock, label: 'Pedido Recebido' },
    { title: 'Pagamento Aprovado', icon: CheckCircle2, label: 'Pagamento Aprovado' },
    { title: 'Em Separação', icon: Box, label: 'Em Separação' },
    { title: 'Enviado', icon: Truck, label: 'Em Trânsito' },
    { title: 'Entregue', icon: MapPin, label: 'Entregue' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Aguardando Pagamento':
        return 0;
      case 'Pagamento Aprovado':
        return 1;
      case 'Em Separação':
        return 2;
      case 'Enviado':
        return 3;
      case 'Entregue':
        return 4;
      default:
        return 1;
    }
  };

  const currentStepIdx = activeOrder ? getStepIndex(activeOrder.status) : 0;

  return (
    <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumb items={[{ label: 'Rastreio de Pedido' }]} />

        {/* Hero Header Search */}
        <div className="bg-white border border-[#E4E4E7] p-8 md:p-10 rounded-2xl text-center space-y-6 shadow-xs">
          <div className="w-12 h-12 bg-[#FEF3C7] text-[#B45309] rounded-xl flex items-center justify-center mx-auto border border-[#FDE68A]">
            <Package className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#18181B] tracking-tight">
              RASTREAMENTO DE ENVIOS MARMOT
            </h1>
            <p className="text-xs text-[#71717A] mt-1 max-w-md mx-auto">
              Acompanhe cada etapa de produção, expedição e entrega do seu pedido em tempo real.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex max-w-md mx-auto gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Ex: MRM-892104-BR ou número do pedido"
              className="flex-1 bg-[#F8F9FA] border border-[#E4E4E7] px-4 py-3 rounded-xl text-xs font-mono uppercase text-[#18181B] focus:outline-none focus:border-[#18181B]"
            />
            <button
              type="submit"
              disabled={isLoadingTracking}
              className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-bold text-xs uppercase px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isLoadingTracking ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" /> Rastrear
                </>
              )}
            </button>
          </form>
        </div>

        {/* Active Order Details View */}
        {activeOrder ? (
          <div className="bg-white border border-[#E4E4E7] p-6 sm:p-8 rounded-2xl space-y-8 animate-fadeIn shadow-xs">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#B45309] uppercase tracking-widest block">
                  CÓDIGO DE RASTREIO: {activeOrder.trackingCode || 'GERADO NA EXPEDIÇÃO'}
                </span>
                <h2 className="text-lg font-black uppercase text-[#18181B] mt-0.5">
                  PEDIDO N° {activeOrder.id}
                </h2>
                <p className="text-xs text-[#71717A]">Data da compra: {activeOrder.date}</p>
              </div>

              <div className="bg-[#F8F9FA] border border-[#E4E4E7] px-4 py-3 rounded-xl flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#B45309]" />
                <div>
                  <span className="text-[10px] text-[#71717A] uppercase font-bold block">Previsão de Entrega</span>
                  <span className="text-xs font-bold text-[#18181B]">{activeOrder.estimatedDelivery || '5 a 8 dias úteis'}</span>
                </div>
              </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className="py-2">
              <h3 className="text-xs font-bold uppercase text-[#71717A] mb-6">Status da Remessa</h3>

              <div className="grid grid-cols-5 gap-2 relative">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center space-y-2 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-all ${
                          isCompleted
                            ? 'bg-[#F4C400] text-[#0B0B0E] border-[#F4C400] shadow-xs'
                            : 'bg-[#F8F9FA] text-[#A1A1AA] border-[#E4E4E7]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCurrent ? 'text-[#B45309]' : isCompleted ? 'text-[#18181B]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History Logs */}
            <div className="border-t border-[#E4E4E7] pt-6">
              <h3 className="text-xs font-bold uppercase text-[#18181B] mb-4">Linha do Tempo de Rastreamento</h3>
              <div className="space-y-3">
                {(activeOrder.history && activeOrder.history.length > 0 ? activeOrder.history : [
                  {
                    status: activeOrder.status,
                    timestamp: activeOrder.date,
                    description: `Status do pedido atualizado para ${activeOrder.status}.`
                  }
                ]).map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F8F9FA] border border-[#E4E4E7] rounded-xl flex items-start gap-4"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#B45309] mt-1 shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#18181B] uppercase">{h.status}</span>
                        <span className="text-[10px] text-[#71717A] font-mono">{h.timestamp}</span>
                      </div>
                      <p className="text-[#52525B]">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items in shipment */}
            <div className="border-t border-[#E4E4E7] pt-6">
              <h3 className="text-xs font-bold uppercase text-[#18181B] mb-4">Peças no Pacote</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activeOrder.items || []).map((it: any, idx: number) => (
                  <div key={idx} className="flex gap-3 p-3 bg-[#F8F9FA] border border-[#E4E4E7] rounded-xl">
                    <img
                      src={getValidProductImageUrl(it.productImage || it.image || it.image_snapshot, 'camisetas', it.productTitle || String(idx))}
                      alt={it.productTitle || it.title || 'Produto'}
                      className="w-14 h-16 object-cover rounded-lg bg-[#F4F4F5] shrink-0 border border-[#E4E4E7]"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleProductImageError(e, 'camisetas', it.productTitle || String(idx))}
                    />
                    <div className="text-xs">
                      <p className="font-bold text-[#18181B] line-clamp-1">{it.productTitle || it.title || 'Produto'}</p>
                      <p className="text-[10px] text-[#71717A] mt-1">
                        Tam: {it.size || 'M'} • Cor: {it.colorName || it.color || 'Padrão'} • Qtd: {it.quantity || 1}
                      </p>
                      <p className="text-xs font-bold text-[#18181B] mt-1">
                        R$ {(it.price || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E4E4E7] p-8 rounded-2xl text-center space-y-4 shadow-xs">
            <ShieldCheck className="w-10 h-10 text-[#B45309] mx-auto opacity-75" />
            <h3 className="text-base font-bold text-[#18181B] uppercase">Envio 100% Rastreado & Seguro</h3>
            <p className="text-xs text-[#71717A] max-w-md mx-auto">
              Todos os pedidos da MARMOT CONFECÇÕES possuem código de rastreamento enviado por e-mail assim que despachados do nosso ateliê.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
