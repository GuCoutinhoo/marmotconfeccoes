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
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#777777] py-3 overflow-x-auto whitespace-nowrap scrollbar-none">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 hover:text-[#EFECE6] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Início</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 text-[#777777] shrink-0" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-[#D6B35A] transition-colors font-medium text-[#777777]"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#EFECE6] font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
