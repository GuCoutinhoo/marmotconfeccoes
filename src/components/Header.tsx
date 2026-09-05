import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  X,
  Truck,
  Package,
  ArrowRight,
  Sparkles,
  Crown,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenSearch: () => void;
}

interface SubItem {
  name: string;
  slug?: string;
  param?: string;
  badge?: string;
}

interface NavCategory {
  id: string;
  label: string;
  slug: string;
  badge?: string;
  hasSubmenu?: boolean;
  tagline?: string;
  subcategories?: SubItem[];
}

const NAV_ITEMS: NavCategory[] = [
  {
    id: 'inicio',
    label: 'INÍCIO',
    slug: 'home',
    hasSubmenu: false,
  },
  {
    id: 'novidades',
    label: 'NOVIDADES',
    slug: 'novidades',
    badge: 'NEW',
    hasSubmenu: true,
    tagline: 'Lançamentos e drops exclusivos da temporada',
    subcategories: [
      { name: 'Drop Cyber Dystopia', slug: 'novidades' },
      { name: 'Lançamentos da Semana', slug: 'novidades' },
      { name: 'Mais Vendidos', slug: 'destaque' },
      { name: 'Edições Limitadas Numeradas', slug: 'novidades' },
    ],
  },
  {
    id: 'camisetas',
    label: 'CAMISETAS',
    slug: 'camisetas',
    hasSubmenu: true,
    tagline: 'Malha heavyweight 260g/m² & corte boxy',
    subcategories: [
      { name: 'Graphic Tees Heavyweight', slug: 'camisetas' },
      { name: 'Basic Essential Boxy', slug: 'camisetas' },
      { name: 'Acid Wash & Vintage Fit', slug: 'camisetas' },
      { name: 'Oversized Streetwear', slug: 'camisetas' },
    ],
  },
  {
    id: 'moletons',
    label: 'MOLETONS',
    slug: 'moletons',
    hasSubmenu: true,
    tagline: 'Hoodies pesados 400g/m² & fleece denso',
    subcategories: [
      { name: 'Hoodie Heavy 400g/m²', slug: 'moletons' },
      { name: 'Zip Hoodies com Touca Dupla', slug: 'moletons' },
      { name: 'Crewneck Sweatshirts', slug: 'moletons' },
      { name: 'Fleece Tactical', slug: 'moletons' },
    ],
  },
  {
    id: 'calcas',
    label: 'CALÇAS',
    slug: 'calcas',
    hasSubmenu: true,
    tagline: 'Denim vintage baggy & cargos utilitárias ripstop',
    subcategories: [
      { name: 'Baggy Denim Vintage', slug: 'calcas' },
      { name: 'Cargos Ripstop Táticas', slug: 'cargos' },
      { name: 'Wide Leg Pants', slug: 'calcas' },
      { name: 'Shorts & Bermudas Heavy', slug: 'calcas' },
    ],
  },
  {
    id: 'acessorios',
    label: 'ACESSÓRIOS',
    slug: 'acessorios',
    hasSubmenu: true,
    tagline: 'Shoulder bags, bonés 5-panel e joalheria',
    subcategories: [
      { name: 'Shoulder & Chest Bags', slug: 'acessorios' },
      { name: 'Bonés 5-Panel & Dad Hats', slug: 'acessorios' },
      { name: 'Meias Atoalhadas Streetwear', slug: 'acessorios' },
      { name: 'Correntes & Joalheria', slug: 'acessorios' },
    ],
  },
];

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenSearch }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [activeHoverMenu, setActiveHoverMenu] = useState<string | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { totalCartItems, openMiniCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  // Scroll tracking to elevate and shrink header subtly
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleMouseEnterNav = (id: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveHoverMenu(id);
  };

  const handleMouseLeaveNav = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveHoverMenu(null);
    }, 180);
  };

  return (
    <header className="sticky top-0 z-[80] w-full select-none">
      {/* 1. TOP PROMOTIONAL BAR - Streetwear Continuous Marquee Ticker with Edge Fades */}
      <div className="w-full bg-[#09090B] border-b border-white/[0.06] text-zinc-300 text-[11px] font-mono tracking-[0.2em] h-7 sm:h-[30px] overflow-hidden flex items-center relative z-[81]">
        {/* Soft edge fade masks for high-end marquee transition */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#09090B] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#09090B] to-transparent z-10" />

        <div className="animate-marquee flex items-center whitespace-nowrap">
          {/* Segment 1 */}
          <div className="flex items-center gap-6 sm:gap-10 px-4 sm:px-6 shrink-0">
            <span className="font-semibold text-zinc-100 tracking-[0.18em]">
              FRETE GRÁTIS ACIMA DE R$399
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="text-zinc-300 font-medium tracking-[0.16em]">
              ATÉ 6X SEM JUROS NO CARTÃO
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="font-bold text-[#F4C400] tracking-[0.18em]">
              PIX 5% OFF
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="text-zinc-300 font-medium tracking-[0.16em]">
              DROP CYBER DYSTOPIA
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="text-zinc-200 font-semibold tracking-[0.18em]">
              PRIMEIRA TROCA GRÁTIS
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
          </div>

          {/* Segment 2 (Exact duplicate for smooth 60fps infinite loop) */}
          <div className="flex items-center gap-6 sm:gap-10 px-4 sm:px-6 shrink-0" aria-hidden="true">
            <span className="font-semibold text-zinc-100 tracking-[0.18em]">
              FRETE GRÁTIS ACIMA DE R$399
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="text-zinc-300 font-medium tracking-[0.16em]">
              ATÉ 6X SEM JUROS NO CARTÃO
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="font-bold text-[#F4C400] tracking-[0.18em]">
              PIX 5% OFF
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="text-zinc-300 font-medium tracking-[0.16em]">
              DROP CYBER DYSTOPIA
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
            <span className="text-zinc-200 font-semibold tracking-[0.18em]">
              PRIMEIRA TROCA GRÁTIS
            </span>
            <span className="text-[#F4C400] text-xs font-black select-none">•</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER - Sticky, translucent with smooth elevation on scroll */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled
            ? 'h-[68px] sm:h-[70px] bg-white/92 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] border-b border-zinc-200/70'
            : 'h-[74px] sm:h-[78px] bg-white/98 backdrop-blur-md border-b border-zinc-200/50'
        } text-[#09090B]`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-full flex items-center justify-between gap-4 lg:gap-6">
          
          {/* LEFT: Mobile Menu Button & Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 -ml-1 rounded-full text-zinc-800 hover:text-black hover:bg-zinc-100/80 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Streetwear Brand Logo: MARMOT with subtle yellow signature accent */}
            <div
              onClick={() => onNavigate('home')}
              className="cursor-pointer group py-1 select-none shrink-0 flex items-center gap-1.5"
            >
              <span className="text-[21px] sm:text-[23px] font-black tracking-[0.2em] uppercase text-[#09090B] group-hover:opacity-80 transition-opacity">
                MARMOT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4C400] -mt-2 shrink-0 group-hover:scale-125 transition-transform" />
            </div>
          </div>

          {/* CENTER: Desktop Navigation - Spaced out and elegantly distributed */}
          <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 2xl:gap-10 text-[12.5px] font-bold uppercase tracking-[0.14em] text-zinc-600 flex-1 px-2 lg:px-4">
            {NAV_ITEMS.map((item) => {
              const isOpen = activeHoverMenu === item.id;
              return (
                <div
                  key={item.id}
                  className="relative group py-2"
                  onMouseEnter={() => item.hasSubmenu && handleMouseEnterNav(item.id)}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <button
                    onClick={() => (item.slug === 'home' ? onNavigate('home') : onNavigate('shop', item.slug))}
                    className="flex items-center gap-1.5 transition-colors duration-150 text-zinc-600 hover:text-black cursor-pointer py-1 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1.5px] after:bg-[#09090B] after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-250 after:origin-left whitespace-nowrap"
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className="text-[8.5px] font-mono font-black tracking-wider px-1.5 py-0.5 bg-[#F4C400] text-[#09090B] rounded-[3px] shadow-2xs leading-none">
                        {item.badge}
                      </span>
                    )}
                    {item.hasSubmenu && (
                      <ChevronDown
                        className={`w-3 h-3 text-zinc-400 group-hover:text-zinc-900 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-black' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Elegant Floating Submenu Flyout */}
                  {item.hasSubmenu && isOpen && item.subcategories && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white/98 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-3.5 z-50 animate-fadeIn"
                      onMouseEnter={() => handleMouseEnterNav(item.id)}
                      onMouseLeave={handleMouseLeaveNav}
                    >
                      {item.tagline && (
                        <div className="px-2.5 pb-2 mb-2 border-b border-zinc-100">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                            {item.label}
                          </p>
                          <p className="text-[11.5px] font-medium text-zinc-600 truncate mt-0.5">
                            {item.tagline}
                          </p>
                        </div>
                      )}

                      <div className="space-y-0.5">
                        {item.subcategories.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveHoverMenu(null);
                              if (sub.param) {
                                onNavigate('institutional', sub.param);
                              } else {
                                onNavigate('shop', sub.slug || item.slug);
                              }
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-50 flex items-center justify-between group/sub transition-colors cursor-pointer"
                          >
                            <span>{sub.name}</span>
                            <ArrowRight className="w-3 h-3 text-zinc-300 group-hover/sub:text-[#09090B] group-hover/sub:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>

                      <div className="mt-2 pt-2 border-t border-zinc-100">
                        <button
                          onClick={() => {
                            setActiveHoverMenu(null);
                            onNavigate('shop', item.slug);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-900 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer group/all"
                        >
                          <span className="group-hover/all:underline decoration-zinc-400 underline-offset-2">Ver todas as peças</span>
                          <ArrowRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT: Search with Placeholder, Divider, Wishlist, LOGIN / CADASTRAR, and Bag */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* 1. Search button with sleek pill design and placeholder */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2.5 px-3.5 h-10 rounded-md bg-zinc-100/75 hover:bg-zinc-100 border border-zinc-200/60 hover:border-zinc-300/80 text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer w-44 md:w-50 lg:w-56 xl:w-64 shrink-0 shadow-2xs group"
              title="Buscar produtos (Ctrl+K)"
              aria-label="Buscar produtos"
            >
              <Search className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 transition-colors shrink-0 stroke-[1.8]" />
              <span className="truncate text-xs font-medium text-zinc-400 group-hover:text-zinc-600">
                Buscar produtos...
              </span>
              <kbd className="hidden lg:inline-flex ml-auto items-center px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-white/90 border border-zinc-200/80 rounded shadow-3xs">
                /
              </kbd>
            </button>

            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="sm:hidden w-10 h-10 rounded-full text-zinc-700 hover:text-black hover:bg-zinc-100/80 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title="Buscar produtos"
              aria-label="Buscar produtos"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Subtle Divider between Search and Actions */}
            <div className="hidden sm:block h-4 w-[1px] bg-zinc-200/80 mx-0.5" />

            {/* 2. Wishlist Icon Button */}
            <button
              onClick={() => onNavigate('account', 'wishlist')}
              className="w-10 h-10 rounded-full text-zinc-700 hover:text-black hover:bg-zinc-100/80 transition-colors cursor-pointer relative hidden sm:flex items-center justify-center shrink-0 group"
              title="Favoritos"
              aria-label="Ver favoritos"
            >
              <Heart className="w-[19px] h-[19px] stroke-[1.8] group-hover:scale-105 transition-transform" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-[#09090B] text-[#F4C400] font-mono font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* 3. Authentication: LOGIN & CADASTRAR buttons or User dropdown when logged in */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('account', 'login')}
                  className="px-3.5 h-10 flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-700 hover:text-black hover:bg-zinc-100/80 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('account', 'register')}
                  className="px-4 h-10 flex items-center justify-center bg-[#F4C400] hover:bg-[#E5B500] text-[#09090B] text-[12px] font-black uppercase tracking-[0.12em] rounded-md transition-all active:scale-95 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  CADASTRAR
                </button>
              </div>
            ) : (
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center gap-2 h-10 px-3 rounded-full transition-all cursor-pointer border ${
                    isUserDropdownOpen
                      ? 'bg-zinc-100 text-black border-zinc-300 ring-1 ring-zinc-200'
                      : 'border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-300 text-zinc-800'
                  }`}
                  title={`Minha Conta (${user.name})`}
                  aria-label="Menu de usuário"
                >
                  {user?.role === 'admin' ? (
                    <Crown className="w-4 h-4 text-[#F4C400]" />
                  ) : (
                    <User className="w-4 h-4 stroke-[1.8]" />
                  )}
                  <span className="hidden sm:inline-block text-[12px] font-bold uppercase tracking-wider max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-zinc-400 ${
                      isUserDropdownOpen ? 'rotate-180 text-black' : ''
                    }`}
                  />
                </button>

                {isUserDropdownOpen && (
                  <UserDropdown
                    isOpen={isUserDropdownOpen}
                    onClose={() => setIsUserDropdownOpen(false)}
                    onNavigate={onNavigate}
                  />
                )}
              </div>
            )}

            {/* 4. Bag / Cart Icon Button with Item Count */}
            <button
              onClick={openMiniCart}
              className="w-10 h-10 rounded-full text-zinc-700 hover:text-black hover:bg-zinc-100/80 transition-colors cursor-pointer relative flex items-center justify-center shrink-0 group"
              title="Sacola de Compras"
              aria-label="Abrir sacola de compras"
            >
              <ShoppingBag className="w-[19px] h-[19px] stroke-[1.8] group-hover:scale-105 transition-transform" />
              {totalCartItems > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-[#F4C400] text-[#09090B] font-black text-[9.5px] font-mono rounded-full flex items-center justify-center shadow-xs ring-2 ring-white animate-fadeIn">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE SLIDE-IN DRAWER (Clean, premium streetwear side panel) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-slideInLeft">
            
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('home');
                  }}
                  className="cursor-pointer select-none flex items-center gap-1.5"
                >
                  <span className="text-[19px] font-black tracking-[0.2em] uppercase text-[#09090B]">
                    MARMOT
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4C400] -mt-2 shrink-0" />
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              {/* Quick Search Action */}
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSearch();
                  }}
                  className="w-full py-2.5 px-3.5 bg-white border border-zinc-200/80 rounded-full text-left text-xs text-zinc-500 flex items-center gap-2.5 shadow-2xs hover:border-zinc-400 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4 text-zinc-400 stroke-[1.8]" />
                  <span>Buscar moletons, calças, camisetas...</span>
                </button>
              </div>

              {/* Main Nav Links List */}
              <div className="p-4 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-400 px-2 block mb-2">
                  COLEÇÕES & PRODUTOS
                </span>

                {NAV_ITEMS.map((item) => {
                  const isExpanded = expandedMobileCategory === item.id;
                  return (
                    <div key={item.id} className="border-b border-zinc-100/80 last:border-none">
                      <div className="flex items-center justify-between py-2.5 px-2">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            if (item.slug === 'home') {
                              onNavigate('home');
                            } else {
                              onNavigate('shop', item.slug);
                            }
                          }}
                          className="text-left font-semibold text-sm uppercase tracking-wider text-zinc-900 hover:text-black flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-mono font-black px-1.5 py-0.2 bg-[#F4C400] text-[#0B0B0E] rounded-sm">
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {item.subcategories && item.subcategories.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedMobileCategory(isExpanded ? null : item.id)
                            }
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded cursor-pointer"
                            aria-label={`Expandir ${item.label}`}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-black' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Expandable Subcategories Accordion */}
                      {isExpanded && item.subcategories && (
                        <div className="pl-4 pr-2 pb-3 space-y-1 animate-fadeIn">
                          {item.subcategories.map((sub, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                if (sub.param) {
                                  onNavigate('institutional', sub.param);
                                } else {
                                  onNavigate('shop', sub.slug || item.slug);
                                }
                              }}
                              className="w-full text-left py-1.5 px-2 text-xs font-medium text-zinc-600 hover:text-black hover:bg-zinc-50 rounded flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span>{sub.name}</span>
                              <ArrowRight className="w-3 h-3 text-zinc-300" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer User & Order Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/70 space-y-2.5">
              
              {/* Rastrear Pedido Direct Link */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('tracking');
                }}
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 flex items-center justify-between hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-zinc-500" />
                  <span>Rastrear Pedido</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Meus Pedidos Link */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('account', 'orders');
                }}
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 flex items-center justify-between hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-zinc-500" />
                  <span>Meus Pedidos</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Account State: Logged In vs Guest */}
              {user ? (
                <div className="pt-2 border-t border-zinc-200 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account');
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#0B0B0E] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <User className="w-4 h-4 text-[#F4C400]" />
                    <span>Minha Conta ({user.name.split(' ')[0]})</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account', 'wishlist');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-2"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Favoritos ({wishlistCount})</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-zinc-200 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account', 'login');
                    }}
                    className="py-2.5 rounded-lg bg-[#0B0B0E] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Entrar</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account', 'register');
                    }}
                    className="py-2.5 rounded-lg bg-[#F4C400] text-[#0B0B0E] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#E5B500] transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Criar Conta</span>
                  </button>
                </div>
              )}

              {/* Bottom Support Info */}
              <div className="pt-2 text-center text-[10px] font-mono text-zinc-400">
                <span>MARMOT CONFECÇÕES • SÃO PAULO, BR</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
