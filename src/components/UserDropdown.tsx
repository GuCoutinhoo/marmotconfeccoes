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
      {/* 1. CABEÇALHO & ITENS DO DROPDOWN */}
      {/* ========================================================= */}
      {user ? (
        <div className="border-b border-zinc-100 bg-zinc-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Avatar com badge */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111113] font-black text-[#F4C400] text-sm shadow-sm">
                {isAdmin ? (
                  <Crown className="h-4 w-4 text-[#F4C400]" />
                ) : (
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                  <CheckCircle2 className="h-2 w-2 text-white stroke-[3]" />
                </span>
              </div>

              {/* Informações do usuário */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-sm text-zinc-900 leading-snug">
                  {user.name}
                </p>
                <p className="truncate font-mono text-[11px] text-zinc-500">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Role Badge */}
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#111113] px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#F4C400]">
                ADMIN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                MEMBRO
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="border-b border-zinc-100 bg-zinc-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-800">
              <User className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <p className="font-black text-xs uppercase tracking-widest text-zinc-900">CONTA MARMOT®</p>
              <p className="text-[11px] text-zinc-500 font-normal">Acesse para pedidos e benefícios</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LISTA DE FUNÇÕES REAIS E NAVEGAÇÃO */}
      {/* ========================================================= */}
      <div className="p-2 space-y-0.5">
        {!user ? (
          <>
            {/* ENTRAR */}
            <button
              type="button"
              onClick={() => handleAction('account', 'login')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-900 hover:bg-[#F4C400] hover:text-[#0B0B0E] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <LogIn className="h-4 w-4 stroke-[2.2]" />
                <span>Entrar</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* CRIAR CONTA */}
            <button
              type="button"
              onClick={() => handleAction('account', 'register')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-900 hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <UserPlus className="h-4 w-4 stroke-[2.2] text-zinc-600 group-hover:text-zinc-900" />
                <span>Criar Conta</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
            </button>

            <div className="my-1 border-t border-zinc-100" />

            {/* MEUS PEDIDOS */}
            <button
              type="button"
              onClick={() => handleAction('account', 'orders')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Meus Pedidos</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* RASTREAR PEDIDO */}
            <button
              type="button"
              onClick={() => handleAction('tracking')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Rastrear Pedido</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* LISTA DE DESEJOS */}
            <button
              type="button"
              onClick={() => handleAction('account', 'wishlist')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Heart className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Favoritos</span>
              </span>
              {wishlistCount > 0 && (
                <span className="rounded-full bg-[#111113] text-[#F4C400] px-1.5 py-0.2 font-mono text-[9px] font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            {/* PAINEL ADMIN DESTAQUE (SE FOR ADMIN) */}
            {isAdmin && (
              <div className="mb-1 pb-1 border-b border-zinc-100">
                <button
                  type="button"
                  onClick={() => handleAction('admin')}
                  className="group flex w-full items-center justify-between rounded-md bg-[#111113] px-3 py-2.5 text-left text-xs font-black uppercase tracking-wider text-white hover:bg-black transition-all cursor-pointer shadow-sm"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldAlert className="h-4 w-4 text-[#F4C400]" />
                    <span>Painel Administrativo</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </button>
              </div>
            )}

            {/* MEUS PEDIDOS */}
            <button
              type="button"
              onClick={() => handleAction('account', 'orders')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Meus Pedidos</span>
              </span>
              <div className="flex items-center gap-1.5">
                {orders.length > 0 && (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.2 font-mono text-[10px] text-zinc-600 font-bold">
                    {orders.length}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* RASTREAR PEDIDO */}
            <button
              type="button"
              onClick={() => handleAction('tracking')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Rastrear Pedido</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* LISTA DE DESEJOS / FAVORITOS */}
            <button
              type="button"
              onClick={() => handleAction('account', 'wishlist')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Heart className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Lista de Desejos</span>
              </span>
              <div className="flex items-center gap-1.5">
                {wishlistCount > 0 && (
                  <span className="rounded-full bg-[#111113] text-[#F4C400] px-2 py-0.2 font-mono text-[10px] font-bold">
                    {wishlistCount}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* MEUS ENDEREÇOS */}
            <button
              type="button"
              onClick={() => handleAction('account', 'addresses')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Endereços de Entrega</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* DADOS DO PERFIL */}
            <button
              type="button"
              onClick={() => handleAction('account', 'profile')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Dados Cadastrais</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* SEGURANÇA & SENHA */}
            <button
              type="button"
              onClick={() => handleAction('account', 'security')}
              className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <KeyRound className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                <span>Segurança & Senha</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. RODAPÉ DO DROPDOWN: LOGOUT / DICAS */}
      {/* ========================================================= */}
      {user ? (
        <div className="border-t border-zinc-100 bg-zinc-50/80 p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      ) : (
        <div className="border-t border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span className="uppercase tracking-wider">MARMOT STREETWEAR</span>
          <span className="text-zinc-900 font-bold">EST. 2026</span>
        </div>
      )}
    </div>
  );
};
