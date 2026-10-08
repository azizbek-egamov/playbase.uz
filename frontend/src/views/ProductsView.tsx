import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import { ProductSkeleton } from '../components/skeletons/AnalyticsSkeleton';
import { triggerHaptic } from '../utils/haptics';
import { formatMoney } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductsView: React.FC = () => {
  const { products, categories, fetchProducts, currentClub } = useAppStore();
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('8000');
  const [sellingPrice, setSellingPrice] = useState<string>('15000');
  const [stockQuantity, setStockQuantity] = useState<string>('50');

  const filteredProducts = products.filter((p) => {
    if (selectedCat === 'ALL') return true;
    return p.category === selectedCat;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerHaptic('error');
      toast.error("Mahsulot nomini kiriting.");
      return;
    }

    const sellPriceNum = parseFloat(sellingPrice);
    if (isNaN(sellPriceNum) || sellPriceNum <= 0) {
      triggerHaptic('error');
      toast.error("Sotish narxi 0 dan katta bo'lishi shart! (0 yoki bo'sh qoldirib bo'lmaydi)");
      return;
    }

    const costPriceNum = costPrice === '' ? 0 : parseFloat(costPrice);
    const stockQtyNum = stockQuantity === '' ? 0 : parseInt(stockQuantity, 10);

    if (stockQtyNum < 0) {
      triggerHaptic('error');
      toast.error("Sklad qoldig'i manfiy bo'lishi mumkin emas.");
      return;
    }

    try {
      triggerHaptic('heavy');
      await apiClient.post('/products/items/', {
        club: currentClub?.id,
        category: categoryId || undefined,
        name: name.trim(),
        cost_price: isNaN(costPriceNum) ? 0 : costPriceNum,
        selling_price: sellPriceNum,
        stock_quantity: isNaN(stockQtyNum) ? 0 : stockQtyNum,
        is_available: true
      });
      triggerHaptic('success');
      toast.success("Yangi mahsulot qo'shildi!");
      setShowAddModal(false);
      setName('');
      setCostPrice('8000');
      setSellingPrice('15000');
      setStockQuantity('50');
      fetchProducts();
    } catch (err: any) {
      triggerHaptic('error');
      toast.error("Mahsulot qo'shishda xatolik.");
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-28 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">inventory_2</span>
            <span>Bar va Mahsulotlar Katalogi</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Klubdagi barcha ichimliklar, snacklar va ombor qoldiqlari
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setShowAddModal(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-fixed text-surface font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm glow-primary active:scale-95"
        >
          <span className="material-symbols-outlined text-base font-bold">add</span>
          <span>Yangi Mahsulot Qo'shish</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedCat('ALL');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedCat === 'ALL'
              ? 'bg-primary text-surface border-primary glow-primary'
              : 'bg-surface-container border-surface-container-highest text-on-surface hover:border-primary/40'
          }`}
        >
          Barchasi ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              triggerHaptic('light');
              setSelectedCat(c.id);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              selectedCat === c.id
                ? 'bg-primary text-surface border-primary glow-primary'
                : 'bg-surface-container border-surface-container-highest text-on-surface hover:border-primary/40'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <ProductSkeleton />
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          <AnimatePresence>
            {filteredProducts.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-3xl bg-surface-container border border-surface-container-highest space-y-3 shadow-md hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                      {p.category_name || 'Boshqa'}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1.5">{p.name}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-surface-container-highest flex items-center justify-center text-tertiary shadow-inner">
                    <span className="material-symbols-outlined text-base">local_cafe</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex items-center justify-between text-on-surface-variant font-medium">
                    <span>Sotish narxi:</span>
                    <span className="font-mono font-black text-white text-sm">
                      {p.selling_price.toLocaleString()} so'm
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Tannarxi:</span>
                    <span className="font-mono text-on-surface-variant font-medium">
                      {p.cost_price.toLocaleString()} so'm
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant pt-1.5 border-t border-surface-container-highest/60">
                    <span>Ombor qoldig'i:</span>
                    <span className={`font-mono font-black ${p.stock_quantity < 10 ? 'text-rose-400' : 'text-primary'}`}>
                      {p.stock_quantity} dona
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-16 text-center bg-surface-container/30 border border-surface-container-highest rounded-3xl p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">inventory_2</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Mahsulotlar topilmadi</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Ushbu toifada mahsulotlar mavjud emas. Yangi mahsulot qo'shish uchun yuqoridagi tugmani bosing.
          </p>
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container border border-surface-container-highest w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            >
              <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto sm:hidden mb-2" />
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-white text-base">Yangi Mahsulot Qo'shish</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-white active:scale-90"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="text-on-surface-variant font-semibold block mb-1">Mahsulot Nomi</label>
                  <input
                    type="text"
                    placeholder="Masalan: Red Bull 0.25L"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-on-surface-variant font-semibold block mb-1">Kategoriya</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Kategoriya tanlang...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-on-surface-variant font-semibold block mb-1">Tannarx (so'm)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={costPrice ? formatMoney(costPrice) : ''}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\s+/g, '').replace(/[^\d]/g, '');
                        setCostPrice(clean);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-on-surface-variant font-semibold block mb-1">Sotish narxi (so'm)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={sellingPrice ? formatMoney(sellingPrice) : ''}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\s+/g, '').replace(/[^\d]/g, '');
                        setSellingPrice(clean);
                      }}
                      className={`w-full px-3 py-2 rounded-xl bg-surface-container-lowest border font-mono focus:outline-none transition-colors ${
                        sellingPrice !== '' && Number(sellingPrice) <= 0
                          ? 'border-amber-500/80 text-amber-300 focus:border-amber-400'
                          : 'border-surface-container-highest text-white focus:border-primary'
                      }`}
                    />
                    {sellingPrice !== '' && Number(sellingPrice) <= 0 && (
                      <p className="text-[10px] text-amber-400 mt-1 font-medium">⚠️ Sotish narxi 0 dan katta bo'lishi shart</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-on-surface-variant font-semibold block mb-1">Dastlabki Sklad Qoldig'i (dona)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono focus:outline-none focus:border-primary"
                  />
                  {stockQuantity !== '' && Number(stockQuantity) < 0 && (
                    <p className="text-[10px] text-amber-400 mt-1 font-medium">⚠️ Sklad qoldig'i manfiy bo'lishi mumkin emas</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-black text-sm glow-primary active:scale-95"
                >
                  Saqlash
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
