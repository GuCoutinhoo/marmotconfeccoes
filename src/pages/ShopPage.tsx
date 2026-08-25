import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumb } from '../components/Breadcrumb';
import { Filter, X, Grid, Check, Sparkles, RefreshCw } from 'lucide-react';
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

  // Reset pagination when any filter changes
  const handleFilterChange = () => {
    setDisplayCount(24);
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      if (selectedCategory === 'calcas') {
        result = result.filter((p) => p.category === 'calcas' || p.category === 'cargos' || p.subcategory === 'calcas' || p.tags?.some(t => t.toLowerCase() === 'calças' || t.toLowerCase() === 'calca'));
      } else {
        result = result.filter((p) => p.category === selectedCategory || p.subcategory === selectedCategory || p.tags?.some(t => t.toLowerCase() === selectedCategory.toLowerCase()));
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
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
    <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Início', onClick: () => onNavigate('home') },
            { label: 'Catálogo', onClick: () => resetFilters() },
            ...(selectedCategory ? [{ label: selectedCategory.toUpperCase() }] : []),
          ]}
        />

        {/* Page Header */}
        <div className="my-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309] mb-1.5">
            <span>ATELIÊ AUTORAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#18181B]">
            {selectedCategory ? `CATÁLOGO / ${selectedCategory.toUpperCase()}` : 'CATÁLOGO COMPLETO'}
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] mt-1.5 max-w-2xl font-medium leading-relaxed">
            Peças exclusivas desenvolvidas com malhas de algodão penteado de 260g a 400g/m², cortes boxy estruturados e acabamento artesanal em São Paulo.
          </p>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-[#E4E4E7] rounded-2xl mb-8 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-[#F8F9FA] border border-[#E4E4E7] hover:bg-[#18181B] hover:text-white text-[#18181B] px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              <Filter className="w-4 h-4 text-[#B45309]" />
              Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>

            <span className="text-xs text-[#71717A] font-medium">
              Exibindo <strong className="text-[#18181B]">{filteredProducts.length}</strong> de {products.length} produtos
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Grid Layout Switcher */}
            <div className="hidden md:flex items-center gap-1 bg-[#F4F4F5] p-1 border border-[#E4E4E7] rounded-xl">
              <button
                onClick={() => setGridCols(3)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  gridCols === 3 ? 'bg-[#18181B] text-white font-bold' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="3 colunas"
              >
                3 col
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  gridCols === 4 ? 'bg-[#18181B] text-white font-bold' : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="4 colunas"
              >
                4 col
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#71717A] hidden sm:inline font-mono">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#F8F9FA] border border-[#E4E4E7] text-[#18181B] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#18181B] cursor-pointer"
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
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E4E4E7] p-6 rounded-2xl space-y-6 sticky top-28 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#18181B] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#B45309]" /> Filtros
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-[#B45309] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Limpar ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
                Categorias
              </label>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                    selectedCategory === ''
                      ? 'bg-[#18181B] text-white font-bold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                  }`}
                >
                  <span>Todas as Peças</span>
                  <span className="text-[10px] font-mono opacity-70">{products.length}</span>
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                      selectedCategory === c.slug
                        ? 'bg-[#18181B] text-white font-bold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]'
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
            <div className="space-y-2.5 pt-4 border-t border-[#E4E4E7]">
              <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
                Tamanhos
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['P', 'M', 'G', 'GG', 'XG', '38', '40', '42'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => toggleSize(sz)}
                    className={`py-2 rounded-lg text-xs font-bold uppercase border transition-all cursor-pointer ${
                      selectedSizes.includes(sz)
                        ? 'bg-[#18181B] text-white border-[#18181B] font-black'
                        : 'bg-[#F8F9FA] text-[#52525B] border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div className="space-y-2.5 pt-4 border-t border-[#E4E4E7]">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-[#71717A]">
                  Preço Máximo
                </label>
                <span className="font-mono font-bold text-[#92400E]">
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
                className="w-full accent-[#18181B] cursor-pointer"
              />
            </div>
          </aside>

          {/* Product Grid Area (9 cols) */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center space-y-4 shadow-xs">
                <p className="text-base font-bold text-[#18181B]">Nenhum produto encontrado com os filtros selecionados.</p>
                <p className="text-xs text-[#71717A]">Tente ajustar a faixa de preço ou remover as categorias selecionadas.</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-[#F4C400] text-[#0B0B0E] font-bold text-xs uppercase rounded-xl hover:bg-[#E5B500] transition-colors cursor-pointer shadow-xs"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div
                  className={`grid gap-5 sm:gap-6 ${
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
                <div className="pt-8 border-t border-[#E4E4E7] flex flex-col items-center justify-center gap-3">
                  <span className="text-xs font-mono text-[#71717A]">
                    Exibindo <strong>{visibleProducts.length}</strong> de <strong>{filteredProducts.length}</strong> peças autorais
                  </span>
                  
                  {visibleProducts.length < filteredProducts.length && (
                    <button
                      onClick={() => setDisplayCount((prev) => prev + 24)}
                      className="py-3 px-8 bg-[#18181B] text-white hover:bg-[#27272A] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end lg:hidden animate-fadeIn">
          <div className="w-full max-w-xs bg-white h-full p-6 space-y-6 overflow-y-auto border-l border-[#E4E4E7] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E4E4E7] pb-4">
              <h3 className="text-xs font-black uppercase text-[#18181B]">Filtros do Catálogo</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold uppercase text-[#71717A] block">Categorias</label>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                  className={`w-full text-left py-2 px-3 rounded-lg flex justify-between cursor-pointer ${
                    selectedCategory === c.slug
                      ? 'bg-[#18181B] text-white font-bold'
                      : 'text-[#52525B] hover:bg-[#F4F4F5]'
                  }`}
                >
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3.5 bg-[#F4C400] text-[#0B0B0E] font-black text-xs uppercase rounded-xl cursor-pointer shadow-xs"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
