import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  id: 'dashboard' | 'bar_pos' | 'history' | 'analytics' | 'products' | 'settings' | 'billing';
  label: string;
  icon: string;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentClub, logout } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Live Kassa', icon: 'grid_view' },
    { id: 'bar_pos', label: 'Bar POS', icon: 'point_of_sale' },
    { id: 'history', label: 'Tarix', icon: 'receipt_long' },
    { id: 'analytics', label: 'Analitika', icon: 'monitoring' },
  ];

  const secondaryNavItems: NavItem[] = [
    { id: 'products', label: 'Mahsulotlar & Ombor', icon: 'inventory_2' },
    { id: 'settings', label: 'Stollar & Zonalar', icon: 'tune' },
    { id: 'billing', label: 'Tarif & Obuna', icon: 'credit_card', badge: currentClub?.is_trial ? 'Trial' : undefined },
  ];

  const allNavItems = [...mainNavItems, ...secondaryNavItems];

  const handleNavClick = (viewId: NavItem['id']) => {
    triggerHaptic('light');
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop & Tablet Fixed Independent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 shrink-0 border-r border-surface-container-highest/70 bg-surface-container-low/95 backdrop-blur-md py-5 px-3 justify-between overflow-y-auto select-none">
        <div className="space-y-1">
          <div className="px-3 pb-3 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
            Boshqaruv Paneli
          </div>
          {allNavItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium text-xs sm:text-sm transition-all duration-200 group active:scale-[0.98] ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-container/20 to-primary/10 text-primary border border-primary/30 shadow-sm font-bold glow-primary'
                    : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container/30 text-tertiary border border-tertiary/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Logout button */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              logout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs sm:text-sm text-error/80 hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 transition-all duration-200 group active:scale-[0.98] mt-4"
          >
            <span className="material-symbols-outlined text-xl transition-transform duration-200 group-hover:scale-110">
              logout
            </span>
            <span>Tizimdan Chiqish</span>
          </button>
        </div>

        {/* Footer Support Card */}
        <div className="p-3.5 rounded-2xl bg-surface-container border border-surface-container-highest/80 space-y-2 mt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="material-symbols-outlined text-primary text-base">support_agent</span>
            <span>Texnik Yordam</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Savollar yoki takliflar bo'yicha Telegram orqali murojaat qiling.
          </p>
          <a
            href="https://t.me/playbasesupport"
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs font-bold py-1.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/20 transition-all active:scale-95"
          >
            @playbasesupport
          </a>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar with Safe Area */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container/95 backdrop-blur-xl border-t border-surface-container-highest/80 z-40 px-2 flex items-center justify-around select-none pb-[env(safe-area-inset-bottom,0px)]">
        {mainNavItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 relative ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-1 w-8 h-1 bg-primary rounded-full glow-primary"
                />
              )}
              <span className={`material-symbols-outlined text-2xl ${isActive ? 'font-bold text-primary' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setMobileMenuOpen(true);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 relative ${
            ['products', 'settings', 'billing'].includes(currentView)
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Ko'proq</span>
        </button>
      </nav>

      {/* Mobile Full Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-surface-container border-t border-surface-container-highest rounded-t-3xl p-5 z-50 md:hidden max-h-[80vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
            >
              {/* Drag Pill */}
              <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-extrabold text-base text-white">Qo'shimcha Bo'limlar</h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full bg-surface-container-high text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-2">
                {secondaryNavItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-semibold text-sm transition-all ${
                        isActive
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-surface-container-high/60 text-white hover:bg-surface-container-high border border-surface-container-highest'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl text-primary">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container/30 text-tertiary">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl font-semibold text-sm bg-error/10 text-error border border-error/20 mt-3"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  <span>Tizimdan Chiqish</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
