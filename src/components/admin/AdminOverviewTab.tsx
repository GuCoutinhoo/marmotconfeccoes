import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Truck,
  RotateCcw,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AdminOverviewMetrics } from '../../types';

interface AdminOverviewTabProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { products } = useStore();
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'this_month'>('30days');
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; revenue: number; orders: number; x: number; y: number } | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/overview?period=${period}`, {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching overview metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [period]);

  const salesData = metrics?.salesByDay || [];
  const maxRevenue = Math.max(...salesData.map((d) => d.revenue), 100);

  // SVG dimensions for real chart
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const points = salesData.map((d, index) => {
    const x = paddingX + (index / Math.max(1, salesData.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.revenue / maxRevenue) * chartH;
    return { ...d, x, y };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5E5E1] p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0C84B]/15 border border-[#F0C84B]/40 flex items-center justify-center text-[#B45309]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase text-[#171717] tracking-tight">
              Central de Comando & Visão Geral
            </h2>
            <p className="text-xs text-[#6B6B66]">
              Indicadores operacionais e financeiros em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'today'
                  ? 'bg-[#F0C84B] text-[#171717] shadow-xs'
                  : 'text-[#6B6B66] hover:text-[#171717] hover:bg-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === '7days'
                  ? 'bg-[#F0C84B] text-[#171717] shadow-xs'
                  : 'text-[#6B6B66] hover:text-[#171717] hover:bg-white'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === '30days'
                  ? 'bg-[#F0C84B] text-[#171717] shadow-xs'
                  : 'text-[#6B6B66] hover:text-[#171717] hover:bg-white'
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'this_month'
                  ? 'bg-[#F0C84B] text-[#171717] shadow-xs'
                  : 'text-[#6B6B66] hover:text-[#171717] hover:bg-white'
              }`}
            >
              Este Mês
            </button>
          </div>

          <button
            onClick={fetchOverview}
            disabled={isLoading}
            title="Atualizar Dados"
            className="p-2 bg-[#F9F9F7] hover:bg-[#F0F0ED] border border-[#E5E5E1] rounded-xl text-[#6B6B66] hover:text-[#171717] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#B45309]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Hoje */}
        <div className="bg-white border border-[#E5E5E1] hover:border-[#D4D4CE] p-5 rounded-2xl space-y-3 transition-all relative overflow-hidden group shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B6B66]">
              Faturamento Hoje
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#171717] tracking-tight">
              R$ {(metrics?.revenueToday ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#6B6B66] mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B45309]" />
              <span className="font-mono text-[#171717] font-bold">{metrics?.ordersToday ?? 0}</span> pedidos registrados hoje
            </p>
          </div>
          <div className="h-1.5 w-full bg-[#F0F0ED] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-3/4" />
          </div>
        </div>

        {/* Faturamento Período */}
        <div className="bg-white border border-[#E5E5E1] hover:border-[#D4D4CE] p-5 rounded-2xl space-y-3 transition-all relative overflow-hidden group shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B6B66]">
              Receita no Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F0C84B]/20 border border-[#F0C84B]/40 flex items-center justify-center text-[#B45309]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#B45309] tracking-tight">
              R$ {(metrics?.revenueThisMonth ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#6B6B66] mt-1 flex items-center gap-1.5">
              <span>Ticket Médio:</span>
              <span className="font-mono text-[#171717] font-bold">
                R$ {(metrics?.averageTicket ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <div className="h-1.5 w-full bg-[#F0F0ED] rounded-full overflow-hidden">
            <div className="h-full bg-[#F0C84B] rounded-full w-4/5" />
          </div>
        </div>

        {/* Pedidos para Envio */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="cursor-pointer bg-white border border-[#E5E5E1] hover:border-[#F0C84B] p-5 rounded-2xl space-y-3 transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B6B66]">
              Aguardando Envio
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#171717] tracking-tight">
              {metrics?.ordersAwaitingShipment ?? 0}
            </p>
            <p className="text-[11px] text-amber-700 font-bold mt-1 flex items-center gap-1">
              Prontos para expedição <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
          <div className="h-1.5 w-full bg-[#F0F0ED] rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-2/3" />
          </div>
        </div>

        {/* Devoluções / Alertas */}
        <div
          onClick={() => onNavigateTab('returns')}
          className="cursor-pointer bg-white border border-[#E5E5E1] hover:border-red-300 p-5 rounded-2xl space-y-3 transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B6B66]">
              Devoluções Pendentes
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#171717] tracking-tight">
              {metrics?.pendingReturns ?? 0}
            </p>
            <p className="text-[11px] text-[#6B6B66] mt-1 flex items-center gap-1">
              Estoque baixo: <span className="font-mono text-amber-700 font-bold">{metrics?.lowStockCount ?? 0} itens</span>
            </p>
          </div>
          <div className="h-1.5 w-full bg-[#F0F0ED] rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full w-1/3" />
          </div>
        </div>
      </div>

      {/* Interactive Sales Chart */}
      <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E1] pb-5">
          <div>
            <h3 className="text-base font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#B45309]" />
              Curva de Vendas e Faturamento
            </h3>
            <p className="text-xs text-[#6B6B66] mt-0.5">
              Evolução diária de receita e volume de pedidos concluídos
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F0C84B]" />
              <span className="text-[#6B6B66] font-bold">Faturamento (R$)</span>
            </div>
          </div>
        </div>

        {/* SVG Curve */}
        <div className="relative w-full overflow-x-auto">
          {salesData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#6B6B66] font-mono">
              Nenhum dado de vendas registrado para este período.
            </div>
          ) : (
            <div className="min-w-[600px] relative">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-56 overflow-visible"
              >
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0C84B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#F0C84B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = paddingY + ratio * chartH;
                  const value = Math.round(maxRevenue * (1 - ratio));
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#E8E8E4"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 3}
                        fill="#777770"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        R${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Area */}
                {areaD && <path d={areaD} fill="url(#salesGrad)" />}

                {/* Line Path */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#D6A728"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((pt, idx) => (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#FFFFFF"
                      stroke="#D6A728"
                      strokeWidth="2"
                      className="transition-all hover:r-6 hover:fill-[#F0C84B]"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text
                      x={pt.x}
                      y={svgHeight - 8}
                      fill="#777770"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.date.slice(5).replace('-', '/')}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Tooltip on hover */}
              {hoveredPoint && (
                <div
                  className="absolute bg-white border border-[#E5E5E1] p-3 rounded-xl text-xs space-y-1 shadow-xl pointer-events-none z-10 font-mono"
                  style={{
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                    top: `${(hoveredPoint.y / svgHeight) * 100 - 30}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <p className="text-[#6B6B66] text-[10px] uppercase font-bold">{hoveredPoint.date}</p>
                  <p className="text-[#B45309] font-black text-sm">
                    R$ {hoveredPoint.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[#171717] text-[10px] font-bold">{hoveredPoint.orders} pedido(s)</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Split: Status Distribution + Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-4">
            <div>
              <h3 className="text-sm font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#B45309]" />
                Distribuição por Status
              </h3>
              <p className="text-xs text-[#6B6B66]">Visão operacional do fluxo de pedidos</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#B45309] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver Todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(metrics?.ordersByStatus || []).map((item, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateTab('orders')}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F9F9F7] border border-[#E5E5E1] hover:border-[#D4D4CE] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color || '#D6B35A' }}
                  />
                  <span className="text-xs font-bold text-[#171717]">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#171717] bg-white px-2.5 py-1 rounded-lg border border-[#E5E5E1] shadow-2xs">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}

            {(!metrics?.ordersByStatus || metrics.ordersByStatus.length === 0) && (
              <p className="text-xs text-[#6B6B66] font-mono text-center py-6">
                Nenhum pedido em processamento no momento.
              </p>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-4">
            <div>
              <h3 className="text-sm font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#B45309]" />
                Produtos Mais Vendidos
              </h3>
              <p className="text-xs text-[#6B6B66]">Itens com maior tração no período</p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-[#B45309] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Catálogo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(metrics?.topProducts || []).slice(0, 4).map((prod, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F9F9F7] border border-[#E5E5E1]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-[#E5E5E1] shrink-0">
                    <img
                      src={prod.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80'}
                      alt={prod.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#171717] truncate">{prod.title}</p>
                    <p className="text-[10px] text-[#6B6B66] font-mono">
                      {prod.salesCount} unidades vendidas
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black font-mono text-[#B45309]">
                    R$ {prod.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-[#6B6B66] font-mono">
                    Estoque: <span className={prod.stock < 10 ? 'text-amber-600 font-bold' : 'text-[#6B6B66]'}>{prod.stock}</span>
                  </p>
                </div>
              </div>
            ))}

            {(!metrics?.topProducts || metrics.topProducts.length === 0) && (
              <p className="text-xs text-[#6B6B66] font-mono text-center py-6">
                Nenhuma venda computada no catálogo para o período.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Banner */}
      <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h4 className="text-sm font-black uppercase text-[#171717] tracking-tight">
            Atalhos Operacionais Rápidos
          </h4>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Acesse rapidamente as rotinas essenciais de expedição e gestão
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('shipping')}
            className="px-4 py-2.5 bg-white hover:bg-[#F0F0ED] border border-[#E5E5E1] text-[#171717] text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Truck className="w-3.5 h-3.5 text-[#B45309]" /> Expedição & Fretes
          </button>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-4 py-2.5 bg-white hover:bg-[#F0F0ED] border border-[#E5E5E1] text-[#171717] text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Package className="w-3.5 h-3.5 text-[#B45309]" /> Ajustar Estoque
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="px-4 py-2.5 bg-[#F0C84B] hover:bg-[#E5B82A] text-[#171717] text-xs font-black uppercase rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Relatório Completo
          </button>
        </div>
      </div>
    </div>
  );
};
