import React, { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import type { SuperAdminClub } from '../../types';
import { motion, type Variants } from 'framer-motion';
import { CalendarPlus, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  club: SuperAdminClub | null;
  onClose: () => void;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
  exit: { opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.15 } },
};

export const ExtendSubscriptionModal: React.FC<Props> = ({ club, onClose }) => {
  const { extendSubscription, plans } = useAdminStore();
  const [days, setDays] = useState<string | number>(30);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(club?.active_plan || '');
  const [isTrial, setIsTrial] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!club) return null;

  const presets = [
    { label: '+7 kun (Trial)', value: 7, trial: true },
    { label: '+30 kun (1 oy)', value: 30, trial: false },
    { label: '+90 kun (3 oy)', value: 90, trial: false },
    { label: '+180 kun (6 oy)', value: 180, trial: false },
    { label: '+365 kun (1 yil)', value: 365, trial: false },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const daysNum = parseInt(String(days), 10);
    if (isNaN(daysNum) || daysNum < 1) {
      alert("Qo'shiladigan kunlar soni kamida 1 bo'lishi shart! (0 yoki bo'sh qoldirib bo'lmaydi)");
      return;
    }

    setIsSubmitting(true);
    const ok = await extendSubscription(club.id, {
      days: daysNum,
      plan_id: selectedPlanId || undefined,
      is_trial: isTrial,
    });
    setIsSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden"
    >
      <motion.div
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container border border-surface-container-highest w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-surface-container-highest flex items-center justify-between bg-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary glow-primary">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base leading-tight">
                Obunani Uzaytirish
              </h3>
              <p className="text-xs text-on-surface-variant font-medium truncate max-w-[220px]">
                {club.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="text-on-surface-variant font-bold block mb-2">Tezkor muddatlar</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setDays(p.value);
                    setIsTrial(p.trial);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                    Number(days) === p.value
                      ? 'bg-primary text-surface border-primary shadow-md glow-primary'
                      : 'bg-surface-container-lowest border-surface-container-highest text-on-surface hover:border-primary/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Days Input */}
          <div>
            <label className="text-on-surface-variant font-bold block mb-1">
              Qo'shiladigan kunlar soni
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              placeholder="30"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {(days === '' || Number(days) < 1) && (
              <p className="text-[10px] text-amber-400 mt-1 font-medium">
                ⚠️ Kamida 1 kun bo'lishi shart (0 qo'yib bo'lmaydi)
              </p>
            )}
          </div>

          {/* Subscription Plan Select */}
          <div>
            <label className="text-on-surface-variant font-bold block mb-1">
              Biriktiriladigan SaaS Tarifi
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary"
            >
              <option value="">Joriy tarifni o'zgartirmaslik</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({Number(plan.price_per_month).toLocaleString()} UZS/oy)
                </option>
              ))}
            </select>
          </div>

          {/* Is Trial Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest/60">
            <div>
              <div className="font-bold text-white">Sinov (Trial) deb belgilash</div>
              <div className="text-[10px] text-on-surface-variant">Bepul sinov statusi beriladi</div>
            </div>
            <input
              type="checkbox"
              checked={isTrial}
              onChange={(e) => setIsTrial(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 glow-primary active:scale-95"
            >
              {isSubmitting ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Obunani Tasdiqlash (+{days} kun)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
