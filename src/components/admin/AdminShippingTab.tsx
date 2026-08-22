import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Save,
  Send,
  Package,
  Layers,
  Key,
  MapPin,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';

interface ShippingSettings {
  originPostalCode: string;
  environment: 'production' | 'sandbox';
  hasCustomToken: boolean;
  tokenMasked: string;
  defaultWeight: number;
  defaultHeight: number;
  defaultWidth: number;
  defaultLength: number;
}

export const AdminShippingTab: React.FC = () => {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<ShippingSettings>({
    originPostalCode: '03806010',
    environment: 'production',
    hasCustomToken: true,
    tokenMasked: 'eyJ0eXAiOi... (Ativo)',
    defaultWeight: 0.35,
    defaultHeight: 4,
    defaultWidth: 20,
    defaultLength: 25,
  });

  const [originCepInput, setOriginCepInput] = useState('03806-010');
  const [newTokenInput, setNewTokenInput] = useState('');
  const [environmentInput, setEnvironmentInput] = useState<'production' | 'sandbox'>('production');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Test Tool State
  const [testCep, setTestCep] = useState('01310-100');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testSource, setTestSource] = useState<string>('');

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/shipping/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        const cep = data.originPostalCode || '03806010';
        setOriginCepInput(cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep);
        setEnvironmentInput(data.environment || 'production');
      }
    } catch (err) {
      console.warn('Erro ao carregar configurações de frete:', err);
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

    const cleanOrigin = originCepInput.replace(/\D/g, '');
    if (cleanOrigin.length !== 8) {
      showToast('CEP Inválido', 'O CEP de origem deve conter 8 dígitos.', 'error');
      setIsSaving(false);
      return;
    }

    try {
      const payload: any = {
        originPostalCode: cleanOrigin,
        environment: environmentInput,
      };
      if (newTokenInput.trim()) {
        payload.token = newTokenInput.trim();
      }

      const res = await fetch('/api/admin/shipping/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        showToast('Configurações Salvas!', 'Parâmetros do Melhor Envio atualizados com sucesso.', 'success');
        setNewTokenInput('');
        fetchSettings();
      } else {
        showToast('Erro ao Salvar', 'Não foi possível atualizar as configurações.', 'error');
      }
    } catch (err) {
      showToast('Erro de Conexão', 'Falha ao comunicar com o backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTest = async () => {
    const cleanDestination = testCep.replace(/\D/g, '');
    if (cleanDestination.length !== 8) {
      showToast('CEP de Teste Inválido', 'Informe um CEP de destino com 8 dígitos.', 'error');
      return;
    }

    setIsTesting(true);
    setTestResults([]);
    try {
      // First ensure a valid product ID is passed or use catalog product
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: cleanDestination,
          items: [
            {
              productId: 'prod-001',
              quantity: 1,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResults(data.options || []);
        setTestSource(data.source || 'melhor_envio_api');
        showToast('Cotação Realizada', `${(data.options || []).length} opções calculadas com sucesso!`, 'success');
      } else {
        showToast('Erro no Cálculo', 'Verifique o CEP e as credenciais.', 'error');
      }
    } catch (err) {
      showToast('Erro no Teste', 'Falha ao executar cotação de teste.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#161616] border border-[#262626] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D6B35A] uppercase">
            <Truck className="w-4 h-4" /> Integração Oficial de Logística
          </div>
          <h2 className="text-xl font-black uppercase text-[#EFECE6] mt-1">
            Melhor Envio • Cotação de Frete & Logística
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Gerencie o CEP de origem do estoque, credenciais de API seguras no backend e teste as cotações em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {settings.isTokenConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> API Conectada & Operante
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-800/40">
              <AlertCircle className="w-3.5 h-3.5" /> Token Pendente de Configuração
            </span>
          )}
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#080808] border border-[#262626] text-[#777777] hover:text-[#EFECE6] transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-[#161616] border border-[#262626] p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#EFECE6] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D6B35A]" /> Parâmetros de Origem e Ambiente
              </h3>
              <span className="text-[11px] text-[#777777] font-mono">Backend Secure Service</span>
            </div>

            <div className="space-y-4">
              {/* Origin CEP */}
              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">
                  CEP de Origem do Centro de Distribuição (SP) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={originCepInput}
                    onChange={(e) => setOriginCepInput(e.target.value)}
                    placeholder="03806-010"
                    maxLength={9}
                    className="w-full bg-[#080808] border border-[#262626] pl-10 pr-4 py-2.5 rounded-lg text-xs text-[#EFECE6] font-mono focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>
                <p className="text-[10px] text-[#777777] mt-1">
                  Este CEP nunca é escolhido pelo cliente e serve como base oficial para todo cálculo de frete.
                </p>
              </div>

              {/* Environment */}
              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">Ambiente da API</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnvironmentInput('production')}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      environmentInput === 'production'
                        ? 'bg-[#080808] border-[#D6B35A] text-[#D6B35A]'
                        : 'bg-[#080808] border-[#262626] text-[#777777] hover:text-[#EFECE6]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Produção Oficial
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnvironmentInput('sandbox')}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      environmentInput === 'sandbox'
                        ? 'bg-[#080808] border-[#D6B35A] text-[#D6B35A]'
                        : 'bg-[#080808] border-[#262626] text-[#777777] hover:text-[#EFECE6]'
                    }`}
                  >
                    <Layers className="w-4 h-4" /> Sandbox (Testes)
                  </button>
                </div>
              </div>

              {/* Token Display & Update */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-[#777777] block mb-1">
                  Token JWT do Melhor Envio
                </label>
                <div className="p-3 bg-[#080808] border border-[#262626] rounded-lg text-xs font-mono text-[#D6B35A] flex items-center justify-between">
                  <span className="truncate pr-2">
                    {settings.isTokenConfigured ? (settings.tokenMasked || '••••••••••••••••••••') : 'Nenhum token configurado'}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                    settings.isTokenConfigured 
                      ? 'text-emerald-400 bg-emerald-950/60' 
                      : 'text-amber-400 bg-amber-950/60'
                  }`}>
                    {settings.isTokenConfigured ? 'Ativo' : 'Pendente'}
                  </span>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] text-[#777777] block mb-1">Substituir Token (Opcional):</label>
                  <input
                    type="password"
                    value={newTokenInput}
                    onChange={(e) => setNewTokenInput(e.target.value)}
                    placeholder="Cole um novo token JWT se desejar atualizar..."
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-xs text-[#EFECE6] font-mono focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#262626] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase px-6 py-3 rounded transition-all flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </button>
            </div>
          </form>

          {/* Architecture info */}
          <div className="bg-[#161616] border border-[#262626] p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-black uppercase text-[#EFECE6] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#D6B35A]" /> Diretrizes de Segurança Aplicadas
            </h4>
            <ul className="text-xs text-[#777777] space-y-1.5 list-disc list-inside">
              <li>O token de API do Melhor Envio fica armazenado estritamente no backend (Node.js).</li>
              <li>O frontend nunca tem acesso a chaves ou credenciais confidenciais.</li>
              <li>O backend recalcula e valida os fretes na criação de cada pedido para evitar adulterações.</li>
              <li>Transportadoras suportadas: Correios (SEDEX, PAC, Mini Envios), Jadlog (.Package, .Com), Azul Cargo e LATAM Cargo.</li>
            </ul>
          </div>
        </div>

        {/* Live Shipping Simulator - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#161616] border border-[#262626] p-6 rounded-2xl space-y-5">
            <div className="border-b border-[#262626] pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#EFECE6] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#D6B35A]" /> Teste de Cotação em Tempo Real
              </h3>
              <p className="text-[11px] text-[#777777] mt-1">
                Simule o cálculo de envio com as transportadoras para qualquer CEP do Brasil.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">CEP de Destino de Teste</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testCep}
                    onChange={(e) => setTestCep(e.target.value)}
                    placeholder="Ex: 01310-100"
                    maxLength={9}
                    className="flex-1 bg-[#080808] border border-[#262626] px-3.5 py-2.5 rounded-lg text-xs font-mono text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                  <button
                    type="button"
                    onClick={handleRunTest}
                    disabled={isTesting}
                    className="bg-[#D6B35A] text-black font-extrabold text-xs uppercase px-4 py-2.5 rounded-lg hover:bg-[#EFECE6] transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                    Cotar
                  </button>
                </div>
              </div>

              {/* Sample Package Info */}
              <div className="p-3 bg-[#080808] border border-[#262626] rounded-lg text-[11px] text-[#777777] space-y-1">
                <div className="flex justify-between font-bold text-[#EFECE6]">
                  <span>Pacote de Amostra:</span>
                  <span className="text-[#D6B35A]">1x Camiseta Heavyweight</span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensões:</span>
                  <span>25cm × 20cm × 4cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso:</span>
                  <span>350g (0.35 kg)</span>
                </div>
              </div>
            </div>

            {/* Test Results Output */}
            {testResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#EFECE6] uppercase">Resultado da Cotação ({testResults.length} Opções)</span>
                  <span className="text-[10px] text-[#D6B35A] font-mono">
                    {testSource === 'melhor_envio_api' ? 'API Melhor Envio' : 'Zona Regional'}
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {testResults.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-3 bg-[#080808] border border-[#262626] rounded-lg flex items-center justify-between hover:border-[#444] transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#EFECE6]">{opt.name}</p>
                          <span className="text-[10px] text-[#777777]">({opt.carrier || opt.company})</span>
                        </div>
                        <p className="text-[10px] text-[#777777]">
                          Prazo: {opt.deliveryDays || `${opt.deliveryTime} dias úteis`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#D6B35A] font-mono">
                          R$ {opt.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
