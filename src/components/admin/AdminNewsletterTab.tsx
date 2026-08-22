import React, { useState, useEffect } from 'react';
import { Mail, Send, Users, Sparkles, CheckCircle2, Clock, Search, RefreshCw, AlertCircle, Tag, Megaphone } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useStore } from '../../context/StoreContext';

interface Subscriber {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  source?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  collectionName?: string;
  discountCode?: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
}

export const AdminNewsletterTab: React.FC = () => {
  const { showToast } = useToast();
  const { products } = useStore();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Drop Campaign Composer State
  const [dropTitle, setDropTitle] = useState('');
  const [dropSubject, setDropSubject] = useState('');
  const [collectionName, setCollectionName] = useState('Vol. 04: Cyber Dystopia');
  const [discountCode, setDiscountCode] = useState('FIRSTAURA');
  const [customMessage, setCustomMessage] = useState(
    'Novas peças exclusivas com modelagem boxy fit e algodão 260g acabam de aterrissar em nossa loja com estoque estritamente limitado.'
  );
  const [isSending, setIsSending] = useState(false);

  const fetchNewsletterData = async () => {
    setIsLoading(true);
    try {
      const [subRes, campRes] = await Promise.all([
        fetch('/api/admin/newsletter/subscribers'),
        fetch('/api/admin/newsletter/campaigns'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscribers(Array.isArray(subData) ? subData : []);
      }
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(Array.isArray(campData) ? campData : []);
      }
    } catch {
      showToast('Erro ao carregar dados da newsletter.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletterData();
  }, []);

  const activeSubscribers = subscribers.filter((s) => s.status === 'subscribed');

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.source && s.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropTitle.trim() || !dropSubject.trim()) {
      showToast('Preencha o título e o assunto do Drop.', 'error');
      return;
    }

    if (activeSubscribers.length === 0) {
      showToast('Não há inscritos ativos na newsletter para disparar.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/newsletter/notify-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dropTitle,
          subject: dropSubject,
          collectionName,
          discountCode,
          customMessage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Disparo de Drop enviado com sucesso!', 'success');
        setDropTitle('');
        setDropSubject('');
        await fetchNewsletterData();
      } else {
        showToast(data.error || 'Erro ao disparar aviso de drop.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao disparar e-mails.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="bg-[#141414] border border-[#222222] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D6B35A] uppercase">
            <Mail className="w-3.5 h-3.5" /> MARKETING & NOTIFICAÇÕES DE DROP
          </div>
          <h2 className="text-xl font-black uppercase text-[#EFECE6] mt-1">
            Newsletter & Disparos de Drop Exclusivos
          </h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Gerencie inscritos da newsletter, envie comunicados de novos lançamentos e acompanhe o histórico.
          </p>
        </div>

        <button
          onClick={fetchNewsletterData}
          className="bg-[#080808] hover:bg-[#222] text-[#EFECE6] text-xs font-bold uppercase px-4 py-2.5 rounded-xl border border-[#262626] transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-xs font-mono font-bold uppercase">Total de Inscritos</span>
            <Users className="w-4 h-4 text-[#D6B35A]" />
          </div>
          <p className="text-2xl font-black text-[#EFECE6]">{subscribers.length}</p>
          <p className="text-[11px] text-[#666666]">Contas cadastradas no portal</p>
        </div>

        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-xs font-mono font-bold uppercase">Ativos para Receber</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{activeSubscribers.length}</p>
          <p className="text-[11px] text-[#666666]">Prontos para disparos de novos drops</p>
        </div>

        <div className="bg-[#141414] border border-[#222222] p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-xs font-mono font-bold uppercase">Campanhas Enviadas</span>
            <Megaphone className="w-4 h-4 text-[#D6B35A]" />
          </div>
          <p className="text-2xl font-black text-[#EFECE6]">{campaigns.length}</p>
          <p className="text-[11px] text-[#666666]">Disparos transacionais efetuados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Drop Composer Column */}
        <div className="lg:col-span-6 bg-[#141414] border border-[#222222] p-6 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D6B35A] uppercase border-b border-[#222222] pb-3">
            <Sparkles className="w-4 h-4 text-[#D6B35A]" /> DISPARAR NOTIFICAÇÃO DE NOVO DROP
          </div>

          <form onSubmit={handleSendDrop} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#A0A0A0]">
                Título do Drop (Destaque Principal) *
              </label>
              <input
                type="text"
                value={dropTitle}
                onChange={(e) => setDropTitle(e.target.value)}
                placeholder="Ex: NOVO DROP // VOL. 04 CYBER DYSTOPIA"
                className="w-full bg-[#080808] border border-[#262626] rounded-xl px-4 py-2.5 text-xs text-[#EFECE6] focus:border-[#D6B35A] outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#A0A0A0]">
                Assunto do E-mail (Subject Line) *
              </label>
              <input
                type="text"
                value={dropSubject}
                onChange={(e) => setDropSubject(e.target.value)}
                placeholder="Ex: 🚨 DROP CONFIRMADO: Vol. 04 Cyber Dystopia disponível agora"
                className="w-full bg-[#080808] border border-[#262626] rounded-xl px-4 py-2.5 text-xs text-[#EFECE6] focus:border-[#D6B35A] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#A0A0A0]">
                  Coleção
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="Ex: Vol. 04: Cyber Dystopia"
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-4 py-2.5 text-xs text-[#EFECE6] focus:border-[#D6B35A] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#A0A0A0]">
                  Cupom Exclusivo de Lançamento
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-3.5 top-3 text-[#666]" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="FIRSTAURA"
                    className="w-full bg-[#080808] border border-[#262626] rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono uppercase text-[#EFECE6] focus:border-[#D6B35A] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#A0A0A0]">
                Mensagem Personalizada aos Colecionadores
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escreva detalhes sobre o corte, tecido e tiragem..."
                className="w-full bg-[#080808] border border-[#262626] rounded-xl p-3.5 text-xs text-[#EFECE6] focus:border-[#D6B35A] outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="bg-[#080808] border border-[#222222] p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="text-[#888888]">
                Destinatários: <strong className="text-emerald-400">{activeSubscribers.length} inscritos</strong>
              </div>
              <button
                type="submit"
                disabled={isSending || activeSubscribers.length === 0}
                className="bg-[#D6B35A] hover:bg-[#EFECE6] text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> DISPARANDO...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> DISPARAR DROP AGORA
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Subscribers List Column */}
        <div className="lg:col-span-6 bg-[#141414] border border-[#222222] p-6 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D6B35A] uppercase">
                <Users className="w-4 h-4 text-[#D6B35A]" /> LISTA DE INSCRITOS ({subscribers.length})
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#666]" />
                <input
                  type="text"
                  placeholder="Buscar e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#080808] border border-[#262626] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#EFECE6] focus:border-[#D6B35A] outline-none w-48"
                />
              </div>
            </div>

            <div className="divide-y divide-[#222222] max-h-[380px] overflow-y-auto mt-2">
              {filteredSubscribers.length === 0 ? (
                <div className="py-12 text-center text-[#666666] space-y-2">
                  <Mail className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">Nenhum inscrito encontrado.</p>
                </div>
              ) : (
                filteredSubscribers.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-[#EFECE6] truncate">{sub.email}</p>
                      <p className="text-[10px] text-[#666666] flex items-center gap-2 mt-0.5">
                        <span>Origem: {sub.source || 'Website'}</span>
                        <span>•</span>
                        <span>{new Date(sub.subscribedAt || sub.createdAt).toLocaleDateString('pt-BR')}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        sub.status === 'subscribed'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {sub.status === 'subscribed' ? 'Ativo' : 'Cancelado'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Past Campaigns */}
          {campaigns.length > 0 && (
            <div className="pt-4 border-t border-[#222222]">
              <p className="text-[11px] font-mono uppercase font-bold text-[#888888] mb-2">
                Últimos Disparos Efetuados:
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {campaigns.slice(0, 3).map((c) => (
                  <div key={c.id} className="bg-[#080808] border border-[#222222] p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#EFECE6] text-[11px]">{c.title}</p>
                      <p className="text-[10px] text-[#666666]">{new Date(c.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
                      {c.sentCount} entregues
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
