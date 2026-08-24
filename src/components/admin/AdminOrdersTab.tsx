import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Order, OrderStatus } from '../../types';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Printer,
  Package,
  CreditCard,
  FileCheck,
  RefreshCw,
  Loader2,
  ChevronRight,
  Filter,
  X,
  User,
  MapPin,
  Calendar,
  Send,
  RotateCcw,
  Check,
  Ban,
  DollarSign,
  PackageCheck,
  Tag
} from 'lucide-react';

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  'Aguardando Pagamento': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Pagamento Pendente': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Pagamento Aprovado': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Pedido Confirmado': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Em Separação': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Preparando Envio': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Pronto para Envio': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Despachado': { bg: 'bg-[#F0C84B]/20', text: 'text-[#B45309]', border: 'border-[#F0C84B]/50' },
  'Enviado': { bg: 'bg-[#F0C84B]/20', text: 'text-[#B45309]', border: 'border-[#F0C84B]/50' },
  'Em Transporte': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Entregue': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Cancelado': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Pagamento Recusado': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Reembolsado': { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
};

export const AdminOrdersTab: React.FC = () => {
  const { allOrders, refreshOrders, refreshAllAdminOrders, updateOrderStatus } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isGeneratingShipment, setIsGeneratingShipment] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<OrderStatus | ''>('');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');

  // Dispatch modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchCarrier, setDispatchCarrier] = useState('Correios');
  const [dispatchTrackingCode, setDispatchTrackingCode] = useState('');

  // Initial load
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

  const filteredOrders = allOrders.filter((ord) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      ord.id.toLowerCase().includes(term) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(term)) ||
      (ord.customerEmail && ord.customerEmail.toLowerCase().includes(term)) ||
      (ord.customerCpf && ord.customerCpf.toLowerCase().includes(term)) ||
      (ord.trackingCode && ord.trackingCode.toLowerCase().includes(term)) ||
      (ord.shippingAddress?.recipientName && ord.shippingAddress.recipientName.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || (ord.shippingCarrier && ord.shippingCarrier.toLowerCase().includes(carrierFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesCarrier;
  });

  const handleGenerateMelhorEnvioShipment = async (orderId: string) => {
    setIsGeneratingShipment(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/generate-melhor-envio-shipment`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar remessa no Melhor Envio.');
      }

      showToast('Envio Real Gerado!', `Remessa #${data.shipmentId} gerada no Melhor Envio. Código: ${data.trackingCode}`, 'success');
      if (data.order) {
        setSelectedOrder(data.order);
      }
      await refreshAllAdminOrders();
    } catch (err: any) {
      showToast('Erro no Melhor Envio', err.message, 'error');
    } finally {
      setIsGeneratingShipment(false);
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

  const handleStatusChange = async () => {
    if (!selectedOrder || !targetStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          status: targetStatus,
          trackingCode: trackingCodeInput || selectedOrder.trackingCode,
          note: statusNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível alterar o status do pedido.');
      }

      showToast('Status Atualizado!', `Pedido #${selectedOrder.id} alterado para ${targetStatus}.`, 'success');
      setSelectedOrder(data);
      updateOrderStatus(selectedOrder.id, targetStatus);
      setStatusNote('');
      setTargetStatus('');
      await refreshAllAdminOrders();
    } catch (err: any) {
      showToast('Transição Recusada', err.message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDispatchOrder = async () => {
    if (!selectedOrder) return;
    if (!dispatchTrackingCode.trim()) {
      showToast('Código de Rastreio Obrigatório', 'Informe o código de rastreamento para despachar o pedido.', 'error');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/dispatch`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          shippingCarrier: dispatchCarrier,
          trackingCode: dispatchTrackingCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao despachar pedido.');
      }

      showToast('Pedido Despachado!', `O pedido #${selectedOrder.id} foi marcado como despachado.`, 'success');
      setSelectedOrder(data.order || data);
      setDispatchModalOpen(false);
      setDispatchTrackingCode('');
      await refreshAllAdminOrders();
    } catch (err: any) {
      showToast('Erro ao Despachar', err.message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const printPackingSlip = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = (order.items || [])
      .map(
        (it) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${it.productTitle || it.title || 'Produto'} (${it.size} - ${it.colorName || it.color || 'Padrão'})</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${it.sku || it.productId}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${it.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${it.price.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing Slip - Pedido #${order.id}</title>
          <style>
            body { font-family: sans-serif; margin: 20px; color: #111; line-height: 1.4; }
            h1 { font-size: 20px; margin-bottom: 4px; text-transform: uppercase; }
            .meta { font-size: 12px; color: #555; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { text-align: left; background: #eee; padding: 8px; border-bottom: 2px solid #ccc; font-weight: bold; }
            .section { margin-bottom: 20px; border: 1px solid #eee; padding: 12px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <h1>MARMOT STREETWEAR • GUIA DE SEPARAÇÃO E ENVIO</h1>
          <div class="meta">Pedido #${order.id} • Data: ${order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : 'Hoje'}</div>

          <div class="section">
            <strong>DADOS DO CLIENTE / DESTINATÁRIO:</strong><br/>
            Nome: ${order.shippingAddress?.recipientName || order.customerName || 'Cliente'}<br/>
            E-mail: ${order.customerEmail || 'Não informado'}<br/>
            CPF: ${order.customerCpf || 'Não informado'}<br/>
            Endereço: ${order.shippingAddress?.street}, ${order.shippingAddress?.number} ${order.shippingAddress?.complement || ''}<br/>
            Bairro: ${order.shippingAddress?.neighborhood || ''} • Cidade/UF: ${order.shippingAddress?.city}/${order.shippingAddress?.state}<br/>
            CEP: ${order.shippingAddress?.cep}
          </div>

          <div class="section">
            <strong>LOGÍSTICA DE TRANSPORTE:</strong><br/>
            Transportadora: ${order.shippingCarrier || 'Melhor Envio / Correios'} (${order.shippingService || 'Padrão'})<br/>
            Rastreio: ${order.trackingCode || 'Pendente de postagem'}
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto / Descrição</th>
                <th style="text-align: center;">SKU</th>
                <th style="text-align: center;">Qtd</th>
                <th style="text-align: right;">Unitário</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; font-size: 13px;">
            <p>Subtotal: R$ ${order.subtotal?.toFixed(2)}</p>
            <p>Frete: R$ ${order.shippingFee?.toFixed(2)}</p>
            <p>Desconto: -R$ ${order.discount?.toFixed(2)}</p>
            <p><strong>TOTAL: R$ ${order.total?.toFixed(2)}</strong></p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-white border border-[#E5E5E1] p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Pedido #, Nome do Cliente, CPF, E-mail ou Rastreio..."
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B66] hover:text-[#171717]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={refreshOrders}
            className="px-4 py-2.5 bg-[#F9F9F7] hover:bg-[#F0EFEA] border border-[#E5E5E1] rounded-xl text-xs font-bold uppercase text-[#171717] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#B45309]" /> Atualizar Pedidos
          </button>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase shrink-0 transition-all ${
              statusFilter === 'all'
                ? 'bg-[#F0C84B] text-black shadow-sm'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
            }`}
          >
            Todos ({allOrders.length})
          </button>
          {[
            'Aguardando Pagamento',
            'Pagamento Aprovado',
            'Em Separação',
            'Despachado',
            'Entregue',
            'Cancelado'
          ].map((st) => {
            const count = allOrders.filter((o) => o.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase shrink-0 transition-all ${
                  statusFilter === st
                    ? 'bg-[#F0C84B] text-black shadow-sm'
                    : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#6B6B66] font-mono uppercase tracking-wider">
                <th className="p-4">Pedido / Data</th>
                <th className="p-4">Cliente & Destino</th>
                <th className="p-4">Itens</th>
                <th className="p-4">Pagamento / Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredOrders.map((order, idx) => {
                const badge = STATUS_COLOR_MAP[order.status] || {
                  bg: 'bg-zinc-100',
                  text: 'text-zinc-700',
                  border: 'border-zinc-300',
                };
                const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

                return (
                  <tr
                    key={`${order.id}-${idx}`}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-[#F9F9F7] transition-colors cursor-pointer group"
                  >
                    {/* ID & Date */}
                    <td className="p-4 font-mono">
                      <p className="font-bold text-[#B45309] group-hover:underline">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-[#6B6B66] mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                      </p>
                    </td>

                    {/* Customer & Location */}
                    <td className="p-4">
                      <p className="font-bold text-[#171717]">
                        {order.shippingAddress?.recipientName || order.customerName || 'Cliente'}
                      </p>
                      <p className="text-[11px] text-[#6B6B66] truncate max-w-[180px]">
                        {order.shippingAddress?.city}/{order.shippingAddress?.state} • {order.customerEmail}
                      </p>
                    </td>

                    {/* Items */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#6B6B66]" />
                        <span className="font-mono text-[#171717] font-bold">
                          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6B6B66] truncate max-w-[160px]">
                        {order.items?.[0]?.title || 'Produtos'}
                      </p>
                    </td>

                    {/* Payment & Total */}
                    <td className="p-4 font-mono">
                      <p className="font-bold text-[#171717]">
                        R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-[#6B6B66] uppercase">
                        {order.paymentMethod || 'Mercado Pago'}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="p-2 bg-[#F9F9F7] hover:bg-[#F0EFEA] border border-[#E5E5E1] rounded-lg text-[#171717] hover:text-[#B45309] transition-all"
                        title="Ver Detalhes do Pedido"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#6B6B66] font-mono">
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E5E5E1] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[#B45309]">
                    PEDIDO #{selectedOrder.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      (STATUS_COLOR_MAP[selectedOrder.status] || { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' }).bg
                    } ${(STATUS_COLOR_MAP[selectedOrder.status] || { bg: '', text: 'text-zinc-700', border: '' }).text} ${(STATUS_COLOR_MAP[selectedOrder.status] || { bg: '', text: '', border: 'border-zinc-300' }).border}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-[#6B6B66] mt-0.5 font-mono">
                  Criado em: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('pt-BR') : 'Data não informada'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => printPackingSlip(selectedOrder)}
                  className="px-3 py-1.5 bg-[#F9F9F7] hover:bg-[#F0EFEA] border border-[#E5E5E1] text-xs font-bold text-[#171717] rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                  title="Imprimir Guia de Envio"
                >
                  <Printer className="w-3.5 h-3.5 text-[#B45309]" /> Imprimir Guia
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-[#F9F9F7] rounded-lg text-[#6B6B66] hover:text-[#171717] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Info: Customer & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase text-[#B45309] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Cliente
                </h4>
                <p className="text-xs font-bold text-[#171717]">
                  {selectedOrder.shippingAddress?.recipientName || selectedOrder.customerName || 'Cliente'}
                </p>
                <p className="text-xs text-[#6B6B66]">E-mail: {selectedOrder.customerEmail || 'Não informado'}</p>
                <p className="text-xs text-[#6B6B66]">CPF: {selectedOrder.customerCpf || 'Não informado'}</p>
                <p className="text-xs text-[#6B6B66]">Telefone: {selectedOrder.customerPhone || 'Não informado'}</p>
              </div>

              {/* Shipping Address */}
              <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase text-[#B45309] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Endereço de Entrega
                </h4>
                <p className="text-xs text-[#171717]">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.number}{' '}
                  {selectedOrder.shippingAddress?.complement ? `(${selectedOrder.shippingAddress.complement})` : ''}
                </p>
                <p className="text-xs text-[#6B6B66]">
                  Bairro: {selectedOrder.shippingAddress?.neighborhood || 'Não informado'}
                </p>
                <p className="text-xs text-[#6B6B66]">
                  {selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.state} • CEP: {selectedOrder.shippingAddress?.cep}
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs font-mono text-[#6B6B66]">
                  <Truck className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>{selectedOrder.shippingCarrier || 'Melhor Envio'} ({selectedOrder.shippingService || 'Padrão'})</span>
                </div>
              </div>
            </div>

            {/* Tracking & Shipping Integration Section */}
            <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#B45309]" /> Integração Melhor Envio & Rastreamento
                  </p>
                  {selectedOrder.trackingCode ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#B45309]">
                        {selectedOrder.trackingCode}
                      </span>
                      {selectedOrder.melhorEnvioShipmentId && (
                        <span className="text-[10px] bg-white text-[#6B6B66] border border-[#E5E5E1] px-2 py-0.5 rounded font-mono">
                          ID: {selectedOrder.melhorEnvioShipmentId}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B6B66] mt-0.5">Nenhum envio gerado ainda para esta compra.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Real Melhor Envio Label Generation */}
                  <button
                    disabled={isGeneratingShipment}
                    onClick={() => handleGenerateMelhorEnvioShipment(selectedOrder.id)}
                    className="px-3 py-1.5 bg-[#F0C84B] hover:bg-[#F0C84B]/90 text-black font-bold text-xs uppercase rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    title="Comprar etiqueta e gerar envio oficial no Melhor Envio (Produção)"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    {isGeneratingShipment ? 'Gerando Envio...' : selectedOrder.melhorEnvioShipmentId ? 'Regerar Envio (ME)' : 'Gerar Envio Real (Melhor Envio)'}
                  </button>

                  {/* Print Shipping Label */}
                  {(selectedOrder.shippingLabelUrl || selectedOrder.melhorEnvioShipmentId || selectedOrder.trackingCode) && (
                    <button
                      onClick={() => handlePrintLabel(selectedOrder)}
                      className="px-3 py-1.5 bg-white hover:bg-[#F9F9F7] border border-[#E5E5E1] text-[#171717] font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                      title="Imprimir Etiqueta Oficial"
                    >
                      <Tag className="w-3.5 h-3.5 text-[#B45309]" /> Imprimir Etiqueta
                    </button>
                  )}

                  {/* Dispatch Manual */}
                  {selectedOrder.status !== 'Despachado' && selectedOrder.status !== 'Entregue' && (
                    <button
                      onClick={() => {
                        setDispatchCarrier(selectedOrder.shippingCarrier || 'Correios');
                        setDispatchModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-[#F9F9F7] text-[#171717] border border-[#E5E5E1] font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 text-[#B45309]" /> Despacho Manual
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-[#6B6B66]">Itens do Pedido</h4>
              <div className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl divide-y divide-[#E5E5E1] overflow-hidden">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-[#E5E5E1] shrink-0">
                        <img
                          src={it.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                          alt={it.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#171717]">{it.title}</p>
                        <p className="text-[11px] text-[#6B6B66]">
                          Tamanho: <span className="text-[#171717] font-bold">{it.size}</span> • Cor: <span className="text-[#171717] font-bold">{it.color}</span>
                        </p>
                        <p className="text-[10px] text-[#6B6B66] font-mono">Qtd: {it.quantity}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <p className="font-bold text-[#171717]">
                        R$ {(it.price * it.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-[#6B6B66]">R$ {it.price.toFixed(2)} un.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[#6B6B66]">
                <span>Subtotal:</span>
                <span className="text-[#171717]">R$ {selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6B6B66]">
                <span>Frete ({selectedOrder.shippingCarrier || 'Envio'}):</span>
                <span className="text-[#171717]">R$ {selectedOrder.shippingFee?.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Desconto aplicado:</span>
                  <span>- R$ {selectedOrder.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#B45309] border-t border-[#E5E5E1] pt-2">
                <span>TOTAL DO PEDIDO:</span>
                <span>R$ {selectedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Change Status Workflow */}
            <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase text-[#171717] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#B45309]" /> Alterar Status Operacional
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#6B6B66] block mb-1">Novo Status:</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                    className="w-full bg-white border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                  >
                    <option value="">Selecione o próximo status...</option>
                    <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                    <option value="Pagamento Aprovado">Pagamento Aprovado</option>
                    <option value="Pedido Confirmado">Pedido Confirmado</option>
                    <option value="Em Separação">Em Separação</option>
                    <option value="Preparando Envio">Preparando Envio</option>
                    <option value="Pronto para Envio">Pronto para Envio</option>
                    <option value="Despachado">Despachado</option>
                    <option value="Em Transporte">Em Transporte</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado (Estorno de Estoque)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#6B6B66] block mb-1">Código de Rastreio (Opcional):</label>
                  <input
                    type="text"
                    value={trackingCodeInput}
                    onChange={(e) => setTrackingCodeInput(e.target.value)}
                    placeholder="Ex: BR123456789BR"
                    className="w-full bg-white border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#6B6B66] block mb-1">Observação do Histórico:</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Ex: Pedido embalado e pronto para coleta..."
                  className="w-full bg-white border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleStatusChange}
                  disabled={!targetStatus || isUpdatingStatus}
                  className="px-4 py-2 bg-[#F0C84B] hover:bg-[#F0C84B]/90 text-black font-bold text-xs uppercase rounded-xl transition-all shadow-sm disabled:opacity-40 flex items-center gap-2"
                >
                  {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirmar Atualização
                </button>
              </div>
            </div>

            {/* Timeline History */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-[#6B6B66] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Histórico de Eventos
              </h4>
              <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl space-y-3">
                {(selectedOrder.history || []).map((ev, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#B45309] mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#171717]">{ev.status}</span>
                        <span className="text-[10px] text-[#6B6B66] font-mono">{ev.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#6B6B66] mt-0.5">{ev.description || (ev as any).note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black uppercase text-[#171717] tracking-tight">
                  Despachar Pedido #{selectedOrder.id}
                </h3>
                <p className="text-xs text-[#6B6B66] mt-0.5">
                  Informe a transportadora e o código de rastreamento oficial.
                </p>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-[#6B6B66] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[#6B6B66] block mb-1">Transportadora:</label>
                <select
                  value={dispatchCarrier}
                  onChange={(e) => setDispatchCarrier(e.target.value)}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                >
                  <option value="Correios (SEDEX)">Correios (SEDEX)</option>
                  <option value="Correios (PAC)">Correios (PAC)</option>
                  <option value="Jadlog .Package">Jadlog .Package</option>
                  <option value="Jadlog .Com">Jadlog .Com</option>
                  <option value="Loggi Express">Loggi Express</option>
                  <option value="Latam Cargo">Latam Cargo</option>
                  <option value="Melhor Envio">Melhor Envio</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#6B6B66] block mb-1">Código de Rastreamento *:</label>
                <input
                  type="text"
                  value={dispatchTrackingCode}
                  onChange={(e) => setDispatchTrackingCode(e.target.value)}
                  placeholder="Ex: NL123456789BR"
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="px-4 py-2 bg-[#F9F9F7] hover:bg-[#F0EFEA] border border-[#E5E5E1] text-xs font-bold uppercase text-[#6B6B66] hover:text-[#171717] rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleDispatchOrder}
                disabled={isUpdatingStatus || !dispatchTrackingCode.trim()}
                className="px-4 py-2 bg-[#F0C84B] hover:bg-[#F0C84B]/90 text-black text-xs font-black uppercase rounded-xl transition-all shadow-sm disabled:opacity-40 flex items-center gap-2"
              >
                {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
