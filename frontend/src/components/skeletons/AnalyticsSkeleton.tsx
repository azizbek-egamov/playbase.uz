import React from 'react';

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-surface-container border border-surface-container-highest/60 space-y-2.5 animate-shimmer relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="w-24 h-3.5 rounded bg-surface-container-highest/80"></div>
              <div className="w-6 h-6 rounded-lg bg-surface-container-highest/60"></div>
            </div>
            <div className="w-36 h-7 rounded-lg bg-surface-container-highest"></div>
            <div className="w-24 h-3 rounded bg-surface-container-highest/60"></div>
          </div>
        ))}
      </div>

      {/* Main Chart Skeleton */}
      <div className="p-6 rounded-3xl bg-surface-container border border-surface-container-highest/60 space-y-4 animate-shimmer relative overflow-hidden">
        <div className="flex justify-between items-center">
          <div className="w-48 h-5 rounded-lg bg-surface-container-highest"></div>
          <div className="w-32 h-4 rounded bg-surface-container-highest/60"></div>
        </div>
        <div className="w-full h-64 rounded-2xl bg-surface-container-lowest/80 border border-surface-container-highest/40"></div>
      </div>

      {/* 2-Column Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-surface-container border border-surface-container-highest/60 h-64 animate-shimmer relative overflow-hidden"></div>
        <div className="p-6 rounded-3xl bg-surface-container border border-surface-container-highest/60 h-64 animate-shimmer relative overflow-hidden"></div>
      </div>
    </div>
  );
};

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="p-3.5 rounded-2xl bg-surface-container border border-surface-container-highest/60 space-y-3 animate-shimmer relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="w-14 h-4 rounded-md bg-surface-container-highest"></div>
            <div className="w-12 h-3.5 rounded-md bg-surface-container-highest/70"></div>
          </div>
          <div className="w-3/4 h-4 rounded bg-surface-container-highest"></div>
          <div className="pt-2 border-t border-surface-container-highest/40 flex justify-between items-center">
            <div className="w-16 h-4 rounded bg-surface-container-highest"></div>
            <div className="w-6 h-6 rounded-full bg-surface-container-highest"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
