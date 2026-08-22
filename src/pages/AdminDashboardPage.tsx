import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/Breadcrumb';

// Admin Tab Components
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminShipmentsTab } from '../components/admin/AdminShipmentsTab';
import { AdminReturnsTab } from '../components/admin/AdminReturnsTab';
import { AdminCustomersTab } from '../components/admin/AdminCustomersTab';
import { AdminPaymentsTab } from '../components/admin/AdminPaymentsTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminInventoryTab } from '../components/admin/AdminInventoryTab';
import { AdminCouponsTab } from '../components/admin/AdminCouponsTab';
import { AdminBannersTab } from '../components/admin/AdminBannersTab';
import { AdminReportsTab } from '../components/admin/AdminReportsTab';
import { AdminActivityLogsTab } from '../components/admin/AdminActivityLogsTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminNewsletterTab } from '../components/admin/AdminNewsletterTab';
import { AdminReviewsTab } from '../components/admin/AdminReviewsTab';
import { AdminEmailLogsTab } from '../components/admin/AdminEmailLogsTab';

import {
  Activity,
  ShoppingBag,
  Truck,
  RotateCcw,
  Users,
  CreditCard,
  Package,
  FolderTree,
  Boxes,
  Tag,
  Image as ImageIcon,
  TrendingUp,
  FileText,
  Settings,
  Lock,
  LogOut,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  Store,
  Mail,
  Star,
  Inbox
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (page: string, param?: string) => void;
}

type AdminTab =
  | 'overview'
  | 'orders'
  | 'shipping'
  | 'returns'
  | 'customers'
  | 'payments'
  | 'products'
  | 'reviews'
  | 'categories'
  | 'inventory'
  | 'coupons'
  | 'banners'
  | 'newsletter'
  | 'email_logs'
  | 'reports'
  | 'activity_logs'
  | 'settings';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isLoading, logout, allOrders } = useAuth();
  const { categories, products } = useStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic counts for badges
  const pendingOrdersCount = allOrders.filter(
    (o) => o.status === 'Aguardando Pagamento' || o.status === 'Pagamento Pendente' || o.status === 'Pagamento Aprovado'
  ).length;

  const lowStockCount = products.filter((p) => (p.stockCount ?? 20) <= 5).length;

  if (isLoading) {
    return (
      <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-24 px-4 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#D6B35A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#777777]">
          Verificando Permissões Administrativas...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-16 flex items-center justify-center px-4">
        <div className="bg-[#161616] border border-[#262626] p-8 md:p-10 rounded-2xl max-w-md w-full space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-950/40 text-red-400 border border-red-800/60 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black uppercase text-[#EFECE6] tracking-tight">
              ACESSO RESTRITO
            </h1>
            <p className="text-xs text-[#777777] mt-2 leading-relaxed">
              Esta área é exclusiva para administradores da MARMOT. É necessário autenticar com uma conta autorizada.
            </p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="bg-amber-950/40 border border-amber-800/60 text-amber-300 p-3.5 rounded-xl text-xs flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#EFECE6]">Conectado como Cliente:</p>
                <p className="font-mono text-[11px] text-amber-400 mt-0.5">{user.email}</p>
                <p className="text-[10px] text-[#A0A0A0] mt-1">
                  Sua conta atual não possui o privilégio <span className="font-mono text-[#D6B35A]">role = "admin"</span>.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                if (user) logout();
                onNavigate('account');
              }}
              className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {user ? 'TROCAR DE CONTA / LOGIN ADMIN' : 'FAZER LOGIN COMO ADMINISTRADOR'}
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-[#080808] hover:bg-[#222222] border border-[#262626] text-[#777777] hover:text-[#EFECE6] font-bold text-xs uppercase py-3 rounded-xl transition-all"
            >
              Voltar para a Loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Group items
  const menuGroups = [
    {
      label: 'PAINEL',
      items: [
        { id: 'overview' as AdminTab, label: 'Visão Geral', icon: Activity },
      ],
    },
    {
      label: 'OPERAÇÃO',
      items: [
        { id: 'orders' as AdminTab, label: 'Pedidos', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
        { id: 'shipping' as AdminTab, label: 'Envio & Expedição', icon: Truck },
        { id: 'returns' as AdminTab, label: 'Trocas & Devoluções', icon: RotateCcw },
        { id: 'customers' as AdminTab, label: 'Clientes', icon: Users },
        { id: 'payments' as AdminTab, label: 'Pagamentos', icon: CreditCard },
      ],
    },
    {
      label: 'LOJA',
      items: [
        { id: 'products' as AdminTab, label: 'Produtos', icon: Package, count: products.length },
        { id: 'reviews' as AdminTab, label: 'Avaliações de Produtos', icon: Star },
        { id: 'categories' as AdminTab, label: 'Categorias', icon: FolderTree, count: categories.length },
        { id: 'inventory' as AdminTab, label: 'Estoque & Movimentações', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined },
        { id: 'coupons' as AdminTab, label: 'Cupons', icon: Tag },
        { id: 'banners' as AdminTab, label: 'Banners & Destaques', icon: ImageIcon },
      ],
    },
    {
      label: 'MARKETING & COMUNICAÇÃO',
      items: [
        { id: 'newsletter' as AdminTab, label: 'Newsletter & Drops', icon: Mail },
        { id: 'email_logs' as AdminTab, label: 'Logs de E-mail', icon: Inbox },
      ],
    },
    {
      label: 'GESTÃO',
      items: [
        { id: 'reports' as AdminTab, label: 'Relatórios de Vendas', icon: TrendingUp },
        { id: 'activity_logs' as AdminTab, label: 'Logs de Atividades', icon: FileText },
        { id: 'settings' as AdminTab, label: 'Configurações da Loja', icon: Settings },
      ],
    },
  ];

  return (
    <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: 'Painel ERP Admin', onClick: () => onNavigate('admin') }]} />

        {/* Top Header Bar */}
        <div className="bg-[#141414] border border-[#222222] p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#D6B35A]/10 border border-[#D6B35A]/30 flex items-center justify-center text-[#D6B35A] font-black text-lg">
              M
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D6B35A] uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> MARMOT ERP • SISTEMA DE GESTÃO INTEGRADA
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-[#EFECE6] tracking-tight">
                PAINEL OPERACIONAL & ADMINISTRATIVO
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => onNavigate('home')}
              className="bg-[#080808] hover:bg-[#222] border border-[#262626] text-[#EFECE6] text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-[#D6B35A]" /> Ver Loja <ExternalLink className="w-3 h-3 text-[#777]" />
            </button>

            <button
              onClick={async () => {
                await logout();
                onNavigate('home');
              }}
              className="bg-[#080808] hover:bg-red-950/40 text-[#777777] hover:text-red-400 border border-[#262626] text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        {/* ERP Main Layout: Left Sidebar Navigation + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-3 bg-[#141414] border border-[#222222] rounded-2xl p-4 space-y-6 shadow-xl sticky top-24">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] px-3">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all text-left ${
                          isActive
                            ? 'bg-[#D6B35A] text-black font-black shadow-md'
                            : 'text-[#888888] hover:text-[#EFECE6] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-[#D6B35A]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-black text-[#D6B35A]'
                                  : 'bg-red-950 text-red-400 border border-red-800'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && !item.badge && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-black text-[#D6B35A]'
                                  : 'bg-[#080808] text-[#666] border border-[#222]'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Main Content Panel */}
          <div className="lg:col-span-9">
            {activeTab === 'overview' && (
              <AdminOverviewTab onNavigateTab={(tab) => setActiveTab(tab as AdminTab)} />
            )}

            {activeTab === 'orders' && <AdminOrdersTab />}

            {activeTab === 'shipping' && <AdminShipmentsTab />}

            {activeTab === 'returns' && <AdminReturnsTab />}

            {activeTab === 'customers' && <AdminCustomersTab />}

            {activeTab === 'payments' && <AdminPaymentsTab />}

            {activeTab === 'products' && (
              <AdminProductsTab onNavigateToProduct={(id) => onNavigate('product', id)} />
            )}

            {activeTab === 'reviews' && <AdminReviewsTab />}

            {activeTab === 'categories' && <AdminCategoriesTab />}

            {activeTab === 'inventory' && <AdminInventoryTab />}

            {activeTab === 'coupons' && <AdminCouponsTab />}

            {activeTab === 'banners' && <AdminBannersTab />}

            {activeTab === 'newsletter' && <AdminNewsletterTab />}

            {activeTab === 'email_logs' && <AdminEmailLogsTab />}

            {activeTab === 'reports' && <AdminReportsTab />}

            {activeTab === 'activity_logs' && <AdminActivityLogsTab />}

            {activeTab === 'settings' && <AdminSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};
