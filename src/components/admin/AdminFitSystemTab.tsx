import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  DEFAULT_FIT_SYSTEM_CONFIG,
  type FitKey,
  type FitSystemConfig,
  type FitCategoryConfig,
  type FitLookConfig,
  type FitPieceConfig,
} from '../../types/fitSystem';
import { uploadProductImageToStorage } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeaders, getStoredAuthToken } from '../../lib/authHeaders';
import {
  Layers,
  Sparkles,
  Upload,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Eye,
  Info,
  Check,
  ChevronRight,
  Shirt,
  Image as ImageIcon,
  Crop,
  ZoomIn,
} from 'lucide-react';
import { FitImageCropModal } from './FitImageCropModal';

interface ActiveEditTarget {
  fitKey: FitKey;
  lookNumber: 1 | 2;
  pieceId?: string; // If undefined, editing Look mainImage
  colorSlot?: 'color1' | 'color2'; // If editing a piece
  itemTitle: string;
  currentImage: string;
  originalImage: string;
  targetType: 'look' | 'piece';
  itemCategory?: string;
  itemPrice?: number;
  colorName?: string;
}

export const AdminFitSystemTab: React.FC = () => {
  const { showToast } = useToast();
  const { token: authContextToken } = useAuth();
  const activeAuthToken = authContextToken || getStoredAuthToken();

  const [config, setConfig] = useState<FitSystemConfig>(DEFAULT_FIT_SYSTEM_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab navigation inside Fit System: BOXY, OVERSIZED, BAGGY, UTILITY
  const [selectedFitKey, setSelectedFitKey] = useState<FitKey>('BOXY');
  // Selected Look within the fit category: 1 or 2
  const [selectedLookNumber, setSelectedLookNumber] = useState<1 | 2>(1);

  // Modal / Active Target State
  const [editTarget, setEditTarget] = useState<ActiveEditTarget | null>(null);

  // Fetch configuration from API
  const fetchFitSystemConfig = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/fit-system', {
        headers: getAuthHeaders(activeAuthToken, {
          'Cache-Control': 'no-cache',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setConfig(data);
        }
      } else {
        // Fallback to public endpoint if admin route had any issue
        const pubRes = await fetch('/api/fit-system', { cache: 'no-store' });
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          if (pubData) setConfig(pubData);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar Marmot Fit System:', err);
      setErrorMessage('Não foi possível carregar as configurações do Marmot Fit System.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFitSystemConfig();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const currentCategory: FitCategoryConfig = config[selectedFitKey] || DEFAULT_FIT_SYSTEM_CONFIG[selectedFitKey];
  const currentLook: FitLookConfig =
    currentCategory.looks.find((l) => l.lookNumber === selectedLookNumber) || currentCategory.looks[0];

  // Open Edit Modal for a target
  const handleOpenEdit = (target: ActiveEditTarget) => {
    setEditTarget(target);
    setErrorMessage(null);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setEditTarget(null);
  };

  // Save Image Change from Cropper (Crop & Zoom Studio)
  const handleConfirmCropAndSave = async (croppedBlob: Blob, filename: string) => {
    if (!editTarget) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Upload cropped file to Supabase Storage via /api/upload
      const prefix = editTarget.pieceId
        ? `fit-piece-${editTarget.pieceId}-${editTarget.colorSlot}`
        : `fit-${editTarget.fitKey.toLowerCase()}-look-${editTarget.lookNumber}`;

      const uploadedUrl = await uploadProductImageToStorage(
        croppedBlob,
        prefix,
        filename,
        activeAuthToken || undefined
      );

      if (!uploadedUrl) {
        throw new Error('Falha no upload do arquivo recortado.');
      }

      // Append version timestamp query to ensure CDN cache busting
      const cacheBustedUrl = uploadedUrl.includes('?')
        ? `${uploadedUrl}&v=${Date.now()}`
        : `${uploadedUrl}?v=${Date.now()}`;

      // 2. Clone current config and update the exact field
      const updatedConfig: FitSystemConfig = JSON.parse(JSON.stringify(config));
      const targetCategory = updatedConfig[editTarget.fitKey];
      const targetLook = targetCategory.looks.find((l) => l.lookNumber === editTarget.lookNumber);

      if (!targetLook) throw new Error('Look não encontrado.');

      if (!editTarget.pieceId) {
        // Main look image
        targetLook.mainImage = cacheBustedUrl;
      } else {
        // Piece color image
        const targetPiece = targetLook.pieces.find((p) => p.id === editTarget.pieceId);
        if (!targetPiece) throw new Error('Peça não encontrada no look.');

        if (editTarget.colorSlot === 'color1') {
          targetPiece.color1Image = cacheBustedUrl;
        } else if (editTarget.colorSlot === 'color2') {
          targetPiece.color2Image = cacheBustedUrl;
        }
      }

      // 3. Persist to Backend API
      const res = await fetch('/api/admin/fit-system', {
        method: 'PUT',
        headers: getAuthHeaders(activeAuthToken),
        body: JSON.stringify(updatedConfig),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Não foi possível salvar a imagem. Tente novamente.');
      }

      const responseData = await res.json();
      if (responseData.config) {
        setConfig(responseData.config);
      } else {
        setConfig(updatedConfig);
      }

      setSuccessMessage('Imagem cortada e salva com sucesso!');
      showToast('Sucesso', 'Imagem cortada e salva com sucesso!', 'success');
      setEditTarget(null);
    } catch (err: any) {
      console.error('Erro ao salvar alteração de imagem:', err);
      const msg = err?.message || 'Não foi possível salvar a imagem. Tente novamente.';
      setErrorMessage(msg);
      showToast('Erro ao Salvar', msg, 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Restore Original Image
  const handleRestoreOriginal = async (target: {
    fitKey: FitKey;
    lookNumber: 1 | 2;
    pieceId?: string;
    colorSlot?: 'color1' | 'color2';
    targetType: 'main' | 'color1' | 'color2';
  }) => {
    const confirmation = window.confirm(
      'Tem certeza de que deseja restaurar a imagem original padrão deste item?'
    );
    if (!confirmation) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/fit-system/reset', {
        method: 'POST',
        headers: getAuthHeaders(activeAuthToken),
        body: JSON.stringify({
          fitKey: target.fitKey,
          lookNumber: target.lookNumber,
          pieceId: target.pieceId,
          target: target.targetType,
        }),
      });

      if (!res.ok) {
        throw new Error('Não foi possível restaurar a imagem. Tente novamente.');
      }

      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
      } else {
        await fetchFitSystemConfig();
      }

      setSuccessMessage('Imagem original restaurada com sucesso.');
      showToast('Restaurado', 'Imagem original restaurada com sucesso.', 'info');
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível restaurar a imagem. Tente novamente.';
      setErrorMessage(msg);
      showToast('Erro ao Restaurar', msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if an image is currently customized (different from original)
  const isCustomized = (current: string, original: string) => {
    if (!current || !original) return false;
    const cleanCurrent = current.split('?')[0].trim();
    const cleanOriginal = original.split('?')[0].trim();
    return cleanCurrent !== cleanOriginal;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              SEÇÃO EDITORIAL DA HOME
            </span>
            <span className="text-zinc-400 text-xs">•</span>
            <span className="text-xs font-mono text-zinc-500">Marmot Fit System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-zinc-900 tracking-tight mt-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" /> Marmot Fit System
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Gerencie as imagens dos looks (foto do modelo) e das peças individuais (Cor 1 & Cor 2)
            exibidas na seção interativa de caimento na página inicial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFitSystemConfig}
            disabled={isLoading || isSaving}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-bold uppercase px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Toast / Global Alerts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. SELETOR DE CAIMENTOS (BOXY, OVERSIZED, BAGGY, UTILITY) */}
      <div className="space-y-3">
        <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
          Selecione a Categoria de Caimento:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(['BOXY', 'OVERSIZED', 'BAGGY', 'UTILITY'] as FitKey[]).map((fitKey) => {
            const cat = config[fitKey];
            const isSelected = selectedFitKey === fitKey;
            return (
              <button
                key={fitKey}
                onClick={() => {
                  setSelectedFitKey(fitKey);
                  setSelectedLookNumber(1);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isSelected ? 'text-amber-400' : 'text-zinc-400'
                    }`}
                  >
                    {cat?.code || '00'}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="font-black text-sm uppercase tracking-wide mt-1">
                  {fitKey}
                </div>
                <div
                  className={`text-[11px] line-clamp-1 mt-0.5 ${
                    isSelected ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {cat?.shortDescription}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELETOR DE LOOKS DENTRO DA CATEGORIA (LOOK 1 vs LOOK 2) */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono font-bold text-amber-700 uppercase">
              {currentCategory.code} // {currentCategory.name}
            </div>
            <h3 className="text-base font-black uppercase text-zinc-900 tracking-tight">
              Looks Cadastrados
            </h3>
          </div>

          <div className="inline-flex bg-white p-1 rounded-xl border border-zinc-200 shadow-2xs">
            <button
              onClick={() => setSelectedLookNumber(1)}
              className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLookNumber === 1
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <span>Look 1</span>
              <span className="text-[10px] font-normal opacity-70">
                ({currentCategory.looks[0]?.focusPiece || 'Principal'})
              </span>
            </button>
            <button
              onClick={() => setSelectedLookNumber(2)}
              className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedLookNumber === 2
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <span>Look 2</span>
              <span className="text-[10px] font-normal opacity-70">
                ({currentCategory.looks[1]?.focusPiece || 'Variação'})
              </span>
            </button>
          </div>
        </div>

        {/* Detalhes do Look Ativo */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase">
              {currentLook.lookTitle}
            </div>
            <div className="text-sm font-bold text-zinc-900 mt-0.5">
              Peça em Destaque:{' '}
              <span className="text-amber-800 font-semibold">{currentLook.focusPiece}</span>
            </div>
            <p className="text-xs text-zinc-600 mt-1 max-w-3xl leading-relaxed">
              {currentLook.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-mono px-2.5 py-1 rounded-md">
              {currentLook.pieces.length} Peças Vinculadas
            </span>
          </div>
        </div>
      </div>

      {/* 3. EDIÇÃO SEPARADA: IMAGEM PRINCIPAL DO LOOK vs PEÇAS DO LOOK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* BLOCO ESQUERDA: IMAGEM PRINCIPAL DO LOOK (MODELO / OUTFIT)    */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="border-b border-zinc-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="bg-zinc-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                IMAGEM DO LOOK
              </span>
              {isCustomized(currentLook.mainImage, currentLook.mainImageOriginal) ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> Personalizada
                </span>
              ) : (
                <span className="bg-zinc-100 text-zinc-600 text-[10px] font-mono px-2 py-0.5 rounded">
                  Padrão
                </span>
              )}
            </div>
            <h4 className="text-sm font-black uppercase text-zinc-900 tracking-tight mt-2">
              Foto do Modelo (Outfit Completo)
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
              Exibida em destaque na seção Marmot Fit System mostrando o modelo vestindo o look.
            </p>
          </div>

          {/* Preview Container */}
          <div className="relative aspect-[3/4] bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center group">
            <img
              src={currentLook.mainImage}
              alt={currentLook.lookTitle}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback if broken
                (e.target as HTMLImageElement).src = currentLook.mainImageOriginal;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <div className="text-white text-xs">
                <p className="font-mono text-[10px] uppercase text-zinc-300">Resolução Editorial</p>
                <p className="font-bold">{currentLook.focusPiece}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons for Look Image */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() =>
                handleOpenEdit({
                  fitKey: selectedFitKey,
                  lookNumber: selectedLookNumber,
                  itemTitle: `Foto do Modelo // ${currentLook.lookTitle}`,
                  currentImage: currentLook.mainImage,
                  originalImage: currentLook.mainImageOriginal,
                  targetType: 'look',
                  itemCategory: 'LOOK EDITORIAL',
                })
              }
              disabled={isSaving}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Crop className="w-3.5 h-3.5 text-amber-400" /> Alterar / Cortar Imagem do Modelo
            </button>

            {isCustomized(currentLook.mainImage, currentLook.mainImageOriginal) && (
              <button
                onClick={() =>
                  handleRestoreOriginal({
                    fitKey: selectedFitKey,
                    lookNumber: selectedLookNumber,
                    targetType: 'main',
                  })
                }
                disabled={isSaving}
                className="w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900 font-bold text-xs uppercase py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3 text-zinc-400" /> Restaurar Imagem Original
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* BLOCO DIREITA: PEÇAS RELACIONADAS (COR 1 & COR 2)            */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="border-b border-zinc-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="bg-amber-500 text-zinc-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                PEÇAS RELACIONADAS AO LOOK
              </span>
              <span className="text-zinc-400 text-xs font-mono">
                {currentLook.pieces.length} produtos
              </span>
            </div>
            <h4 className="text-sm font-black uppercase text-zinc-900 tracking-tight mt-2">
              Fotos Individuais dos Produtos (Cor 1 & Cor 2)
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
              Exibidas nos cards interativos ao lado do look. Alterar a imagem de uma peça NÃO
              modifica o look do modelo, e Cor 1 e Cor 2 são completamente independentes.
            </p>
          </div>

          {/* Lista de Peças */}
          <div className="space-y-6">
            {currentLook.pieces.map((piece: FitPieceConfig, pIndex: number) => {
              const pieceCustomColor1 = isCustomized(piece.color1Image, piece.color1Original);
              const pieceCustomColor2 = piece.hasColor2 && piece.color2Image && piece.color2Original
                ? isCustomized(piece.color2Image, piece.color2Original)
                : false;

              return (
                <div
                  key={piece.id || pIndex}
                  className="bg-zinc-50/80 border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-4"
                >
                  {/* Cabeçalho da Peça */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          PEÇA 0{pIndex + 1}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">
                          {piece.category}
                        </span>
                      </div>
                      <h5 className="text-sm font-black uppercase text-zinc-900 tracking-tight mt-1">
                        {piece.title}
                      </h5>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-zinc-700">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(piece.price)}
                      </span>
                    </div>
                  </div>

                  {/* Grid de Cores: Cor 1 & Cor 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* --- COR 1 --- */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded">
                            {piece.color1Name || 'Cor 1'}
                          </span>
                          {pieceCustomColor1 ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Personalizada
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-400">Padrão</span>
                          )}
                        </div>

                        {/* Visualização com object-contain para NÃO CORTAR a peça */}
                        <div className="w-full h-44 bg-[#F8F9FA] rounded-lg border border-zinc-100 flex items-center justify-center p-3 relative overflow-hidden group">
                          <img
                            src={piece.color1Image}
                            alt={`${piece.title} - ${piece.color1Name}`}
                            className="max-h-full max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = piece.color1Original;
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <button
                          onClick={() =>
                            handleOpenEdit({
                              fitKey: selectedFitKey,
                              lookNumber: selectedLookNumber,
                              pieceId: piece.id,
                              colorSlot: 'color1',
                              itemTitle: `${piece.title} — ${piece.color1Name || 'Cor 1'}`,
                              currentImage: piece.color1Image,
                              originalImage: piece.color1Original,
                              targetType: 'piece',
                              itemCategory: piece.category,
                              itemPrice: piece.price,
                              colorName: piece.color1Name || 'Cor 1',
                            })
                          }
                          disabled={isSaving}
                          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[11px] uppercase py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          <Crop className="w-3 h-3 text-amber-400" /> Alterar / Cortar Imagem
                        </button>

                        {pieceCustomColor1 && (
                          <button
                            onClick={() =>
                              handleRestoreOriginal({
                                fitKey: selectedFitKey,
                                lookNumber: selectedLookNumber,
                                pieceId: piece.id,
                                colorSlot: 'color1',
                                targetType: 'color1',
                              })
                            }
                            disabled={isSaving}
                            className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200 text-[10px] font-bold uppercase py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-zinc-400" /> Restaurar Original
                          </button>
                        )}
                      </div>
                    </div>

                    {/* --- COR 2 --- */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded">
                            {piece.color2Name || 'Cor 2'}
                          </span>
                          {pieceCustomColor2 ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Personalizada
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-400">Padrão</span>
                          )}
                        </div>

                        {/* Visualização com object-contain para NÃO CORTAR a peça */}
                        <div className="w-full h-44 bg-[#F8F9FA] rounded-lg border border-zinc-100 flex items-center justify-center p-3 relative overflow-hidden group">
                          {piece.color2Image ? (
                            <img
                              src={piece.color2Image}
                              alt={`${piece.title} - ${piece.color2Name || 'Cor 2'}`}
                              className="max-h-full max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                if (piece.color2Original) {
                                  (e.target as HTMLImageElement).src = piece.color2Original;
                                }
                              }}
                            />
                          ) : (
                            <div className="text-zinc-400 text-xs font-mono text-center">
                              Sem Cor 2
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <button
                          onClick={() =>
                            handleOpenEdit({
                              fitKey: selectedFitKey,
                              lookNumber: selectedLookNumber,
                              pieceId: piece.id,
                              colorSlot: 'color2',
                              itemTitle: `${piece.title} — ${piece.color2Name || 'Cor 2'}`,
                              currentImage: piece.color2Image || '',
                              originalImage: piece.color2Original || '',
                              targetType: 'piece',
                              itemCategory: piece.category,
                              itemPrice: piece.price,
                              colorName: piece.color2Name || 'Cor 2',
                            })
                          }
                          disabled={isSaving}
                          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[11px] uppercase py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          <Crop className="w-3 h-3 text-amber-400" /> Alterar / Cortar Imagem
                        </button>

                        {pieceCustomColor2 && (
                          <button
                            onClick={() =>
                              handleRestoreOriginal({
                                fitKey: selectedFitKey,
                                lookNumber: selectedLookNumber,
                                pieceId: piece.id,
                                colorSlot: 'color2',
                                targetType: 'color2',
                              })
                            }
                            disabled={isSaving}
                            className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200 text-[10px] font-bold uppercase py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-zinc-400" /> Restaurar Original
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE CORTE, ZOOM E AJUSTE DE IMAGEM (MARMOT CROP STUDIO)  */}
      {/* ============================================================ */}
      {editTarget && (
        <FitImageCropModal
          isOpen={!!editTarget}
          onClose={handleCloseModal}
          title={editTarget.itemTitle}
          currentImageUrl={editTarget.currentImage}
          originalImageUrl={editTarget.originalImage}
          targetType={editTarget.targetType}
          itemCategory={editTarget.itemCategory}
          itemPrice={editTarget.itemPrice}
          colorName={editTarget.colorName}
          onConfirmCrop={handleConfirmCropAndSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
