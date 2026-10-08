import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Header } from '../components/Header';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { transactions, fetchTransactions, isLoading } = useAdminStore();
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchTransactions({
      provider: providerFilter || undefined,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    });
  }, [providerFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions({
      provider: providerFilter || undefined,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    });
  };

  // Django DecimalField JSON da string sifatida keladi: "390000.00"
  // reduce() da Number() bilan int/float ga aylantirish shart
  const totalAmount = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim pb-12">
      <Header
        title="Moliya & SaaS To'lovlar Jurnali"
        subtitle="Mijozlar tomonidan amalga oshirilgan barcha Payme va Click to'lovlari"
        onRefresh={() =>
          fetchTransactions({
            provider: providerFilter || undefined,
            status: statusFilter || undefined,
            search: searchQuery || undefined,
          })
        }
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Summary Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-surface-container via-surface-container-high to-surface-container border border-surface-container-highest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              Filtrlangan Muvaffaqiyatli Tushum
            </span>
            <div className="font-display font-black text-3xl sm:text-4xl text-white">
              {totalAmount.toLocaleString()}{' '}
              <span className="text-sm font-mono text-primary font-bold">UZS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-surface-container-lowest font-mono font-bold text-xs text-on-surface border border-surface-container-highest">
              {transactions.length} ta tranzaksiya
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-white text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Barcha Provayderlar</option>
              <option value="PAYME">Payme</option>
              <option value="CLICK">Click</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-white text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Barcha Statuslar</option>
              <option value="SUCCESS">Muvaffaqiyatli (SUCCESS)</option>
              <option value="PENDING">Kutilmoqda (PENDING)</option>
              <option value="FAILED">Xatolik (FAILED)</option>
            </select>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Klub nomi, egasi, tranzaksiya ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-white text-xs focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-on-surface-variant" />
          </form>
        </div>

        {/* Transactions Table */}
        <div className="bg-surface-container border border-surface-container-highest rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-container-highest bg-surface-container-high/60 text-on-surface-variant font-bold">
                  <th className="p-4 font-semibold">Tranzaksiya ID</th>
                  <th className="p-4 font-semibold">Klub Nomi</th>
                  <th className="p-4 font-semibold">Biznes Egasi</th>
                  <th className="p-4 font-semibold">Tarif</th>
                  <th className="p-4 font-semibold">Summa</th>
                  <th className="p-4 font-semibold">Provayder</th>
                  <th className="p-4 font-semibold">Holati</th>
                  <th className="p-4 font-semibold">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-on-surface-variant">
                      To'lovlar yuklanmoqda...
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-on-surface-variant truncate max-w-[100px]">
                        #{tx.id.substring(0, 8)}
                      </td>

                      <td className="p-4 font-bold text-white">{tx.club_name || 'Klub'}</td>

                      <td className="p-4">
                        <div className="font-bold text-on-surface">{tx.owner_name || 'Noma\'lum'}</div>
                        {tx.owner_phone && (
                          <div className="text-[10px] text-on-surface-variant font-mono">{tx.owner_phone}</div>
                        )}
                      </td>

                      <td className="p-4 font-medium text-white">{tx.plan_name || 'Standart SaaS'}</td>

                      <td className="p-4 font-mono font-bold text-sm text-white">
                        {Number(tx.amount).toLocaleString()} UZS
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                            tx.provider === 'PAYME'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-primary/20 text-primary border border-primary/30'
                          }`}
                        >
                          {tx.provider}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                            tx.status === 'SUCCESS'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="p-4 text-on-surface-variant font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleString('uz-UZ')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-on-surface-variant">
                      Tranzaksiyalar topilmadi.
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
