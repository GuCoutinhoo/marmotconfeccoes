import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { PaymentRecord } from '../../types';
import {
  DollarSign,
  Search,
  CreditCard,
  RotateCcw,
  QrCode,
  RefreshCw,
  X,
  Loader2,
  TrendingUp,
} from 'lucide-react';

const getAdminAuthToken = () =>
  localStorage.getItem('@marmot_auth_token') || localStorage.getItem('marmot_auth_token') || '';

export const AdminPaymentsTab: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Refund Modal State
  const [refundModalPayment, setRefundModalPayment] = useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundOperationId, setRefundOperationId] = useState(() => crypto.randomUUID());
  const [syncingPaymentId, setSyncingPaymentId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'x-auth-token': getAdminAuthToken() },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.id.toLowerCase().includes(term) ||
      p.orderId.toLowerCase().includes(term) ||
      p.customerEmail.toLowerCase().includes(term) ||
      p.customerName.toLowerCase().includes(term) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalVolume = payments
    .filter((p) => p.status === 'Aprovado')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .reduce((sum, p) => sum + (p.refundedAmount || 0), 0);

  const handleRefund = async () => {
    if (!refundModalPayment || isProcessingRefund) return;
    const numAmount = parseFloat(refundAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Valor Inválido', 'Informe um valor válido para estorno.', 'error');
      return;
    }
    const refundableBalance = Math.max(0, refundModalPayment.amount - (refundModalPayment.refundedAmount || 0));
    if (numAmount > refundableBalance) {
      showToast('Valor Excedido', 'O valor de estorno não pode exceder o valor pago.', 'error');
      return;
    }
    if (!refundReason.trim()) {
      showToast('Motivo Obrigatório', 'Informe o motivo formal do estorno.', 'error');
      return;
    }

    setIsProcessingRefund(true);
    try {
      const res = await fetch(`/api/admin/orders/${refundModalPayment.orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': getAdminAuthToken(),
        },
        body: JSON.stringify({
          amount: numAmount,
          reason: refundReason.trim(),
          refundOperationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao processar estorno.');

      showToast(
        data.refundStatus === 'succeeded' ? 'Estorno concluído' : 'Estorno solicitado',
        data.refundStatus === 'succeeded'
          ? `A Stripe confirmou o estorno de R$ ${numAmount.toFixed(2)}.`
          : 'A solicitação foi aceita e será atualizada pelo webhook da Stripe.',
        'success',
      );
      setRefundModalPayment(null);
      setRefundAmount('');
      setRefundReason('');
      setRefundOperationId(crypto.randomUUID());
      await fetchPayments();
    } catch (err: any) {
      showToast('Erro no Estorno', err.message, 'error');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleSyncPayment = async (payment: PaymentRecord) => {
    if (syncingPaymentId) return;
    setSyncingPaymentId(payment.id);
    try {
      const response = await fetch(`/api/admin/orders/${payment.orderId}/sync-payment`, {
        method: 'POST',
        headers: { 'x-auth-token': getAdminAuthToken() },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Falha ao sincronizar pagamento.');
      showToast('Pagamento sincronizado', data.changed ? 'O pedido foi reconciliado com a Stripe.' : 'O pedido já estava consistente.', 'success');
      await fetchPayments();
    } catch (error: any) {
      showToast('Erro na sincronização', error?.message || 'Não foi possível consultar a Stripe.', 'error');
    } finally {
      setSyncingPaymentId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-[#6B6B66] text-xs font-bold uppercase">
            <span>Volume Total Aprovado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-[#6B6B66]">Transações aprovadas</span>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-[#6B6B66] text-xs font-bold uppercase">
            <span>Total de Estornos</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            R$ {totalRefunded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-[#6B6B66]">Devoluções & Reembolsos</span>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-[#6B6B66] text-xs font-bold uppercase">
            <span>Taxa de Aprovação</span>
            <TrendingUp className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="text-2xl font-black text-[#B45309] mt-2">
            {payments.length > 0
              ? `${((payments.filter((p) => p.status === 'Aprovado').length / payments.length) * 100).toFixed(1)}%`
              : '100%'}
          </p>
          <span className="text-[10px] text-[#6B6B66]">Total de {payments.length} transações</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E5E1] p-4 sm:p-5 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por transação Stripe, pedido ou e-mail..."
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
            >
              <option value="all">Todas as Formas</option>
              <option value="PIX">PIX Instantâneo</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Boleto Bancário">Boleto Bancário</option>
            </select>

            <button
              onClick={fetchPayments}
              disabled={isLoading}
              className="px-4 py-2.5 bg-white hover:bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl text-xs font-bold uppercase text-[#171717] transition-all flex items-center gap-2 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B45309] ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'all'
                ? 'bg-[#F0C84B] text-black shadow-xs font-extrabold'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] hover:border-[#B45309]'
            }`}
          >
            Todos ({payments.length})
          </button>
          <button
            onClick={() => setStatusFilter('Aprovado')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'Aprovado'
                ? 'bg-[#F0C84B] text-black shadow-xs font-extrabold'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] hover:border-[#B45309]'
            }`}
          >
            Aprovados ({payments.filter((p) => p.status === 'Aprovado').length})
          </button>
          <button
            onClick={() => setStatusFilter('Pendente')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'Pendente'
                ? 'bg-[#F0C84B] text-black shadow-xs font-extrabold'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] hover:border-[#B45309]'
            }`}
          >
            Pendentes ({payments.filter((p) => p.status === 'Pendente').length})
          </button>
          <button
            onClick={() => setStatusFilter('Reembolsado')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'Reembolsado'
                ? 'bg-[#F0C84B] text-black shadow-xs font-extrabold'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] hover:border-[#B45309]'
            }`}
          >
            Estornados ({payments.filter((p) => p.status === 'Reembolsado').length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#6B6B66] font-mono uppercase tracking-wider">
                <th className="p-4">Transação / Data</th>
                <th className="p-4">Pedido / Pagador</th>
                <th className="p-4">Forma de Pagamento</th>
                <th className="p-4">Valor Bruto / Líquido</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredPayments.map((pay) => {
                const isApproved = pay.status === 'Aprovado';
                const isRefunded = pay.status === 'Reembolsado';
                const isPending = pay.status === 'Pendente';

                return (
                  <tr key={pay.id} className="hover:bg-[#F9F9F7] transition-colors">
                    <td className="p-4 font-mono">
                      <p className="font-bold text-[#B45309]">
                        #{pay.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-[#6B6B66] mt-0.5">
                        {new Date(pay.date).toLocaleDateString('pt-BR')} {new Date(pay.date).toLocaleTimeString('pt-BR')}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-[#171717] font-mono">
                        Pedido #{pay.orderId.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-[#6B6B66] truncate max-w-[180px]">
                        {pay.customerName || pay.customerEmail || 'Cliente'}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[#171717]">
                        {pay.method === 'PIX' ? (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" /> PIX
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-[#B45309]" /> {pay.method}
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B6B66] font-mono">
                        Via {pay.paymentProvider || 'provedor legado'}
                      </p>
                    </td>

                    <td className="p-4 font-mono">
                      <p className="font-bold text-[#171717]">
                        R$ {pay.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {Boolean(pay.refundedAmount) && (
                        <p className="text-[10px] text-[#6B6B66]">
                          Reembolsado: R$ {Number(pay.refundedAmount).toFixed(2)}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isRefunded
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isPending
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {pay.paymentProvider === 'stripe' && (
                          <button
                            onClick={() => handleSyncPayment(pay)}
                            disabled={syncingPaymentId === pay.id}
                            className="px-2.5 py-1.5 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] rounded-lg text-[#171717] text-xs font-bold uppercase transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncingPaymentId === pay.id ? 'animate-spin' : ''}`} /> Sincronizar
                          </button>
                        )}
                      {isApproved && pay.paymentProvider === 'stripe' && (
                        <button
                          onClick={() => {
                            setRefundModalPayment(pay);
                            setRefundAmount(String(Math.max(0, pay.amount - (pay.refundedAmount || 0))));
                            setRefundOperationId(crypto.randomUUID());
                          }}
                          className="px-2.5 py-1.5 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] hover:border-amber-300 rounded-lg text-amber-700 text-xs font-bold uppercase transition-all flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <RotateCcw className="w-3 h-3" /> Estornar
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#6B6B66] font-mono">
                    Nenhuma transação financeira encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {refundModalPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black uppercase text-[#171717] tracking-tight">
                  Estorno de Pagamento #{refundModalPayment.id}
                </h3>
                <p className="text-xs text-[#6B6B66] mt-0.5">
                  Pedido #{refundModalPayment.orderId} • Total: R$ {refundModalPayment.amount.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar janela de estorno"
                onClick={() => setRefundModalPayment(null)}
                className="text-[#6B6B66] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[#6B6B66] block mb-1">Valor do Estorno (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  max={Math.max(0, refundModalPayment.amount - (refundModalPayment.refundedAmount || 0))}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#6B6B66] block mb-1">Motivo do Estorno *:</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex: Devolução de produto aprovada pelo RMA..."
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalPayment(null)}
                className="px-4 py-2 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] text-xs font-bold uppercase text-[#6B6B66] rounded-xl shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={isProcessingRefund || !refundReason.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold uppercase rounded-xl transition-all shadow-xs disabled:opacity-40 flex items-center gap-2"
              >
                {isProcessingRefund ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Confirmar Estorno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
