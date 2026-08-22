import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ReturnRequest, ReturnStatus } from '../../types';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Package,
  Check,
  Ban,
  DollarSign,
  User,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const RETURN_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Pendente': { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/60' },
  'Aprovada': { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800/60' },
  'Aguardando postagem': { bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-800/60' },
  'Produto recebido': { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-800/60' },
  'Em inspeção': { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/60' },
  'Reembolso autorizado': { bg: 'bg-[#D6B35A]/10', text: 'text-[#D6B35A]', border: 'border-[#D6B35A]/40' },
  'Reembolso realizado': { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  'Concluída': { bg: 'bg-green-950/40', text: 'text-green-400', border: 'border-green-800/60' },
  'Recusada': { bg: 'bg-red-950/40', text: 'text-red-400', border: 'border-red-800/60' },
};

export const AdminReturnsTab: React.FC = () => {
  const { showToast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [actionStatus, setActionStatus] = useState<ReturnStatus | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [restockProducts, setRestockProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/returns', {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setReturns(data);
      }
    } catch (err) {
      console.error('Error loading returns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filteredReturns = returns.filter((rma) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      rma.id.toLowerCase().includes(term) ||
      rma.orderId.toLowerCase().includes(term) ||
      rma.customerName.toLowerCase().includes(term) ||
      rma.customerEmail.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || rma.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async () => {
    if (!selectedReturn || !actionStatus) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/returns/${selectedReturn.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('marmot_auth_token') || '',
        },
        body: JSON.stringify({
          status: actionStatus,
          adminNotes,
          refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
          restockProducts: actionStatus === 'Concluída' || actionStatus === 'Reembolso realizado' ? restockProducts : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar solicitação de devolução.');

      showToast('Devolução Atualizada!', `Status alterado para "${actionStatus}".`, 'success');
      setSelectedReturn(data);
      setActionStatus('');
      setAdminNotes('');
      await fetchReturns();
    } catch (err: any) {
      showToast('Erro', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-[#141414] border border-[#222222] p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por RMA #, Pedido #, Nome do Cliente ou E-mail..."
              className="w-full bg-[#080808] border border-[#262626] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#EFECE6] placeholder-[#555] focus:outline-none focus:border-[#D6B35A]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#EFECE6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchReturns}
            disabled={isLoading}
            className="px-4 py-2.5 bg-[#080808] hover:bg-[#1a1a1a] border border-[#262626] rounded-xl text-xs font-bold uppercase text-[#A0A0A0] hover:text-[#EFECE6] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D6B35A] ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase shrink-0 transition-all ${
              statusFilter === 'all'
                ? 'bg-[#D6B35A] text-black shadow-md'
                : 'bg-[#080808] border border-[#222222] text-[#888888] hover:text-[#EFECE6]'
            }`}
          >
            Todas ({returns.length})
          </button>
          {[
            'Pendente',
            'Aprovada',
            'Aguardando postagem',
            'Produto recebido',
            'Em inspeção',
            'Reembolso autorizado',
            'Concluída',
            'Recusada'
          ].map((st) => {
            const count = returns.filter((r) => r.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase shrink-0 transition-all ${
                  statusFilter === st
                    ? 'bg-[#D6B35A] text-black shadow-md'
                    : 'bg-[#080808] border border-[#222222] text-[#888888] hover:text-[#EFECE6]'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0a0a0a] text-[#777777] font-mono uppercase tracking-wider">
                <th className="p-4">RMA / Data</th>
                <th className="p-4">Pedido / Cliente</th>
                <th className="p-4">Tipo & Motivo</th>
                <th className="p-4">Itens</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {filteredReturns.map((rma) => {
                const badge = RETURN_STATUS_COLORS[rma.status] || {
                  bg: 'bg-zinc-900',
                  text: 'text-zinc-400',
                  border: 'border-zinc-700',
                };
                const totalItemQty = rma.items.reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <tr
                    key={rma.id}
                    onClick={() => {
                      setSelectedReturn(rma);
                      setRefundAmount(rma.refundAmount ? String(rma.refundAmount) : '');
                      setAdminNotes(rma.adminNotes || '');
                    }}
                    className="hover:bg-[#181818] transition-colors cursor-pointer group"
                  >
                    <td className="p-4 font-mono">
                      <p className="font-bold text-[#D6B35A] group-hover:underline">
                        #{rma.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-[#777777] mt-0.5">
                        {new Date(rma.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-[#EFECE6] font-mono">Pedido #{rma.orderId.slice(-8).toUpperCase()}</p>
                      <p className="text-[11px] text-[#777777] truncate max-w-[180px]">
                        {rma.customerName} ({rma.customerEmail})
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-[#EFECE6] uppercase">{rma.type === 'exchange' ? 'Troca de Tamanho/Cor' : 'Devolução & Reembolso'}</p>
                      <p className="text-[11px] text-[#777777] truncate max-w-[160px]">{rma.reason}</p>
                    </td>

                    <td className="p-4 font-mono">
                      <span className="font-bold text-[#EFECE6]">{totalItemQty} {totalItemQty === 1 ? 'item' : 'itens'}</span>
                      <p className="text-[10px] text-[#777777] truncate max-w-[140px]">{rma.items[0]?.productTitle}</p>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {rma.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReturn(rma);
                          setRefundAmount(rma.refundAmount ? String(rma.refundAmount) : '');
                          setAdminNotes(rma.adminNotes || '');
                        }}
                        className="p-2 bg-[#080808] hover:bg-[#262626] border border-[#222222] rounded-lg text-[#D6B35A] transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#777777] font-mono">
                    Nenhuma solicitação de troca ou devolução encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Detail & Action Drawer/Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#222222] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[#D6B35A]">
                    RMA #{selectedReturn.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      (RETURN_STATUS_COLORS[selectedReturn.status] || { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700' }).bg
                    } ${(RETURN_STATUS_COLORS[selectedReturn.status] || { bg: '', text: 'text-zinc-400', border: '' }).text} ${(RETURN_STATUS_COLORS[selectedReturn.status] || { bg: '', text: '', border: 'border-zinc-700' }).border}`}
                  >
                    {selectedReturn.status}
                  </span>
                </div>
                <p className="text-xs text-[#777777] mt-0.5 font-mono">
                  Referente ao Pedido #{selectedReturn.orderId} • Aberto em {new Date(selectedReturn.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 hover:bg-[#222] rounded-lg text-[#777777] hover:text-[#EFECE6] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase text-[#D6B35A] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Cliente Solicitante
                </h4>
                <p className="text-xs font-bold text-[#EFECE6]">{selectedReturn.customerName}</p>
                <p className="text-xs text-[#777777]">E-mail: {selectedReturn.customerEmail}</p>
                <p className="text-xs text-[#777777]">CPF: {selectedReturn.customerCpf || 'Não informado'}</p>
              </div>

              {/* Reason */}
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase text-[#D6B35A] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Motivo da Solicitação
                </h4>
                <p className="text-xs font-bold text-[#EFECE6]">{selectedReturn.reason}</p>
                <p className="text-xs text-[#A0A0A0] italic">"{selectedReturn.description || 'Sem descrição detalhada'}"</p>
              </div>
            </div>

            {/* Items to Return */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-[#777777]">Itens da Devolução</h4>
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl divide-y divide-[#1c1c1c] overflow-hidden">
                {(selectedReturn.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#161616] overflow-hidden border border-[#262626] shrink-0">
                        <img
                          src={it.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                          alt={it.productTitle}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#EFECE6]">{it.productTitle}</p>
                        <p className="text-[11px] text-[#777777]">
                          Tamanho: <span className="text-[#EFECE6] font-bold">{it.size}</span> • Cor: <span className="text-[#EFECE6] font-bold">{it.colorName}</span>
                        </p>
                        <p className="text-[10px] text-[#555] font-mono">Qtd: {it.quantity}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <p className="font-bold text-[#EFECE6]">
                        R$ {((it.price || 0) * (it.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-[#777777]">R$ {(it.price || 0).toFixed(2)} un.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos Preview */}
            {selectedReturn.photos && selectedReturn.photos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase text-[#777777] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#D6B35A]" /> Fotos Anexadas pelo Cliente
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(selectedReturn.photos || []).map((ph, idx) => (
                    <a
                      key={idx}
                      href={ph}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-24 rounded-xl overflow-hidden border border-[#262626] bg-[#080808] block relative group"
                    >
                      <img src={ph} alt="Comprovante" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#EFECE6] transition-opacity">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Decision & Status Flow */}
            <div className="bg-[#0a0a0a] border border-[#222222] p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase text-[#EFECE6] flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-[#D6B35A]" /> Tomada de Decisão & Atualização de Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#777777] block mb-1">Novo Status da Solicitação:</label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value as ReturnStatus)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  >
                    <option value="">Selecione a ação...</option>
                    <option value="Aprovada">Aprovar Devolução (Autorizar envio)</option>
                    <option value="Aguardando postagem">Aguardando Postagem pelo Cliente</option>
                    <option value="Produto recebido">Produto Recebido no Centro de Distribuição</option>
                    <option value="Em inspeção">Em Inspeção Técnica de Qualidade</option>
                    <option value="Reembolso autorizado">Autorizar Reembolso Financeiro</option>
                    <option value="Reembolso realizado">Marcar Reembolso Realizado</option>
                    <option value="Concluída">Concluir Solicitação de Devolução</option>
                    <option value="Recusada">Recusar Solicitação</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#777777] block mb-1">Valor de Reembolso (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#777777] block mb-1">Parecer / Instruções para o Cliente:</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ex: Código de autorização de postagem dos Correios gerado..."
                  className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              {/* Auto Restock Checkbox */}
              {(actionStatus === 'Concluída' || actionStatus === 'Reembolso realizado' || actionStatus === 'Produto recebido') && (
                <label className="flex items-center gap-2 cursor-pointer bg-[#141414] p-3 rounded-xl border border-[#262626]">
                  <input
                    type="checkbox"
                    checked={restockProducts}
                    onChange={(e) => setRestockProducts(e.target.checked)}
                    className="accent-[#D6B35A] w-4 h-4 rounded"
                  />
                  <span className="text-xs text-[#EFECE6] font-bold">
                    Reintegrar itens ao estoque da loja (Atualiza catálogo e gera registro de movimentação)
                  </span>
                </label>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateStatus}
                  disabled={!actionStatus || isProcessing}
                  className="px-5 py-2.5 bg-[#D6B35A] hover:bg-[#EFECE6] text-black font-black text-xs uppercase rounded-xl transition-all shadow-md disabled:opacity-40 flex items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar Decisão
                </button>
              </div>
            </div>

            {/* RMA History */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-[#777777] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Histórico do Processo RMA
              </h4>
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 rounded-xl space-y-3">
                {(selectedReturn.history || []).map((ev, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#D6B35A] mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#EFECE6]">{ev.status}</span>
                        <span className="text-[10px] text-[#777777] font-mono">{ev.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#A0A0A0] mt-0.5">{ev.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
