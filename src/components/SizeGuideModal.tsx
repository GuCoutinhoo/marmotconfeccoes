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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#161616] border border-[#262626] rounded-xl text-[#EFECE6] p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#777777] hover:text-[#EFECE6] bg-[#080808] border border-[#262626] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Ruler className="w-5 h-5 text-[#D6B35A]" />
          <h3 className="text-lg font-bold uppercase tracking-wider text-[#EFECE6]">Guia de Medidas & Provador Virtual</h3>
        </div>
        <p className="text-xs text-[#777777] mb-6">
          Nossas peças oversized possuem modelagem boxy com ombros caídos e caimento encorpado.
        </p>

        {/* Interactive Fit Recommender */}
        <div className="bg-[#080808] border border-[#262626] p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D6B35A] uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" /> Recomendador IA de Tamanho
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
            <div>
              <label className="block text-[#777777] mb-1 font-medium">Sua Altura: <span className="text-[#EFECE6] font-bold">{height} cm</span></label>
              <input
                type="range"
                min={150}
                max={205}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-[#D6B35A] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[#777777] mb-1 font-medium">Seu Peso: <span className="text-[#EFECE6] font-bold">{weight} kg</span></label>
              <input
                type="range"
                min={45}
                max={120}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-[#D6B35A] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFitPreference('oversized')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded border transition-all ${
                fitPreference === 'oversized'
                  ? 'bg-[#D6B35A] text-black border-[#D6B35A]'
                  : 'bg-[#161616] text-[#777777] border-[#262626]'
              }`}
            >
              Caimento Streetwear (Oversized Solto)
            </button>
            <button
              onClick={() => setFitPreference('regular')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded border transition-all ${
                fitPreference === 'regular'
                  ? 'bg-[#D6B35A] text-black border-[#D6B35A]'
                  : 'bg-[#161616] text-[#777777] border-[#262626]'
              }`}
            >
              Caimento Ajustado / Regular
            </button>
          </div>

          <div className="bg-[#161616] border border-[#262626] p-3 rounded flex items-center justify-between">
            <span className="text-xs text-[#777777]">Tamanho Recomendado para você:</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#D6B35A] px-3 py-1 bg-[#080808] border border-[#D6B35A] rounded">
                {recommended}
              </span>
              <span className="text-[11px] text-[#777777] flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#D6B35A]" /> Caimento Perfeito
              </span>
            </div>
          </div>
        </div>

        {/* Measurement Table */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#EFECE6] mb-3">Tabela de Medidas (em centímetros)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#080808] text-[#777777] uppercase tracking-wider">
                <th className="py-2.5 px-3">Tamanho</th>
                <th className="py-2.5 px-3">Tórax (A)</th>
                <th className="py-2.5 px-3">Comprimento (B)</th>
                <th className="py-2.5 px-3">Manga (C)</th>
                <th className="py-2.5 px-3">Ombro a Ombro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] text-[#777777]">
              <tr className={recommended === 'P' ? 'bg-[#D6B35A]/10 text-[#EFECE6] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#EFECE6]">P</td>
                <td className="py-2.5 px-3">56 cm</td>
                <td className="py-2.5 px-3">72 cm</td>
                <td className="py-2.5 px-3">22 cm</td>
                <td className="py-2.5 px-3">52 cm</td>
              </tr>
              <tr className={recommended === 'M' ? 'bg-[#D6B35A]/10 text-[#EFECE6] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#EFECE6]">M</td>
                <td className="py-2.5 px-3">59 cm</td>
                <td className="py-2.5 px-3">75 cm</td>
                <td className="py-2.5 px-3">24 cm</td>
                <td className="py-2.5 px-3">55 cm</td>
              </tr>
              <tr className={recommended === 'G' ? 'bg-[#D6B35A]/10 text-[#EFECE6] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#EFECE6]">G</td>
                <td className="py-2.5 px-3">62 cm</td>
                <td className="py-2.5 px-3">78 cm</td>
                <td className="py-2.5 px-3">26 cm</td>
                <td className="py-2.5 px-3">58 cm</td>
              </tr>
              <tr className={recommended === 'GG' ? 'bg-[#D6B35A]/10 text-[#EFECE6] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#EFECE6]">GG</td>
                <td className="py-2.5 px-3">65 cm</td>
                <td className="py-2.5 px-3">81 cm</td>
                <td className="py-2.5 px-3">28 cm</td>
                <td className="py-2.5 px-3">61 cm</td>
              </tr>
              <tr className={recommended === 'XG' ? 'bg-[#D6B35A]/10 text-[#EFECE6] font-bold' : ''}>
                <td className="py-2.5 px-3 font-bold text-[#EFECE6]">XG</td>
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
