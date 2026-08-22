import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Search, Clock, Send, Eye, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: 'sent' | 'failed' | 'simulated';
  orderId?: string;
  userId?: string;
  errorMessage?: string;
  sentAt: string;
}

export const AdminEmailLogsTab: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/email-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Erro ao carregar logs de e-mail.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.orderId && log.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.template.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sentCount = logs.filter((l) => l.status === 'sent').length;
  const simulatedCount = logs.filter((l) => l.status === 'simulated').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#141414] border border-[#222222] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D6B35A] uppercase">
            <Mail className="w-3.5 h-3.5" /> COMUNICAÇÕES & DISPAROS TRANSACIONAIS
          </div>
          <h2 className="text-xl font-black uppercase text-[#EFECE6] mt-1">
            Logs de E-mails Transacionais
          </h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Rastreie todas as mensagens disparadas (pedidos criados, pagamentos aprovados, envios, entregas e drops).
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="bg-[#080808] hover:bg-[#222] text-[#EFECE6] text-xs font-bold uppercase px-4 py-2.5 rounded-xl border border-[#262626] transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-xs font-mono font-bold uppercase">Entregues com Sucesso</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{sentCount}</p>
          <p className="text-[11px] text-[#666666]">Via Resend / SMTP</p>
        </div>

        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-xs font-mono font-bold uppercase">Modo Simulado / Dev</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{simulatedCount}</p>
          <p className="text-[11px] text-[#666666]">Sem chave configurada / Sandbox</p>
        </div>

        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-xs font-mono font-bold uppercase">Falhas de Entrega</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400">{failedCount}</p>
          <p className="text-[11px] text-[#666666]">Erros no provedor</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#141414] border border-[#222222] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#666]" />
          <input
            type="text"
            placeholder="Buscar por e-mail, pedido ou template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#080808] border border-[#262626] rounded-xl pl-9 pr-4 py-2 text-xs text-[#EFECE6] focus:border-[#D6B35A] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#888] font-bold uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:border-[#D6B35A] outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="sent">Entregue (Sent)</option>
            <option value="simulated">Simulado (Sandbox)</option>
            <option value="failed">Falha (Failed)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080808] border-b border-[#222222] text-[#888888] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Destinatário</th>
                <th className="p-4">Assunto / Template</th>
                <th className="p-4">Pedido Relacionado</th>
                <th className="p-4">Status</th>
                <th className="p-4">Data & Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#666666]">
                    <Mail className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    Nenhum registro de e-mail encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4">
                      <p className="font-mono font-bold text-[#EFECE6]">{log.to}</p>
                      {log.userId && <p className="text-[10px] text-[#666]">UID: {log.userId}</p>}
                    </td>

                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-[#EFECE6]">{log.subject}</p>
                      <span className="inline-block bg-[#080808] border border-[#262626] text-[#A0A0A0] text-[10px] font-mono px-2 py-0.5 rounded">
                        template: {log.template}
                      </span>
                    </td>

                    <td className="p-4">
                      {log.orderId ? (
                        <span className="font-mono font-bold text-[#D6B35A]">
                          #{log.orderId}
                        </span>
                      ) : (
                        <span className="text-[#666]">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded inline-flex items-center gap-1 ${
                          log.status === 'sent'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
                            : log.status === 'simulated'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-800/50'
                            : 'bg-red-950/40 text-red-400 border border-red-800/50'
                        }`}
                      >
                        {log.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'simulated' && <Clock className="w-3 h-3" />}
                        {log.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                        {log.status.toUpperCase()}
                      </span>
                      {log.errorMessage && (
                        <p className="text-[10px] text-red-400 mt-1 max-w-xs truncate">{log.errorMessage}</p>
                      )}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-[#888888]">
                      {new Date(log.sentAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
