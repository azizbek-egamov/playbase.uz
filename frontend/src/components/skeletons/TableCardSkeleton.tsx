import React from 'react';

export const TableCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl border border-surface-container-highest/50 bg-surface-container/40 p-4 sm:p-5 flex flex-col justify-between space-y-4 animate-shimmer relative overflow-hidden backdrop-blur-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-surface-container-highest/80"></div>
          <div className="w-14 h-3 rounded-md bg-surface-container-highest/80"></div>
        </div>
        <div className="w-20 h-6 rounded-xl bg-surface-container-highest/60"></div>
      </div>

      {/* Center Details */}
      <div className="space-y-3 py-3">
        <div className="flex items-center justify-between">
          <div className="w-1/2 h-6 rounded-lg bg-surface-container-highest"></div>
          <div className="w-8 h-4 rounded bg-surface-container-highest/60"></div>
        </div>
        <div className="w-full h-14 rounded-2xl bg-surface-container-lowest/80 border border-surface-container-highest/40"></div>
        <div className="w-2/3 h-4 rounded-md bg-surface-container-highest/70"></div>
      </div>

      {/* Bottom Button */}
      <div className="pt-3 border-t border-surface-container-highest/40">
        <div className="w-full h-10 rounded-xl bg-surface-container-highest/70"></div>
      </div>
    </div>
  );
};
