import React from 'react';
import {
  Instagram,
  Lock,
  ShieldCheck,
  Truck,
  Youtube,
} from 'lucide-react';
import { NewsletterClubSection } from './NewsletterClubSection';

export { NewsletterClubSection };

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="site-footer" className="w-full bg-[#FAFAF8] border-t border-[#DEDEDA] text-[#18181B] pt-12 sm:pt-14 pb-8">
      {/* Main Footer Navigation Columns */}
      <div className="w-full max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#E4E4E7]">
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
            <li><button onClick={() => onNavigate('shop', 'calcas')} className="hover:text-[#18181B] transition-colors">Calças & Jeans</button></li>
            <li><button onClick={() => onNavigate('shop', 'shorts')} className="hover:text-[#18181B] transition-colors">Shorts & Bermudas</button></li>
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
      <div className="w-full max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-[#71717A]">
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