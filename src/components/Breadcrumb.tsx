import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const firstItemIsHome = items[0]?.label.trim().toLocaleLowerCase('pt-BR') === 'início';
  const homeAction = firstItemIsHome ? items[0]?.onClick : undefined;
  const trailItems = firstItemIsHome ? items.slice(1) : items;

  return (
    <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-[12px] text-[#71717A] py-2 overflow-x-auto whitespace-nowrap scrollbar-none">
      <button
        onClick={homeAction}
        className="flex items-center gap-1 hover:text-[#18181B] transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Início</span>
      </button>

      {trailItems.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <ChevronRight className="w-3 h-3 text-[#A1A1AA] shrink-0" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-[#B45309] transition-colors font-medium text-[#71717A] cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#18181B] font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
