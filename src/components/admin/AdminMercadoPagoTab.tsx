import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Key,
  Lock,
  ExternalLink,
  Loader2,
  Info,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import { MercadoPagoAdminSettings } from '../../types';

export const AdminMercadoPagoTab: React.FC = () => {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<MercadoPagoAdminSettings>({
    environment: 'sandbox',
    isPublicKeyConfigured: false,
    isAccessTokenConfigured: false,
    isWebhookSecretConfigured: false,
    publicKeyMasked: '',
    accessTokenMasked: '',
    webhookSecretMasked: '',
    webhookUrl: '',
  });

  const [environmentInput, setEnvironmentInput] = useState<'sandbox' | 'production'>('sandbox');
  const [publicKeyInput, setPublicKeyInput] = useState('');
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/mercadopago/settings');
      if (res.ok) {
        const data: MercadoPagoAdminSettings = await res.json();
        setSettings(data);
        setEnvironmentInput(data.environment || 'sandbox');
      }
    } catch (err) {
      console.error('[Fetch MP Settings Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: any = {
        environment: environmentInput,
      };

      if (publicKeyInput.trim()) payload.publicKey = publicKeyInput.trim();
      if (accessTokenInput.trim()) payload.accessToken = accessTokenInput.trim();
      if (webhookSecretInput.trim()) payload.webhookSecret = webhookSecretInput.trim();
      if (clientSecretInput.trim()) payload.clientSecret = clientSecretInput.trim();

      const res = await fetch('/api/admin/mercadopago/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao atualizar credenciais do Mercado Pago.');
      }

      const resData = await res.json();
      setSettings(resData.settings);
      setPublicKeyInput('');
      setAccessTokenInput('');
      setWebhookSecretInput('');
      setClientSecretInput('');

      showToast(
        'Credenciais Atualizadas!',
        'As configurações do Mercado Pago foram salvas e criptografadas no servidor.',
        'success'
      );
    } catch (err: any) {
      showToast('Erro ao Salvar', err.message || 'Falha ao conectar com o backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    if (settings.webhookUrl) {
      navigator.clipboard.writeText(settings.webhookUrl);
      setCopiedWebhook(true);
      showToast('URL Copiada', 'Cole esta URL no painel de Webhooks do Mercado Pago.', 'info');
      setTimeout(() => setCopiedWebhook(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-[#161616] border border-[#262626] p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#009EE3]/10 border border-[#009EE3]/40 flex items-center justify-center text-[#009EE3]">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase text-[#EFECE6] tracking-tight">
                  Mercado Pago • Gateway de Pagamento
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    settings.environment === 'production'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950/60 text-amber-400 border-amber-800'
                  }`}
                >
                  {settings.environment === 'production' ? 'PRODUÇÃO' : 'MODO TESTE (SANDBOX)'}
                </span>
              </div>
              <p className="text-xs text-[#777777] mt-0.5">
                Processamento transparente de PIX, Cartão de Crédito e Boletos com assinatura HMAC-SHA256 e segurança no backend.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-[#777777] hover:text-[#EFECE6] bg-[#080808] border border-[#262626] px-3.5 py-2 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>

        {/* Security / Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="bg-[#080808] border border-[#262626] p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#777777] uppercase font-bold">Public Key (Frontend)</p>
              <p className="text-xs font-mono font-bold text-[#EFECE6] mt-0.5">
                {settings.isPublicKeyConfigured ? settings.publicKeyMasked : 'Não configurada'}
              </p>
            </div>
            {settings.isPublicKeyConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>

          <div className="bg-[#080808] border border-[#262626] p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#777777] uppercase font-bold">Access Token (Backend)</p>
              <p className="text-xs font-mono font-bold text-[#EFECE6] mt-0.5">
                {settings.isAccessTokenConfigured ? settings.accessTokenMasked : 'Não configurado'}
              </p>
            </div>
            {settings.isAccessTokenConfigured ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>

          <div className="bg-[#080808] border border-[#262626] p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#777777] uppercase font-bold">Webhook Secret (HMAC)</p>
              <p className="text-xs font-mono font-bold text-[#EFECE6] mt-0.5">
                {settings.isWebhookSecretConfigured ? settings.webhookSecretMasked : 'Opcional / Sandbox'}
              </p>
            </div>
            {settings.isWebhookSecretConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Info className="w-5 h-5 text-blue-400" />
            )}
          </div>
        </div>
      </div>

      {/* Main Form Settings */}
      <form onSubmit={handleSaveSettings} className="bg-[#161616] border border-[#262626] p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-[#262626]">
          <Key className="w-4 h-4 text-[#D6B35A]" />
          <h3 className="text-sm font-bold uppercase text-[#EFECE6]">Configuração de Credenciais da API</h3>
        </div>

        {/* Environment Toggle */}
        <div>
          <label className="text-xs font-bold text-[#777777] uppercase block mb-2">Ambiente de Execução</label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setEnvironmentInput('sandbox')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                environmentInput === 'sandbox'
                  ? 'bg-amber-950/30 border-amber-500 text-amber-300'
                  : 'bg-[#080808] border-[#262626] text-[#777777] hover:text-[#EFECE6]'
              }`}
            >
              <Lock className="w-4 h-4" /> Modo Sandbox (Teste)
            </button>
            <button
              type="button"
              onClick={() => setEnvironmentInput('production')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                environmentInput === 'production'
                  ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300'
                  : 'bg-[#080808] border-[#262626] text-[#777777] hover:text-[#EFECE6]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Modo Produção
            </button>
          </div>
        </div>

        {/* Public Key */}
        <div>
          <label className="text-xs font-bold text-[#777777] uppercase block mb-1">
            Public Key (Chave Pública de Teste ou Produção)
          </label>
          <input
            type="text"
            value={publicKeyInput}
            onChange={(e) => setPublicKeyInput(e.target.value)}
            placeholder={settings.isPublicKeyConfigured ? 'Chave configurada. Digite uma nova para alterar...' : 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
            className="w-full bg-[#080808] border border-[#262626] px-4 py-3 rounded-xl text-xs font-mono text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
          />
          <p className="text-[11px] text-[#777777] mt-1">
            Utilizada pelo SDK frontend apenas para tokenização de cartões.
          </p>
        </div>

        {/* Access Token */}
        <div>
          <label className="text-xs font-bold text-[#777777] uppercase block mb-1">
            Access Token (Token de Acesso Mestre)
          </label>
          <input
            type="password"
            value={accessTokenInput}
            onChange={(e) => setAccessTokenInput(e.target.value)}
            placeholder={settings.isAccessTokenConfigured ? 'Token configurado no servidor. Digite um novo para alterar...' : 'TEST-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxx'}
            className="w-full bg-[#080808] border border-[#262626] px-4 py-3 rounded-xl text-xs font-mono text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
          />
          <p className="text-[11px] text-[#777777] mt-1">
            Armazenado exclusivamente no backend seguro. Nunca é exposto ao navegador do cliente.
          </p>
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="text-xs font-bold text-[#777777] uppercase block mb-1">
            Webhook Secret (Chave de Assinatura HMAC-SHA256)
          </label>
          <input
            type="password"
            value={webhookSecretInput}
            onChange={(e) => setWebhookSecretInput(e.target.value)}
            placeholder={settings.isWebhookSecretConfigured ? 'Secret configurado. Digite um novo para alterar...' : 'Obtida no painel do Mercado Pago > Suas integrações > Notificações Webhook'}
            className="w-full bg-[#080808] border border-[#262626] px-4 py-3 rounded-xl text-xs font-mono text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
          />
          <p className="text-[11px] text-[#777777] mt-1">
            Utilizado pelo endpoint de webhook para verificar que as notificações vêm autenticamente do Mercado Pago.
          </p>
        </div>

        {/* Webhook URL Display */}
        <div className="bg-[#080808] border border-[#262626] p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777777] uppercase flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-[#009EE3]" /> URL do Webhook do seu Servidor
            </span>
            <button
              type="button"
              onClick={handleCopyWebhookUrl}
              className="text-xs text-[#009EE3] hover:underline flex items-center gap-1 font-mono font-bold"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWebhook ? 'Copiado!' : 'Copiar URL'}
            </button>
          </div>
          <div className="bg-[#111] p-2.5 rounded-lg border border-[#222] font-mono text-xs text-[#EFECE6] break-all">
            {settings.webhookUrl || `${window.location.origin}/api/mercadopago/webhook`}
          </div>
          <p className="text-[10px] text-[#777777]">
            Eventos suportados: <span className="font-mono text-[#EFECE6]">payment (Pagamentos)</span>. O backend valida a assinatura HMAC e consulta diretamente o status do pedido na API.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#D6B35A] hover:bg-[#c4a24f] text-[#080808] font-black uppercase text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Credenciais
          </button>
        </div>
      </form>

      {/* Developer Help Link */}
      <div className="bg-[#080808] border border-[#262626] p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#777777]">
          <Info className="w-4 h-4 text-[#009EE3]" />
          <span>Obtenha suas credenciais oficiais de teste no painel de desenvolvedor do Mercado Pago.</span>
        </div>
        <a
          href="https://www.mercadopago.com.br/developers/panel"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#009EE3] hover:underline flex items-center gap-1 font-bold"
        >
          Painel Mercado Pago Developers <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
