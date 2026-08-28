import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Product, ProductVariant } from '../../types';
import { ImageAdjustModal } from './ImageAdjustModal';
import { getValidProductImageUrl, handleProductImageError } from '../../utils/imageUtils';
import { uploadProductImageToStorage, deleteProductImageFromStorage } from '../../lib/supabaseClient';
import { AdminColorPicker } from './AdminColorPicker';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Flame,
  Tag,
  Star,
  AlertCircle,
  TrendingDown,
  Crop,
  Sliders,
  Loader2,
} from 'lucide-react';

interface AdminProductsTabProps {
  onNavigateToProduct?: (id: string) => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({ onNavigateToProduct }) => {
  const { products, categories, addProduct, updateProduct, deleteProduct, uploadImage } = useStore();
  const { showToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Image Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustTargetImage, setAdjustTargetImage] = useState<string>('');
  const [adjustTitle, setAdjustTitle] = useState<string>('Ajustar Foto do Produto');
  const [onAdjustComplete, setOnAdjustComplete] = useState<((url: string) => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formCollection, setFormCollection] = useState('');
  const [formPrice, setFormPrice] = useState<string | number>('199.90');
  const [formPromoPrice, setFormPromoPrice] = useState<string | number | undefined>(undefined);
  const [formStock, setFormStock] = useState<string | number>('30');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'out_of_stock'>('active');
  const [formDescription, setFormDescription] = useState('');

  // Shipping & Logistics Dimensions
  const [formWeight, setFormWeight] = useState<string | number>('0.35');
  const [formHeight, setFormHeight] = useState<string | number>('4');
  const [formWidth, setFormWidth] = useState<string | number>('20');
  const [formLength, setFormLength] = useState<string | number>('25');

  // Badges / Flags
  const [formIsNewRelease, setFormIsNewRelease] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);

  // Images list (first is cover)
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Sizes & Colors
  const BASE_CLOTHING_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  const BASE_NUMBER_SIZES = ['36', '38', '40', '42', '44', '46'];
  const BASE_OTHER_SIZES = ['ÚNICO'];

  const categorizeSize = (sz: string): 'clothing' | 'number' | 'other' => {
    const trimmed = sz.trim();
    const upper = trimmed.toUpperCase();
    if (upper === 'ÚNICO' || upper === 'UNICO') return 'other';
    if (/^\d+$/.test(trimmed)) return 'number';
    return 'clothing';
  };

  const [formSizes, setFormSizes] = useState<string[]>(['P', 'M', 'G', 'GG']);
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState('');

  const [formColors, setFormColors] = useState<ProductVariant[]>([
    { color: 'black', colorName: 'Black Onyx', colorHex: '#121212' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#D6B35A');

  // Composition & Care
  const [formComposition, setFormComposition] = useState<string[]>([
    '100% Algodão Heavyweight 260g/m²',
    'Ribana canelada 2x1 na gola',
    'Tingimento reativo e pré-encolhido',
  ]);
  const [newCompInput, setNewCompInput] = useState('');

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = !selectedCategoryFilter || p.category === selectedCategoryFilter;

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'out_of_stock' && (p.stockCount === 0 || p.status === 'out_of_stock')) ||
        p.status === selectedStatusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchTerm, selectedCategoryFilter, selectedStatusFilter]);

  // Helper function to safely parse numeric values from string or number with comma or dot
  const parseNumber = (val: string | number | undefined, fallback: number): number => {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    const clean = String(val).trim().replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormTitle(p.title);
    setFormSubtitle(p.subtitle || '');
    setFormSlug(p.slug || p.id);
    setFormSku(p.sku || '');
    setFormCategory(p.category);
    setFormSubcategory(p.subcategory || '');
    setFormCollection(p.collection || '');
    setFormPrice(p.price !== undefined ? String(p.price) : '199.90');
    setFormPromoPrice(p.promoPrice !== undefined ? String(p.promoPrice) : undefined);
    setFormStock(p.stockCount !== undefined ? String(p.stockCount) : '25');
    setFormStatus(p.status || 'active');
    setFormDescription(p.description || '');
    setFormWeight(p.weight !== undefined && p.weight !== null ? String(p.weight) : '');
    setFormHeight(p.height !== undefined && p.height !== null ? String(p.height) : '');
    setFormWidth(p.width !== undefined && p.width !== null ? String(p.width) : '');
    setFormLength(p.length !== undefined && p.length !== null ? String(p.length) : '');
    setFormIsNewRelease(!!p.isNewRelease);
    setFormIsBestSeller(!!p.isBestSeller);
    const primaryImg = p.image || (p.images && p.images.length > 0 ? p.images[0] : '');
    const loadedImages = (p.images && p.images.length > 0)
      ? (primaryImg && p.images[0] !== primaryImg ? [primaryImg, ...p.images.filter((x: string) => x !== primaryImg)] : p.images)
      : (primaryImg ? [primaryImg] : []);
    setFormImages(loadedImages);
    const loadedSizes = p.sizes || ['P', 'M', 'G'];
    setFormSizes(loadedSizes);
    const existingCustoms = loadedSizes.filter(
      (s) => !BASE_CLOTHING_SIZES.includes(s) && !BASE_NUMBER_SIZES.includes(s) && !BASE_OTHER_SIZES.includes(s)
    );
    setCustomSizes(existingCustoms);
    setIsCustomSizeOpen(false);
    setNewSizeInput('');
    const loadedColors: ProductVariant[] = (p.colors && p.colors.length > 0)
      ? p.colors.map((c: any) => {
          const vImgs: string[] = Array.isArray(c.images) && c.images.length > 0
            ? c.images
            : (c.featuredImage ? [c.featuredImage] : (c.image ? [c.image] : []));
          const feat = c.featuredImage || vImgs[0] || c.image || '';
          return {
            id: c.id,
            color: c.color || (c.colorName ? c.colorName.toLowerCase().replace(/\s+/g, '-') : 'default'),
            colorName: c.colorName || 'Cor Única',
            colorHex: c.colorHex || '#121212',
            images: vImgs,
            featuredImage: feat,
            image: feat,
            sku: c.sku,
            stockCount: c.stockCount,
            sizes: c.sizes,
          };
        })
      : [{ color: 'black', colorName: 'Black Onyx', colorHex: '#121212', images: [], featuredImage: '', image: '' }];
    setFormColors(loadedColors);
    setFormComposition(p.composition || ['100% Algodão']);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsAddOpen(true);
    setFormTitle('');
    setFormSubtitle('');
    setFormSlug('');
    setFormSku(`AURA-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory(categories[0]?.slug || 'camisetas');
    setFormSubcategory('Geral');
    setFormCollection('Vol. 04: Cyber Dystopia');
    setFormPrice('199.90');
    setFormPromoPrice(undefined);
    setFormStock('40');
    setFormStatus('active');
    setFormDescription('Peça exclusiva desenvolvida com malha pesada e acabamento premium.');
    setFormWeight('0.35');
    setFormHeight('4');
    setFormWidth('20');
    setFormLength('25');
    setFormIsNewRelease(true);
    setFormIsBestSeller(false);
    setFormImages([]);
    setFormSizes(['P', 'M', 'G', 'GG']);
    setCustomSizes([]);
    setIsCustomSizeOpen(false);
    setNewSizeInput('');
    setFormColors([
      {
        color: 'black',
        colorName: 'Preto Stone',
        colorHex: '#181818',
        images: [],
        featuredImage: '',
        image: '',
      },
    ]);
    setFormComposition(['100% Algodão Heavyweight 260g/m²', 'Modelagem Boxy Fit']);
  };

  // Title change with auto-slug
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingProduct) {
      const generated = val
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-');
      setFormSlug(generated);
    }
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

  // Cover Photo Upload (Uploads original file in full resolution directly)
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setIsUploading(true);
      const url = await uploadImage(file, file.name);
      if (url) {
        if (formImages.length > 0) {
          const next = [...formImages];
          next[0] = url;
          setFormImages(next);
        } else {
          setFormImages([url]);
        }
        showToast('Foto de Capa Atualizada!', 'A foto principal foi carregada em alta qualidade.', 'success');
      }
    } catch (err: any) {
      showToast('Erro no Upload', err?.message || 'Falha ao carregar foto de capa.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Gallery File Upload (Uploads original files in full resolution directly in parallel)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const fileList = Array.from(files) as File[];
      const uploaded = await Promise.all(fileList.map((file) => uploadImage(file, file.name)));
      const validUrls = uploaded.filter((u): u is string => Boolean(u && u.trim()));

      if (validUrls.length > 0) {
        setFormImages([...formImages, ...validUrls]);
        showToast('Fotos Carregadas!', `${validUrls.length} foto(s) adicionada(s) em alta resolução.`, 'success');
      }
    } catch (err: any) {
      showToast('Erro no Upload', err?.message || 'Falha ao processar imagens da galeria.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Add URL Image
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() && !formImages.includes(imageUrlInput.trim())) {
      setFormImages([...formImages, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  // Make cover photo (move to index 0)
  const handleSetCover = (index: number) => {
    const next = [...formImages];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    setFormImages(next);
    showToast('Foto Principal', 'Capa do produto definida.', 'info');
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  // Add / Remove Sizes
  const handleToggleSize = (sz: string) => {
    setFormSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const handleAddCustomSize = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const raw = newSizeInput.trim();
    if (!raw) return;
    const clean = raw.toUpperCase();
    const cat = categorizeSize(clean);
    const catLabel = cat === 'number' ? 'Numeração' : cat === 'clothing' ? 'Roupas' : 'Outros';

    const baseAll = [...BASE_CLOTHING_SIZES, ...BASE_NUMBER_SIZES, ...BASE_OTHER_SIZES];
    if (!baseAll.includes(clean) && !customSizes.includes(clean)) {
      setCustomSizes((prev) => [...prev, clean]);
    }

    if (!formSizes.includes(clean)) {
      setFormSizes((prev) => [...prev, clean]);
      showToast('Tamanho Adicionado', `Tamanho "${clean}" adicionado em ${catLabel}.`, 'success');
    } else {
      showToast('Aviso', `O tamanho "${clean}" já está selecionado.`, 'info');
    }
    setNewSizeInput('');
    setIsCustomSizeOpen(false);
  };

  const handleRemoveCustomSize = (sz: string) => {
    setCustomSizes((prev) => prev.filter((s) => s !== sz));
    setFormSizes((prev) => prev.filter((s) => s !== sz));
  };

  // Add / Remove / Manage Colors & Variant Galleries
  const handleAddColor = () => {
    const cleanName = newColorName.trim();
    if (!cleanName) {
      showToast('Aviso', 'Informe o nome da nova cor.', 'warning');
      return;
    }
    const isDuplicate = formColors.some(
      (c) => c.colorName.toLowerCase().trim() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      showToast('Aviso', `A cor "${cleanName}" já existe neste produto.`, 'warning');
      return;
    }

    const variant: ProductVariant = {
      color: cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      colorName: cleanName,
      colorHex: newColorHex || '#121212',
      images: [],
      featuredImage: '',
      image: '',
    };
    setFormColors([...formColors, variant]);
    setNewColorName('');
    showToast('Cor Adicionada', `Variante "${cleanName}" criada. Adicione as fotos específicas desta cor no card abaixo.`, 'success');
  };

  const handleRemoveColor = (idx: number) => {
    if (formColors.length <= 1) {
      showToast('Aviso', 'O produto deve ter ao menos uma cor cadastrada.', 'warning');
      return;
    }
    setFormColors(formColors.filter((_, i) => i !== idx));
    showToast('Cor Removida', 'Variante de cor excluída do formulário.', 'info');
  };

  const handleVariantUpdateInfo = (idx: number, updates: Partial<ProductVariant>) => {
    setFormColors((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  // Upload photos specifically for a color variant (Parallel)
  const handleVariantFileUpload = async (variantIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const fileList = Array.from(files) as File[];
      const colorLabel = formColors[variantIdx]?.colorName || 'cor';
      const uploaded = await Promise.all(
        fileList.map((file) => uploadImage(file, `${colorLabel}-${file.name}`))
      );
      const validUrls = uploaded.filter((u): u is string => Boolean(u && u.trim()));

      setFormColors((prev) => {
        const next = [...prev];
        const cur = next[variantIdx];
        const curImgs = cur.images || (cur.featuredImage ? [cur.featuredImage] : (cur.image ? [cur.image] : []));
        const combined = [...curImgs, ...validUrls];
        const feat = cur.featuredImage || combined[0] || '';
        next[variantIdx] = {
          ...cur,
          images: combined,
          featuredImage: feat,
          image: feat,
        };
        return next;
      });

      showToast(
        'Fotos Adicionadas!',
        `${validUrls.length} foto(s) anexada(s) à cor "${formColors[variantIdx]?.colorName}".`,
        'success'
      );
    } catch (err: any) {
      showToast('Erro no Upload', err?.message || 'Falha ao processar imagens da cor.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Add direct image URL to a color variant
  const handleVariantAddUrl = (variantIdx: number, urlToAdd: string) => {
    const clean = urlToAdd.trim();
    if (!clean) return;
    setFormColors((prev) => {
      const next = [...prev];
      const cur = next[variantIdx];
      const curImgs = cur.images || (cur.featuredImage ? [cur.featuredImage] : (cur.image ? [cur.image] : []));
      if (curImgs.includes(clean)) {
        showToast('Aviso', 'Esta imagem já foi adicionada para esta cor.', 'info');
        return prev;
      }
      const combined = [...curImgs, clean];
      const feat = cur.featuredImage || combined[0] || '';
      next[variantIdx] = {
        ...cur,
        images: combined,
        featuredImage: feat,
        image: feat,
      };
      return next;
    });
    showToast('Imagem Adicionada', `Foto anexada à cor "${formColors[variantIdx]?.colorName}".`, 'info');
  };

  // Set cover for a color variant (move image to index 0 and set featuredImage)
  const handleVariantSetCover = (variantIdx: number, imgIdx: number) => {
    setFormColors((prev) => {
      const next = [...prev];
      const cur = next[variantIdx];
      const curImgs = cur.images || (cur.featuredImage ? [cur.featuredImage] : (cur.image ? [cur.image] : []));
      if (!curImgs[imgIdx]) return prev;
      const copy = [...curImgs];
      const [chosen] = copy.splice(imgIdx, 1);
      copy.unshift(chosen);
      next[variantIdx] = {
        ...cur,
        images: copy,
        featuredImage: chosen,
        image: chosen,
      };
      return next;
    });
    showToast('Capa da Cor Definida', 'Esta foto agora é a principal desta variante.', 'success');
  };

  // Remove single image from a color variant
  const handleVariantRemoveImage = (variantIdx: number, imgIdx: number) => {
    setFormColors((prev) => {
      const next = [...prev];
      const cur = next[variantIdx];
      const curImgs = cur.images || (cur.featuredImage ? [cur.featuredImage] : (cur.image ? [cur.image] : []));
      const filtered = curImgs.filter((_, i) => i !== imgIdx);
      const feat = filtered[0] || '';
      next[variantIdx] = {
        ...cur,
        images: filtered,
        featuredImage: feat,
        image: feat,
      };
      return next;
    });
    showToast('Foto Removida', 'Imagem removida desta cor.', 'info');
  };

  // Duplicate Product
  const handleDuplicate = async (p: Product) => {
    const duplicated: Omit<Product, 'id'> = {
      ...p,
      title: `${p.title} (Cópia)`,
      slug: `${p.slug || p.id}-copia-${Date.now().toString().slice(-4)}`,
      sku: `${p.sku || 'AURA'}-COPY`,
      createdAt: new Date().toISOString(),
    };
    await addProduct(duplicated);
    showToast('Produto Duplicado!', `${duplicated.title} foi criado.`, 'success');
  };

  // Quick Stock update directly from list
  const handleQuickStockChange = async (productId: string, newStock: number) => {
    try {
      const status = newStock <= 0 ? 'out_of_stock' : 'active';
      await updateProduct(productId, { stockCount: newStock, status });
      showToast('Estoque Atualizado', `Novo saldo: ${newStock} unidades`, 'info');
    } catch (err: any) {
      showToast('Erro ao Atualizar Estoque', err?.message || 'Falha ao atualizar estoque no banco.', 'error');
    }
  };

  // Save Add / Edit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Atenção', 'Título do produto é obrigatório.', 'error');
      return;
    }

    const validPrice = parseNumber(formPrice, 199.9);
    const validPromoPrice = formPromoPrice !== undefined && String(formPromoPrice).trim() !== '' ? parseNumber(formPromoPrice, 0) : undefined;
    const validStock = Math.max(0, Math.floor(parseNumber(formStock, 0)));

    const tags: ('lançamento' | 'mais-vendido' | 'oferta' | 'exclusivo')[] = [];
    if (formIsNewRelease) tags.push('lançamento');
    if (formIsBestSeller) tags.push('mais-vendido');
    if (validPromoPrice && validPromoPrice < validPrice) tags.push('oferta');

    // Validate Colors / Variants
    if (!formColors || formColors.length === 0) {
      showToast('Atenção', 'Adicione ao menos uma cor/variante ao produto.', 'error');
      return;
    }
    const hasEmptyColorName = formColors.some((c) => !c.colorName || !c.colorName.trim());
    if (hasEmptyColorName) {
      showToast('Atenção', 'Todas as cores/variantes precisam ter um nome preenchido.', 'error');
      return;
    }

    // Clean and normalize colors array before saving
    const normalizedColors: ProductVariant[] = formColors.map((c) => {
      const vImgs: string[] = Array.isArray(c.images) && c.images.length > 0
        ? c.images
        : (c.featuredImage ? [c.featuredImage] : (c.image ? [c.image] : []));
      const feat = c.featuredImage || vImgs[0] || c.image || '';
      return {
        id: c.id,
        color: c.color || c.colorName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
        colorName: c.colorName.trim(),
        colorHex: c.colorHex || '#121212',
        images: vImgs,
        featuredImage: feat,
        image: feat,
        sku: c.sku,
        stockCount: c.stockCount,
        sizes: c.sizes,
      };
    });

    const firstVariantWithImg = normalizedColors.find((c) => c.images && c.images.length > 0);
    const variantFallbackImg = firstVariantWithImg?.images?.[0] || firstVariantWithImg?.featuredImage || '';
    const primaryImage = formImages[0] || variantFallbackImg || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
    const allImages = formImages.length > 0 ? formImages : (variantFallbackImg ? [variantFallbackImg] : [primaryImage]);

    // Validate logistics dimensions
    const validWeight = parseNumber(formWeight, NaN);
    const validHeight = parseNumber(formHeight, NaN);
    const validWidth = parseNumber(formWidth, NaN);
    const validLength = parseNumber(formLength, NaN);

    if (isNaN(validWeight) || validWeight <= 0) {
      showToast('Atenção', 'O campo "Peso (kg)" é obrigatório e deve ser um número maior que zero.', 'error');
      return;
    }
    if (isNaN(validHeight) || validHeight <= 0) {
      showToast('Atenção', 'O campo "Altura (cm)" é obrigatório e deve ser um número maior que zero.', 'error');
      return;
    }
    if (isNaN(validWidth) || validWidth <= 0) {
      showToast('Atenção', 'O campo "Largura (cm)" é obrigatório e deve ser um número maior que zero.', 'error');
      return;
    }
    if (isNaN(validLength) || validLength <= 0) {
      showToast('Atenção', 'O campo "Comprimento (cm)" é obrigatório e deve ser um número maior que zero.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const targetProdId = editingProduct?.id || 'new';

      // 1. Process and upload only new Base64/Data URLs in parallel; keep existing URLs intact
      const hasBase64Form = formImages.some((img) => typeof img === 'string' && img.startsWith('data:'));
      const uploadedFormImages: string[] = hasBase64Form
        ? await Promise.all(
            formImages.map((img, idx) => {
              if (typeof img === 'string' && img.startsWith('data:')) {
                return uploadProductImageToStorage(img, targetProdId, `form-${idx}-${Date.now()}.jpg`);
              }
              return Promise.resolve(img);
            })
          )
        : formImages;

      // Process variant images (parallelized and only for data: URLs)
      const processedColors: ProductVariant[] = await Promise.all(
        normalizedColors.map(async (c) => {
          const vImgs = c.images || [];
          const hasBase64Var = vImgs.some((v) => typeof v === 'string' && v.startsWith('data:')) ||
                               (typeof c.featuredImage === 'string' && c.featuredImage.startsWith('data:'));

          let processedVImgs = vImgs;
          if (hasBase64Var) {
            processedVImgs = await Promise.all(
              vImgs.map((vImg, vIdx) => {
                if (typeof vImg === 'string' && vImg.startsWith('data:')) {
                  return uploadProductImageToStorage(vImg, targetProdId, `variant-${c.color}-${vIdx}-${Date.now()}.jpg`);
                }
                return Promise.resolve(vImg);
              })
            );
          }

          const feat = processedVImgs[0] || (c.featuredImage?.startsWith('data:') ? processedVImgs[0] : c.featuredImage) || '';
          return {
            ...c,
            images: processedVImgs,
            featuredImage: feat,
            image: feat,
          };
        })
      );

      const firstVarWithImg = processedColors.find((c) => c.images && c.images.length > 0);
      const varFallbackImg = firstVarWithImg?.images?.[0] || firstVarWithImg?.featuredImage || '';
      const cleanAllImages = uploadedFormImages.length > 0 ? uploadedFormImages : (varFallbackImg ? [varFallbackImg] : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80']);
      const finalPrimaryImage = cleanAllImages[0];

      // Ensure first color variant reflects the primary image if it does not have a separate variant photo
      if (processedColors.length > 0) {
        if (!processedColors[0].images || processedColors[0].images.length === 0 || !processedColors[0].featuredImage) {
          processedColors[0].featuredImage = finalPrimaryImage;
          processedColors[0].image = finalPrimaryImage;
          processedColors[0].images = cleanAllImages;
        }
      }

      if (editingProduct) {
        const oldImages = Array.isArray(editingProduct.images) ? editingProduct.images : (editingProduct.image ? [editingProduct.image] : []);

        // 2. Perform isolated single UPDATE on specific product
        const updated = await updateProduct(editingProduct.id, {
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          slug: formSlug.trim() || formTitle.toLowerCase().replace(/\s+/g, '-'),
          sku: formSku.trim(),
          category: formCategory,
          subcategory: formSubcategory.trim(),
          collection: formCollection.trim(),
          price: validPrice,
          promoPrice: validPromoPrice,
          stockCount: validStock,
          status: formStatus,
          description: formDescription.trim(),
          weight: validWeight,
          height: validHeight,
          width: validWidth,
          length: validLength,
          image: finalPrimaryImage,
          images: cleanAllImages,
          sizes: formSizes,
          colors: processedColors,
          tags,
          isNewRelease: formIsNewRelease,
          isBestSeller: formIsBestSeller,
          composition: formComposition,
        });

        // Close modal and give immediate success response
        showToast('Produto Atualizado!', `${formTitle} salvo com sucesso no banco.`, 'success');
        setEditingProduct(null);

        // 3. Non-blocking background task: cleanup obsolete storage images if removed
        if (updated) {
          const removedImages = oldImages.filter((oldUrl) => !cleanAllImages.includes(oldUrl));
          if (removedImages.length > 0) {
            setTimeout(() => {
              removedImages.forEach((oldUrl) => {
                const isUsedElsewhere = products.some(
                  (p) => p.id !== editingProduct.id && (p.image === oldUrl || (Array.isArray(p.images) && p.images.includes(oldUrl)))
                );
                if (!isUsedElsewhere) {
                  deleteProductImageFromStorage(oldUrl).catch(() => {});
                }
              });
            }, 100);
          }
        }
      } else {
        await addProduct({
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          slug: formSlug.trim() || formTitle.toLowerCase().replace(/\s+/g, '-'),
          sku: formSku.trim(),
          category: formCategory,
          subcategory: formSubcategory.trim(),
          collection: formCollection.trim(),
          price: validPrice,
          promoPrice: validPromoPrice,
          stockCount: validStock,
          status: formStatus,
          description: formDescription.trim(),
          weight: validWeight,
          height: validHeight,
          width: validWidth,
          length: validLength,
          image: finalPrimaryImage,
          images: cleanAllImages,
          sizes: formSizes,
          colors: processedColors,
          tags,
          rating: 5.0,
          reviewCount: 0,
          isNewRelease: formIsNewRelease,
          isBestSeller: formIsBestSeller,
          composition: formComposition,
          careInstructions: ['Lavar do avesso em água fria', 'Não usar secadora', 'Secar na sombra'],
        });
        showToast('Produto Cadastrado!', `${formTitle} adicionado com sucesso.`, 'success');
        setIsAddOpen(false);
      }
    } catch (err: any) {
      showToast('Erro ao Salvar', err?.message || 'Ocorreu um erro ao salvar o produto no banco.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProduct(deletingId);
      showToast('Produto Removido', 'Peça excluída do catálogo e do banco de dados com sucesso.', 'info');
      setDeletingId(null);
    } catch (err: any) {
      showToast('Erro ao Excluir', err?.message || 'Falha ao remover produto do banco de dados.', 'error');
    }
  };

  // Discount percentage calculator
  const numCurrentPrice = parseNumber(formPrice, 0);
  const numCurrentPromo = formPromoPrice !== undefined && String(formPromoPrice).trim() !== '' ? parseNumber(formPromoPrice, 0) : undefined;
  const discountPercent =
    numCurrentPromo && numCurrentPrice > 0 && numCurrentPromo < numCurrentPrice
      ? Math.round(((numCurrentPrice - numCurrentPromo) / numCurrentPrice) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white border border-[#E5E5E1] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B45309] uppercase">
            <Package className="w-4 h-4" /> Gestão de Inventário & Catálogo
          </div>
          <h2 className="text-xl font-black uppercase text-[#171717] mt-1">
            Produtos ({products.length})
          </h2>
          <p className="text-xs text-[#6B6B66] mt-0.5">
            Cadastre, edite fotos, configure variações de cores/tamanhos e controle o estoque em tempo real.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#F0C84B] text-black font-extrabold text-xs uppercase px-5 py-3 rounded hover:bg-[#F0C84B]/90 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Cadastrar Produto
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E5E1] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#6B6B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, SKU ou categoria..."
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] pl-10 pr-4 py-2.5 rounded-lg text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-[#F9F9F7] border border-[#E5E5E1] text-[#171717] text-xs font-bold px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#B45309]"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id || c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[#F9F9F7] border border-[#E5E5E1] text-[#171717] text-xs font-bold px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#B45309]"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="draft">Rascunhos</option>
            <option value="out_of_stock">Esgotados</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#171717]">
            <thead className="bg-[#F9F9F7] text-[#6B6B66] font-black uppercase text-[10px] tracking-wider border-b border-[#E5E5E1]">
              <tr>
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Estoque</th>
                <th className="p-4">Status & Flags</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6B6B66]">
                    Nenhum produto encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9F9F7] transition-colors">
                    {/* Image & Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-lg bg-[#F9F9F7] overflow-hidden border border-[#E5E5E1] shrink-0">
                          <img
                            src={getValidProductImageUrl(p.image || (p.images && p.images[0]), p.category, p.id)}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleProductImageError(e, p.category, p.id)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[#B45309] font-bold uppercase block">
                            SKU: {p.sku || p.id}
                          </span>
                          <span className="font-bold text-sm text-[#171717] block">{p.title}</span>
                          <span className="text-[11px] text-[#6B6B66] line-clamp-1">{p.collection}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="bg-[#F9F9F7] text-[#171717] border border-[#E5E5E1] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">
                        {p.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-4">
                      <div>
                        {p.promoPrice ? (
                          <>
                            <span className="font-extrabold text-[#B45309] text-sm block">
                              R$ {p.promoPrice.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[11px] text-[#6B6B66] line-through">
                              R$ {p.price.toFixed(2).replace('.', ',')}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-sm text-[#171717]">
                            R$ {p.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock with quick inline editor */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={p.stockCount ?? 20}
                          onBlur={(e) => handleQuickStockChange(p.id, parseInt(e.target.value) || 0)}
                          className="w-16 bg-[#F9F9F7] border border-[#E5E5E1] px-2 py-1 rounded text-center text-xs font-mono font-bold text-[#171717] focus:border-[#B45309] focus:outline-none"
                        />
                        {(p.stockCount ?? 20) < 10 && (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Baixo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status & Flags */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            p.status === 'active' || !p.status
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : p.status === 'out_of_stock'
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
                          }`}
                        >
                          {p.status === 'out_of_stock' ? 'Esgotado' : p.status === 'draft' ? 'Rascunho' : 'Ativo'}
                        </span>

                        {p.isNewRelease && (
                          <span className="text-[10px] font-bold bg-[#F0C84B]/20 text-[#B45309] px-2 py-0.5 rounded border border-[#F0C84B]/50">
                            Novidade
                          </span>
                        )}

                        {p.isBestSeller && (
                          <span className="text-[10px] font-bold bg-orange-50 text-orange-800 px-2 py-0.5 rounded border border-orange-200">
                            Top 1
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 bg-white hover:bg-[#F9F9F7] text-[#171717] border border-[#E5E5E1] hover:border-[#B45309] rounded transition-colors shadow-xs"
                          title="Editar Produto"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#B45309]" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-2 bg-white hover:bg-[#F9F9F7] text-[#6B6B66] hover:text-[#171717] border border-[#E5E5E1] rounded transition-colors shadow-xs"
                          title="Duplicar Produto"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingId(p.id)}
                          className="p-2 bg-white hover:bg-red-50 text-[#6B6B66] hover:text-red-700 border border-[#E5E5E1] hover:border-red-200 rounded transition-colors shadow-xs"
                          title="Excluir Produto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {(editingProduct || isAddOpen) && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-hidden">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden min-w-0 box-border">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E5E5E1] px-5 py-4 sm:px-8 sm:py-5 shrink-0 bg-white">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] font-mono font-bold text-[#B45309] uppercase block">
                  {editingProduct ? 'Modo de Edição' : 'Novo Produto'}
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase text-[#171717] truncate">
                  {editingProduct ? `Editar: ${editingProduct.title}` : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddOpen(false);
                }}
                className="p-1.5 text-[#6B6B66] hover:text-[#171717] hover:bg-[#F9F9F7] rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden min-h-0 min-w-0">
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-8 space-y-6 min-w-0">
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#B45309] border-b border-[#E5E5E1] pb-2">
                    1. Informações Básicas
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Título do Produto *</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Ex: Hoodie Heavyweight Cyber Dystopia"
                        required
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Subtítulo / Destaque</label>
                      <input
                        type="text"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        placeholder="Ex: 400g/m² French Terry Algodão Pesado"
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">SKU / Código</label>
                      <input
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="AURA-HD-001"
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Categoria *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs font-bold text-[#171717] focus:outline-none focus:border-[#B45309]"
                      >
                        {categories.map((c) => (
                          <option key={c.id || c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Coleção / Drop</label>
                      <input
                        type="text"
                        value={formCollection}
                        onChange={(e) => setFormCollection(e.target.value)}
                        placeholder="Vol. 04: Cyber Dystopia"
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Descrição Comercial</label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Detalhes completos sobre caimento, proposta estética e corte..."
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                    />
                  </div>
                </div>

                {/* 2. Pricing, Stock & Status */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#B45309] border-b border-[#E5E5E1] pb-2">
                    2. Preços, Estoque & Status
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Preço Normal (R$) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="199.90"
                        required
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] focus:outline-none focus:border-[#B45309]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">
                        Preço Promo (R$) {discountPercent && <span className="text-[#B45309]">(-{discountPercent}%)</span>}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formPromoPrice ?? ''}
                        onChange={(e) => setFormPromoPrice(e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Estoque Total</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="30"
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Status de Publicação</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs font-bold text-[#171717] focus:outline-none focus:border-[#B45309]"
                      >
                        <option value="active">Ativo no Catálogo</option>
                        <option value="draft">Rascunho (Oculto)</option>
                        <option value="out_of_stock">Esgotado</option>
                      </select>
                    </div>
                  </div>

                  {/* Flags toggles */}
                  <div className="flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#171717]">
                      <input
                        type="checkbox"
                        checked={formIsNewRelease}
                        onChange={(e) => setFormIsNewRelease(e.target.checked)}
                        className="accent-[#B45309] w-4 h-4"
                      />
                      <span>Marcar como Lançamento / Novo Drop</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#171717]">
                      <input
                        type="checkbox"
                        checked={formIsBestSeller}
                        onChange={(e) => setFormIsBestSeller(e.target.checked)}
                        className="accent-[#B45309] w-4 h-4"
                      />
                      <span>Marcar como Mais Vendido / Bestseller</span>
                    </label>
                  </div>
                </div>

              {/* 3. Photos Gallery */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#B45309]">
                    3. Galeria de Fotos ({formImages.length})
                  </h4>
                  <span className="text-[10px] text-[#6B6B66]">A primeira foto é a capa principal</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {/* Caixa 1: Foto Principal / Capa (À esquerda) */}
                  {formImages.length > 0 && formImages[0] ? (
                    <div
                      className="relative group rounded-xl overflow-hidden border-2 border-[#F0C84B] ring-2 ring-[#F0C84B]/30 aspect-[3/4] bg-[#F9F9F7] transition-all"
                    >
                      <img
                        src={formImages[0]}
                        alt="Foto Principal / Capa"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-1.5 left-1.5 bg-[#F0C84B] text-black text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded shadow-xs z-10">
                        ★ Capa
                      </div>

                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between z-20">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenAdjuster(formImages[0], 'Ajustar Foto de Capa', (adjustedUrl) => {
                                const next = [...formImages];
                                next[0] = adjustedUrl;
                                setFormImages(next);
                              })
                            }
                            className="p-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
                            title="Ajustar / Recortar Foto"
                          >
                            <Crop className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(0)}
                            className="p-1 bg-red-950 text-red-400 rounded hover:bg-red-900 transition-colors"
                            title="Remover Capa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="bg-[#F0C84B] hover:bg-white text-black text-[9px] font-black uppercase py-1.5 px-2 rounded text-center transition-colors shadow-xs flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Substituir</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => coverFileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#E5E5E1] hover:border-[#B45309] rounded-xl flex flex-col items-center justify-center p-3 cursor-pointer text-[#6B6B66] hover:text-[#171717] transition-colors aspect-[3/4] text-center group bg-[#F9F9F7]"
                      title="Adicione a foto principal do produto"
                    >
                      <Plus className="w-6 h-6 mb-1.5 text-[#B45309] group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-center leading-tight px-1 text-[#6B6B66] group-hover:text-[#171717] transition-colors">
                        Adicione uma foto do produto
                      </span>
                    </div>
                  )}

                  {/* Caixa 2: Upload Galeria (Imediatamente à direita da foto principal) */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5E5E1] hover:border-[#B45309] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer text-[#6B6B66] hover:text-[#171717] transition-colors aspect-[3/4] text-center group bg-[#F9F9F7]"
                    title="Upload de fotos adicionais da galeria"
                  >
                    <Upload className="w-6 h-6 mb-1 text-[#B45309] group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-center">
                      {isUploading ? 'Enviando...' : '+ Upload'}
                    </span>
                  </div>

                  {/* Fotos Adicionais da Galeria */}
                  {formImages.slice(1).map((imgUrl, idx) => {
                    const index = idx + 1;
                    return (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden border border-[#E5E5E1] hover:border-[#B45309] aspect-[3/4] bg-[#F9F9F7] transition-all"
                      >
                        <img
                          src={imgUrl}
                          alt={`Foto ${index + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenAdjuster(imgUrl, `Ajustar Foto ${index + 1}`, (adjustedUrl) => {
                                  const next = [...formImages];
                                  next[index] = adjustedUrl;
                                  setFormImages(next);
                                })
                              }
                              className="p-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
                              title="Ajustar / Recortar Foto"
                            >
                              <Crop className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="p-1 bg-red-950 text-red-400 rounded hover:bg-red-900 transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSetCover(index)}
                            className="bg-[#F0C84B] text-black text-[9px] font-black uppercase py-1 px-1.5 rounded text-center hover:bg-white transition-colors"
                          >
                            Tornar Capa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cover file input */}
                <input
                  type="file"
                  ref={coverFileInputRef}
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />

                {/* Multiple gallery upload file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Ou cole a URL direta de uma foto (Unsplash, CDN...)"
                    className="flex-1 bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-2 rounded text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="bg-white hover:bg-[#F9F9F7] text-[#B45309] border border-[#E5E5E1] px-3.5 py-2 rounded text-xs font-bold uppercase transition-colors"
                  >
                    Adicionar URL
                  </button>
                </div>
              </div>

              {/* 4. Variantes do Produto */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#B45309] border-b border-[#E5E5E1] pb-2">
                  4. Variantes do Produto
                </h4>

                {/* TAMANHOS */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#171717] block">
                    Tamanhos Disponíveis
                  </span>

                  {/* Grupo: Roupas */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wider">
                      Roupas
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {BASE_CLOTHING_SIZES.map((sz) => {
                        const isSelected = formSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleSize(sz)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all select-none min-w-[42px] ${
                              isSelected
                                ? 'bg-[#F0C84B] text-black border-[#F0C84B] font-extrabold shadow-xs'
                                : 'bg-[#F9F9F7] text-[#6B6B66] border-[#E5E5E1] hover:text-[#171717] hover:border-[#B45309]'
                            }`}
                          >
                            <span>{sz}</span>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        );
                      })}

                      {/* Custom clothing sizes */}
                      {customSizes
                        .filter((s) => categorizeSize(s) === 'clothing')
                        .map((sz) => {
                          const isSelected = formSizes.includes(sz);
                          return (
                            <div
                              key={sz}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all select-none ${
                                isSelected
                                  ? 'bg-[#F0C84B] text-black border-[#F0C84B] font-extrabold shadow-xs'
                                  : 'bg-[#F9F9F7] text-[#6B6B66] border-[#E5E5E1] hover:text-[#171717] hover:border-[#B45309]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleSize(sz)}
                                className="inline-flex items-center gap-1"
                              >
                                <span>{sz}</span>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomSize(sz);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  isSelected
                                    ? 'text-black/70 hover:text-red-700 hover:bg-black/10'
                                    : 'text-[#6B6B66] hover:text-red-600'
                                }`}
                                title={`Remover tamanho ${sz}`}
                              >
                                <X className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Grupo: Numeração */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wider">
                      Numeração
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {BASE_NUMBER_SIZES.map((sz) => {
                        const isSelected = formSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleSize(sz)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all select-none min-w-[42px] ${
                              isSelected
                                ? 'bg-[#F0C84B] text-black border-[#F0C84B] font-extrabold shadow-xs'
                                : 'bg-[#F9F9F7] text-[#6B6B66] border-[#E5E5E1] hover:text-[#171717] hover:border-[#B45309]'
                            }`}
                          >
                            <span>{sz}</span>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        );
                      })}

                      {/* Custom number sizes */}
                      {customSizes
                        .filter((s) => categorizeSize(s) === 'number')
                        .map((sz) => {
                          const isSelected = formSizes.includes(sz);
                          return (
                            <div
                              key={sz}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all select-none ${
                                isSelected
                                  ? 'bg-[#F0C84B] text-black border-[#F0C84B] font-extrabold shadow-xs'
                                  : 'bg-[#F9F9F7] text-[#6B6B66] border-[#E5E5E1] hover:text-[#171717] hover:border-[#B45309]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleSize(sz)}
                                className="inline-flex items-center gap-1"
                              >
                                <span>{sz}</span>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomSize(sz);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  isSelected
                                    ? 'text-black/70 hover:text-red-700 hover:bg-black/10'
                                    : 'text-[#6B6B66] hover:text-red-600'
                                }`}
                                title={`Remover tamanho ${sz}`}
                              >
                                <X className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Grupo: Outros */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wider">
                      Outros
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {BASE_OTHER_SIZES.map((sz) => {
                        const isSelected = formSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleSize(sz)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all select-none min-w-[42px] ${
                              isSelected
                                ? 'bg-[#F0C84B] text-black border-[#F0C84B] font-extrabold shadow-xs'
                                : 'bg-[#F9F9F7] text-[#6B6B66] border-[#E5E5E1] hover:text-[#171717] hover:border-[#B45309]'
                            }`}
                          >
                            <span>{sz}</span>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        );
                      })}

                      {/* Custom other sizes */}
                      {customSizes
                        .filter((s) => categorizeSize(s) === 'other')
                        .map((sz) => {
                          const isSelected = formSizes.includes(sz);
                          return (
                            <div
                              key={sz}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all select-none ${
                                isSelected
                                  ? 'bg-[#F0C84B] text-black border-[#F0C84B] font-extrabold shadow-xs'
                                  : 'bg-[#F9F9F7] text-[#6B6B66] border-[#E5E5E1] hover:text-[#171717] hover:border-[#B45309]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleSize(sz)}
                                className="inline-flex items-center gap-1"
                              >
                                <span>{sz}</span>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomSize(sz);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  isSelected
                                    ? 'text-black/70 hover:text-red-700 hover:bg-black/10'
                                    : 'text-[#6B6B66] hover:text-red-600'
                                }`}
                                title={`Remover tamanho ${sz}`}
                              >
                                <X className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                          );
                        })}

                      {/* Botão + Tamanho Personalizado */}
                      <button
                        type="button"
                        onClick={() => setIsCustomSizeOpen(!isCustomSizeOpen)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${
                          isCustomSizeOpen
                            ? 'bg-[#F0C84B]/20 text-[#B45309] border-[#B45309]'
                            : 'bg-[#F9F9F7] hover:bg-white text-[#B45309] border-[#E5E5E1] hover:border-[#B45309]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tamanho Personalizado</span>
                      </button>
                    </div>

                    {/* Small field when "+ TAMANHO PERSONALIZADO" is clicked */}
                    {isCustomSizeOpen && (
                      <div className="flex items-center gap-2 pt-2 animate-fadeIn">
                        <input
                          type="text"
                          value={newSizeInput}
                          onChange={(e) => setNewSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddCustomSize();
                            }
                          }}
                          placeholder="Ex: 48 (número), XXG (roupa), Infantil..."
                          autoFocus
                          className="bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-1.5 rounded-lg text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309] w-56 sm:w-64"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSize()}
                          className="bg-[#F0C84B] hover:bg-[#F0C84B]/90 text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs uppercase transition-colors shrink-0 shadow-xs"
                        >
                          Adicionar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomSizeOpen(false);
                            setNewSizeInput('');
                          }}
                          className="p-1.5 text-[#6B6B66] hover:text-[#171717] transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Resumo discreto */}
                  <div className="pt-1 text-xs text-[#6B6B66] flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#171717]">
                      {formSizes.length} {formSizes.length === 1 ? 'tamanho selecionado' : 'tamanhos selecionados'}
                    </span>
                    {formSizes.length > 0 && (
                      <>
                        <span className="text-[#E5E5E1]">•</span>
                        <span className="text-[#B45309] font-bold">
                          {formSizes.join(' • ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Linha divisória */}
                <div className="border-t border-[#E5E5E1] my-4" />

                {/* CORES & VARIANTES COM GALERIA PRÓPRIA */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E5E5E1] pb-2">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> Variantes por Cor & Galerias Específicas
                      </span>
                      <p className="text-[11px] text-[#6B6B66] mt-0.5">
                        Cadastre cada cor e faça o upload das fotos correspondentes. Ao cliente selecionar uma cor no site, a galeria mudará automaticamente para as fotos desta cor.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[#6B6B66] shrink-0 font-bold">
                      {formColors.length} {formColors.length === 1 ? 'cor cadastrada' : 'cores cadastradas'}
                    </span>
                  </div>

                  {/* Lista de Cards de Cada Cor */}
                  <div className="space-y-4">
                    {formColors.map((col, variantIdx) => {
                      const variantImages = col.images || (col.featuredImage ? [col.featuredImage] : (col.image ? [col.image] : []));
                      const featuredImg = col.featuredImage || variantImages[0] || '';

                      return (
                        <div
                          key={variantIdx}
                          className="bg-[#F9F9F7] border border-[#E5E5E1] hover:border-[#B45309]/50 rounded-xl p-4 space-y-3.5 transition-all shadow-xs"
                        >
                          {/* Top bar do card da cor */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E5E5E1]">
                            <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                              {/* Color Swatch & Preset Popover */}
                              <div className="flex items-center justify-center shrink-0">
                                <AdminColorPicker
                                  value={col.colorHex || '#121212'}
                                  onChange={(newHex, suggestedName) => {
                                    const updates: Partial<ProductVariant> = { colorHex: newHex };
                                    if (suggestedName && (!col.colorName || col.colorName.trim() === '')) {
                                      updates.colorName = suggestedName;
                                      updates.color = suggestedName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
                                    }
                                    handleVariantUpdateInfo(variantIdx, updates);
                                  }}
                                  title="Escolher cor pré-definida ou personalizada"
                                  size="md"
                                />
                              </div>

                              {/* Input Nome da Cor */}
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={col.colorName}
                                  onChange={(e) =>
                                    handleVariantUpdateInfo(variantIdx, {
                                      colorName: e.target.value,
                                      color: e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
                                    })
                                  }
                                  placeholder="Ex: Obsidian Black, Off-White, Bege Areia..."
                                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3 py-1.5 rounded-lg text-xs font-bold text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                                />
                              </div>

                              {/* Hex Input */}
                              <div className="w-24">
                                <input
                                  type="text"
                                  value={col.colorHex}
                                  onChange={(e) =>
                                    handleVariantUpdateInfo(variantIdx, { colorHex: e.target.value })
                                  }
                                  placeholder="#121212"
                                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#B45309] font-bold uppercase focus:outline-none focus:border-[#B45309] text-center"
                                />
                              </div>
                            </div>

                            {/* Ações da variante */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold text-[#6B6B66]">
                                {variantImages.length} {variantImages.length === 1 ? 'foto' : 'fotos'}
                              </span>

                              {formColors.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColor(variantIdx)}
                                  className="text-[#6B6B66] hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  title={`Remover cor "${col.colorName}"`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Galeria de Fotos da Variante */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1">
                                Fotos desta cor ({col.colorName || 'Sem nome'}):
                              </span>
                              {variantImages.length === 0 && (
                                <span className="text-[10px] text-amber-700 font-medium">
                                  Nenhuma foto específica. Usará a galeria geral como reserva.
                                </span>
                              )}
                            </div>

                            {/* Grid de Imagens da Variante */}
                            {variantImages.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                {variantImages.map((imgUrl, imgIdx) => {
                                  const isCover = imgUrl === featuredImg || imgIdx === 0;
                                  return (
                                    <div
                                      key={imgIdx}
                                      className={`group/img relative aspect-[3/4] bg-white border rounded-lg overflow-hidden transition-all ${
                                        isCover
                                          ? 'border-[#F0C84B] ring-1 ring-[#F0C84B]/50 shadow-xs'
                                          : 'border-[#E5E5E1] hover:border-[#B45309]'
                                      }`}
                                    >
                                      <img
                                        src={getValidProductImageUrl(imgUrl, formCategory, `${col.colorName}-${imgIdx}`)}
                                        alt={`${col.colorName} ${imgIdx + 1}`}
                                        referrerPolicy="no-referrer"
                                        onError={(e) => handleProductImageError(e, formCategory, `${col.colorName}-${imgIdx}`)}
                                        className="w-full h-full object-cover"
                                      />

                                      {/* Badge Capa */}
                                      {isCover && (
                                        <div className="absolute top-1.5 left-1.5 bg-[#F0C84B] text-black font-black text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs">
                                          CAPA
                                        </div>
                                      )}

                                      {/* Overlay com Ações */}
                                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col justify-between p-1.5 backdrop-blur-xs">
                                        <div className="flex justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenAdjuster(
                                                imgUrl,
                                                `Ajustar Foto: ${col.colorName}`,
                                                (adjustedUrl) => {
                                                  const copy = [...variantImages];
                                                  copy[imgIdx] = adjustedUrl;
                                                  handleVariantUpdateInfo(variantIdx, {
                                                    images: copy,
                                                    featuredImage: isCover ? adjustedUrl : featuredImg,
                                                  });
                                                  setAdjustModalOpen(false);
                                                }
                                              )
                                            }
                                            className="p-1 bg-white/20 text-white hover:text-[#F0C84B] rounded transition-colors"
                                            title="Ajustar / Cortar Foto"
                                          >
                                            <Crop className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleVariantRemoveImage(variantIdx, imgIdx)}
                                            className="p-1 bg-red-950/80 text-red-300 hover:text-red-100 rounded transition-colors"
                                            title="Remover Foto desta cor"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>

                                        {!isCover && (
                                          <button
                                            type="button"
                                            onClick={() => handleVariantSetCover(variantIdx, imgIdx)}
                                            className="w-full bg-[#F0C84B] hover:bg-white text-black font-black text-[9px] uppercase py-1 rounded transition-colors shadow-xs"
                                          >
                                            Definir Capa
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Controles de Upload para esta Variante */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {/* Botão Upload de Arquivos */}
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F9F9F7] text-[#171717] border border-[#E5E5E1] rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-xs">
                                <Upload className="w-3.5 h-3.5 text-[#B45309]" />
                                <span>Upload Fotos ({col.colorName || 'Cor'})</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => handleVariantFileUpload(variantIdx, e)}
                                  className="hidden"
                                />
                              </label>

                              {/* Input URL Rápida para a Variante */}
                              <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
                                <input
                                  type="url"
                                  id={`var-url-input-${variantIdx}`}
                                  placeholder="Ou cole a URL da imagem desta cor..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const input = e.currentTarget;
                                      handleVariantAddUrl(variantIdx, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="flex-1 bg-white border border-[#E5E5E1] px-3 py-1.5 rounded-lg text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`var-url-input-${variantIdx}`) as HTMLInputElement;
                                    if (input && input.value) {
                                      handleVariantAddUrl(variantIdx, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-white hover:bg-[#F9F9F7] text-[#B45309] border border-[#E5E5E1] rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs"
                                >
                                  + URL
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Adicionar Nova Cor */}
                  <div className="bg-white border border-[#E5E5E1] p-3.5 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
                      + Adicionar Nova Cor / Variante
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddColor();
                          }
                        }}
                        placeholder="Nome da cor (Ex: Raw Bone, Branco, Moletom Cinza...)"
                        className="flex-1 min-w-[200px] bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2 rounded-lg text-xs text-[#171717] placeholder-[#6B6B66] focus:outline-none focus:border-[#B45309]"
                      />
                      <div className="flex items-center gap-2 bg-[#F9F9F7] border border-[#E5E5E1] px-2.5 py-1 rounded-lg">
                        <AdminColorPicker
                          value={newColorHex || '#181818'}
                          onChange={(newHex, suggestedName) => {
                            setNewColorHex(newHex);
                            if (suggestedName && (!newColorName || newColorName.trim() === '')) {
                              setNewColorName(suggestedName);
                            }
                          }}
                          title="Escolher tom da nova cor"
                          size="sm"
                        />
                        <span className="text-[11px] font-mono text-[#B45309] uppercase font-bold">{newColorHex}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="bg-[#F0C84B] hover:bg-[#F0C84B]/90 text-black font-extrabold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Adicionar Cor</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Logistics & Packaging (Melhor Envio) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#B45309]">
                    5. Dimensões & Peso para Frete (Melhor Envio)
                  </h4>
                  <span className="text-[10px] text-[#6B6B66]">Utilizado para cotação e geração de etiquetas reais</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                  <div>
                    <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Peso (kg) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      required
                      placeholder="0.35"
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] font-mono focus:outline-none focus:border-[#B45309]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Altura (cm) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formHeight}
                      onChange={(e) => setFormHeight(e.target.value)}
                      required
                      placeholder="4"
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] font-mono focus:outline-none focus:border-[#B45309]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Largura (cm) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formWidth}
                      onChange={(e) => setFormWidth(e.target.value)}
                      required
                      placeholder="20"
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] font-mono focus:outline-none focus:border-[#B45309]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#6B6B66] block mb-1">Comprimento (cm) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formLength}
                      onChange={(e) => setFormLength(e.target.value)}
                      required
                      placeholder="25"
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] px-3.5 py-2.5 rounded text-xs text-[#171717] font-mono focus:outline-none focus:border-[#B45309]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Modal Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 px-5 py-4 sm:px-8 sm:py-4 border-t border-[#E5E5E1] bg-white shrink-0">
              <button
                type="button"
                disabled={isSaving || isUploading}
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddOpen(false);
                }}
                className="w-full sm:flex-1 bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] py-3 rounded-xl text-xs font-bold uppercase transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="w-full sm:flex-1 bg-[#F0C84B] text-black font-extrabold py-3 rounded-xl text-xs uppercase hover:bg-[#F0C84B]/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando e Salvando...</span>
                  </>
                ) : (
                  <span>{editingProduct ? 'Salvar Alterações' : 'Publicar Produto'}</span>
                )}
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
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto border border-red-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black uppercase text-[#171717]">Excluir Produto?</h3>
            <p className="text-xs text-[#6B6B66]">
              Tem certeza que deseja remover esta peça do inventário? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-[#F9F9F7] border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] py-2.5 rounded-xl text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase transition-colors"
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
        initialAspectRatio="4:5"
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
