import React, { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User, UserPlus, ChevronDown, Menu, X, Sparkles, Truck, ShieldCheck, Tag, ArrowRight, Crown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { MegaMenu } from './MegaMenu';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenSearch }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { totalCartItems, openMiniCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  // Track scroll position for elevated header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-[80] w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/98 backdrop-blur-2xl border-b border-[#E4E4E7] shadow-[0_4px_20px_rgba(0,0,0,0.06)]' 
        : 'bg-white/90 backdrop-blur-xl border-b border-[#E4E4E7]'
    } text-[#18181B]`}>
      
      {/* Top Bar Announcement - Infinite Marquee Ticker */}
      <div className="relative w-full bg-[#18181B] border-b border-[#27272A] text-[#F4C400] text-[10.5px] font-mono font-bold tracking-[0.2em] uppercase py-2 overflow-hidden select-none">
        {/* Subtle glowing ambient line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#F4C400]/40 to-transparent pointer-events-none" />
        
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="inline-flex items-center gap-7 px-4">
              <span className="flex items-center gap-1.5 text-[#E4E4E7]">
                <Truck className="w-3.5 h-3.5 text-[#F4C400]" />
                <span className="tracking-wide">FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 399</span>
              </span>
              <span className="text-[#52525B]">•</span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#F4C400]" />
                <span className="text-[#E4E4E7]">CUPOM</span>
                <strong className="text-[#0B0B0E] bg-[#F4C400] px-2 py-0.5 rounded-[4px] font-mono font-black text-[10.5px] tracking-wider shadow-sm hover:scale-105 transition-transform inline-block">
                  MARMOT10
                </strong>
                <span className="text-[#A1A1AA]">(10% OFF NO 1º PEDIDO)</span>
              </span>
              <span className="text-[#52525B]">•</span>
              <span className="text-[#E4E4E7]">ATÉ 6X SEM JUROS NO CARTÃO</span>
              <span className="text-[#52525B]">•</span>
              <span className="font-black bg-gradient-to-r from-[#F4C400]/20 to-[#F4C400]/10 text-[#F4C400] border border-[#F4C400]/40 px-2.5 py-0.5 rounded-md text-[10px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,196,0,0.15)]">
                <p> PIX 5% OFF </p>
              </span>
              <span className="text-[#52525B]">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Header Container - Full-Width Wide Layout */}
      <div className="w-full px-4 sm:px-6 lg:px-[4.5vw] h-[74px] sm:h-[80px] flex items-center justify-between gap-4 lg:gap-8 relative">
        
        {/* Left Side: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-lg bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B] hover:text-[#18181B] hover:border-[#D4D4D8] hover:bg-[#E4E4E7] transition-all cursor-pointer shadow-sm"
            aria-label="Abrir menu mobile"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#B45309]" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo with Modern Streetwear Aesthetic */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3.5 cursor-pointer group select-none py-1"
          >
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#FFD700] via-[#F4C400] to-[#D9A300] text-[#0B0B0E] font-black text-xl sm:text-2xl flex items-center justify-center rounded-lg tracking-tighter transition-all duration-300 shadow-[0_4px_16px_rgba(244,196,0,0.25)] group-hover:shadow-[0_0_25px_rgba(244,196,0,0.45)] group-hover:scale-105 shrink-0 border border-[#FFF080]/60">
                M
              </div>
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#22C55E] border-2 border-white rounded-full" title="Online" />
            </div>
            <div className="flex flex-col">
              <span className="text-[20px] sm:text-[22px] font-black tracking-[0.16em] uppercase leading-none text-[#18181B] transition-colors group-hover:text-[#B45309]">
                MARMOT
              </span>
              <span className="text-[9.5px] sm:text-[10px] font-mono font-bold tracking-[0.32em] uppercase text-[#71717A] group-hover:text-[#52525B] transition-colors mt-0.5">
                CONFECÇÕES
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Links with Animated Glow Pill */}
        <nav className="hidden lg:flex items-center h-10 sm:h-11 rounded-md gap-2 xl:gap-4 px-3 xl:px-4 bg-[#F4F4F5] border border-[#E4E4E7] shadow-inner text-[12.5px] font-bold uppercase tracking-[0.12em] text-[#52525B]">
          <button
            onClick={() => onNavigate('home')}
            className="h-7 sm:h-8 px-3 xl:px-4 rounded-md hover:text-[#18181B] hover:bg-white transition-all duration-200 cursor-pointer relative group flex items-center justify-center"
          >
            <span>Início</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#18181B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => onNavigate('shop')}
            className="h-7 sm:h-8 px-3 xl:px-4 rounded-md hover:text-[#18181B] hover:bg-white transition-all duration-200 cursor-pointer relative group flex items-center justify-center"
          >
            <span>Catálogo</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#18181B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div
            onMouseEnter={() => setIsMegaMenuOpen(true)}
            className="h-7 sm:h-8 px-3 xl:px-4 rounded-md cursor-pointer hover:text-[#18181B] hover:bg-white transition-all duration-200 flex items-center justify-center gap-1.5 group relative"
          >
            <span>Categorias</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-[#71717A] group-hover:text-[#18181B] ${isMegaMenuOpen ? 'rotate-180 text-[#18181B]' : ''}`} />
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#18181B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <button
            onClick={() => onNavigate('tracking')}
            className="h-7 sm:h-8 px-3 xl:px-4 rounded-md hover:text-[#18181B] hover:bg-white transition-all duration-200 cursor-pointer relative group flex items-center justify-center"
          >
            <span>Rastreio</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#18181B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => onNavigate('institutional', 'sobre')}
            className="h-7 sm:h-8 px-3 xl:px-4 rounded-md hover:text-[#18181B] hover:bg-white transition-all duration-200 cursor-pointer relative group flex items-center justify-center"
          >
            <span>Ateliê</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#18181B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </nav>

        {/* Right Side: Action Controls & Modern Highlighted Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="h-10 sm:h-11 flex items-center gap-2.5 px-3.5 sm:px-4 bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] hover:bg-[#E4E4E7] transition-all shadow-sm group w-10 sm:w-44 md:w-52 lg:w-60 justify-center sm:justify-start cursor-pointer"
            title="Buscar produtos (Ctrl+K)"
            aria-label="Pesquisar na loja"
          >
            <Search className="w-4 h-4 text-[#71717A] group-hover:text-[#18181B] group-hover:scale-110 transition-all shrink-0" />
            <span className="hidden sm:inline text-[12.5px] text-[#71717A] group-hover:text-[#18181B] transition-colors truncate font-normal">
              Buscar produtos...
            </span>
            <kbd className="hidden lg:inline-flex ml-auto items-center px-1.5 py-0.5 text-[9px] font-mono text-[#71717A] bg-[#E4E4E7] rounded border border-[#D4D4D8]">
              /
            </kbd>
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={() => onNavigate('account', 'wishlist')}
            className="relative h-10 sm:h-11 w-10 sm:w-11 hidden sm:flex items-center justify-center rounded-lg bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B] hover:text-[#18181B] hover:border-[#D4D4D8] hover:bg-[#E4E4E7] transition-all shadow-sm cursor-pointer group"
            title="Meus Favoritos"
            aria-label="Abrir favoritos"
          >
            <Heart className="w-4 h-4 group-hover:scale-110 transition-transform group-hover:fill-current" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#18181B] text-[#F4C400] font-black text-[10px] rounded-full flex items-center justify-center shadow-md font-mono animate-bounce">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* User Account Portal & Dropdown - "ENTRAR" */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className={`h-10 sm:h-11 px-3.5 sm:px-4 rounded-lg transition-all duration-200 flex items-center gap-2 border text-xs shadow-sm cursor-pointer ${
                user
                  ? isUserDropdownOpen
                    ? 'border-[#18181B] bg-[#18181B] text-white shadow-md'
                    : user.role === 'admin'
                    ? 'bg-[#18181B] border-[#27272A] text-white hover:bg-[#27272A] hover:border-[#3F3F46]'
                    : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#18181B] hover:border-[#D4D4D8] hover:bg-[#E4E4E7]'
                  : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#18181B] hover:bg-[#E4E4E7] hover:border-[#D4D4D8] active:scale-95'
              }`}
              title="Conta do Usuário"
            >
              {user?.role === 'admin' ? (
                <Crown className="w-4 h-4 text-[#F4C400]" />
              ) : (
                <User className={`w-4 h-4 ${user ? 'text-[#71717A]' : 'text-[#18181B]'}`} />
              )}
              <span className={`hidden sm:inline font-black uppercase tracking-wider text-[12px] ${user?.role === 'admin' ? 'text-white' : 'text-[#18181B]'}`}>
                {user ? user.name.split(' ')[0] : 'Entrar'}
              </span>
              {user?.role === 'admin' && (
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded bg-[#F4C400]/20 border border-[#F4C400]/40 text-[#F4C400] text-[9.5px] font-mono font-black tracking-wider">
                  ADM
                </span>
              )}
            </button>

            {isUserDropdownOpen && (
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
                onNavigate={onNavigate}
              />
            )}
          </div>

          {/* Cadastrar Button */}
          {!user && (
            <button
              onClick={() => onNavigate('account', 'register')}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-lg flex items-center gap-2 bg-[#F4C400] hover:bg-[#E5B500] text-[#0B0B0E] font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 shrink-0 cursor-pointer border border-[#E5B500]"
              title="Criar nova conta"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[12px]">Cadastrar</span>
            </button>
          )}

          {/* Cart Trigger - Only visible when user is logged in */}
          {user && (
            <button
              onClick={openMiniCart}
              className="h-10 sm:h-11 px-3.5 sm:px-4.5 rounded-lg flex items-center gap-2.5 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95 shrink-0 cursor-pointer"
              title="Abrir Carrinho"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.2] text-[#F4C400]" />
              <span className="hidden sm:inline text-[12px]">Carrinho</span>
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#F4C400] text-[#0B0B0E] text-[10.5px] font-mono font-black flex items-center justify-center shadow-sm">
                {totalCartItems}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* MegaMenu Hover Panel */}
      {isMegaMenuOpen && (
        <MegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onSelectCategory={(slug) => {
            setIsMegaMenuOpen(false);
            onNavigate('shop', slug);
          }}
        />
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[110px] bg-white/98 backdrop-blur-2xl z-50 p-6 flex flex-col justify-between border-t border-[#E4E4E7] animate-fadeIn shadow-2xl">
          <div className="space-y-6 overflow-y-auto">
            <div className="space-y-3">
              <span className="text-[10.5px] font-mono font-bold text-[#B45309] uppercase tracking-[0.24em] block">
                NAVEGAÇÃO PRINCIPAL
              </span>
              <div className="flex flex-col space-y-1 text-base font-black uppercase text-[#18181B]">
                <button
                  onClick={() => {
                    onNavigate('home');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-3 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#B45309] transition-colors flex items-center justify-between border-b border-[#E4E4E7]"
                >
                  <span>Início</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('shop');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-3 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#B45309] transition-colors flex items-center justify-between border-b border-[#E4E4E7]"
                >
                  <span>Catálogo Geral</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('shop', 'oversized');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-3 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#B45309] transition-colors flex items-center justify-between border-b border-[#E4E4E7]"
                >
                  <span>Camisetas Oversized</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('shop', 'moletons');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-3 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#B45309] transition-colors flex items-center justify-between border-b border-[#E4E4E7]"
                >
                  <span>Hoodies & Moletons</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('shop', 'cargos');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-3 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#B45309] transition-colors flex items-center justify-between border-b border-[#E4E4E7]"
                >
                  <span>Calças Cargo & Shorts</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('tracking');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-3 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#B45309] transition-colors flex items-center justify-between border-b border-[#E4E4E7]"
                >
                  <span>Rastrear Pedido</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('institutional', 'sobre');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-3 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#B45309] transition-colors flex items-center justify-between"
                >
                  <span>Manifesto do Ateliê</span>
                  <ArrowRight className="w-4 h-4 text-[#71717A]" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-[#E4E4E7] space-y-3">
            {user ? (
              <button
                onClick={() => {
                  openMiniCart();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3.5 rounded-xl bg-[#18181B] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.5] text-[#F4C400]" />
                <span>Ver Carrinho ({totalCartItems})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onNavigate('account', 'register');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3.5 rounded-xl bg-[#F4C400] text-[#0B0B0E] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Criar Conta (Cadastrar)</span>
              </button>
            )}
            <button
              onClick={() => {
                onNavigate('account');
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-3.5 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center justify-center gap-2"
            >
              <User className={`w-4 h-4 ${user ? 'text-[#B45309]' : 'text-[#18181B]'}`} /> 
              <span>{user ? `Minha Conta (${user.name})` : 'Entrar na Conta'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

