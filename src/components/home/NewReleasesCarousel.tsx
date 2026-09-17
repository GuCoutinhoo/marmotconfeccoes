import React, { useRef } from 'react';
import { Product } from '../../types';
import { ArrowRight, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { motion } from 'motion/react';

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
    <motion.section
      id="ultimos-lancamentos-drop"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#FAFAFA] text-[#18181B] w-full overflow-hidden border-b border-zinc-200/80 pt-7 sm:pt-9 pb-7 sm:pb-9"
    >
      <div className="w-full max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* CABEÇALHO UNIFICADO */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 sm:mb-5"
        >
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.24em] text-zinc-400">
                DROP EXCLUSIVO
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4C400]" />
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                2026
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-[-0.03em] uppercase text-zinc-950 leading-none">
              ÚLTIMOS LANÇAMENTOS
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-500 font-normal mt-1.5">
              Silhuetas pesadas, proporções amplas e matéria-prima de alta gramatura.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-end">
            {/* Botões de navegação horizontal */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Anterior"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[3px] border border-zinc-200/90 bg-white flex items-center justify-center text-zinc-900 hover:bg-zinc-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Próximo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[3px] border border-[#F4C400] bg-white flex items-center justify-center text-zinc-900 hover:bg-amber-50/40 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            <button
              type="button"
              className="h-9 sm:h-10 px-4 rounded-[3px] border border-zinc-900 bg-zinc-900 hover:bg-black text-white font-bold text-[11px] tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              onClick={() => onNavigate('shop', 'novidades')}
            >
              <span>VER TODOS</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </motion.header>

        {/* GRADE / CARROSSEL DE CARDS UNIFICADOS */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-4 xl:gap-4.5 pb-2 lg:pb-0 scrollbar-none snap-x snap-mandatory"
        >
          {spotlightItems.map((item, index) => {
            const isWishlisted = isInWishlist(item.id);

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.08 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4, transition: { duration: 0.22 } }}
                onClick={() => handleProductNavigate(item)}
                className="group relative flex flex-col flex-shrink-0 w-[270px] sm:w-[290px] md:w-[310px] lg:w-auto snap-center bg-white border border-zinc-200/90 hover:border-zinc-950 rounded-[3px] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer select-none"
              >
                {/* TOPO: Imagem com Proporção 4/5 e Fundo Neutro Unificado */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#EEEEEC]">
                  {item.badge && (
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/90 backdrop-blur-sm text-white text-[9.5px] font-extrabold uppercase tracking-[0.16em] rounded-[2px] shadow-sm pointer-events-none select-none">
                      {item.badge}
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={isWishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    onClick={(e) => handleWishlistToggle(e, item)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-zinc-900 border border-zinc-200/60 flex items-center justify-center shadow-2xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors stroke-[1.5] ${
                        isWishlisted ? 'text-rose-600 fill-rose-600' : 'text-zinc-800 fill-transparent'
                      }`}
                    />
                  </button>

                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ objectPosition: item.objectPosition || 'center center' }}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] select-none pointer-events-none"
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

                {/* CORPO: Informações com Tipografia e Proporção Unificadas */}
                <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <span className="block text-[10px] sm:text-[10.5px] font-semibold tracking-[0.18em] text-zinc-400 uppercase mb-1 leading-none">
                      {item.category}
                    </span>

                    <h3 className="font-bold text-zinc-900 text-xs sm:text-[13.5px] tracking-tight uppercase line-clamp-1 group-hover:text-black transition-colors mb-1.5">
                      {item.title}
                    </h3>

                    <div className="font-extrabold text-zinc-950 text-base sm:text-[17px] tracking-tight leading-none mb-1">
                      {formatPrice(item.price)}
                    </div>

                    <div className="text-[10.5px] sm:text-[11px] text-zinc-500 font-normal leading-tight mb-0.5">
                      {item.installments}
                    </div>

                    <div className="text-[10.5px] sm:text-[11px] text-zinc-800 font-medium leading-tight mb-2.5">
                      {item.pixPrice}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-100">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        {item.colors.map((colorHex, idx) => (
                          <span
                            key={`${item.id}-${idx}`}
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-black/15 flex-shrink-0"
                            style={{ backgroundColor: colorHex }}
                          />
                        ))}
                      </div>

                      <span className="text-[9.5px] sm:text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                        {item.colorCount} CORES
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductNavigate(item);
                      }}
                      className="w-full h-8.5 rounded-[2px] border border-zinc-900 bg-white group-hover:bg-zinc-950 group-hover:text-white text-zinc-900 font-bold text-[10.5px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                    >
                      <span>VER PRODUTO</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
