import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

import { DashboardView } from './views/DashboardView';
import { BarPOSView } from './views/BarPOSView';
import { HistoryView } from './views/HistoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { ProductsView } from './views/ProductsView';
import { SettingsView } from './views/SettingsView';
import { BillingView } from './views/BillingView';

import { NewSessionModal } from './components/modals/NewSessionModal';
import { ActiveSessionModal } from './components/modals/ActiveSessionModal';
import { CheckoutReceiptModal } from './components/modals/CheckoutReceiptModal';
import { LoginView } from './views/LoginView';
import { BlockedView } from './views/BlockedView';

const viewVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, scale: 0.99, transition: { duration: 0.15 } }
};

export const App: React.FC = () => {
  const { user, initApp, isLoading, isBlocked, blockedMessage, supportTelegram, setIsBlocked, currentView, activeModal, fetchLiveTables } = useAppStore();

  useEffect(() => {
    initApp();

    const handleBlockedEvent = (e: any) => {
      setIsBlocked(true, e.detail?.message, e.detail?.supportTelegram);
    };
    window.addEventListener('playbase:user_blocked', handleBlockedEvent);

    // Auto sync live tables every 4 seconds if logged in and not blocked
    const interval = setInterval(() => {
      const state = useAppStore.getState();
      if (state.user && !state.isBlocked) {
        fetchLiveTables();
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('playbase:user_blocked', handleBlockedEvent);
    };
  }, []);

  // Blocked View Screen
  if (isBlocked || (user && user.is_active === false)) {
    return (
      <>
        <Toaster position="top-right" />
        <BlockedView message={blockedMessage} supportContact={supportTelegram} />
      </>
    );
  }

  // Premium Cyberpunk Global Loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Background ambient neon glow */}
        <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute w-64 h-64 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none -bottom-10 -right-10" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Glowing Animated Circular Core */}
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Spinning Neon Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/40 animate-spin [animation-duration:6s] [animation-direction:reverse]" />

            {/* Glowing Logo Icon */}
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-container via-primary to-cyan-300 flex items-center justify-center shadow-xl shadow-primary/30"
            >
              <span className="material-symbols-outlined text-surface font-black text-3xl">
                sports_esports
              </span>
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-extrabold text-xl text-white tracking-tight"
          >
            PlayBase <span className="text-primary font-mono text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20 ml-1">SaaS</span>
          </motion.h2>

          <p className="text-xs text-on-surface-variant/80 mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span>Klub ma'lumotlari sinxronlanmoqda...</span>
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display LoginView
  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginView />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans select-none overflow-x-hidden">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(28, 31, 41, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            fontSize: '13px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          },
        }}
      />

      {/* Top Header */}
      <Header />

      {/* Main Layout Body */}
      <div className="flex-1 flex items-start w-full min-w-0">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Center Content View Area with Animated Page Transitions */}
        <main className="flex-1 min-w-0 bg-surface-dim min-h-[calc(100vh-4rem)] w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'bar_pos' && <BarPOSView />}
              {currentView === 'history' && <HistoryView />}
              {currentView === 'analytics' && <AnalyticsView />}
              {currentView === 'products' && <ProductsView />}
              {currentView === 'settings' && <SettingsView />}
              {currentView === 'billing' && <BillingView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Dynamic Modals with AnimatePresence */}
      <AnimatePresence>
        {activeModal === 'NEW_SESSION' && <NewSessionModal key="modal-new-session" />}
        {activeModal === 'SESSION_MANAGE' && <ActiveSessionModal key="modal-session-manage" />}
        {activeModal === 'CHECKOUT' && <CheckoutReceiptModal key="modal-checkout" />}
      </AnimatePresence>
    </div>
  );
};

export default App;
