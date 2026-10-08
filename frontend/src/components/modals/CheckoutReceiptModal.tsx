import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { PaymentType } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { formatMoney, parseMoney } from '../../utils/formatters';
import { motion, type Variants } from 'framer-motion';
import confetti from 'canvas-confetti';

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 25 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 20,
    transition: { duration: 0.18, ease: 'easeInOut' },
  },
};

export const CheckoutReceiptModal: React.FC = () => {
  const { selectedTable, selectedSession, closeModal, stopSession, currentClub } = useAppStore();

  const [paymentType, setPaymentType] = useState<PaymentType>('CASH');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lock body scroll
  useScrollLock(Boolean(selectedTable && selectedSession), closeModal);

  if (!selectedTable || !selectedSession) return null;

  const timeAmount = selectedSession.current_time_amount || selectedSession.time_amount || 0;
  const barAmount = selectedSession.bar_amount || 0;
  const totalRaw = timeAmount + barAmount;
  const finalTotal = Math.max(0, totalRaw - discountAmount);

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeAmount = Math.max(0, cashGivenNum - finalTotal);

  const handleFinish = async () => {
    setIsSubmitting(true);
    triggerHaptic('heavy');

    const result = await stopSession(selectedSession.id, {
      payment_type: paymentType,
      discount_amount: discountAmount,
      note: note || undefined
    });
    setIsSubmitting(false);

    if (result) {
      triggerHaptic('success');
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      closeModal();
    } else {
      triggerHaptic('error');
    }
  };

  /* DISABLED_RECEIPT_PRINT: Chek chop etish funksiyasi
  const handlePrint = () => {
    triggerHaptic('light');
    window.print();
  };
  */

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden"
    >
      <motion.div
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container border border-surface-container-highest w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] pb-[env(safe-area-inset-bottom,0px)]"
      >
          {/* Mobile drag handle */}
          <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mt-3 sm:hidden" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-surface-container-highest/80 flex items-center justify-between bg-surface-container-high/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary glow-primary">
                <span className="material-symbols-outlined text-2xl font-bold">receipt_long</span>
              </div>
              <div>
                <h2 className="font-display font-black text-lg text-white">
                  Kassa Hisob-kitobi
                </h2>
                <div className="text-xs text-on-surface-variant font-mono">
                  {selectedTable.name} • #{selectedTable.number}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                closeModal();
              }}
              className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-white transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 font-sans text-sm">
            {/* Customer */}
            {selectedSession.customer_name && (
              <div className="text-xs text-on-surface-variant flex items-center justify-between">
                <span className="font-medium">Mijoz:</span>
                <span className="font-bold text-white">{selectedSession.customer_name}</span>
              </div>
            )}

            {/* Breakdown Box */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-highest space-y-2.5 shadow-inner">
              {/* Time spent */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  O'yin vaqti to'lovi:
                </span>
                <span className="font-mono font-bold text-white">
                  {timeAmount.toLocaleString()} so'm
                </span>
              </div>

              {/* Bar Orders */}
              {barAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm text-tertiary">local_bar</span>
                    Bar & Mahsulotlar:
                  </span>
                  <span className="font-mono font-bold text-tertiary">
                    +{barAmount.toLocaleString()} so'm
                  </span>
                </div>
              )}

              {/* Discount */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container-highest/60">
                <span className="text-on-surface-variant font-medium">Chegirma:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={discountAmount ? formatMoney(discountAmount) : ''}
                    onChange={(e) => setDiscountAmount(parseMoney(e.target.value))}
                    className="w-28 px-2.5 py-1 rounded-xl bg-surface-container border border-surface-container-highest text-right font-mono text-xs text-white focus:outline-none focus:border-primary font-bold"
                  />
                  <span className="text-xs text-on-surface-variant font-medium">so'm</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between pt-2 border-t border-surface-container-highest">
                <span className="font-bold text-white text-sm uppercase tracking-wide">Jami To'lov:</span>
                <div className="text-right">
                  <span className="font-mono font-black text-2xl text-primary glow-primary">
                    {finalTotal.toLocaleString()}
                  </span>
                  <span className="text-xs text-on-surface-variant font-sans ml-1 font-medium">
                    {currentClub?.currency || 'UZS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                To'lov Usuli
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CASH', label: 'Naqd Pul', icon: 'payments' },
                  { id: 'CARD', label: 'Uzcard / Humo', icon: 'credit_card' },
                  { id: 'TRANSFER', label: 'Click / Payme', icon: 'qr_code_scanner' },
                  { id: 'DEBT', label: 'Nasiya / Qarz', icon: 'assignment_late' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPaymentType(m.id as PaymentType);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
                      paymentType === m.id
                        ? 'bg-primary/20 border-primary text-primary font-black shadow-sm glow-primary'
                        : 'bg-surface-container-lowest border-surface-container-highest text-on-surface hover:border-primary/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Change Calculator */}
            {paymentType === 'CASH' && (
              <div className="p-3.5 rounded-2xl bg-surface-container-high border border-surface-container-highest space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">Mijoz bergan naqd:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={formatMoney(finalTotal)}
                    value={cashGiven ? formatMoney(cashGiven) : ''}
                    onChange={(e) => setCashGiven(parseMoney(e.target.value) ? parseMoney(e.target.value).toString() : '')}
                    className="w-36 px-2.5 py-1.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-right font-mono font-black text-white text-sm focus:outline-none focus:border-primary tracking-wide"
                  />
                </div>
                {cashGivenNum > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container-highest">
                    <span className="text-on-surface-variant font-medium">Qaytim (Sdacha):</span>
                    <span className="font-mono font-black text-tertiary text-sm glow-tertiary">
                      {changeAmount.toLocaleString()} so'm
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Optional Note */}
            <div>
              <input
                type="text"
                placeholder="Izoh (ixtiyoriy)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 border-t border-surface-container-highest bg-surface-container-high/60 space-y-2 shrink-0">
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 glow-primary"
            >
              {isSubmitting ? (
                <span>Yopilmoqda...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg font-bold">check_circle</span>
                  <span>To'lovni Qabul Qilish va Yopish</span>
                </>
              )}
            </button>

            {/* DISABLED_RECEIPT_PRINT_BUTTON: Chek chop etish tugmasi vaqtincha o'chirildi
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Kvitansiyani Chop Etish</span>
            </button>
            */}
          </div>
        </motion.div>
      </motion.div>
  );
};
