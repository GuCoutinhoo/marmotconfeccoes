import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface LiveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (productId: string) => void;
  onSearchCategory: (category: string) => void;
}

export const LiveSearchModal: React.FC<LiveSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onSearchCategory,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const term = query.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.collection.toLowerCase().includes(term) ||
        p.subcategory.toLowerCase().includes(term)
    );
    setResults(filtered.slice(0, 6));
  }, [query, products]);

  if (!isOpen) return null;

  const popularTerms = ['Hoodie Heavyweight', 'Calça Cargo', 'Puffer', 'Oversized', '5 Panel', 'Chunky Runner'];

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-white border border-[#E4E4E7] rounded-2xl text-[#18181B] overflow-hidden shadow-2xl">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E4E4E7] flex items-center gap-3 bg-[#F8F9FA]">
          <Search className="w-5 h-5 text-[#B45309]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por moletons, cargos, oversized, tênis..."
            autoFocus
            className="flex-1 bg-transparent text-[#18181B] placeholder-[#71717A] text-sm font-medium focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[#71717A] hover:text-[#18181B] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#E4E4E7] text-xs font-bold uppercase rounded-lg hover:bg-[#18181B] hover:text-white text-[#52525B] transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!query ? (
            <div>
              {/* Popular Searches */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase text-[#71717A] tracking-wider flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-[#B45309]" /> Buscas Em Alta
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularTerms.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="text-xs bg-[#F4F4F5] border border-[#E4E4E7] hover:border-[#18181B] hover:text-[#18181B] text-[#52525B] px-3 py-1.5 rounded-full transition-all cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Categories */}
              <div>
                <p className="text-xs font-bold uppercase text-[#71717A] tracking-wider mb-3">Navegar por Categoria</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {['camisetas', 'oversized', 'moletons', 'cargos', 'jaquetas', 'tenis', 'bones', 'acessorios'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        onClose();
                        onSearchCategory(cat);
                      }}
                      className="p-3 bg-[#F8F9FA] border border-[#E4E4E7] hover:bg-white hover:border-[#18181B] text-left font-bold capitalize rounded-xl transition-colors flex items-center justify-between text-[#18181B] cursor-pointer shadow-xs"
                    >
                      <span>{cat}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#71717A]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-[#71717A]">
                  {results.length} resultado(s) encontrado(s) para "<strong className="text-[#18181B]">{query}</strong>"
                </span>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12 text-[#71717A]">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#71717A]" />
                  <p className="text-sm font-semibold text-[#18181B]">Nenhum produto encontrado.</p>
                  <p className="text-xs mt-1 text-[#71717A]">Tente pesquisar com termos mais genéricos como "hoodie" ou "cargo".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        onSelectProduct(product.id);
                      }}
                      className="flex gap-3 p-2.5 bg-white border border-[#E4E4E7] hover:border-[#18181B] rounded-xl cursor-pointer transition-all group shadow-xs hover:shadow-md"
                    >
                      <img
                        src={product.images?.[0] || (product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover rounded-lg bg-[#F4F4F5] shrink-0"
                      />
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-[10px] text-[#B45309] uppercase font-bold tracking-wider">{product.collection}</span>
                        <h4 className="text-xs font-bold text-[#18181B] truncate group-hover:text-[#B45309] transition-colors">{product.title}</h4>
                        <p className="text-xs font-black text-[#18181B] mt-1">
                          R$ {(product.promoPrice || product.price).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
