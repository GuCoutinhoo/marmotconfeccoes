import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { validateSenderDocument, formatDocument } from '../../utils/cpfValidator';
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
  Building2,
  DollarSign,
  UserCheck,
  Zap,
} from 'lucide-react';

interface SenderAddress {
  name: string;
  document: string;
  stateRegister?: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

interface ShippingSettings {
  originPostalCode: string;
  environment: 'production' | 'sandbox';
  isTokenConfigured: boolean;
  tokenMasked?: string;
  appName?: string;
  appEmail?: string;
  clientId?: string;
  redirectUri?: string;
  sender?: SenderAddress;
  defaultWeight: number;
  defaultHeight: number;
  defaultWidth: number;
  defaultLength: number;
}

interface ConnectionTestResult {
  connected: boolean;
  environment: string;
  accountName?: string;
  accountEmail?: string;
  balance?: number;
  message?: string;
  timestamp?: string;
}

export const AdminShippingTab: React.FC = () => {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<ShippingSettings>({
    originPostalCode: '03806010',
    environment: 'production',
    isTokenConfigured: false,
    tokenMasked: '',
    appName: 'Marmot Confecções',
    appEmail: 'contato@marmot.com.br',
    sender: {
      name: 'Marmot Confecções',
      document: '',
      stateRegister: 'ISENTO',
      phone: '11988421092',
      email: 'contato@marmot.com.br',
      street: 'Avenida Celso Garcia',
      number: '1200',
      complement: '',
      neighborhood: 'Brás',
      city: 'São Paulo',
      state: 'SP',
      cep: '03806-010',
    },
    defaultWeight: 0.35,
    defaultHeight: 4,
    defaultWidth: 20,
    defaultLength: 25,
  });

  const [originCepInput, setOriginCepInput] = useState('03806-010');
  const [newTokenInput, setNewTokenInput] = useState('');
  const [environmentInput, setEnvironmentInput] = useState<'production' | 'sandbox'>('production');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  
  // Sender form state
  const [senderForm, setSenderForm] = useState<SenderAddress>({
    name: 'Marmot Confecções',
    document: '',
    stateRegister: 'ISENTO',
    phone: '11988421092',
    email: 'contato@marmot.com.br',
    street: 'Avenida Celso Garcia',
    number: '1200',
    complement: '',
    neighborhood: 'Brás',
    city: 'São Paulo',
    state: 'SP',
    cep: '03806-010',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null);

  // Test Quote State
  const [testCep, setTestCep] = useState('01310-100');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestingQuote, setIsTestingQuote] = useState(false);
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
        if (data.clientId) setClientIdInput(data.clientId);
        if (data.sender) {
          setSenderForm({
            name: data.sender.name || '',
            document: data.sender.document || '',
            stateRegister: data.sender.stateRegister || 'ISENTO',
            phone: data.sender.phone || '',
            email: data.sender.email || '',
            street: data.sender.street || '',
            number: data.sender.number || '',
            complement: data.sender.complement || '',
            neighborhood: data.sender.neighborhood || '',
            city: data.sender.city || '',
            state: data.sender.state || 'SP',
            cep: data.sender.cep || '',
          });
        }
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

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTest(null);
    try {
      const res = await fetch('/api/admin/melhor-envio/test-connection');
      const data = await res.json();
      setConnectionTest(data);
      if (data.connected) {
        showToast('Conexão Estabelecida!', `Melhor Envio ativo para conta: ${data.accountName || 'Autenticada'}`, 'success');
      } else {
        showToast('Aviso de Conexão', data.message || 'Token não respondeu adequadamente à API do Melhor Envio.', 'error');
      }
    } catch (err: any) {
      setConnectionTest({
        connected: false,
        environment: environmentInput,
        message: err.message || 'Falha ao conectar com o serviço de frete.',
      });
      showToast('Erro de Comunicação', 'Não foi possível verificar a conexão com o Melhor Envio.', 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleStartOAuth = async () => {
    try {
      const res = await fetch('/api/admin/melhor-envio/auth-url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
        showToast('Autorização Iniciada', 'Faça login no Melhor Envio e aprove as permissões do aplicativo.', 'info');
      } else {
        showToast('Erro OAuth', data.error || 'Client ID ou URL de Callback não configurados.', 'error');
      }
    } catch (err: any) {
      showToast('Erro', 'Não foi possível obter URL de autorização.', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const cleanOrigin = originCepInput.replace(/\D/g, '');
    if (cleanOrigin.length !== 8) {
      showToast('CEP Inválido', 'O CEP de origem deve conter 8 dígitos.', 'error');
      setIsSaving(false);
      return;
    }

    const docValidation = validateSenderDocument(senderForm.document);
    if (!docValidation.valid) {
      showToast('Documento Inválido', docValidation.error || 'Informe um CPF ou CNPJ válido para o remetente.', 'error');
      setIsSaving(false);
      return;
    }

    try {
      const payload: any = {
        originPostalCode: cleanOrigin,
        environment: environmentInput,
        clientId: clientIdInput.trim() || undefined,
        clientSecret: clientSecretInput.trim() || undefined,
        sender: {
          ...senderForm,
          document: formatDocument(docValidation.digits),
          cep: cleanOrigin,
        },
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
        showToast('Configurações Salvas!', 'Parâmetros de remetente e Melhor Envio atualizados com sucesso.', 'success');
        setNewTokenInput('');
        setClientSecretInput('');
        fetchSettings();
        handleTestConnection();
      } else {
        const errData = await res.json();
        showToast('Erro ao Salvar', errData.error || 'Não foi possível atualizar as configurações.', 'error');
      }
    } catch (err) {
      showToast('Erro de Conexão', 'Falha ao comunicar com o backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestQuote = async () => {
    const cleanCep = testCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      showToast('CEP Inválido', 'Digite um CEP com 8 dígitos para testar.', 'error');
      return;
    }

    setIsTestingQuote(true);
    setTestResults([]);
    setTestSource('');

    try {
      const token = localStorage.getItem('@marmot_auth_token') || localStorage.getItem('supabase.auth.token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          destinationPostalCode: cleanCep,
          items: [{ productId: 'sample_product', quantity: 1 }],
          package: {
            height: settings.defaultHeight,
            width: settings.defaultWidth,
            length: settings.defaultLength,
            weight: settings.defaultWeight,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao calcular frete.');
      }

      const quotes = data.quotes || data.options || [];
      setTestResults(quotes);
      setTestSource('API Oficial Melhor Envio (Produção)');
      showToast('Cotação Concluída', `${quotes.length} transportadoras reais cotadas para o CEP ${cleanCep}.`, 'success');
    } catch (err: any) {
      showToast('Falha na Cotação', err.message || 'Erro ao calcular cotação de teste.', 'error');
    } finally {
      setIsTestingQuote(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-amber-600" />
            Configurações de Logística & Melhor Envio
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Gerencie credenciais oficiais da API, dados fiscais do remetente e gere etiquetas com proteção de saldo e reconciliação.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.isTokenConfigured ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
              {settings.isTokenConfigured ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-stone-900">Integração com Melhor Envio</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${settings.environment === 'production' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                  Ambiente: {settings.environment === 'production' ? 'PRODUÇÃO' : 'SANDBOX'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${settings.isTokenConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {settings.isTokenConfigured ? 'Token Configurado' : 'Token Pendente'}
                </span>
              </div>
              <p className="text-sm text-stone-500 mt-1">
                Utilizado para cotação em tempo real no checkout, emissão automática de envios no carrinho e geração de etiquetas oficiais.
              </p>
              {connectionTest && (
                <div className={`mt-3 text-xs p-2.5 rounded-lg border ${connectionTest.connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  <div className="font-semibold flex items-center gap-1.5">
                    {connectionTest.connected ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {connectionTest.connected ? `Conectado com sucesso: ${connectionTest.accountName || 'Conta Ativa'}` : 'Falha na conexão'}
                  </div>
                  {connectionTest.balance !== undefined && (
                    <div className="mt-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Saldo Disponível na Carteira Melhor Envio: <strong>R$ {Number(connectionTest.balance).toFixed(2)}</strong></span>
                    </div>
                  )}
                  {connectionTest.message && <div className="mt-0.5 text-stone-600">{connectionTest.message}</div>}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition shadow-sm"
            >
              {isTestingConnection ? <Loader2 className="w-4 h-4 animate-spin text-stone-600" /> : <Zap className="w-4 h-4 text-amber-500" />}
              Testar Conexão
            </button>
            <button
              onClick={handleStartOAuth}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Conectar via OAuth2
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Section 1: API & Credentials */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-amber-600" />
            Credenciais & Conexão da API
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Ambiente da API
              </label>
              <select
                value={environmentInput}
                onChange={(e) => setEnvironmentInput(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="production">Produção Oficial (https://melhorenvio.com.br)</option>
                <option value="sandbox">Sandbox / Testes (https://sandbox.melhorenvio.com.br)</option>
              </select>
              <p className="text-xs text-stone-500 mt-1">
                Em produção, as etiquetas geradas são válidas nas agências das transportadoras.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Token de Acesso (Bearer Token)
              </label>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-stone-800 font-medium">
                    {settings.isTokenConfigured ? (settings.tokenMasked || '•••••••••••••••••••••••• (Ativo)') : 'Nenhum token configurado'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${settings.isTokenConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {settings.isTokenConfigured ? 'Configurado na Vercel' : 'Pendente na Vercel'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  Em conformidade com a segurança da Vercel Production, o token é injetado via variável de ambiente <code>MELHOR_ENVIO_TOKEN</code>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Melhor Envio Client ID (Opcional para OAuth2)
              </label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Ex: 1234"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Melhor Envio Client Secret (Opcional para OAuth2)
              </label>
              <input
                type="password"
                value={clientSecretInput}
                onChange={(e) => setClientSecretInput(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Sender & Fiscal Information */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Dados do Remetente (Obrigatórios para Geração de Etiquetas)
            </h2>
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              Exigido pela ANTT & Transportadoras
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Razão Social ou Nome Completo do Remetente *
              </label>
              <input
                type="text"
                required
                value={senderForm.name}
                onChange={(e) => setSenderForm({ ...senderForm, name: e.target.value })}
                placeholder="Ex: Marmot Confecções Ltda"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-stone-700">
                  CNPJ ou CPF do Remetente *
                </label>
                {senderForm.document && (
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    validateSenderDocument(senderForm.document).valid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {validateSenderDocument(senderForm.document).valid
                      ? validateSenderDocument(senderForm.document).type.toUpperCase() + ' VÁLIDO'
                      : 'DOCUMENTO INCOMPLETO'}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={senderForm.document}
                onChange={(e) => {
                  const val = e.target.value;
                  const digits = val.replace(/\D/g, '');
                  if (digits.length <= 14) {
                    setSenderForm({ ...senderForm, document: formatDocument(digits) });
                  }
                }}
                placeholder="Ex: 42.123.456/0001-90 ou CPF"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Inscrição Estadual (ou ISENTO)
              </label>
              <input
                type="text"
                value={senderForm.stateRegister || ''}
                onChange={(e) => setSenderForm({ ...senderForm, stateRegister: e.target.value })}
                placeholder="ISENTO"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Telefone de Contato (com DDD) *
              </label>
              <input
                type="text"
                required
                value={senderForm.phone}
                onChange={(e) => setSenderForm({ ...senderForm, phone: e.target.value })}
                placeholder="Ex: (11) 98842-1092"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                E-mail Comercial *
              </label>
              <input
                type="email"
                required
                value={senderForm.email}
                onChange={(e) => setSenderForm({ ...senderForm, email: e.target.value })}
                placeholder="contato@marmot.com.br"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100">
            <h3 className="text-sm font-medium text-stone-800 flex items-center gap-1.5 mb-3">
              <MapPin className="w-4 h-4 text-stone-500" />
              Endereço Físico de Coleta / Postagem
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  CEP de Origem *
                </label>
                <input
                  type="text"
                  required
                  value={originCepInput}
                  onChange={(e) => setOriginCepInput(e.target.value)}
                  placeholder="03806-010"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Logradouro (Rua, Av.) *
                </label>
                <input
                  type="text"
                  required
                  value={senderForm.street}
                  onChange={(e) => setSenderForm({ ...senderForm, street: e.target.value })}
                  placeholder="Ex: Avenida Celso Garcia"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  required
                  value={senderForm.number}
                  onChange={(e) => setSenderForm({ ...senderForm, number: e.target.value })}
                  placeholder="1200"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={senderForm.complement || ''}
                  onChange={(e) => setSenderForm({ ...senderForm, complement: e.target.value })}
                  placeholder="Galpão 03"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  required
                  value={senderForm.neighborhood}
                  onChange={(e) => setSenderForm({ ...senderForm, neighborhood: e.target.value })}
                  placeholder="Brás"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  required
                  value={senderForm.city}
                  onChange={(e) => setSenderForm({ ...senderForm, city: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  UF / Estado *
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={senderForm.state}
                  onChange={(e) => setSenderForm({ ...senderForm, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Todas as Configurações
          </button>
        </div>
      </form>

      {/* Section 3: Live Shipping Calculator Tester */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-amber-600" />
          Testador de Cotação de Frete em Tempo Real
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Realize uma simulação com as regras atuais do Melhor Envio para validar resposta das transportadoras.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={testCep}
              onChange={(e) => setTestCep(e.target.value)}
              placeholder="Digite o CEP de Destino (Ex: 01310-100)"
              className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleTestQuote}
            disabled={isTestingQuote}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-stone-900 hover:bg-black rounded-lg transition"
          >
            {isTestingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Simular Cotação
          </button>
        </div>

        {testSource && (
          <div className="mt-4 flex items-center justify-between text-xs bg-stone-50 p-3 rounded-lg border border-stone-200">
            <span className="text-stone-600">Origem dos Dados: <strong>{testSource}</strong></span>
            <span className="text-stone-500">CEP Origem: {originCepInput} → CEP Destino: {testCep}</span>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase bg-stone-50">
                  <th className="py-2.5 px-3">Transportadora</th>
                  <th className="py-2.5 px-3">Serviço</th>
                  <th className="py-2.5 px-3">Prazo Estimado</th>
                  <th className="py-2.5 px-3 text-right">Valor Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {testResults.map((quote, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/60">
                    <td className="py-3 px-3 font-medium text-stone-900 flex items-center gap-2">
                      {quote.picture ? (
                        <img src={quote.picture} alt={quote.company || quote.carrier} className="w-6 h-6 object-contain rounded" />
                      ) : (
                        <Truck className="w-4 h-4 text-stone-400" />
                      )}
                      {quote.company || quote.carrier}
                    </td>
                    <td className="py-3 px-3 text-stone-700">{quote.name}</td>
                    <td className="py-3 px-3 text-stone-600">{quote.deliveryDays || `${quote.deliveryTime} dias úteis`}</td>
                    <td className="py-3 px-3 text-right font-semibold text-stone-900">
                      R$ {Number(quote.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
