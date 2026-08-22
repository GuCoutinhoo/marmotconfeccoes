import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Product, InventoryMovement } from '../../types';
import {
  Package,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Minus,
  Edit2,
  X,
  History,
  CheckCircle2,
  Loader2,
  Filter
} from 'lucide-react';

export const AdminInventoryTab: React.FC = () => {
  const { products, updateProduct } = useStore();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'movements'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Movements state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('manual_adjustment');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchMovements = async () => {
    setLoadingMovements(true);
    try {
      const res = await fetch('/api/admin/inventory/movements', {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
      }
    } catch (err) {
      console.error('Error fetching inventory movements:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'movements') {
      fetchMovements();
    }
  }, [activeSubTab]);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.title.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term));

    const stock = p.stockCount ?? 20;
    let matchesStock = true;
    if (stockStatusFilter === 'low') {
      matchesStock = stock > 0 && stock <= 5;
    } else if (stockStatusFilter === 'out') {
      matchesStock = stock <= 0;
    }

    return matchesSearch && matchesStock;
  });

  const lowStockCount = products.filter((p) => (p.stockCount ?? 20) <= 5 && (p.stockCount ?? 20) > 0).length;
  const outOfStockCount = products.filter((p) => (p.stockCount ?? 20) <= 0).length;

  const handleSaveAdjustment = async () => {
    if (!selectedProduct) return;
    if (quantityChange === 0) {
      showToast('Nenhuma alteração', 'Informe uma quantidade diferente de zero.', 'info');
      return;
    }

    const currentStock = selectedProduct.stockCount ?? 20;
    const newStock = Math.max(0, currentStock + quantityChange);

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/inventory/${selectedProduct.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('marmot_auth_token') || '',
        },
        body: JSON.stringify({
          quantityChange,
          reason: adjustmentReason,
          note: adjustmentNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao ajustar estoque.');

      // Update local store product
      updateProduct({ ...selectedProduct, stockCount: newStock });
      showToast('Estoque Atualizado!', `Estoque do produto "${selectedProduct.title}" agora é ${newStock} un.`, 'success');
      setSelectedProduct(null);
      setQuantityChange(0);
      setAdjustmentNote('');
    } catch (err: any) {
      showToast('Erro ao Ajustar', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Subtab Toggle */}
      <div className="flex items-center justify-between bg-[#141414] border border-[#222222] p-2 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeSubTab === 'catalog'
                ? 'bg-[#D6B35A] text-black shadow-md'
                : 'text-[#888888] hover:text-[#EFECE6]'
            }`}
          >
            <Package className="w-4 h-4" /> Estoque por Produto
          </button>
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
              activeSubTab === 'movements'
                ? 'bg-[#D6B35A] text-black shadow-md'
                : 'text-[#888888] hover:text-[#EFECE6]'
            }`}
          >
            <History className="w-4 h-4" /> Histórico de Movimentações
          </button>
        </div>

        <div className="flex items-center gap-4 px-3 text-xs font-mono">
          {lowStockCount > 0 && (
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} com estoque baixo
            </span>
          )}
          {outOfStockCount > 0 && (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {outOfStockCount} esgotados
            </span>
          )}
        </div>
      </div>

      {activeSubTab === 'catalog' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-[#141414] border border-[#222222] p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto por nome, ID ou SKU..."
                className="w-full bg-[#080808] border border-[#262626] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#EFECE6] placeholder-[#555] focus:outline-none focus:border-[#D6B35A]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setStockStatusFilter('all')}
                className={`px-3 py-2 rounded-xl font-bold uppercase transition-all ${
                  stockStatusFilter === 'all'
                    ? 'bg-[#D6B35A] text-black'
                    : 'bg-[#080808] border border-[#262626] text-[#777]'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setStockStatusFilter('low')}
                className={`px-3 py-2 rounded-xl font-bold uppercase transition-all ${
                  stockStatusFilter === 'low'
                    ? 'bg-[#D6B35A] text-black'
                    : 'bg-[#080808] border border-[#262626] text-[#777]'
                }`}
              >
                Estoque Baixo ({lowStockCount})
              </button>
              <button
                onClick={() => setStockStatusFilter('out')}
                className={`px-3 py-2 rounded-xl font-bold uppercase transition-all ${
                  stockStatusFilter === 'out'
                    ? 'bg-[#D6B35A] text-black'
                    : 'bg-[#080808] border border-[#262626] text-[#777]'
                }`}
              >
                Esgotados ({outOfStockCount})
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#0a0a0a] text-[#777777] font-mono uppercase tracking-wider">
                    <th className="p-4">Produto</th>
                    <th className="p-4">SKU / Categoria</th>
                    <th className="p-4">Preço Base</th>
                    <th className="p-4">Estoque Atual</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ajuste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {filteredProducts.map((prod) => {
                    const stock = prod.stockCount ?? 20;
                    const isOut = stock <= 0;
                    const isLow = stock > 0 && stock <= 5;

                    return (
                      <tr key={prod.id} className="hover:bg-[#181818] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#161616] border border-[#262626] shrink-0">
                              <img
                                src={prod.images?.[0] || prod.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                                alt={prod.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-[#EFECE6]">{prod.title}</p>
                              <p className="text-[10px] text-[#777777] font-mono">{prod.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono">
                          <p className="text-[#EFECE6]">{prod.sku || 'SKU-MARMOT'}</p>
                          <p className="text-[10px] text-[#777777] uppercase">{prod.category || 'Geral'}</p>
                        </td>

                        <td className="p-4 font-mono">
                          <p className="font-bold text-[#EFECE6]">
                            R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </td>

                        <td className="p-4 font-mono">
                          <p className="text-base font-black text-[#D6B35A]">{stock} un.</p>
                          <p className="text-[10px] text-[#777777]">Min: 5 un.</p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              isOut
                                ? 'bg-red-950/40 text-red-400 border-red-800/60'
                                : isLow
                                ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                                : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                            }`}
                          >
                            {isOut ? 'Esgotado' : isLow ? 'Estoque Baixo' : 'Em Estoque'}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedProduct(prod);
                              setQuantityChange(0);
                              setAdjustmentNote('');
                            }}
                            className="px-3 py-1.5 bg-[#080808] hover:bg-[#262626] border border-[#222222] rounded-xl text-xs font-bold text-[#D6B35A] uppercase transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movements Audit Table */
        <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0a0a0a] border-b border-[#222222] flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase text-[#EFECE6] font-mono flex items-center gap-2">
              <History className="w-4 h-4 text-[#D6B35A]" /> Registro de Movimentações de Estoque
            </h3>
            <button
              onClick={fetchMovements}
              disabled={loadingMovements}
              className="p-1.5 hover:bg-[#222] rounded-lg text-[#777] hover:text-[#EFECE6] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMovements ? 'animate-spin text-[#D6B35A]' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#222222] bg-[#0a0a0a] text-[#777777] font-mono uppercase tracking-wider">
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Tipo / Motivo</th>
                  <th className="p-4">Variação</th>
                  <th className="p-4">Estoque Final</th>
                  <th className="p-4">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c]">
                {movements.map((mov) => {
                  const isPositive = mov.quantityChange > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-[#181818] transition-colors">
                      <td className="p-4 font-mono text-[#777777]">
                        {new Date(mov.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[#EFECE6]">{mov.productTitle}</p>
                        <p className="text-[10px] text-[#777777] font-mono">ID: {mov.productId}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-bold uppercase text-[#EFECE6]">{mov.reason}</span>
                        {mov.note && <p className="text-[10px] text-[#777777] italic">{mov.note}</p>}
                      </td>
                      <td className="p-4 font-mono">
                        <span
                          className={`font-black text-sm flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {mov.quantityChange} un.
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#D6B35A]">
                        {mov.newStock} un.
                      </td>
                      <td className="p-4 text-[#777777] font-mono">
                        {mov.userOrAdmin}
                      </td>
                    </tr>
                  );
                })}

                {movements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[#777777] font-mono">
                      Nenhuma movimentação registrada no inventário.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black uppercase text-[#EFECE6] tracking-tight">
                  Ajuste de Estoque Manual
                </h3>
                <p className="text-xs text-[#777777] mt-0.5">{selectedProduct.title}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-[#777777] hover:text-[#EFECE6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 rounded-xl flex items-center justify-between font-mono text-xs">
              <span className="text-[#777]">Estoque Atual:</span>
              <span className="font-black text-[#D6B35A] text-sm">{selectedProduct.stockCount ?? 20} un.</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">
                  Quantidade a Adicionar (+) ou Subtrair (-):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantityChange((prev) => prev - 1)}
                    className="p-2.5 bg-[#080808] hover:bg-[#222] border border-[#262626] rounded-xl text-[#EFECE6]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantityChange}
                    onChange={(e) => setQuantityChange(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                  <button
                    onClick={() => setQuantityChange((prev) => prev + 1)}
                    className="p-2.5 bg-[#080808] hover:bg-[#222] border border-[#262626] rounded-xl text-[#EFECE6]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-[#777] font-mono mt-1 text-center">
                  Novo estoque resultante:{' '}
                  <strong className="text-[#EFECE6]">
                    {Math.max(0, (selectedProduct.stockCount ?? 20) + quantityChange)} un.
                  </strong>
                </p>
              </div>

              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">Motivo do Ajuste:</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                >
                  <option value="purchase_restock">Reposição de Compra / Fornecedor</option>
                  <option value="manual_adjustment">Ajuste de Balanço / Inventário Físico</option>
                  <option value="damage">Avaria / Defeito no Armazém</option>
                  <option value="inventory_loss">Extravio / Perda</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">Observação do Registro:</label>
                <input
                  type="text"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder="Ex: Recebimento lote #402..."
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-[#080808] hover:bg-[#222] border border-[#262626] text-xs font-bold uppercase text-[#777777] rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdjustment}
                disabled={isSaving || quantityChange === 0}
                className="px-4 py-2 bg-[#D6B35A] hover:bg-[#EFECE6] text-black text-xs font-black uppercase rounded-xl transition-all shadow-md disabled:opacity-40 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Salvar Estoque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
