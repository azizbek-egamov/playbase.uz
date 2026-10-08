import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useScrollLock } from '../../hooks/useScrollLock';
import { LiveTimer } from '../LiveTimer';
import { toNum } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';
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

export const ActiveSessionModal: React.FC = () => {
  const {
    selectedTable,
    selectedSession,
    closeModal,
    openModal,
    products,
    addOrderToSession,
    removeOrderFromSession,
    extendSession,
    transferTable,
    liveTables,
    currentClub
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'EXTEND' | 'TRANSFER'>('ORDERS');
  const [extendMins, setExtendMins] = useState<number>(30);
  const [selectedTargetTable, setSelectedTargetTable] = useState<string>('');

  // Lock body scroll
  useScrollLock(Boolean(selectedTable && selectedSession), closeModal);

  if (!selectedTable || !selectedSession) return null;

  const idleTables = liveTables.filter(t => t.status === 'IDLE');

  const handleAddProduct = async (productId: string) => {
    triggerHaptic('light');
    await addOrderToSession(selectedSession.id, productId, 1);
  };

  const handleRemoveOrder = async (orderId: string) => {
    triggerHaptic('medium');
    await removeOrderFromSession(selectedSession.id, orderId);
  };

  const handleExtend = async () => {
    triggerHaptic('heavy');
    await extendSession(selectedSession.id, extendMins);
  };

  const handleTransfer = async () => {
    if (!selectedTargetTable) return;
    triggerHaptic('heavy');
    await transferTable(selectedSession.id, selectedTargetTable);
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
        className="bg-surface-container border border-surface-container-highest w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] pb-[env(safe-area-inset-bottom,0px)]"
      >
          {/* Mobile drag handle */}
          <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mt-3 sm:hidden" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-surface-container-highest/80 flex items-center justify-between bg-surface-container-high/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 glow-rose">
                <span className="material-symbols-outlined text-2xl animate-pulse">timer</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-black text-lg text-white">
                    {selectedTable.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    BAND
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  {selectedTable.zone_name} • {selectedTable.hourly_rate.toLocaleString()} so'm/soat
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

          {/* Live Info Banner */}
          <div className="p-4 bg-surface-container-lowest/90 border-b border-surface-container-highest flex items-center justify-between shrink-0 shadow-inner">
            <div className="space-y-0.5">
              <div className="text-[11px] text-on-surface-variant font-semibold">
                {selectedSession.is_open_ended ? "O'tgan vaqt:" : "Qolgan vaqt:"}
              </div>
              <LiveTimer
                startTime={selectedSession.start_time}
                isCountDown={!selectedSession.is_open_ended}
                plannedEndTime={selectedSession.planned_end_time}
                className="text-lg font-black text-white font-mono"
              />
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-[11px] text-on-surface-variant font-semibold">Joriy hisob:</div>
              <div>
                <span className="font-mono font-black text-xl text-tertiary glow-tertiary">
                  {toNum(selectedSession.current_total_amount || 0).toLocaleString()}
                </span>
                <span className="text-xs text-on-surface-variant ml-1 font-sans">
                  {currentClub?.currency || 'UZS'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-surface-container-highest bg-surface-container-low px-4 pt-2 gap-2 shrink-0">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('ORDERS');
              }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'ORDERS'
                  ? 'border-primary text-primary glow-primary'
                  : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">local_bar</span>
              <span>Bar & Buyurtmalar</span>
              {selectedSession.orders && selectedSession.orders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-surface font-black">
                  {selectedSession.orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('EXTEND');
              }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'EXTEND'
                  ? 'border-primary text-primary glow-primary'
                  : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">more_time</span>
              <span>Vaqt Qo'shish</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('TRANSFER');
              }}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'TRANSFER'
                  ? 'border-primary text-primary glow-primary'
                  : 'border-transparent text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">swap_horiz</span>
              <span>Stolni Ko'chirish</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* TAB 1: ORDERS */}
            {activeTab === 'ORDERS' && (
              <div className="space-y-4">
                {selectedSession.orders && selectedSession.orders.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Qo'shilgan Mahsulotlar:
                    </div>
                    <div className="space-y-1.5">
                      {selectedSession.orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-2.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{order.product_name}</div>
                            <div className="text-on-surface-variant font-mono text-[11px]">
                              {order.quantity} × {toNum(order.unit_price).toLocaleString()} = {toNum(order.total_price).toLocaleString()} so'm
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveOrder(order.id)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="O'chirish"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-on-surface-variant">
                    Hozircha bar buyurtmalari qo'shilmagan.
                  </div>
                )}

                {/* Quick Add Catalog */}
                <div className="space-y-2 pt-2 border-t border-surface-container-highest/60">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Katalogdan Tezkor Qo'shish:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleAddProduct(product.id)}
                        className="p-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest border border-surface-container-highest text-left flex items-center justify-between transition-colors group active:scale-95"
                      >
                        <div className="truncate pr-1">
                          <div className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                            {product.name}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-tertiary">
                            {toNum(product.selling_price).toLocaleString()} so'm
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-primary text-base shrink-0">add_circle</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EXTEND */}
            {activeTab === 'EXTEND' && (
              <div className="space-y-4 py-2">
                <p className="text-xs text-on-surface-variant font-medium">
                  Seans vaqtini uzaytirish uchun quyidagi tugmalardan birini tanlang:
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[15, 30, 60, 90, 120, 180].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        triggerHaptic('light');
                        setExtendMins(mins);
                      }}
                      className={`py-3 rounded-2xl text-xs font-black border transition-all active:scale-95 ${
                        extendMins === mins
                          ? 'bg-primary text-surface border-primary shadow-md glow-primary font-black'
                          : 'bg-surface-container-lowest border-surface-container-highest text-white hover:border-primary/50'
                      }`}
                    >
                      +{mins} daqiqa
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleExtend}
                  className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm transition-all active:scale-95 glow-primary"
                >
                  +{extendMins} daqiqa Qo'shish
                </button>
              </div>
            )}

            {/* TAB 3: TRANSFER */}
            {activeTab === 'TRANSFER' && (
              <div className="space-y-4 py-2">
                <p className="text-xs text-on-surface-variant font-medium">
                  Mijozni boshqa bo'sh stolga ko'chirish:
                </p>
                {idleTables.length > 0 ? (
                  <div className="space-y-2">
                    {idleTables.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedTargetTable(t.id);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          selectedTargetTable === t.id
                            ? 'bg-primary/15 border-primary text-white font-black glow-primary'
                            : 'bg-surface-container-lowest border-surface-container-highest text-on-surface hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                          <span className="font-bold text-sm">{t.name}</span>
                          <span className="text-xs text-on-surface-variant font-mono">
                            ({t.zone_name})
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-primary">
                          {toNum(t.hourly_rate).toLocaleString()} so'm/soat
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={handleTransfer}
                      disabled={!selectedTargetTable}
                      className="w-full mt-3 py-3.5 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm transition-all disabled:opacity-50 active:scale-95 glow-primary"
                    >
                      Stolni Ko'chirishni Tasdiqlash
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-rose-400 font-medium">
                    Hozirda klubda bo'sh stollar mavjud emas.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-surface-container-highest bg-surface-container-high/60 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                openModal('CHECKOUT', selectedTable, selectedSession);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-display font-black text-sm tracking-wide shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 active:scale-95 glow-rose"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span>Hisob-kitob qilish va Seansni Yakunlash</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
  );
};
