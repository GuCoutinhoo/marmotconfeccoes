import React, { useRef, useEffect } from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  KeyRound,
  Truck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Crown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, param?: string) => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose, onNavigate }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, logout, orders } = useAuth();
  const { wishlistCount } = useWishlist();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (page: string, param?: string) => {
    onClose();
    onNavigate(page, param);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <div
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-lg border border-[#E4E4E7] bg-white p-0 text-[#18181B] shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-[100] animate-fadeIn overflow-hidden"
    >
      {/* ========================================================= */}
      {/* 1. CABEÇALHO DO DROPDOWN */}
      {/* ========================================================= */}
      {user ? (
        <div className="border-b border-[#E4E4E7] bg-gradient-to-b from-[#F8F9FA] to-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Avatar com badge */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#27272A] bg-[#18181B] font-black text-[#F4C400] shadow-sm text-base">
                {isAdmin ? (
                  <Crown className="h-5 w-5 text-[#F4C400]" />
                ) : (
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22C55E] ring-2 ring-white">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white stroke-[3]" />
                </span>
              </div>

              {/* Informações do usuário */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-bold text-sm text-[#18181B]">
                    {user.name}
                  </p>
                </div>
                <p className="truncate font-mono text-[11px] text-[#71717A]">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Role Badge */}
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#18181B] border border-[#27272A] px-2 py-0.5 font-mono text-[9.5px] font-black uppercase tracking-wider text-[#F4C400]">
                ADMIN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-[#F4F4F5] border border-[#E4E4E7] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#52525B]">
                MEMBRO
              </span>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-[#E4E4E7] pt-2.5">
            <button
              type="button"
              onClick={() => handleAction('account', 'orders')}
              className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-3 py-1.5 text-left border border-[#E4E4E7] hover:border-[#18181B] hover:bg-white transition-all cursor-pointer"
            >
              <span className="font-mono text-[10px] uppercase text-[#71717A]">Pedidos</span>
              <span className="font-mono text-xs font-bold text-[#18181B]">{orders.length}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAction('account', 'wishlist')}
              className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-3 py-1.5 text-left border border-[#E4E4E7] hover:border-[#18181B] hover:bg-white transition-all cursor-pointer"
            >
              <span className="font-mono text-[10px] uppercase text-[#71717A]">Favoritos</span>
              <span className="font-mono text-xs font-bold text-[#18181B]">{wishlistCount}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="border-b border-[#E4E4E7] bg-gradient-to-b from-[#F8F9FA] to-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E4E4E7] bg-[#F4F4F5] text-[#18181B]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#18181B]">Conta MARMOT®</p>
              <p className="font-mono text-[11px] text-[#71717A]">Faça login para gerenciar seus pedidos</p>
            </div>
          </div>

          {/* Botões de Acesso Rápido */}
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleAction('account', 'login')}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#F4C400] px-3 py-2 font-bold text-xs uppercase tracking-wider text-[#0B0B0E] shadow-sm transition-transform hover:bg-[#E5B500] active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => handleAction('account', 'register')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 font-bold text-xs uppercase tracking-wider text-[#18181B] transition-colors hover:bg-[#F4F4F5] hover:border-[#18181B] cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Cadastrar</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LISTA DE FUNÇÕES REAIS E NAVEGAÇÃO */}
      {/* ========================================================= */}
      <div className="p-2 space-y-0.5">
        {/* PAINEL ADMIN DESTAQUE (SE FOR ADMIN) */}
        {isAdmin && (
          <div className="mb-1 pb-1 border-b border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => handleAction('admin')}
              className="group flex w-full items-center justify-between rounded-lg bg-[#18181B] border border-[#27272A] px-3 py-2.5 text-left text-xs font-black uppercase tracking-wider text-white hover:bg-[#27272A] transition-all cursor-pointer shadow-sm"
            >
              <span className="flex items-center gap-2.5">
                <ShieldAlert className="h-4 w-4 text-[#F4C400]" />
                <span>Painel Administrativo</span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#A1A1AA] transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
            </button>
          </div>
        )}

        {/* MEUS PEDIDOS */}
        <button
          type="button"
          onClick={() => handleAction('account', 'orders')}
          className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Package className="h-4 w-4 text-[#71717A] group-hover:text-[#18181B] transition-colors" />
            <span>Meus Pedidos</span>
          </span>
          <div className="flex items-center gap-1.5">
            {orders.length > 0 && (
              <span className="rounded bg-[#F4F4F5] border border-[#E4E4E7] px-1.5 py-0.2 font-mono text-[10px] text-[#52525B]">
                {orders.length}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#18181B] transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* LISTA DE DESEJOS / FAVORITOS */}
        <button
          type="button"
          onClick={() => handleAction('account', 'wishlist')}
          className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Heart className="h-4 w-4 text-[#71717A] group-hover:text-[#18181B] transition-colors" />
            <span>Lista de Desejos</span>
          </span>
          <div className="flex items-center gap-1.5">
            {wishlistCount > 0 && (
              <span className="rounded-full bg-[#18181B] text-[#F4C400] px-2 py-0.2 font-mono text-[10px] font-bold">
                {wishlistCount}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#18181B] transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* MEUS ENDEREÇOS */}
        <button
          type="button"
          onClick={() => handleAction('account', 'addresses')}
          className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-[#71717A] group-hover:text-[#18181B] transition-colors" />
            <span>Endereços de Entrega</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#18181B] transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* DADOS DO PERFIL */}
        <button
          type="button"
          onClick={() => handleAction('account', 'profile')}
          className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-[#71717A] group-hover:text-[#18181B] transition-colors" />
            <span>Dados Cadastrais</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#18181B] transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* SEGURANÇA & SENHA */}
        <button
          type="button"
          onClick={() => handleAction('account', 'security')}
          className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <KeyRound className="h-4 w-4 text-[#71717A] group-hover:text-[#18181B] transition-colors" />
            <span>Segurança & Senha</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#18181B] transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* RASTREAR PEDIDO DIRETO */}
        <button
          type="button"
          onClick={() => handleAction('tracking')}
          className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors border-t border-[#E4E4E7] pt-2 mt-1 cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-[#71717A] group-hover:text-[#18181B]" />
            <span>Rastrear Envio</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#18181B] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. RODAPÉ DO DROPDOWN: LOGOUT / DICAS */}
      {/* ========================================================= */}
      {user ? (
        <div className="border-t border-[#E4E4E7] bg-[#F8F9FA] p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      ) : (
        <div className="border-t border-[#E4E4E7] bg-[#F8F9FA] px-3 py-2 flex items-center justify-between text-[10px] font-mono text-[#71717A]">
          <span>SUPORTE MARMOT</span>
          <span className="text-[#18181B] font-bold">SEG - SEX 9h às 18h</span>
        </div>
      )}
    </div>
  );
};
