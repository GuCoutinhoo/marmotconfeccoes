import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden animate-pulse">
      {/* 1. Image Container Skeleton */}
      <div className="relative aspect-[3/4] w-full bg-[#F4F4F5]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#E4E4E7] border-t-[#18181B] animate-spin opacity-20" />
        </div>
      </div>

      {/* 2. Content Skeleton */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3">
        <div className="space-y-2">
          {/* Subcategory */}
          <div className="h-3 w-1/3 bg-[#E4E4E7] rounded" />
          {/* Title */}
          <div className="h-4 w-4/5 bg-[#E4E4E7] rounded" />
          {/* Color swatch dots */}
          <div className="flex items-center gap-1.5 pt-1">
            <div className="w-4 h-4 rounded-full bg-[#E4E4E7]" />
            <div className="w-4 h-4 rounded-full bg-[#E4E4E7]" />
            <div className="w-4 h-4 rounded-full bg-[#E4E4E7]" />
          </div>
        </div>

        {/* Pricing */}
        <div className="pt-2 border-t border-[#F4F4F5] space-y-1.5">
          <div className="h-5 w-1/2 bg-[#E4E4E7] rounded" />
          <div className="h-3 w-2/3 bg-[#E4E4E7] rounded" />
        </div>
      </div>
    </div>
  );
};
