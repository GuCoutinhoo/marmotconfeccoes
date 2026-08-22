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
    <footer className="bg-[#0D0D0E] border-t border-[#27272A] text-[#F4F4F5] pt-14 pb-8">
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="bg-[#141416] border border-[#27272A] p-8 md:p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C5A869] mb-2 block">
              CLUBE MARMOT // ATELIER DROPS
            </span>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 text-[#F4F4F5]">
              RECEBA DROPS EXCLUSIVOS E 10% OFF NO PRIMEIRO PEDIDO
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed font-medium">
              Assine nossa lista para ter acesso prioritário a reposições de estoque, lotes autorais e cupons exclusivos.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto min-w-[320px]">
            {subscribed ? (
              <div className="bg-[#C5A869]/15 border border-[#C5A869]/40 p-4 rounded-xl flex items-center gap-3 text-xs text-[#C5A869] font-bold">
                <Check className="w-5 h-5 shrink-0" />
                <span>Inscrição confirmada! Use o cupom <strong className="font-mono text-white">MARMOT10</strong> no checkout.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail..."
                  required
                  className="bg-[#18181B] border border-[#27272A] text-xs px-4 py-3.5 rounded-xl text-[#F4F4F5] focus:outline-none focus:border-[#C5A869] placeholder-[#71717A] flex-1"
                />
                <button
                  type="submit"
                  className="bg-[#F4F4F5] text-[#0D0D0E] font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 shrink-0 shadow-md"
                >
                  Cadastrar <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Navigation Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-[#27272A]">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-8 h-8 bg-[#e8b600] text-[#0D0D0E] font-black text-lg flex items-center justify-center rounded-lg shadow-sm">
              M
            </div>
            <span className="text-lg font-black tracking-widest uppercase text-[#F4F4F5]">
              MARMOT <span className="text-[#C5A869]">CONFECÇÕES</span>
            </span>
          </div>

          <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-sm">
            Ateliê autoral de confecção de moda streetwear. Peças heavyweight produzidas em São Paulo com foco em caimento encorpado, gramaturas nobres e durabilidade extrema.
          </p>

          <div className="flex items-center gap-3 text-[#A1A1AA] pt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="p-2.5 bg-[#141416] border border-[#27272A] rounded-xl text-[#A1A1AA] hover:text-[#C5A869] hover:border-[#C5A869]/60 transition-all"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="p-2.5 bg-[#141416] border border-[#27272A] rounded-xl text-[#A1A1AA] hover:text-[#C5A869] hover:border-[#C5A869]/60 transition-all"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories Navigation */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#F4F4F5] mb-4">Catálogo</h4>
          <ul className="space-y-2.5 text-xs text-[#A1A1AA] font-medium">
            <li><button onClick={() => onNavigate('shop', 'oversized')} className="hover:text-[#F4F4F5] transition-colors">Camisetas Oversized</button></li>
            <li><button onClick={() => onNavigate('shop', 'moletons')} className="hover:text-[#F4F4F5] transition-colors">Hoodies & Moletons</button></li>
            <li><button onClick={() => onNavigate('shop', 'cargos')} className="hover:text-[#F4F4F5] transition-colors">Calças Cargo & Táticas</button></li>
            <li><button onClick={() => onNavigate('shop', 'jaquetas')} className="hover:text-[#F4F4F5] transition-colors">Jaquetas & Puffers</button></li>
            <li><button onClick={() => onNavigate('shop', 'tenis')} className="hover:text-[#F4F4F5] transition-colors">Sneakers & Calçados</button></li>
            <li><button onClick={() => onNavigate('shop', 'bones')} className="hover:text-[#F4F4F5] transition-colors">Headwear & Acessórios</button></li>
          </ul>
        </div>

        {/* Customer Help Navigation */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#F4F4F5] mb-4">Atendimento</h4>
          <ul className="space-y-2.5 text-xs text-[#A1A1AA] font-medium">
            <li><button onClick={() => onNavigate('tracking')} className="hover:text-[#F4F4F5] transition-colors text-[#C5A869] font-bold">Rastrear Pedido</button></li>
            <li><button onClick={() => onNavigate('institutional', 'faq')} className="hover:text-[#F4F4F5] transition-colors">Dúvidas Frequentes (FAQ)</button></li>
            <li><button onClick={() => onNavigate('institutional', 'trocas')} className="hover:text-[#F4F4F5] transition-colors">Trocas & Devoluções (30 Dias)</button></li>
            <li><button onClick={() => onNavigate('institutional', 'contato')} className="hover:text-[#F4F4F5] transition-colors">Fale com o Ateliê</button></li>
            <li><button onClick={() => onNavigate('account')} className="hover:text-[#F4F4F5] transition-colors">Minha Conta</button></li>
          </ul>
        </div>

        {/* Institutional & Legal */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#F4F4F5] mb-4">Institucional</h4>
          <ul className="space-y-2.5 text-xs text-[#A1A1AA] font-medium">
            <li><button onClick={() => onNavigate('institutional', 'sobre')} className="hover:text-[#F4F4F5] transition-colors">Manifesto Marmot</button></li>
            <li><button onClick={() => onNavigate('institutional', 'termos')} className="hover:text-[#F4F4F5] transition-colors">Termos de Compra</button></li>
            <li><button onClick={() => onNavigate('institutional', 'privacidade')} className="hover:text-[#F4F4F5] transition-colors">Política de Privacidade</button></li>
            <li><button onClick={() => onNavigate('admin')} className="hover:text-[#F4F4F5] transition-colors text-[#71717A] font-mono text-[11px]">Painel Administrativo</button></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar Payment Seals & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#71717A]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#A1A1AA] font-medium">
            <Lock className="w-3.5 h-3.5 text-[#C5A869]" /> Checkout Seguro <strong className="text-[#F4F4F5]">Mercado Pago</strong>
          </span>
          <span className="flex items-center gap-1.5 text-[#A1A1AA] font-medium">
            <Truck className="w-3.5 h-3.5 text-[#C5A869]" /> Envios via <strong className="text-[#F4F4F5]">Melhor Envio / Correios</strong>
          </span>
          <span className="flex items-center gap-1.5 text-[#A1A1AA] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A869]" /> SSL 256-Bit Criptografado
          </span>
        </div>

        <p className="text-[11px] text-[#71717A] text-center md:text-right">
          © {new Date().getFullYear()} MARMOT CONFECÇÕES LTDA. São Paulo - SP. CNPJ: 54.321.876/0001-90.
        </p>
      </div>
    </footer>
  );
};
