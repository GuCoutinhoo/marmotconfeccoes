import React, { useState, useEffect } from 'react';
import { AdminReportData } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  QrCode,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Percent
} from 'lucide-react';

export const AdminReportsTab: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'year'>('this_month');
  const [report, setReport] = useState<AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`, {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const exportCSV = () => {
    if (!report) return;
    const rows = [
      ['Data', 'Faturamento (R$)', 'Pedidos'],
      ...report.salesTimeline.map((item) => [item.date, item.revenue.toFixed(2), item.orders.toString()]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio-vendas-marmot-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const salesData = report?.salesTimeline || [];
  const maxRevenue = Math.max(...salesData.map((d) => d.revenue), 100);

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5E5E1] p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h3 className="text-base font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#B45309]" /> Relatórios & Inteligência Financeira
          </h3>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Análise aprofundada de receitas, ticket médio, meios de pagamento e produtos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#F9F9F7] border border-[#E5E5E1] p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === 'today' ? 'bg-[#F0C84B] text-black shadow-xs' : 'text-[#6B6B66] hover:text-[#171717]'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === '7days' ? 'bg-[#F0C84B] text-black shadow-xs' : 'text-[#6B6B66] hover:text-[#171717]'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === '30days' ? 'bg-[#F0C84B] text-black shadow-xs' : 'text-[#6B6B66] hover:text-[#171717]'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === 'this_month' ? 'bg-[#F0C84B] text-black shadow-xs' : 'text-[#6B6B66] hover:text-[#171717]'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === 'year' ? 'bg-[#F0C84B] text-black shadow-xs' : 'text-[#6B6B66] hover:text-[#171717]'
              }`}
            >
              Ano
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] text-xs font-bold text-[#171717] rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            title="Exportar dados em CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#B45309]" /> Exportar CSV
          </button>

          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="p-2 bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] rounded-xl text-[#6B6B66] hover:text-[#171717] shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#B45309]' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <p className="text-[10px] text-[#6B6B66] uppercase font-bold">Receita Bruta</p>
          <p className="text-2xl font-black text-[#171717]">
            R$ {(report?.grossRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#6B6B66]">{report?.totalOrders ?? 0} pedidos faturados</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <p className="text-[10px] text-[#6B6B66] uppercase font-bold">Receita Líquida Estimada</p>
          <p className="text-2xl font-black text-emerald-700">
            R$ {(report?.netRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#6B6B66]">Deduzidos fretes e taxas</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <p className="text-[10px] text-[#6B6B66] uppercase font-bold">Ticket Médio</p>
          <p className="text-2xl font-black text-[#B45309]">
            R$ {(report?.averageTicket ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#6B6B66]">Por transação aprovada</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <p className="text-[10px] text-[#6B6B66] uppercase font-bold">Taxa de Cancelamento</p>
          <p className="text-2xl font-black text-amber-700">
            {(report?.cancellationRate ?? 0).toFixed(1)}%
          </p>
          <p className="text-[11px] text-[#6B6B66]">Devoluções: {(report?.returnRate ?? 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* Sales Evolution Chart */}
      <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl space-y-4 shadow-xs">
        <h4 className="text-sm font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#B45309]" /> Linha do Tempo de Faturamento
        </h4>

        <div className="relative w-full overflow-x-auto">
          {salesData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-[#6B6B66] font-mono">
              Sem movimentações no período selecionado.
            </div>
          ) : (
            <div className="min-w-[600px]">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-52 overflow-visible">
                <defs>
                  <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0C84B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F0C84B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = paddingY + ratio * chartH;
                  const value = Math.round(maxRevenue * (1 - ratio));
                  return (
                    <g key={i}>
                      <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#E5E5E1" strokeDasharray="3 3" />
                      <text x={paddingX - 8} y={y + 3} fill="#999" fontSize="9" fontFamily="monospace" textAnchor="end">
                        R${value}
                      </text>
                    </g>
                  );
                })}

                {areaD && <path d={areaD} fill="url(#repGrad)" />}
                {pathD && <path d={pathD} fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                {points.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r="3.5" fill="#FFFFFF" stroke="#B45309" strokeWidth="2" />
                    <text x={pt.x} y={svgHeight - 8} fill="#6B6B66" fontSize="9" fontFamily="monospace" textAnchor="middle">
                      {pt.date.slice(5).replace('-', '/')}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Split: Payment Methods Breakdown & Top Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-4 shadow-xs">
          <h4 className="text-sm font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#B45309]" /> Meios de Pagamento
          </h4>

          <div className="space-y-3 font-mono text-xs">
            {(report?.paymentMethodsBreakdown || []).map((pm, idx) => (
              <div key={idx} className="p-3 bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold uppercase text-[#171717]">
                  {pm.method === 'pix' ? (
                    <QrCode className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-[#B45309]" />
                  )}
                  <span>{pm.method}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#171717]">
                    R$ {pm.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-[#6B6B66]">{pm.count} transações ({pm.percentage.toFixed(1)}%)</p>
                </div>
              </div>
            ))}

            {(!report?.paymentMethodsBreakdown || report.paymentMethodsBreakdown.length === 0) && (
              <p className="text-xs text-[#6B6B66] font-mono text-center py-4">Sem dados de pagamento no período.</p>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-4 shadow-xs">
          <h4 className="text-sm font-black uppercase text-[#171717] tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B45309]" /> Categorias Mais Vendidas
          </h4>

          <div className="space-y-3 font-mono text-xs">
            {(report?.topCategories || []).map((cat, idx) => (
              <div key={idx} className="p-3 bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold uppercase text-[#171717]">{cat.category}</p>
                  <p className="text-[10px] text-[#6B6B66]">{cat.count} unidades vendidas</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#B45309]">
                    R$ {cat.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}

            {(!report?.topCategories || report.topCategories.length === 0) && (
              <p className="text-xs text-[#6B6B66] font-mono text-center py-4">Sem dados de categorias no período.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
