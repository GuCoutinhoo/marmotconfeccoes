import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';

/* =========================================================================
   MARMOT UNIFIED DESIGN SYSTEM PRIMITIVES
   Streetwear Premium • Editorial • Brutalista Controlada • Sofisticada
   ========================================================================= */

// 1. UNIFIED PRICE BLOCK
interface MarmotPriceProps {
  price: number;
  originalPrice?: number | null;
  installmentCount?: number;
  showPix?: boolean;
  pixDiscountPercent?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MarmotPrice: React.FC<MarmotPriceProps> = ({
  price,
  originalPrice,
  installmentCount = 3,
  showPix = true,
  pixDiscountPercent = 5,
  size = 'md',
  className = '',
}) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const installmentValue = price / installmentCount;
  const pixPrice = price * (1 - pixDiscountPercent / 100);

  const priceSizeClasses = {
    sm: 'text-[13px] font-black tracking-tight',
    md: 'text-[15px] sm:text-[16px] font-black tracking-tight',
    lg: 'text-2xl sm:text-3xl font-black tracking-tight',
  };

  const secondarySizeClasses = {
    sm: 'text-[10px]',
    md: 'text-[11px] sm:text-[11.5px]',
    lg: 'text-xs sm:text-sm',
  };

  return (
    <div className={`flex flex-col gap-0.5 leading-snug ${className}`}>
      {/* Primary Price + Strikethrough if on promo */}
      <div className="flex items-baseline gap-2">
        <span className={`${priceSizeClasses[size]} text-[#0B0B0E]`}>
          R$ {price.toFixed(2).replace('.', ',')}
        </span>
        {hasDiscount && (
          <span className="text-[11px] sm:text-xs text-zinc-400 line-through font-normal">
            R$ {originalPrice.toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>

      {/* Installment and PIX secondary hierarchy - unified, no clashing orange */}
      <div className={`${secondarySizeClasses[size]} text-zinc-500 font-normal flex flex-wrap items-center gap-x-1.5`}>
        <span>
          {installmentCount}x de <strong className="font-semibold text-zinc-800">R$ {installmentValue.toFixed(2).replace('.', ',')}</strong> sem juros
        </span>
        {showPix && (
          <>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-700 font-medium">
              R$ {pixPrice.toFixed(2).replace('.', ',')} no PIX
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// 2. UNIFIED BADGES (Curated, consistent height, padding, font and border-radius)
export type MarmotBadgeVariant = 'new' | 'limited' | 'sale' | 'rank';

interface MarmotBadgeProps {
  variant: MarmotBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const MarmotBadge: React.FC<MarmotBadgeProps> = ({
  variant,
  children,
  className = '',
}) => {
  const variantStyles = {
    new: 'bg-[#0B0B0E] text-white border border-[#0B0B0E]',
    limited: 'bg-white/95 text-[#0B0B0E] border border-zinc-300 shadow-2xs backdrop-blur-xs',
    sale: 'bg-[#0B0B0E] text-[#F4C400] border border-[#0B0B0E]',
    rank: 'bg-[#0B0B0E] text-white font-mono border border-zinc-900',
  };

  return (
    <span
      className={`inline-flex items-center justify-center h-[20px] px-2 text-[9px] font-bold uppercase tracking-[0.16em] rounded-[2px] select-none ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// 3. UNIFIED FAVORITE BUTTON (Discreet circle, proportional stroke, subtle hover)
interface MarmotFavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
  ariaLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const MarmotFavoriteButton: React.FC<MarmotFavoriteButtonProps> = ({
  isFavorite,
  onClick,
  ariaLabel = 'Salvar nos favoritos',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconSizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs ${sizeClasses} ${
        isFavorite
          ? 'bg-[#0B0B0E] text-[#F4C400] border border-[#0B0B0E] scale-105 shadow-sm'
          : 'bg-white/95 hover:bg-[#0B0B0E] text-zinc-700 hover:text-[#F4C400] border border-black/10 hover:border-[#0B0B0E] backdrop-blur-xs'
      } ${className}`}
      aria-label={ariaLabel}
    >
      <Heart
        className={`${iconSizeClasses} transition-all duration-200 ${
          isFavorite ? 'fill-[#F4C400] stroke-[#F4C400]' : 'stroke-[1.6]'
        }`}
      />
    </button>
  );
};

// 4. UNIFIED COLOR SWATCHES (Clean, discreet, high-legibility border)
interface ColorItem {
  colorName?: string;
  name?: string;
  colorHex?: string;
  hex?: string;
  image?: string;
  featuredImage?: string;
  images?: string[];
}

interface MarmotColorSwatchesProps {
  colors: ColorItem[];
  activeColorName?: string;
  onSelectColor?: (color: ColorItem) => void;
  onHoverColor?: (color: ColorItem | null) => void;
  maxVisible?: number;
  className?: string;
}

export const MarmotColorSwatches: React.FC<MarmotColorSwatchesProps> = ({
  colors,
  activeColorName,
  onSelectColor,
  onHoverColor,
  maxVisible = 4,
  className = '',
}) => {
  if (!colors || colors.length === 0) return null;

  const visibleColors = colors.slice(0, maxVisible);
  const remainingCount = colors.length - maxVisible;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        {visibleColors.map((c, idx) => {
          const name = c.colorName || c.name || `Cor ${idx + 1}`;
          const hex = c.colorHex || c.hex || '#18181B';
          const isSelected = activeColorName === name;
          const isLight = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff' || hex.toLowerCase().includes('fa') || hex.toLowerCase().includes('ea');

          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectColor?.(c);
              }}
              onMouseEnter={() => onHoverColor?.(c)}
              onMouseLeave={() => onHoverColor?.(null)}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-offset-1 ring-[#0B0B0E] scale-110'
                  : 'hover:scale-120'
              } ${isLight ? 'border border-zinc-300' : 'border border-black/20'}`}
              style={{ backgroundColor: hex }}
              title={name}
            />
          );
        })}
      </div>

      <span className="text-[10px] text-zinc-400 font-mono tracking-wide ml-0.5 select-none">
        {remainingCount > 0 ? `+${remainingCount}` : `${colors.length} ${colors.length > 1 ? 'cores' : 'cor'}`}
      </span>
    </div>
  );
};

// 5. UNIFIED EDITORIAL SECTION HEADER
interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 ${className}`}>
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-500 mb-1.5">
            <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
            <span>{eyebrow}</span>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-[#0B0B0E] leading-none">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-[13px] text-zinc-500 mt-2 max-w-xl font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#0B0B0E] hover:text-[#0B0B0E] transition-colors cursor-pointer self-start sm:self-end pb-0.5"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );
};
