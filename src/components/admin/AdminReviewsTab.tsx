import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Trash2, CheckCircle2, Search, RefreshCw, AlertCircle, Eye, Package } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useStore } from '../../context/StoreContext';

interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  orderId?: string;
  helpfulCount?: number;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

export const AdminReviewsTab: React.FC = () => {
  const { showToast } = useToast();
  const { products } = useStore();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Erro ao carregar avaliações de clientes.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação permanentemente?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Avaliação removida com sucesso.', 'success');
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast('Erro ao remover avaliação.', 'error');
      }
    } catch {
      showToast('Erro ao comunicar com o servidor.', 'error');
    }
  };

  const getProductName = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    return p ? p.name || p.title : productId;
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = filterRating === 'all' || r.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const verifiedCount = reviews.filter((r) => r.verifiedPurchase).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
            <Star className="w-3.5 h-3.5" /> REPUTAÇÃO & FEEDBACK DE CLIENTES
          </div>
          <h2 className="text-xl font-black uppercase text-[#171717] mt-1">
            Moderação de Avaliações de Produtos
          </h2>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Gerencie depoimentos de compradores verificados e mantenha a qualidade do catálogo.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="bg-white hover:bg-[#F9F9F7] text-[#171717] text-xs font-bold uppercase px-4 py-2.5 rounded-xl border border-[#E5E5E1] transition-all flex items-center gap-2 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B45309] ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Nota Média Geral</span>
            <Star className="w-4 h-4 text-[#F0C84B] fill-[#F0C84B]" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{avgRating} <span className="text-sm font-normal text-[#6B6B66]">/ 5.0</span></p>
          <p className="text-[11px] text-[#6B6B66]">Baseado em {reviews.length} avaliações</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Compras Verificadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{verifiedCount}</p>
          <p className="text-[11px] text-[#6B6B66]">Clientes com pedidos entregues</p>
        </div>

        <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B66]">
            <span className="text-xs font-mono font-bold uppercase">Total de Feedbacks</span>
            <MessageSquare className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{reviews.length}</p>
          <p className="text-[11px] text-[#6B6B66]">Avaliações publicadas na loja</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-[#E5E5E1] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6B6B66]" />
          <input
            type="text"
            placeholder="Buscar por cliente, produto ou texto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-9 pr-4 py-2 text-xs text-[#171717] focus:border-[#B45309] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#6B6B66] font-bold uppercase">Filtrar:</span>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-[#171717] focus:border-[#B45309] outline-none"
          >
            <option value="all">Todas as notas</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 estrelas)</option>
            <option value="4">⭐⭐⭐⭐ (4 estrelas)</option>
            <option value="3">⭐⭐⭐ (3 estrelas)</option>
            <option value="2">⭐⭐ (2 estrelas)</option>
            <option value="1">⭐ (1 estrela)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-white border border-[#E5E5E1] p-12 rounded-2xl text-center text-[#6B6B66] space-y-3 shadow-xs">
            <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm">Nenhuma avaliação encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-[#E5E5E1] p-5 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#B45309]/50 transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex text-[#F0C84B]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-[#F0C84B]' : 'text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="font-bold text-sm text-[#171717]">{rev.title}</span>

                  {rev.verifiedPurchase && (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> COMPRA VERIFICADA
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#6B6B66] leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B6B66]">
                  <span>Por: <strong className="text-[#171717]">{rev.userName}</strong> {rev.userEmail ? `(${rev.userEmail})` : ''}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-[#B45309]" />
                    Produto: <strong className="text-[#171717]">{getProductName(rev.productId)}</strong>
                  </span>
                  <span>•</span>
                  <span>{new Date(rev.createdAt).toLocaleDateString('pt-BR')}</span>
                  {rev.orderId && (
                    <>
                      <span>•</span>
                      <span className="font-mono">Pedido #{rev.orderId}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="bg-[#F9F9F7] hover:bg-red-50 border border-[#E5E5E1] hover:border-red-200 text-[#6B6B66] hover:text-red-700 text-xs font-bold uppercase px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  title="Excluir Avaliação"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
