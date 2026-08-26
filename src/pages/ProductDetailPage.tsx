import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumb } from '../components/Breadcrumb';
import { ShippingCalculator } from '../components/ShippingCalculator';
import { SizeGuideModal } from '../components/SizeGuideModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import {
  Star,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Ruler,
  Check,
  Plus,
  Minus,
  Share2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { getValidProductImageUrl, handleProductImageError } from '../utils/imageUtils';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (page: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
  onQuickView,
}) => {
  const { products } = useStore();
  const { user } = useAuth();
  const product = products.find((p) => p.id === productId || p.slug === productId) || products[0];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductVariant>(
    product?.colors?.[0] || { color: 'black', colorName: 'Preto Ônix', colorHex: '#121212' }
  );
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'measurements' | 'care' | 'shipping'>('details');

  // Review Form State
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewName, setNewReviewName] = useState(user?.name || '');
  const [reviewsList, setReviewsList] = useState<any[]>(product?.reviews || []);

  const loadProductReviews = async (pId: string) => {
    try {
      const res = await fetch(`/api/products/${pId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReviewsList(data);
          return;
        }
      }
    } catch {
      // fallback
    }
    if (product?.reviews) {
      setReviewsList(product.reviews);
    }
  };

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0] || { color: 'black', colorName: 'Preto Ônix', colorHex: '#121212' });
      setSelectedSize(product.sizes?.[0] || 'M');
      setSelectedImageIndex(0);
      loadProductReviews(product.id);
    }
  }, [product?.id]);

  useEffect(() => {
    if (user?.name && !newReviewName) {
      setNewReviewName(user.name);
    }
  }, [user]);

  const { addToCart, openMiniCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  if (!product) {
    return (
      <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#B45309] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#71717A]">Carregando produto...</p>
        </div>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);

  // Dynamic Image Gallery tied to the selected Color Variant
  const images = React.useMemo(() => {
    let rawList: string[] = [];
    const primaryProductImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');

    // 1. If the selected color has its own gallery of images
    if (selectedColor?.images && Array.isArray(selectedColor.images) && selectedColor.images.length > 0) {
      rawList = selectedColor.images;
    } else if (selectedColor?.featuredImage || selectedColor?.image) {
      rawList = [selectedColor.featuredImage || selectedColor.image!];
    } else if (product.images && product.images.length > 0) {
      rawList = primaryProductImage && product.images[0] !== primaryProductImage
        ? [primaryProductImage, ...product.images.filter(x => x !== primaryProductImage)]
        : product.images;
    } else if (primaryProductImage) {
      rawList = [primaryProductImage];
    }

    if (rawList.length === 0) {
      return [getValidProductImageUrl(null, product.category, product.id)];
    }

    return rawList.map((img, idx) =>
      getValidProductImageUrl(img, product.category, `${product.id}-${idx}`)
    );
  }, [selectedColor, product]);

  const handleSelectColor = (colorVariant: ProductVariant) => {
    setSelectedColor(colorVariant);
    setSelectedImageIndex(0);
  };

  const effectivePrice = product.promoPrice || product.price;
  const installmentCount = 6;
  const installmentValue = effectivePrice / installmentCount;
  const pixPrice = effectivePrice * 0.95;

  const handleAddToCart = () => {
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1200);
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    showToast(
      isFavorite ? 'Removido dos Favoritos' : 'Adicionado aos Favoritos',
      product.title,
      'info'
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Confira ${product.title} na Marmot Confecções:`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copiado!', 'Endereço da peça copiado para a área de transferência.', 'info');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName || !newReviewTitle || !newReviewComment) {
      showToast('Atenção', 'Preencha todos os campos da avaliação.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          userId: user?.id,
          userName: newReviewName,
          userEmail: user?.email,
          rating: newReviewRating,
          title: newReviewTitle,
          comment: newReviewComment,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setReviewsList([saved, ...reviewsList]);
        setIsReviewFormOpen(false);
        setNewReviewTitle('');
        setNewReviewComment('');
        showToast('Avaliação enviada!', 'Obrigado por compartilhar seu feedback.', 'success');
      } else {
        const err = await res.json();
        showToast('Aviso', err.error || 'Erro ao registrar avaliação.', 'error');
      }
    } catch {
      showToast('Erro', 'Não foi possível enviar a avaliação.', 'error');
    }
  };

  const relatedProducts = products
    .filter((p) => p.id !== product?.id)
    .slice(0, 4);

  return (
    <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Início', onClick: () => onNavigate('home') },
            { label: 'Catálogo', onClick: () => onNavigate('shop') },
            { label: product.category.toUpperCase(), onClick: () => onNavigate('shop', product.category) },
            { label: product.title },
          ]}
        />

        {/* Product Main Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 my-8 items-start">
          {/* 1. Left Column: Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] sm:aspect-[2/3] bg-[#F4F4F5] border border-[#E4E4E7] rounded-2xl overflow-hidden group shadow-xs">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                onError={(e) => handleProductImageError(e, product.category, `${product.id}-${selectedImageIndex}`)}
                className="w-full h-full object-cover object-[center_top] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />

              {/* Minimal Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.isNewRelease && (
                  <span className="bg-[#18181B] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-md">
                    NOVO DROP
                  </span>
                )}
                {product.promoPrice && (
                  <span className="bg-[#DC2626] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-md">
                    -{Math.round(((product.price - product.promoPrice) / product.price) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="absolute top-4 right-4 p-3 bg-white/80 hover:bg-[#18181B] hover:text-white rounded-full border border-[#E4E4E7] text-[#18181B] transition-all backdrop-blur-md shadow-md cursor-pointer"
                title="Compartilhar Peça"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-24 sm:w-24 sm:h-32 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-[#F4F4F5] ${
                      selectedImageIndex === idx
                        ? 'border-[#18181B] shadow-md scale-95'
                        : 'border-[#E4E4E7] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleProductImageError(e, product.category, `${product.id}-thumb-${idx}`)}
                      className="w-full h-full object-cover object-[center_top]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Right Column: Buy Box & Specs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {/* Category & Collection */}
              <div className="flex items-center justify-between text-xs font-mono text-[#71717A] uppercase tracking-wider mb-2">
                <span>{product.collection || 'Drop 04 // Essenciais'}</span>
                <span>SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#18181B] leading-tight">
                {product.title}
              </h1>

              {/* Subtitle / Spec */}
              <p className="text-xs sm:text-sm text-[#52525B] mt-1.5 font-medium">
                {product.subtitle || 'Malha Heavyweight Boxy Fit'}
              </p>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? 'fill-current' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#18181B]">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-[#71717A]">
                  ({reviewsList.length} avaliações verificadas)
                </span>
              </div>
            </div>

            {/* Price & Installments Card */}
            <div className="p-5 bg-white border border-[#E4E4E7] rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-[#18181B]">
                      R$ {effectivePrice.toFixed(2).replace('.', ',')}
                    </span>
                    {product.promoPrice && (
                      <span className="text-sm font-bold text-[#71717A] line-through">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#52525B] mt-1">
                    em até <strong>{installmentCount}x de R$ {installmentValue.toFixed(2).replace('.', ',')}</strong> sem juros no cartão
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    5% OFF NO PIX
                  </span>
                  <p className="text-xs font-mono font-bold text-[#92400E] mt-1">
                    R$ {pixPrice.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>

            {/* Color Swatch Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
                  Cor: <span className="text-[#18181B] font-extrabold">{selectedColor.colorName}</span>
                </label>
                <div className="flex items-center gap-3">
                  {product.colors.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectColor(c)}
                      className={`p-1 rounded-full border-2 cursor-pointer select-none touch-manipulation active:scale-90 transition-transform duration-75 ${
                        selectedColor.colorName === c.colorName
                          ? 'border-[#18181B] scale-110'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={c.colorName}
                    >
                      <span
                        className="w-7 h-7 rounded-full block border border-black/10 shadow-sm"
                        style={{ backgroundColor: c.colorHex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                  Tamanho (Modelagem Boxy)
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-[#B45309] hover:underline font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform duration-75"
                >
                  <Ruler className="w-3.5 h-3.5" /> Guia de Medidas
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {(product.sizes || ['P', 'M', 'G', 'GG', 'XG']).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-3 rounded-xl text-xs font-black uppercase border cursor-pointer select-none touch-manipulation active:scale-95 transition-all duration-75 ${
                      selectedSize === sz
                        ? 'bg-[#18181B] text-white border-[#18181B] shadow-md scale-[1.02]'
                        : 'bg-[#F8F9FA] text-[#52525B] border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B] active:bg-[#E4E4E7]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Model Measurement Aid */}
              <p className="text-[11px] text-[#71717A] pt-1">
                💡 O modelo mede 1,84m, pesa 78kg e veste tamanho <strong>G</strong>.
              </p>

              {product.stockCount <= 8 && (
                <p className="text-xs text-amber-600 font-mono font-bold">
                  Restam apenas {product.stockCount} unidades no ateliê!
                </p>
              )}
            </div>

            {/* Quantity and Primary Action */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Box */}
                <div className="flex items-center bg-[#F8F9FA] border border-[#E4E4E7] rounded-xl p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 text-[#71717A] hover:text-[#18181B] cursor-pointer select-none touch-manipulation active:scale-90 active:text-[#18181B] transition-transform duration-75"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs text-[#18181B] select-none">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 text-[#71717A] hover:text-[#18181B] cursor-pointer select-none touch-manipulation active:scale-90 active:text-[#18181B] transition-transform duration-75"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 font-black text-xs uppercase tracking-widest py-4 px-6 rounded-xl transition-all duration-75 flex items-center justify-center gap-2.5 shadow-md cursor-pointer select-none touch-manipulation active:scale-95 ${
                    isAddedRecently
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-[#F4C400] hover:bg-[#E5B500] text-[#0B0B0E]'
                  }`}
                >
                  {isAddedRecently ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>ADICIONADO!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                      <span>ADICIONAR AO CARRINHO</span>
                    </>
                  )}
                </button>

                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`p-4 rounded-xl border transition-all duration-75 cursor-pointer select-none touch-manipulation active:scale-90 ${
                    isFavorite
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-[#F8F9FA] text-[#71717A] border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B]'
                  }`}
                  title="Salvar nos Favoritos"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* CEP Shipping Calculator Component */}
            <ShippingCalculator
              productId={product.id}
              subtotal={(product.promoPrice || product.price) * quantity}
              items={[{ productId: product.id, quantity }]}
            />

            {/* Trust Assurances */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E4E4E7] text-xs text-[#71717A]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#B45309]" />
                <span>Frete Grátis acima de R$ 399</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#B45309]" />
                <span>1ª Troca Grátis em até 30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B45309]" />
                <span>Ateliê em São Paulo</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#B45309]" />
                <span>Pagamento 100% Seguro</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Product Specifications & Care Tabs */}
        <div className="my-16 bg-white border border-[#E4E4E7] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex border-b border-[#E4E4E7] gap-6 overflow-x-auto scrollbar-none pb-2">
            {[
              { id: 'details', label: 'Especificações & Detalhes' },
              { id: 'measurements', label: 'Tabela de Medidas (cm)' },
              { id: 'care', label: 'Instruções de Lavagem' },
              { id: 'shipping', label: 'Envios & Trocas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#18181B] text-[#18181B]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Details */}
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs text-[#52525B] leading-relaxed">
              <p className="text-sm font-medium text-[#18181B] whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
              <ul className="space-y-2 pt-2">
                {(product.details || [
                  '100% Algodão Nacional Penteado de Fibra Longa',
                  'Modelagem Boxy Fit exclusiva com ombros rebaixados',
                  'Gola canelada de 3cm pespontada',
                  'Tecido pré-encolhido que não deforma após lavagens',
                  'Confeccionado artesanalmente em São Paulo'
                ]).map((d: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 2: Measurements */}
          {activeTab === 'measurements' && (
            <div className="space-y-4">
              <p className="text-xs text-[#71717A]">
                Medidas tiradas com a peça plana em centímetros (tolerância de até 1,5cm):
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F4F4F5] text-[#18181B] uppercase font-mono">
                    <tr>
                      <th className="p-3">Tamanho</th>
                      <th className="p-3">Tórax (Largura)</th>
                      <th className="p-3">Comprimento</th>
                      <th className="p-3">Ombro a Ombro</th>
                      <th className="p-3">Manga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7] text-[#18181B]">
                    <tr>
                      <td className="p-3 font-bold">P</td>
                      <td className="p-3">56 cm</td>
                      <td className="p-3">71 cm</td>
                      <td className="p-3">52 cm</td>
                      <td className="p-3">22 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">M</td>
                      <td className="p-3">59 cm</td>
                      <td className="p-3">74 cm</td>
                      <td className="p-3">55 cm</td>
                      <td className="p-3">23 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">G</td>
                      <td className="p-3">62 cm</td>
                      <td className="p-3">77 cm</td>
                      <td className="p-3">58 cm</td>
                      <td className="p-3">24 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">GG</td>
                      <td className="p-3">65 cm</td>
                      <td className="p-3">80 cm</td>
                      <td className="p-3">61 cm</td>
                      <td className="p-3">25 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">XG</td>
                      <td className="p-3">68 cm</td>
                      <td className="p-3">83 cm</td>
                      <td className="p-3">64 cm</td>
                      <td className="p-3">26 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Care */}
          {activeTab === 'care' && (
            <div className="space-y-3 text-xs text-[#52525B]">
              <p className="font-bold text-[#18181B]">Para manter sua peça com aspecto de nova por anos:</p>
              <ul className="space-y-2 list-disc list-inside">
                {(product.careInstructions || [
                  'Lavar na máquina em ciclo suave com água fria',
                  'Lavar preferencialmente do avesso para proteger o acabamento',
                  'Não usar alvejantes ou produtos à base de cloro',
                  'Secar no varal à sombra (evite secadora para máxima durabilidade)',
                  'Passar do avesso em temperatura média'
                ]).map((c: string, idx: number) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 4: Shipping */}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs text-[#52525B] leading-relaxed">
              <p>
                <strong className="text-[#18181B]">Expedição Rápida:</strong> Pedidos com pagamento aprovado até as 14h são postados em até 24h úteis direto do nosso ateliê em São Paulo.
              </p>
              <p>
                <strong className="text-[#18181B]">1ª Troca Grátis (30 dias):</strong> Se o tamanho não ficar perfeito, você tem 30 dias corridos para solicitar a troca sem nenhum custo de frete.
              </p>
              <p>
                <strong className="text-[#18181B]">Frete Grátis:</strong> Válido automaticamente para todo o Brasil em compras acima de R$ 399.
              </p>
            </div>
          )}
        </div>

        {/* 4. Customer Reviews Section */}
        <div className="my-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E4E7] pb-6">
            <div>
              <span className="text-xs font-mono font-bold text-[#B45309] uppercase tracking-wider block mb-1">
                PROVA SOCIAL
              </span>
              <h2 className="text-2xl font-black uppercase text-[#18181B]">
                AVALIAÇÕES DE QUEM COMPROU
              </h2>
            </div>

            <button
              onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
              className="bg-[#F8F9FA] hover:bg-[#18181B] hover:text-white border border-[#E4E4E7] text-[#18181B] font-bold text-xs uppercase px-5 py-3 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {isReviewFormOpen ? 'Fechar Formulário' : 'Escrever Avaliação'}
            </button>
          </div>

          {/* Form to submit review */}
          {isReviewFormOpen && (
            <form onSubmit={handleAddReview} className="bg-white border border-[#E4E4E7] p-6 rounded-2xl space-y-4 animate-fadeIn shadow-xs">
              <h3 className="text-xs font-bold uppercase text-[#18181B]">Sua Avaliação sobre a Peça</h3>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#71717A]">Sua Nota:</span>
                <div className="flex text-[#F59E0B] cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      className={`w-5 h-5 ${star <= newReviewRating ? 'fill-current' : 'opacity-30'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Seu Nome</label>
                  <input
                    type="text"
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    required
                    placeholder="Ex: Lucas Silva"
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-2.5 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Título da Avaliação</label>
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    required
                    placeholder="Ex: Caimento perfeito, malha de alta gramatura"
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-2.5 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#71717A] block mb-1">Comentário Detalhado</label>
                <textarea
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  required
                  placeholder="Conte como foi sua experiência com o caimento, tecido, acabamento e entrega..."
                  className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-2.5 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                />
              </div>

              <button
                type="submit"
                className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-bold text-xs uppercase px-6 py-3 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Publicar Avaliação
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewsList.map((rev: any, idx: number) => (
              <div key={idx} className="bg-white border border-[#E4E4E7] p-6 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex text-[#F59E0B] gap-0.5">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Compra Verificada
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#18181B] uppercase">
                  {rev.title || 'Excelente qualidade'}
                </h4>

                <p className="text-xs text-[#52525B] leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="pt-3 border-t border-[#E4E4E7] flex justify-between items-center text-[11px] text-[#71717A]">
                  <span className="font-bold text-[#18181B]">{rev.userName}</span>
                  <span className="font-mono">{rev.date || 'Recente'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Related Products */}
        <div className="my-16 space-y-8">
          <div className="border-b border-[#E4E4E7] pb-4">
            <span className="text-xs font-mono font-bold text-[#B45309] uppercase tracking-wider block mb-1">
              RECOMENDAÇÕES DE ATELIÊ
            </span>
            <h2 className="text-2xl font-black uppercase text-[#18181B]">
              COMPLETE O VISUAL
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onQuickView={onQuickView}
                onProductClick={(id) => onNavigate('product', id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          category={product.category}
        />
      )}
    </div>
  );
};
