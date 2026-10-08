import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const ZoneFilter: React.FC = () => {
  const { currentClub, selectedZoneFilter, setSelectedZoneFilter, liveTables } = useAppStore();

  if (!currentClub || !currentClub.zones) return null;

  const totalTables = liveTables.length;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
      {/* All Zones Tab */}
      <button
        onClick={() => setSelectedZoneFilter('ALL')}
        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 flex items-center gap-2 border ${
          selectedZoneFilter === 'ALL'
            ? 'bg-primary text-surface border-primary shadow-lg shadow-primary/20'
            : 'bg-surface-container border-surface-container-highest text-on-surface hover:border-primary/50'
        }`}
      >
        <span className="material-symbols-outlined text-base">apps</span>
        <span>Barcha Stollar</span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
            selectedZoneFilter === 'ALL' ? 'bg-surface/20 text-surface' : 'bg-surface-container-highest text-on-surface-variant'
          }`}
        >
          {totalTables}
        </span>
      </button>

      {/* Each Zone Tab */}
      {currentClub.zones.map((zone) => {
        const isSelected = selectedZoneFilter === zone.id;
        const countInZone = liveTables.filter(t => t.zone_id === zone.id).length;

        return (
          <button
            key={zone.id}
            onClick={() => setSelectedZoneFilter(zone.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 flex items-center gap-2 border ${
              isSelected
                ? 'bg-surface-container-highest border-primary text-white ring-1 ring-primary'
                : 'bg-surface-container border-surface-container-highest text-on-surface hover:border-primary/40'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: zone.color_code }}></span>
            <span>{zone.name}</span>
            <span className="text-[11px] font-mono text-on-surface-variant">
              ({Math.round(Number(zone.hourly_rate)).toLocaleString('uz-UZ')} so'm)
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-surface-container-highest text-on-surface-variant">
              {countInZone}
            </span>
          </button>
        );
      })}
    </div>
  );
};
