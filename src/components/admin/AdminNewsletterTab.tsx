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
      <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
            <Mail className="w-3.5 h-3.5" /> MARKETING & NOTIFICAÇÕES DE DROP
          </div>
          <h2 className="text-xl font-black uppercase text-[#171717] mt-1">
            Newsletter & Disparos de Drop Exclusivos
          </h2>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Gerencie inscritos da newsletter, envie comunicados de novos lançamentos e acompanhe o histórico.
          </p>
        </div>

        <button
          onClick={fetchNewsletterData}
          className="bg-[#F9F9F7] hover:bg-white text-[#171717] text-xs font-bold uppercase px-4 py-2.5 rounded-xl border border-[#E5E5E1] transition-all flex items-center gap-2 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#B45309]' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Total de Inscritos</span>
            <Users className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{subscribers.length}</p>
          <p className="text-[11px] text-[#6B6B66]">Contas cadastradas no portal</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Ativos para Receber</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{activeSubscribers.length}</p>
          <p className="text-[11px] text-[#6B6B66]">Prontos para disparos de novos drops</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Campanhas Enviadas</span>
            <Megaphone className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{campaigns.length}</p>
          <p className="text-[11px] text-[#6B6B66]">Disparos transacionais efetuados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Drop Composer Column */}
        <div className="lg:col-span-6 bg-white border border-[#E5E5E1] p-6 rounded-2xl space-y-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase border-b border-[#E5E5E1] pb-3">
            <Sparkles className="w-4 h-4 text-[#B45309]" /> DISPARAR NOTIFICAÇÃO DE NOVO DROP
          </div>

          <form onSubmit={handleSendDrop} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#6B6B66]">
                Título do Drop (Destaque Principal) *
              </label>
              <input
                type="text"
                value={dropTitle}
                onChange={(e) => setDropTitle(e.target.value)}
                placeholder="Ex: NOVO DROP // VOL. 04 CYBER DYSTOPIA"
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-4 py-2.5 text-xs text-[#171717] focus:border-[#B45309] outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#6B6B66]">
                Assunto do E-mail (Subject Line) *
              </label>
              <input
                type="text"
                value={dropSubject}
                onChange={(e) => setDropSubject(e.target.value)}
                placeholder="Ex: 🚨 DROP CONFIRMADO: Vol. 04 Cyber Dystopia disponível agora"
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-4 py-2.5 text-xs text-[#171717] focus:border-[#B45309] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#6B6B66]">
                  Coleção
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="Ex: Vol. 04: Cyber Dystopia"
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-4 py-2.5 text-xs text-[#171717] focus:border-[#B45309] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#6B6B66]">
                  Cupom Exclusivo de Lançamento
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-3.5 top-3 text-[#6B6B66]" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="FIRSTAURA"
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono uppercase text-[#171717] focus:border-[#B45309] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#6B6B66]">
                Mensagem Personalizada aos Colecionadores
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escreva detalhes sobre o corte, tecido e tiragem..."
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl p-3.5 text-xs text-[#171717] focus:border-[#B45309] outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="text-[#6B6B66]">
                Destinatários: <strong className="text-emerald-700">{activeSubscribers.length} inscritos</strong>
              </div>
              <button
                type="submit"
                disabled={isSending || activeSubscribers.length === 0}
                className="bg-[#F0C84B] hover:bg-amber-400 text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
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
        <div className="lg:col-span-6 bg-white border border-[#E5E5E1] p-6 rounded-2xl space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#E5E5E1] pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
                <Users className="w-4 h-4 text-[#B45309]" /> LISTA DE INSCRITOS ({subscribers.length})
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6B6B66]" />
                <input
                  type="text"
                  placeholder="Buscar e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#171717] focus:border-[#B45309] outline-none w-48"
                />
              </div>
            </div>

            <div className="divide-y divide-[#E5E5E1] max-h-[380px] overflow-y-auto mt-2">
              {filteredSubscribers.length === 0 ? (
                <div className="py-12 text-center text-[#6B6B66] space-y-2">
                  <Mail className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">Nenhum inscrito encontrado.</p>
                </div>
              ) : (
                filteredSubscribers.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-[#171717] truncate">{sub.email}</p>
                      <p className="text-[10px] text-[#6B6B66] flex items-center gap-2 mt-0.5">
                        <span>Origem: {sub.source || 'Website'}</span>
                        <span>•</span>
                        <span>{new Date(sub.subscribedAt || sub.createdAt).toLocaleDateString('pt-BR')}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        sub.status === 'subscribed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
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
            <div className="pt-4 border-t border-[#E5E5E1]">
              <p className="text-[11px] font-mono uppercase font-bold text-[#6B6B66] mb-2">
                Últimos Disparos Efetuados:
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {campaigns.slice(0, 3).map((c) => (
                  <div key={c.id} className="bg-[#F9F9F7] border border-[#E5E5E1] p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#171717] text-[11px]">{c.title}</p>
                      <p className="text-[10px] text-[#6B6B66]">{new Date(c.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
