import React, { useState } from 'react';
import { Mail, Check, ShieldCheck, Lock, ArrowRight, Instagram, Youtube, Truck, RotateCcw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      showToast('Bem-vindo à Marmot!', 'Use o cupom MARMOT10 para 10% OFF.', 'success');
    }
  };

  return (
    <footer className="bg-white border-t border-[#E4E4E7] text-[#18181B] pt-14 pb-8">
      {/* Newsletter Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 mb-14">
        <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-8 md:p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#B45309] mb-2 block">
              CLUBE MARMOT // ATELIER DROPS
            </span>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 text-[#18181B]">
              RECEBA DROPS EXCLUSIVOS E 10% OFF NO PRIMEIRO PEDIDO
            </h3>
            <p className="text-xs text-[#52525B] leading-relaxed font-medium">
              Assine nossa lista para ter acesso prioritário a reposições de estoque, lotes autorais e cupons exclusivos.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto min-w-[320px]">
            {subscribed ? (
              <div className="bg-[#FEF3C7] border border-[#FDE68A] p-4 rounded-xl flex items-center gap-3 text-xs text-[#92400E] font-bold">
                <Check className="w-5 h-5 shrink-0" />
                <span>Inscrição confirmada! Use o cupom <strong className="font-mono text-black">MARMOT10</strong> no checkout.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail..."
                  required
                  className="bg-white border border-[#E4E4E7] text-xs px-4 py-3.5 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B] placeholder-[#71717A] flex-1"
                />
                <button
                  type="submit"
                  className="bg-[#18181B] text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shrink-0 shadow-md"
                >
                  Cadastrar <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Navigation Columns */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-[#E4E4E7]">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onNavigate('home')}>
            <span className="text-lg font-black tracking-[0.14em] uppercase text-[#18181B]">
              MARMOT <span className="text-zinc-400">CONFECÇÕES</span>
            </span>
          </div>

          <p className="text-xs text-[#52525B] leading-relaxed max-w-sm">
            Ateliê autoral de confecção de moda streetwear. Peças heavyweight produzidas em São Paulo com foco em caimento encorpado, gramaturas nobres e durabilidade extrema.
          </p>

          <div className="flex items-center gap-3 text-[#71717A] pt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="p-2.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl text-[#52525B] hover:text-[#18181B] hover:border-[#18181B] transition-all"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="p-2.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl text-[#52525B] hover:text-[#18181B] hover:border-[#18181B] transition-all"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories Navigation */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#18181B] mb-4">Catálogo</h4>
          <ul className="space-y-2.5 text-xs text-[#52525B] font-medium">
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
          <h4 className="text-xs font-black uppercase tracking-wider text-[#18181B] mb-4">Atendimento</h4>
          <ul className="space-y-2.5 text-xs text-[#52525B] font-medium">
            <li><button onClick={() => onNavigate('tracking')} className="hover:text-[#18181B] transition-colors text-[#B45309] font-bold">Rastrear Pedido</button></li>
            <li><button onClick={() => onNavigate('institutional', 'faq')} className="hover:text-[#18181B] transition-colors">Dúvidas Frequentes (FAQ)</button></li>
            <li><button onClick={() => onNavigate('institutional', 'trocas')} className="hover:text-[#18181B] transition-colors">Trocas & Devoluções (30 Dias)</button></li>
            <li><button onClick={() => onNavigate('institutional', 'contato')} className="hover:text-[#18181B] transition-colors">Fale com o Ateliê</button></li>
            <li><button onClick={() => onNavigate('account')} className="hover:text-[#18181B] transition-colors">Minha Conta</button></li>
          </ul>
        </div>

        {/* Institutional & Legal */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#18181B] mb-4">Institucional</h4>
          <ul className="space-y-2.5 text-xs text-[#52525B] font-medium">
            <li><button onClick={() => onNavigate('institutional', 'sobre')} className="hover:text-[#18181B] transition-colors">Manifesto Marmot</button></li>
            <li><button onClick={() => onNavigate('institutional', 'termos')} className="hover:text-[#18181B] transition-colors">Termos de Compra</button></li>
            <li><button onClick={() => onNavigate('institutional', 'privacidade')} className="hover:text-[#18181B] transition-colors">Política de Privacidade</button></li>
            <li><button onClick={() => onNavigate('admin')} className="hover:text-[#18181B] transition-colors text-[#71717A] font-mono text-[11px]">Painel Administrativo</button></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar Payment Seals & Copyright */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#71717A]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#52525B] font-medium">
            <Lock className="w-3.5 h-3.5 text-[#B45309]" /> Checkout Seguro <strong className="text-[#18181B]">Mercado Pago</strong>
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
