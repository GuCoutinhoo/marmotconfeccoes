import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PaymentRecord } from '../../types';
import {
  DollarSign,
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  QrCode,
  FileText,
  RefreshCw,
  X,
  Loader2,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Receipt
} from 'lucide-react';

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

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
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
      (p.payerEmail && p.payerEmail.toLowerCase().includes(term)) ||
      (p.payerName && p.payerName.toLowerCase().includes(term)) ||
      (p.gatewayPaymentId && p.gatewayPaymentId.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalVolume = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'refunded')
    .reduce((sum, p) => sum + (p.refundedAmount || p.amount), 0);

  const handleRefund = async () => {
    if (!refundModalPayment) return;
    const numAmount = parseFloat(refundAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Valor Inválido', 'Informe um valor válido para estorno.', 'error');
      return;
    }
    if (numAmount > refundModalPayment.amount) {
      showToast('Valor Excedido', 'O valor de estorno não pode exceder o valor pago.', 'error');
      return;
    }
    if (!refundReason.trim()) {
      showToast('Motivo Obrigatório', 'Informe o motivo formal do estorno.', 'error');
      return;
    }

    setIsProcessingRefund(true);
    try {
      const res = await fetch(`/api/admin/payments/${refundModalPayment.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('marmot_auth_token') || '',
        },
        body: JSON.stringify({
          amount: numAmount,
          reason: refundReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao processar estorno.');

      showToast('Estorno Concluído!', `Estorno de R$ ${numAmount.toFixed(2)} registrado com sucesso.`, 'success');
      setRefundModalPayment(null);
      setRefundAmount('');
      setRefundReason('');
      await fetchPayments();
    } catch (err: any) {
      showToast('Erro no Estorno', err.message, 'error');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl">
          <div className="flex justify-between items-center text-[#777] text-xs font-bold uppercase">
            <span>Volume Total Aprovado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-[#777]">Transações aprovadas</span>
        </div>

        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl">
          <div className="flex justify-between items-center text-[#777] text-xs font-bold uppercase">
            <span>Total de Estornos</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">
            R$ {totalRefunded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-[#777]">Devoluções & Reembolsos</span>
        </div>

        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl">
          <div className="flex justify-between items-center text-[#777] text-xs font-bold uppercase">
            <span>Taxa de Aprovação</span>
            <TrendingUp className="w-4 h-4 text-[#D6B35A]" />
          </div>
          <p className="text-2xl font-black text-[#D6B35A] mt-2">
            {payments.length > 0
              ? `${((payments.filter((p) => p.status === 'approved').length / payments.length) * 100).toFixed(1)}%`
              : '100%'}
          </p>
          <span className="text-[10px] text-[#777]">Total de {payments.length} transações</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#141414] border border-[#222222] p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID da Transação, Pedido #, E-mail ou Mercado Pago ID..."
              className="w-full bg-[#080808] border border-[#262626] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#EFECE6] placeholder-[#555] focus:outline-none focus:border-[#D6B35A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#080808] border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
            >
              <option value="all">Todas as Formas</option>
              <option value="pix">PIX Instantâneo</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="boleto">Boleto Bancário</option>
            </select>

            <button
              onClick={fetchPayments}
              disabled={isLoading}
              className="px-4 py-2.5 bg-[#080808] hover:bg-[#1a1a1a] border border-[#262626] rounded-xl text-xs font-bold uppercase text-[#A0A0A0] hover:text-[#EFECE6] transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D6B35A] ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'all'
                ? 'bg-[#D6B35A] text-black shadow-md'
                : 'bg-[#080808] border border-[#222222] text-[#888888] hover:text-[#EFECE6]'
            }`}
          >
            Todos ({payments.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'approved'
                ? 'bg-[#D6B35A] text-black shadow-md'
                : 'bg-[#080808] border border-[#222222] text-[#888888] hover:text-[#EFECE6]'
            }`}
          >
            Aprovados ({payments.filter((p) => p.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'pending'
                ? 'bg-[#D6B35A] text-black shadow-md'
                : 'bg-[#080808] border border-[#222222] text-[#888888] hover:text-[#EFECE6]'
            }`}
          >
            Pendentes ({payments.filter((p) => p.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('refunded')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'refunded'
                ? 'bg-[#D6B35A] text-black shadow-md'
                : 'bg-[#080808] border border-[#222222] text-[#888888] hover:text-[#EFECE6]'
            }`}
          >
            Estornados ({payments.filter((p) => p.status === 'refunded').length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0a0a0a] text-[#777777] font-mono uppercase tracking-wider">
                <th className="p-4">Transação / Data</th>
                <th className="p-4">Pedido / Pagador</th>
                <th className="p-4">Forma de Pagamento</th>
                <th className="p-4">Valor Bruto / Líquido</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {filteredPayments.map((pay) => {
                const isApproved = pay.status === 'approved';
                const isRefunded = pay.status === 'refunded';
                const isPending = pay.status === 'pending';

                return (
                  <tr key={pay.id} className="hover:bg-[#181818] transition-colors">
                    <td className="p-4 font-mono">
                      <p className="font-bold text-[#D6B35A]">
                        #{pay.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-[#777777] mt-0.5">
                        {new Date(pay.createdAt).toLocaleDateString('pt-BR')} {new Date(pay.createdAt).toLocaleTimeString('pt-BR')}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-[#EFECE6] font-mono">
                        Pedido #{pay.orderId.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-[#777777] truncate max-w-[180px]">
                        {pay.payerName || pay.payerEmail || 'Cliente'}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[#EFECE6]">
                        {pay.method === 'pix' ? (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-emerald-400" /> PIX
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-[#D6B35A]" /> {pay.method}
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-[#777777] font-mono">
                        {pay.installments ? `${pay.installments}x sem juros` : 'À vista'}
                      </p>
                    </td>

                    <td className="p-4 font-mono">
                      <p className="font-bold text-[#EFECE6]">
                        R$ {pay.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {pay.netAmount && (
                        <p className="text-[10px] text-[#777777]">
                          Líquido: R$ {pay.netAmount.toFixed(2)}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          isApproved
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                            : isRefunded
                            ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                            : isPending
                            ? 'bg-blue-950/40 text-blue-400 border-blue-800/60'
                            : 'bg-red-950/40 text-red-400 border-red-800/60'
                        }`}
                      >
                        {pay.status === 'approved' ? 'Aprovado' : pay.status === 'refunded' ? 'Estornado' : pay.status === 'pending' ? 'Pendente' : 'Recusado'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      {isApproved && (
                        <button
                          onClick={() => {
                            setRefundModalPayment(pay);
                            setRefundAmount(String(pay.amount));
                          }}
                          className="px-2.5 py-1.5 bg-[#080808] hover:bg-[#262626] border border-[#222222] rounded-lg text-amber-400 text-xs font-bold uppercase transition-all flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" /> Estornar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#777777] font-mono">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black uppercase text-[#EFECE6] tracking-tight">
                  Estorno de Pagamento #{refundModalPayment.id}
                </h3>
                <p className="text-xs text-[#777777] mt-0.5">
                  Pedido #{refundModalPayment.orderId} • Total: R$ {refundModalPayment.amount.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setRefundModalPayment(null)}
                className="text-[#777777] hover:text-[#EFECE6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">Valor do Estorno (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  max={refundModalPayment.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">Motivo do Estorno *:</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex: Devolução de produto aprovada pelo RMA..."
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundModalPayment(null)}
                className="px-4 py-2 bg-[#080808] hover:bg-[#222] border border-[#262626] text-xs font-bold uppercase text-[#777777] rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleRefund}
                disabled={isProcessingRefund || !refundReason.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase rounded-xl transition-all shadow-md disabled:opacity-40 flex items-center gap-2"
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
