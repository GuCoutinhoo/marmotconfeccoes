import React from 'react';
import { BannerHero } from '../components/BannerHero';
import { CategoryNavigationGrid } from '../components/home/CategoryNavigationGrid';
import { NewReleasesCarousel } from '../components/home/NewReleasesCarousel';
import { BestsellersRanking } from '../components/home/BestsellersRanking';
import { SingleProductSpotlight } from '../components/home/SingleProductSpotlight';
import { EditorialMagazineJournal } from '../components/home/EditorialMagazineJournal';
import { CompactCustomerReviews } from '../components/home/CompactCustomerReviews';
import { NewsletterVIP } from '../components/home/NewsletterVIP';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

interface HomePageProps {
  onNavigate: (page: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onQuickView }) => {
  const { products } = useStore();

  return (
    <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen">
      {/* 1. Hero Principal - Lookbook Editorial */}
      <BannerHero onNavigate={onNavigate} />

      {/* 2. Compre por Categoria (Navegação Visual) */}
      <CategoryNavigationGrid onNavigate={onNavigate} />

      {/* 3. Novidades & Últimos Lançamentos (Carousel) */}
      <NewReleasesCarousel
        products={products}
        onQuickView={onQuickView}
        onNavigate={onNavigate}
      />

      {/* 4. Destaque de Ateliê - Peça em Foco */}
      <SingleProductSpotlight
        products={products}
        onQuickView={onQuickView}
        onNavigate={onNavigate}
      />

      {/* 5. Os Mais Procurados (Ranking com Prova Social) */}
      <BestsellersRanking
        products={products}
        onQuickView={onQuickView}
        onNavigate={onNavigate}
      />

      {/* 6. Conteúdo Editorial & Lookbook (Guia de Fit & Matéria-Prima) */}
      <EditorialMagazineJournal onNavigate={onNavigate} />

      {/* 7. Avaliações Reais de Compradores */}
      <CompactCustomerReviews />

      {/* 8. Newsletter & Clube Marmot */}
      <NewsletterVIP />
    </div>
  );
};
