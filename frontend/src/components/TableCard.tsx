import React from 'react';
import type { LiveTableData } from '../types';
import { useAppStore } from '../store/useAppStore';
import { LiveTimer } from './LiveTimer';
import { triggerHaptic } from '../utils/haptics';
import { toNum } from '../utils/formatters';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface TableCardProps {
  table: LiveTableData;
}

export const TableCard: React.FC<TableCardProps> = ({ table }) => {
  const { openModal, currentClub, setCurrentView } = useAppStore();
  const session = table.active_session;

  const isPlanLocked = !!table.is_plan_locked;
  const isIdle = table.status === 'IDLE' && !isPlanLocked;
  const isOccupied = table.status === 'OCCUPIED' && !isPlanLocked;
  const isMaintenance = table.status === 'MAINTENANCE' && !isPlanLocked;

  // Handle card click
  const handleCardClick = () => {
    if (isPlanLocked) {
      triggerHaptic('heavy');
      toast.error(
        table.lock_reason ||
        "Ushbu stol tarifingizdagi maksimal stollar limitidan oshganligi sababli bloklangan. Cheklovni yechish uchun tarifni oshiring."
      );
      return;
    }

    if (isIdle) {
      triggerHaptic('light');
      openModal('NEW_SESSION', table);
    } else if (isOccupied && session) {
      triggerHaptic('medium');
      openModal('SESSION_MANAGE', table, session);
    }
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{
        layout: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }}
      whileHover={!isMaintenance && !isPlanLocked ? { scale: 1.02, y: -3 } : {}}
      whileTap={!isMaintenance && !isPlanLocked ? { scale: 0.98 } : {}}
      onClick={handleCardClick}
      className={`group relative rounded-3xl border p-4 sm:p-5 cursor-pointer flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
        isPlanLocked
          ? 'bg-surface-container-lowest/80 border-amber-500/40 opacity-75 shadow-md ring-1 ring-amber-500/20'
          : isIdle
          ? 'bg-surface-container/70 hover:bg-surface-container border-surface-container-highest/80 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10'
          : isOccupied
          ? 'bg-surface-container-high/90 border-rose-500/50 hover:border-rose-500 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/30 glow-rose'
          : 'bg-surface-container-lowest/60 border-surface-container-highest/40 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Top Bar: Status Badge & Table Zone */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPlanLocked
                ? 'bg-amber-400'
                : isIdle
                ? 'bg-primary'
                : isOccupied
                ? 'bg-rose-500 animate-ping'
                : 'bg-gray-500'
            }`}
          ></span>
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isPlanLocked
                ? 'text-amber-400'
                : isIdle
                ? 'text-primary'
                : isOccupied
                ? 'text-rose-400'
                : 'text-gray-400'
            }`}
          >
            {isPlanLocked ? "Tarif Limiti 🔒" : isIdle ? "Bo'sh" : isOccupied ? "Band" : "Servisda"}
          </span>
        </div>

        {/* Zone Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-container-highest/70 border border-surface-container-highest text-[11px] font-semibold text-on-surface">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: table.zone_color }}></span>
          <span className="truncate max-w-[100px]">{table.zone_name}</span>
        </div>
      </div>

      {/* Table Name & Core Info */}
      <div className="my-2 space-y-2.5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display font-black text-lg sm:text-xl text-white tracking-tight group-hover:text-primary transition-colors truncate">
            {table.name}
          </h3>
          <span className="font-mono text-xs text-on-surface-variant/80 shrink-0 bg-surface-container-highest/50 px-2 py-0.5 rounded-md">
            #{table.number}
          </span>
        </div>

        {/* OCCUPIED STATE DETAILS */}
        {isOccupied && session && (
          <div className="space-y-3 pt-1">
            {/* Customer Name */}
            {session.customer_name && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant truncate">
                <span className="material-symbols-outlined text-sm text-primary">person</span>
                <span className="font-semibold text-white truncate">{session.customer_name}</span>
              </div>
            )}

            {/* Live Timer Box with Glowing Border */}
            <div className="p-3 rounded-2xl bg-surface-container-lowest/90 border border-rose-500/30 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
                <span className="material-symbols-outlined text-rose-400 text-base animate-pulse">timer</span>
                <span>{session.is_open_ended ? "O'tgan:" : "Qolgan:"}</span>
              </div>
              <LiveTimer
                startTime={session.start_time}
                isCountDown={!session.is_open_ended}
                plannedEndTime={session.planned_end_time}
                className="text-base sm:text-lg text-white font-mono font-bold"
              />
            </div>

            {/* Current Accumulated Sum */}
            <div className="flex items-baseline justify-between pt-1 border-t border-surface-container-highest/60">
              <span className="text-xs text-on-surface-variant font-medium">Joriy hisob:</span>
              <div className="text-right">
                <span className="font-mono font-extrabold text-base sm:text-lg text-tertiary">
                  {toNum(session.current_total_amount || 0).toLocaleString()}
                </span>
                <span className="text-xs text-on-surface-variant font-sans ml-1">
                  {currentClub?.currency || 'UZS'}
                </span>
              </div>
            </div>

            {/* Bar Orders Pill */}
            {session.orders && session.orders.length > 0 && (
              <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-surface-container-highest/60 text-[11px] text-on-surface-variant border border-surface-container-highest">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-tertiary">local_bar</span>
                  {session.orders.length} ta bar mahsuloti
                </span>
                <span className="font-mono font-bold text-white">
                  +{toNum(session.bar_amount).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* IDLE STATE DETAILS */}
        {isIdle && (
          <div className="py-4 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-surface transition-all duration-300 glow-primary">
              <span className="material-symbols-outlined text-2xl font-bold group-hover:rotate-90 transition-transform duration-300">add</span>
            </div>
            <div className="text-xs text-on-surface-variant">
              Tarif: <span className="font-mono font-bold text-white">{toNum(table.hourly_rate).toLocaleString()}</span> so'm/soat
            </div>
          </div>
        )}

        {/* PLAN LOCKED STATE DETAILS */}
        {isPlanLocked && (
          <div className="py-3 text-center space-y-2">
            <div className="w-11 h-11 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div className="text-xs text-amber-300 font-bold">
              Tarif limiti oshgan
            </div>
            <p className="text-[11px] text-on-surface-variant px-1 leading-snug">
              {table.lock_reason || "Stoldan foydalanish uchun obunani yangilang"}
            </p>
          </div>
        )}

        {/* MAINTENANCE STATE DETAILS */}
        {isMaintenance && (
          <div className="py-6 text-center space-y-1">
            <span className="material-symbols-outlined text-3xl text-gray-500">build</span>
            <p className="text-xs text-on-surface-variant">Texnik xizmat ko'rsatilmoqda</p>
          </div>
        )}
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-3 border-t border-surface-container-highest/60 mt-2">
        {isIdle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              openModal('NEW_SESSION', table);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-primary/15 hover:bg-primary border border-primary/40 hover:border-primary text-primary hover:text-surface font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 glow-primary"
          >
            <span className="material-symbols-outlined text-base font-bold">play_arrow</span>
            <span>Seansni Boshlash</span>
          </button>
        )}

        {isPlanLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              setCurrentView('billing');
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 hover:border-amber-500 text-amber-300 hover:text-surface font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">upgrade</span>
            <span>Tarifni Oshirish</span>
          </button>
        )}

        {isOccupied && session && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                openModal('SESSION_MANAGE', table, session);
              }}
              className="py-2 px-3 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-white font-medium text-xs transition-colors flex items-center justify-center gap-1 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>Boshqaruv</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('heavy');
                openModal('CHECKOUT', table, session);
              }}
              className="py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-md shadow-rose-950 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>Hisob-kitob</span>
            </button>
          </div>
        )}

        {isMaintenance && (
          <button
            disabled
            className="w-full py-2 px-3 rounded-xl bg-surface-container-highest/40 text-on-surface-variant/50 font-medium text-xs text-center cursor-not-allowed"
          >
            Faolsizlantirilgan
          </button>
        )}
      </div>
    </motion.div>
  );
};
