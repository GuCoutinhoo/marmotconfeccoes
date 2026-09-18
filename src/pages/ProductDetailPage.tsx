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
import { MarmotPrice, MarmotBadge } from '../components/ui/MarmotElements';

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
  const { products, isLoading, isInitialized } = useStore();
  const { user } = useAuth();

  // Strict product search by id or slug - NEVER fallback to products[0] or any other product
  const product = products.find(
    (p) => p.id === productId || p.slug === productId
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
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
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // Synchronously reset selections when product changes to prevent stale data leaking across products
  const [lastTrackedId, setLastTrackedId] = useState<string | null>(null);
  if (product && product.id !== lastTrackedId) {
    setLastTrackedId(product.id);
    setSelectedImageIndex(0);
    setSelectedColor(product.colors?.[0] || null);
    setSelectedSize(product.sizes?.[0] || '');
    setReviewsList(product.reviews || []);
    setQuantity(1);
    setIsAddedRecently(false);
    setIsReviewFormOpen(false);
  } else if (!product && lastTrackedId !== null) {
    setLastTrackedId(null);
    setSelectedImageIndex(0);
    setSelectedColor(null);
    setSelectedSize('');
    setReviewsList([]);
  }

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!product) {
      return;
    }

    let isSubscribed = true;
    const loadProductReviews = async (pId: string) => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(pId)}/reviews`);
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (Array.isArray(data) && isSubscribed) {
            setReviewsList(data);
          }
        }
      } catch {
        // Keep initial product.reviews
      }
    };

    loadProductReviews(product.id);

    return () => {
      isSubscribed = false;
    };
  }, [productId, product?.id]);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  if (!product) {
    // 1. While catalog is still loading, show loading spinner to avoid premature "not found"
    if (isLoading || !isInitialized) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-[#18181B] border-t-[#F4C400] rounded-full animate-spin mb-3" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#71717A]">
            Carregando peça...
          </span>
        </div>
      );
    }

    // 2. Once catalog finishes loading, if product doesn't exist, display "Peça não encontrada"
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-black uppercase text-[#0B0B0E] mb-2">Peça não encontrada</h2>
        <p className="text-xs text-zinc-500 mb-4">O item solicitado não está disponível no catálogo atual.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="bg-[#0B0B0E] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-[2px]"
        >
          Ver Todo o Catálogo
        </button>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const activeColor: ProductVariant = selectedColor || product.colors?.[0] || { color: 'black', colorName: 'Padrão', colorHex: '#121212' };
  const activeSize: string = selectedSize || product.sizes?.[0] || '';

  const images = React.useMemo(() => {
    const list: string[] = [];
    if (activeColor?.image) list.push(activeColor.image);
    if (activeColor?.featuredImage) list.push(activeColor.featuredImage);
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (!list.includes(img)) list.push(img);
      });
    }
    if (product.image && !list.includes(product.image)) {
      list.push(product.image);
    }
    return list.length > 0
      ? list.map((url) => getValidProductImageUrl(url, product.category, product.id))
      : [getValidProductImageUrl(product.image, product.category, product.id)];
  }, [product, activeColor]);

  const handleSelectColor = (variant: ProductVariant) => {
    setSelectedColor(variant);
    setSelectedImageIndex(0);
  };

  const handleAddToCart = () => {
    const success = addToCart(product, activeSize || product.sizes?.[0] || 'U', activeColor, quantity);
    if (success) {
      setIsAddedRecently(true);
      setTimeout(() => setIsAddedRecently(false), 2000);
    }
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    showToast(
      isFavorite ? 'Item removido dos favoritos' : 'Item salvo nos favoritos!',
      isFavorite ? 'info' : 'success'
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `MARMOT - ${product.title}`,
          text: product.subtitle,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copiado para a área de transferência!', 'success');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      showToast('Preencha seu nome e comentário', 'error');
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
        showToast('Avaliação enviada com sucesso!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao registrar avaliação.', 'error');
      }
    } catch {
      showToast('Não foi possível enviar a avaliação.', 'error');
    }
  };

  const relatedProducts = products
    .filter((p) => p.id !== product?.id)
    .slice(0, 4);

  const effectivePrice = product.promoPrice || product.price;

  return (
    <div className="bg-[#FAFAFA] text-[#0B0B0E] min-h-screen py-6 sm:py-8 select-none">
      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <Breadcrumb
          items={[
            { label: 'Início', onClick: () => onNavigate('home') },
            { label: 'Catálogo', onClick: () => onNavigate('shop') },
            { label: product.category.toUpperCase(), onClick: () => onNavigate('shop', product.category) },
            { label: product.title },
          ]}
        />

        {/* Product Main Display Grid - Balanced Gallery (~54%) / Info Panel (~46%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,570px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,610px)_minmax(0,1fr)] gap-8 lg:gap-10 xl:gap-14 mt-6 mb-10 items-start">
          {/* 1. Left Column: Gallery */}
          <div className="w-full space-y-3.5">
            {/* Main Stage Image - Completely fills container with zero empty space or bars */}
            <div className="relative w-full aspect-[3/4.2] max-h-[750px] min-h-[440px] sm:min-h-[500px] bg-[#ECECED] border border-zinc-200/90 rounded-[2px] overflow-hidden group flex items-center justify-center">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                onError={(e) => handleProductImageError(e, product.category, `${product.id}-${selectedImageIndex}`)}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.015] select-none"
              />

              {/* Minimal Badges */}
              <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                {product.isNewRelease && (
                  <MarmotBadge variant="new">NOVO DROP</MarmotBadge>
                )}
                {product.promoPrice && (
                  <MarmotBadge variant="sale">
                    -{Math.round(((product.price - product.promoPrice) / product.price) * 100)}% OFF
                  </MarmotBadge>
                )}
              </div>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="absolute top-3.5 right-3.5 p-2.5 bg-white/90 hover:bg-[#0B0B0E] hover:text-white rounded-full border border-zinc-200 text-[#0B0B0E] transition-all backdrop-blur-xs shadow-xs cursor-pointer z-10"
                title="Compartilhar Peça"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="w-full flex gap-2.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-[2px] overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-zinc-100 ${
                      selectedImageIndex === idx
                        ? 'border-[#0B0B0E] shadow-xs'
                        : 'border-zinc-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleProductImageError(e, product.category, `${product.id}-thumb-${idx}`)}
                      className="w-full h-full object-contain object-center bg-[#ECECED]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Right Column: Buy Box & Specs (~46% width, aligned to top) */}
          <div className="w-full space-y-6">
            <div>
              {/* Category & Collection */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-2">
                <span>{product.collection || 'DROP 003 // ESSENCIAIS'}</span>
                <span>SKU: {product.sku || `MM-${product.id.slice(0, 8).toUpperCase()}`}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-[#0B0B0E] leading-tight">
                {product.title}
              </h1>

              {/* Subtitle / Spec */}
              <p className="text-xs sm:text-[13px] text-zinc-500 mt-1.5 font-normal leading-relaxed">
                {product.subtitle || 'Malha Heavyweight Boxy Fit com caimento estruturado'}
              </p>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-2.5 mt-3">
                <div className="flex text-zinc-900 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating || 5) ? 'fill-current text-[#0B0B0E]' : 'opacity-25'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#0B0B0E]">{(product.rating || 5).toFixed(1)}</span>
                <span className="text-xs text-zinc-400">
                  ({reviewsList.length} avaliações verificadas)
                </span>
              </div>
            </div>

            {/* Price & Installments Card */}
            <div className="p-5 bg-white border border-zinc-200/90 rounded-[2px]">
              <MarmotPrice
                price={effectivePrice}
                originalPrice={product.promoPrice ? product.price : undefined}
                size="lg"
              />
            </div>

            {/* Color Swatch Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600 block">
                  COR: <span className="text-[#0B0B0E] font-sans font-extrabold">{activeColor.colorName || activeColor.color}</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((c, idx) => {
                    const isSelected = (activeColor.colorHex || activeColor.color) === (c.colorHex || c.color);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectColor(c)}
                        className={`p-0.5 rounded-full border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0B0B0E] scale-105'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={c.colorName || c.color}
                      >
                        <span
                          className="w-7 h-7 rounded-full block border border-black/15 shadow-2xs"
                          style={{ backgroundColor: c.colorHex || '#121212' }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-600">
                  TAMANHO: <strong className="text-[#0B0B0E] font-sans font-extrabold">{selectedSize}</strong>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-[#0B0B0E] hover:underline font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" /> Guia de Medidas
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {(product.sizes || ['P', 'M', 'G', 'GG', 'XG']).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-3 rounded-[2px] text-xs font-mono font-bold uppercase border cursor-pointer transition-all ${
                      selectedSize === sz
                        ? 'bg-[#0B0B0E] text-[#F4C400] border-[#0B0B0E] shadow-2xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-[#0B0B0E] hover:text-[#0B0B0E]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Model Measurement Aid */}
              <p className="text-[11px] text-zinc-500 pt-1 font-mono">
                O modelo mede 1,84m, pesa 78kg e veste tamanho <strong>G</strong>.
              </p>

              {product.stockCount <= 8 && (
                <p className="text-xs text-amber-700 font-mono font-bold">
                  Restam apenas {product.stockCount} unidades no ateliê!
                </p>
              )}
            </div>

            {/* Quantity and Primary Action */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Box */}
                <div className="flex items-center bg-white border border-zinc-200 rounded-[2px] p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-zinc-600 hover:text-[#0B0B0E] cursor-pointer"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-[#0B0B0E]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-zinc-600 hover:text-[#0B0B0E] cursor-pointer"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 font-black text-xs sm:text-[13px] uppercase tracking-[0.14em] py-3.5 sm:py-4 px-6 rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    isAddedRecently
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F4C400] hover:bg-[#E5B500] text-[#0B0B0E] active:scale-[0.99]'
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
                  className={`p-3.5 sm:p-4 rounded-[2px] border transition-all cursor-pointer ${
                    isFavorite
                      ? 'bg-[#0B0B0E] text-[#F4C400] border-[#0B0B0E]'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-[#0B0B0E] hover:text-[#0B0B0E]'
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
              items={[{
                productId: product.id,
                quantity,
                size: activeSize,
                colorName: activeColor.colorName || activeColor.color,
              }]}
            />

            {/* Trust Assurances */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-zinc-700 shrink-0" />
                <span>Frete Grátis acima de R$ 399</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-zinc-700 shrink-0" />
                <span>1ª Troca Grátis em até 30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0" />
                <span>Ateliê Próprio em São Paulo</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-700 shrink-0" />
                <span>Checkout 100% Criptografado</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Product Specifications & Care Tabs */}
        <div className="my-12 sm:my-14 bg-white border border-zinc-200/90 rounded-[2px] p-6 md:p-8 space-y-6">
          <div className="flex border-b border-zinc-200 gap-6 overflow-x-auto scrollbar-none pb-2">
            {[
              { id: 'details', label: 'Especificações & Detalhes' },
              { id: 'measurements', label: 'Tabela de Medidas (cm)' },
              { id: 'care', label: 'Instruções de Lavagem' },
              { id: 'shipping', label: 'Envios & Trocas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#0B0B0E] text-[#0B0B0E]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Details */}
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs text-zinc-600 leading-relaxed">
              <p className="text-sm font-normal text-[#0B0B0E] whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
              <ul className="space-y-2 pt-2">
                {(product.details || [
                  '100% Algodão Nacional Penteado de Fibra Longa',
                  'Modelagem Boxy Fit exclusiva com ombros rebaixados',
                  'Gola canelada de 3cm pespontada',
                  'Tecido pré-encolhido que não deforma após lavagens',
                  'Confeccionado artesanalmente em São Paulo',
                ]).map((d: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#0B0B0E] shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 2: Measurements */}
          {activeTab === 'measurements' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 font-mono">
                Medidas tiradas com a peça plana em centímetros (tolerância de até 1,5cm):
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-100 text-[#0B0B0E] uppercase font-mono">
                    <tr>
                      <th className="p-3">Tamanho</th>
                      <th className="p-3">Tórax (Largura)</th>
                      <th className="p-3">Comprimento</th>
                      <th className="p-3">Ombro a Ombro</th>
                      <th className="p-3">Manga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-[#0B0B0E]">
                    <tr>
                      <td className="p-3 font-bold">P</td>
                      <td className="p-3 font-mono">56 cm</td>
                      <td className="p-3 font-mono">71 cm</td>
                      <td className="p-3 font-mono">52 cm</td>
                      <td className="p-3 font-mono">22 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">M</td>
                      <td className="p-3 font-mono">59 cm</td>
                      <td className="p-3 font-mono">74 cm</td>
                      <td className="p-3 font-mono">55 cm</td>
                      <td className="p-3 font-mono">23 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">G</td>
                      <td className="p-3 font-mono">62 cm</td>
                      <td className="p-3 font-mono">77 cm</td>
                      <td className="p-3 font-mono">58 cm</td>
                      <td className="p-3 font-mono">24 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">GG</td>
                      <td className="p-3 font-mono">65 cm</td>
                      <td className="p-3 font-mono">80 cm</td>
                      <td className="p-3 font-mono">61 cm</td>
                      <td className="p-3 font-mono">25 cm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">XG</td>
                      <td className="p-3 font-mono">68 cm</td>
                      <td className="p-3 font-mono">83 cm</td>
                      <td className="p-3 font-mono">64 cm</td>
                      <td className="p-3 font-mono">26 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Care */}
          {activeTab === 'care' && (
            <div className="space-y-3 text-xs text-zinc-600">
              <p className="font-bold text-[#0B0B0E]">Para manter sua peça com aspecto original de ateliê:</p>
              <ul className="space-y-2 list-disc list-inside">
                {(product.careInstructions || [
                  'Lavar na máquina em ciclo suave com água fria',
                  'Lavar preferencialmente do avesso para proteger a fibra',
                  'Não usar alvejantes ou produtos à base de cloro',
                  'Secar no varal à sombra (evite secadora para máxima durabilidade)',
                  'Passar do avesso em temperatura média',
                ]).map((c: string, idx: number) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 4: Shipping */}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs text-zinc-600 leading-relaxed">
              <p>
                <strong className="text-[#0B0B0E]">Expedição Rápida:</strong> Pedidos com pagamento aprovado até as 14h são postados em até 24h úteis direto do ateliê em São Paulo.
              </p>
              <p>
                <strong className="text-[#0B0B0E]">1ª Troca Grátis (30 dias):</strong> Se o tamanho não ficar perfeito, você tem 30 dias corridos para solicitar a troca sem nenhum custo de frete.
              </p>
              <p>
                <strong className="text-[#0B0B0E]">Frete Grátis:</strong> Válido automaticamente para todo o Brasil em compras acima de R$ 399.
              </p>
            </div>
          )}
        </div>

        {/* 4. Customer Reviews Section */}
        <div className="my-14 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
                <span className="text-[10px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-500">
                  PROVA SOCIAL // FEEDBACK REAL
                </span>
              </div>
              <h2 className="text-2xl font-black uppercase text-[#0B0B0E] leading-none">
                AVALIAÇÕES DE QUEM COMPROU
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
              className="bg-white hover:bg-[#0B0B0E] hover:text-white border border-zinc-300 text-[#0B0B0E] font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-[2px] transition-all cursor-pointer shadow-2xs self-start sm:self-end"
            >
              {isReviewFormOpen ? 'Fechar Formulário' : 'Escrever Avaliação'}
            </button>
          </div>

          {/* Form to submit review */}
          {isReviewFormOpen && (
            <form onSubmit={handleAddReview} className="bg-white border border-zinc-200 p-6 rounded-[2px] space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase text-[#0B0B0E] tracking-wider">Sua Avaliação sobre a Peça</h3>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">Sua Nota:</span>
                <div className="flex text-zinc-900 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      className={`w-4 h-4 ${star <= newReviewRating ? 'fill-current text-[#0B0B0E]' : 'opacity-25'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono font-bold text-zinc-600 block mb-1">Seu Nome</label>
                  <input
                    type="text"
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    required
                    placeholder="Ex: Lucas Silva"
                    className="w-full bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 rounded-[2px] text-xs text-[#0B0B0E] focus:outline-none focus:border-[#0B0B0E]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold text-zinc-600 block mb-1">Título da Avaliação</label>
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    required
                    placeholder="Ex: Caimento perfeito, malha de alta gramatura"
                    className="w-full bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 rounded-[2px] text-xs text-[#0B0B0E] focus:outline-none focus:border-[#0B0B0E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-zinc-600 block mb-1">Comentário Detalhado</label>
                <textarea
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  required
                  placeholder="Conte como foi sua experiência com o caimento, tecido, acabamento e entrega..."
                  className="w-full bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 rounded-[2px] text-xs text-[#0B0B0E] focus:outline-none focus:border-[#0B0B0E]"
                />
              </div>

              <button
                type="submit"
                className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-black text-xs uppercase tracking-wider px-6 py-3 rounded-[2px] transition-colors shadow-xs cursor-pointer"
              >
                Publicar Avaliação
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsList.map((rev: any, idx: number) => (
              <div key={idx} className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-[2px] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex text-zinc-900 gap-0.5">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current text-[#0B0B0E]" />
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-[2px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Compra Verificada
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#0B0B0E] uppercase">
                  {rev.title || 'Excelente qualidade'}
                </h4>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-[11px] text-zinc-500 font-mono">
                  <span className="font-bold text-[#0B0B0E]">{rev.userName}</span>
                  <span>{rev.date || 'Recente'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Related Products */}
        <div className="my-14 space-y-6">
          <div className="border-b border-zinc-200 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
              <span className="text-[10px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-500">
                RECOMENDAÇÕES DE ATELIÊ
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase text-[#0B0B0E] leading-none">
              COMPLETE O VISUAL
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
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
