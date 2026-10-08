import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Session } from '../types';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic } from '../utils/haptics';
import { formatUzPhone } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

export const HistoryView: React.FC = () => {
  const { currentClub } = useAppStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/sessions/history/');
        setSessions(res.data || []);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [currentClub]);

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.customer_name?.toLowerCase().includes(q);
      const matchTable = s.table_name?.toLowerCase().includes(q);
      return matchName || matchTable;
    }
    return true;
  });

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-28 md:pb-8">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">receipt_long</span>
            <span>Seanslar Tarixi va Jurnal</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Barcha yopilgan va faol o'yin seanslari bo'yicha batafsil hisobot
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              placeholder="Qidiruv (mijoz, stol)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              triggerHaptic('light');
              setStatusFilter(e.target.value);
            }}
            className="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-xs text-white focus:outline-none focus:border-primary shrink-0"
          >
            <option value="ALL">Barcha Holatlar</option>
            <option value="COMPLETED">Yakunlangan</option>
            <option value="ACTIVE">Faol</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
        </div>
      </div>

      {/* Main Body */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest/60 animate-shimmer relative overflow-hidden h-16" />
          ))}
        </div>
      ) : filteredSessions.length > 0 ? (
        <>
          {/* MOBILE CARDS VIEW (Visible only on mobile/tablet) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            <AnimatePresence>
              {filteredSessions.map((session) => {
                const startTime = new Date(session.start_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                const endTime = session.end_time
                  ? new Date(session.end_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                  : 'Hozir';

                return (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{session.table_name}</div>
                        <div className="text-[11px] text-on-surface-variant font-medium">{session.zone_name}</div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                          session.status === 'COMPLETED'
                            ? 'bg-primary/15 text-primary border border-primary/30 glow-primary'
                            : session.status === 'ACTIVE'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 glow-rose'
                            : 'bg-gray-500/15 text-gray-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'ACTIVE' ? 'bg-rose-500 animate-ping' : 'bg-primary'}`}></span>
                        {session.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 border-t border-b border-surface-container-highest/60">
                      <div className="text-on-surface-variant">
                        Mijoz: <span className="text-white font-semibold">{session.customer_name || 'Oddiy mijoz'}</span>
                      </div>
                      <div className="font-mono text-[11px] text-on-surface-variant">
                        {startTime} → {endTime} ({Math.floor((session.elapsed_seconds || 0) / 60)} daq)
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="text-[11px] text-on-surface-variant">
                        To'lov: <span className="font-bold text-white uppercase">{session.payment_type}</span>
                        {session.bar_amount > 0 && (
                          <span className="text-tertiary ml-1 font-mono">(Bar: +{session.bar_amount.toLocaleString()})</span>
                        )}
                      </div>
                      <span className="font-mono font-black text-primary text-base glow-primary">
                        {(session.total_amount || session.current_total_amount || 0).toLocaleString()} so'm
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* DESKTOP TABLE VIEW (Visible on medium+ screens) */}
          <div className="hidden md:block bg-surface-container border border-surface-container-highest rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-container-highest bg-surface-container-high/60 text-on-surface-variant font-bold uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Stol / Zona</th>
                    <th className="p-3.5">Mijoz</th>
                    <th className="p-3.5">Boshlangan / Tugagan</th>
                    <th className="p-3.5">Davomiyligi</th>
                    <th className="p-3.5">Vaqt summasi</th>
                    <th className="p-3.5">Bar</th>
                    <th className="p-3.5">Jami To'lov</th>
                    <th className="p-3.5">To'lov turi</th>
                    <th className="p-3.5 pr-5">Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/60">
                  {filteredSessions.map((session) => {
                    const startTime = new Date(session.start_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                    const endTime = session.end_time
                      ? new Date(session.end_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                      : 'Hozir';

                    return (
                      <tr key={session.id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-white">{session.table_name}</div>
                          <div className="text-[11px] text-on-surface-variant">{session.zone_name}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-white">{session.customer_name || 'Oddiy mijoz'}</div>
                          {session.customer_phone && (
                            <div className="text-[11px] text-on-surface-variant font-mono">{formatUzPhone(session.customer_phone)}</div>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-on-surface-variant">
                          {startTime} → {endTime}
                        </td>
                        <td className="p-3.5 font-mono">
                          {Math.floor((session.elapsed_seconds || 0) / 60)} daq
                        </td>
                        <td className="p-3.5 font-mono font-bold text-white">
                          {(session.time_amount || session.current_time_amount || 0).toLocaleString()} so'm
                        </td>
                        <td className="p-3.5 font-mono text-tertiary font-bold">
                          {session.bar_amount > 0 ? `+${session.bar_amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3.5 font-mono font-black text-primary text-sm glow-primary">
                          {(session.total_amount || session.current_total_amount || 0).toLocaleString()} so'm
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-container-highest text-on-surface">
                            {session.payment_type}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              session.status === 'COMPLETED'
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : session.status === 'ACTIVE'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'ACTIVE' ? 'bg-rose-500 animate-ping' : 'bg-primary'}`}></span>
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-surface-container/30 border border-surface-container-highest rounded-3xl">
          Seanslar tarixi topilmadi.
        </div>
      )}
    </div>
  );
};
