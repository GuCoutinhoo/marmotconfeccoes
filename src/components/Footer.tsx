import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Instagram,
  Lock,
  ShieldCheck,
  Truck,
  Youtube,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      showToast('E-mail inválido', 'Digite um e-mail válido para entrar no Clube Marmot.', 'error');
      return;
    }

    setEmail(normalizedEmail);
    setSubscribed(true);
    showToast('Bem-vindo à Marmot!', 'Use o cupom MARMOT10 para 10% OFF.', 'success');
  };

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText('MARMOT10');
      setCopied(true);
      showToast('Cupom copiado!', 'MARMOT10 já está na sua área de transferência.', 'info');
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      showToast('Seu cupom é MARMOT10', 'Copie o código e use no checkout.', 'info');
    }
  };

  return (
    <footer className="bg-[#FAFAF8] border-t border-[#DEDEDA] text-[#18181B] pt-5 sm:pt-7 pb-6">
      {/* Newsletter Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mb-10 sm:mb-12">
        <div className="border border-[#D8D8D2] bg-[#F3F1E8] relative overflow-hidden">
          <div className="min-h-10 px-5 sm:px-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[#D8D8D2] text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.18em]">
            <span className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-[#F4C400] rotate-45" aria-hidden="true" />
              Clube Marmot / acesso antecipado
            </span>
            <span className="text-[#70706B]">Pass 001 / Novos membros</span>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
            <div className="px-5 py-9 sm:px-8 sm:py-11 xl:px-12 xl:py-14 lg:border-r border-[#D8D8D2]">
              <p className="mb-4 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#6A6A66]">
                Entre na lista antes do próximo drop
              </p>

              <h3 className="max-w-[900px] font-anton text-[clamp(2.8rem,5vw,5.45rem)] leading-[0.89] uppercase tracking-[-0.035em] text-[#0B0B0D]">
                Receba drops exclusivos e{' '}
                <span className="inline-block bg-[#F4C400] px-[0.09em] text-[#0B0B0D]">
                  10% OFF
                </span>{' '}
                no primeiro pedido
              </h3>

              <p className="mt-6 max-w-[650px] text-sm sm:text-base leading-6 text-[#4E4E4A]">
                Novos lotes, reposições e peças de tiragem limitada chegam primeiro para quem faz parte do clube.
              </p>
            </div>

            <div className="relative bg-[#111113] px-5 py-8 sm:px-8 sm:py-10 xl:px-10 xl:py-12 text-white flex flex-col justify-between overflow-hidden">
              <span
                aria-hidden="true"
                className="absolute -right-4 -bottom-11 font-anton text-[9rem] sm:text-[11rem] leading-none tracking-[-0.08em] text-white/[0.035] select-none"
              >
                M/
              </span>

              <div className="relative z-10">
                <span className="inline-flex border border-[#F4C400]/70 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#F4C400]">
                  Convite aberto
                </span>
                <h4 className="mt-5 font-anton text-3xl sm:text-4xl uppercase leading-[0.95] tracking-[-0.02em]">
                  Entre antes do drop.
                </h4>
                <p className="mt-3 max-w-md text-sm leading-5 text-[#B7B7B2]">
                  Cadastre seu melhor e-mail. O cupom aparece na tela assim que sua entrada for confirmada.
                </p>
              </div>

              <div className="relative z-10 mt-8">
                {subscribed ? (
                  <div className="border border-[#F4C400] bg-[#1B1B1E] p-4 sm:p-5" role="status" aria-live="polite">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center bg-[#F4C400] text-black">
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-white">Entrada confirmada</p>
                        <p className="mt-1 text-xs leading-5 text-[#AFAFAA]">Seu acesso e o cupom já estão liberados.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="mt-4 flex w-full items-center justify-between border border-[#414146] bg-[#0B0B0D] px-4 py-3.5 text-left transition-colors hover:border-[#F4C400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]"
                      aria-label="Copiar cupom MARMOT10"
                    >
                      <span className="font-mono text-base font-black tracking-[0.16em] text-[#F4C400]">MARMOT10</span>
                      <span className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white">
                        {copied ? 'Copiado' : 'Copiar'}
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} noValidate>
                    <label htmlFor="footer-newsletter-email" className="sr-only">Seu melhor e-mail</label>
                    <div className="grid sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input
                        id="footer-newsletter-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu melhor e-mail"
                        autoComplete="email"
                        required
                        aria-describedby="footer-newsletter-note"
                        className="min-h-14 min-w-0 border border-[#4B4B50] bg-white px-4 text-sm font-medium text-[#18181B] outline-none placeholder:text-[#8B8B90] focus:border-[#F4C400] focus:ring-1 focus:ring-[#F4C400]"
                      />
                      <button
                        type="submit"
                        className="group min-h-14 bg-[#F4C400] px-5 sm:px-6 text-[11px] font-black uppercase tracking-[0.14em] text-[#111113] transition-colors hover:bg-[#FFD21A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] flex items-center justify-center gap-3"
                      >
                        Cadastrar
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </button>
                    </div>
                    <p id="footer-newsletter-note" className="mt-3 text-[10px] font-mono uppercase tracking-[0.14em] text-[#8C8C91]">
                      Sem spam. Cancele quando quiser.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border-t border-[#D8D8D2] bg-[#FAFAF7]">
            {[
              'Cupom imediato por e-mail',
              'Avisos de drop antecipados',
              'Acesso a reposições limitadas',
            ].map((benefit, index) => (
              <div
                key={benefit}
                className={`flex items-center gap-3 px-5 sm:px-6 py-4 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.11em] text-[#353532] ${
                  index > 0 ? 'border-t sm:border-t-0 sm:border-l border-[#D8D8D2]' : ''
                }`}
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-[#B77900]" strokeWidth={2.5} aria-hidden="true" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Navigation Columns */}
      <div className="w-full px-7 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#E4E4E7]">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onNavigate('home')}>
            <span className="text-base sm:text-lg font-black tracking-[0.14em] uppercase text-[#18181B]">
              MARMOT <span className="text-zinc-400">CONFECÇÕES</span>
            </span>
          </div>

          <p className="text-xs text-[#52525B] leading-relaxed max-w-sm">
            Ateliê autoral de confecção de moda streetwear. Peças heavyweight produzidas em São Paulo com foco em caimento encorpado, gramaturas nobres e durabilidade extrema.
          </p>

          <div className="flex items-center gap-2.5 text-[#71717A] pt-1">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="p-2 bg-[#F4F4F5] border border-[#DCDCE0] rounded-[2px] text-[#52525B] hover:text-[#18181B] hover:border-[#18181B] transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="p-2 bg-[#F4F4F5] border border-[#DCDCE0] rounded-[2px] text-[#52525B] hover:text-[#18181B] hover:border-[#18181B] transition-colors"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories Navigation */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#18181B] mb-3">Catálogo</h4>
          <ul className="space-y-2 text-xs text-[#52525B] font-medium">
            <li><button onClick={() => onNavigate('shop', 'oversized')} className="hover:text-[#18181B] transition-colors">Camisetas Oversized</button></li>
            <li><button onClick={() => onNavigate('shop', 'moletons')} className="hover:text-[#18181B] transition-colors">Hoodies & Moletons</button></li>
            <li><button onClick={() => onNavigate('shop', 'cargos')} className="hover:text-[#18181B] transition-colors">Calças Cargo & Táticas</button></li>
            <li><button onClick={() => onNavigate('shop', 'jaquetas')} className="hover:text-[#18181B] transition-colors">Jaquetas & Puffers</button></li>
            <li><button onClick={() => onNavigate('shop', 'tenis')} className="hover:text-[#18181B] transition-colors">Sneakers & Calçados</button></li>
            <li><button onClick={() => onNavigate('shop', 'bones')} className="hover:text-[#18181B] transition-colors">Headwear & Acessórios</button></li>
          </ul>
        </div>

        {/* Customer Help Navigation */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#18181B] mb-3">Atendimento</h4>
          <ul className="space-y-2 text-xs text-[#52525B] font-medium">
            <li><button onClick={() => onNavigate('tracking')} className="hover:text-[#18181B] transition-colors font-bold text-[#18181B]">Rastrear Pedido</button></li>
            <li><button onClick={() => onNavigate('institutional', 'faq')} className="hover:text-[#18181B] transition-colors">Dúvidas Frequentes (FAQ)</button></li>
            <li><button onClick={() => onNavigate('institutional', 'trocas')} className="hover:text-[#18181B] transition-colors">Trocas & Devoluções (30 Dias)</button></li>
            <li><button onClick={() => onNavigate('institutional', 'contato')} className="hover:text-[#18181B] transition-colors">Fale com o Ateliê</button></li>
            <li><button onClick={() => onNavigate('account')} className="hover:text-[#18181B] transition-colors">Minha Conta</button></li>
          </ul>
        </div>

        {/* Institutional & Legal */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#18181B] mb-3">Institucional</h4>
          <ul className="space-y-2 text-xs text-[#52525B] font-medium">
            <li><button onClick={() => onNavigate('institutional', 'sobre')} className="hover:text-[#18181B] transition-colors">Manifesto Marmot</button></li>
            <li><button onClick={() => onNavigate('institutional', 'termos')} className="hover:text-[#18181B] transition-colors">Termos de Compra</button></li>
            <li><button onClick={() => onNavigate('institutional', 'privacidade')} className="hover:text-[#18181B] transition-colors">Política de Privacidade</button></li>
            <li><button onClick={() => onNavigate('admin')} className="hover:text-[#18181B] transition-colors text-[#71717A] font-mono text-[11px]">Painel Administrativo</button></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar Payment Seals & Copyright */}
      <div className="w-full px-7 sm:px-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-[#71717A]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#52525B] font-medium">
            <Lock className="w-3.5 h-3.5 text-[#B45309]" /> Checkout Seguro <strong className="text-[#18181B]">InfinitePay</strong>
          </span>
          <span className="flex items-center gap-1.5 text-[#52525B] font-medium">
            <Truck className="w-3.5 h-3.5 text-[#B45309]" /> Envios via <strong className="text-[#18181B]">Melhor Envio / Correios</strong>
          </span>
          <span className="flex items-center gap-1.5 text-[#52525B] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B45309]" /> SSL 256-Bit Criptografado
          </span>
        </div>

        <p className="text-[11px] text-[#71717A] text-center md:text-right">
          © {new Date().getFullYear()} MARMOT CONFECÇÕES LTDA. São Paulo - SP. CNPJ: 54.321.876/0001-90.
        </p>
      </div>
    </footer>
  );
};