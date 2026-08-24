import React, { useState } from 'react';
import { X, Ruler, Sparkles, Check } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, category }) => {
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(75);
  const [fitPreference, setFitPreference] = useState<'regular' | 'oversized'>('oversized');

  if (!isOpen) return null;

  const calculateRecommendedSize = () => {
    if (weight < 62) return 'P';
    if (weight < 74) return fitPreference === 'oversized' ? 'G' : 'M';
    if (weight < 86) return fitPreference === 'oversized' ? 'GG' : 'G';
    return fitPreference === 'oversized' ? 'XG' : 'GG';
  };

  const recommended = calculateRecommendedSize();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-[#E4E4E7] rounded-2xl text-[#18181B] p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#71717A] hover:text-[#18181B] bg-[#F8F9FA] border border-[#E4E4E7] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Ruler className="w-5 h-5 text-[#B45309]" />
          <h3 className="text-lg font-bold uppercase tracking-wider text-[#18181B]">Guia de Medidas & Provador Virtual</h3>
        </div>
        <p className="text-xs text-[#71717A] mb-6">
          Nossas peças oversized possuem modelagem boxy com ombros caídos e caimento encorpado.
        </p>

        {/* Interactive Fit Recommender */}
        <div className="bg-[#F8F9FA] border border-[#E4E4E7] p-5 rounded-xl mb-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#B45309] uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" /> Recomendador IA de Tamanho
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
            <div>
              <label className="block text-[#52525B] mb-1 font-medium">Sua Altura: <span className="text-[#18181B] font-bold">{height} cm</span></label>
              <input
                type="range"
                min={150}
                max={205}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-[#18181B] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[#52525B] mb-1 font-medium">Seu Peso: <span className="text-[#18181B] font-bold">{weight} kg</span></label>
              <input
                type="range"
                min={45}
                max={120}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-[#18181B] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFitPreference('oversized')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                fitPreference === 'oversized'
                  ? 'bg-[#18181B] text-white border-[#18181B]'
                  : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#18181B]'
              }`}
            >
              Caimento Streetwear (Oversized Solto)
            </button>
            <button
              onClick={() => setFitPreference('regular')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                fitPreference === 'regular'
                  ? 'bg-[#18181B] text-white border-[#18181B]'
                  : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#18181B]'
              }`}
            >
              Caimento Ajustado / Regular
            </button>
          </div>

          <div className="bg-white border border-[#E4E4E7] p-3.5 rounded-xl flex items-center justify-between shadow-xs">
            <span className="text-xs text-[#52525B]">Tamanho Recomendado para você:</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#92400E] px-3.5 py-1 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg">
                {recommended}
              </span>
              <span className="text-[11px] text-[#52525B] flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Caimento Perfeito
              </span>
            </div>
          </div>
        </div>

        {/* Measurement Table */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-3">Tabela de Medidas (em centímetros)</h4>
        <div className="overflow-x-auto border border-[#E4E4E7] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-[#F8F9FA] text-[#71717A] uppercase tracking-wider">
                <th className="py-2.5 px-3">Tamanho</th>
                <th className="py-2.5 px-3">Tórax (A)</th>
                <th className="py-2.5 px-3">Comprimento (B)</th>
                <th className="py-2.5 px-3">Manga (C)</th>
                <th className="py-2.5 px-3">Ombro a Ombro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-[#52525B]">
              <tr className={recommended === 'P' ? 'bg-[#FEF3C7]/40 text-[#18181B] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#18181B]">P</td>
                <td className="py-2.5 px-3">56 cm</td>
                <td className="py-2.5 px-3">72 cm</td>
                <td className="py-2.5 px-3">22 cm</td>
                <td className="py-2.5 px-3">52 cm</td>
              </tr>
              <tr className={recommended === 'M' ? 'bg-[#FEF3C7]/40 text-[#18181B] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#18181B]">M</td>
                <td className="py-2.5 px-3">59 cm</td>
                <td className="py-2.5 px-3">75 cm</td>
                <td className="py-2.5 px-3">24 cm</td>
                <td className="py-2.5 px-3">55 cm</td>
              </tr>
              <tr className={recommended === 'G' ? 'bg-[#FEF3C7]/40 text-[#18181B] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#18181B]">G</td>
                <td className="py-2.5 px-3">62 cm</td>
                <td className="py-2.5 px-3">78 cm</td>
                <td className="py-2.5 px-3">26 cm</td>
                <td className="py-2.5 px-3">58 cm</td>
              </tr>
              <tr className={recommended === 'GG' ? 'bg-[#FEF3C7]/40 text-[#18181B] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#18181B]">GG</td>
                <td className="py-2.5 px-3">65 cm</td>
                <td className="py-2.5 px-3">81 cm</td>
                <td className="py-2.5 px-3">28 cm</td>
                <td className="py-2.5 px-3">61 cm</td>
              </tr>
              <tr className={recommended === 'XG' ? 'bg-[#FEF3C7]/40 text-[#18181B] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#18181B]">XG</td>
                <td className="py-2.5 px-3">68 cm</td>
                <td className="py-2.5 px-3">84 cm</td>
                <td className="py-2.5 px-3">30 cm</td>
                <td className="py-2.5 px-3">64 cm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
