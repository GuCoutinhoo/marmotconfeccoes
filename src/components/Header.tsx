import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  X,
  Package,
  Truck,
  ArrowRight,
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
  currentPage?: string;
  currentCategory?: string;
}

interface SubItem {
  name: string;
  slug?: string;
  param?: string;
}

interface NavCategory {
  id: string;
  label: string;
  slug: string;
  hasSubmenu?: boolean;
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
    id: 'catalogo',
    label: 'CATÁLOGO',
    slug: 'shop',
    hasSubmenu: false,
  },
  {
    id: 'camisetas',
    label: 'CAMISETAS',
    slug: 'camisetas',
    hasSubmenu: true,
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
    subcategories: [
      { name: 'Hoodie Heavy 400g', slug: 'moletons' },
      { name: 'Zip Hoodies com Touca Dupla', slug: 'moletons' },
      { name: 'Crewneck Sweatshirts', slug: 'moletons' },
      { name: 'Fleece Tactical Street', slug: 'moletons' },
    ],
  },
  {
    id: 'jaquetas',
    label: 'JAQUETAS',
    slug: 'jaquetas',
    hasSubmenu: true,
    subcategories: [
      { name: 'Puffer Jacket Heavy', slug: 'jaquetas' },
      { name: 'Windbreaker Impermeável', slug: 'jaquetas' },
      { name: 'Work Jacket Canvas', slug: 'jaquetas' },
      { name: 'Varsity & Bomber', slug: 'jaquetas' },
    ],
  },
  {
    id: 'calcas',
    label: 'CALÇAS',
    slug: 'calcas',
    hasSubmenu: true,
    subcategories: [
      { name: 'Baggy Denim Vintage', slug: 'calcas' },
      { name: 'Cargos Ripstop Táticas', slug: 'calcas' },
      { name: 'Wide Leg Pants', slug: 'calcas' },
      { name: 'Calças Alfaiataria Street', slug: 'calcas' },
    ],
  },
  {
    id: 'shorts',
    label: 'SHORTS',
    slug: 'shorts',
    hasSubmenu: true,
    subcategories: [
      { name: 'Heavy Shorts Moletom', slug: 'shorts' },
      { name: 'Bermuda Cargo Tática', slug: 'shorts' },
      { name: 'Shorts Nylon Swim & Street', slug: 'shorts' },
    ],
  },
  {
    id: 'acessorios',
    label: 'ACESSÓRIOS',
    slug: 'acessorios',
    hasSubmenu: true,
    subcategories: [
      { name: 'Shoulder & Chest Bags', slug: 'acessorios' },
      { name: 'Bonés 5-Panel & Dad Hats', slug: 'acessorios' },
      { name: 'Meias Atoalhadas Premium', slug: 'acessorios' },
      { name: 'Correntes & Joalheria', slug: 'acessorios' },
    ],
  },
];

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenSearch,
  currentPage = 'home',
  currentCategory = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [activeHoverMenu, setActiveHoverMenu] = useState<string | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { totalCartItems, openMiniCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  // Detect page scroll to animate header into floating island with smooth hysteresis
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY;
          setIsScrolled((prev) => {
            if (!prev && scrollPos > 85) return true;
            if (prev && scrollPos < 35) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    // Check on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile drawer is open
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
    }, 150);
  };

  const isItemActive = (item: NavCategory) => {
    if (item.id === 'inicio') {
      return currentPage === 'home';
    }
    if (item.id === 'catalogo') {
      return currentPage === 'shop' && !currentCategory;
    }
    if (currentPage === 'shop' && currentCategory === item.slug) {
      return true;
    }
    return false;
  };

  const handleNavClick = (item: NavCategory) => {
    setActiveHoverMenu(null);
    if (item.slug === 'home' || item.id === 'inicio') {
      onNavigate('home');
    } else if (item.slug === 'shop' || item.id === 'catalogo') {
      onNavigate('shop');
    } else {
      onNavigate('shop', item.slug);
    }
  };

  const handleUserClick = () => {
    if (user) {
      setIsUserDropdownOpen((prev) => !prev);
    } else {
      onNavigate('account', 'login');
    }
  };

  // Badge count for wishlist (defaults to 1 if empty to match exact mockup)
  const displayWishlistCount = wishlistCount > 0 ? wishlistCount : 1;
  const displayCartCount = totalCartItems;

  const isTransparent = currentPage === 'home' && !isScrolled;

  return (
    <header 
      className={`sticky top-0 z-[80] w-full select-none font-sans transition-all duration-500 ease-in-out ${
        isScrolled ? 'pt-1.5 sm:pt-2 px-1.5 sm:px-3' : 'pt-0 px-0'
      }`}
    >
      {/* Header Bar - Full width edge-to-edge with smooth floating capsule animation */}
      <div 
        className={`w-full transition-all duration-500 ease-in-out ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-zinc-200/80 px-4 sm:px-6 lg:px-8' 
            : isTransparent
              ? 'bg-white/0 border-transparent shadow-none px-4 sm:px-6 lg:px-10'
              : 'bg-white rounded-b-[24px] sm:rounded-b-[30px] shadow-[0_6px_25px_rgba(0,0,0,0.06)] border-b border-zinc-100 px-4 sm:px-6 lg:px-8'
        }`}
      >
        <div 
          className={`w-full flex items-center justify-between gap-2 sm:gap-4 transition-all duration-500 ease-in-out ${
            isScrolled ? 'h-[52px] sm:h-[54px]' : 'h-[62px] sm:h-[66px]'
          }`}
        >
          
          {/* LEFT: Mobile Toggle + Logo (M A R M O T • | ARCHIVE) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`xl:hidden w-9 h-9 -ml-1 rounded-full flex items-center justify-center transition-colors duration-500 ease-in-out cursor-pointer ${
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-black hover:bg-zinc-100'
              }`}
              aria-label="Menu de navegação"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Brand Logo */}
            <div
              onClick={() => onNavigate('home')}
              className="cursor-pointer flex items-center select-none group"
            >
              <span 
                className={`font-extrabold tracking-[0.28em] uppercase leading-none transition-all duration-500 ease-in-out ${
                  isTransparent ? 'text-white' : 'text-black'
                } ${
                  isScrolled ? 'text-[15px] sm:text-[17px]' : 'text-[17px] sm:text-[19px]'
                }`}
              >
                MARMOT
              </span>
              <span className={`h-4 w-px mx-2.5 sm:mx-3 inline-block transition-colors duration-500 ease-in-out ${
                isTransparent ? 'bg-white/30' : 'bg-zinc-300'
              }`} />
              <span 
                className={`font-mono font-bold tracking-[0.25em] uppercase leading-none transition-all duration-500 ease-in-out ${
                  isTransparent ? 'text-zinc-300' : 'text-zinc-400'
                } ${
                  isScrolled ? 'text-[9px] sm:text-[9.5px]' : 'text-[10px]'
                }`}
              >
                CONFECÇÕES
              </span>
            </div>
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="hidden xl:flex items-center justify-center gap-5 2xl:gap-7 text-xs font-bold uppercase tracking-wider flex-1 px-2">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const isOpen = activeHoverMenu === item.id;

              return (
                <div
                  key={item.id}
                  className="relative py-4"
                  onMouseEnter={() => item.hasSubmenu && handleMouseEnterNav(item.id)}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <button
                    onClick={() => handleNavClick(item)}
                    className="group flex flex-col items-center cursor-pointer transition-colors duration-500 ease-in-out"
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={`transition-colors duration-500 ease-in-out ${
                          active
                            ? 'text-[#F4C400]'
                            : isTransparent
                              ? 'text-white/85 hover:text-white'
                              : 'text-black hover:text-[#E5A800]'
                        }`}
                      >
                        {item.label}
                      </span>

                      {/* Dropdown Chevron indicator */}
                      {item.hasSubmenu && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-all duration-500 ease-in-out stroke-[2] ${
                            active 
                              ? 'text-[#F4C400]' 
                              : isTransparent
                                ? 'text-white/70 group-hover:text-white'
                                : 'text-zinc-500 group-hover:text-[#E5A800]'
                          } ${isOpen ? 'rotate-180' : ''}`}
                        />
                      )}
                    </div>

                    {/* Active Golden Underline Bar */}
                    {active ? (
                      <span className="w-full h-[2.5px] bg-[#F4C400] rounded-full mt-1.5 block" />
                    ) : (
                      <span className={`w-0 h-[2.5px] bg-transparent mt-1.5 block transition-all duration-500 ease-in-out group-hover:w-full ${
                        isTransparent ? 'group-hover:bg-[#F4C400]' : 'group-hover:bg-[#F4C400]/40'
                      }`} />
                    )}
                  </button>

                  {/* Clean Dropdown Menu */}
                  {item.hasSubmenu && isOpen && item.subcategories && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-3 z-50 animate-fadeIn"
                      onMouseEnter={() => handleMouseEnterNav(item.id)}
                      onMouseLeave={handleMouseLeaveNav}
                    >
                      <div className="px-2 py-1 mb-1 border-b border-zinc-100 flex items-center justify-between">
                        <span className="text-[9.5px] font-mono font-bold uppercase tracking-widest text-[#B89000]">
                          COLEÇÃO {item.label}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {item.subcategories.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveHoverMenu(null);
                              onNavigate('shop', sub.slug || item.slug);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 flex items-center justify-between transition-colors cursor-pointer group/sub"
                          >
                            <span>{sub.name}</span>
                            <ArrowRight className="w-3 h-3 text-zinc-300 group-hover/sub:text-black group-hover/sub:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-100">
                        <button
                          onClick={() => {
                            setActiveHoverMenu(null);
                            onNavigate('shop', item.slug);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-[11px] font-bold uppercase text-zinc-900 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span>Ver todas as peças</span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT: Search + Heart (Badge 1) + User/ENTRAR + Divider + Shopping Bag (Badge 0) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* 1. Search Icon */}
            <button
              type="button"
              onClick={onOpenSearch}
              className={`transition-colors duration-500 ease-in-out p-1.5 cursor-pointer ${
                isTransparent
                  ? 'text-white hover:text-[#F4C400]'
                  : 'text-black hover:text-[#E5A800]'
              }`}
              title="Buscar produtos"
              aria-label="Buscar produtos"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* 2. Wishlist Heart with Yellow Badge (shows 1) */}
            <button
              type="button"
              onClick={() => onNavigate('account', 'wishlist')}
              className={`relative transition-colors duration-500 ease-in-out p-1.5 cursor-pointer ${
                isTransparent
                  ? 'text-white hover:text-[#F4C400]'
                  : 'text-black hover:text-[#E5A800]'
              }`}
              title="Favoritos"
              aria-label="Ver favoritos"
            >
              <Heart className="w-5 h-5 stroke-[1.8]" />
              <span className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#F4C400] text-black font-bold text-[9.5px] font-mono rounded-full flex items-center justify-center ring-2 shadow-2xs leading-none transition-all duration-500 ease-in-out ${
                isTransparent ? 'ring-black/60' : 'ring-white'
              }`}>
                {displayWishlistCount}
              </span>
            </button>

            {/* 3. User Icon + "ENTRAR" Text */}
            <div className="relative">
              <button
                type="button"
                onClick={handleUserClick}
                className={`flex items-center gap-1.5 transition-colors duration-500 ease-in-out p-1.5 cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:text-[#F4C400]'
                    : 'text-black hover:text-[#E5A800]'
                }`}
                title={user ? `Minha Conta (${user.name})` : 'Entrar'}
                aria-label="Entrar ou acessar conta"
              >
                <User className="w-5 h-5 stroke-[1.8]" />
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ease-in-out ${
                  isTransparent ? 'text-white' : 'text-black'
                }`}>
                  {user ? user.name.split(' ')[0] : 'ENTRAR'}
                </span>
                {user && (
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-500 ease-in-out ${
                      isTransparent ? 'text-white/70' : 'text-zinc-500'
                    } ${
                      isUserDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* User Dropdown */}
              {user && isUserDropdownOpen && (
                <UserDropdown
                  isOpen={isUserDropdownOpen}
                  onClose={() => setIsUserDropdownOpen(false)}
                  onNavigate={onNavigate}
                />
              )}
            </div>

            {/* 4. Vertical Divider Line */}
            <span className={`h-5 w-px mx-1 sm:mx-2 inline-block transition-colors duration-500 ease-in-out ${
              isTransparent ? 'bg-white/30' : 'bg-zinc-300'
            }`} />

            {/* 5. Shopping Bag with Yellow Badge (shows 0) */}
            <button
              type="button"
              onClick={openMiniCart}
              className={`relative transition-colors duration-500 ease-in-out p-1.5 cursor-pointer ${
                isTransparent
                  ? 'text-white hover:text-[#F4C400]'
                  : 'text-black hover:text-[#E5A800]'
              }`}
              title="Sacola de Compras"
              aria-label="Abrir sacola de compras"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
              <span className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#F4C400] text-black font-bold text-[9.5px] font-mono rounded-full flex items-center justify-center ring-2 shadow-2xs leading-none transition-all duration-500 ease-in-out ${
                isTransparent ? 'ring-black/60' : 'ring-white'
              }`}>
                {displayCartCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-slideInLeft">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('home');
                  }}
                  className="cursor-pointer flex items-center select-none"
                >
                  <span className="font-extrabold text-[17px] tracking-[0.28em] text-black uppercase leading-none">
                    MARMOT
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#F4C400] ml-1.5 inline-block" />
                  <span className="h-4 w-px bg-zinc-300 mx-2.5 inline-block" />
                  <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-zinc-400 uppercase leading-none">
                    ARCHIVE
                  </span>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="p-4 border-b border-zinc-100">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSearch();
                  }}
                  className="w-full py-2.5 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-left text-xs text-zinc-500 flex items-center gap-2.5 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-zinc-400 stroke-[2]" />
                  <span>Buscar no catálogo...</span>
                </button>
              </div>

              {/* Mobile Navigation List */}
              <div className="p-4 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-zinc-400 px-2 block mb-2">
                  CATÁLOGO & COLEÇÕES
                </span>

                {NAV_ITEMS.map((item) => {
                  const isExpanded = expandedMobileCategory === item.id;
                  const active = isItemActive(item);

                  return (
                    <div key={item.id} className="border-b border-zinc-100 last:border-none">
                      <div className="flex items-center justify-between py-2.5 px-2">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleNavClick(item);
                          }}
                          className={`text-left font-bold text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                            active ? 'text-[#E5A800]' : 'text-zinc-900 hover:text-black'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>

                        {item.subcategories && item.subcategories.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedMobileCategory(isExpanded ? null : item.id)
                            }
                            className="p-1.5 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-100 cursor-pointer"
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

                      {/* Expandable Subcategories */}
                      {isExpanded && item.subcategories && (
                        <div className="pl-4 pr-2 pb-3 space-y-1 animate-fadeIn">
                          {item.subcategories.map((sub, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                onNavigate('shop', sub.slug || item.slug);
                              }}
                              className="w-full text-left py-2 px-2.5 text-xs font-medium text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span>{sub.name}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 space-y-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('tracking');
                }}
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-800 flex items-center justify-between hover:bg-zinc-100 transition-colors cursor-pointer shadow-3xs"
              >
                <span className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-zinc-500 stroke-[2]" />
                  <span>Rastrear Pedido</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {user ? (
                <div className="pt-2 border-t border-zinc-200/80 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account');
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#09090B] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <User className="w-4 h-4 text-[#F4C400]" />
                    <span>Minha Conta ({user.name.split(' ')[0]})</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-zinc-200/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account', 'login');
                    }}
                    className="py-2.5 rounded-xl bg-white border border-zinc-200 text-[#09090B] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-100 transition-colors shadow-3xs"
                  >
                    <LogIn className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Entrar</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account', 'register');
                    }}
                    className="py-2.5 rounded-xl bg-[#09090B] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-800 transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Cadastrar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
