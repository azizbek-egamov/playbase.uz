import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const { user, currentClub, clubs, setCurrentClub, fetchLiveTables, isOnline, logout } = useAppStore();
  const [timeStr, setTimeStr] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    triggerHaptic('light');
    setIsRefreshing(true);
    await fetchLiveTables();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="h-16 sticky top-0 shrink-0 border-b border-surface-container-highest/80 bg-surface-container/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* Left: Brand & Club Selection */}
      <div className="flex items-center gap-2.5 sm:gap-5 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-primary-container to-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-surface font-bold text-xl sm:text-2xl">sports_esports</span>
          </div>
          <div className="hidden xs:block">
            <h1 className="font-display font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-on-surface to-primary bg-clip-text text-transparent leading-none">
              PlayBase
            </h1>
            <span className="text-[9px] sm:text-[10px] text-primary/80 font-mono uppercase tracking-widest block mt-0.5">
              SaaS Core
            </span>
          </div>
        </div>

        {/* Club Selector Pill */}
        {currentClub && (
          <div className="relative flex items-center min-w-0">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-container-high/90 border border-surface-container-highest text-xs font-medium hover:border-primary/40 transition-colors max-w-[150px] sm:max-w-[200px]">
              <span className="material-symbols-outlined text-primary text-sm sm:text-base shrink-0">storefront</span>
              <span className="font-semibold text-white truncate text-[11px] sm:text-xs">{currentClub.name}</span>
              {clubs.length > 1 && (
                <select
                  value={currentClub.id}
                  onChange={(e) => {
                    const selected = clubs.find(c => c.id === e.target.value);
                    if (selected) {
                      triggerHaptic('light');
                      setCurrentClub(selected);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                >
                  {clubs.map(c => (
                    <option key={c.id} value={c.id} className="bg-surface text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center: Live Clock & Offline Warning */}
      <div className="hidden md:flex items-center gap-3">
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/30 border border-error text-error text-xs font-semibold animate-pulse">
            <span className="material-symbols-outlined text-sm">wifi_off</span>
            <span>Offline</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-on-surface-variant bg-surface-container-lowest/80 px-3 py-1.5 rounded-xl border border-surface-container-highest font-mono text-xs shadow-inner">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Right: Plan Status, Refresh & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {currentClub?.active_plan_detail && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            <span>{currentClub.active_plan_detail.name}</span>
          </div>
        )}

        <button
          onClick={handleRefresh}
          title="Ma'lumotlarni yangilash"
          className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-surface-container-highest text-on-surface-variant hover:text-white transition-all active:scale-90 flex items-center justify-center"
        >
          <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
            sync
          </span>
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-2 pl-1.5 py-1 pr-1.5 rounded-xl hover:bg-surface-container-high border border-transparent hover:border-surface-container-highest transition-colors cursor-pointer"
            >
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.full_name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-primary/40"
              />
              <div className="hidden sm:block text-left leading-none space-y-0.5">
                <div className="text-xs font-bold text-white max-w-[100px] truncate">{user.full_name}</div>
                <div className="text-[10px] text-primary">{user.is_owner ? "Klub Egasi" : "Kassir"}</div>
              </div>
              <span className="material-symbols-outlined text-xs text-on-surface-variant">expand_more</span>
            </button>

            {/* Dropdown Menu with Framer Motion */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-surface-container/95 border border-surface-container-highest shadow-2xl p-2 z-50 backdrop-blur-xl"
                >
                  <div className="px-3 py-2 border-b border-surface-container-highest/60 mb-1">
                    <div className="text-xs font-bold text-white truncate">{user.full_name}</div>
                    <div className="text-[11px] text-on-surface-variant truncate">@{user.username || 'user'}</div>
                    {user.telegram_id && (
                      <div className="text-[10px] font-mono text-primary mt-0.5">ID: {user.telegram_id}</div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-error hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Tizimdan Chiqish</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};
