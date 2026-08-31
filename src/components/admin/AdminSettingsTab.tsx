import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { StoreSettings } from '../../types';
import {
  Settings,
  Store,
  Truck,
  CreditCard,
  Bell,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ShieldCheck,
  Database
} from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'MARMOT CONFECCAO',
    contactEmail: 'contato@marmot.com.br',
    phone: '(11) 99999-9999',
    whatsapp: '11999999999',
    instagram: '@marmotstreetwear',
    freeShippingThreshold: 299.00,
    announcementBarText: 'FRETE GRÁTIS PARA TODO O BRASIL EM COMPRAS ACIMA DE R$ 299',
    announcementBarActive: true,
    maintenanceMode: false,
    originPostalCode: '01001000',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const fetchSettingsAndHealth = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('marmot_auth_token') || '';
    try {
      const [resSettings, resHealth] = await Promise.all([
        fetch('/api/admin/settings', { headers: { 'x-auth-token': token } }),
        fetch('/api/admin/health', { headers: { 'x-auth-token': token } }),
      ]);
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings(data);
      }
      if (resHealth.ok) {
        const health = await resHealth.json();
        setHealthData(health);
      }
    } catch (err) {
      console.error('Error fetching settings/health:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndHealth();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('marmot_auth_token') || '',
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Falha ao salvar configurações.');

      showToast('Configurações Salvas!', 'As definições da loja foram atualizadas.', 'success');
    } catch (err: any) {
      showToast('Erro ao Salvar', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
        <div>
          <h3 className="text-base font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#B45309]" /> Configurações Gerais do Sistema
          </h3>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Defina parâmetros operacionais, frete grátis, avisos e contatos da loja
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#F0C84B] hover:bg-amber-400 text-black text-xs font-extrabold uppercase rounded-xl transition-all shadow-xs disabled:opacity-40 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase text-[#B45309] flex items-center gap-2 font-mono">
            <Store className="w-4 h-4" /> Informações da Marca & Contato
          </h4>

          <div>
            <label className="text-xs font-mono text-[#6B6B66] block mb-1">Nome Fantasia da Loja:</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#6B6B66] block mb-1">E-mail de Atendimento Oficial:</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-[#6B6B66] block mb-1">WhatsApp / Suporte:</label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="11999999999"
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#6B6B66] block mb-1">Instagram da Marca:</label>
              <input
                type="text"
                value={settings.instagram || ''}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                placeholder="@marmotstreetwear"
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Logística */}
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase text-[#B45309] flex items-center gap-2 font-mono">
            <Truck className="w-4 h-4" /> Regras de Frete & Expedição
          </h4>

          <div>
            <label className="text-xs font-mono text-[#6B6B66] block mb-1">CEP de Origem (Centro de Distribuição):</label>
            <input
              type="text"
              value={settings.originPostalCode || '01001000'}
              onChange={(e) => setSettings({ ...settings, originPostalCode: e.target.value })}
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#6B6B66] block mb-1">Valor Mínimo para Frete Grátis (R$):</label>
            <input
              type="number"
              step="0.01"
              value={settings.freeShippingThreshold ?? 299}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
            />
          </div>

          <div className="pt-2 bg-[#F9F9F7] border border-[#E5E5E1] p-3 rounded-xl">
            <p className="text-[11px] text-[#6B6B66]">
              Transportadoras integradas ativas: <strong className="text-[#171717]">Correios (SEDEX, PAC) & Jadlog (.Package, .Com)</strong> via Melhor Envio.
            </p>
          </div>
        </div>

        {/* Announcement Bar & Top Notice */}
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">
          <h4 className="text-xs font-bold uppercase text-[#B45309] flex items-center gap-2 font-mono">
            <Bell className="w-4 h-4" /> Barra Superior de Avisos & Marketing
          </h4>

          <div>
            <label className="text-xs font-mono text-[#6B6B66] block mb-1">Texto da Barra Superior:</label>
            <input
              type="text"
              value={settings.announcementBarText || ''}
              onChange={(e) => setSettings({ ...settings, announcementBarText: e.target.value })}
              placeholder="FRETE GRÁTIS ACIMA DE R$ 299 • PARCELAMENTO EM ATÉ 6X SEM JUROS"
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcementBarActive}
                onChange={(e) => setSettings({ ...settings, announcementBarActive: e.target.checked })}
                className="accent-[#B45309] w-4 h-4 rounded"
              />
              <span className="text-xs text-[#171717] font-bold">Ativar Barra de Avisos no Topo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="accent-red-500 w-4 h-4 rounded"
              />
              <span className="text-xs text-red-600 font-bold">Modo Manutenção (Loja em Pausa)</span>
            </label>
          </div>
        </div>

        {/* Integrations Health Status */}
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-3 md:col-span-2 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-[#B45309] flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4" /> Diagnóstico Real de Integrações
            </h4>
            <span className="text-[10px] font-mono text-[#6B6B66]">
              {healthData?.readyForProduction ? (
                <span className="text-emerald-700 font-bold">● Pronto para Produção</span>
              ) : (
                <span className="text-amber-700 font-bold">▲ Configuração Parcial</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            {/* Mercado Pago */}
            <div className="p-3 bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#171717]">Mercado Pago</p>
                <p className="text-[10px] text-[#6B6B66]">Gateway & Webhooks</p>
              </div>
              {(() => {
                const st = healthData?.components?.mercadoPago?.status || 'NOT_CONFIGURED';
                if (st === 'OK') {
                  return <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">OK</span>;
                }
                if (st === 'WARNING') {
                  return <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase">WARNING</span>;
                }
                if (st === 'ERROR') {
                  return <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase">ERROR</span>;
                }
                return <span className="text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-300 px-2 py-0.5 rounded-full font-bold uppercase">NOT CONFIGURED</span>;
              })()}
            </div>

            {/* Melhor Envio */}
            <div className="p-3 bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#171717]">Melhor Envio</p>
                <p className="text-[10px] text-[#6B6B66]">Cotações & Etiquetas</p>
              </div>
              {(() => {
                const st = healthData?.components?.melhorEnvio?.status || 'NOT_CONFIGURED';
                if (st === 'OK') {
                  return <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">OK</span>;
                }
                if (st === 'WARNING') {
                  return <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase">WARNING</span>;
                }
                if (st === 'ERROR') {
                  return <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase">ERROR</span>;
                }
                return <span className="text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-300 px-2 py-0.5 rounded-full font-bold uppercase">NOT CONFIGURED</span>;
              })()}
            </div>

            {/* Banco Supabase */}
            <div className="p-3 bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#171717]">Supabase Database</p>
                <p className="text-[10px] text-[#6B6B66]">Tabelas & RLS</p>
              </div>
              {(() => {
                const st = healthData?.components?.database?.status || 'NOT_CONFIGURED';
                if (st === 'OK') {
                  return <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">OK</span>;
                }
                if (st === 'WARNING') {
                  return <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase">WARNING</span>;
                }
                if (st === 'ERROR') {
                  return <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase">ERROR</span>;
                }
                return <span className="text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-300 px-2 py-0.5 rounded-full font-bold uppercase">NOT CONFIGURED</span>;
              })()}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
