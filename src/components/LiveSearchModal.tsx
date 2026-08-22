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
    <div className="fixed inset-0 z-[120] flex items-start justify-center pt-16 px-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#161616] border border-[#262626] rounded-xl text-[#EFECE6] overflow-hidden shadow-2xl">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#262626] flex items-center gap-3 bg-[#080808]">
          <Search className="w-5 h-5 text-[#D6B35A]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por moletons, cargos, oversized, tênis..."
            autoFocus
            className="flex-1 bg-transparent text-[#EFECE6] placeholder-[#777777] text-sm font-medium focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[#777777] hover:text-[#EFECE6]">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#262626] text-xs font-bold uppercase rounded hover:bg-[#EFECE6] hover:text-black text-[#EFECE6] transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!query ? (
            <div>
              {/* Popular Searches */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase text-[#777777] tracking-wider flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-[#D6B35A]" /> Buscas Em Alta
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularTerms.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="text-xs bg-[#080808] border border-[#262626] hover:border-[#D6B35A] hover:text-[#D6B35A] text-[#777777] px-3 py-1.5 rounded-full transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Categories */}
              <div>
                <p className="text-xs font-bold uppercase text-[#777777] tracking-wider mb-3">Navegar por Categoria</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {['camisetas', 'oversized', 'moletons', 'cargos', 'jaquetas', 'tenis', 'bones', 'acessorios'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        onClose();
                        onSearchCategory(cat);
                      }}
                      className="p-3 bg-[#080808] border border-[#262626] hover:bg-[#161616] text-left font-bold capitalize rounded transition-colors flex items-center justify-between text-[#EFECE6]"
                    >
                      <span>{cat}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#777777]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-[#777777]">
                  {results.length} resultado(s) encontrado(s) para "<strong className="text-[#EFECE6]">{query}</strong>"
                </span>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12 text-[#777777]">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#777777]" />
                  <p className="text-sm font-semibold text-[#EFECE6]">Nenhum produto encontrado.</p>
                  <p className="text-xs mt-1 text-[#777777]">Tente pesquisar com termos mais genéricos como "hoodie" ou "cargo".</p>
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
                      className="flex gap-3 p-2.5 bg-[#080808] border border-[#262626] hover:border-[#D6B35A] rounded-lg cursor-pointer transition-all group"
                    >
                      <img
                        src={product.images?.[0] || (product as any).image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover rounded bg-black shrink-0"
                      />
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-[10px] text-[#D6B35A] uppercase font-bold tracking-wider">{product.collection}</span>
                        <h4 className="text-xs font-bold text-[#EFECE6] truncate group-hover:text-[#D6B35A] transition-colors">{product.title}</h4>
                        <p className="text-xs font-black text-[#EFECE6] mt-1">
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
