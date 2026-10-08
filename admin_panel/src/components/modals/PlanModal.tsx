import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import type { SubscriptionPlan } from '../../types';
import { motion, type Variants } from 'framer-motion';
import { Gem, X, CheckCircle2 } from 'lucide-react';

interface Props {
  plan: SubscriptionPlan | null;
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

export const PlanModal: React.FC<Props> = ({ plan, onClose }) => {
  const { createPlan, updatePlan } = useAdminStore();
  
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [pricePerMonth, setPricePerMonth] = useState<string>('');
  const [maxTables, setMaxTables] = useState<string | number>(10);
  const [maxStaff, setMaxStaff] = useState<string | number>(3);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setCode(plan.code);
      setPricePerMonth(plan.price_per_month.toString());
      setMaxTables(plan.max_tables);
      setMaxStaff(plan.max_staff);
      setIsActive(plan.is_active);
    } else {
      setName('');
      setCode('');
      setPricePerMonth('150000');
      setMaxTables(10);
      setMaxStaff(3);
      setIsActive(true);
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tablesNum = parseInt(String(maxTables), 10);
    if (isNaN(tablesNum) || tablesNum < 1) {
      alert("Maksimal stollar soni kamida 1 bo'lishi shart! (0 yoki bo'sh qoldirib bo'lmaydi)");
      return;
    }

    const staffNum = parseInt(String(maxStaff), 10);
    if (isNaN(staffNum) || staffNum < 1) {
      alert("Maksimal xodimlar soni kamida 1 bo'lishi shart! (0 yoki bo'sh qoldirib bo'lmaydi)");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name,
      code: code || name.toLowerCase().replace(/\s+/g, '_'),
      price_per_month: parseFloat(pricePerMonth) || 0,
      max_tables: tablesNum,
      max_staff: staffNum,
      is_active: isActive,
    };

    let ok = false;
    if (plan) {
      ok = await updatePlan(plan.id, payload);
    } else {
      ok = await createPlan(payload);
    }

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
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 glow-cyan">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base leading-tight">
                {plan ? 'Tarifni Tahrirlash' : 'Yangi SaaS Tarifi'}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Klublar uchun oylik to'lov shartlari
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
          <div>
            <label className="text-on-surface-variant font-bold block mb-1">Tarif Nomi</label>
            <input
              type="text"
              required
              placeholder="Masalan: Standart, Pro Gaming, VIP Lounge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-on-surface-variant font-bold block mb-1">Kod (Slug)</label>
              <input
                type="text"
                required
                placeholder="standard_plan"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-on-surface-variant font-bold block mb-1">Oylik Narxi (UZS)</label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="200000"
                value={pricePerMonth}
                onChange={(e) => setPricePerMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-on-surface-variant font-bold block mb-1">Maks. Stollar soni</label>
              <input
                type="number"
                required
                min="1"
                max="500"
                placeholder="10"
                value={maxTables}
                onChange={(e) => setMaxTables(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              {(maxTables === '' || Number(maxTables) < 1) && (
                <p className="text-[10px] text-amber-400 mt-1 font-medium">
                  ⚠️ Kamida 1 ta bo'lishi shart (0 qo'yib bo'lmaydi)
                </p>
              )}
            </div>
            <div>
              <label className="text-on-surface-variant font-bold block mb-1">Maks. Xodimlar soni</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                placeholder="3"
                value={maxStaff}
                onChange={(e) => setMaxStaff(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              {(maxStaff === '' || Number(maxStaff) < 1) && (
                <p className="text-[10px] text-amber-400 mt-1 font-medium">
                  ⚠️ Kamida 1 ta bo'lishi shart (0 qo'yib bo'lmaydi)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest/60">
            <div>
              <div className="font-bold text-white">Tarif Faol (Active)</div>
              <div className="text-[10px] text-on-surface-variant">Mijozlar to'lov uchun tanlay oladi</div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-400 focus:ring-cyan-400 accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-cyan-400/20 transition-all flex items-center justify-center gap-2 glow-cyan active:scale-95"
            >
              {isSubmitting ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{plan ? "O'zgarishlarni Saqlash" : "Tarifni Yaratish"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
