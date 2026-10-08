import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { AnalyticsSkeleton } from '../components/skeletons/AnalyticsSkeleton';
import { triggerHaptic } from '../utils/haptics';
import { motion } from 'framer-motion';

export const AnalyticsView: React.FC = () => {
  const { currentClub } = useAppStore();

  const [daysRange, setDaysRange] = useState<number>(7);
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      setIsLoading(true);
      try {
        const [statsRes, trendsRes, peakRes, productsRes, paymentsRes] = await Promise.all([
          apiClient.get('/analytics/dashboard/stats/'),
          apiClient.get(`/analytics/trends/?days=${daysRange}`),
          apiClient.get('/analytics/peak-hours/'),
          apiClient.get('/analytics/top-products/'),
          apiClient.get('/analytics/payment-methods/'),
        ]);

        setStats(statsRes.data);
        setTrends(trendsRes.data);
        setPeakHours(peakRes.data);
        setTopProducts(productsRes.data);
        setPaymentMethods(paymentsRes.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAnalytics();
  }, [currentClub, daysRange]);

  const currency = currentClub?.currency || 'UZS';

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-28 md:pb-8">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">analytics</span>
            <span>Vizual Analitika va Tahlillar</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Daromadlar dinamikasi, vaqt va bar savdosi, eng gavjum soatlar va mahsulotlar rentabelligi
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container border border-surface-container-highest self-start sm:self-auto">
          <button
            onClick={() => {
              triggerHaptic('light');
              setDaysRange(7);
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              daysRange === 7
                ? 'bg-primary text-surface shadow-sm glow-primary'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Oxirgi 7 Kun
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setDaysRange(30);
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              daysRange === 30
                ? 'bg-primary text-surface shadow-sm glow-primary'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Oxirgi 30 Kun
          </button>
        </div>
      </div>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : stats ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* 1. Top 4 High-Level KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Jami Daromad */}
            <div className="p-5 rounded-3xl bg-surface-container border border-surface-container-highest space-y-2 shadow-md hover:border-primary/40 transition-colors">
              <div className="text-xs font-bold text-on-surface-variant flex items-center justify-between">
                <span>Bugungi Jami Tushum</span>
                <span className="material-symbols-outlined text-primary text-xl">paid</span>
              </div>
              <div className="text-2xl font-mono font-black text-white glow-primary">
                {(stats.overview.today_revenue || 0).toLocaleString()}{' '}
                <span className="text-xs font-sans text-on-surface-variant font-normal">{currency}</span>
              </div>
              <div className="text-[11px] text-primary font-bold">
                {stats.overview.today_sessions_count} ta seans yakunlandi
              </div>
            </div>

            {/* O'yin Vaqti Ulushi */}
            <div className="p-5 rounded-3xl bg-surface-container border border-surface-container-highest space-y-2 shadow-md hover:border-emerald-400/40 transition-colors">
              <div className="text-xs font-bold text-on-surface-variant flex items-center justify-between">
                <span>O'yin Vaqti Tushumi</span>
                <span className="material-symbols-outlined text-emerald-400 text-xl">schedule</span>
              </div>
              <div className="text-2xl font-mono font-black text-emerald-400">
                {(stats.overview.today_time_amount || 0).toLocaleString()}{' '}
                <span className="text-xs font-sans text-on-surface-variant font-normal">{currency}</span>
              </div>
              <div className="text-[11px] text-on-surface-variant">
                Stollar ijara daromadi
              </div>
            </div>

            {/* Bar Savdosi Ulushi */}
            <div className="p-5 rounded-3xl bg-surface-container border border-surface-container-highest space-y-2 shadow-md hover:border-tertiary/40 transition-colors">
              <div className="text-xs font-bold text-on-surface-variant flex items-center justify-between">
                <span>Bar & Snack Savdosi</span>
                <span className="material-symbols-outlined text-tertiary text-xl">local_cafe</span>
              </div>
              <div className="text-2xl font-mono font-black text-tertiary glow-tertiary">
                {(stats.overview.today_bar_amount || 0).toLocaleString()}{' '}
                <span className="text-xs font-sans text-on-surface-variant font-normal">{currency}</span>
              </div>
              <div className="text-[11px] text-on-surface-variant">
                Ichimlik va oshxona savdosi
              </div>
            </div>

            {/* O'rtacha Bandlik */}
            <div className="p-5 rounded-3xl bg-surface-container border border-surface-container-highest space-y-2 shadow-md hover:border-blue-400/40 transition-colors">
              <div className="text-xs font-bold text-on-surface-variant flex items-center justify-between">
                <span>Klub Bandligi (Hozir)</span>
                <span className="material-symbols-outlined text-blue-400 text-xl">pie_chart</span>
              </div>
              <div className="text-2xl font-display font-black text-white">
                {stats.tables_summary.occupancy_rate}%
              </div>
              <div className="text-[11px] text-on-surface-variant">
                {stats.tables_summary.occupied} band / {stats.tables_summary.total} jami stol
              </div>
            </div>
          </div>

          {/* 2. Main Chart: Daromadlar Dinamikasi (Area Chart) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface-container border border-surface-container-highest space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-black text-base sm:text-lg text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">show_chart</span>
                  <span>Daromadlar Dinamikasi ({daysRange} Kunlik Tahlil)</span>
                </h3>
                <p className="text-xs text-on-surface-variant">
                  O'yin stollari ijara tushumi va Bar savdosi taqqoslanishi
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary glow-primary"></span>
                  <span className="text-white font-bold">O'yin Vaqti</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-tertiary glow-tertiary"></span>
                  <span className="text-white font-bold">Bar Savdosi</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4edea3" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#4edea3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb95f" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ffb95f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262a34" />
                  <XAxis dataKey="date" stroke="#86948a" fontSize={11} />
                  <YAxis stroke="#86948a" fontSize={11} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(28, 31, 41, 0.95)',
                      borderColor: '#31353f',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="time_revenue"
                    name="O'yin Vaqti"
                    stroke="#4edea3"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTime)"
                  />
                  <Area
                    type="monotone"
                    dataKey="bar_revenue"
                    name="Bar Savdosi"
                    stroke="#ffb95f"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBar)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Two-Column Analytics: Peak Hours & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours Chart */}
            <div className="p-4 sm:p-6 rounded-3xl bg-surface-container border border-surface-container-highest space-y-4 shadow-xl">
              <div>
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-xl">schedule</span>
                  <span>24 Soatlik Gavjumlik (Peak Hours)</span>
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Klubning kun davomidagi eng tirband soatlari
                </p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262a34" />
                    <XAxis dataKey="hour" stroke="#86948a" fontSize={10} interval={2} />
                    <YAxis stroke="#86948a" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(28, 31, 41, 0.95)',
                        borderColor: '#31353f',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="sessions_count" name="Seanslar Soni" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Donut */}
            <div className="p-4 sm:p-6 rounded-3xl bg-surface-container border border-surface-container-highest space-y-4 shadow-xl">
              <div>
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-xl">donut_large</span>
                  <span>To'lov Turlari Taqsimoti</span>
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Mijozlar to'lovlarining usullar bo'yicha taqsimoti
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-7 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => `${Number(val).toLocaleString()} UZS`}
                        contentStyle={{
                          backgroundColor: 'rgba(28, 31, 41, 0.95)',
                          borderColor: '#31353f',
                          borderRadius: '16px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-5 space-y-2 text-xs">
                  {paymentMethods.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-white font-semibold truncate max-w-[100px]">{item.label}</span>
                      </div>
                      <span className="font-mono font-bold text-on-surface">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Top Selling Bar Products & Margin Table */}
          <div className="p-4 sm:p-6 rounded-3xl bg-surface-container border border-surface-container-highest space-y-4 shadow-xl">
            <div>
              <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">leaderboard</span>
                <span>Eng Ko'p Sotilgan Bar Mahsulotlari va Sof Marja</span>
              </h3>
              <p className="text-xs text-on-surface-variant">
                Qaysi ichimlik va yeguliklar eng ko'p sof foyda keltirmoqda
              </p>
            </div>

            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-surface-container-highest bg-surface-container-high/60 text-on-surface-variant font-bold">
                      <th className="p-3 pl-4">Mahsulot</th>
                      <th className="p-3">Kategoriya</th>
                      <th className="p-3">Sotilgan Soni</th>
                      <th className="p-3">Jami Tushum</th>
                      <th className="p-3">Tannarx (Xarajat)</th>
                      <th className="p-3">Sof Foyda</th>
                      <th className="p-3 pr-4">Rentabellik (Marja)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest/60">
                    {topProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="p-3 pl-4 font-bold text-white">{p.name}</td>
                        <td className="p-3 text-on-surface-variant">{p.category}</td>
                        <td className="p-3 font-mono font-bold text-white">{p.total_sold} dona</td>
                        <td className="p-3 font-mono text-primary font-bold">
                          {p.revenue.toLocaleString()} so'm
                        </td>
                        <td className="p-3 font-mono text-on-surface-variant">
                          {p.cost.toLocaleString()} so'm
                        </td>
                        <td className="p-3 font-mono font-black text-emerald-400">
                          +{p.profit.toLocaleString()} so'm
                        </td>
                        <td className="p-3 pr-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/15 text-primary border border-primary/30 glow-primary">
                            {p.margin_percent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                Bar mahsulotlari savdosi bo'yicha ma'lumotlar to'planmoqda...
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};
