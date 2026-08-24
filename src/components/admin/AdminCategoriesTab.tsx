import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Category } from '../../types';
import { ImageAdjustModal } from './ImageAdjustModal';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Check,
  X,
  Image as ImageIcon,
  Layers,
  Eye,
  AlertCircle,
  Crop,
  Sliders,
} from 'lucide-react';

export const AdminCategoriesTab: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories, uploadImage } = useStore();
  const { showToast } = useToast();

  // Modals state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick image changer modal state
  const [quickImageCat, setQuickImageCat] = useState<Category | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [quickImagePreview, setQuickImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Image Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustTargetImage, setAdjustTargetImage] = useState<string>('');
  const [adjustTitle, setAdjustTitle] = useState<string>('Ajustar Imagem da Categoria');
  const [onAdjustComplete, setOnAdjustComplete] = useState<((url: string) => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSubcategories, setFormSubcategories] = useState<string[]>([]);
  const [newSubcatInput, setNewSubcatInput] = useState('');
  const [formProductCount, setFormProductCount] = useState<number>(0);

  // Open Edit Modal
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormTagline(cat.tagline || '');
    setFormDescription(cat.description || '');
    setFormImage(cat.image || '');
    setFormSubcategories(cat.subcategories || []);
    setFormProductCount(cat.productCount || 0);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsAddOpen(true);
    setFormName('');
    setFormSlug('');
    setFormTagline('');
    setFormDescription('');
    setFormImage('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80');
    setFormSubcategories(['Geral']);
    setFormProductCount(0);
  };

  // Auto-generate slug when typing name in Add mode
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      const generated = val
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');
      setFormSlug(generated);
    }
  };

  // Add / Remove subcategory tag
  const handleAddSubcategory = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newSubcatInput.trim() && !formSubcategories.includes(newSubcatInput.trim())) {
      setFormSubcategories([...formSubcategories, newSubcatInput.trim()]);
      setNewSubcatInput('');
    }
  };

  const handleRemoveSubcategory = (sub: string) => {
    setFormSubcategories(formSubcategories.filter((s) => s !== sub));
  };

  // Reorder up / down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newOrder = [...categories];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((c) => c.id || c.slug);
    await reorderCategories(orderedIds);
    showToast('Ordem Atualizada', 'Posicionamento salvo na Home e no catálogo.', 'success');
  };

  // Open Image Adjuster manually
  const handleOpenAdjuster = (imageUrl: string, title: string, onSaveCallback: (url: string) => void) => {
    if (!imageUrl) {
      showToast('Aviso', 'Nenhuma foto selecionada para ajustar.', 'warning');
      return;
    }
    setAdjustTargetImage(imageUrl);
    setAdjustTitle(title);
    setOnAdjustComplete(() => onSaveCallback);
    setAdjustModalOpen(true);
  };

  // File upload handler - opens adjuster immediately so user can frame/crop/tune
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isForQuickModal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          setAdjustTargetImage(rawDataUrl);
          setAdjustTitle(`Ajustar Foto: ${file.name}`);
          setOnAdjustComplete(() => (adjustedUrl: string) => {
            if (isForQuickModal) {
              setQuickImageUrl(adjustedUrl);
              setQuickImagePreview(adjustedUrl);
            } else {
              setFormImage(adjustedUrl);
            }
            setAdjustModalOpen(false);
            showToast('Imagem Ajustada!', 'Ajustes e enquadramento aplicados.', 'success');
          });
          setAdjustModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast('Erro no Upload', 'Não foi possível ler o arquivo.', 'error');
    } finally {
      setIsUploading(false);
      // Reset input value so re-uploading the same file works
      e.target.value = '';
    }
  };

  // Save Quick Image Change
  const handleSaveQuickImage = async () => {
    if (!quickImageCat || (!quickImageUrl && !quickImagePreview)) return;
    const finalUrl = quickImagePreview || quickImageUrl;
    await updateCategory(quickImageCat.id, { image: finalUrl });
    showToast('Imagem Atualizada!', `Foto da categoria ${quickImageCat.name} alterada.`, 'success');
    setQuickImageCat(null);
    setQuickImageUrl('');
    setQuickImagePreview(null);
  };

  // Save Category Form (Add / Edit)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Atenção', 'O nome da categoria é obrigatório.', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          tagline: formTagline.trim(),
          description: formDescription.trim(),
          image: formImage.trim(),
          subcategories: formSubcategories,
          productCount: formProductCount,
        });
        showToast('Categoria Atualizada!', `${formName} foi salva com sucesso.`, 'success');
        setEditingCategory(null);
      } else {
        await addCategory({
          name: formName.trim(),
          slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, '-'),
          tagline: formTagline.trim(),
          description: formDescription.trim(),
          image: formImage.trim(),
          subcategories: formSubcategories,
          productCount: formProductCount,
        });
        showToast('Categoria Criada!', `${formName} adicionada ao site.`, 'success');
        setIsAddOpen(false);
      }
    } catch (error) {
      showToast('Erro', 'Ocorreu um erro ao salvar a categoria.', 'error');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteCategory(deletingId);
    showToast('Categoria Removida', 'Categoria excluída com sucesso.', 'info');
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
            <FolderTree className="w-4 h-4" /> Gestão de Silhuetas & Categorias
          </div>
          <h2 className="text-xl font-black uppercase text-[#171717] mt-1">
            Categorias do Catálogo ({categories.length})
          </h2>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            As alterações de imagem, nome e ordem feitas aqui atualizam automaticamente a seção <strong>"Compre por Categoria"</strong> na Home.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#F0C84B] text-black font-extrabold text-xs uppercase px-5 py-3 rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Adicionar Categoria
        </button>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((cat, index) => (
          <div
            key={cat.id || cat.slug}
            className="bg-white border border-[#E5E5E1] hover:border-[#B45309]/50 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all shadow-xs"
          >
            {/* Category Image Header with overlay actions */}
            <div className="relative h-48 w-full bg-[#F9F9F7] overflow-hidden">
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Order Badge & Reorder Controls */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 border border-[#E5E5E1] px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-[#B45309] shadow-xs">
                <span>#{index + 1}</span>
                <span className="text-[#6B6B66]">|</span>
                <span>{cat.slug}</span>
              </div>

              {/* Quick Reorder Arrows */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 border border-[#E5E5E1] p-1 rounded-lg shadow-xs">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  title="Mover para cima"
                  className="p-1 text-[#6B6B66] hover:text-[#B45309] disabled:opacity-30 disabled:hover:text-[#6B6B66]"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={index === categories.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  title="Mover para baixo"
                  className="p-1 text-[#6B6B66] hover:text-[#B45309] disabled:opacity-30 disabled:hover:text-[#6B6B66]"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Upload Button on Image */}
              <button
                onClick={() => {
                  setQuickImageCat(cat);
                  setQuickImageUrl(cat.image);
                  setQuickImagePreview(cat.image);
                }}
                className="absolute bottom-3 right-3 bg-white/95 hover:bg-[#F0C84B] text-[#171717] hover:text-black border border-[#E5E5E1] hover:border-[#F0C84B] px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 backdrop-blur-xs shadow-xs"
              >
                <Upload className="w-3 h-3" /> Trocar Foto
              </button>

              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] font-mono font-bold text-[#F0C84B] uppercase tracking-wider">
                  {cat.productCount ? `${cat.productCount} Peças` : 'Catálogo Ativo'}
                </span>
                <h3 className="text-lg font-black uppercase text-white leading-tight drop-shadow">
                  {cat.name}
                </h3>
              </div>
            </div>

            {/* Category Info Body */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#B45309] line-clamp-1">
                  {cat.tagline || 'Sem subtítulo cadastrado'}
                </p>
                <p className="text-[11px] text-[#6B6B66] mt-1 line-clamp-2 leading-relaxed">
                  {cat.description || 'Sem descrição cadastrada.'}
                </p>

                {/* Subcategories tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {(cat.subcategories || []).slice(0, 3).map((sub, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-medium bg-[#F9F9F7] text-[#171717] px-2 py-0.5 rounded-md border border-[#E5E5E1]"
                    >
                      {sub}
                    </span>
                  ))}
                  {(cat.subcategories || []).length > 3 && (
                    <span className="text-[9px] font-medium bg-amber-50 text-[#B45309] px-1.5 py-0.5 rounded-md border border-amber-200">
                      +{(cat.subcategories || []).length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="flex-1 bg-[#F9F9F7] hover:bg-white text-[#171717] border border-[#E5E5E1] hover:border-[#B45309] py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#B45309]" /> Editar
                </button>

                <button
                  onClick={() => setDeletingId(cat.id)}
                  className="p-2 bg-[#F9F9F7] hover:bg-red-50 text-[#6B6B66] hover:text-red-700 border border-[#E5E5E1] hover:border-red-200 rounded-xl transition-all shadow-xs"
                  title="Excluir Categoria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QUICK IMAGE CHANGE MODAL */}
      {quickImageCat && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E5E5E1] p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-50 text-[#B45309] flex items-center justify-center border border-amber-200">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-[#171717]">
                    Trocar Foto: {quickImageCat.name}
                  </h3>
                  <p className="text-xs text-[#6B6B66]">Atualize a foto exibida na seção Compre por Categoria</p>
                </div>
              </div>
              <button
                onClick={() => setQuickImageCat(null)}
                className="p-1 text-[#6B6B66] hover:text-[#171717]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Image Preview */}
            <div className="relative h-56 rounded-xl overflow-hidden border border-[#E5E5E1] bg-[#F9F9F7]">
              {quickImagePreview || quickImageUrl ? (
                <img
                  src={quickImagePreview || quickImageUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#6B6B66]">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">Nenhuma foto selecionada</span>
                </div>
              )}
            </div>

            {/* File Upload Trigger */}
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, true)}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] hover:border-[#B45309] text-[#171717] py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#B45309]" />
                  {isUploading ? 'Enviando...' : 'Carregar do PC'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenAdjuster(
                      quickImagePreview || quickImageUrl,
                      `Ajustar Foto: ${quickImageCat.name}`,
                      (url) => {
                        setQuickImageUrl(url);
                        setQuickImagePreview(url);
                      }
                    )
                  }
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#B45309] py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Ajustar Foto
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Cole a URL direta da imagem (ex: Unsplash):', quickImageUrl);
                    if (url) {
                      setQuickImageUrl(url);
                      setQuickImagePreview(url);
                    }
                  }}
                  className="bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] text-[#171717] py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#6B6B66]" />
                  Inserir URL
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Ou edite a URL diretamente:</label>
                <input
                  type="text"
                  value={quickImageUrl}
                  onChange={(e) => {
                    setQuickImageUrl(e.target.value);
                    setQuickImagePreview(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickImageCat(null)}
                className="flex-1 bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] py-3 rounded-xl text-xs font-bold uppercase shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickImage}
                className="flex-1 bg-[#F0C84B] text-black font-extrabold py-3 rounded-xl text-xs uppercase hover:bg-amber-400 transition-colors shadow-xs"
              >
                Salvar Nova Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {(editingCategory || isAddOpen) && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden min-w-0 box-border">
            <div className="flex items-center justify-between border-b border-[#E5E5E1] px-5 py-4 sm:px-8 sm:py-5 shrink-0 bg-white">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#B45309] uppercase block">
                  {editingCategory ? 'Modo de Edição' : 'Novo Registro'}
                </span>
                <h3 className="text-lg font-black uppercase text-[#171717] truncate">
                  {editingCategory ? `Editar: ${editingCategory.name}` : 'Cadastrar Nova Categoria'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsAddOpen(false);
                }}
                className="p-1.5 text-[#6B6B66] hover:text-[#171717] hover:bg-[#F9F9F7] rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col flex-1 overflow-hidden min-h-0 min-w-0">
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-8 space-y-4 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Nome da Categoria *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Camisetas, Corta-Ventos, Bags..."
                    required
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Slug (Identificador URL) *</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="camisetas, corta-ventos..."
                    required
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Subtítulo / Tagline de Destaque</label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="Ex: Heavyweight 260g & Boxy Fit"
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalhes sobre a modelagem, tecido e proposta..."
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              {/* Image Upload in Modal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#6B6B66] block">Imagem da Categoria</label>
                  <span className="text-[10px] text-[#B45309] font-mono">Formato Quadrado (1:1) recomendado</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div
                    onClick={() =>
                      handleOpenAdjuster(
                        formImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
                        `Ajustar Imagem: ${formName || 'Categoria'}`,
                        (url) => setFormImage(url)
                      )
                    }
                    className="group relative w-24 h-24 rounded-xl overflow-hidden border border-[#E5E5E1] bg-[#F9F9F7] shrink-0 cursor-pointer shadow-xs hover:border-[#B45309] transition-all"
                    title="Clique para enquadrar ou ajustar a foto"
                  >
                    <img
                      src={formImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-[#F0C84B] transition-opacity">
                      <Crop className="w-4 h-4 mb-0.5" />
                      <span>Ajustar</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={modalFileInputRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] hover:border-[#B45309] text-[#171717] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#B45309]" />
                        {isUploading ? 'Processando...' : 'Carregar do Computador'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenAdjuster(
                            formImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
                            `Ajustar Imagem: ${formName || 'Categoria'}`,
                            (url) => setFormImage(url)
                          )
                        }
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#B45309] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        Ajustar / Enquadrar
                      </button>
                    </div>

                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="Ou cole a URL direta da imagem..."
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                    />
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              <div>
                <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Subcategorias (Filtros)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubcatInput}
                    onChange={(e) => setNewSubcatInput(e.target.value)}
                    onKeyDown={handleAddSubcategory}
                    placeholder="Digite uma subcategoria e pressione Enter..."
                    className="flex-1 bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="bg-[#F9F9F7] hover:bg-white text-[#B45309] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs font-bold uppercase shadow-xs"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {formSubcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="bg-[#F9F9F7] text-[#171717] border border-[#E5E5E1] text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    >
                      {sub}
                      <X
                        className="w-3 h-3 text-[#6B6B66] hover:text-red-700 cursor-pointer"
                        onClick={() => handleRemoveSubcategory(sub)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Product count */}
              <div className="w-36">
                <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Qtd. de Peças</label>
                <input
                  type="number"
                  min={0}
                  value={formProductCount}
                  onChange={(e) => setFormProductCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded-xl text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                />
              </div>
            </div>

            {/* Sticky Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 px-5 py-4 sm:px-8 sm:py-4 border-t border-[#E5E5E1] bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsAddOpen(false);
                }}
                className="w-full sm:flex-1 bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] py-3 rounded-xl text-xs font-bold uppercase transition-colors shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:flex-1 bg-[#F0C84B] text-black font-extrabold py-3 rounded-xl text-xs uppercase hover:bg-amber-400 transition-colors shadow-xs"
              >
                {editingCategory ? 'Salvar Alterações' : 'Cadastrar Categoria'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E5E5E1] p-6 rounded-2xl max-w-md w-full space-y-4 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black uppercase text-[#171717]">Excluir Categoria?</h3>
            <p className="text-xs text-[#6B6B66]">
              Tem certeza que deseja remover esta categoria? Ela deixará de aparecer na Home e no menu de filtros.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] py-2.5 rounded-xl text-xs font-bold uppercase shadow-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase transition-colors shadow-xs"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
      {/* IMAGE ADJUST MODAL */}
      <ImageAdjustModal
        isOpen={adjustModalOpen}
        imageSrc={adjustTargetImage}
        title={adjustTitle}
        initialAspectRatio="1:1"
        onSave={(adjustedUrl) => {
          if (onAdjustComplete) {
            onAdjustComplete(adjustedUrl);
          }
          setAdjustModalOpen(false);
        }}
        onClose={() => setAdjustModalOpen(false)}
      />
    </div>
  );
};
