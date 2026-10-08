import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useScrollLock } from '../../hooks/useScrollLock';
import { triggerHaptic } from '../../utils/haptics';
import { cleanUzPhone } from '../../utils/formatters';
import { UzPhoneInput } from '../ui/UzPhoneInput';
import toast from 'react-hot-toast';
import { motion, type Variants } from 'framer-motion';

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

export const NewSessionModal: React.FC = () => {
  const { selectedTable, closeModal, startSession, currentClub } = useAppStore();

  const [isOpenEnded, setIsOpenEnded] = useState<boolean>(true);
  const [durationMinutes, setDurationMinutes] = useState<string | number>(60);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lock body scroll while modal is open & handle Esc
  useScrollLock(Boolean(selectedTable), closeModal);

  if (!selectedTable) return null;

  // Presets
  const presets = [
    { label: '30 daq', value: 30 },
    { label: '1 soat', value: 60 },
    { label: '2 soat', value: 120 },
    { label: '3 soat', value: 180 },
  ];

  const parsedDuration = typeof durationMinutes === 'number' ? durationMinutes : parseInt(durationMinutes, 10) || 0;

  // Calculate estimated time amount
  const estimatedTimeAmount = isOpenEnded
    ? 0
    : Math.round((selectedTable.hourly_rate * (parsedDuration / 60)) / (currentClub?.rounding_unit || 500)) * (currentClub?.rounding_unit || 500);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOpenEnded) {
      const dur = typeof durationMinutes === 'number' ? durationMinutes : parseInt(durationMinutes, 10);
      if (isNaN(dur) || dur < 5) {
        triggerHaptic('error');
        toast.error("O'yin davomiyligi kamida 5 daqiqa bo'lishi shart! (0 yoki bo'sh qoldirib bo'lmaydi)");
        return;
      }
    }

    // If customer entered partial phone, validate full 9 digits
    if (customerPhone.trim() && !cleanUzPhone(customerPhone)) {
      triggerHaptic('error');
      toast.error("Telefon raqami to'liq kiritilishi kerak: +998 (XX) XXX-XX-XX");
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('heavy');

    const cleanPhone = cleanUzPhone(customerPhone);
    const finalDuration = typeof durationMinutes === 'number' ? durationMinutes : parseInt(durationMinutes, 10);

    const success = await startSession({
      table_id: selectedTable.id,
      is_open_ended: isOpenEnded,
      duration_minutes: isOpenEnded ? undefined : finalDuration,
      customer_name: customerName.trim() || undefined,
      customer_phone: cleanPhone || undefined,
    });

    if (success) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
    >
      <motion.div
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container border border-surface-container-highest w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] pb-[env(safe-area-inset-bottom,0px)]"
      >
          {/* Mobile drag handle */}
          <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mt-3 sm:hidden" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-surface-container-highest/80 flex items-center justify-between bg-surface-container-high/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary glow-primary">
                <span className="material-symbols-outlined text-2xl font-bold">sports_esports</span>
              </div>
              <div>
                <h2 className="font-display font-black text-lg text-white">
                  {selectedTable.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTable.zone_color }}></span>
                  <span>{selectedTable.zone_name}</span>
                  <span>•</span>
                  <span className="font-mono text-primary font-bold">
                    {selectedTable.hourly_rate.toLocaleString()} so'm/soat
                  </span>
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

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {/* 1. Rejim tanlash */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Seans Rejimi
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsOpenEnded(true);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    isOpenEnded
                      ? 'bg-primary text-surface shadow-md font-bold glow-primary'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">all_inclusive</span>
                  <span>Cheksiz Vaqt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsOpenEnded(false);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    !isOpenEnded
                      ? 'bg-primary text-surface shadow-md font-bold glow-primary'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">timer</span>
                  <span>Taymer (Fiks)</span>
                </button>
              </div>
            </div>

            {/* 2. Taymer Presets */}
            {!isOpenEnded && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest/60">
                <label className="text-xs font-bold text-on-surface-variant block">
                  O'yin davomiyligini tanlang:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setDurationMinutes(preset.value);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        durationMinutes === preset.value
                          ? 'bg-primary/20 border-primary text-primary font-black glow-primary'
                          : 'bg-surface-container border-surface-container-highest text-on-surface hover:border-primary/40'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant font-medium">Maxsus daqiqa:</span>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="Masalan: 45"
                      className={`w-28 px-3 py-1.5 rounded-xl bg-surface-container border font-mono text-sm focus:outline-none transition-colors ${
                        !isOpenEnded && (durationMinutes === '' || Number(durationMinutes) < 5)
                          ? 'border-amber-500/80 text-amber-300 focus:border-amber-400'
                          : 'border-surface-container-highest text-white focus:border-primary'
                      }`}
                    />
                    <span className="text-xs text-on-surface-variant font-bold">daq</span>
                  </div>
                  {!isOpenEnded && (durationMinutes === '' || Number(durationMinutes) < 5) && (
                    <p className="text-[10px] text-amber-400 font-medium">
                      ⚠️ Belgilangan vaqt kamida 5 daqiqa bo'lishi shart (0 yoki bo'sh qo'yib bo'lmaydi).
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 3. Mijoz ma'lumotlari */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Mijoz ismi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Sardor"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Telefon raqam (ixtiyoriy)
                </label>
                <UzPhoneInput
                  value={customerPhone}
                  onChange={(full) => setCustomerPhone(full)}
                  placeholder="90 123 45 67"
                />
              </div>
            </div>

            {/* 4. Hisoblangan Xulosa */}
            {!isOpenEnded && (
              <div className="p-3.5 rounded-2xl bg-surface-container-high border border-surface-container-highest flex items-center justify-between shadow-inner">
                <div className="text-xs text-on-surface-variant font-medium">
                  Belgilangan vaqt to'lovi:
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-base text-primary glow-primary">
                    {estimatedTimeAmount.toLocaleString()}
                  </span>
                  <span className="text-xs text-on-surface-variant ml-1 font-sans">
                    {currentClub?.currency || 'UZS'}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 glow-primary"
            >
              {isSubmitting ? (
                <span>Ochilmoqda...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg font-bold">play_arrow</span>
                  <span>Stolni Ochish (Boshlash)</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
  );
};
