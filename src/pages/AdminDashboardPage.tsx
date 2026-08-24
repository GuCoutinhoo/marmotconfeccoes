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
      <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-24 px-4 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#71717A]">
          Verificando Permissões Administrativas...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-16 flex items-center justify-center px-4">
        <div className="bg-white border border-[#E4E4E7] p-8 md:p-10 rounded-2xl max-w-md w-full space-y-6 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black uppercase text-[#18181B] tracking-tight">
              ACESSO RESTRITO
            </h1>
            <p className="text-xs text-[#71717A] mt-2 leading-relaxed">
              Esta área é exclusiva para administradores da MARMOT. É necessário autenticar com uma conta autorizada.
            </p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold text-[#18181B]">Conectado como Cliente:</p>
                <p className="font-mono text-[11px] text-amber-700 mt-0.5">{user.email}</p>
                <p className="text-[10px] text-[#71717A] mt-1">
                  Sua conta atual não possui o privilégio <span className="font-mono text-[#B45309]">role = "admin"</span>.
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
              className="w-full bg-[#0B0B0E] text-white hover:bg-[#27272A] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {user ? 'TROCAR DE CONTA / LOGIN ADMIN' : 'FAZER LOGIN COMO ADMINISTRADOR'}
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-[#F8F9FA] hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] font-bold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer"
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
    <div className="bg-[#F6F6F3] text-[#171717] min-h-screen py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: 'Painel ERP Admin', onClick: () => onNavigate('admin') }]} />

        {/* Top Header Bar */}
        <div className="bg-white border border-[#E5E5E1] p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F0C84B] text-[#171717] flex items-center justify-center font-black text-lg shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> MARMOT ERP • SISTEMA DE GESTÃO INTEGRADA
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-[#171717] tracking-tight">
                PAINEL OPERACIONAL & ADMINISTRATIVO
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => onNavigate('home')}
              className="bg-[#F9F9F7] hover:bg-[#F0F0ED] border border-[#E5E5E1] text-[#171717] text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-[#B45309]" /> Ver Loja <ExternalLink className="w-3 h-3 text-[#6B6B66]" />
            </button>

            <button
              onClick={async () => {
                await logout();
                onNavigate('home');
              }}
              className="bg-[#F9F9F7] hover:bg-red-50 text-[#6B6B66] hover:text-red-600 border border-[#E5E5E1] text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        {/* ERP Main Layout: Left Sidebar Navigation + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-3 bg-white border border-[#E5E5E1] rounded-2xl p-4 space-y-6 shadow-sm sticky top-24">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B66] px-3">
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-[#171717] text-white font-black shadow-xs'
                            : 'text-[#6B6B66] hover:text-[#171717] hover:bg-[#F9F9F7]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F0C84B]' : 'text-[#6B6B66]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-[#F0C84B] text-[#171717]'
                                  : 'bg-red-50 text-red-600 border border-red-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && !item.badge && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-zinc-800 text-zinc-300'
                                  : 'bg-[#F9F9F7] text-[#6B6B66] border border-[#E5E5E1]'
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
          <div className="lg:col-span-9 bg-white border border-[#E5E5E1] rounded-2xl p-6 shadow-sm">
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
