import React, { useEffect } from 'react';
import { useAdminStore } from './store/useAdminStore';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { OverviewView } from './views/OverviewView';
import { ClubsView } from './views/ClubsView';
import { PlansView } from './views/PlansView';
import { BillingView } from './views/BillingView';
import { UsersView } from './views/UsersView';
import { BroadcastView } from './views/BroadcastView';
import { SettingsView } from './views/SettingsView';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const { token, adminUser, initAuth, currentView } = useAdminStore();

  useEffect(() => {
    initAuth();
  }, []);

  if (!token || !adminUser) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(28, 31, 41, 0.95)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              fontSize: '13px',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
        <LoginView />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex font-sans select-none overflow-x-hidden">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(28, 31, 41, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            fontSize: '13px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          },
        }}
      />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-surface-dim min-h-screen overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {currentView === 'overview' && <OverviewView />}
            {currentView === 'clubs' && <ClubsView />}
            {currentView === 'plans' && <PlansView />}
            {currentView === 'billing' && <BillingView />}
            {currentView === 'users' && <UsersView />}
            {currentView === 'broadcast' && <BroadcastView />}
            {currentView === 'settings' && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
