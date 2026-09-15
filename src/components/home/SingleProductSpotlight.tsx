import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

interface SingleProductSpotlightProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

interface GalleryAngle {
  id: string;
  label: string;
  image: string;
  thumbnailStyle?: React.CSSProperties;
  mainStyle?: React.CSSProperties;
}

export const SingleProductSpotlight: React.FC<SingleProductSpotlightProps> = ({
  products,
  onNavigate,
}) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Encontra o produto oficial Varsity ou fallback
  const product =
    products.find((p) => p.slug === 'jaqueta-varsity-oversized') ||
    products.find((p) => p.title.toLowerCase().includes('varsity') && p.category === 'jaquetas') ||
    products.find((p) => p.slug.includes('varsity')) ||
    products.find((p) => p.category === 'jaquetas') ||
    products[0];

  const [selectedSize, setSelectedSize] = useState<string>('P');
  const [selectedColorSlug, setSelectedColorSlug] = useState<'marrom' | 'preto'>('marrom');
  const [activeAngleIndex, setActiveAngleIndex] = useState<number>(0);
  const [added, setAdded] = useState(false);

  // Sincroniza variantes se disponíveis
  const brownImage =
    'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png';
  const blackImage =
    'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/preto/01-de2f2ad52698a820.png';

  const currentColorImage = selectedColorSlug === 'marrom' ? brownImage : blackImage;

  // 4 ângulos fotográficos editoriais fiéis à referência visual:
  // 01: Frente / Modelo no estúdio
  // 02: Costas / Silhueta
  // 03: Detalhe do patch bordado "Y" no peito
  // 04: Full body / Caimento streetwear completo
  const galleryAngles: GalleryAngle[] = [
    {
      id: 'front',
      label: 'Frente - Modelo em Estúdio',
      image: currentColorImage,
      mainStyle: {
        objectPosition: 'center 18%',
        transform: 'scale(1)',
      },
      thumbnailStyle: {
        objectPosition: 'center 18%',
      },
    },
    {
      id: 'back',
      label: 'Costas - Modelagem e Ombros',
      image: currentColorImage,
      mainStyle: {
        objectPosition: 'center 22%',
        transform: 'scale(1.06) scaleX(-1)',
      },
      thumbnailStyle: {
        objectPosition: 'center 22%',
        transform: 'scaleX(-1)',
      },
    },
    {
      id: 'detail-patch',
      label: 'Detalhe - Patch Varsity Bordado',
      image: currentColorImage,
      mainStyle: {
        objectPosition: '58% 36%',
        transform: 'scale(2.3)',
      },
      thumbnailStyle: {
        objectPosition: '58% 36%',
        transform: 'scale(2.5)',
      },
    },
    {
      id: 'full-body',
      label: 'Fit Completo - Proporções Oversized',
      image: currentColorImage,
      mainStyle: {
        objectPosition: 'center 46%',
        transform: 'scale(0.92)',
      },
      thumbnailStyle: {
        objectPosition: 'center 46%',
        transform: 'scale(0.95)',
      },
    },
  ];

  const currentAngle = galleryAngles[activeAngleIndex] || galleryAngles[0];

  const handlePrevAngle = () => {
    setActiveAngleIndex((prev) => (prev > 0 ? prev - 1 : galleryAngles.length - 1));
  };

  const handleNextAngle = () => {
    setActiveAngleIndex((prev) => (prev < galleryAngles.length - 1 ? prev + 1 : 0));
  };

  const handleColorChange = (color: 'marrom' | 'preto') => {
    setSelectedColorSlug(color);
  };

  const handleAddToCart = () => {
    if (!product) return;

    const variantToUse: ProductVariant = {
      color: selectedColorSlug,
      colorName: selectedColorSlug === 'marrom' ? 'Marrom' : 'Preto',
      colorHex: selectedColorSlug === 'marrom' ? '#6F513D' : '#171717',
      image: currentColorImage,
    };

    const success = addToCart(product, selectedSize, variantToUse);
    if (success) {
      setAdded(true);
      showToast('Jaqueta Varsity Oversized adicionada ao carrinho!', 'success');
      setTimeout(() => setAdded(false), 2400);
    }
  };

  if (!product) return null;

  return (
    <section
      id="product-spotlight-section"
      className="bg-[#F4F4F2] select-none relative overflow-hidden border-y border-zinc-200/80"
      style={{
        paddingTop: '44px',
        paddingBottom: '44px',
      }}
    >
      <div className="max-w-[1780px] mx-auto px-4 sm:px-8 lg:px-10">
        {/* ========================================================= */}
        {/* CARD CENTRAL DE DESTAQUE - ESTRUTURA HORIZONTAL SPLIT     */}
        {/* ========================================================= */}
        <div className="bg-[#EDEDED] sm:bg-[#EFEFEF] border border-zinc-300/80 rounded-[3px] overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* ======================================================= */}
          {/* 1. LADO ESQUERDO: FOTO DO PRODUTO / MODELO (52% col)    */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 relative w-full min-h-[500px] sm:min-h-[620px] lg:min-h-[720px] xl:min-h-[760px] bg-[#E3E2DD] overflow-hidden flex items-center justify-center border-b lg:border-b-0 lg:border-r border-zinc-300/80">
            {/* Top-Left: Bloco Tipográfico Editorial */}
            <div className="absolute top-6 left-6 sm:top-7 sm:left-7 z-20 pointer-events-none select-none text-left">
              <span className="font-sans text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#1E1E1E] block leading-tight">
                DESTAQUE
              </span>
              <span className="font-sans text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#1E1E1E] block leading-tight">
                DE ATELIÊ
              </span>
              <div className="w-4.5 h-[1.5px] bg-[#1E1E1E] my-2" />
              <span className="font-sans text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#1E1E1E] block leading-tight">
                SIGNATURE
              </span>
              <span className="font-sans text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#1E1E1E] block leading-tight">
                PIECE
              </span>
            </div>

            {/* Imagem Fotográfica Principal com Transição Suave de Ângulo */}
            <div className="w-full h-full absolute inset-0 overflow-hidden flex items-center justify-center bg-[#E3E2DD]">
              <img
                key={`${selectedColorSlug}-${activeAngleIndex}`}
                src={currentAngle.image}
                alt={`Jaqueta Varsity Oversized - ${currentAngle.label}`}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-500 ease-out select-none"
                style={currentAngle.mainStyle}
              />
            </div>

            {/* Bottom-Left: Assinatura MARMOT */}
            <div className="absolute bottom-6 left-6 sm:bottom-7 sm:left-7 z-20 pointer-events-none select-none">
              <span className="font-sans text-[11px] sm:text-[12px] font-bold tracking-[0.34em] text-[#1E1E1E] uppercase">
                MARMOT
              </span>
            </div>

            {/* Bottom-Right: Setas Discretas de Navegação [ ← ] [ → ] */}
            <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-20 flex items-center gap-1.5 select-none">
              <button
                type="button"
                onClick={handlePrevAngle}
                aria-label="Perspectiva anterior"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0B0B0E] hover:bg-[#27272A] active:scale-95 text-white flex items-center justify-center rounded-[2px] transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
              </button>
              <button
                type="button"
                onClick={handleNextAngle}
                aria-label="Próxima perspectiva"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0B0B0E] hover:bg-[#27272A] active:scale-95 text-white flex items-center justify-center rounded-[2px] transition-all cursor-pointer shadow-xs"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 2. LADO DIREITO: CONTEÚDO DO PRODUTO + MINIATURAS       */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col lg:flex-row justify-between gap-6 xl:gap-8 bg-[#F6F5F2]">
            
            {/* Bloco Principal de Informações */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Microtexto / Categoria */}
                <div className="mb-2">
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    JAQUETAS &nbsp;/&nbsp; NOVO DROP
                  </span>
                </div>

                {/* Título Grande e Forte */}
                <h2
                  onClick={() => onNavigate('product', product.id)}
                  className="font-anton text-4xl sm:text-5xl lg:text-[48px] xl:text-[54px] font-normal uppercase text-black leading-[0.92] tracking-tight mb-3 cursor-pointer hover:text-zinc-800 transition-colors select-none"
                  style={{ fontWeight: 'normal' }}
                >
                  JAQUETA
                  <br />
                  VARSITY OVERSIZED
                </h2>

                {/* Avaliação por Estrelas */}
                <div className="flex items-center gap-2 mb-3.5 select-none">
                  <div className="flex text-black gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-black text-black" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-black">5.0</span>
                  <span className="text-xs text-zinc-500 font-normal">(30 avaliações)</span>
                </div>

                {/* Descrição Curta Editorial */}
                <p className="text-[13.5px] sm:text-[14px] text-zinc-600 leading-relaxed font-normal mb-4 max-w-lg">
                  Inspirada no varsity clássico, reinterpretada em proporções amplas.
                  <br className="hidden sm:inline" />
                  Uma peça atemporal, feita para o dia a dia.
                </p>

                {/* Linha de Características Resumidas */}
                <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-2.5 gap-y-1 text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-5 select-none">
                  <span>MANGAS CONTRASTANTES</span>
                  <span className="text-zinc-300 font-light">|</span>
                  <span>PUNHOS LISTRADOS</span>
                  <span className="text-zinc-300 font-light">|</span>
                  <span>PATCHES APLICADOS</span>
                  <span className="text-zinc-300 font-light">|</span>
                  <span>MODELAGEM OVERSIZED</span>
                </div>

                {/* Bloco de Preço */}
                <div className="mb-6 select-none">
                  <span className="text-3xl sm:text-[34px] font-extrabold text-black tracking-tight block leading-none mb-1">
                    R$ 489,90
                  </span>
                  <span className="text-xs sm:text-[12.5px] text-zinc-500 font-normal">
                    3x de R$ 163,30 sem juros &nbsp;•&nbsp; R$ 465,40 no Pix
                  </span>
                </div>

                {/* Linha de Seleção: Cor + Tamanho */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 mb-6">
                  {/* Seleção de Cor */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-black block mb-2 select-none">
                      COR:{' '}
                      <span className="text-zinc-600 font-semibold ml-1">
                        {selectedColorSlug === 'marrom' ? 'MARROM' : 'PRETO'}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      {/* Marrom */}
                      <button
                        type="button"
                        onClick={() => handleColorChange('marrom')}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer relative ${
                          selectedColorSlug === 'marrom'
                            ? 'ring-2 ring-black ring-offset-2 scale-105'
                            : 'border border-zinc-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: '#5A3E2B' }}
                        title="Marrom Clássico"
                      />
                      {/* Preto */}
                      <button
                        type="button"
                        onClick={() => handleColorChange('preto')}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer relative ${
                          selectedColorSlug === 'preto'
                            ? 'ring-2 ring-black ring-offset-2 scale-105'
                            : 'border border-zinc-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: '#18181B' }}
                        title="Preto Ônix"
                      />
                    </div>
                  </div>

                  {/* Seleção de Tamanho */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-black block mb-2 select-none">
                      TAMANHO:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {['P', 'M', 'G', 'GG', 'XG'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[2px] text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                            selectedSize === size
                              ? 'bg-[#0B0B0E] text-white'
                              : 'bg-white/70 hover:bg-white text-zinc-800 border border-zinc-300 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botão Principal de Compra (CTA Amarelo Marmot) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full py-4 px-6 rounded-[2px] font-black text-xs sm:text-[13px] uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs mb-4.5 ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F4C400] text-black hover:bg-[#E5B500] active:scale-[0.99]'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>ADICIONADO AO CARRINHO</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 stroke-[2.4]" />
                      <span>ADICIONAR AO CARRINHO</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5] ml-1" />
                    </>
                  )}
                </button>

                {/* Benefícios e Provas de Confiança */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-[11.5px] text-zinc-700 font-medium pt-1 border-t border-zinc-200/70">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-zinc-800 shrink-0 stroke-[2.2]" />
                    <span>Frete grátis acima de R$ 299,00</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-800 shrink-0 stroke-[2.2]" />
                    <span>Troca grátis em até 30 dias</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-800 shrink-0 stroke-[2.2]" />
                    <span>Compra segura</span>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================== */}
            {/* MINIATURAS VERTICAIS DISCRETAS (FAR RIGHT)          */}
            {/* =================================================== */}
            <div className="flex lg:flex-col items-center justify-center lg:justify-start gap-2.5 sm:gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-zinc-200/80 lg:pl-5 xl:pl-6">
              {galleryAngles.map((angle, idx) => (
                <button
                  key={angle.id}
                  type="button"
                  onClick={() => setActiveAngleIndex(idx)}
                  className={`w-14 sm:w-16 h-18 sm:h-20 rounded-[2px] overflow-hidden transition-all cursor-pointer relative bg-[#E6E5E0] ${
                    activeAngleIndex === idx
                      ? 'ring-2 ring-black ring-offset-1 opacity-100 shadow-2xs'
                      : 'border border-zinc-300 opacity-65 hover:opacity-100 hover:border-zinc-500'
                  }`}
                  title={angle.label}
                >
                  <img
                    src={angle.image}
                    alt={angle.label}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={angle.thumbnailStyle}
                  />
                </button>
              ))}

              {/* Contador Discreto 01 / 04 */}
              <span className="text-[11px] font-mono font-medium text-zinc-500 mt-1 lg:mt-2 select-none tracking-widest">
                {String(activeAngleIndex + 1).padStart(2, '0')} / {String(galleryAngles.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
