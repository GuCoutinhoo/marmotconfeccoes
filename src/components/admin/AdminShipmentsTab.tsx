import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Order, ShipmentRecord } from '../../types';
import { isValidCpf, cleanCpf, formatCpf } from '../../utils/cpfValidator';
import {
  Truck,
  Package,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Printer,
  RefreshCw,
  Send,
  Loader2,
  MapPin,
  Tag,
  AlertCircle,
  FileText,
  User,
  ChevronRight,
  Filter,
  ShieldAlert
} from 'lucide-react';

export const AdminShipmentsTab: React.FC = () => {
  const { allOrders, refreshOrders, refreshAllAdminOrders, updateOrderStatus } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'pending_fulfillment' | 'ready' | 'in_transit' | 'delivered'>('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    refreshAllAdminOrders().catch(() => {});
  }, [refreshAllAdminOrders]);

  const getAdminHeaders = () => {
    const t = localStorage.getItem('@marmot_auth_token') || localStorage.getItem('marmot_auth_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${t}`,
      'x-auth-token': t,
      'x-admin-token': t,
    };
  };

  // Grouped stages
  const pendingFulfillmentOrders = allOrders.filter(
    (o) => o.status === 'Pagamento Aprovado' || o.status === 'Pedido Confirmado' || o.status === 'Em Separação' || o.status === 'Preparando Envio'
  );
  const readyOrders = allOrders.filter((o) => o.status === 'Pronto para Envio');
  const inTransitOrders = allOrders.filter((o) => o.status === 'Despachado' || o.status === 'Enviado' || o.status === 'Em Transporte');
  const deliveredOrders = allOrders.filter((o) => o.status === 'Entregue');

  const filteredOrders = allOrders.filter((ord) => {
    // Only show orders that are approved, in fulfillment or delivered
    const isRelevant =
      ord.status !== 'Aguardando Pagamento' &&
      ord.status !== 'Pagamento Pendente' &&
      ord.status !== 'Cancelado' &&
      ord.status !== 'Pagamento Recusado';

    if (!isRelevant) return false;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      ord.id.toLowerCase().includes(term) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(term)) ||
      (ord.trackingCode && ord.trackingCode.toLowerCase().includes(term)) ||
      (ord.shippingAddress?.city && ord.shippingAddress.city.toLowerCase().includes(term)) ||
      (ord.shippingAddress?.recipientName && ord.shippingAddress.recipientName.toLowerCase().includes(term));

    let matchesStage = true;
    if (stageFilter === 'pending_fulfillment') {
      matchesStage =
        ord.status === 'Pagamento Aprovado' ||
        ord.status === 'Pedido Confirmado' ||
        ord.status === 'Em Separação' ||
        ord.status === 'Preparando Envio';
    } else if (stageFilter === 'ready') {
      matchesStage = ord.status === 'Pronto para Envio';
    } else if (stageFilter === 'in_transit') {
      matchesStage = ord.status === 'Despachado' || ord.status === 'Enviado' || ord.status === 'Em Transporte';
    } else if (stageFilter === 'delivered') {
      matchesStage = ord.status === 'Entregue';
    }

    const matchesCarrier =
      carrierFilter === 'all' ||
      (ord.shippingCarrier && ord.shippingCarrier.toLowerCase().includes(carrierFilter.toLowerCase()));

    return matchesSearch && matchesStage && matchesCarrier;
  });

  const handleGenerateMelhorEnvio = async (order: Order) => {
    const cleanCustomerCpf = cleanCpf(order.customerCpf || (order.shippingAddress as any)?.cpf);
    if (!cleanCustomerCpf || !isValidCpf(cleanCustomerCpf)) {
      showToast(
        'CPF do destinatário não informado',
        'Este pedido não possui CPF válido para o Melhor Envio. Acesse a aba "Pedidos" e clique em "+ Adicionar CPF" para cadastrá-lo.',
        'error'
      );
      return;
    }

    setGeneratingId(order.id);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/generate-melhor-envio-shipment`, {
        method: 'POST',
        headers: getAdminHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          showToast('Processamento em Andamento', data.error || 'A emissão deste frete já está em andamento. Aguarde alguns instantes.', 'warning');
          await refreshAllAdminOrders();
          return;
        }
        throw new Error(data.error || 'Falha ao gerar remessa no Melhor Envio.');
      }

      showToast(
        'Envio Real Gerado!',
        `Remessa #${data.shipmentId} gerada no Melhor Envio.${data.trackingCode ? ` Código: ${data.trackingCode}` : ' Etiqueta pronta para impressão.'}`,
        'success'
      );
      await refreshAllAdminOrders();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        showToast('Tempo Esgotado', 'A requisição ao Melhor Envio demorou mais que o esperado. Verifique o status da remessa em instantes.', 'error');
      } else {
        showToast('Erro Melhor Envio', err.message, 'error');
      }
    } finally {
      clearTimeout(timeoutId);
      setGeneratingId(null);
    }
  };

  const handlePrintLabel = async (order: Order) => {
    if (order.shippingLabelUrl) {
      window.open(order.shippingLabelUrl, '_blank');
      return;
    }
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/print-label`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Etiqueta ainda não disponível.');
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      showToast('Erro na Etiqueta', err.message, 'error');
    }
  };

  const handleAdvanceStatus = async (order: Order, nextStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          status: nextStatus,
          trackingCode: trackingCode || order.trackingCode,
          note: `Avançado para ${nextStatus} na Central de Expedição.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar status.');

      showToast('Status Atualizado!', `Pedido #${order.id} avançado para ${nextStatus}.`, 'success');
      updateOrderStatus(order.id, nextStatus as any);
      setSelectedOrder(null);
      setTrackingCode('');
      await refreshAllAdminOrders();
    } catch (err: any) {
      showToast('Erro ao Atualizar', err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Expedição Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStageFilter('pending_fulfillment')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all shadow-sm ${
            stageFilter === 'pending_fulfillment'
              ? 'bg-purple-50/50 border-purple-300 ring-1 ring-purple-300'
              : 'bg-white border-[#E5E5E1] hover:border-[#D1D1CB]'
          }`}
        >
          <div className="flex justify-between items-center text-[#6B6B66] text-xs font-mono font-bold uppercase">
            <span>Para Separação</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-[#171717] mt-2">{pendingFulfillmentOrders.length}</p>
          <span className="text-[10px] text-purple-700 font-mono">Picking & Packing</span>
        </div>

        <div
          onClick={() => setStageFilter('ready')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all shadow-sm ${
            stageFilter === 'ready'
              ? 'bg-cyan-50/50 border-cyan-300 ring-1 ring-cyan-300'
              : 'bg-white border-[#E5E5E1] hover:border-[#D1D1CB]'
          }`}
        >
          <div className="flex justify-between items-center text-[#6B6B66] text-xs font-mono font-bold uppercase">
            <span>Prontos para Coleta</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-[#171717] mt-2">{readyOrders.length}</p>
          <span className="text-[10px] text-cyan-700 font-mono">Aguardando Transportadora</span>
        </div>

        <div
          onClick={() => setStageFilter('in_transit')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all shadow-sm ${
            stageFilter === 'in_transit'
              ? 'bg-[#F0C84B]/20 border-[#F0C84B] ring-1 ring-[#F0C84B]'
              : 'bg-white border-[#E5E5E1] hover:border-[#D1D1CB]'
          }`}
        >
          <div className="flex justify-between items-center text-[#6B6B66] text-xs font-mono font-bold uppercase">
            <span>Em Transporte</span>
            <Truck className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="text-2xl font-black text-[#B45309] mt-2">{inTransitOrders.length}</p>
          <span className="text-[10px] text-[#B45309] font-mono">Em Rota de Entrega</span>
        </div>

        <div
          onClick={() => setStageFilter('delivered')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all shadow-sm ${
            stageFilter === 'delivered'
              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-white border-[#E5E5E1] hover:border-[#D1D1CB]'
          }`}
        >
          <div className="flex justify-between items-center text-[#6B6B66] text-xs font-mono font-bold uppercase">
            <span>Entregues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#171717] mt-2">{deliveredOrders.length}</p>
          <span className="text-[10px] text-emerald-700 font-mono">Concluídos com Sucesso</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E5E1] p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B6B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Destinatário, Pedido, Cidade ou Rastreio..."
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
          >
            <option value="all">Todas Transportadoras</option>
            <option value="Correios">Correios</option>
            <option value="Jadlog">Jadlog</option>
            <option value="Loggi">Loggi</option>
            <option value="Latam">Latam Cargo</option>
            <option value="Melhor Envio">Melhor Envio</option>
          </select>

          <button
            onClick={() => setStageFilter('all')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
              stageFilter === 'all'
                ? 'bg-[#F0C84B] text-black shadow-sm'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
            }`}
          >
            Ver Todos
          </button>
        </div>
      </div>

      {/* Shipments List */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-[#E5E5E1]">
          {filteredOrders.map((order, idx) => {
            const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
            const totalWeight = order.items?.reduce((s, i) => s + ((i.weight || 0.35) * i.quantity), 0) || 0.35;

            return (
              <div
                key={`${order.id}-${idx}`}
                className="p-5 hover:bg-[#F9F9F7] transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#B45309]">
                      PEDIDO #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono text-[#6B6B66]">
                      • {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                    <span className="bg-[#F9F9F7] border border-[#E5E5E1] px-2 py-0.5 rounded text-[10px] font-bold text-[#171717] uppercase">
                      {order.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#171717]">
                    {order.shippingAddress?.recipientName || order.customerName || 'Cliente'}
                  </p>
                  <p className="text-xs text-[#6B6B66] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#B45309]" />
                    {order.shippingAddress?.street}, {order.shippingAddress?.number} • {order.shippingAddress?.city} - {order.shippingAddress?.state} ({order.shippingAddress?.cep})
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[#6B6B66]">
                    <span>
                      CPF Destinatário:{' '}
                      {order.customerCpf && isValidCpf(order.customerCpf) ? (
                        <strong className="text-[#171717]">{formatCpf(order.customerCpf)}</strong>
                      ) : (
                        <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                          Pendente
                        </span>
                      )}
                    </span>
                    <span>• Transportadora: <strong className="text-[#171717]">{order.shippingCarrier || 'Melhor Envio'} ({order.shippingService || 'Padrão'})</strong></span>
                    <span>• Peso: <strong className="text-[#171717]">{totalWeight.toFixed(2)} kg</strong></span>
                    <span>• {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
                  </div>
                </div>

                {/* Right Tracking & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  {order.trackingCode ? (
                    <div className="bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-1.5 rounded-xl font-mono text-xs text-[#B45309] font-bold flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5" />
                      <span>{order.trackingCode}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-[#6B6B66]">Sem rastreio</span>
                  )}

                  {/* Direct Melhor Envio Label & Shipment Actions */}
                  <button
                    disabled={generatingId === order.id}
                    onClick={() => handleGenerateMelhorEnvio(order)}
                    className="px-3 py-1.5 bg-[#F0C84B]/20 hover:bg-[#F0C84B] text-[#B45309] hover:text-black border border-[#F0C84B]/50 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Gerar remessa oficial no Melhor Envio (Produção)"
                  >
                    <Package className="w-3.5 h-3.5" />
                    {generatingId === order.id ? 'Gerando...' : order.melhorEnvioShipmentId ? 'Regerar ME' : 'Gerar ME'}
                  </button>

                  {(order.shippingLabelUrl || order.melhorEnvioShipmentId) && (
                    <button
                      onClick={() => handlePrintLabel(order)}
                      className="px-3 py-1.5 bg-white hover:bg-[#F9F9F7] border border-[#E5E5E1] text-[#171717] text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                      title="Imprimir Etiqueta Oficial"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#B45309]" /> Etiqueta
                    </button>
                  )}

                  {/* Stage Advancement Action */}
                  {order.status === 'Pagamento Aprovado' && (
                    <button
                      onClick={() => handleAdvanceStatus(order, 'Em Separação')}
                      disabled={isUpdating}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" /> Iniciar Separação
                    </button>
                  )}

                  {order.status === 'Em Separação' && (
                    <button
                      onClick={() => handleAdvanceStatus(order, 'Pronto para Envio')}
                      disabled={isUpdating}
                      className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pronto para Envio
                    </button>
                  )}

                  {order.status === 'Pronto para Envio' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setTrackingCode(order.trackingCode || '');
                      }}
                      className="px-3.5 py-2 bg-[#F0C84B] hover:bg-[#F0C84B]/90 text-black font-black text-xs uppercase rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Despachar
                    </button>
                  )}

                  {order.status === 'Despachado' && (
                    <button
                      onClick={() => handleAdvanceStatus(order, 'Em Transporte')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-white hover:bg-[#F9F9F7] border border-[#E5E5E1] text-xs font-bold uppercase text-[#171717] rounded-xl transition-all shadow-xs"
                    >
                      Marcar em Transporte
                    </button>
                  )}

                  {order.status === 'Em Transporte' && (
                    <button
                      onClick={() => handleAdvanceStatus(order, 'Entregue')}
                      disabled={isUpdating}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Entrega
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-[#6B6B66] font-mono text-xs">
              Nenhum pacote ou expedição encontrada no filtro atual.
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Modal inside Shipments */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-black uppercase text-[#171717] tracking-tight">
              Despachar Pacote #{selectedOrder.id}
            </h3>
            <p className="text-xs text-[#6B6B66]">
              Destinatário: <strong className="text-[#171717]">{selectedOrder.shippingAddress?.recipientName}</strong> ({selectedOrder.shippingAddress?.city}/{selectedOrder.shippingAddress?.state})
            </p>

            <div>
              <label className="text-xs font-mono text-[#6B6B66] block mb-1">Código de Rastreio:</label>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: NL123456789BR"
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-[#F9F9F7] hover:bg-[#F0EFEA] border border-[#E5E5E1] text-xs font-bold uppercase text-[#6B6B66] hover:text-[#171717] rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAdvanceStatus(selectedOrder, 'Despachado')}
                disabled={isUpdating || !trackingCode.trim()}
                className="px-4 py-2 bg-[#F0C84B] hover:bg-[#F0C84B]/90 text-black text-xs font-black uppercase rounded-xl transition-all shadow-sm disabled:opacity-40 flex items-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Confirmar Envio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
