import React, { useState, useEffect } from 'react';
import { AdminActivityLog } from '../../types';
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  User,
  Shield,
  Tag,
  ChevronRight,
  X,
  Code2
} from 'lucide-react';

export const AdminActivityLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AdminActivityLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/logs?limit=100', {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error loading admin logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      l.adminEmail.toLowerCase().includes(term) ||
      l.adminName.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.description.toLowerCase().includes(term) ||
      (l.entityId && l.entityId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-[#E5E5E1] p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B6B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por Responsável, Ação, Entidade ou Descrição..."
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#171717] placeholder-[#999] focus:outline-none focus:border-[#B45309]"
          />
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-4 py-2.5 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] rounded-xl text-xs font-bold uppercase text-[#171717] transition-all flex items-center justify-center gap-2 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B45309] ${isLoading ? 'animate-spin' : ''}`} /> Atualizar Logs
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#6B6B66] font-mono uppercase tracking-wider text-[10px]">
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Administrador</th>
                <th className="p-4">Ação / Módulo</th>
                <th className="p-4">Descrição da Operação</th>
                <th className="p-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-[#F9F9F7] transition-colors cursor-pointer"
                >
                  <td className="p-4 font-mono text-[#6B6B66] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-[#171717]">{log.adminName}</p>
                    <p className="text-[10px] text-[#6B6B66] font-mono">{log.adminEmail}</p>
                  </td>

                  <td className="p-4 font-mono">
                    <span className="bg-[#F9F9F7] border border-[#E5E5E1] px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#B45309] uppercase">
                      {log.action}
                    </span>
                    <p className="text-[10px] text-[#6B6B66] uppercase mt-0.5">{log.entityType}</p>
                  </td>

                  <td className="p-4 text-[#171717]">
                    <p className="line-clamp-1">{log.description}</p>
                    {log.entityId && (
                      <p className="text-[10px] text-[#6B6B66] font-mono">Ref ID: {log.entityId}</p>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1.5 hover:bg-white border border-transparent hover:border-[#E5E5E1] rounded-lg text-[#6B6B66] hover:text-[#171717] transition-all ml-auto block shadow-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#6B6B66] font-mono">
                    Nenhum registro de log administrativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black uppercase text-[#171717] tracking-tight">
                  Detalhes do Log #{selectedLog.id}
                </h3>
                <p className="text-xs text-[#6B6B66] font-mono mt-0.5">
                  {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-[#6B6B66] hover:text-[#171717]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <strong className="text-[#6B6B66] uppercase font-mono">Responsável:</strong>{' '}
                <span className="text-[#171717]">{selectedLog.adminName} ({selectedLog.adminEmail})</span>
              </p>
              <p>
                <strong className="text-[#6B6B66] uppercase font-mono">Ação:</strong>{' '}
                <span className="text-[#B45309] font-bold uppercase">{selectedLog.action}</span>
              </p>
              <p>
                <strong className="text-[#6B6B66] uppercase font-mono">Descrição:</strong>{' '}
                <span className="text-[#171717]">{selectedLog.description}</span>
              </p>
            </div>

            {selectedLog.details && (
              <div>
                <p className="text-[11px] font-mono text-[#6B6B66] uppercase mb-1 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" /> Payload / Metadados:
                </p>
                <pre className="bg-[#F9F9F7] border border-[#E5E5E1] p-3 rounded-xl text-[11px] text-[#171717] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] text-xs font-bold uppercase text-[#171717] rounded-xl shadow-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
