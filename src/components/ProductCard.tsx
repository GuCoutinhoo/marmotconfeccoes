import React, { useState, memo, useCallback } from 'react';
import { Product } from '../types';
import { Eye, Check, ArrowRight, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getValidProductImageUrl, handleProductImageError, getProductCardImageFraming } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onProductClick: (productId: string) => void;
  priorityBadge?: string;
  variant?: 'standard' | 'editorial';
  hideNewReleaseBadge?: boolean;
  editorialIndex?: number;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
  priorityBadge,
  variant = 'standard',
  hideNewReleaseBadge = false,
  editorialIndex,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredColorImage, setHoveredColorImage] = useState<string | null>(null);
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isFavorite = isInWishlist(product.id);
  const primaryImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');
  const rawImages = (product.images && product.images.length > 0)
    ? (primaryImage && product.images[0] !== primaryImage ? [primaryImage, ...product.images.filter(x => x !== primaryImage)] : product.images)
    : (primaryImage ? [primaryImage] : []);
  
  const images = rawImages.length > 0
    ? rawImages.map((img, idx) => getValidProductImageUrl(img, product.category, `${product.id}-${idx}`))
    : [getValidProductImageUrl(null, product.category, product.id)];
  
  const rawDisplay = hoveredColorImage || images[currentImageIndex] || images[0];
  const displayImage = getValidProductImageUrl(rawDisplay, product.category, product.id);

  const effectivePrice = product.promoPrice || product.price;
  const installmentCount = 3;
  const installmentValue = effectivePrice / installmentCount;
  const pixPrice = effectivePrice * 0.95;

  const formattedPrice = effectivePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedInstallment = installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedPix = pixPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const categoryLabel = (product.subcategory || product.category || 'Streetwear').toUpperCase();

  const colorsList = product.colors && product.colors.length > 0
    ? product.colors
    : [{ colorName: 'Padrão', colorHex: '#121212', color: 'black' }];
  const colorsCountText = `${colorsList.length} ${colorsList.length === 1 ? 'cor' : 'cores'}`;

  const handleQuickAddSize = useCallback((e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    const added = addToCart(product, size, product.colors?.[0] || colorsList[0], 1);
    if (added) {
      setAddedSize(size);
      setTimeout(() => setAddedSize(null), 1600);
    }
  }, [addToCart, product, colorsList]);

  return (
    <article
      id={`product-card-${product.id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)] hover:border-black/15 transition-all duration-300 overflow-hidden select-none"
    >
      {/* 1. IMAGEM DO PRODUTO (Aproximadamente 65% a 70% da altura visual do card, object-fit: cover, sem padding ao redor) */}
      <div 
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F6F6F6] cursor-pointer"
        onClick={() => onProductClick(product.slug || product.id)}
      >
        <img
          src={displayImage}
          alt={product.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${getProductCardImageFraming(product.category)}`}
          onError={(e) => handleProductImageError(e, product.category, product.id)}
          onMouseEnter={() => !hoveredColorImage && images.length > 1 && setCurrentImageIndex(1)}
          onMouseLeave={() => !hoveredColorImage && setCurrentImageIndex(0)}
        />

        {/* 2. FAVORITO: Botão circular branco no canto superior direito, tamanho discreto, coração preto fino */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-white/95 hover:bg-white text-black flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all duration-200 cursor-pointer"
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 stroke-[1.3] ${
              isFavorite ? 'fill-black text-black' : 'fill-transparent text-black'
            }`}
          />
        </button>

        {/* Quick View discreto acessível ao passar o mouse */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute top-3.5 left-3.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 px-2.5 rounded-full bg-white/95 hover:bg-white text-black flex items-center gap-1.5 shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-black/[0.04] text-[9.5px] uppercase font-helvetica-now tracking-wider cursor-pointer"
          aria-label="Espiada rápida"
          title="Espiada rápida"
        >
          <Eye className="w-3 h-3 stroke-[1.4] text-black" />
          <span className="hidden sm:inline">Espiar</span>
        </button>

        {/* Seleção rápida de tamanhos (discreto ao passar o mouse na base da foto) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="absolute bottom-2.5 left-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="mx-auto w-fit bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs border border-black/[0.06] flex items-center gap-1">
              {product.sizes.slice(0, 5).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={(e) => handleQuickAddSize(e, sz)}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-helvetica-now font-semibold transition-colors cursor-pointer ${
                    addedSize === sz
                      ? 'bg-black text-white'
                      : 'text-zinc-700 hover:bg-black hover:text-white'
                  }`}
                  title={`Adicionar tamanho ${sz}`}
                >
                  {addedSize === sz ? <Check className="w-2.5 h-2.5 mx-auto" /> : sz}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. ÁREA DE INFORMAÇÕES: Hierarquia vertical limpa com espaçamentos rigorosos */}
      <div className="p-4 sm:p-5 lg:p-6 flex flex-col justify-between flex-1">
        <div>
          {/* CATEGORIA:
              - Helvetica Now Display Medium / Inter Medium
              - font-weight: 500
              - text-transform: uppercase
              - letter-spacing: 0.16em
              - tamanho pequeno
              - cor cinza escuro (#555)
          */}
          <p className="font-helvetica-now font-medium uppercase text-[10.5px] sm:text-[11px] tracking-[0.16em] text-[#555555] mb-2 leading-none">
            {categoryLabel}
          </p>

          {/* NOME DO PRODUTO:
              - Helvetica Now Display Bold
              - font-weight: 700 ou 800
              - text-transform: uppercase
              - letter-spacing: -0.02em
              - line-height: 0.95
              - cor preta
          */}
          <h3
            onClick={() => onProductClick(product.slug || product.id)}
            className="font-helvetica-now font-bold uppercase text-[15px] sm:text-[16px] tracking-[-0.02em] leading-[0.95] text-black hover:text-zinc-700 transition-colors cursor-pointer line-clamp-2 mb-3 sm:mb-3.5"
          >
            {product.title}
          </h3>

          {/* PREÇO:
              - Helvetica Now Display Bold / ExtraBold
              - font-weight: 800
              - letter-spacing: -0.035em
              - line-height: 0.95
              - cor preta
              - Mesma linguagem sans-serif pesada do título (sem serif)
          */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="font-helvetica-now font-extrabold text-[21px] sm:text-[23px] tracking-[-0.035em] leading-[0.95] text-black">
              R$ {formattedPrice}
            </span>
            {product.promoPrice && product.price > product.promoPrice && (
              <span className="font-helvetica-now text-[11px] sm:text-xs text-zinc-400 line-through font-normal tracking-normal">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* PARCELAMENTO:
              - Helvetica Now Display Regular ou Inter Regular
              - font-weight: 400
              - cor #555
              - line-height compacto
          */}
          <p className="font-helvetica-now font-normal text-[11px] sm:text-[11.5px] text-[#555555] leading-tight mb-0.5">
            ou 3x de R$ {formattedInstallment} sem juros
          </p>

          {/* PIX:
              - Helvetica Now Display Regular ou Inter Regular
              - font-weight: 400
              - cor #555
              - line-height compacto
          */}
          <p className="font-helvetica-now font-normal text-[11px] sm:text-[11.5px] text-[#555555] leading-tight mb-4 sm:mb-5">
            R$ {formattedPix} no Pix
          </p>
        </div>

        {/* 4. DIVISOR + ÁREA DAS CORES E CTA:
            - Linha divisória fina
            - Espaço acima até divisor: 16–20px (no elemento anterior)
            - Espaço do divisor até as cores: 14px (pt-3.5)
            - Swatches circulares pequenos, borda sutil, separador vertical fino, quantidade de cores
            - Botão circular preto com seta fina branca apontando para a direita no canto inferior direito
        */}
        <div className="pt-3.5 border-t border-[#EAEAEA] flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Swatches + Separador Vertical + Quantidade de Cores */}
          <div className="flex items-center min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              {colorsList.slice(0, 4).map((color, idx) => {
                const hex = color.colorHex || '#171717';
                const isWhite = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff';
                return (
                  <button
                    key={color.colorHex || color.colorName || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const img = (color.images && color.images.length > 0) ? color.images[0] : (color.featuredImage || color.image || null);
                      if (img) setHoveredColorImage(img);
                    }}
                    onMouseEnter={() => {
                      const img = (color.images && color.images.length > 0) ? color.images[0] : (color.featuredImage || color.image || null);
                      if (img) setHoveredColorImage(img);
                    }}
                    onMouseLeave={() => setHoveredColorImage(null)}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-transform duration-150 hover:scale-110 cursor-pointer ${
                      isWhite ? 'border border-black/25' : 'border border-black/10'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={color.colorName || color.color || `Cor ${idx + 1}`}
                    aria-label={color.colorName || color.color || `Cor ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Separador vertical fino */}
            <div className="h-3 w-[1px] bg-[#D4D4D4] mx-2 sm:mx-2.5 shrink-0" />

            {/* Quantidade de cores */}
            <span className="font-helvetica-now font-normal text-[11px] sm:text-[11.5px] text-[#333333] whitespace-nowrap truncate select-none">
              {colorsCountText}
            </span>
          </div>

          {/* Lado Direito: CTA - Círculo preto com seta fina branca apontando para direita */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product.slug || product.id);
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black hover:bg-zinc-800 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs shrink-0 group/cta"
            aria-label={`Ver detalhes de ${product.title}`}
            title="Ver produto"
          >
            <ArrowRight className="w-4 h-4 text-white stroke-[1.4] transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

export const ProductCard = memo(ProductCardComponent);
