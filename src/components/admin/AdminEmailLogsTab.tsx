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
      <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
            <Mail className="w-3.5 h-3.5" /> COMUNICAÇÕES & DISPAROS TRANSACIONAIS
          </div>
          <h2 className="text-xl font-black uppercase text-[#171717] mt-1">
            Logs de E-mails Transacionais
          </h2>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Rastreie todas as mensagens disparadas (pedidos criados, pagamentos aprovados, envios, entregas e drops).
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="bg-[#F9F9F7] hover:bg-white text-[#171717] text-xs font-bold uppercase px-4 py-2.5 rounded-xl border border-[#E5E5E1] transition-all flex items-center gap-2 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#B45309]' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Entregues com Sucesso</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{sentCount}</p>
          <p className="text-[11px] text-[#6B6B66]">Via Resend / SMTP</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Modo Simulado / Dev</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-amber-700">{simulatedCount}</p>
          <p className="text-[11px] text-[#6B6B66]">Sem chave configurada / Sandbox</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Falhas de Entrega</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-600">{failedCount}</p>
          <p className="text-[11px] text-[#6B6B66]">Erros no provedor</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E5E1] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6B6B66]" />
          <input
            type="text"
            placeholder="Buscar por e-mail, pedido ou template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-9 pr-4 py-2 text-xs text-[#171717] focus:border-[#B45309] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#6B6B66] font-bold uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:border-[#B45309] outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="sent">Entregue (Sent)</option>
            <option value="simulated">Simulado (Sandbox)</option>
            <option value="failed">Falha (Failed)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9F7] border-b border-[#E5E5E1] text-[#6B6B66] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-4">Destinatário</th>
                <th className="p-4">Assunto / Template</th>
                <th className="p-4">Pedido Relacionado</th>
                <th className="p-4">Status</th>
                <th className="p-4">Data & Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#6B6B66]">
                    <Mail className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    Nenhum registro de e-mail encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9F9F7] transition-colors">
                    <td className="p-4">
                      <p className="font-mono font-bold text-[#171717]">{log.to}</p>
                      {log.userId && <p className="text-[10px] text-[#6B6B66]">UID: {log.userId}</p>}
                    </td>

                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-[#171717]">{log.subject}</p>
                      <span className="inline-block bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] text-[10px] font-mono px-2 py-0.5 rounded-lg">
                        template: {log.template}
                      </span>
                    </td>

                    <td className="p-4">
                      {log.orderId ? (
                        <span className="font-mono font-bold text-[#B45309]">
                          #{log.orderId}
                        </span>
                      ) : (
                        <span className="text-[#6B6B66]">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                          log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : log.status === 'simulated'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {log.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'simulated' && <Clock className="w-3 h-3" />}
                        {log.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                        {log.status.toUpperCase()}
                      </span>
                      {log.errorMessage && (
                        <p className="text-[10px] text-red-600 mt-1 max-w-xs truncate">{log.errorMessage}</p>
                      )}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-[#6B6B66]">
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
