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
    <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumb items={[{ label: 'Rastreio de Pedido' }]} />

        {/* Hero Header Search */}
        <div className="bg-[#121212] border border-[#222222] p-8 md:p-10 rounded-2xl text-center space-y-6">
          <div className="w-12 h-12 bg-[#D6B35A]/10 text-[#D6B35A] rounded-xl flex items-center justify-center mx-auto border border-[#D6B35A]/30">
            <Package className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#EFECE6] tracking-tight">
              RASTREAMENTO DE ENVIOS MARMOT
            </h1>
            <p className="text-xs text-[#888888] mt-1 max-w-md mx-auto">
              Acompanhe cada etapa de produção, expedição e entrega do seu pedido em tempo real.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex max-w-md mx-auto gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Ex: MRM-892104-BR ou número do pedido"
              className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] px-4 py-3 rounded-xl text-xs font-mono uppercase text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
            />
            <button
              type="submit"
              disabled={isLoadingTracking}
              className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-bold text-xs uppercase px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
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
          <div className="bg-[#121212] border border-[#222222] p-6 sm:p-8 rounded-2xl space-y-8 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D6B35A] uppercase tracking-widest block">
                  CÓDIGO DE RASTREIO: {activeOrder.trackingCode || 'GERADO NA EXPEDIÇÃO'}
                </span>
                <h2 className="text-lg font-black uppercase text-[#EFECE6] mt-0.5">
                  PEDIDO N° {activeOrder.id}
                </h2>
                <p className="text-xs text-[#888888]">Data da compra: {activeOrder.date}</p>
              </div>

              <div className="bg-[#0A0A0A] border border-[#222222] px-4 py-3 rounded-xl flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#D6B35A]" />
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-bold block">Previsão de Entrega</span>
                  <span className="text-xs font-bold text-[#EFECE6]">{activeOrder.estimatedDelivery || '5 a 8 dias úteis'}</span>
                </div>
              </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className="py-2">
              <h3 className="text-xs font-bold uppercase text-[#888888] mb-6">Status da Remessa</h3>

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
                            ? 'bg-[#D6B35A] text-black border-[#D6B35A] shadow-md'
                            : 'bg-[#0A0A0A] text-[#666666] border-[#222222]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCurrent ? 'text-[#D6B35A]' : isCompleted ? 'text-[#EFECE6]' : 'text-[#666666]'
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
            <div className="border-t border-[#222222] pt-6">
              <h3 className="text-xs font-bold uppercase text-[#EFECE6] mb-4">Linha do Tempo de Rastreamento</h3>
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
                    className="p-4 bg-[#0A0A0A] border border-[#222222] rounded-xl flex items-start gap-4"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D6B35A] mt-1 shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#EFECE6] uppercase">{h.status}</span>
                        <span className="text-[10px] text-[#777777] font-mono">{h.timestamp}</span>
                      </div>
                      <p className="text-[#888888]">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items in shipment */}
            <div className="border-t border-[#222222] pt-6">
              <h3 className="text-xs font-bold uppercase text-[#EFECE6] mb-4">Peças no Pacote</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activeOrder.items || []).map((it: any, idx: number) => (
                  <div key={idx} className="flex gap-3 p-3 bg-[#0A0A0A] border border-[#222222] rounded-xl">
                    <img
                      src={it.productImage || it.image || it.image_snapshot || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                      alt={it.productTitle || it.title || 'Produto'}
                      className="w-14 h-16 object-cover rounded-lg bg-black shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-[#EFECE6] line-clamp-1">{it.productTitle || it.title || 'Produto'}</p>
                      <p className="text-[10px] text-[#888888] mt-1">
                        Tam: {it.size || 'M'} • Cor: {it.colorName || it.color || 'Padrão'} • Qtd: {it.quantity || 1}
                      </p>
                      <p className="text-xs font-bold text-[#D6B35A] mt-1">
                        R$ {(it.price || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#121212] border border-[#222222] p-8 rounded-2xl text-center space-y-4">
            <ShieldCheck className="w-10 h-10 text-[#D6B35A] mx-auto opacity-75" />
            <h3 className="text-base font-bold text-[#EFECE6] uppercase">Envio 100% Rastreado & Seguro</h3>
            <p className="text-xs text-[#888888] max-w-md mx-auto">
              Todos os pedidos da MARMOT CONFECÇÕES possuem código de rastreamento enviado por e-mail assim que despachados do nosso ateliê.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
