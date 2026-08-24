import React from 'react';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';

interface EditorialMagazineJournalProps {
  onNavigate: (page: string, param?: string) => void;
}

export const EditorialMagazineJournal: React.FC<EditorialMagazineJournalProps> = ({ onNavigate }) => {
  const articles = [
    {
      id: 'art-1',
      category: 'ESTILO & CAIMENTO',
      title: 'Guia Definitivo do Caimento Boxy & Malha Heavyweight',
      excerpt: 'Entenda como a gramatura densa do algodão e a gola de 3cm redefinem a estrutura e a durabilidade do visual.',
      readTime: '4 min de leitura',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
      tag: 'GUIA DE FIT',
    },
    {
      id: 'art-2',
      category: 'STYLING URBANO',
      title: 'Como Combinar Calças Cargo Táticas no Cotidiano',
      excerpt: 'Dicas práticas de proporção para sobrepor calças cargo ripstop com tênis chunky e moletons sem exageros.',
      readTime: '5 min de leitura',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
      tag: 'STYLING CARGO',
    },
    {
      id: 'art-3',
      category: 'MATÉRIA-PRIMA',
      title: 'A Importância da Fibra Longa no Algodão Penteado',
      excerpt: 'Por que o algodão nacional de alta densidade não forma bolinhas e mantém a textura aveludada por anos.',
      readTime: '6 min de leitura',
      image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
      tag: 'QUALIDADE',
    },
    {
      id: 'art-4',
      category: 'BASTIDORES DE CONFECÇÃO',
      title: 'Do Fio à Peça Pronta: Nosso Ateliê em São Paulo',
      excerpt: 'Conheça o processo de corte manual, costura reforçada e lavagem estonada pré-encolhida de cada lote.',
      readTime: '3 min de leitura',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      tag: 'PRODUÇÃO',
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 border-b border-[#E4E4E7] pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#B45309] mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>MARMOT JOURNAL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#18181B]">
              CONTEÚDO & GUIAS DE ESTILO
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-1 max-w-lg">
              Guias de caimento, referências de styling e os bastidores de confecção do nosso ateliê paulista.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-[#B45309] uppercase border border-[#E4E4E7] bg-[#F8F9FA] px-4 py-2 rounded-xl">
            EDITION // 2026
          </span>
        </div>

        {/* Magazine Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((art) => (
            <div
              key={art.id}
              onClick={() => onNavigate('shop')}
              className="group relative bg-white border border-[#E4E4E7] hover:border-[#18181B] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              {/* Image Header */}
              <div className="relative h-64 sm:h-72 overflow-hidden bg-[#F4F4F5]">
                <img
                  src={art.image}
                  alt={art.title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="bg-[#18181B] text-white text-[9px] font-black uppercase px-2.5 py-1 rounded shadow">
                    {art.tag}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-[#E4E4E7] font-mono">
                  <span>{art.category}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#F4C400]" /> {art.readTime}
                  </span>
                </div>
              </div>

              {/* Text Body */}
              <div className="p-6 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#18181B] uppercase tracking-tight group-hover:text-[#B45309] transition-colors leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#52525B] mt-2 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] flex items-center gap-1.5 text-xs font-bold text-[#18181B] group-hover:text-[#B45309] group-hover:translate-x-1 transition-all">
                  LER ARTIGO & EXPLORAR PEÇAS <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
