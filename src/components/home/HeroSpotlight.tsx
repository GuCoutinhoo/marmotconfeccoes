import React, { useState } from 'react';
import { Product } from '../../types';
import { Eye, ShoppingBag, Check, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface HeroSpotlightProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  const { addToCart } = useCart();
  const mainProduct = products.find((p) => p.id === 'prod-004') || products[0];
  const sideProducts = mainProduct ? products.filter((p) => p.id !== mainProduct.id).slice(0, 3) : [];

  const [selectedSize, setSelectedSize] = useState<string>(mainProduct?.sizes?.[1] || mainProduct?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(mainProduct?.colors?.[0] || { colorName: 'Black', color: 'black', hex: '#111111' });

  if (!mainProduct) return null;

  const mainImage = mainProduct.images?.[0] || (mainProduct as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';

  return (
    <section className="py-20 bg-[#080808] text-[#EFECE6] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#D6B35A] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> HIGHLIGHT STATEMENT PIECE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
              PRODUTO EM DESTAQUE - ARCHIVE HERO
            </h2>
          </div>
          <button
            onClick={() => onNavigate('product', mainProduct.id)}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline hidden sm:flex items-center gap-1"
          >
            Página do Produto <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Large Hero Feature Card */}
          <div className="lg:col-span-7 bg-[#161616] border border-[#262626] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden group">
            {/* Image Showcase with Hot Callouts */}
            <div className="w-full md:w-1/2 aspect-[3/4] relative rounded-xl overflow-hidden bg-black shrink-0">
              <img
                src={mainImage}
                alt={mainProduct.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-[#D6B35A] text-black text-[10px] font-black uppercase px-2.5 py-1 rounded">
                ESPECIAL 400G
              </div>
            </div>

            {/* Details & Direct Quick Add */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-mono text-[#D6B35A] uppercase font-bold tracking-wider">
                  {mainProduct.collection}
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-[#EFECE6] mt-1 leading-tight">
                  {mainProduct.title}
                </h3>
                <p className="text-xs text-[#777777] mt-2 line-clamp-3 leading-relaxed">
                  {mainProduct.description}
                </p>

                {/* Technical Specs Checklist */}
                <div className="mt-4 space-y-1.5 border-t border-[#262626] pt-4">
                  {mainProduct.details.slice(0, 3).map((det, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-[#EFECE6]">
                      <Check className="w-3.5 h-3.5 text-[#D6B35A] shrink-0" />
                      <span>{det}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Size Selector */}
              <div className="space-y-4 pt-4 border-t border-[#262626]">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-[#EFECE6]">
                    R$ {(mainProduct.promoPrice || mainProduct.price).toFixed(2).replace('.', ',')}
                  </span>
                  {mainProduct.promoPrice && (
                    <span className="text-xs text-[#777777] line-through">
                      R$ {mainProduct.price.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#777777] uppercase block mb-1.5">
                    Tamanho Selecionado: <strong className="text-[#EFECE6]">{selectedSize}</strong>
                  </span>
                  <div className="flex gap-2">
                    {mainProduct.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`w-9 h-9 text-xs font-black rounded uppercase transition-all ${
                          selectedSize === s
                            ? 'bg-[#D6B35A] text-black'
                            : 'bg-[#080808] border border-[#262626] text-[#777777] hover:text-[#EFECE6]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => addToCart(mainProduct, selectedSize, selectedColor)}
                    className="flex-1 bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" /> Comprar Agora
                  </button>
                  <button
                    onClick={() => onQuickView(mainProduct)}
                    className="p-3.5 bg-[#080808] border border-[#262626] text-[#EFECE6] hover:border-[#D6B35A] rounded transition-colors"
                    title="Espiada rápida"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Complementary Stack */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <h3 className="text-xs font-black uppercase text-[#777777] tracking-wider">
              COMPLEMENTOS PARA O SEU OUTFIT ({sideProducts.length})
            </h3>

            {sideProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate('product', p.id)}
                className="bg-[#161616] border border-[#262626] hover:border-[#D6B35A] p-4 rounded-xl flex gap-4 items-center cursor-pointer transition-all group"
              >
                <img
                  src={p.images?.[0] || (p as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-24 object-cover rounded-lg bg-black shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#D6B35A] font-bold uppercase">{p.category}</span>
                  <h4 className="text-xs font-extrabold text-[#EFECE6] line-clamp-1 group-hover:text-[#D6B35A] transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-[11px] text-[#777777] line-clamp-1 mt-0.5">{p.subtitle}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-black text-[#EFECE6]">
                      R$ {(p.promoPrice || p.price).toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(p);
                      }}
                      className="text-[10px] font-extrabold uppercase bg-[#080808] border border-[#262626] text-[#EFECE6] px-2.5 py-1 rounded hover:bg-[#D6B35A] hover:text-black transition-colors"
                    >
                      Espiada
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
