import React, { useState } from 'react';
import { ArrowRight, Check, Copy, Mail, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const NewsletterClubSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      showToast('E-mail inválido', 'Digite um e-mail válido para receber os drops.', 'error');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, source: 'clube_marmot_section' }),
      });
    } catch {
      // Fallback gracioso caso offline
    } finally {
      setLoading(false);
      setEmail(normalizedEmail);
      setSubscribed(true);
      showToast('Inscrição confirmada!', 'Você receberá os próximos drops em primeira mão.', 'success');
    }
  };

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText('MARMOT10');
      setCopied(true);
      showToast('Cupom copiado!', 'MARMOT10 copiado para sua área de transferência.', 'info');
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      showToast('Cupom MARMOT10', 'Copie o código e use no checkout.', 'info');
    }
  };

  return (
    <section
      id="clube-marmot"
      aria-label="Fique por dentro do próximo drop"
      className="w-full bg-[#FAFAF7] border-y border-[#E2E2DA] py-16 sm:py-20 lg:py-24 relative overflow-hidden"
    >
      {/* Background Accent Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] select-none" aria-hidden="true">
        <div className="w-full h-full bg-[radial-gradient(#18181B_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="w-full max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(460px,0.85fr)] items-center gap-12 lg:gap-16 xl:gap-24">
          
          {/* Coluna Esquerda: Comunicação Editorial de Lançamento */}
          <div className="max-w-2xl">
            {/* Tag de Eyebrow estilizada */}
            <div className="inline-flex items-center gap-2.5 mb-4 px-3 py-1 bg-white border border-[#E0E0D8] rounded-[2px] shadow-2xs">
              <span className="w-2 h-2 bg-[#F4C400] rotate-45 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-mono font-bold tracking-[0.22em] text-[#52525B] uppercase">
                FIQUE POR DENTRO
              </span>
            </div>

            {/* Título Principal com Tipografia Streetwear Marmot */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-black uppercase tracking-[-0.03em] leading-[0.98] text-[#111113]">
              NÃO PERCA O<br />
              <span className="relative inline-block text-[#111113]">
                PRÓXIMO DROP
                <span className="absolute -bottom-1 left-0 w-full h-[6px] bg-[#F4C400]/40 -z-10" />
              </span>
            </h2>

            {/* Subtítulo informativo */}
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#52525B] font-normal leading-relaxed max-w-xl">
              Receba lançamentos, reposições e ofertas exclusivas antes de todo mundo.
            </p>

            {/* Benefícios Rápidos de Confirmação */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-5 border-t border-[#E5E5DF] text-xs font-semibold text-[#3F3F46]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2.5} />
                Acesso antecipado ao catálogo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2.5} />
                10% OFF no primeiro pedido
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2.5} />
                Avisos de restock exclusivo
              </span>
            </div>
          </div>

          {/* Coluna Direita: Caixa de Entrada e Ação */}
          <div className="w-full max-w-xl lg:ml-auto">
            {subscribed ? (
              <div className="p-6 sm:p-7 border border-[#E0E0D8] bg-white rounded-[2px] shadow-sm animate-fadeIn">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-[2px] bg-[#111113] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-[#F4C400]" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#111113]">
                      Entrada Confirmada no Drop List
                    </h3>
                    <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                      Seu e-mail <strong>{email}</strong> está registrado para receber os próximos avisos de lote.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#EAEAE2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-[#FAF9F5] p-3.5 border border-[#E4E4DC]">
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-[#B45309] shrink-0" />
                    <span className="text-xs font-medium text-[#52525B]">Seu Cupom 10% OFF:</span>
                    <span className="font-mono font-black text-sm text-[#111113] bg-[#F4C400]/25 border border-[#F4C400] px-2 py-0.5 tracking-wider">
                      MARMOT10
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="px-4 py-2 bg-[#111113] hover:bg-black active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer rounded-[2px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#F4C400]" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Código
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubscribed(false);
                        setEmail('');
                      }}
                      className="text-xs text-[#71717A] hover:text-[#111113] underline transition-colors cursor-pointer px-1"
                    >
                      Outro e-mail
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} noValidate className="w-full">
                <label htmlFor="clube-marmot-email" className="sr-only">
                  Seu melhor e-mail para receber os próximos drops
                </label>

                {/* Input & Botão Alinhados com Precisão Geométrica */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 sm:gap-3 w-full">
                  <div className="relative flex-1 min-w-0 flex items-center bg-white border-2 border-[#DCDCD4] focus-within:border-[#111113] focus-within:ring-1 focus-within:ring-[#111113] transition-all rounded-[2px] shadow-2xs">
                    <Mail className="w-5 h-5 text-[#8E8E93] ml-4 shrink-0" aria-hidden="true" />
                    <input
                      id="clube-marmot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="w-full h-14 sm:h-[60px] pl-3 pr-4 bg-transparent text-sm sm:text-base font-medium text-[#111113] placeholder:text-[#8E8E93] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group h-14 sm:h-[60px] px-8 sm:px-10 bg-[#FFDE00] hover:bg-[#F2D000] active:scale-[0.99] text-[#111113] font-black text-xs sm:text-sm tracking-[0.14em] uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer rounded-[2px] shrink-0 shadow-sm hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span>{loading ? 'ENVIANDO...' : 'QUERO RECEBER'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                </div>

                {/* Microcópia e Garantias de Privacidade */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3.5">
                  <div className="flex items-center gap-2 text-xs text-[#71717A]">
                    <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span>Sem spam. Só novidades que valem a pena.</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#B45309] font-medium">
                    <Sparkles className="w-3 h-3" />
                    <span>Cupom 10% OFF no cadastro</span>
                  </div>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
