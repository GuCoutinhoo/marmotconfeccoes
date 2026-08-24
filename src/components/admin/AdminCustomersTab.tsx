import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminCustomer } from '../../types';
import {
  Users,
  Search,
  DollarSign,
  ShoppingBag,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Lock,
  Unlock,
  ExternalLink,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Clock
} from 'lucide-react';

export const AdminCustomersTab: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.cpf && c.cpf.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.status !== 'blocked') ||
      (statusFilter === 'blocked' && c.status === 'blocked');

    return matchesSearch && matchesStatus;
  });

  const handleToggleBlock = async (customer: AdminCustomer) => {
    setIsTogglingStatus(true);
    const newStatus = customer.status === 'blocked' ? 'active' : 'blocked';
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('marmot_auth_token') || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status do cliente.');

      showToast(
        newStatus === 'blocked' ? 'Cliente Bloqueado' : 'Cliente Ativado',
        `O cliente ${customer.name} foi marcado como ${newStatus === 'blocked' ? 'bloqueado' : 'ativo'}.`,
        'info'
      );

      setSelectedCustomer((prev) => (prev ? { ...prev, status: newStatus } : null));
      await fetchCustomers();
    } catch (err: any) {
      showToast('Erro', err.message, 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-white border border-[#E5E5E1] p-4 sm:p-5 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome, E-mail, CPF ou Cidade..."
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
            onClick={fetchCustomers}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white hover:bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl text-xs font-bold uppercase text-[#171717] transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B45309] ${isLoading ? 'animate-spin' : ''}`} /> Atualizar Clientes
          </button>
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
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'active'
                ? 'bg-[#F0C84B] text-black shadow-xs font-extrabold'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] hover:border-[#B45309]'
            }`}
          >
            Ativos ({customers.filter((c) => c.status !== 'blocked').length})
          </button>
          <button
            onClick={() => setStatusFilter('blocked')}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              statusFilter === 'blocked'
                ? 'bg-[#F0C84B] text-black shadow-xs font-extrabold'
                : 'bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] hover:border-[#B45309]'
            }`}
          >
            Bloqueados ({customers.filter((c) => c.status === 'blocked').length})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#6B6B66] font-mono uppercase tracking-wider">
                <th className="p-4">Cliente</th>
                <th className="p-4">Contato / Localização</th>
                <th className="p-4">Total de Pedidos</th>
                <th className="p-4">LTV (Faturamento Total)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredCustomers.map((customer) => {
                const isBlocked = customer.status === 'blocked';
                return (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-[#F9F9F7] transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F0C84B]/20 border border-[#F0C84B]/40 flex items-center justify-center font-bold text-[#B45309]">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#171717] group-hover:text-[#B45309] transition-colors">
                            {customer.name}
                          </p>
                          <p className="text-[10px] text-[#6B6B66] font-mono">
                            {customer.role === 'admin' ? 'Administrador' : 'Cliente Marmot'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="text-[#171717]">{customer.email}</p>
                      <p className="text-[10px] text-[#6B6B66] font-mono">
                        {customer.city ? `${customer.city}/${customer.state}` : 'Endereço pendente'}
                      </p>
                    </td>

                    <td className="p-4 font-mono">
                      <span className="font-bold text-[#171717]">{customer.totalOrders || 0} pedidos</span>
                      {customer.lastOrderDate && (
                        <p className="text-[10px] text-[#6B6B66]">
                          Último: {new Date(customer.lastOrderDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </td>

                    <td className="p-4 font-mono">
                      <p className="font-black text-[#B45309]">
                        R$ {(customer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-[#6B6B66]">
                        Ticket Médio: R$ {(customer.averageTicket || 0).toFixed(2)}
                      </p>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          isBlocked
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isBlocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                        className="p-2 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] hover:border-[#B45309] rounded-lg text-[#B45309] transition-all shadow-xs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#6B6B66] font-mono">
                    Nenhum cliente cadastrado correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-6 p-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E5E5E1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F0C84B]/20 border border-[#F0C84B]/40 flex items-center justify-center font-black text-xl text-[#B45309]">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-[#171717] tracking-tight">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-[#6B6B66] font-mono">ID: {selectedCustomer.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleBlock(selectedCustomer)}
                  disabled={isTogglingStatus}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                    selectedCustomer.status === 'blocked'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-700'
                  }`}
                >
                  {selectedCustomer.status === 'blocked' ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> Desbloquear
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Bloquear
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 hover:bg-[#F9F9F7] rounded-lg text-[#6B6B66] hover:text-[#171717] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Metrics Snapshot */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl text-center">
                <p className="text-[10px] text-[#6B6B66] uppercase font-bold">Total Gasto (LTV)</p>
                <p className="text-base font-black text-[#B45309] mt-1">
                  R$ {(selectedCustomer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl text-center">
                <p className="text-[10px] text-[#6B6B66] uppercase font-bold">Pedidos Realizados</p>
                <p className="text-base font-black text-[#171717] mt-1">
                  {selectedCustomer.totalOrders || 0}
                </p>
              </div>

              <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl text-center">
                <p className="text-[10px] text-[#6B6B66] uppercase font-bold">Ticket Médio</p>
                <p className="text-base font-black text-emerald-600 mt-1">
                  R$ {(selectedCustomer.averageTicket || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold uppercase text-[#B45309] font-mono">Dados de Contato & Cadastro</h4>
              <p className="text-[#171717] flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#6B6B66]" /> {selectedCustomer.email}
              </p>
              <p className="text-[#171717] flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#6B6B66]" /> {selectedCustomer.phone || 'Telefone não cadastrado'}
              </p>
              <p className="text-[#171717] flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#6B6B66]" /> {selectedCustomer.city ? `${selectedCustomer.city} - ${selectedCustomer.state}` : 'Sem endereço padrão'}
              </p>
              <p className="text-[#6B6B66] flex items-center gap-2 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-[#6B6B66]" /> Cadastrado em: {new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
