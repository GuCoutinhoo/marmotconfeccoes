import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { Heart, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

interface BestsellersRankingProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

interface CuratedBestsellerItem {
  id: string;
  slug: string;
  categoryLabel: string;
  title: string;
  price: number;
  image: string;
  colors: {
    name: string;
    hex: string;
    image?: string;
  }[];
  isBestSeller?: boolean;
}

// 8 produtos oficiais selecionados rigorosamente de acordo com a referência visual
const REFERENCE_BESTSELLERS: CuratedBestsellerItem[] = [
  {
    id: 'prod-cal-001',
    slug: 'calca-balloon',
    categoryLabel: 'CALÇAS',
    title: 'CALÇA BALLOON',
    price: 319.9,
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/preto/01-4baf0ddb3e08244f.png',
    colors: [
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/preto/01-4baf0ddb3e08244f.png',
      },
      {
        name: 'Marrom',
        hex: '#6F513D',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-balloon/marrom/01-7420fefd4335acc4.png',
      },
    ],
  },
  {
    id: 'prod-cal-002',
    slug: 'calca-cargo-baggy',
    categoryLabel: 'CARGOS',
    title: 'CALÇA CARGO BAGGY',
    price: 339.9,
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
    colors: [
      {
        name: 'Verde',
        hex: '#50633F',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/verde/01-04ce78f411ae78e5.png',
      },
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
      },
    ],
  },
  {
    id: 'prod-cal-003',
    slug: 'calca-cargo-multi-pocket',
    categoryLabel: 'CARGOS',
    title: 'CALÇA CARGO MULTI POCKET',
    price: 359.9,
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-multi-pocket/grafite/01-a12e3d436b94fc10.png',
    colors: [
      {
        name: 'Grafite',
        hex: '#3F3F46',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-multi-pocket/grafite/01-a12e3d436b94fc10.png',
      },
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/calca-cargo-baggy/preto/01-438192cbe349f461.png',
      },
    ],
  },
  {
    id: 'prod-crg-010',
    slug: 'calca-cargo-tactical',
    categoryLabel: 'CARGOS',
    title: 'CALÇA CARGO TACTICAL',
    price: 359.9,
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80',
    colors: [
      {
        name: 'Verde Militar',
        hex: '#4B5320',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80',
      },
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80',
      },
    ],
  },
  {
    id: 'prod-jaq-001',
    slug: 'jaqueta-anorak',
    categoryLabel: 'JAQUETAS',
    title: 'JAQUETA ANORAK',
    price: 429.9,
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png',
    colors: [
      {
        name: 'Verde Militar',
        hex: '#4B5320',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/verde-militar/01-87d91e20c02721f7.png',
      },
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png',
      },
    ],
  },
  {
    id: 'prod-jaq-002',
    slug: 'jaqueta-bomber-oversized',
    categoryLabel: 'JAQUETAS',
    title: 'JAQUETA BOMBER OVERSIZED',
    price: 459.9,
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png',
    colors: [
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/preto/01-a44d302e05149a74.png',
      },
      {
        name: 'Verde',
        hex: '#50633F',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-bomber-oversized/verde/01-009182d9b7de1e5f.png',
      },
    ],
  },
  {
    id: 'prod-jaq-003',
    slug: 'jaqueta-cargo',
    categoryLabel: 'JAQUETAS',
    title: 'JAQUETA CARGO',
    price: 449.9,
    image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png',
    colors: [
      {
        name: 'Bege',
        hex: '#C8B596',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/bege/01-bec8a03f4fabf652.png',
      },
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-cargo/preto/01-e361b629fb56ce73.png',
      },
    ],
  },
  {
    id: 'prod-ten-001',
    slug: 'tenis-chunky',
    categoryLabel: 'TÊNIS',
    title: 'TÊNIS CHUNKY',
    price: 549.9,
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
    colors: [
      {
        name: 'Preto',
        hex: '#171717',
        image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
      },
      {
        name: 'Cinza',
        hex: '#696E78',
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
      },
    ],
  },
];

export const BestsellersRanking: React.FC<BestsellersRankingProps> = ({
  products,
  onNavigate,
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedColorMap, setSelectedColorMap] = useState<Record<string, number>>({});

  // Conecta os produtos da base de dados se presentes, mapeando para o layout
  const pagesData = useMemo(() => {
    if (!products || products.length === 0) return [];

    const usedIds = new Set<string>();
    const page1Items: Array<{
      id: string;
      slug: string;
      categoryLabel: string;
      title: string;
      price: number;
      image: string;
      colors: Array<{ name: string; hex: string; image: string }>;
      originalProduct: Product;
    }> = [];

    // 1. Mapeia os itens curados da referência QUE REALMENTE EXISTEM no catálogo do banco
    REFERENCE_BESTSELLERS.forEach((refItem) => {
      const dbMatch = products.find((p) => p.slug === refItem.slug || p.id === refItem.id);
      if (dbMatch && (dbMatch.status === undefined || dbMatch.status === 'active')) {
        usedIds.add(dbMatch.id);
        page1Items.push({
          id: dbMatch.id,
          slug: dbMatch.slug,
          categoryLabel: (dbMatch.category || refItem.categoryLabel).toUpperCase(),
          title: dbMatch.title.toUpperCase(),
          price: dbMatch.price,
          image: dbMatch.image || dbMatch.images?.[0] || refItem.image,
          colors: dbMatch.colors && dbMatch.colors.length > 0
            ? dbMatch.colors.map((c) => ({
                name: c.colorName || c.color,
                hex: c.colorHex || '#171717',
                image: c.image || c.featuredImage || refItem.image,
              }))
            : refItem.colors,
          originalProduct: dbMatch,
        });
      }
    });

    // 2. Se a página 1 tiver menos de 10 itens, preenche com outros produtos reais do catálogo
    const remainingProducts = products.filter(
      (p) => !usedIds.has(p.id) && (p.status === undefined || p.status === 'active')
    );

    const sortedRemaining = [...remainingProducts].sort((a, b) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    while (page1Items.length < 10 && sortedRemaining.length > 0) {
      const p = sortedRemaining.shift()!;
      usedIds.add(p.id);
      page1Items.push({
        id: p.id,
        slug: p.slug,
        categoryLabel: (p.category || 'LANÇAMENTO').toUpperCase(),
        title: p.title.toUpperCase(),
        price: p.price,
        image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
        colors: p.colors && p.colors.length > 0
          ? p.colors.map((c) => ({
              name: c.colorName || c.color,
              hex: c.colorHex || '#171717',
              image: c.image || c.featuredImage || p.image || '',
            }))
          : [
              { name: 'Padrão', hex: '#171717', image: p.image || '' },
              { name: 'Secundária', hex: '#6F513D', image: p.image || '' },
            ],
        originalProduct: p,
      });
    }

    const pages: Array<typeof page1Items> = page1Items.length > 0 ? [page1Items] : [];
    const itemsPerPage = 10;

    // Demais páginas extraídas dinamicamente do catálogo real
    for (let i = 0; i < sortedRemaining.length && pages.length < 7; i += itemsPerPage) {
      const chunk = sortedRemaining.slice(i, i + itemsPerPage);
      if (chunk.length > 0) {
        pages.push(
          chunk.map((p) => ({
            id: p.id,
            slug: p.slug,
            categoryLabel: (p.category || 'LANÇAMENTO').toUpperCase(),
            title: p.title.toUpperCase(),
            price: p.price,
            image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
            colors: p.colors && p.colors.length > 0
              ? p.colors.map((c) => ({
                  name: c.colorName || c.color,
                  hex: c.colorHex || '#171717',
                  image: c.image || c.featuredImage,
                }))
              : [
                  { name: 'Padrão', hex: '#171717' },
                  { name: 'Secundária', hex: '#6F513D' },
                ],
            originalProduct: p,
          }))
        );
      }
    }

    return pages;
  }, [products]);

  const totalPages = Math.max(pagesData.length, 1);
  const currentItems = pagesData[currentPage - 1] || pagesData[0] || [];

  if (currentItems.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : pagesData.length));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < pagesData.length ? prev + 1 : 1));
  };

  const handleColorSelect = (productId: string, colorIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedColorMap((prev) => ({ ...prev, [productId]: colorIdx }));
  };

  const handleWishlistClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
    const inList = isInWishlist(product.id);
    showToast(
      inList ? `${product.title} removido dos favoritos` : `${product.title} salvo nos favoritos!`,
      inList ? 'info' : 'success'
    );
  };

  return (
    <section
      id="os-mais-procurados-section"
      className="bg-[#FAFAFA] select-none relative overflow-hidden border-b border-zinc-200/80 pt-7 sm:pt-9 pb-7 sm:pb-9"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* ========================================================= */}
        {/* HEADER DA SEÇÃO UNIFICADO                                 */}
        {/* ========================================================= */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 sm:mb-5">
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.24em] text-zinc-400">
                CURADORIA EXCLUSIVA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4C400]" />
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                BESTSELLERS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-[-0.03em] uppercase text-zinc-950 leading-none">
              OS MAIS PROCURADOS
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-500 font-normal mt-1.5">
              Peças com maior presença, silhueta marcante e recompra comprovada pela comunidade.
            </p>
          </div>

          {/* Lado Direito: Link de Navegação + Contador + Setas */}
          <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-end">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="h-8.5 sm:h-9 px-3.5 sm:px-4 rounded-[3px] border border-zinc-900 bg-zinc-900 hover:bg-black text-white font-bold text-[10.5px] sm:text-[11px] tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <span>VER CATÁLOGO</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>

            {/* Contador: 01 / 07 */}
            <span className="text-xs font-mono font-bold text-zinc-500 tracking-wider px-1">
              {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
            </span>

            {/* Setas de Navegação [ ← ] [ → ] */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Página anterior"
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 bg-white hover:bg-zinc-50 active:scale-95 border border-zinc-200/90 rounded-[3px] flex items-center justify-center text-zinc-900 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Próxima página"
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 bg-white hover:bg-amber-50/40 active:scale-95 border border-[#F4C400] rounded-[3px] flex items-center justify-center text-zinc-900 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* GRADE DE PRODUTOS: CARDS PADRONIZADOS E COMPACTOS         */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-3.5">
          {currentItems.map((item) => {
            const activeColorIdx = selectedColorMap[item.id] ?? 0;
            const activeColor = item.colors[activeColorIdx] || item.colors[0];
            const currentImg = activeColor?.image || item.image;
            const isFav = isInWishlist(item.originalProduct.id);

            const installmentValue = item.price / 3;
            const pixPrice = item.price * 0.95;

            return (
              <article
                key={item.id}
                onClick={() => onNavigate('product', item.originalProduct.slug || item.originalProduct.id)}
                className="group relative flex flex-col bg-white rounded-[3px] border border-zinc-200/90 hover:border-zinc-950 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] overflow-hidden select-none cursor-pointer"
              >
                {/* 1. Imagem Aspect 4/5 com Fundo Neutro Unificado */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EEEEEC]">
                  <img
                    src={currentImg}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />

                  {/* Botão de Favorito Unificado */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistClick(item.originalProduct, e)}
                    aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-white/95 hover:bg-white text-zinc-900 flex items-center justify-center border border-zinc-200/60 shadow-2xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Heart
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-colors stroke-[1.5] ${
                        isFav ? 'fill-rose-600 text-rose-600' : 'fill-transparent text-zinc-800'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Área de Informações Compacta e Refinada */}
                <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    {/* Categoria */}
                    <span className="block text-[9px] sm:text-[9.5px] font-semibold tracking-[0.16em] text-zinc-400 uppercase mb-0.5 leading-none">
                      {item.categoryLabel}
                    </span>

                    {/* Nome do Produto */}
                    <h3 className="font-bold text-zinc-900 text-[11.5px] sm:text-[13px] tracking-tight uppercase line-clamp-1 group-hover:text-black transition-colors mb-1">
                      {item.title}
                    </h3>

                    {/* Preço Principal */}
                    <div className="font-extrabold text-zinc-950 text-[14px] sm:text-[15.5px] tracking-tight leading-none mb-1">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    {/* Parcelamento */}
                    <div className="text-[9.5px] sm:text-[10px] text-zinc-500 font-normal leading-tight mb-0.5">
                      3x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros
                    </div>

                    {/* Pix */}
                    <div className="text-[9.5px] sm:text-[10px] text-zinc-800 font-medium leading-tight mb-1.5 sm:mb-2">
                      R$ {pixPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} no Pix
                    </div>
                  </div>

                  {/* Divisor + Área das Cores & Botão de Visualização */}
                  <div className="pt-2 border-t border-zinc-100">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-1.5">
                        {item.colors.slice(0, 4).map((c, idx) => {
                          const isWhite = c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff';
                          return (
                            <button
                              key={c.name || idx}
                              type="button"
                              onClick={(e) => handleColorSelect(item.id, idx, e)}
                              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-transform duration-150 hover:scale-110 cursor-pointer ${
                                isWhite ? 'border border-black/25' : 'border border-black/10'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                              aria-label={c.name}
                            />
                          );
                        })}
                      </div>

                      <span className="text-[8.5px] sm:text-[9px] font-semibold tracking-wider text-zinc-400 uppercase">
                        {item.colors.length} {item.colors.length === 1 ? 'COR' : 'CORES'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('product', item.originalProduct.slug || item.originalProduct.id);
                      }}
                      className="w-full h-7 sm:h-7.5 rounded-[2px] border border-zinc-900 bg-white group-hover:bg-zinc-950 group-hover:text-white text-zinc-900 font-bold text-[9.5px] sm:text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                    >
                      <span>VER PRODUTO</span>
                      <ArrowRight className="w-3 h-3" />
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
