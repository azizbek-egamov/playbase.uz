import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export const BillingView: React.FC = () => {
  const { currentClub, plans, initApp } = useAppStore();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activePayment, setActivePayment] = useState<{
    plan: any;
    checkoutUrl: string;
    transactionId: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchTxs = async () => {
    try {
      const res = await apiClient.get('/billing/transactions/');
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch billing txs:', err);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [currentClub]);

  const handleCheckout = async (planId: string) => {
    triggerHaptic('medium');
    setIsProcessing(true);
    try {
      const plan = plans.find((p) => p.id === planId);
      const res = await apiClient.post('/billing/checkout/', {
        plan_id: planId,
        provider: 'CLICK'
      });
      
      const checkoutUrl = res.data.checkout_url;
      const transactionId = res.data.transaction_id;

      setActivePayment({
        plan: plan || { name: 'Obuna Tarifi', price_per_month: res.data.amount },
        checkoutUrl,
        transactionId
      });

      // Attempt opening Click URL
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.openLink) {
        tg.openLink(checkoutUrl);
      } else {
        window.open(checkoutUrl, '_blank');
      }

      toast.success("Click to'lov sahifasi yaratildi!");
    } catch (err: any) {
      triggerHaptic('error');
      toast.error(err.response?.data?.detail || "To'lov havolasini yaratishda xatolik yuz berdi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Test simulation handler
  const handleSimulatePayment = async () => {
    if (!activePayment) return;
    setIsSimulating(true);
    triggerHaptic('heavy');
    try {
      // 1. Send Prepare (Action 0)
      await apiClient.post('/billing/click/webhook/', {
        action: '0',
        merchant_trans_id: activePayment.transactionId,
        click_trans_id: 'click_test_' + Date.now(),
        amount: activePayment.plan.price_per_month,
        error: 0
      });

      // 2. Send Complete (Action 1)
      await apiClient.post('/billing/click/webhook/', {
        action: '1',
        merchant_trans_id: activePayment.transactionId,
        merchant_prepare_id: activePayment.transactionId,
        click_trans_id: 'click_test_' + Date.now(),
        amount: activePayment.plan.price_per_month,
        error: 0
      });

      triggerHaptic('success');
      toast.success("Test to'lovi muvaffaqiyatli qabul qilindi! Obuna 30 kunga uzaytirildi.");
      setActivePayment(null);
      await Promise.all([initApp(), fetchTxs()]);
    } catch (err: any) {
      triggerHaptic('error');
      toast.error("Test to'lovini tasdiqlashda xatolik.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Tariflar va SaaS Obuna Boshqaruvi
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          PlayBase boshqaruv platformasi xizmat rejalari va to'lovlar
        </p>
      </div>

      {/* Current Subscription Status Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-surface-container to-surface-container-high border border-primary/30 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-surface uppercase tracking-wider">
                {currentClub?.is_trial ? 'Sinov Davri (Trial)' : 'Faol Obuna'}
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                Muddati: {currentClub?.days_left} kun qoldi
              </span>
            </div>
            <h2 className="font-display font-extrabold text-xl text-white">
              {currentClub?.active_plan_detail?.name || 'Pro Club Tarifi'}
            </h2>
            <p className="text-xs text-on-surface-variant max-w-md">
              Klubingizda barcha modullar (Live Kassa, Bar savdosi, Telegram WebApp, Analitika) to'liq ishlamoqda.
            </p>
          </div>

          <div className="text-left sm:text-right sm:border-l sm:border-surface-container-highest sm:pl-6 flex flex-col items-start sm:items-end justify-center">
            <div className="text-xs text-on-surface-variant mb-2 font-medium">SaaS Obuna To'lovi:</div>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                const targetPlanId = currentClub?.active_plan || (plans.length > 0 ? plans[0].id : '');
                if (targetPlanId) {
                  handleCheckout(targetPlanId);
                } else if (plans.length > 0) {
                  handleCheckout(plans[0].id);
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#008AE6] hover:bg-[#007ACC] text-white flex items-center gap-2 shadow-lg shadow-[#008AE6]/30 transition-all active:scale-95 disabled:opacity-50 glow-cyan"
            >
              <span className="material-symbols-outlined text-base font-bold">payments</span>
              <span>Click orqali to'lash</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.code === 'pro';

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between relative border transition-all duration-300 ${
                isPopular
                  ? 'bg-surface-container-high border-primary ring-2 ring-primary/20 shadow-2xl shadow-primary/10'
                  : 'bg-surface-container border-surface-container-highest'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary text-surface uppercase tracking-widest shadow-md">
                  Eng Ommabop
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-mono font-extrabold text-3xl text-white">
                      {Number(plan.price_per_month).toLocaleString()}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">so'm / oy</span>
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-2.5 pt-4 border-t border-surface-container-highest/60 text-xs">
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary text-base">check</span>
                    <span>Maksimal <b>{plan.max_tables} ta</b> stol boshqaruvi</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary text-base">check</span>
                    <span>Barcha qurilmalardan cheksiz kirish (sinxron)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary text-base">check</span>
                    <span>Telegram WebApp orqali to'liq nazorat</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary text-base">check</span>
                    <span>Bar va Ombor (Sklad) savdosi</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary text-base">check</span>
                    <span>Real-time daromad statistikasi</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-surface-container-highest/60">
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isProcessing}
                  className={`w-full py-3.5 px-4 rounded-xl font-display font-black text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-[#008AE6] hover:bg-[#007ACC] text-white shadow-lg shadow-[#008AE6]/25'
                      : 'bg-surface-container-highest hover:bg-surface-bright text-white border border-surface-container-highest'
                  } active:scale-95 disabled:opacity-50`}
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  <span>{isProcessing ? "Tayyorlanmoqda..." : `${plan.name} uchun Click orqali to'lash`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction History */}
      <div className="bg-surface-container border border-surface-container-highest rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-container-high border-b border-surface-container-highest font-bold text-sm text-white">
          SaaS To'lovlar Tarixi
        </div>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-container-highest bg-surface-container-lowest/60 text-on-surface-variant font-semibold">
                  <th className="p-3 pl-5">Sana</th>
                  <th className="p-3">Tarif</th>
                  <th className="p-3">Summa</th>
                  <th className="p-3">Provayder</th>
                  <th className="p-3 pr-5">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/60">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3 pl-5 font-mono text-on-surface-variant">
                      {new Date(tx.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="p-3 font-semibold text-white">{tx.plan_name}</td>
                    <td className="p-3 font-mono font-bold text-primary">
                      {parseFloat(tx.amount).toLocaleString()} so'm
                    </td>
                    <td className="p-3 font-bold">{tx.provider}</td>
                    <td className="p-3 pr-5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-on-surface-variant">
            To'lovlar tarixi mavjud emas.
          </div>
        )}
      </div>

      {/* Active Click Payment Modal */}
      <AnimatePresence>
        {activePayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setActivePayment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container border border-surface-container-highest w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#008AE6]/20 border border-[#008AE6]/40 flex items-center justify-center text-[#008AE6] font-bold">
                    <span className="material-symbols-outlined text-2xl">credit_score</span>
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-white">Click To'lov Oynasi</h3>
                    <p className="text-xs text-on-surface-variant">SaaS Obuna To'lovi</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePayment(null)}
                  className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-white"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Amount & Plan Card */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-highest space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Tanlangan tarif:</span>
                  <span className="font-bold text-white">{activePayment.plan?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">To'lov summasi:</span>
                  <span className="font-mono font-black text-base text-primary">
                    {Number(activePayment.plan?.price_per_month).toLocaleString()} so'm
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-surface-container-highest/60 text-on-surface-variant">
                  <span>Tranzaksiya ID:</span>
                  <span className="font-mono text-[10px] text-cyan-400">{activePayment.transactionId.slice(0, 8)}...</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-2xl bg-[#008AE6]/10 border border-[#008AE6]/20 text-xs text-[#008AE6] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">info</span>
                  <span>Click to'lov sahifasi ochildi</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Agar yangi oyna ochilmagan bo'lsa, quyidagi tugmani bosing yoki to'lovni test qilish uchun simulyatsiyadan foydalaning.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <a
                  href={activePayment.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#008AE6] hover:bg-[#007ACC] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#008AE6]/20 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Click To'lov Sahifasini Ochish</span>
                </a>

                {/* Test Simulation Button */}
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleSimulatePayment}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${isSimulating ? 'animate-spin' : ''}`}>
                    {isSimulating ? 'refresh' : 'check_circle'}
                  </span>
                  <span>{isSimulating ? "Test to'lovi yuborilmoqda..." : "Test To'lovini Tasdiqlash (Simulyatsiya)"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
