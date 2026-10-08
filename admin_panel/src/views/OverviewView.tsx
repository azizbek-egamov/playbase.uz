import React, { useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Header } from '../components/Header';
import {
  Building2,
  TrendingUp,
  CreditCard,
  Gamepad2,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Zap,
  Gem
} from 'lucide-react';
import { motion } from 'framer-motion';

export const OverviewView: React.FC = () => {
  const { overviewData, fetchOverview, setCurrentView } = useAdminStore();

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = [
    {
      title: 'Jami Klublar',
      value: overviewData?.total_clubs || 0,
      sub: `${overviewData?.active_subscribed_clubs || 0} ta faol pullik, ${overviewData?.trial_clubs || 0} ta trial`,
      icon: <Building2 className="w-5 h-5 text-primary" />,
      glow: 'glow-primary',
      bg: 'bg-primary/15 border-primary/30',
    },
    {
      title: 'Oylik SaaS Daromadi (MRR)',
      value: `${Number(overviewData?.mrr_revenue || 0).toLocaleString()} UZS`,
      sub: `Jami: ${Number(overviewData?.total_revenue || 0).toLocaleString()} UZS`,
      icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
      glow: 'glow-cyan',
      bg: 'bg-cyan-500/15 border-cyan-500/30',
    },
    {
      title: 'Platformadagi Stollar',
      value: overviewData?.total_tables || 0,
      sub: `${overviewData?.active_sessions_count || 0} ta ayni paytda band seanslar`,
      icon: <Gamepad2 className="w-5 h-5 text-purple-400" />,
      glow: 'glow-purple',
      bg: 'bg-purple-500/15 border-purple-500/30',
    },
    {
      title: 'Jami Foydalanuvchilar',
      value: overviewData?.total_users || 0,
      sub: 'Biznes egalari va kassirlar',
      icon: <Users className="w-5 h-5 text-amber-400" />,
      glow: 'glow-amber',
      bg: 'bg-amber-500/15 border-amber-500/30',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim">
      <Header
        title="Global Platforma Ko'rsatkichlari"
        subtitle="PlayBase SaaS monitoring va metrikalar markazi"
        onRefresh={fetchOverview}
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface-container/80 backdrop-blur-md border border-surface-container-highest rounded-3xl p-5 relative overflow-hidden shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${card.bg} ${card.glow}`}>
                  {card.icon}
                </div>
              </div>

              <div className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                {card.value}
              </div>

              <div className="text-[11px] text-on-surface-variant/90 font-medium mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{card.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Middle Section: Payment Breakdown & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Providers Breakdown */}
          <div className="bg-surface-container border border-surface-container-highest rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-black text-white text-base">To'lov Tizimlari Tushumi</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-container-highest text-on-surface-variant font-bold">
                  SaaS Billing
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-highest flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xs">
                      PAYME
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Payme Merchant</div>
                      <div className="text-[10px] text-on-surface-variant">Avtomatik tranzaksiyalar</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-sm text-cyan-400">
                    {Number(overviewData?.payme_revenue || 0).toLocaleString()} UZS
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-highest flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-black text-xs">
                      CLICK
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Click Evolution</div>
                      <div className="text-[10px] text-on-surface-variant">Click Pass & Webhook</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-sm text-primary">
                    {Number(overviewData?.click_revenue || 0).toLocaleString()} UZS
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-container-highest/60 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Jami SaaS daromadi:</span>
              <span className="font-mono font-black text-base text-white">
                {Number(overviewData?.total_revenue || 0).toLocaleString()} UZS
              </span>
            </div>
          </div>

          {/* Registration Dynamics (7 Days) */}
          <div className="bg-surface-container border border-surface-container-highest rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-black text-white text-base">Yangi Klublar (So'nggi 7 kun)</h3>
                <span className="text-xs text-primary font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>O'sish dinamikasi</span>
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 h-36 pt-4">
                {overviewData?.daily_registrations?.map((day, idx) => {
                  const maxCount = Math.max(
                    1,
                    ...(overviewData?.daily_registrations?.map((d) => d.count) || [1])
                  );
                  const heightPercent = Math.max(15, (day.count / maxCount) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-white font-bold">{day.count}</span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-primary/30 to-primary transition-all duration-500 min-h-[6px]"
                      />
                      <span className="text-[9px] text-on-surface-variant font-medium truncate">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 text-center">
              <p className="text-[11px] text-on-surface-variant">
                Platformaga har kuni yangi o'yin zallari va klublar ulanmoqda.
              </p>
            </div>
          </div>

          {/* Quick Management Actions */}
          <div className="bg-surface-container border border-surface-container-highest rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-black text-white text-base mb-4">Tezkor Harakatlar</h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => setCurrentView('clubs')}
                  className="w-full p-3 rounded-2xl bg-surface-container-high hover:bg-surface-bright text-white text-xs font-bold transition-all border border-surface-container-highest flex items-center justify-between active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>Klublar ro'yxatini ko'rish</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-on-surface-variant" />
                </button>

                <button
                  onClick={() => setCurrentView('plans')}
                  className="w-full p-3 rounded-2xl bg-surface-container-high hover:bg-surface-bright text-white text-xs font-bold transition-all border border-surface-container-highest flex items-center justify-between active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Gem className="w-4 h-4 text-cyan-400" />
                    <span>Tarif rejalarini sozlash</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-on-surface-variant" />
                </button>

                <button
                  onClick={() => setCurrentView('broadcast')}
                  className="w-full p-3 rounded-2xl bg-surface-container-high hover:bg-surface-bright text-white text-xs font-bold transition-all border border-surface-container-highest flex items-center justify-between active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Telegram orqali e'lon yuborish</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-primary font-bold">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Barcha SaaS jarayonlari avtomatlashtirilgan.</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Transactions */}
        <div className="bg-surface-container border border-surface-container-highest rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-black text-white text-base">So'nggi SaaS To'lovlari</h3>
            <button
              onClick={() => setCurrentView('billing')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Barcha to'lovlar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-container-highest text-on-surface-variant font-bold">
                  <th className="pb-3 font-semibold">Klub Nomi</th>
                  <th className="pb-3 font-semibold">Tarif</th>
                  <th className="pb-3 font-semibold">Summa</th>
                  <th className="pb-3 font-semibold">Provayder</th>
                  <th className="pb-3 font-semibold">Holati</th>
                  <th className="pb-3 font-semibold">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/60">
                {overviewData?.recent_transactions?.length ? (
                  overviewData.recent_transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-3 font-bold text-white">{tx.club_name}</td>
                      <td className="py-3 font-medium text-on-surface">{tx.plan_name || 'Standart'}</td>
                      <td className="py-3 font-mono font-bold text-white">
                        {Number(tx.amount).toLocaleString()} UZS
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            tx.provider === 'PAYME'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-primary/20 text-primary border border-primary/30'
                          }`}
                        >
                          {tx.provider}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            tx.status === 'SUCCESS'
                              ? 'bg-primary/20 text-primary'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-on-surface-variant font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleString('uz-UZ')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                      Hozircha to'lovlar mavjud emas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
