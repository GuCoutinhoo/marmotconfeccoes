import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumb } from '../components/Breadcrumb';
import { Filter, X, RefreshCw } from 'lucide-react';
import { Product } from '../types';

interface ShopPageProps {
  initialCategory?: string;
  onNavigate: (page: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory,
  onNavigate,
  onQuickView,
}) => {
  const { products, categories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(700);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [displayCount, setDisplayCount] = useState<number>(24);

  // Sync state when initialCategory changes via navigation
  React.useEffect(() => {
    setSelectedCategory(initialCategory || '');
    setDisplayCount(24);
  }, [initialCategory]);

  // Reset pagination when any filter changes
  const handleFilterChange = () => {
    setDisplayCount(24);
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      if (selectedCategory === 'novidades') {
        result = result.filter((p) => p.isNewRelease || p.tags?.some((t) => t.toLowerCase().includes('novidade') || t.toLowerCase().includes('novo')) || true);
      } else if (selectedCategory === 'colecao-2026') {
        result = result.filter((p) => p.collection?.includes('Cyber') || p.collection?.includes('Vol. 04') || p.collection?.includes('2026') || true);
      } else if (selectedCategory === 'calcas') {
        result = result.filter((p) => p.category === 'calcas' || p.category === 'cargos' || p.subcategory === 'calcas' || p.tags?.some((t) => t.toLowerCase() === 'calças' || t.toLowerCase() === 'calca'));
      } else {
        result = result.filter((p) => p.category === selectedCategory || p.subcategory === selectedCategory || p.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase()));
      }
    }

    if (selectedCollection) {
      result = result.filter((p) => p.collection === selectedCollection);
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((sz) => selectedSizes.includes(sz)));
    }

    if (selectedTags.length > 0) {
      result = result.filter((p) => p.tags.some((tag) => selectedTags.includes(tag)));
    }

    result = result.filter((p) => (p.promoPrice || p.price) <= priceRange);

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.isNewRelease ? 1 : 0) - (a.isNewRelease ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, selectedCollection, selectedSizes, selectedTags, priceRange, sortBy]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    handleFilterChange();
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedCollection('');
    setSelectedSizes([]);
    setSelectedTags([]);
    setPriceRange(700);
    setSortBy('featured');
    setDisplayCount(24);
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedCollection ? 1 : 0) +
    selectedSizes.length +
    selectedTags.length +
    (priceRange < 700 ? 1 : 0);

  return (
    <div className="bg-[#FAFAFA] text-[#0B0B0E] min-h-screen py-6 sm:py-8 select-none">
      <div className="w-full max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <Breadcrumb
          items={[
            { label: 'Início', onClick: () => onNavigate('home') },
            { label: 'Catálogo', onClick: () => resetFilters() },
            ...(selectedCategory ? [{ label: selectedCategory.toUpperCase() }] : []),
          ]}
        />

        {/* Page Header */}
        <div className="mt-5 mb-7 sm:mt-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 bg-[#F4C400] rounded-full inline-block" />
            <span className="text-[10px] sm:text-[10.5px] font-mono font-bold uppercase tracking-[0.24em] text-zinc-500">
              CATÁLOGO // ATELIÊ AUTORAL
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black uppercase tracking-tight text-[#0B0B0E] leading-none">
            {selectedCategory ? `CATÁLOGO / ${selectedCategory.toUpperCase()}` : 'CATÁLOGO COMPLETO'}
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-500 mt-2 max-w-2xl font-normal leading-relaxed">
            Peças exclusivas desenvolvidas com malhas de algodão penteado de 260g a 400g/m², cortes boxy estruturados e acabamento artesanal em São Paulo.
          </p>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4 bg-white border border-zinc-200/90 rounded-[2px] mb-7 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-zinc-100 border border-zinc-200 hover:bg-[#0B0B0E] hover:text-white text-[#0B0B0E] px-3.5 py-2 rounded-[2px] text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            <span className="text-xs text-zinc-500 font-mono">
              Exibindo <strong className="text-[#0B0B0E] font-sans font-bold">{filteredProducts.length}</strong> de {products.length} produtos
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Grid Layout Switcher */}
            <div className="hidden md:flex items-center gap-1 bg-zinc-100 p-0.5 border border-zinc-200 rounded-[2px]">
              <button
                type="button"
                onClick={() => setGridCols(3)}
                className={`px-2.5 py-1 rounded-[2px] text-xs font-mono transition-colors cursor-pointer ${
                  gridCols === 3 ? 'bg-[#0B0B0E] text-white font-bold' : 'text-zinc-500 hover:text-[#0B0B0E]'
                }`}
                title="3 colunas"
              >
                3 col
              </button>
              <button
                type="button"
                onClick={() => setGridCols(4)}
                className={`px-2.5 py-1 rounded-[2px] text-xs font-mono transition-colors cursor-pointer ${
                  gridCols === 4 ? 'bg-[#0B0B0E] text-white font-bold' : 'text-zinc-500 hover:text-[#0B0B0E]'
                }`}
                title="4 colunas"
              >
                4 col
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 hidden sm:inline font-mono">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-[#0B0B0E] px-3 py-2 rounded-[2px] text-xs focus:outline-none focus:border-[#0B0B0E] cursor-pointer font-medium"
              >
                <option value="featured">Destaques do Drop</option>
                <option value="newest">Mais Recentes</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
                <option value="rating">Melhor Avaliados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Body Grid: Sidebar + Product Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-zinc-200/90 p-6 rounded-[2px] space-y-6 sticky top-28 shadow-2xs">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B0B0E] flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros</span>
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-zinc-500 hover:text-[#0B0B0E] hover:underline flex items-center gap-1 font-mono cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Limpar ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-500 block">
                Categorias
              </label>
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left py-1.5 px-2.5 rounded-[2px] transition-colors flex justify-between items-center cursor-pointer ${
                    selectedCategory === ''
                      ? 'bg-[#0B0B0E] text-white font-bold'
                      : 'text-zinc-600 hover:text-[#0B0B0E] hover:bg-zinc-100'
                  }`}
                >
                  <span>Todas as Peças</span>
                  <span className="text-[10px] font-mono opacity-70">{products.length}</span>
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-[2px] transition-colors flex justify-between items-center cursor-pointer ${
                      selectedCategory === c.slug
                        ? 'bg-[#0B0B0E] text-white font-bold'
                        : 'text-zinc-600 hover:text-[#0B0B0E] hover:bg-zinc-100'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] font-mono opacity-70">
                      {products.filter((p) => p.category === c.slug).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="space-y-2.5 pt-4 border-t border-zinc-200">
              <label className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-zinc-500 block">
                Tamanhos
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['P', 'M', 'G', 'GG', 'XG', '38', '40', '42'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`py-2 rounded-[2px] text-xs font-mono font-bold uppercase border transition-colors cursor-pointer ${
                      selectedSizes.includes(sz)
                        ? 'bg-[#0B0B0E] text-[#F4C400] border-[#0B0B0E]'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-[#0B0B0E] hover:text-[#0B0B0E]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div className="space-y-2.5 pt-4 border-t border-zinc-200">
              <div className="flex justify-between items-center text-xs">
                <label className="font-mono font-bold uppercase tracking-[0.16em] text-zinc-500 text-[11px]">
                  Preço Máximo
                </label>
                <span className="font-mono font-bold text-[#0B0B0E]">
                  R$ {priceRange.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <input
                type="range"
                min={80}
                max={700}
                step={20}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#0B0B0E] cursor-pointer"
              />
            </div>
          </aside>

          {/* Product Grid Area (9 cols) */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-zinc-200/90 rounded-[2px] p-12 text-center space-y-4">
                <p className="text-base font-bold text-[#0B0B0E]">Nenhum produto encontrado com os filtros selecionados.</p>
                <p className="text-xs text-zinc-500">Tente ajustar a faixa de preço ou remover as categorias selecionadas.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-6 py-3 bg-[#F4C400] text-[#0B0B0E] font-black text-xs uppercase tracking-wider rounded-[2px] hover:bg-[#E5B500] transition-colors cursor-pointer"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div
                  className={`grid gap-3.5 sm:gap-4 lg:gap-5 ${
                    gridCols === 3
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={onQuickView}
                      onProductClick={(id) => onNavigate('product', id)}
                    />
                  ))}
                </div>

                {/* Progressive Load Button & Counter */}
                <div className="pt-8 border-t border-zinc-200 flex flex-col items-center justify-center gap-3">
                  <span className="text-xs font-mono text-zinc-500">
                    Exibindo <strong>{visibleProducts.length}</strong> de <strong>{filteredProducts.length}</strong> peças autorais
                  </span>

                  {visibleProducts.length < filteredProducts.length && (
                    <button
                      type="button"
                      onClick={() => setDisplayCount((prev) => prev + 24)}
                      className="py-3.5 px-8 bg-[#0B0B0E] hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                    >
                      Carregar Mais Peças (+24)
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end lg:hidden animate-fadeIn">
          <div className="w-full max-w-xs bg-white h-full p-6 space-y-6 overflow-y-auto border-l border-zinc-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B0B0E]">Filtros do Catálogo</h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 text-zinc-500 hover:text-[#0B0B0E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-mono font-bold uppercase tracking-[0.16em] text-zinc-500 block">Categorias</label>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                  className={`w-full text-left py-2 px-3 rounded-[2px] flex justify-between cursor-pointer ${
                    selectedCategory === c.slug
                      ? 'bg-[#0B0B0E] text-white font-bold'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3.5 bg-[#F4C400] text-[#0B0B0E] font-black text-xs uppercase tracking-wider rounded-[2px] cursor-pointer"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
