import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { KPIHeader } from '../components/KPIHeader';
import { ZoneFilter } from '../components/ZoneFilter';
import { TableCard } from '../components/TableCard';
import { TableCardSkeleton } from '../components/skeletons/TableCardSkeleton';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardView: React.FC = () => {
  const { liveTables, selectedZoneFilter, isLoading, setCurrentView } = useAppStore();

  const lockedTablesCount = liveTables.filter((t) => t.is_plan_locked).length;

  const filteredTables = liveTables.filter((table) => {
    if (selectedZoneFilter === 'ALL') return true;
    return table.zone_id === selectedZoneFilter;
  });

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-28 md:pb-8">
      {/* KPI Top Bar */}
      <KPIHeader />

      {/* Plan limit warning banner if any tables are locked */}
      {lockedTablesCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <span className="material-symbols-outlined text-xl">lock</span>
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                Tarif limiti: {lockedTablesCount} ta stoldan foydalanish cheklangan
              </div>
              <div className="text-[11px] text-amber-200/80">
                Klubingizda {liveTables.length} ta stol mavjud, ammo obunangiz bo'yicha faqat {liveTables.length - lockedTablesCount} ta stoldan foydalanish mumkin.
              </div>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('billing')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow active:scale-95"
          >
            <span className="material-symbols-outlined text-sm font-bold">bolt</span>
            <span>Tarifni Yangilash</span>
          </button>
        </motion.div>
      )}

      {/* Zone Tabs Filter */}
      <ZoneFilter />

      {/* Tables Grid */}
      {isLoading && liveTables.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <TableCardSkeleton key={n} />
          ))}
        </div>
      ) : filteredTables.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4"
        >
          <AnimatePresence>
            {filteredTables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center bg-surface-container/40 border border-surface-container-highest/80 rounded-3xl p-8 backdrop-blur-sm"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4 shadow-inner">
            <span className="material-symbols-outlined text-3xl text-primary">sports_esports</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Stollar topilmadi</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-4">
            Ushbu zonada stollar mavjud emas yoki hali yaratilmagan.
          </p>
        </motion.div>
      )}
    </div>
  );
};
