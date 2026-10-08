import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const KPIHeader: React.FC = () => {
  const { liveTables, currentClub } = useAppStore();

  const totalTables = liveTables.length;
  const occupiedTables = liveTables.filter(t => t.status === 'OCCUPIED').length;
  const idleTables = liveTables.filter(t => t.status === 'IDLE').length;

  // Calculate live current accumulated sum on tables
  // current_total_amount Django DecimalField dan string sifatida keladi
  const liveActiveRevenue = liveTables.reduce((sum, t) => {
    if (t.active_session?.current_total_amount) {
      return sum + Number(t.active_session.current_total_amount);
    }
    return sum;
  }, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Band Stollar */}
      <div className="bg-surface-container border border-surface-container-highest/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Band Stollar
          </div>
          <div className="text-2xl font-display font-extrabold text-white">
            {occupiedTables} <span className="text-sm font-normal text-on-surface-variant">/ {totalTables}</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <span className="material-symbols-outlined text-2xl">sports_esports</span>
        </div>
      </div>

      {/* 2. Bo'sh Stollar */}
      <div className="bg-surface-container border border-surface-container-highest/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Bo'sh Stollar
          </div>
          <div className="text-2xl font-display font-extrabold text-primary">
            {idleTables}
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
        </div>
      </div>

      {/* 3. Joriy Jonli Summa (Aktiv seanslar) */}
      <div className="bg-surface-container border border-surface-container-highest/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-on-surface-variant">
            Aktiv Seanslar Summasi
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-tertiary">
            {liveActiveRevenue.toLocaleString()} <span className="text-xs font-sans text-on-surface-variant">{currentClub?.currency || 'UZS'}</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
          <span className="material-symbols-outlined text-2xl">payments</span>
        </div>
      </div>

      {/* 4. Bandlik Foizi */}
      <div className="bg-surface-container border border-surface-container-highest/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-on-surface-variant">
            Klub Bandligi
          </div>
          <div className="text-2xl font-display font-extrabold text-white">
            {totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0}%
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <span className="material-symbols-outlined text-2xl">pie_chart</span>
        </div>
      </div>
    </div>
  );
};
