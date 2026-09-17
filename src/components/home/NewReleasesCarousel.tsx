import React, { useRef } from 'react';
import { Product } from '../../types';
import { ArrowRight, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';

interface NewReleasesCarouselProps {
  products: Product[];
  onQuickView?: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

interface SpotlightItem {
  id: string;
  slug: string;
  category: string;
  badge?: string;
  title: string;
  price: number;
  installments: string;
  pixPrice: string;
  image: string;
  colors: string[];
  colorCount: number;
  objectPosition?: string;
}

export const NewReleasesCarousel: React.FC<NewReleasesCarouselProps> = ({
  products = [],
  onNavigate,
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Encontra os produtos no catálogo real para sincronização com carrinho/detalhes/favoritos
  const getCatalogProduct = (id: string, slug?: string): Product | undefined => {
    return products.find((p) => p.id === id || p.slug === slug || p.slug === id);
  };

  // 1. JAQUETA VARSITY OVERSIZED (Card 1)
  const catProd1 = getCatalogProduct('prod-jaq-017', 'jaqueta-varsity-oversized');
  const item1: SpotlightItem = {
    id: 'prod-jaq-017',
    slug: 'jaqueta-varsity-oversized',
    category: 'JAQUETA',
    badge: 'DROP 2026',
    title: catProd1?.title ? catProd1.title.toUpperCase() : 'JAQUETA VARSITY OVERSIZED',
    price: catProd1?.price || 489.9,
    installments: 'ou 3x de R$ 163,30 sem juros',
    pixPrice: 'R$ 465,41 no Pix',
    image:
      catProd1?.image ||
      'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png',
    colors: (catProd1?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#6F513D', '#171717'],
    colorCount: catProd1?.colors?.length || 2,
    objectPosition: 'center 20%',
  };

  // 2. SHORTS CARGO BAGGY (Card 2)
  const catProd2 = getCatalogProduct('prod-sho-002', 'shorts-cargo-baggy');
  const item2: SpotlightItem = {
    id: 'prod-sho-002',
    slug: 'shorts-cargo-baggy',
    category: 'SHORTS',
    badge: 'NOVO',
    title: catProd2?.title ? catProd2.title.toUpperCase() : 'SHORTS CARGO BAGGY',
    price: catProd2?.price || 249.9,
    installments: 'ou 3x de R$ 83,30 sem juros',
    pixPrice: 'R$ 237,41 no Pix',
    image:
      catProd2?.image ||
      '/Shorts Cargo Baggy - cor verde oliva.png',
    colors: (catProd2?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#4A5340', '#121212'],
    colorCount: catProd2?.colors?.length || 2,
    objectPosition: 'center center',
  };

  // 3. MOLETOM ANORAK HEAVY (Card 3)
  const catProd3 = getCatalogProduct('prod-mol-001', 'moletom-anorak') || getCatalogProduct('prod-jaq-001');
  const item3: SpotlightItem = {
    id: 'prod-mol-001',
    slug: 'moletom-anorak',
    category: 'MOLETOM',
    badge: 'DESTAQUE',
    title: catProd3?.title ? catProd3.title.toUpperCase() : 'MOLETOM ANORAK HEAVY',
    price: catProd3?.price || 349.9,
    installments: 'ou 3x de R$ 116,63 sem juros',
    pixPrice: 'R$ 332,41 no Pix',
    image:
      catProd3?.image ||
      'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png',
    colors: (catProd3?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#171717', '#4B5320'],
    colorCount: catProd3?.colors?.length || 2,
    objectPosition: 'center 20%',
  };

  // 4. JAQUETA WORKWEAR (Card 4)
  const catProd4 = getCatalogProduct('prod-jaq-019', 'jaqueta-workwear');
  const item4: SpotlightItem = {
    id: 'prod-jaq-019',
    slug: 'jaqueta-workwear',
    category: 'JAQUETA',
    badge: 'LIMITED',
    title: catProd4?.title ? catProd4.title.toUpperCase() : 'JAQUETA WORKWEAR',
    price: catProd4?.price || 469.9,
    installments: 'ou 3x de R$ 156,63 sem juros',
    pixPrice: 'R$ 446,41 no Pix',
    image:
      catProd4?.image ||
      'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png',
    colors: (catProd4?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#6F513D', '#171717'],
    colorCount: catProd4?.colors?.length || 2,
    objectPosition: 'center 25%',
  };

  // 5. CAMISETA HEAVY BOXY (Card 5)
  const catProd5 = getCatalogProduct('prod-cam-004', 'camiseta-heavy-boxy') || getCatalogProduct('prod-cam-001');
  const item5: SpotlightItem = {
    id: 'prod-cam-004',
    slug: 'camiseta-heavy-boxy',
    category: 'CAMISETA',
    badge: 'LANÇAMENTO',
    title: catProd5?.title ? catProd5.title.toUpperCase() : 'CAMISETA HEAVY BOXY',
    price: catProd5?.price || 189.9,
    installments: 'ou 3x de R$ 63,30 sem juros',
    pixPrice: 'R$ 180,41 no Pix',
    image:
      catProd5?.image ||
      '/Camiseta Heavy Boxy - Preto.png',
    colors: (catProd5?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#121212', '#EAE6DF'],
    colorCount: catProd5?.colors?.length || 2,
    objectPosition: 'center 20%',
  };

  // Lista com os 5 cards na ordem exata da diagramação
  const spotlightItems: SpotlightItem[] = [item1, item2, item3, item4, item5];

  // Cria objeto Product consistente para a Wishlist caso não exista previamente no estado
  const resolveProductObject = (item: SpotlightItem): Product => {
    const found = getCatalogProduct(item.id, item.slug);
    if (found) return found;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: item.category,
      description: `${item.title} - Marmot Streetwear`,
      price: item.price,
      category: item.category.toLowerCase(),
      subcategory: item.category,
      collection: 'Drop 2026',
      tags: ['Lançamento', 'Drop 2026'],
      rating: 5,
      reviewCount: 16,
      stockCount: 12,
      sku: `MM-${item.id.toUpperCase()}`,
      sizes: ['P', 'M', 'G', 'GG'],
      colors: item.colors.map((c, idx) => ({
        colorName: `Cor ${idx + 1}`,
        colorHex: c,
        color: idx === 0 ? 'Preto' : 'Outra',
        image: item.image,
        images: [item.image],
      })),
      image: item.image,
      images: [item.image],
      details: ['Modelagem exclusiva Marmot', 'Tecido encorpado premium'],
      careInstructions: ['Lavar em água fria'],
    };
  };

  const handleProductNavigate = (item: SpotlightItem) => {
    const target = item.slug || item.id;
    onNavigate('product', target);
  };

  const handleWishlistToggle = (e: React.MouseEvent, item: SpotlightItem) => {
    e.stopPropagation();
    const prodObj = resolveProductObject(item);
    toggleWishlist(prodObj);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  return (
    <section id="ultimos-lancamentos-drop" className="nr-section">
      <style>{`
        #ultimos-lancamentos-drop,
        #ultimos-lancamentos-drop * {
          box-sizing: border-box;
        }

        #ultimos-lancamentos-drop {
          --nr-bg: #f7f6f3;
          --nr-card: #ffffff;
          --nr-text: #090909;
          --nr-muted: #777777;
          --nr-line: #dededb;
          --nr-yellow: #ffc900;
          background: var(--nr-bg);
          color: var(--nr-text);
          width: 100%;
          overflow: hidden;
          border-bottom: 1px solid #e7e6e2;
        }

        #ultimos-lancamentos-drop .nr-shell {
          width: calc(100% - 32px);
          max-width: 1820px;
          margin: 0 auto;
          padding: clamp(16px, 1.8vh, 22px) 0 clamp(16px, 2vh, 24px);
        }

        #ultimos-lancamentos-drop .nr-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: clamp(14px, 1.6vh, 20px);
        }

        #ultimos-lancamentos-drop .nr-title-block {
          min-width: 0;
          overflow: visible;
        }

        #ultimos-lancamentos-drop .nr-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 16px;
          margin: 0 0 6px 2px;
          white-space: nowrap;
        }

        #ultimos-lancamentos-drop .nr-eyebrow__brand,
        #ultimos-lancamentos-drop .nr-eyebrow__label {
          font-family: 'Marmot Sans', 'Inter', sans-serif;
          font-size: 11px;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: .22em;
          font-weight: 800;
        }

        #ultimos-lancamentos-drop .nr-eyebrow__label {
          color: #8b8b8b;
          font-weight: 700;
        }

        #ultimos-lancamentos-drop .nr-eyebrow__dot {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 999px;
          background: var(--nr-yellow);
        }

        #ultimos-lancamentos-drop .nr-title {
          margin: 0;
          font-family: 'Inter Tight', sans-serif;
          font-size: 32px;
          font-weight: 800;
          line-height: 32px;
          letter-spacing: -.035em;
          display: inline-block;
          text-transform: uppercase;
          white-space: nowrap;
        }

        #ultimos-lancamentos-drop .nr-view-all {
          align-self: flex-end;
          border: 1px solid #18181b;
          background: #18181b;
          color: #ffffff;
          height: 36px;
          padding: 0 16px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Inter Tight', 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all .2s ease;
          white-space: nowrap;
        }

        #ultimos-lancamentos-drop .nr-view-all:hover {
          background: #27272a;
          border-color: #27272a;
        }

        #ultimos-lancamentos-drop .nr-view-all svg {
          width: 14px;
          height: 14px;
          stroke-width: 2;
          transition: transform .2s ease;
        }

        #ultimos-lancamentos-drop .nr-view-all:hover svg {
          transform: translateX(3px);
        }

        @media (max-width: 640px) {
          #ultimos-lancamentos-drop .nr-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          #ultimos-lancamentos-drop .nr-header-actions {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>

      <div className="nr-shell">
        <header className="nr-header">
          <div className="nr-title-block">
            <div className="nr-eyebrow">
              <span className="nr-eyebrow__brand">LASTED DROP</span>
              <span className="nr-eyebrow__dot" />
              <span className="nr-eyebrow__label">2026</span>
            </div>
            <h2 className="nr-title">ÚLTIMOS LANÇAMENTOS</h2>
          </div>

          <div className="nr-header-actions flex items-center gap-2">
            {/* Botões de scroll rápido em telas menores */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Anterior"
                className="w-8 h-8 rounded-md border border-zinc-200 bg-white flex items-center justify-center text-zinc-800 hover:bg-zinc-100 transition-colors shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Próximo"
                className="w-8 h-8 rounded-md border border-zinc-200 bg-white flex items-center justify-center text-zinc-800 hover:bg-zinc-100 transition-colors shadow-sm cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              className="nr-view-all cursor-pointer"
              onClick={() => onNavigate('shop', 'novidades')}
            >
              <span>VER TODOS</span>
              <ArrowRight />
            </button>
          </div>
        </header>

        {/* 
          LAYOUT EXATO DA IMAGEM:
          5 CARDS VERTICAIS ARREDONDADOS LADO A LADO EM LINHA HORIZONTAL ÚNICA
        */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-4 xl:gap-5 pb-3 lg:pb-0 scrollbar-none snap-x snap-mandatory"
        >
          {spotlightItems.map((item) => {
            const isWishlisted = isInWishlist(item.id);

            return (
              <article
                key={item.id}
                onClick={() => handleProductNavigate(item)}
                className="group relative flex flex-col flex-shrink-0 w-[270px] sm:w-[290px] md:w-[310px] lg:w-auto snap-center bg-white border border-[#dededb] hover:border-black rounded-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                {/* TOPO: Imagem com Badge e Wishlist */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#ececea]">
                  {item.badge && (
                    <span className="absolute top-3.5 left-3.5 z-10 px-2.5 py-1 bg-black/90 backdrop-blur-sm text-white text-[9px] font-extrabold uppercase tracking-widest rounded-sm shadow-sm pointer-events-none">
                      {item.badge}
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={isWishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    onClick={(e) => handleWishlistToggle(e, item)}
                    className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isWishlisted ? 'text-[#e44242] fill-[#e44242]' : 'text-zinc-900 stroke-[1.8]'
                      }`}
                    />
                  </button>

                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ objectPosition: item.objectPosition || 'center center' }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none pointer-events-none"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (e.currentTarget.src !== '/categoria jaqueta.png') {
                        e.currentTarget.src = '/categoria jaqueta.png';
                      }
                    }}
                  />
                </div>

                {/* CORPO: Informações do Produto */}
                <div className="p-3.5 sm:p-4 xl:p-4.5 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <span className="block text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-1">
                      {item.category}
                    </span>

                    <h3 className="font-bold text-zinc-900 text-xs sm:text-[13px] xl:text-sm tracking-tight uppercase line-clamp-1 group-hover:text-black transition-colors mb-1">
                      {item.title}
                    </h3>

                    <div className="font-black text-zinc-950 text-base sm:text-lg xl:text-xl tracking-tight leading-tight">
                      {formatPrice(item.price)}
                    </div>

                    <div className="text-[10px] sm:text-[11px] text-zinc-500 leading-tight mt-0.5">
                      {item.installments}
                    </div>

                    <div className="text-[10px] sm:text-[11px] text-zinc-600 font-medium leading-tight">
                      {item.pixPrice}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-zinc-100">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        {item.colors.map((colorHex, idx) => (
                          <span
                            key={`${item.id}-${idx}`}
                            className="w-3.5 h-3.5 rounded-full border border-black/15 flex-shrink-0"
                            style={{ backgroundColor: colorHex }}
                          />
                        ))}
                      </div>

                      <span className="text-[9px] sm:text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                        {item.colorCount} CORES
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductNavigate(item);
                      }}
                      className="w-full h-9 sm:h-9.5 rounded-md border border-zinc-900 bg-white group-hover:bg-zinc-950 group-hover:text-white text-zinc-900 font-bold text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <span>VER PRODUTO</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
