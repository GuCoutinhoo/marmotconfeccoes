import React from 'react';
import { Product } from '../../types';
import { ArrowRight, Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';

interface NewReleasesCarouselProps {
  products: Product[];
  onQuickView?: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

interface SpotlightItem {
  id: string;
  slug: string;
  category: string;
  title: string;
  price: number;
  installments: string;
  pixPrice: string;
  image: string;
  colors: string[];
  colorCount: number;
  isHeroYellow?: boolean;
}

export const NewReleasesCarousel: React.FC<NewReleasesCarouselProps> = ({
  products = [],
  onNavigate,
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Encontra os produtos no catálogo real para sincronização com carrinho/detalhes/favoritos
  const getCatalogProduct = (id: string, slug?: string): Product | undefined => {
    return products.find((p) => p.id === id || p.slug === slug || p.slug === id);
  };

  // 1. JAQUETA VARSITY OVERSIZED (Card Alto Esquerdo - Hero)
  const catProd1 = getCatalogProduct('prod-jaq-017', 'jaqueta-varsity-oversized');
  const item1: SpotlightItem = {
    id: 'prod-jaq-017',
    slug: 'jaqueta-varsity-oversized',
    category: 'JAQUETA',
    title: catProd1?.title ? catProd1.title.toUpperCase() : 'JAQUETA VARSITY OVERSIZED',
    price: catProd1?.price || 489.9,
    installments: 'ou 3x de R$ 163,30 sem juros',
    pixPrice: 'R$ 465,41 no Pix',
    image:
      catProd1?.image ||
      'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-varsity-oversized/marrom/01-4e26fc6bbb93b114.png',
    colors: (catProd1?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#6F513D', '#171717'],
    colorCount: catProd1?.colors?.length || 2,
    isHeroYellow: true,
  };

  // 2. SHORTS CARGO BAGGY (Card Horizontal Central Superior)
  const catProd2 = getCatalogProduct('prod-sho-002', 'shorts-cargo-baggy');
  const item2: SpotlightItem = {
    id: 'prod-sho-002',
    slug: 'shorts-cargo-baggy',
    category: 'SHORTS',
    title: catProd2?.title ? catProd2.title.toUpperCase() : 'SHORTS CARGO BAGGY',
    price: catProd2?.price || 249.9,
    installments: 'ou 3x de R$ 83,30 sem juros',
    pixPrice: 'R$ 237,41 no Pix',
    image:
      catProd2?.image ||
      '/Shorts Cargo Baggy - cor verde oliva.png',
    colors: (catProd2?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#4A5340', '#121212'],
    colorCount: catProd2?.colors?.length || 2,
  };

  // 3. MOLETOM ANORAK HEAVY (Card Horizontal Central Inferior)
  const catProd3 = getCatalogProduct('prod-mol-001', 'moletom-anorak') || getCatalogProduct('prod-jaq-001');
  const item3: SpotlightItem = {
    id: 'prod-mol-001',
    slug: 'moletom-anorak',
    category: 'MOLETOM',
    title: 'MOLETOM ANORAK HEAVY',
    price: catProd3?.price || 349.9,
    installments: 'ou 3x de R$ 116,63 sem juros',
    pixPrice: 'R$ 332,41 no Pix',
    image:
      'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-anorak/preto/01-45389339bd6149af.png',
    colors: ['#171717', '#4B5320'],
    colorCount: 2,
  };

  // 4. JAQUETA WORKWEAR (Card Alto Direito)
  const catProd4 = getCatalogProduct('prod-jaq-019', 'jaqueta-workwear');
  const item4: SpotlightItem = {
    id: 'prod-jaq-019',
    slug: 'jaqueta-workwear',
    category: 'JAQUETA',
    title: catProd4?.title ? catProd4.title.toUpperCase() : 'JAQUETA WORKWEAR',
    price: catProd4?.price || 469.9,
    installments: 'ou 3x de R$ 156,63 sem juros',
    pixPrice: 'R$ 446,41 no Pix',
    image:
      catProd4?.image ||
      'https://ktmkvysnjfphcfntazut.supabase.co/storage/v1/object/public/product-images/products/jaqueta-workwear/marrom/01-8c16fe2f27cd40e5.png',
    colors: (catProd4?.colors?.map((c) => c.colorHex).filter(Boolean) as string[]) || ['#6F513D', '#171717'],
    colorCount: catProd4?.colors?.length || 2,
  };

  // Cria objeto Product consistente para a Wishlist caso não exista previamente no estado
  const resolveProductObject = (item: SpotlightItem): Product => {
    const found = getCatalogProduct(item.id, item.slug);
    if (found) return found;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: item.category,
      description: `${item.title} - Marmot Streetwear`,
      price: item.price,
      category: item.category.toLowerCase(),
      subcategory: item.category,
      collection: 'Drop 2026',
      tags: ['Lançamento', 'Drop 2026'],
      rating: 5,
      reviewCount: 16,
      stockCount: 12,
      sku: `MM-${item.id.toUpperCase()}`,
      sizes: ['P', 'M', 'G', 'GG'],
      colors: item.colors.map((c, idx) => ({
        colorName: `Cor ${idx + 1}`,
        colorHex: c,
        color: idx === 0 ? 'Preto' : 'Outra',
        image: item.image,
        images: [item.image],
      })),
      image: item.image,
      images: [item.image],
      details: ['Modelagem exclusiva Marmot', 'Tecido encorpado premium'],
      careInstructions: ['Lavar em água fria'],
    };
  };

  const handleProductNavigate = (item: SpotlightItem) => {
    const target = item.slug || item.id;
    onNavigate('product', target);
  };

  const handleWishlistToggle = (e: React.MouseEvent, item: SpotlightItem) => {
    e.stopPropagation();
    const prodObj = resolveProductObject(item);
    toggleWishlist(prodObj);
  };

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  const ColorSwatches = ({ item }: { item: SpotlightItem }) => (
    <div className="nr-swatches">
      <div className="nr-swatches__dots">
        {item.colors.map((colorHex, idx) => (
          <span
            key={`${item.id}-${idx}`}
            className="nr-swatch"
            style={{ backgroundColor: colorHex }}
          />
        ))}
      </div>
      <span className="nr-swatches__count">{item.colorCount} CORES</span>
    </div>
  );

  const WishlistButton = ({ item }: { item: SpotlightItem }) => {
    const active = isInWishlist(item.id);

    return (
      <button
        type="button"
        aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        onClick={(e) => handleWishlistToggle(e, item)}
        className="nr-wishlist"
      >
        <Heart className={active ? 'nr-heart nr-heart--active' : 'nr-heart'} />
      </button>
    );
  };

  return (
    <section id="ultimos-lancamentos-drop" className="nr-section">
      <style>{`
        #ultimos-lancamentos-drop,
        #ultimos-lancamentos-drop * {
          box-sizing: border-box;
        }

        #ultimos-lancamentos-drop {
          --nr-bg: #f7f6f3;
          --nr-card: #ffffff;
          --nr-text: #090909;
          --nr-muted: #777777;
          --nr-line: #dededb;
          --nr-yellow: #ffc900;
          --nr-radius: 10px;
          background: var(--nr-bg);
          color: var(--nr-text);
          width: 100%;
          overflow: hidden;
          border-bottom: 1px solid #e7e6e2;
        }

        #ultimos-lancamentos-drop .nr-shell {
          width: calc(100% - 32px);
          max-width: 1672px;
          margin: 0 auto;
          padding: clamp(18px, 2.4vh, 26px) 0 clamp(12px, 1.8vh, 18px);
        }

        #ultimos-lancamentos-drop .nr-header {
          display: grid;
          grid-template-columns: minmax(0, 1.31fr) minmax(320px, .82fr) auto;
          align-items: end;
          column-gap: clamp(24px, 2.2vw, 42px);
          margin-bottom: clamp(21px, 2.55vh, 28px);
        }

        #ultimos-lancamentos-drop .nr-title-block {
          min-width: 0;
        }

        #ultimos-lancamentos-drop .nr-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 17px;
          margin: 0 0 7px 4px;
          white-space: nowrap;
        }

        #ultimos-lancamentos-drop .nr-eyebrow__brand,
        #ultimos-lancamentos-drop .nr-eyebrow__label {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: .25em;
          font-weight: 800;
        }

        #ultimos-lancamentos-drop .nr-eyebrow__label {
          color: #8b8b8b;
          font-weight: 700;
        }

        #ultimos-lancamentos-drop .nr-eyebrow__dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 999px;
          background: var(--nr-yellow);
        }

        #ultimos-lancamentos-drop .nr-title {
          margin: 0;
          margin-top: 7px;
          font-family: 'Anton', Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          font-size: clamp(50px, 4.9vw, 78px);
          font-weight: normal;
          line-height: .87;
          letter-spacing: -.045em;
          display: inline-block;
          transform: scaleX(1.22);
          transform-origin: left center;
          text-transform: uppercase;
          white-space: nowrap;
        }

        #ultimos-lancamentos-drop .nr-title-block {
          overflow: visible;
          padding-right: 16px;
        }

        #ultimos-lancamentos-drop .nr-copy {
          border-left: 1px solid #bdbdb9;
          padding-left: clamp(24px, 2vw, 35px);
          padding-bottom: 5px;
          min-height: 72px;
          display: flex;
          align-items: flex-end;
        }

        #ultimos-lancamentos-drop .nr-copy p {
          margin: 0;
          max-width: 365px;
          font-family: Arial, Helvetica, sans-serif;
          color: #505050;
          font-size: clamp(12px, .91vw, 15px);
          line-height: 1.24;
          font-weight: 400;
        }

        #ultimos-lancamentos-drop .nr-view-all {
          align-self: center;
          border: 0;
          background: #171717;
          color: #fff;
          height: 58px;
          min-width: 268px;
          padding: 0 29px 0 38px;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background .18s ease;
        }

        #ultimos-lancamentos-drop .nr-view-all:hover {
          background: #000;
        }

        #ultimos-lancamentos-drop .nr-view-all svg {
          width: 21px;
          height: 21px;
          stroke-width: 1.8;
        }

        #ultimos-lancamentos-drop .nr-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.52fr) minmax(0, 1.31fr) minmax(0, .99fr);
          gap: 18px;
          height: min(736px, calc(100svh - 142px), calc((100vw - 32px) * 0.46));
          min-height: 0;
        }

        #ultimos-lancamentos-drop .nr-card {
          position: relative;
          background: var(--nr-card);
          border: 1px solid #dededb;
          border-radius: var(--nr-radius);
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, .035);
          cursor: pointer;
          min-width: 0;
          min-height: 0;
        }

        #ultimos-lancamentos-drop .nr-card:hover {
          box-shadow: 0 5px 18px rgba(0, 0, 0, .055);
        }

        #ultimos-lancamentos-drop .nr-image-wrap {
          position: relative;
          overflow: hidden;
          background: #ececea;
        }

        #ultimos-lancamentos-drop .nr-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center top;
          transition: none;
          will-change: transform;
        }

        #ultimos-lancamentos-drop .nr-card:hover .nr-image {
          /* Sem zoom no hover: mantém a composição exatamente estável. */
        }


        /* Enquadramentos ideais para as fotos reais dos produtos */
        #ultimos-lancamentos-drop .nr-image--hero {
          object-position: center 25%;
          transform: none;
        }

        #ultimos-lancamentos-drop .nr-image--top {
          object-position: center center;
          transform: none;
        }

        #ultimos-lancamentos-drop .nr-image--bottom {
          object-position: center 20%;
          transform: none;
        }

        #ultimos-lancamentos-drop .nr-image--right {
          object-position: center 25%;
          transform: none;
        }

        #ultimos-lancamentos-drop .nr-wishlist {
          position: absolute;
          top: 17px;
          right: 17px;
          z-index: 3;
          width: 43px;
          height: 43px;
          border-radius: 999px;
          border: 1px solid #e5e5e2;
          background: rgba(255,255,255,.96);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111;
          cursor: pointer;
          padding: 0;
        }

        #ultimos-lancamentos-drop .nr-heart {
          width: 18px;
          height: 18px;
          fill: transparent;
          stroke: currentColor;
          stroke-width: 1.75;
        }

        #ultimos-lancamentos-drop .nr-heart--active {
          color: #e44242;
          fill: currentColor;
        }

        #ultimos-lancamentos-drop .nr-card--tall {
          display: grid;
          min-height: 0;
        }

        /* A referência NÃO usa a mesma proporção nos dois cards altos.
           O hero da esquerda prioriza muito mais a foto; o card da direita
           reserva mais espaço para as informações e CTA. */
        #ultimos-lancamentos-drop .nr-card--hero {
          grid-template-rows: minmax(0, 74.5%) minmax(0, 25.5%);
        }

        #ultimos-lancamentos-drop .nr-card--right {
          grid-template-rows: minmax(0, 64%) minmax(0, 36%);
        }

        #ultimos-lancamentos-drop .nr-card--tall .nr-info {
          padding: clamp(14px, 1.05vw, 20px) clamp(18px, 1.35vw, 24px) clamp(12px, 1vw, 18px);
          display: grid;
          grid-template-rows: auto auto;
          align-content: space-between;
          min-height: 0;
        }

        #ultimos-lancamentos-drop .nr-card--hero .nr-info {
          padding-top: clamp(11px, .9vw, 16px);
          padding-bottom: clamp(10px, .8vw, 14px);
        }

        #ultimos-lancamentos-drop .nr-card--hero .nr-category {
          margin-bottom: 3px;
        }

        #ultimos-lancamentos-drop .nr-card--hero .nr-product-name {
          margin-bottom: 4px;
        }

        #ultimos-lancamentos-drop .nr-card--hero .nr-price {
          margin-bottom: 3px;
        }

        #ultimos-lancamentos-drop .nr-card--hero .nr-bottom-row {
          margin-top: 5px;
        }

        #ultimos-lancamentos-drop .nr-center {
          display: grid;
          grid-template-rows: 1fr 1fr;
          gap: 18px;
          min-width: 0;
          min-height: 0;
        }

        #ultimos-lancamentos-drop .nr-card--horizontal {
          display: grid;
          grid-template-columns: 50.2% 49.8%;
          min-height: 0;
        }

        #ultimos-lancamentos-drop .nr-card--horizontal .nr-info {
          padding: clamp(17px, 1.35vw, 24px) clamp(18px, 1.4vw, 25px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
          min-height: 0;
        }

        #ultimos-lancamentos-drop .nr-category {
          display: block;
          margin-bottom: 6px;
          font-family: Arial, Helvetica, sans-serif;
          color: #626262;
          font-size: clamp(9px, .64vw, 11px);
          font-weight: 700;
          letter-spacing: .18em;
          line-height: 1;
          text-transform: uppercase;
        }

        #ultimos-lancamentos-drop .nr-product-name {
          margin: 0 0 8px;
          color: #090909;
          font-family: 'Helvetica Now Display', 'Inter', Arial, Helvetica, sans-serif;
          font-size: clamp(16px, 1.18vw, 21px);
          font-weight: 800;
          letter-spacing: -.025em;
          line-height: 1.02;
          text-transform: uppercase;
        }

        #ultimos-lancamentos-drop .nr-price {
          margin: 0 0 5px;
          color: #090909;
          font-family: 'Helvetica Now Display', 'Inter', Arial, Helvetica, sans-serif;
          font-size: clamp(20px, 1.45vw, 25px);
          font-weight: 800;
          letter-spacing: -.035em;
          line-height: 1;
        }

        #ultimos-lancamentos-drop .nr-payment {
          color: #727272;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(10px, .77vw, 12.5px);
          line-height: 1.3;
        }

        #ultimos-lancamentos-drop .nr-card--tall .nr-product-name {
          font-size: clamp(18px, 1.28vw, 23px);
        }

        #ultimos-lancamentos-drop .nr-card--tall .nr-price {
          font-size: clamp(21px, 1.55vw, 27px);
        }

        #ultimos-lancamentos-drop .nr-bottom-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-top: 12px;
        }

        #ultimos-lancamentos-drop .nr-card--horizontal .nr-bottom-row {
          display: block;
          margin-top: 10px;
        }

        #ultimos-lancamentos-drop .nr-swatches {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        #ultimos-lancamentos-drop .nr-swatches__dots {
          display: flex;
          gap: 7px;
          flex: 0 0 auto;
        }

        #ultimos-lancamentos-drop .nr-swatch {
          width: 19px;
          height: 19px;
          border: 1px solid rgba(0,0,0,.14);
          border-radius: 999px;
        }

        #ultimos-lancamentos-drop .nr-swatches__count {
          font-family: Arial, Helvetica, sans-serif;
          color: #747474;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .13em;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
        }

        #ultimos-lancamentos-drop .nr-divider {
          height: 1px;
          width: 100%;
          margin: 13px 0 12px;
          background: #dededb;
        }

        #ultimos-lancamentos-drop .nr-btn {
          height: 52px;
          border-radius: 3px;
          border: 1px solid #888984;
          background: #fff;
          color: #0c0c0c;
          padding: 0 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
          line-height: 1;
          text-transform: uppercase;
          cursor: pointer;
          transition: .18s ease;
          white-space: nowrap;
        }

        #ultimos-lancamentos-drop .nr-btn:hover {
          background: #111;
          border-color: #111;
          color: #fff;
        }

        #ultimos-lancamentos-drop .nr-btn svg {
          width: 18px;
          height: 18px;
          stroke-width: 1.9;
        }

        #ultimos-lancamentos-drop .nr-btn--hero {
          min-width: 238px;
          background: var(--nr-yellow);
          border-color: var(--nr-yellow);
          color: #080808;
        }

        #ultimos-lancamentos-drop .nr-btn--hero:hover {
          background: #efbd00;
          border-color: #efbd00;
          color: #080808;
        }

        #ultimos-lancamentos-drop .nr-card--horizontal .nr-btn {
          width: 100%;
          height: 48px;
        }

        #ultimos-lancamentos-drop .nr-card--right .nr-btn {
          width: 100%;
        }

        @media (max-width: 1280px) {
          #ultimos-lancamentos-drop .nr-shell {
            width: calc(100% - 24px);
            max-width: 1672px;
          }

          #ultimos-lancamentos-drop .nr-title {
            font-size: clamp(46px, 5vw, 68px);
          }

          #ultimos-lancamentos-drop .nr-header {
            grid-template-columns: minmax(0, 1.35fr) minmax(250px, .8fr) auto;
            gap: 22px;
          }

          #ultimos-lancamentos-drop .nr-view-all {
            min-width: 220px;
            height: 52px;
            padding-inline: 28px 22px;
          }

          #ultimos-lancamentos-drop .nr-grid {
            gap: 14px;
            height: min(650px, calc(100svh - 138px), calc((100vw - 24px) * 0.46));
          }

          #ultimos-lancamentos-drop .nr-center {
            gap: 14px;
          }

          #ultimos-lancamentos-drop .nr-card--tall .nr-info,
          #ultimos-lancamentos-drop .nr-card--horizontal .nr-info {
            padding: 16px 18px;
          }

          #ultimos-lancamentos-drop .nr-btn--hero {
            min-width: 188px;
          }
        }

        /* Telas desktop com pouca altura (ex.: 1360×768 / 1366×768).
           O layout continua idêntico, mas todo o bloco cabe sem cortar o rodapé dos cards. */
        @media (min-width: 1024px) and (max-height: 820px) {
          #ultimos-lancamentos-drop .nr-shell {
            padding-top: 20px;
            padding-bottom: 14px;
          }

          #ultimos-lancamentos-drop .nr-header {
            margin-bottom: 18px;
          }

          #ultimos-lancamentos-drop .nr-eyebrow {
            margin-bottom: 5px;
          }

          #ultimos-lancamentos-drop .nr-title {
            font-size: clamp(54px, 5.05vw, 70px);
          }

          #ultimos-lancamentos-drop .nr-copy {
            min-height: 64px;
          }

          #ultimos-lancamentos-drop .nr-view-all {
            height: 48px;
            min-width: 214px;
          }

          #ultimos-lancamentos-drop .nr-grid {
            height: min(585px, calc(100svh - 132px), calc((100vw - 24px) * 0.46));
            max-height: none;
          }

          #ultimos-lancamentos-drop .nr-card--tall .nr-info {
            padding-top: 11px;
            padding-bottom: 10px;
          }

          #ultimos-lancamentos-drop .nr-card--right .nr-info {
            padding-top: 14px;
            padding-bottom: 13px;
          }

          #ultimos-lancamentos-drop .nr-card--horizontal .nr-info {
            padding-top: 14px;
            padding-bottom: 14px;
          }

          #ultimos-lancamentos-drop .nr-btn {
            height: 40px;
          }

          #ultimos-lancamentos-drop .nr-btn--hero {
            min-width: 190px;
            height: 40px;
          }

          #ultimos-lancamentos-drop .nr-card--horizontal .nr-btn {
            height: 40px;
          }

          #ultimos-lancamentos-drop .nr-divider {
            margin-top: 7px;
            margin-bottom: 7px;
          }

          #ultimos-lancamentos-drop .nr-wishlist {
            top: 13px;
            right: 13px;
            width: 38px;
            height: 38px;
          }
        }

        @media (max-width: 1023px) {
          #ultimos-lancamentos-drop {
            overflow: visible;
          }

          #ultimos-lancamentos-drop .nr-shell {
            width: min(760px, calc(100% - 32px));
            padding-block: 36px;
          }

          #ultimos-lancamentos-drop .nr-header {
            grid-template-columns: 1fr auto;
            align-items: end;
            row-gap: 20px;
          }

          #ultimos-lancamentos-drop .nr-copy {
            grid-column: 1 / -1;
            grid-row: 2;
            border-left: 0;
            padding-left: 0;
            min-height: 0;
          }

          #ultimos-lancamentos-drop .nr-view-all {
            grid-column: 2;
            grid-row: 1;
          }

          #ultimos-lancamentos-drop .nr-grid {
            height: auto;
            grid-template-columns: 1fr;
          }

          #ultimos-lancamentos-drop .nr-card--tall {
            grid-template-rows: auto auto;
          }

          #ultimos-lancamentos-drop .nr-card--tall .nr-image-wrap {
            aspect-ratio: 4 / 3;
          }

          #ultimos-lancamentos-drop .nr-center {
            grid-template-rows: auto auto;
          }

          #ultimos-lancamentos-drop .nr-card--horizontal {
            min-height: 315px;
          }
        }

        @media (max-width: 640px) {
          #ultimos-lancamentos-drop .nr-shell {
            width: calc(100% - 24px);
            padding-block: 28px;
          }

          #ultimos-lancamentos-drop .nr-header {
            grid-template-columns: 1fr;
          }

          #ultimos-lancamentos-drop .nr-title {
            white-space: normal;
            font-size: clamp(42px, 14vw, 62px);
          }

          #ultimos-lancamentos-drop .nr-copy,
          #ultimos-lancamentos-drop .nr-view-all {
            grid-column: 1;
            grid-row: auto;
          }

          #ultimos-lancamentos-drop .nr-view-all {
            width: 100%;
          }

          #ultimos-lancamentos-drop .nr-card--horizontal {
            grid-template-columns: 1fr;
          }

          #ultimos-lancamentos-drop .nr-card--horizontal .nr-image-wrap {
            aspect-ratio: 4 / 3;
          }

          #ultimos-lancamentos-drop .nr-btn--hero {
            min-width: 0;
          }
        }
      `}</style>

      <div className="nr-shell">
        <header className="nr-header">
          <div className="nr-title-block">
            <div className="nr-eyebrow">
              <span className="nr-eyebrow__brand">MARMOT</span>
              <span className="nr-eyebrow__dot" />
              <span className="nr-eyebrow__label">NEW ARRIVALS</span>
            </div>
            <h2 className="nr-title">ÚLTIMOS LANÇAMENTOS</h2>
          </div>

          <div className="nr-copy">
            <p>
              Peças recém-chegadas com modelagem exclusiva e materiais premium.<br />
              Desenvolvidas para um estilo real, dentro e fora da cidade.
            </p>
          </div>

          <button
            type="button"
            className="nr-view-all"
            onClick={() => onNavigate('shop', 'novidades')}
          >
            <span>VER TODOS</span>
            <ArrowRight />
          </button>
        </header>

        <div className="nr-grid">
          <article className="nr-card nr-card--tall nr-card--hero" onClick={() => handleProductNavigate(item1)}>
            <div className="nr-image-wrap">
              <img
                src={item1.image}
                alt={item1.title}
                className="nr-image nr-image--hero"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <WishlistButton item={item1} />
            </div>

            <div className="nr-info">
              <div>
                <span className="nr-category">{item1.category}</span>
                <h3 className="nr-product-name">{item1.title}</h3>
                <div className="nr-price">{formatPrice(item1.price)}</div>
                <div className="nr-payment">{item1.installments}</div>
                <div className="nr-payment">{item1.pixPrice}</div>
              </div>

              <div className="nr-bottom-row">
                <ColorSwatches item={item1} />
                <button
                  type="button"
                  className="nr-btn nr-btn--hero"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductNavigate(item1);
                  }}
                >
                  <span>VER PRODUTO</span>
                  <ArrowRight />
                </button>
              </div>
            </div>
          </article>

          <div className="nr-center">
            <article className="nr-card nr-card--horizontal" onClick={() => handleProductNavigate(item2)}>
              <div className="nr-image-wrap">
                <img
                  src={item2.image}
                  alt={item2.title}
                  className="nr-image nr-image--top"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <WishlistButton item={item2} />
              </div>

              <div className="nr-info">
                <div>
                  <span className="nr-category">{item2.category}</span>
                  <h3 className="nr-product-name">{item2.title}</h3>
                  <div className="nr-price">{formatPrice(item2.price)}</div>
                  <div className="nr-payment">{item2.installments}</div>
                  <div className="nr-payment">{item2.pixPrice}</div>
                </div>

                <div className="nr-bottom-row">
                  <ColorSwatches item={item2} />
                  <div className="nr-divider" />
                  <button
                    type="button"
                    className="nr-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductNavigate(item2);
                    }}
                  >
                    <span>VER PRODUTO</span>
                    <ArrowRight />
                  </button>
                </div>
              </div>
            </article>

            <article className="nr-card nr-card--horizontal" onClick={() => handleProductNavigate(item3)}>
              <div className="nr-image-wrap">
                <img
                  src={item3.image}
                  alt={item3.title}
                  className="nr-image nr-image--bottom"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <WishlistButton item={item3} />
              </div>

              <div className="nr-info">
                <div>
                  <span className="nr-category">{item3.category}</span>
                  <h3 className="nr-product-name">{item3.title}</h3>
                  <div className="nr-price">{formatPrice(item3.price)}</div>
                  <div className="nr-payment">{item3.installments}</div>
                  <div className="nr-payment">{item3.pixPrice}</div>
                </div>

                <div className="nr-bottom-row">
                  <ColorSwatches item={item3} />
                  <div className="nr-divider" />
                  <button
                    type="button"
                    className="nr-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductNavigate(item3);
                    }}
                  >
                    <span>VER PRODUTO</span>
                    <ArrowRight />
                  </button>
                </div>
              </div>
            </article>
          </div>

          <article className="nr-card nr-card--tall nr-card--right" onClick={() => handleProductNavigate(item4)}>
            <div className="nr-image-wrap">
              <img
                src={item4.image}
                alt={item4.title}
                className="nr-image nr-image--right"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <WishlistButton item={item4} />
            </div>

            <div className="nr-info">
              <div>
                <span className="nr-category">{item4.category}</span>
                <h3 className="nr-product-name">{item4.title}</h3>
                <div className="nr-price">{formatPrice(item4.price)}</div>
                <div className="nr-payment">{item4.installments}</div>
                <div className="nr-payment">{item4.pixPrice}</div>
              </div>

              <div>
                <div className="nr-bottom-row">
                  <ColorSwatches item={item4} />
                </div>
                <div className="nr-divider" />
                <button
                  type="button"
                  className="nr-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductNavigate(item4);
                  }}
                >
                  <span>VER PRODUTO</span>
                  <ArrowRight />
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
