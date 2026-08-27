import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Sliders,
  Crop,
  Sparkles,
  RefreshCw,
  SunMedium,
  Contrast,
  Palette,
  Move,
} from 'lucide-react';

interface ImageAdjustModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  initialAspectRatio?: '1:1' | '4:5' | '16:9' | 'free';
  onSave: (adjustedDataUrl: string) => void;
  onClose: () => void;
}

type AspectRatioOption = '1:1' | '4:5' | '16:9' | 'free';

interface FilterPreset {
  id: string;
  name: string;
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
}

const PRESET_FILTERS: FilterPreset[] = [
  { id: 'original', name: 'Original', brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0 },
  { id: 'street_noir', name: 'Street Noir (P&B)', brightness: 105, contrast: 135, saturate: 0, grayscale: 100, sepia: 0 },
  { id: 'high_contrast', name: 'High Contrast', brightness: 102, contrast: 140, saturate: 115, grayscale: 0, sepia: 0 },
  { id: 'warm_gold', name: 'Marmot Gold', brightness: 104, contrast: 110, saturate: 120, grayscale: 0, sepia: 18 },
  { id: 'muted_raw', name: 'Muted Raw', brightness: 98, contrast: 115, saturate: 75, grayscale: 0, sepia: 5 },
];

export const ImageAdjustModal: React.FC<ImageAdjustModalProps> = ({
  isOpen,
  imageSrc,
  title = 'Ajustar e Enquadrar Imagem',
  initialAspectRatio = '1:1',
  onSave,
  onClose,
}) => {
  // Canvas & Image References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Tabs for Controls
  const [activeControlTab, setActiveControlTab] = useState<'crop' | 'adjust' | 'filters'>('crop');

  // Transformations
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);

  // Dragging / Panning State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number }>({
    x: 0,
    y: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Visual Adjustments
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<string>('original');

  // Load Image
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setImageLoaded(false);
    setLoadError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);
      // Reset position when new image loads
      setOffsetX(0);
      setOffsetY(0);
      setZoom(1);
      setRotation(0);
      setFlipH(false);
    };
    img.onerror = () => {
      // Retry without anonymous if CORS header not present
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        setImageElement(fallbackImg);
        setImageLoaded(true);
      };
      fallbackImg.onerror = () => {
        setLoadError(true);
      };
      fallbackImg.src = imageSrc;
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Render to Canvas
  const renderCanvas = useCallback(
    (targetCanvas?: HTMLCanvasElement, exportMode = false) => {
      const canvas = targetCanvas || canvasRef.current;
      if (!canvas || !imageElement || !imageLoaded) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Define Target Resolution based on image native resolution
      const maxNatural = Math.max(imageElement.naturalWidth || 1600, imageElement.naturalHeight || 1600, 1600);
      const baseDim = exportMode ? Math.min(maxNatural, 3200) : 800;

      let targetWidth = baseDim;
      let targetHeight = baseDim;

      if (aspectRatio === '1:1') {
        targetWidth = baseDim;
        targetHeight = baseDim;
      } else if (aspectRatio === '4:5') {
        targetWidth = baseDim;
        targetHeight = Math.round(baseDim * 1.25);
      } else if (aspectRatio === '16:9') {
        targetWidth = baseDim;
        targetHeight = Math.round((baseDim * 9) / 16);
      } else {
        // Free / Original ratio
        const origAspect = (imageElement.naturalWidth || 800) / (imageElement.naturalHeight || 800);
        targetWidth = baseDim;
        targetHeight = Math.round(baseDim / origAspect);
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Clear Canvas with sleek dark background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Apply CSS Filters to Canvas
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%)`;

      const scaleMultiplier = exportMode ? (baseDim / 800) : 1;

      // Move to Center of Canvas
      ctx.translate(canvas.width / 2 + offsetX * scaleMultiplier, canvas.height / 2 + offsetY * scaleMultiplier);

      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);

      // Flip Horizontal
      ctx.scale(flipH ? -1 : 1, 1);

      // Calculate Draw Dimensions maintaining aspect ratio
      const imgWidth = imageElement.naturalWidth;
      const imgHeight = imageElement.naturalHeight;

      // Fit image into target canvas with "cover" behavior by default, then apply zoom
      const scaleX = canvas.width / imgWidth;
      const scaleY = canvas.height / imgHeight;
      const baseScale = Math.max(scaleX, scaleY);

      const finalWidth = imgWidth * baseScale * zoom;
      const finalHeight = imgHeight * baseScale * zoom;

      // Draw centered
      ctx.drawImage(imageElement, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);

      ctx.restore();
    },
    [
      imageElement,
      imageLoaded,
      aspectRatio,
      zoom,
      rotation,
      flipH,
      offsetX,
      offsetY,
      brightness,
      contrast,
      saturation,
      grayscale,
      sepia,
    ]
  );

  // Re-render when any adjustment state changes
  useEffect(() => {
    if (imageLoaded) {
      renderCanvas();
    }
  }, [imageLoaded, renderCanvas]);

  // Dragging Handlers for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setOffsetX(dragStartRef.current.startOffsetX + deltaX);
    setOffsetY(dragStartRef.current.startOffsetY + deltaY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startOffsetX: offsetX,
        startOffsetY: offsetY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartRef.current.y;
    setOffsetX(dragStartRef.current.startOffsetX + deltaX);
    setOffsetY(dragStartRef.current.startOffsetY + deltaY);
  };

  // Reset Adjustments
  const handleResetAll = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffsetX(0);
    setOffsetY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setSepia(0);
    setActivePreset('original');
  };

  // Apply Preset Filter
  const handleSelectPreset = (preset: FilterPreset) => {
    setActivePreset(preset.id);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturate);
    setGrayscale(preset.grayscale);
    setSepia(preset.sepia);
  };

  // Export and Save Adjusted Image
  const handleConfirmSave = () => {
    const exportCanvas = document.createElement('canvas');
    renderCanvas(exportCanvas, true);
    try {
      const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.98);
      onSave(dataUrl);
    } catch (e) {
      // Fallback if canvas is tainted by external URL
      if (imageSrc) {
        onSave(imageSrc);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E1] rounded-2xl max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden text-[#171717]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E1] flex items-center justify-between bg-[#F9F9F7]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F0C84B]/20 border border-[#F0C84B]/40 flex items-center justify-center text-[#B45309]">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase text-[#171717] tracking-tight">{title}</h3>
              <p className="text-[11px] text-[#6B6B66]">Enquadre, recorte e trate a imagem antes de salvar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B6B66] hover:text-[#171717] hover:bg-[#E5E5E1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* CANVAS PREVIEW AREA (LEFT / TOP) */}
          <div
            ref={containerRef}
            className="lg:col-span-7 bg-[#1A1A1A] p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[320px] sm:min-h-[420px] select-none border-b lg:border-b-0 lg:border-r border-[#E5E5E1]"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Guide Grid overlay info */}
            <div className="absolute top-3 left-3 z-10 font-mono text-[9px] uppercase tracking-wider text-zinc-400 bg-black/70 px-2 py-1 rounded backdrop-blur border border-white/10 flex items-center gap-1.5">
              <Move className="w-3 h-3 text-[#F0C84B]" />
              <span>Arraste para reposicionar</span>
            </div>

            {/* Quick zoom badge */}
            <div className="absolute top-3 right-3 z-10 font-mono text-[9px] uppercase text-[#F0C84B] bg-black/70 px-2 py-1 rounded border border-[#F0C84B]/40">
              Zoom: {Math.round(zoom * 100)}%
            </div>

            {/* Canvas Container with Frame */}
            <div
              className={`relative overflow-hidden rounded-xl border-2 border-zinc-700 shadow-2xl bg-black ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                maxWidth: '100%',
                maxHeight: '360px',
                aspectRatio:
                  aspectRatio === '1:1'
                    ? '1/1'
                    : aspectRatio === '4:5'
                    ? '4/5'
                    : aspectRatio === '16:9'
                    ? '16/9'
                    : undefined,
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Thirds Guide Grid */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10 opacity-30 z-10">
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-white/10" />
                <div className="border-r border-white/10" />
                <div />
              </div>

              {/* Dynamic Canvas */}
              <canvas
                ref={canvasRef}
                className="block max-w-full max-h-[360px] w-auto h-auto object-contain mx-auto"
              />

              {!imageLoaded && !loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs text-[#888888] gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#F0C84B]" />
                  <span>Carregando imagem...</span>
                </div>
              )}

              {loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                  <p className="text-xs text-red-400 font-bold mb-1">Não foi possível carregar a imagem</p>
                  <p className="text-[10px] text-zinc-400">Verifique a URL ou faça upload de um arquivo direto.</p>
                </div>
              )}
            </div>

            {/* Quick Canvas Toolbar below */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-28 sm:w-36 accent-[#F0C84B] cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(1))))}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-zinc-700 mx-1" />

              <button
                type="button"
                onClick={() => setRotation((r) => (r - 90) % 360)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
                title="Girar 90° à esquerda"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
                title="Girar 90° à direita"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setFlipH((f) => !f)}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  flipH
                    ? 'bg-amber-500/20 border-[#F0C84B] text-[#F0C84B]'
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white'
                }`}
                title="Espelhar Horizontalmente"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CONTROLS & SETTINGS PANEL (RIGHT) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-white space-y-4">
            <div>
              {/* Tab Navigation */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F9F9F7] rounded-xl border border-[#E5E5E1] mb-4">
                <button
                  type="button"
                  onClick={() => setActiveControlTab('crop')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeControlTab === 'crop'
                      ? 'bg-white text-[#171717] shadow-xs border border-[#E5E5E1]'
                      : 'text-[#6B6B66] hover:text-[#171717]'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Corte</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveControlTab('adjust')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeControlTab === 'adjust'
                      ? 'bg-white text-[#171717] shadow-xs border border-[#E5E5E1]'
                      : 'text-[#6B6B66] hover:text-[#171717]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Ajustes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveControlTab('filters')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeControlTab === 'filters'
                      ? 'bg-white text-[#171717] shadow-xs border border-[#E5E5E1]'
                      : 'text-[#6B6B66] hover:text-[#171717]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Filtros</span>
                </button>
              </div>

              {/* TAB 1: CROP & ASPECT RATIO */}
              {activeControlTab === 'crop' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-[#6B6B66] uppercase block mb-2 font-mono">
                      Proporção do Enquadramento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAspectRatio('1:1')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          aspectRatio === '1:1'
                            ? 'bg-amber-50/60 border-amber-300 text-amber-950 shadow-xs'
                            : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase">1:1 Quadrado</span>
                        <span className="text-[10px] text-[#6B6B66]">Ideal para Categorias</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAspectRatio('4:5')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          aspectRatio === '4:5'
                            ? 'bg-amber-50/60 border-amber-300 text-amber-950 shadow-xs'
                            : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase">4:5 Retrato Moda</span>
                        <span className="text-[10px] text-[#6B6B66]">Streetwear Lookbook</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAspectRatio('16:9')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          aspectRatio === '16:9'
                            ? 'bg-amber-50/60 border-amber-300 text-amber-950 shadow-xs'
                            : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase">16:9 Panorâmico</span>
                        <span className="text-[10px] text-[#6B6B66]">Banners & Hero</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAspectRatio('free')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          aspectRatio === 'free'
                            ? 'bg-amber-50/60 border-amber-300 text-amber-950 shadow-xs'
                            : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase">Original Livre</span>
                        <span className="text-[10px] text-[#6B6B66]">Manter formato</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl text-[11px] text-[#6B6B66] space-y-1">
                    <p className="font-bold text-[#171717]">Dica de Enquadramento:</p>
                    <p>Clique e arraste a imagem na caixa de pré-visualização para centralizar o produto ou modelo.</p>
                  </div>
                </div>
              )}

              {/* TAB 2: MANUAL LIGHT & COLOR ADJUSTMENTS */}
              {activeControlTab === 'adjust' && (
                <div className="space-y-4">
                  {/* Brightness */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#171717] font-bold">
                        <SunMedium className="w-3.5 h-3.5 text-[#B45309]" /> Brilho
                      </span>
                      <span className="font-mono text-[#B45309] font-bold">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-[#F0C84B] cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#171717] font-bold">
                        <Contrast className="w-3.5 h-3.5 text-[#B45309]" /> Contraste
                      </span>
                      <span className="font-mono text-[#B45309] font-bold">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-[#F0C84B] cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#171717] font-bold">
                        <Palette className="w-3.5 h-3.5 text-[#B45309]" /> Saturação de Cor
                      </span>
                      <span className="font-mono text-[#B45309] font-bold">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full accent-[#F0C84B] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PRESET FILTERS */}
              {activeControlTab === 'filters' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[#6B6B66] uppercase block font-mono">
                    Presets Visuais da Marca
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESET_FILTERS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          activePreset === preset.id
                            ? 'bg-amber-50/60 border-amber-300 text-amber-950 font-bold shadow-xs'
                            : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                          {preset.name}
                        </span>
                        {activePreset === preset.id && <Check className="w-4 h-4 text-[#B45309]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-3 border-t border-[#E5E5E1] flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetAll}
                className="p-3 rounded-xl bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                title="Restaurar valores padrão"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#B45309]" />
                <span className="hidden sm:inline">Resetar</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F9F9F7] hover:bg-white border border-[#E5E5E1] text-[#6B6B66] hover:text-[#171717] text-xs font-bold uppercase transition-colors shadow-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F0C84B] hover:bg-amber-400 text-black text-xs font-black uppercase shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Aplicar Ajustes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
