import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { ShieldCheck, Award, ArrowRight } from 'lucide-react';

interface EssentialsGridProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const EssentialsGrid: React.FC<EssentialsGridProps> = ({
  products,
  onQuickView,
  onNavigate,
}) => {
  // Select a mixed curation of essentials: camisetas, moletons, calças, tênis, acessórios
  const essentialTee = products.find((p) => p.category === 'camisetas') || products[0];
  const essentialHoodie = products.find((p) => p.category === 'moletons') || products[1];
  const essentialPant = products.find((p) => p.category === 'cargos' || p.category === 'calcas') || products[2];
  const essentialSneaker = products.find((p) => p.category === 'tenis') || products[3];
  const essentialAccessory = products.find((p) => p.category === 'acessorios' || p.category === 'bones') || products[4];

  const essentialsList = [essentialTee, essentialHoodie, essentialPant, essentialSneaker, essentialAccessory].filter(Boolean) as Product[];

  return (
    <section className="py-20 bg-[#080808] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>STAPLES CURATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#EFECE6]">
              STREETWEAR ESSENTIALS
            </h2>
            <p className="text-xs text-[#777777] mt-1 max-w-xl">
              Uma curadoria indispensável misturando camisetas, moletons, calças, tênis e acessórios de alta gramatura para o guarda-roupa definitivo.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#161616] border border-[#262626] px-4 py-3 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-[#D6B35A]" />
            <div className="text-xs">
              <span className="font-extrabold text-[#EFECE6] block uppercase">Garantia Antiencolhimento</span>
              <span className="text-[#777777] text-[10px]">Algodão denso pré-lavado e amaciado</span>
            </div>
          </div>
        </div>

        {/* Curation Mix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {essentialsList.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
              onProductClick={(id) => onNavigate('product', id)}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-black uppercase text-[#D6B35A] hover:underline inline-flex items-center gap-2"
          >
            Ver Coleção Completa de Básicos Densos <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
