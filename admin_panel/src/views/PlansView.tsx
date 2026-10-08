import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Header } from '../components/Header';
import { PlanModal } from '../components/modals/PlanModal';
import type { SubscriptionPlan } from '../types';
import {
  Gem,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Building2,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const PlansView: React.FC = () => {
  const { plans, fetchPlans, deletePlan } = useAdminStore();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Haqiqatan ham "${name}" tarifini o'chirmoqchimisiz?`)) {
      await deletePlan(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim pb-12">
      <Header
        title="SaaS Tarif Rejalari"
        subtitle="Mijozlar uchun taqdim etiladigan oylik obuna narxlari va stollar limiti"
        onRefresh={fetchPlans}
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-white text-lg">Mavjud Tarif Rejalari</h3>
            <p className="text-xs text-on-surface-variant font-medium">
              Jami {plans.length} ta tijoriy tarif faol
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-xs tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5 glow-primary active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yangi Tarif Qo'shish</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-3xl border p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${
                plan.is_active
                  ? 'bg-surface-container/90 border-surface-container-highest hover:border-primary/40 shadow-xl'
                  : 'bg-surface-container-lowest/70 border-surface-container-highest/40 opacity-70'
              }`}
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-md">
                    {plan.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      plan.is_active
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {plan.is_active ? 'FAOL' : 'NOFAOL'}
                  </span>
                </div>

                {/* Plan Title & Price */}
                <h4 className="font-display font-black text-xl text-white mb-2">{plan.name}</h4>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="font-display font-black text-3xl text-white">
                    {Number(plan.price_per_month).toLocaleString()}
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono font-bold">UZS / oy</span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 my-5 pt-4 border-t border-surface-container-highest/60 text-xs">
                  <div className="flex items-center gap-2 text-on-surface">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Maksimal {plan.max_tables} tagacha o'yin stollari</span>
                  </div>

                  <div className="flex items-center gap-2 text-on-surface">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Barcha qurilmalardan cheksiz kirish</span>
                  </div>

                  <div className="flex items-center gap-2 text-on-surface">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>Ushbu tarifda {plan.clubs_count || 0} ta klub bor</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-surface-container-highest/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="flex-1 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-white text-xs font-bold transition-all border border-surface-container-highest flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tahrirlash</span>
                </button>

                <button
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all active:scale-95"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Plan Modal (Create / Edit) */}
      <AnimatePresence>
        {(showCreateModal || editingPlan) && (
          <PlanModal
            plan={editingPlan}
            onClose={() => {
              setShowCreateModal(false);
              setEditingPlan(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
