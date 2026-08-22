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

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
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
      <div className="flex items-center justify-between bg-[#141414] border border-[#222222] p-5 rounded-2xl">
        <div>
          <h3 className="text-base font-black uppercase text-[#EFECE6] tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D6B35A]" /> Configurações Gerais do Sistema
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Defina parâmetros operacionais, frete grátis, avisos e contatos da loja
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#D6B35A] hover:bg-[#EFECE6] text-black text-xs font-black uppercase rounded-xl transition-all shadow-md disabled:opacity-40 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold uppercase text-[#D6B35A] flex items-center gap-2 font-mono">
            <Store className="w-4 h-4" /> Informações da Marca & Contato
          </h4>

          <div>
            <label className="text-xs font-mono text-[#777777] block mb-1">Nome Fantasia da Loja:</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#777777] block mb-1">E-mail de Atendimento Oficial:</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-[#777777] block mb-1">WhatsApp / Suporte:</label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="11999999999"
                className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#777777] block mb-1">Instagram da Marca:</label>
              <input
                type="text"
                value={settings.instagram || ''}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                placeholder="@marmotstreetwear"
                className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Logística */}
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold uppercase text-[#D6B35A] flex items-center gap-2 font-mono">
            <Truck className="w-4 h-4" /> Regras de Frete & Expedição
          </h4>

          <div>
            <label className="text-xs font-mono text-[#777777] block mb-1">CEP de Origem (Centro de Distribuição):</label>
            <input
              type="text"
              value={settings.originPostalCode || '01001000'}
              onChange={(e) => setSettings({ ...settings, originPostalCode: e.target.value })}
              className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#777777] block mb-1">Valor Mínimo para Frete Grátis (R$):</label>
            <input
              type="number"
              step="0.01"
              value={settings.freeShippingThreshold ?? 299}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
            />
          </div>

          <div className="pt-2 bg-[#080808] border border-[#1f1f1f] p-3 rounded-xl">
            <p className="text-[11px] text-[#A0A0A0]">
              Transportadoras integradas ativas: <strong className="text-[#EFECE6]">Correios (SEDEX, PAC) & Jadlog (.Package, .Com)</strong> via Melhor Envio.
            </p>
          </div>
        </div>

        {/* Announcement Bar & Top Notice */}
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-4 md:col-span-2">
          <h4 className="text-xs font-bold uppercase text-[#D6B35A] flex items-center gap-2 font-mono">
            <Bell className="w-4 h-4" /> Barra Superior de Avisos & Marketing
          </h4>

          <div>
            <label className="text-xs font-mono text-[#777777] block mb-1">Texto da Barra Superior:</label>
            <input
              type="text"
              value={settings.announcementBarText || ''}
              onChange={(e) => setSettings({ ...settings, announcementBarText: e.target.value })}
              placeholder="FRETE GRÁTIS ACIMA DE R$ 299 • PARCELAMENTO EM ATÉ 6X SEM JUROS"
              className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcementBarActive}
                onChange={(e) => setSettings({ ...settings, announcementBarActive: e.target.checked })}
                className="accent-[#D6B35A] w-4 h-4 rounded"
              />
              <span className="text-xs text-[#EFECE6] font-bold">Ativar Barra de Avisos no Topo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="accent-red-500 w-4 h-4 rounded"
              />
              <span className="text-xs text-red-400 font-bold">Modo Manutenção (Loja em Pausa)</span>
            </label>
          </div>
        </div>

        {/* Integrations Health Status */}
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-3 md:col-span-2">
          <h4 className="text-xs font-bold uppercase text-[#D6B35A] flex items-center gap-2 font-mono">
            <ShieldCheck className="w-4 h-4" /> Status das Integrações do Sistema
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#EFECE6]">Mercado Pago</p>
                <p className="text-[10px] text-[#777]">PIX & Cartão de Crédito</p>
              </div>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold uppercase">
                Conectado
              </span>
            </div>

            <div className="p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#EFECE6]">Melhor Envio</p>
                <p className="text-[10px] text-[#777]">Cotações & Rastreio</p>
              </div>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold uppercase">
                Conectado
              </span>
            </div>

            <div className="p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-[#EFECE6]">Banco de Dados</p>
                <p className="text-[10px] text-[#777]">Supabase & Armazenamento</p>
              </div>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold uppercase">
                Persistente
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
