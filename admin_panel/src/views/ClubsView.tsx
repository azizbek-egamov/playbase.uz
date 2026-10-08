import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Header } from '../components/Header';
import { ExtendSubscriptionModal } from '../components/modals/ExtendSubscriptionModal';
import type { SuperAdminClub } from '../types';
import {
  Building2,
  Search,
  CalendarPlus,
  Ban,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ClubsView: React.FC = () => {
  const { clubs, fetchClubs, toggleClubActive, isLoading, fetchPlans } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClubForExtend, setSelectedClubForExtend] = useState<SuperAdminClub | null>(null);

  useEffect(() => {
    fetchClubs({ status: statusFilter === 'ALL' ? undefined : statusFilter, search: searchQuery || undefined });
    fetchPlans();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClubs({ status: statusFilter === 'ALL' ? undefined : statusFilter, search: searchQuery || undefined });
  };

  const filterTabs = [
    { id: 'ALL', label: 'Barcha Klublar' },
    { id: 'ACTIVE', label: 'Faol Obunachilar' },
    { id: 'TRIAL', label: 'Sinov Davri (Trial)' },
    { id: 'EXPIRED', label: 'Muddati O\'tganlar' },
    { id: 'BLOCKED', label: 'Bloklanganlar' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim pb-12">
      <Header
        title="Klublar va Tenantlar Boshqaruvi"
        subtitle="Platformadagi barcha o'yin zallari va ularning obuna muddatlari"
        onRefresh={() => fetchClubs({ status: statusFilter === 'ALL' ? undefined : statusFilter, search: searchQuery || undefined })}
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Top Control Bar: Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  statusFilter === tab.id
                    ? 'bg-primary text-surface border-primary shadow-md glow-primary'
                    : 'bg-surface-container border-surface-container-highest text-on-surface hover:border-primary/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Klub nomi, egasi, telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-white text-xs focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-on-surface-variant" />
          </form>
        </div>

        {/* Clubs Table Container */}
        <div className="bg-surface-container border border-surface-container-highest rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-container-highest bg-surface-container-high/60 text-on-surface-variant font-bold">
                  <th className="p-4 font-semibold">Klub & Filial</th>
                  <th className="p-4 font-semibold">Biznes Egasi</th>
                  <th className="p-4 font-semibold">Stollar</th>
                  <th className="p-4 font-semibold">SaaS Tarifi</th>
                  <th className="p-4 font-semibold">Obuna Muddati</th>
                  <th className="p-4 font-semibold">Holati</th>
                  <th className="p-4 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                      Klublar ro'yxati yuklanmoqda...
                    </td>
                  </tr>
                ) : clubs.length > 0 ? (
                  clubs.map((club) => {
                    const isExpired = !club.has_active_subscription;
                    const isBlocked = !club.is_active;

                    return (
                      <tr key={club.id} className="hover:bg-surface-container-high/40 transition-colors">
                        {/* Club info */}
                        <td className="p-4">
                          <div className="font-display font-bold text-white text-sm">{club.name}</div>
                          <div className="text-[11px] text-on-surface-variant truncate max-w-[180px]">
                            {club.address || "Manzil ko'rsatilmagan"}
                          </div>
                        </td>

                        {/* Owner Info */}
                        <td className="p-4">
                          <div className="font-bold text-on-surface flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span>{club.owner_name || club.owner_username || 'Egasiz'}</span>
                          </div>
                          {club.owner_phone && (
                            <div className="text-[11px] text-on-surface-variant font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{club.owner_phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Tables */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-lowest font-mono font-bold text-white text-xs border border-surface-container-highest">
                            <Layers className="w-3 h-3 text-cyan-400" />
                            <span>{club.tables_count} ta stol</span>
                          </span>
                        </td>

                        {/* Plan */}
                        <td className="p-4">
                          <div className="font-bold text-white">
                            {club.active_plan_name || 'Standart SaaS'}
                          </div>
                          <div className="text-[10px] text-on-surface-variant">
                            {club.is_trial ? '7 kunlik Trial' : 'Pullik obuna'}
                          </div>
                        </td>

                        {/* Expires at */}
                        <td className="p-4">
                          {club.plan_expires_at ? (
                            <div>
                              <div
                                className={`font-mono font-bold ${
                                  isExpired ? 'text-rose-400' : 'text-primary'
                                }`}
                              >
                                {new Date(club.plan_expires_at).toLocaleDateString('uz-UZ')}
                              </div>
                              <div className="text-[10px] text-on-surface-variant">
                                {isExpired ? 'Muddati tugagan' : `${club.days_left} kun qoldi`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant">Belgilanmagan</span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="p-4">
                          {isBlocked ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              BLOKLANGAN
                            </span>
                          ) : club.is_trial ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              TRIAL ({club.days_left}d)
                            </span>
                          ) : isExpired ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              TUGAGAN
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-primary/20 text-primary border border-primary/30">
                              FAOL ({club.days_left}d)
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedClubForExtend(club)}
                              className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                              title="Obunani uzaytirish"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Uzaytirish</span>
                            </button>

                            <button
                              onClick={() => toggleClubActive(club.id)}
                              className={`p-1.5 rounded-xl border text-xs transition-all active:scale-95 ${
                                club.is_active
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30'
                              }`}
                              title={club.is_active ? "Klubni bloklash" : "Klubni faollashtirish"}
                            >
                              {club.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-on-surface-variant">
                      Klublar topilmadi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Extend Subscription Modal */}
      <AnimatePresence>
        {selectedClubForExtend && (
          <ExtendSubscriptionModal
            club={selectedClubForExtend}
            onClose={() => setSelectedClubForExtend(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
