import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Clock, Flame, ShieldAlert, ArrowRight } from 'lucide-react';
import { ProductCard } from '../ProductCard';

interface FlashSaleCountdownProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const FlashSaleCountdown: React.FC<FlashSaleCountdownProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  // Countdown state for urgency
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 42, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const promoProducts = products.filter((p) => !!p.promoPrice || p.tags.includes('Oferta')).slice(0, 4);

  return (
    <section className="py-16 bg-[#161616] border-y border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Urgent Header Banner Bar */}
        <div className="bg-[#080808] border border-[#262626] p-6 rounded-2xl mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D6B35A]/10 text-[#D6B35A] rounded-xl border border-[#D6B35A]/30 shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#D6B35A] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  DROP DE TEMPO LIMITADO
                </span>
                <span className="text-xs text-[#777777] font-mono">EDITION 04</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#EFECE6] mt-1">
                OFERTAS EXCLUSIVAS AURA ARCHIVE
              </h2>
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#D6B35A]" />
            <span className="text-xs font-bold uppercase text-[#777777] hidden sm:inline">Termina em:</span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-black">
              <div className="bg-[#161616] border border-[#262626] px-3 py-2 rounded text-[#EFECE6] text-center min-w-[42px]">
                {String(timeLeft.hours).padStart(2, '0')}
                <span className="block text-[8px] text-[#777777] font-sans font-normal">HRS</span>
              </div>
              <span className="text-[#D6B35A] font-bold">:</span>
              <div className="bg-[#161616] border border-[#262626] px-3 py-2 rounded text-[#EFECE6] text-center min-w-[42px]">
                {String(timeLeft.minutes).padStart(2, '0')}
                <span className="block text-[8px] text-[#777777] font-sans font-normal">MIN</span>
              </div>
              <span className="text-[#D6B35A] font-bold">:</span>
              <div className="bg-[#161616] border border-[#262626] px-3 py-2 rounded text-[#EFECE6] text-center min-w-[42px]">
                {String(timeLeft.seconds).padStart(2, '0')}
                <span className="block text-[8px] text-[#777777] font-sans font-normal">SEG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Grid with Progress Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {promoProducts.map((product) => {
            const pctSold = Math.min(92, Math.max(65, 100 - (product.stockCount * 3)));
            return (
              <div key={product.id} className="flex flex-col h-full">
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                  onProductClick={(id) => onNavigate('product', id)}
                />
                {/* Limited Stock Gauge Below */}
                <div className="mt-3 bg-[#080808] border border-[#262626] p-3 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-[#D6B35A] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Apenas {product.stockCount} no estoque
                    </span>
                    <span className="text-[#777777]">{pctSold}% vendido</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#D6B35A] to-amber-200 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pctSold}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline inline-flex items-center gap-2"
          >
            Ver Todas as Ofertas Especiais <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
