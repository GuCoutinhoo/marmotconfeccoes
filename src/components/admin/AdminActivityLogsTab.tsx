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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#141414] border border-[#222222] p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por Responsável, Ação, Entidade ou Descrição..."
            className="w-full bg-[#080808] border border-[#262626] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#EFECE6] placeholder-[#555] focus:outline-none focus:border-[#D6B35A]"
          />
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-4 py-2.5 bg-[#080808] hover:bg-[#1a1a1a] border border-[#262626] rounded-xl text-xs font-bold uppercase text-[#A0A0A0] hover:text-[#EFECE6] transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D6B35A] ${isLoading ? 'animate-spin' : ''}`} /> Atualizar Logs
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0a0a0a] text-[#777777] font-mono uppercase tracking-wider">
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Administrador</th>
                <th className="p-4">Ação / Módulo</th>
                <th className="p-4">Descrição da Operação</th>
                <th className="p-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-[#181818] transition-colors cursor-pointer"
                >
                  <td className="p-4 font-mono text-[#777777] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-[#EFECE6]">{log.adminName}</p>
                    <p className="text-[10px] text-[#777] font-mono">{log.adminEmail}</p>
                  </td>

                  <td className="p-4 font-mono">
                    <span className="bg-[#080808] border border-[#262626] px-2 py-0.5 rounded text-[10px] font-bold text-[#D6B35A] uppercase">
                      {log.action}
                    </span>
                    <p className="text-[10px] text-[#777] uppercase mt-0.5">{log.entityType}</p>
                  </td>

                  <td className="p-4 text-[#EFECE6]">
                    <p className="line-clamp-1">{log.description}</p>
                    {log.entityId && (
                      <p className="text-[10px] text-[#777] font-mono">Ref ID: {log.entityId}</p>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1.5 hover:bg-[#262626] rounded-lg text-[#777] hover:text-[#EFECE6] transition-all ml-auto block"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#777777] font-mono">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black uppercase text-[#EFECE6] tracking-tight">
                  Detalhes do Log #{selectedLog.id}
                </h3>
                <p className="text-xs text-[#777777] font-mono mt-0.5">
                  {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-[#777777] hover:text-[#EFECE6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <strong className="text-[#777] uppercase font-mono">Responsável:</strong>{' '}
                <span className="text-[#EFECE6]">{selectedLog.adminName} ({selectedLog.adminEmail})</span>
              </p>
              <p>
                <strong className="text-[#777] uppercase font-mono">Ação:</strong>{' '}
                <span className="text-[#D6B35A] font-bold uppercase">{selectedLog.action}</span>
              </p>
              <p>
                <strong className="text-[#777] uppercase font-mono">Descrição:</strong>{' '}
                <span className="text-[#EFECE6]">{selectedLog.description}</span>
              </p>
            </div>

            {selectedLog.details && (
              <div>
                <p className="text-[11px] font-mono text-[#777] uppercase mb-1 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" /> Payload / Metadados:
                </p>
                <pre className="bg-[#080808] border border-[#262626] p-3 rounded-xl text-[11px] text-[#A0A0A0] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#080808] hover:bg-[#222] border border-[#262626] text-xs font-bold uppercase text-[#EFECE6] rounded-xl"
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
