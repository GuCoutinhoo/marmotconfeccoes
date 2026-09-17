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

    // 2. Se a página 1 tiver menos de 8 itens, preenche com outros produtos reais do catálogo
    const remainingProducts = products.filter(
      (p) => !usedIds.has(p.id) && (p.status === undefined || p.status === 'active')
    );

    const sortedRemaining = [...remainingProducts].sort((a, b) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    while (page1Items.length < 8 && sortedRemaining.length > 0) {
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
    const itemsPerPage = 8;

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
      className="bg-[#F6F5F2] select-none relative overflow-hidden border-b border-zinc-200/90 py-16 sm:py-20 lg:py-24"
    >
      <div className="max-w-[1640px] mx-auto px-4 sm:px-7 lg:px-8">
        {/* ========================================================= */}
        {/* HEADER DA SEÇÃO: HIERARQUIA EDITORIAL MINIMALISTA         */}
        {/* ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-11">
          {/* Lado Esquerdo: Microtexto de Marca + Título Forte + Bloco de Apoio */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-8">
            <div>
              <span className="font-sans text-[11px] sm:text-[11.5px] font-extrabold uppercase tracking-[0.32em] text-[#111111] block mb-1.5 leading-none">
                MARMOT
              </span>
              <h2
                className="font-anton text-4xl sm:text-5xl lg:text-[56px] xl:text-[60px] uppercase text-black leading-[0.92] tracking-tight"
                style={{ fontWeight: 'normal' }}
              >
                OS MAIS PROCURADOS
              </h2>
            </div>

            {/* Divisor Vertical Elegante */}
            <div
              className="hidden md:block w-[1.5px] h-13 bg-zinc-300/90 shrink-0 self-center"
              style={{
                marginLeft: '-19px',
                marginTop: '14px',
              }}
            />

            {/* Microtítulo e Texto de Apoio Curto */}
            <div className="max-w-md pt-0.5">
              <span
                className="text-[11px] sm:text-[11.5px] font-black uppercase tracking-[0.16em] text-black block mb-1"
                style={{
                  marginLeft: '-22px',
                  marginTop: '12px',
                }}
              >
                SELEÇÃO DA COMUNIDADE
              </span>
              <p
                className="text-[12px] sm:text-[12.5px] text-zinc-500 leading-snug font-normal"
                style={{
                  marginTop: '9px',
                  marginLeft: '-23px',
                }}
              >
                Peças com maior saída, recompra e presença no cotidiano.
                <br />
                Uma curadoria construída a partir da experiência de quem veste Marmot.
              </p>
            </div>
          </div>

          {/* Lado Direito: Link de Navegação + Separador + Contador + Setas */}
          <div className="flex items-center gap-4 sm:gap-6 self-start lg:self-end">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-[11.5px] sm:text-[12px] font-black uppercase tracking-[0.15em] text-black hover:text-zinc-600 underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>VER TODOS OS LANÇAMENTOS</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <div className="hidden sm:block w-px h-4.5 bg-zinc-300/80" />

            {/* Contador: 01 — 07 */}
            <span className="text-xs sm:text-[13px] font-mono font-medium text-zinc-600 tracking-wider">
              {String(currentPage).padStart(2, '0')} — {String(totalPages).padStart(2, '0')}
            </span>

            {/* Setas de Navegação [ ← ] [ → ] */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Página anterior"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white hover:bg-zinc-100 active:scale-95 border border-zinc-300/90 rounded-[2px] flex items-center justify-center text-black transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Próxima página"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F4C400] hover:bg-[#E5B500] active:scale-95 border border-[#E5B500] rounded-[2px] flex items-center justify-center text-black transition-all cursor-pointer shadow-2xs"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* GRADE DE PRODUTOS: CARDS REFINADOS E ELEGANTES           */}
        {/* Altura natural para rolagem orgânica da página            */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {currentItems.map((item) => {
            const activeColorIdx = selectedColorMap[item.id] ?? 0;
            const activeColor = item.colors[activeColorIdx] || item.colors[0];
            const currentImg = activeColor?.image || item.image;
            const isFav = isInWishlist(item.originalProduct.id);

            // Cálculos exatos baseados na referência
            const installmentValue = item.price / 3;
            const pixPrice = item.price * 0.95;

            return (
              <article
                key={item.id}
                onClick={() => onNavigate('product', item.originalProduct.slug || item.originalProduct.id)}
                className="group relative flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)] hover:border-black/15 transition-all duration-300 overflow-hidden select-none cursor-pointer"
              >
                {/* 1. Imagem Grande (65% a 70% da altura visual do card, object-fit: cover) */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F6F6F6]">
                  <img
                    src={currentImg}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />

                  {/* Botão de Favorito: Botão circular branco no canto superior direito */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistClick(item.originalProduct, e)}
                    aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-white/95 hover:bg-white text-black flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all duration-200 cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-200 stroke-[1.3] ${
                        isFav ? 'fill-black text-black' : 'fill-transparent text-black'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Área de Informações com Hierarquia e Espaçamentos Precisos */}
                <div className="p-4 sm:p-5 lg:p-6 flex flex-col justify-between flex-1">
                  <div>
                    {/* Categoria */}
                    <p className="font-helvetica-now font-medium uppercase text-[10.5px] sm:text-[11px] tracking-[0.16em] text-[#555555] mb-2 leading-none">
                      {item.categoryLabel}
                    </p>

                    {/* Nome do Produto */}
                    <h3 className="font-helvetica-now font-bold uppercase text-[15px] sm:text-[16px] tracking-[-0.02em] leading-[0.95] text-black hover:text-zinc-700 transition-colors line-clamp-2 mb-3 sm:mb-3.5">
                      {item.title}
                    </h3>

                    {/* Preço (Sans-serif pesada, mesmo estilo visual do título, sem serif) */}
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-helvetica-now font-extrabold text-[21px] sm:text-[23px] tracking-[-0.035em] leading-[0.95] text-black">
                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Parcelamento */}
                    <p className="font-helvetica-now font-normal text-[11px] sm:text-[11.5px] text-[#555555] leading-tight mb-0.5">
                      ou 3x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros
                    </p>

                    {/* Pix */}
                    <p className="font-helvetica-now font-normal text-[11px] sm:text-[11.5px] text-[#555555] leading-tight mb-4 sm:mb-5">
                      R$ {pixPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} no Pix
                    </p>
                  </div>

                  {/* Divisor + Área das Cores & CTA */}
                  <div className="pt-3.5 border-t border-[#EAEAEA] flex items-center justify-between gap-3">
                    {/* Swatches e Quantidade */}
                    <div className="flex items-center min-w-0">
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.colors.slice(0, 4).map((c, idx) => {
                          const isWhite = c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#fff';
                          return (
                            <button
                              key={c.name || idx}
                              type="button"
                              onClick={(e) => handleColorSelect(item.id, idx, e)}
                              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-transform duration-150 hover:scale-110 cursor-pointer ${
                                isWhite ? 'border border-black/25' : 'border border-black/10'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                              aria-label={c.name}
                            />
                          );
                        })}
                      </div>

                      {/* Separador vertical fino */}
                      <div className="h-3 w-[1px] bg-[#D4D4D4] mx-2 sm:mx-2.5 shrink-0" />

                      {/* Quantidade de cores */}
                      <span className="font-helvetica-now font-normal text-[11px] sm:text-[11.5px] text-[#333333] whitespace-nowrap truncate select-none">
                        {item.colors.length} {item.colors.length === 1 ? 'cor' : 'cores'}
                      </span>
                    </div>

                    {/* CTA: Círculo preto com seta fina branca */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black hover:bg-zinc-800 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs shrink-0 group/cta">
                      <ArrowRight className="w-4 h-4 text-white stroke-[1.4] transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                    </div>
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
