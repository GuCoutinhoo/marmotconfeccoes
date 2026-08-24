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
    <nav className="flex items-center gap-1.5 text-xs text-[#71717A] py-3 overflow-x-auto whitespace-nowrap scrollbar-none">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 hover:text-[#18181B] transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Início</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
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
