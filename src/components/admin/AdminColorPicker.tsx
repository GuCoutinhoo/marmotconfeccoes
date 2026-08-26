import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Palette, Pipette, X } from 'lucide-react';

// Curated solid palette organized in clean rows (7 colors per row, similar to Figma/Canva standard)
export const STANDARD_SOLID_COLORS = [
  // Linha 1: Neutros & Tons Escuros a Claros
  { hex: '#000000', name: 'Preto Puro' },
  { hex: '#1C1917', name: 'Off-Black / Ônix' },
  { hex: '#44403C', name: 'Grafite' },
  { hex: '#78716C', name: 'Cinza Médio' },
  { hex: '#A8A29E', name: 'Cinza Claro' },
  { hex: '#E7E5E4', name: 'Gelo / Off-White' },
  { hex: '#FFFFFF', name: 'Branco' },

  // Linha 2: Vermelhos, Rosas e Roxos
  { hex: '#EF4444', name: 'Vermelho Vibrante' },
  { hex: '#F87171', name: 'Coral / Vermelho Claro' },
  { hex: '#F43F5E', name: 'Rosa Carmim' },
  { hex: '#EC4899', name: 'Rosa Pink' },
  { hex: '#D946EF', name: 'Fúcsia' },
  { hex: '#A855F7', name: 'Roxo / Púrpura' },
  { hex: '#6366F1', name: 'Índigo / Violeta' },

  // Linha 3: Cianos, Azuis e Marinho
  { hex: '#06B6D4', name: 'Ciano' },
  { hex: '#0EA5E9', name: 'Azul Celeste' },
  { hex: '#38BDF8', name: 'Azul Claro' },
  { hex: '#3B82F6', name: 'Azul Royal' },
  { hex: '#2563EB', name: 'Azul Cobalto' },
  { hex: '#1D4ED8', name: 'Azul Escuro' },
  { hex: '#0F172A', name: 'Azul Marinho / Noite' },

  // Linha 4: Verdes, Limas e Amarelos
  { hex: '#10B981', name: 'Verde Esmeralda' },
  { hex: '#22C55E', name: 'Verde Bandeira' },
  { hex: '#84CC16', name: 'Verde Lima' },
  { hex: '#FACC15', name: 'Amarelo Ouro' },
  { hex: '#F59E0B', name: 'Âmbar / Mostarda' },
  { hex: '#FB923C', name: 'Laranja Claro' },
  { hex: '#EA580C', name: 'Laranja Terracota' },

  // Linha 5: Tons Terrosos, Militares & Streetwear Marmot
  { hex: '#59523F', name: 'Verde Militar' },
  { hex: '#3F4A3C', name: 'Verde Musgo' },
  { hex: '#71717A', name: 'Cinza Mescla' },
  { hex: '#D4B996', name: 'Bege Areia / Khaki' },
  { hex: '#F5EBE6', name: 'Raw Bone / Cru' },
  { hex: '#78350F', name: 'Marrom Café' },
  { hex: '#451A03', name: 'Marrom Escuro' },
];

const DEFAULT_RECENT_COLORS = [
  '#000000',
  '#1C1917',
  '#59523F',
  '#71717A',
  '#D4B996',
  '#F5EBE6',
  '#FFFFFF',
  '#3B82F6',
  '#EF4444',
  '#22C55E',
];

const LOCAL_STORAGE_KEY = 'marmot_recent_colors_palette';

export function getStoredRecentColors(): string[] {
  if (typeof window === 'undefined') return DEFAULT_RECENT_COLORS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 14);
      }
    }
  } catch {}
  return DEFAULT_RECENT_COLORS;
}

export function saveRecentColor(hex: string): string[] {
  if (!hex || typeof window === 'undefined') return DEFAULT_RECENT_COLORS;
  try {
    const cleanHex = hex.trim().toUpperCase();
    if (!cleanHex.startsWith('#') || cleanHex.length < 4) return getStoredRecentColors();

    const current = getStoredRecentColors();
    const filtered = current.filter((c) => c.toUpperCase() !== cleanHex);
    const updated = [cleanHex, ...filtered].slice(0, 14);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getStoredRecentColors();
  }
}

interface AdminColorPickerProps {
  value: string;
  onChange: (newHex: string, suggestedName?: string) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  showHexText?: boolean;
}

export const AdminColorPicker: React.FC<AdminColorPickerProps> = ({
  value,
  onChange,
  title = 'Selecionar Cor',
  size = 'md',
  showHexText = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [customHexInput, setCustomHexInput] = useState(value || '#000000');
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hiddenColorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecentColors(getStoredRecentColors());
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      setIsEyeDropperSupported(true);
    }
  }, []);

  useEffect(() => {
    setCustomHexInput(value || '#000000');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectColor = (hex: string, suggestedName?: string) => {
    const clean = hex.toUpperCase();
    onChange(clean, suggestedName);
    const updated = saveRecentColor(clean);
    setRecentColors(updated);
    setCustomHexInput(clean);
  };

  const handleApplyCustomHex = () => {
    let clean = customHexInput.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean) || /^#[0-9A-Fa-f]{3}$/.test(clean)) {
      handleSelectColor(clean);
    }
  };

  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          handleSelectColor(result.sRGBHex);
        }
      } catch {}
    } else if (hiddenColorInputRef.current) {
      hiddenColorInputRef.current.click();
    }
  };

  const currentHexUpper = (value || '#000000').toUpperCase();

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Botão Gatilho / Swatch */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#B45309]/40 transition-all focus:outline-none"
        title={title}
      >
        <span
          className={`${sizeClasses[size]} rounded-full border border-black/20 shadow-xs block shrink-0 relative`}
          style={{ backgroundColor: value || '#000000' }}
        >
          {/* Se a cor for muito clara ou branca, adiciona uma sutil borda interna */}
          {(currentHexUpper === '#FFFFFF' || currentHexUpper === '#FFF' || currentHexUpper === '#F5F5F0') && (
            <span className="absolute inset-0 rounded-full border border-neutral-300 pointer-events-none" />
          )}
        </span>
        {showHexText && (
          <span className="text-[11px] font-mono font-bold text-[#171717] uppercase">
            {value || '#000000'}
          </span>
        )}
      </button>

      {/* Popover Dropdown de Cores */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 w-[280px] sm:w-[320px] bg-white rounded-2xl shadow-2xl border border-[#E5E5E1] p-4 text-[#171717] animate-in fade-in zoom-in-95 duration-150">
          {/* Header com botão de Adicionar Cor Personalizada / Marca */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0F0EC]">
            <button
              type="button"
              onClick={() => {
                if (hiddenColorInputRef.current) {
                  hiddenColorInputRef.current.click();
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F9F9F7] hover:bg-[#F0F0EB] text-[#171717] border border-[#E5E5E1] rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#B45309]" />
              <span>Adicionar cor da marca</span>
            </button>

            {isEyeDropperSupported && (
              <button
                type="button"
                onClick={handleEyeDropper}
                className="p-2 bg-[#F9F9F7] hover:bg-[#F0F0EB] text-[#171717] border border-[#E5E5E1] rounded-xl transition-colors shrink-0"
                title="Conta-gotas (Capturar cor da tela)"
              >
                <Pipette className="w-4 h-4 text-[#B45309]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Input nativo invisível para fallback de escolha contínua */}
            <input
              ref={hiddenColorInputRef}
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="sr-only"
            />
          </div>

          {/* Seção 1: Cores Usadas Recentemente */}
          <div className="py-3 border-b border-[#F0F0EC] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#B45309]" /> Cores usadas recentemente
              </span>
              <span className="text-[10px] font-mono text-[#6B6B66]">Salvo</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-0.5">
              {recentColors.map((hex, idx) => {
                const isSelected = hex.toUpperCase() === currentHexUpper;
                return (
                  <button
                    key={`${hex}-${idx}`}
                    type="button"
                    onClick={() => handleSelectColor(hex)}
                    className={`w-7 h-7 rounded-full border border-black/15 transition-transform hover:scale-110 flex items-center justify-center shrink-0 relative shadow-xs ${
                      isSelected ? 'ring-2 ring-[#B45309] ring-offset-2 scale-105' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                    title={`Usar ${hex}`}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          hex.toUpperCase() === '#FFFFFF' || hex.toUpperCase() === '#FFF' || hex.toUpperCase() === '#F5F5F0' || hex.toUpperCase() === '#E7E5E4'
                            ? 'text-black'
                            : 'text-white drop-shadow-xs'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Cores Sólidas Padrão */}
          <div className="pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B45309]" /> Cores sólidas padrão
              </span>
              <span className="text-[10px] text-[#6B6B66]">
                {STANDARD_SOLID_COLORS.length} opções
              </span>
            </div>

            {/* Grade de Cores com 7 colunas */}
            <div className="grid grid-cols-7 gap-2 pt-1">
              {STANDARD_SOLID_COLORS.map((item) => {
                const isSelected = item.hex.toUpperCase() === currentHexUpper;
                return (
                  <button
                    key={item.hex}
                    type="button"
                    onClick={() => handleSelectColor(item.hex, item.name)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-black/15 transition-all hover:scale-115 flex items-center justify-center shrink-0 relative shadow-xs ${
                      isSelected ? 'ring-2 ring-[#B45309] ring-offset-2 scale-110 z-10' : ''
                    }`}
                    style={{ backgroundColor: item.hex }}
                    title={`${item.name} (${item.hex})`}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          item.hex.toUpperCase() === '#FFFFFF' || item.hex.toUpperCase() === '#FFF' || item.hex.toUpperCase() === '#F5F5F0' || item.hex.toUpperCase() === '#E7E5E4'
                            ? 'text-black'
                            : 'text-white drop-shadow-xs'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 3: Input de Código HEX Direto */}
          <div className="mt-3.5 pt-3 border-t border-[#F0F0EC] flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#6B6B66] uppercase">HEX:</span>
            <input
              type="text"
              value={customHexInput}
              onChange={(e) => setCustomHexInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCustomHex();
                }
              }}
              placeholder="#59523F"
              maxLength={7}
              className="flex-1 bg-[#F9F9F7] border border-[#E5E5E1] px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-[#171717] uppercase focus:outline-none focus:border-[#B45309]"
            />
            <button
              type="button"
              onClick={handleApplyCustomHex}
              className="px-2.5 py-1 bg-[#171717] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
