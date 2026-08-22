import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { StoreBanner } from '../../types';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  X,
  Upload
} from 'lucide-react';

export const AdminBannersTab: React.FC = () => {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<StoreBanner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'COMPRAR AGORA',
    linkUrl: '/shop',
    imageUrl: '',
    placement: 'hero' as 'hero' | 'middle' | 'popup',
    order: 1,
    active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/banners', {
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (banner?: StoreBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        buttonText: banner.buttonText || 'COMPRAR AGORA',
        linkUrl: banner.linkUrl || '/shop',
        imageUrl: banner.imageUrl,
        placement: banner.placement || 'hero',
        order: banner.order || 1,
        active: banner.active,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        buttonText: 'COMPRAR AGORA',
        linkUrl: '/shop',
        imageUrl: '',
        placement: 'hero',
        order: (banners.length || 0) + 1,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveBanner = async () => {
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      showToast('Campos Obrigatórios', 'Informe o título e o link da imagem do banner.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: StoreBanner = {
        id: editingBanner?.id || `banner-${Date.now()}`,
        ...formData,
        createdAt: editingBanner?.createdAt || new Date().toISOString(),
      };

      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('marmot_auth_token') || '',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao salvar banner.');

      showToast('Banner Salvo!', `Banner "${formData.title}" salvo com sucesso.`, 'success');
      setIsModalOpen(false);
      await fetchBanners();
    } catch (err: any) {
      showToast('Erro ao Salvar', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Deseja realmente remover este banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': localStorage.getItem('marmot_auth_token') || '' },
      });
      if (!res.ok) throw new Error('Erro ao remover banner.');
      showToast('Banner Removido', 'O banner foi removido com sucesso.', 'info');
      await fetchBanners();
    } catch (err: any) {
      showToast('Erro', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls */}
      <div className="flex items-center justify-between bg-[#141414] border border-[#222222] p-4 rounded-2xl">
        <div>
          <h3 className="text-sm font-black uppercase text-[#EFECE6] tracking-tight flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#D6B35A]" /> Banners Promocionais & Hero
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">Gerencie os destaques visuais exibidos na vitrine da loja</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-[#D6B35A] hover:bg-[#EFECE6] text-black text-xs font-black uppercase rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Banner
          </button>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-[#141414] border border-[#222222] hover:border-[#333] rounded-2xl overflow-hidden shadow-xl flex flex-col group transition-all"
          >
            {/* Banner Preview Image */}
            <div className="relative h-48 bg-[#080808] overflow-hidden">
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D6B35A] bg-black/60 px-2 py-0.5 rounded w-fit mb-1 border border-[#D6B35A]/30">
                  {b.placement} • Ordem {b.order}
                </span>
                <h4 className="text-lg font-black uppercase text-[#EFECE6] tracking-tight">{b.title}</h4>
                {b.subtitle && <p className="text-xs text-[#A0A0A0]">{b.subtitle}</p>}
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    b.active
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {b.active ? 'Ativo' : 'Pausado'}
                </span>
              </div>
            </div>

            {/* Info & Actions */}
            <div className="p-4 flex items-center justify-between gap-3 text-xs">
              <div className="text-[11px] font-mono text-[#777] truncate">
                Destino: <span className="text-[#EFECE6]">{b.linkUrl}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(b)}
                  className="p-2 bg-[#080808] hover:bg-[#262626] border border-[#222] rounded-xl text-[#EFECE6] transition-all"
                  title="Editar Banner"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteBanner(b.id)}
                  className="p-2 bg-[#080808] hover:bg-red-950/60 border border-[#222] rounded-xl text-red-400 transition-all"
                  title="Remover Banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-2 p-12 text-center text-[#777777] font-mono text-xs bg-[#141414] border border-[#222222] rounded-2xl">
            Nenhum banner promocional cadastrado no momento.
          </div>
        )}
      </div>

      {/* Banner Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black uppercase text-[#EFECE6] tracking-tight">
                  {editingBanner ? 'Editar Banner' : 'Cadastrar Novo Banner'}
                </h3>
                <p className="text-xs text-[#777777] mt-0.5">Defina as informações e o link de redirecionamento</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#777777] hover:text-[#EFECE6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">Título do Banner *:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: NOVA COLEÇÃO WINTER DROP"
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">Subtítulo (Opcional):</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ex: Peças limitadas e exclusivas da temporada"
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">URL da Imagem *:</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#777777] block mb-1">Posição / Local:</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value as any })}
                    className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  >
                    <option value="hero">Hero (Topo Principal)</option>
                    <option value="middle">Seção Intermediária</option>
                    <option value="popup">Pop-up Promocional</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-[#777777] block mb-1">Ordem de Exibição:</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#777777] block mb-1">Link de Destino:</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="/shop ou /category/streetwear"
                  className="w-full bg-[#080808] border border-[#262626] rounded-xl px-3 py-2 text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="accent-[#D6B35A] w-4 h-4 rounded"
                />
                <span className="text-xs text-[#EFECE6] font-bold">Banner Ativo (Visível na loja)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#080808] hover:bg-[#222] border border-[#262626] text-xs font-bold uppercase text-[#777777] rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBanner}
                disabled={isSaving}
                className="px-4 py-2 bg-[#D6B35A] hover:bg-[#EFECE6] text-black text-xs font-black uppercase rounded-xl transition-all shadow-md disabled:opacity-40 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Salvar Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
