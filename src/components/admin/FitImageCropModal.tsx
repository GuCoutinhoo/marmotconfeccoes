import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  RefreshCcw,
  Crop,
  Grid,
  Check,
  AlertCircle,
  Loader2,
  Sliders,
  Move,
  Eye,
  Shirt,
} from 'lucide-react';

export type AspectRatioOption = '3:4' | '1:1' | '4:5' | 'free';

export interface FitImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  currentImageUrl: string;
  originalImageUrl?: string;
  targetType: 'look' | 'piece';
  itemCategory?: string;
  itemPrice?: number;
  colorName?: string;
  onConfirmCrop: (blob: Blob, filename: string) => Promise<void>;
  isSaving: boolean;
}

export const FitImageCropModal: React.FC<FitImageCropModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  currentImageUrl,
  originalImageUrl,
  targetType,
  itemCategory,
  itemPrice,
  colorName,
  onConfirmCrop,
  isSaving,
}) => {
  // Image source: can be from user upload (blob: URL) or existing URL
  const [imageSrc, setImageSrc] = useState<string>(currentImageUrl);
  const [filename, setFilename] = useState<string>('cropped-image.webp');
  const [isNewUpload, setIsNewUpload] = useState<boolean>(false);

  // Aspect ratio: default to 3:4 for editorial looks, 1:1 for product pieces
  const defaultRatio: AspectRatioOption = targetType === 'look' ? '3:4' : '1:1';
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(defaultRatio);

  // Crop & Transform State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // DOM Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Natural image dimensions
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 1000,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when opening modal with a new target
  useEffect(() => {
    if (isOpen) {
      setImageSrc(currentImageUrl);
      setIsNewUpload(false);
      setFilename(targetType === 'look' ? 'look-model.webp' : 'piece-color.webp');
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setFlipH(false);
      setAspectRatio(targetType === 'look' ? '3:4' : '1:1');
      setErrorMessage(null);
    }
  }, [isOpen, currentImageUrl, targetType]);

  // Handle file selection from local device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Formato inválido. Selecione uma imagem PNG, JPG, JPEG ou WEBP.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('A imagem selecionada deve ter no máximo 12MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setFilename(file.name.replace(/\.[^/.]+$/, '') + '.webp');
    setIsNewUpload(true);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setErrorMessage(null);
  };

  // Image load handler to read natural dimensions
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 1000,
    });
  };

  // Calculate crop box pixel dimensions based on aspect ratio
  const getCropBoxDimensions = () => {
    // Max container dimensions inside the viewport editor
    const maxW = 340;
    const maxH = 380;

    switch (aspectRatio) {
      case '3:4':
        // 3:4 portrait
        return { width: 270, height: 360, ratioValue: 3 / 4 };
      case '4:5':
        // 4:5 portrait
        return { width: 280, height: 350, ratioValue: 4 / 5 };
      case '1:1':
        // 1:1 square
        return { width: 330, height: 330, ratioValue: 1 };
      case 'free':
      default: {
        const imgRatio = naturalSize.width / (naturalSize.height || 1);
        if (imgRatio > 1) {
          const w = Math.min(maxW, 330);
          return { width: w, height: Math.round(w / imgRatio), ratioValue: imgRatio };
        } else {
          const h = Math.min(maxH, 360);
          return { width: Math.round(h * imgRatio), height: h, ratioValue: imgRatio };
        }
      }
    }
  };

  const cropBox = getCropBoxDimensions();

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSaving) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for mobile / tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSaving || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((prev) => Math.min(3.5, Math.max(1.0, parseFloat((prev + delta).toFixed(2)))));
  };

  // Rotation
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev + 270) % 360);
  };

  // Flip horizontal
  const handleFlipH = () => {
    setFlipH((prev) => !prev);
  };

  // Reset all adjustments
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
  };

  // Base rendered image dimensions to fill/cover the crop box at zoom 1.0
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const effectiveNatW = isRotated90or270 ? naturalSize.height : naturalSize.width;
  const effectiveNatH = isRotated90or270 ? naturalSize.width : naturalSize.height;

  // Scale factor so image covers the crop box nicely
  const scaleCover = Math.max(cropBox.width / (effectiveNatW || 1), cropBox.height / (effectiveNatH || 1));
  const baseRenderW = Math.round(naturalSize.width * scaleCover);
  const baseRenderH = Math.round(naturalSize.height * scaleCover);

  // Generate cropped high-res blob and trigger onConfirmCrop
  const handleApplyAndSave = async () => {
    setErrorMessage(null);

    try {
      // 1. Create off-screen canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível inicializar o renderizador gráfico (canvas).');

      // 2. Determine export high-res resolution based on actual native source dimensions (up to 4096px)
      const isRotated90or270 = rotation === 90 || rotation === 270;
      const effectiveNatW = isRotated90or270 ? naturalSize.height : naturalSize.width;
      const effectiveNatH = isRotated90or270 ? naturalSize.width : naturalSize.height;

      // Calculate export width preserving the source image resolution
      const rawCalculatedW = Math.max(effectiveNatW, Math.round(effectiveNatH * cropBox.ratioValue));
      const exportW = Math.min(Math.max(rawCalculatedW, 1800), 4096);
      const exportH = Math.round(exportW / cropBox.ratioValue);
      canvas.width = exportW;
      canvas.height = exportH;

      // 3. Load image element with crossOrigin anonymous
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          // If crossOrigin anonymous failed on external domain, try fallback without it
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            img.src = fallbackImg.src;
            resolve();
          };
          fallbackImg.onerror = () => reject(new Error('Falha ao carregar a imagem para o recorte.'));
          fallbackImg.src = imageSrc;
        };
        img.src = imageSrc;
      });

      // 4. Background fill: keep transparent for PNG pieces or white for looks
      const isPngTarget = filename.toLowerCase().endsWith('.png') || (targetType === 'piece' && imageSrc.includes('.png'));
      if (isPngTarget) {
        ctx.clearRect(0, 0, exportW, exportH);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, exportW, exportH);
      }

      // 5. Scale multiplier from UI crop box to high-res export canvas
      const scaleMultiplier = exportW / cropBox.width;

      ctx.save();
      // Translate to export center + user pan offset
      ctx.translate(
        exportW / 2 + pan.x * scaleMultiplier,
        exportH / 2 + pan.y * scaleMultiplier
      );

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply flip
      ctx.scale(flipH ? -1 : 1, 1);

      // Draw the image centered
      const drawW = baseRenderW * zoom * scaleMultiplier;
      const drawH = baseRenderH * zoom * scaleMultiplier;

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // 6. Convert canvas to Blob preserving pristine quality
      const outputMime = isPngTarget ? 'image/png' : 'image/webp';
      const outputQuality = 0.98;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else {
              canvas.toBlob((jb) => resolve(jb), 'image/jpeg', 0.98);
            }
          },
          outputMime,
          outputQuality
        );
      });

      if (!blob) throw new Error('Falha ao gerar o arquivo recortado.');

      // 7. Invoke parent save handler
      await onConfirmCrop(blob, filename);
    } catch (err: any) {
      console.error('[FitImageCropModal] Erro ao aplicar corte:', err);
      setErrorMessage(
        err?.message || 'Ocorreu um erro ao processar o recorte da imagem. Tente novamente.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ============================================================ */}
        {/* MODAL HEADER                                                 */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                  ESTÚDIO DE CORTE & ZOOM
                </span>
                <span className="text-zinc-400 text-xs">•</span>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  {targetType === 'look' ? 'Look Editorial' : `Peça // ${colorName || 'Cor'}`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase text-zinc-900 tracking-tight mt-0.5">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 text-red-900 px-5 py-2.5 text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN BODY: SPLIT VIEW (CROP STUDIO ON LEFT, CONTROLS/PREVIEW)*/}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ---------------------------------------------------------- */}
          {/* COLUNA ESQUERDA: CROPPER INTERATIVO COM MÁSCARA E GRID    */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-900/95 rounded-2xl p-4 relative select-none overflow-hidden min-h-[380px] sm:min-h-[440px]">
            {/* Dica rápida sobre interação */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                <Move className="w-3 h-3 text-amber-400" /> Arraste para reposicionar
              </span>
              <span className="hidden sm:flex items-center gap-1.5 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                <ZoomIn className="w-3 h-3 text-amber-400" /> Role o mouse para zoom
              </span>
            </div>

            {/* Container do Crop Frame */}
            <div
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              style={{
                width: `${cropBox.width}px`,
                height: `${cropBox.height}px`,
              }}
              className={`relative overflow-hidden rounded-lg bg-zinc-800 shadow-2xl border-2 border-amber-400/90 transition-all duration-150 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Imagem com Transformações GPU (Pan, Zoom, Rotação, Flip) */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                }}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Recorte"
                  onLoad={handleImageLoaded}
                  draggable={false}
                  className="max-w-none transition-transform duration-75 ease-out select-none"
                  style={{
                    width: `${baseRenderW}px`,
                    height: `${baseRenderH}px`,
                    transform: `rotate(${rotation}deg) scale(${flipH ? -zoom : zoom}, ${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  crossOrigin="anonymous"
                />
              </div>

              {/* Overlay: Grade da Regra dos Terços (Rule of Thirds) */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-white/20">
                  <div className="border-r border-b border-white/25"></div>
                  <div className="border-r border-b border-white/25"></div>
                  <div className="border-b border-white/25"></div>
                  <div className="border-r border-b border-white/25"></div>
                  <div className="border-r border-b border-white/25"></div>
                  <div className="border-b border-white/25"></div>
                  <div className="border-r border-white/25"></div>
                  <div className="border-r border-white/25"></div>
                  <div></div>
                </div>
              )}

              {/* Badge da proporção ativa no canto inferior */}
              <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
                <span className="bg-black/70 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs border border-white/10 uppercase">
                  {aspectRatio} • {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>

            {/* Quick overlay controls on bottom of cropper */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowGrid((prev) => !prev)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  showGrid
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 font-bold'
                    : 'bg-black/60 text-zinc-300 border-white/10 hover:bg-black/80'
                }`}
                title="Ativar/Desativar grade dos terços"
              >
                <Grid className="w-3.5 h-3.5" /> Grade
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 bg-black/60 text-zinc-300 border border-white/10 hover:bg-black/80 transition-colors cursor-pointer"
                title="Redefinir enquadramento"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Redefinir
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* COLUNA DIREITA: CONTROLES DE ZOOM, ENQUADRAMENTO E PREVIEW */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            {/* Bloco 1: Seleção de Origem da Imagem (Arquivo ou Atual) */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Origem da Imagem</span>
                {isNewUpload && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                    Novo Arquivo Selecionado
                  </span>
                )}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="crop-file-input"
              />

              <div className="grid grid-cols-2 gap-2">
                <label
                  htmlFor="crop-file-input"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Substituir Arquivo</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setImageSrc(currentImageUrl);
                    setIsNewUpload(false);
                    handleReset();
                  }}
                  disabled={imageSrc === currentImageUrl}
                  className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 font-bold text-xs uppercase py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Usar Atual</span>
                </button>
              </div>
            </div>

            {/* Bloco 2: Proporção de Corte (Aspect Ratio) */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                Proporção do Corte
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(targetType === 'look'
                  ? (['3:4', '4:5', '1:1', 'free'] as AspectRatioOption[])
                  : (['1:1', '3:4', '4:5', 'free'] as AspectRatioOption[])
                ).map((ratio) => {
                  const isSelected = aspectRatio === ratio;
                  const labels: Record<AspectRatioOption, string> = {
                    '3:4': '3:4 (Look)',
                    '1:1': '1:1 (Peça)',
                    '4:5': '4:5 (Editorial)',
                    free: 'Livre',
                  };
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {labels[ratio]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 3: Controle Deslizante de Zoom */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-zinc-800 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-amber-600" /> Zoom da Imagem
                </span>
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1.0, parseFloat((prev - 0.1).toFixed(2))))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-700 cursor-pointer"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="1"
                  max="3.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-zinc-900 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3.5, parseFloat((prev + 0.1).toFixed(2))))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-700 cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bloco 4: Rotação e Espelhamento */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                Ajustes de Orientação
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleRotateCcw}
                  className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Girar 90° para a esquerda"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> -90°
                </button>

                <button
                  type="button"
                  onClick={handleRotateCw}
                  className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Girar 90° para a direita"
                >
                  <RotateCw className="w-3.5 h-3.5" /> +90°
                </button>

                <button
                  type="button"
                  onClick={handleFlipH}
                  className={`border text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    flipH
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                  title="Espelhar horizontalmente"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" /> Espelhar
                </button>
              </div>
            </div>

            {/* Bloco 5: Mini Preview Realista de Como Ficará no Marmot Fit System */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Prévia no Card do Site
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Tempo Real</span>
              </div>

              {/* Simulação do card real do Marmot Fit System */}
              <div className="bg-white border border-zinc-200 rounded-lg p-2.5 flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-md bg-[#ECEAE6] overflow-hidden shrink-0 relative flex items-center justify-center border border-zinc-100"
                  style={{ aspectRatio: '1/1' }}
                >
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain object-center"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) translate(${
                        pan.x * 0.15
                      }px, ${pan.y * 0.15}px)`,
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">
                    {itemCategory || (targetType === 'look' ? 'LOOK COMPLETO' : 'PRODUTO')}
                  </div>
                  <div className="text-xs font-black uppercase text-zinc-900 truncate mt-0.5">
                    {title}
                  </div>
                  {colorName && (
                    <div className="text-[10px] font-mono text-amber-700 font-bold mt-0.5">
                      {colorName}
                    </div>
                  )}
                  {itemPrice !== undefined && (
                    <div className="text-[11px] font-mono font-bold text-zinc-700 mt-0.5">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(itemPrice)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MODAL FOOTER / ACTIONS                                       */}
        {/* ============================================================ */}
        <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-500 font-mono hidden sm:block">
            Resolução de saída em alta definição (1200px • WebP)
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApplyAndSave}
              disabled={isSaving}
              className="bg-zinc-900 hover:bg-black text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Processando & Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Aplicar Corte & Salvar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
