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
    id: 'prod-cal-007',
    slug: 'calca-cargo-balloon',
    categoryLabel: 'CARGOS',
    title: 'CALÇA CARGO BALLOON',
    price: 329.9,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
    colors: [
      {
        name: 'Pitch Black',
        hex: '#2B3846',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
      },
    ],
  },
  {
    id: 'prod-cal-008',
    slug: 'calca-cargo-convertible',
    categoryLabel: 'CARGOS',
    title: 'CALÇA CARGO CONVERTIBLE',
    price: 349.9,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
    colors: [
      {
        name: 'Khaki Sand',
        hex: '#C2B199',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
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
    // Página 1: Fixa com os 8 da referência
    const page1Items = REFERENCE_BESTSELLERS.map((refItem) => {
      const dbMatch = products.find((p) => p.slug === refItem.slug || p.id === refItem.id);
      return {
        ...refItem,
        originalProduct: dbMatch || ({
          id: refItem.id,
          slug: refItem.slug,
          title: refItem.title,
          subtitle: '',
          description: '',
          price: refItem.price,
          image: refItem.image,
          images: [refItem.image],
          category: refItem.categoryLabel.toLowerCase(),
          subcategory: '',
          collection: 'Numerit Edition',
          tags: ['Bestseller'],
          sizes: ['P', 'M', 'G', 'GG'],
          colors: refItem.colors.map((c) => ({
            color: c.name.toLowerCase(),
            colorName: c.name,
            colorHex: c.hex,
            image: c.image,
          })),
          stockCount: 15,
          sku: refItem.id,
          details: [],
          careInstructions: [],
          rating: 5.0,
          reviewCount: 30,
        } as unknown as Product),
      };
    });

    // Demais páginas extraídas dinamicamente do catálogo para permitir navegação real de 01 a 07
    const remainingProducts = products.filter(
      (p) => !REFERENCE_BESTSELLERS.some((r) => r.slug === p.slug || r.id === p.id)
    );

    const pages: Array<typeof page1Items> = [page1Items];
    const itemsPerPage = 8;

    for (let i = 0; i < remainingProducts.length && pages.length < 7; i += itemsPerPage) {
      const chunk = remainingProducts.slice(i, i + itemsPerPage);
      if (chunk.length > 0) {
        pages.push(
          chunk.map((p) => ({
            id: p.id,
            slug: p.slug,
            categoryLabel: (p.category || 'LANÇAMENTO').toUpperCase(),
            title: p.title.toUpperCase(),
            price: p.price,
            image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
            colors: p.colors?.map((c) => ({
              name: c.colorName || c.color,
              hex: c.colorHex || '#171717',
              image: c.image || c.featuredImage,
            })) || [
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

  const totalPages = Math.max(pagesData.length, 7);
  const currentItems = pagesData[currentPage - 1] || pagesData[0];

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
              <div
                key={item.id}
                onClick={() => onNavigate('product', item.originalProduct.id)}
                className="group bg-white border border-zinc-200/90 rounded-[3px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md cursor-pointer relative"
              >
                {/* Linha Amarela na parte de baixo no hover */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-[#F4C400] transition-colors duration-300 z-30 pointer-events-none" />

                {/* 1. Imagem Grande sem espaços em branco sobrando */}
                <div className="relative w-full aspect-[4/3.5] bg-[#E8E7E3] overflow-hidden">
                  <img
                    src={currentImg}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />

                  {/* Botão de Favorito Refinado (Canto Superior Direito) */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistClick(item.originalProduct, e)}
                    aria-label="Salvar nos favoritos"
                    className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer text-zinc-900 border border-black/5"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isFav ? 'fill-red-500 text-red-500' : 'text-zinc-800 stroke-[2]'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Conteúdo do Card Alinhado e Organizado */}
                <div className="p-4 sm:p-4.5 flex flex-col justify-between flex-1">
                  <div>
                    {/* Categoria Microtexto */}
                    <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500 block mb-1">
                      {item.categoryLabel}
                    </span>

                    {/* Nome do Produto */}
                    <h3 className="font-extrabold text-[14px] sm:text-[14.5px] uppercase tracking-tight text-[#111111] leading-snug mb-2 line-clamp-1 group-hover:text-zinc-700 transition-colors">
                      {item.title}
                    </h3>

                    {/* Bloco de Preços Rigorosamente Formatados */}
                    <div className="mb-3.5">
                      {/* Preço Principal */}
                      <span className="text-xl sm:text-[21px] font-black text-black tracking-tight block leading-none mb-1">
                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {/* Parcelamento Atraente */}
                      <span className="text-[12px] sm:text-[12.5px] text-zinc-700 font-semibold block leading-tight mb-0.5">
                        ou 3x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros
                      </span>

                      {/* Valor no Pix */}
                      <span className="text-[11px] sm:text-[11.5px] text-zinc-500 font-normal block leading-tight">
                        R$ {pixPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} no Pix
                      </span>
                    </div>
                  </div>

                  {/* 3. Swatches de Cor Discretos */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      {item.colors.map((c, idx) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={(e) => handleColorSelect(item.id, idx, e)}
                          className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                            activeColorIdx === idx
                              ? 'ring-1.5 ring-black ring-offset-1 scale-105'
                              : 'border border-black/15 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="text-[10.5px] sm:text-[11px] text-zinc-500 font-medium ml-1">
                      {item.colors.length} {item.colors.length === 1 ? 'cor' : 'cores'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
