import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import type { Product, LiveTableData, BarPaymentType } from '../types';
import { ProductSkeleton } from '../components/skeletons/AnalyticsSkeleton';
import { triggerHaptic } from '../utils/haptics';
import { formatMoney, parseMoney } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
  product: Product;
  quantity: number;
}

export const BarPOSView: React.FC = () => {
  const { products, categories, liveTables, fetchProducts, fetchLiveTables, currentClub } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Mobile cart drawer open/close
  const [mobileCartOpen, setMobileCartOpen] = useState<boolean>(false);

  // Checkout mode: DIRECT (pay on spot) vs ATTACH_TABLE (charge to game table)
  const [posMode, setPosMode] = useState<'DIRECT' | 'ATTACH_TABLE'>('DIRECT');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  // Direct sale payment parameters
  const [paymentType, setPaymentType] = useState<BarPaymentType>('CASH');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Active occupied tables list
  const occupiedTables = liveTables.filter((t: LiveTableData) => t.status === 'OCCUPIED' && t.active_session);

  useEffect(() => {
    fetchProducts();
    fetchLiveTables();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
    }
    return true;
  });

  // Cart actions
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      triggerHaptic('error');
      toast.error("Ushbu mahsulot omborda qolmagan!");
      return;
    }
    triggerHaptic('light');
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error(`Mavjud qoldiqdan (${product.stock_quantity} dona) oshirib bo'lmaydi.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    triggerHaptic('light');
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock_quantity) {
              toast.error("Mavjud qoldiqdan oshirib bo'lmaydi.");
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    triggerHaptic('medium');
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    triggerHaptic('medium');
    setCart([]);
    setDiscountAmount(0);
    setCashGiven('');
    setCustomerName('');
  };

  // Calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeAmount = Math.max(0, cashGivenNum - finalTotal);

  // Submit Direct Sale
  const handleDirectSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    triggerHaptic('heavy');

    try {
      const payload = {
        club_id: currentClub?.id,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_type: paymentType,
        discount_amount: discountAmount,
        customer_name: customerName || undefined,
      };

      await apiClient.post('/products/pos/quick-sale/', payload);
      triggerHaptic('success');
      toast.success("Bar savdosi muvaffaqiyatli amalga oshirildi!");
      clearCart();
      setMobileCartOpen(false);
      await fetchProducts();
    } catch (err: any) {
      triggerHaptic('error');
      toast.error(err.response?.data?.detail || "Savdoni amalga oshirishda xatolik.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Attach to Game Table
  const handleAttachToTable = async () => {
    if (cart.length === 0) return;
    if (!selectedSessionId) {
      triggerHaptic('error');
      toast.error("Iltimos, mahsulot yoziladigan stolni tanlang.");
      return;
    }

    setIsProcessing(true);
    triggerHaptic('heavy');
    try {
      const payload = {
        session_id: selectedSessionId,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      await apiClient.post('/products/pos/attach-to-session/', payload);
      triggerHaptic('success');
      toast.success("Mahsulotlar stol hisobiga muvaffaqiyatli qo'shildi!");
      clearCart();
      setMobileCartOpen(false);
      await Promise.all([fetchProducts(), fetchLiveTables()]);
    } catch (err: any) {
      triggerHaptic('error');
      toast.error(err.response?.data?.detail || "Stolga biriktirishda xatolik.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Render the Cart & Checkout Panel content
  const renderCartPanel = () => (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setPosMode('DIRECT');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            posMode === 'DIRECT'
              ? 'bg-primary text-surface shadow-md glow-primary font-bold'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">payments</span>
          <span>Joyida Sotish</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setPosMode('ATTACH_TABLE');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            posMode === 'ATTACH_TABLE'
              ? 'bg-primary text-surface shadow-md glow-primary font-bold'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base">sports_esports</span>
          <span>Stolga Yozish</span>
        </button>
      </div>

      {/* If Attach Mode: Occupied Tables Selector */}
      {posMode === 'ATTACH_TABLE' && (
        <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest">
          <label className="text-xs font-bold text-on-surface-variant block">
            Qaysi o'yin stoliga biriktirilsin?
          </label>
          {occupiedTables.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {occupiedTables.map((t: LiveTableData) => (
                <div
                  key={t.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedSessionId(t.active_session?.id || '');
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                    selectedSessionId === t.active_session?.id
                      ? 'bg-primary/20 border-primary text-white font-bold glow-primary'
                      : 'bg-surface-container border-surface-container-highest text-on-surface hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>{t.name}</span>
                    {t.active_session?.customer_name && (
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        ({t.active_session.customer_name})
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-tertiary font-bold">
                    {(t.active_session?.current_total_amount || 0).toLocaleString()} so'm
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-rose-400 py-3 text-center font-medium">
              Hozirda band stollar mavjud emas. Avval stol oching yoki "Joyida sotish"ni tanlang.
            </div>
          )}
        </div>
      )}

      {/* Cart Items List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant">
          <span>Tanlangan Mahsulotlar ({cart.length})</span>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Tozalash
            </button>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-2.5 rounded-2xl bg-surface-container-lowest border border-surface-container-highest flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-white truncate">{item.product.name}</div>
                    <div className="text-[11px] font-mono text-on-surface-variant font-semibold">
                      {item.product.selling_price.toLocaleString()} so'm
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-surface-container-highest text-white flex items-center justify-center font-bold hover:bg-surface-bright active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-white w-5 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold hover:bg-primary hover:text-surface active:scale-95"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg ml-0.5"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-on-surface-variant border border-dashed border-surface-container-highest rounded-2xl">
            Savat bo'sh. Mahsulot kartasini bosing.
          </div>
        )}
      </div>

      {/* If Direct POS Mode: Payment Methods */}
      {posMode === 'DIRECT' && (
        <div className="space-y-3 pt-2 border-t border-surface-container-highest">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'CASH', label: 'Naqd' },
              { id: 'CARD', label: 'Karta' },
              { id: 'TRANSFER', label: 'Click' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setPaymentType(m.id as BarPaymentType);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentType === m.id
                    ? 'bg-primary/20 border-primary text-primary glow-primary'
                    : 'bg-surface-container-lowest border-surface-container-highest text-on-surface'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Cash given & change */}
          {paymentType === 'CASH' && (
            <div className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Qabul qilingan naqd:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={formatMoney(finalTotal)}
                  value={cashGiven ? formatMoney(cashGiven) : ''}
                  onChange={(e) => setCashGiven(parseMoney(e.target.value) ? parseMoney(e.target.value).toString() : '')}
                  className="w-32 px-2.5 py-1.5 rounded-xl bg-surface-container border border-surface-container-highest text-right font-mono font-bold text-white focus:outline-none focus:border-primary"
                />
              </div>
              {cashGivenNum > 0 && (
                <div className="flex items-center justify-between pt-1.5 border-t border-surface-container-highest">
                  <span className="text-on-surface-variant">Qaytim (Sdacha):</span>
                  <span className="font-mono font-extrabold text-tertiary text-sm">
                    {changeAmount.toLocaleString()} so'm
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grand Total Breakdown */}
      <div className="p-4 rounded-2xl bg-surface-container-high border border-surface-container-highest space-y-1 shadow-inner">
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-white text-xs uppercase tracking-wider">Jami To'lov:</span>
          <div className="text-right">
            <span className="font-mono font-black text-2xl text-primary glow-primary">
              {finalTotal.toLocaleString()}
            </span>
            <span className="text-xs text-on-surface-variant ml-1 font-sans font-medium">
              {currentClub?.currency || 'UZS'}
            </span>
          </div>
        </div>
      </div>

      {/* Submit Action Button */}
      {posMode === 'DIRECT' ? (
        <button
          onClick={handleDirectSale}
          disabled={isProcessing || cart.length === 0}
          className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-extrabold text-sm tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 glow-primary"
        >
          <span className="material-symbols-outlined text-lg font-bold">check_circle</span>
          <span>{isProcessing ? "Bajarilmoqda..." : "To'lovni Qabul Qilish va Sotish"}</span>
        </button>
      ) : (
        <button
          onClick={handleAttachToTable}
          disabled={isProcessing || cart.length === 0 || !selectedSessionId}
          className="w-full py-3.5 px-6 rounded-2xl bg-tertiary hover:bg-tertiary-fixed text-surface font-display font-extrabold text-sm tracking-wide shadow-lg shadow-tertiary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 glow-tertiary"
        >
          <span className="material-symbols-outlined text-lg font-bold">add_shopping_cart</span>
          <span>{isProcessing ? "Qo'shilmoqda..." : "Stol Hisobiga Qo'shish"}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-28 md:pb-8">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">point_of_sale</span>
            <span>Bar va Tezkor Kassa (POS)</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Ichimliklar va yeguliklarni tezkor sotish yoki faol stol hisobiga biriktirish
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Qidiruv (nomi, shtrix-kod)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-xs text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (8 cols): Catalog & Products Grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategory('ALL');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                selectedCategory === 'ALL'
                  ? 'bg-primary text-surface border-primary shadow-sm font-bold glow-primary'
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
                  setSelectedCategory(c.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  selectedCategory === c.id
                    ? 'bg-primary text-surface border-primary shadow-sm font-bold glow-primary'
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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const inCartItem = cart.find((item) => item.product.id === p.id);
                const isOutOfStock = p.stock_quantity <= 0;

                return (
                  <motion.div
                    key={p.id}
                    layout
                    whileTap={!isOutOfStock ? { scale: 0.96 } : {}}
                    whileHover={!isOutOfStock ? { scale: 1.02, y: -2 } : {}}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`group relative p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
                      isOutOfStock
                        ? 'bg-surface-container-lowest/50 border-surface-container-highest/40 opacity-50 cursor-not-allowed'
                        : inCartItem
                        ? 'bg-surface-container border-primary ring-1 ring-primary/40 shadow-md glow-primary'
                        : 'bg-surface-container hover:bg-surface-container-high border-surface-container-highest hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded-md bg-primary/10 truncate max-w-[80px]">
                          {p.category_name || 'Bar'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            p.stock_quantity > 10
                              ? 'bg-surface-container-highest text-on-surface-variant'
                              : p.stock_quantity > 0
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {p.stock_quantity} dona
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-surface-container-highest/60 flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-white">
                        {p.selling_price.toLocaleString()}{' '}
                        <span className="text-[10px] text-on-surface-variant font-normal">so'm</span>
                      </span>

                      {inCartItem ? (
                        <span className="w-6 h-6 rounded-full bg-primary text-surface font-black text-xs flex items-center justify-center glow-primary">
                          {inCartItem.quantity}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-surface-container-highest group-hover:bg-primary group-hover:text-surface text-on-surface-variant text-xs flex items-center justify-center transition-colors font-bold">
                          +
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-surface-container/30 border border-surface-container-highest rounded-2xl p-6">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">inventory_2</span>
              <p className="text-xs text-on-surface-variant">Hech qanday mahsulot topilmadi.</p>
            </div>
          )}
        </div>

        {/* RIGHT (4 cols): Desktop POS Terminal & Cart Panel */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 bg-surface-container/90 backdrop-blur-md border border-surface-container-highest rounded-3xl p-5 space-y-4 sticky top-20 shadow-2xl">
          {renderCartPanel()}
        </div>
      </div>

      {/* MOBILE STICKY FLOATING CART BAR */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 z-30 pointer-events-none">
        <AnimatePresence>
          {totalCartCount > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="max-w-md mx-auto pointer-events-auto"
            >
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setMobileCartOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-surface flex items-center justify-between shadow-2xl shadow-primary/30 glow-primary active:scale-98 font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-surface text-primary font-black text-xs flex items-center justify-center">
                    {totalCartCount}
                  </span>
                  <span className="text-xs uppercase tracking-wide font-extrabold">Savat & Kassa</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-sm font-black">
                  <span>{finalTotal.toLocaleString()} so'm</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MOBILE CART & CHECKOUT DRAWER */}
      <AnimatePresence>
        {mobileCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCartOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-surface-container border-t border-surface-container-highest rounded-t-3xl p-5 z-50 lg:hidden max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            >
              <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">point_of_sale</span>
                  <span>Bar Kassasi</span>
                </h3>
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="p-1 rounded-full bg-surface-container-high text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {renderCartPanel()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
