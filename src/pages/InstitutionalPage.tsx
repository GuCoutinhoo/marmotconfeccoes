import React, { useState } from 'react';
import { Breadcrumb } from '../components/Breadcrumb';
import { useToast } from '../context/ToastContext';
import {
  HelpCircle,
  RefreshCw,
  Info,
  Mail,
  Phone,
  Send,
  MessageSquare,
  ChevronDown,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface InstitutionalPageProps {
  section?: string;
  onNavigate: (page: string, param?: string) => void;
}

export const InstitutionalPage: React.FC<InstitutionalPageProps> = ({
  section = 'sobre',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<string>(section || 'sobre');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const { showToast } = useToast();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMessage) {
      showToast('Mensagem Enviada!', 'Nossa equipe responderá em até 24h úteis.', 'success');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }
  };

  const faqs = [
    {
      q: 'Qual o prazo de entrega para o meu CEP?',
      a: 'Entregamos em todo o Brasil via Correios (SEDEX / PAC) e transportadoras parceiras pelo Melhor Envio. O prazo varia de 2 a 5 dias úteis para capitais e de 5 a 8 dias úteis para demais regiões. Todas as encomendas possuem código de rastreamento enviado por e-mail.',
    },
    {
      q: 'Como funciona a política de trocas e devoluções?',
      a: 'Sua primeira troca é 100% gratuita no prazo de 30 dias corridos após o recebimento. A peça precisa estar com a etiqueta original fixada e sem sinais de uso ou lavagem.',
    },
    {
      q: 'Qual a gramatura do tecido das camisetas e moletons?',
      a: 'Nossas T-Shirts Oversized são confeccionadas em Algodão Heavyweight de 260g a 400g/m² com gola canelada de 3cm. Nossos Hoodies e Moletons utilizam French Terry encorpado de 400g/m² com capuz estruturado.',
    },
    {
      q: 'Quais as formas de pagamento aceitas?',
      a: 'Aceitamos PIX (com 5% de desconto automático e aprovação imediata), Cartão de Crédito em até 10x sem juros (processado com total segurança via Mercado Pago) e Boleto Bancário.',
    },
    {
      q: 'Como escolher o meu tamanho correto?',
      a: 'Nossa modelagem é Boxy Fit (ombros caídos, tórax amplo e comprimento alinhado). Recomendamos pegar o seu tamanho habitual para um caimento streetwear encorpado ou consultar nossa tabela de medidas na página de cada produto.',
    },
  ];

  return (
    <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumb items={[{ label: 'Institucional' }, { label: activeTab.toUpperCase() }]} />

        {/* Section Navigation Header */}
        <div className="flex border-b border-[#222222] gap-6 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'sobre', label: 'Sobre a Marmot' },
            { id: 'trocas', label: 'Trocas e Devoluções' },
            { id: 'faq', label: 'Dúvidas Frequentes (FAQ)' },
            { id: 'contato', label: 'Fale Conosco / Ateliê' },
            { id: 'termos', label: 'Termos & Privacidade' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-[#D6B35A] text-[#D6B35A]'
                  : 'border-transparent text-[#777777] hover:text-[#EFECE6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section 1: Sobre */}
        {activeTab === 'sobre' && (
          <div className="bg-[#121212] border border-[#222222] p-8 md:p-12 rounded-2xl space-y-8 animate-fadeIn">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-mono font-bold text-[#D6B35A] uppercase tracking-widest block">
                MANIFESTO MARMOT CONFECÇÕES
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#EFECE6] leading-tight">
                STREETWEAR AUTORAL PRODUZIDO COM IDENTIDADE, PESO E PRESENÇA
              </h1>
              <p className="text-xs sm:text-sm text-[#888888] leading-relaxed font-medium">
                Fundada em São Paulo, a MARMOT CONFECÇÕES nasceu com o propósito de resgatar o valor da confecção autoral e duradoura. Desenvolvemos peças estruturadas com malhas nobres de alta gramatura (260g a 400g/m²), modelagens autorais boxy e acabamento premium para durar anos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#222222]">
              <div className="p-6 bg-[#0A0A0A] border border-[#222222] rounded-xl space-y-2">
                <span className="text-[#D6B35A] text-xl font-black font-mono block">01</span>
                <h3 className="text-sm font-bold uppercase text-[#EFECE6]">Modelagens Autorais</h3>
                <p className="text-xs text-[#888888]">
                  Boxy fit, golas caneladas grossas de 3cm e proporções desenhadas para presença imponente.
                </p>
              </div>

              <div className="p-6 bg-[#0A0A0A] border border-[#222222] rounded-xl space-y-2">
                <span className="text-[#D6B35A] text-xl font-black font-mono block">02</span>
                <h3 className="text-sm font-bold uppercase text-[#EFECE6]">Heavyweight Standard</h3>
                <p className="text-xs text-[#888888]">
                  Algodão puro de alta densidade que não encolhe, não deforma e mantém o caimento firme.
                </p>
              </div>

              <div className="p-6 bg-[#0A0A0A] border border-[#222222] rounded-xl space-y-2">
                <span className="text-[#D6B35A] text-xl font-black font-mono block">03</span>
                <h3 className="text-sm font-bold uppercase text-[#EFECE6]">Confecção em SP</h3>
                <p className="text-xs text-[#888888]">
                  Produção ética e local em ateliê paulista com controle rigoroso de costura e acabamentos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Trocas */}
        {activeTab === 'trocas' && (
          <div className="bg-[#121212] border border-[#222222] p-8 md:p-12 rounded-2xl space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-black uppercase text-[#EFECE6]">POLÍTICA DE TROCAS E DEVOLUÇÕES (30 DIAS)</h1>
            <p className="text-xs text-[#888888] leading-relaxed max-w-3xl">
              Garantimos sua satisfação completa. Se o tamanho ou o caimento não ficarem perfeitos, sua primeira troca é 100% gratuita no prazo de até 30 dias corridos após o recebimento.
            </p>

            <div className="space-y-4 pt-4 border-t border-[#222222] text-xs text-[#888888]">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-[#D6B35A] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#EFECE6] uppercase block">1. Solicitação Direta</strong>
                  <p className="text-[#888888]">Envie uma mensagem pelo SAC ou e-mail com o número do seu pedido e o novo tamanho desejado.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-[#D6B35A] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#EFECE6] uppercase block">2. Código de Postagem Gratuita</strong>
                  <p className="text-[#888888]">Você receberá um código de logística reversa para postar o pacote em qualquer agência dos Correios sem nenhum custo.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-[#D6B35A] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#EFECE6] uppercase block">3. Reenvio Rápido</strong>
                  <p className="text-[#888888]">Assim que o pacote é conferido no nosso ateliê, o novo item é enviado imediatamente com novo código de rastreio.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: FAQ */}
        {activeTab === 'faq' && (
          <div className="bg-[#121212] border border-[#222222] p-8 md:p-12 rounded-2xl space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-black uppercase text-[#EFECE6]">DÚVIDAS FREQUENTES (FAQ)</h1>

            <div className="space-y-3">
              {faqs.map((f, idx) => (
                <div
                  key={idx}
                  onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                  className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5 cursor-pointer transition-colors hover:border-[#D6B35A]/50"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase text-[#EFECE6]">{f.q}</h3>
                    <ChevronDown
                      className={`w-4 h-4 text-[#D6B35A] transition-transform ${
                        openFaqIdx === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {openFaqIdx === idx && (
                    <p className="text-xs text-[#888888] leading-relaxed mt-3 pt-3 border-t border-[#222222]">
                      {f.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Contato */}
        {activeTab === 'contato' && (
          <div className="bg-[#121212] border border-[#222222] p-8 md:p-12 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
            <div className="space-y-6">
              <h1 className="text-2xl font-black uppercase text-[#EFECE6]">ATENDIMENTO & ATELIÊ</h1>
              <p className="text-xs text-[#888888] leading-relaxed">
                Nossa equipe de atendimento atende de segunda a sexta, das 09h às 18h.
              </p>

              <div className="space-y-4 text-xs font-mono">
                <div className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-[#222222] rounded-xl">
                  <Mail className="w-5 h-5 text-[#D6B35A]" />
                  <div>
                    <span className="text-[10px] text-[#777777] uppercase block">E-mail de Atendimento</span>
                    <span className="text-[#EFECE6] font-bold">contato@marmot.com.br</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-[#222222] rounded-xl">
                  <MessageSquare className="w-5 h-5 text-[#D6B35A]" />
                  <div>
                    <span className="text-[10px] text-[#777777] uppercase block">WhatsApp Ateliê</span>
                    <span className="text-[#EFECE6] font-bold">+55 (11) 98989-1020</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleContactSubmit} className="space-y-4 bg-[#0A0A0A] p-6 rounded-xl border border-[#222222]">
              <h3 className="text-xs font-bold uppercase text-[#EFECE6]">Mensagem Direta</h3>

              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">Seu Nome</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full bg-[#141414] border border-[#262626] px-3.5 py-2.5 rounded-lg text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">Seu E-mail</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full bg-[#141414] border border-[#262626] px-3.5 py-2.5 rounded-lg text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">Mensagem</label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  className="w-full bg-[#141414] border border-[#262626] px-3.5 py-2.5 rounded-lg text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#D6B35A] text-black font-bold text-xs uppercase py-3 rounded-xl hover:bg-[#EFECE6] transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4" /> Enviar Mensagem
              </button>
            </form>
          </div>
        )}

        {/* Section 5: Termos */}
        {activeTab === 'termos' && (
          <div className="bg-[#121212] border border-[#222222] p-8 md:p-12 rounded-2xl space-y-4 animate-fadeIn text-xs text-[#888888] leading-relaxed">
            <h1 className="text-2xl font-black uppercase text-[#EFECE6] mb-4">TERMOS DE USO E POLÍTICA DE PRIVACIDADE</h1>
            <p>
              A MARMOT CONFECÇÕES respeita rigorosamente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Todos os pagamentos são processados em ambiente criptografado de 256 bits com certificação SSL via Mercado Pago.
            </p>
            <p>
              Garantimos sigilo absoluto de seus dados cadastrais, utilizando-os exclusivamente para processamento, faturamento e entrega de seus pedidos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
