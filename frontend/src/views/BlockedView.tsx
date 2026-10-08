import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic } from '../utils/haptics';
import { motion } from 'framer-motion';

interface BlockedViewProps {
  message?: string;
  supportContact?: string;
}

export const BlockedView: React.FC<BlockedViewProps> = ({
  message = "Sizning hisobingiz administrator tomonidan bloklangan. Xizmatdan foydalanish vaqtincha to'xtatilgan.",
  supportContact = "@playbase_support"
}) => {
  const { user, initApp, logout } = useAppStore();
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const cleanSupportHandle = supportContact.replace(/^@/, '');
  const telegramUrl = `https://t.me/${cleanSupportHandle}`;

  const handleRefresh = async () => {
    triggerHaptic('light');
    setIsChecking(true);
    try {
      await initApp();
    } finally {
      setTimeout(() => setIsChecking(false), 800);
    }
  };

  const handleLogout = () => {
    triggerHaptic('medium');
    logout();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient Red/Orange Warning Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-rose-600/15 rounded-full blur-[170px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Glassmorphism Card */}
        <div className="bg-[#11141e]/90 backdrop-blur-2xl border border-rose-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 flex flex-col items-center text-center relative overflow-hidden">
          {/* Top Neon Warning Bar */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[3px] bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-lg shadow-rose-500/50" />

          {/* Animated Lock Shield Icon */}
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-950/80 via-rose-600/30 to-amber-500/30 border border-rose-500/40 flex items-center justify-center shadow-xl shadow-rose-600/20 mb-5 relative glow-rose"
          >
            <span className="material-symbols-outlined text-rose-400 font-black text-4xl">
              lock
            </span>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-[#11141e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-white font-bold">close</span>
            </div>
          </motion.div>

          <h1 className="font-display font-black text-2xl tracking-tight text-white mb-2">
            Hisobingiz Bloklangan
          </h1>
          
          <p className="text-xs text-rose-300/80 max-w-[320px] mb-5 leading-relaxed font-medium">
            {message}
          </p>

          {/* User Details Badge if Available */}
          {user && (
            <div className="w-full p-3 mb-5 rounded-2xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between text-xs">
              <div className="text-left">
                <div className="font-bold text-white truncate max-w-[170px]">
                  {user.first_name || user.username}
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono">
                  ID: {user.telegram_id || user.id}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                BLOKLANGAN
              </span>
            </div>
          )}

          {/* Support Info Box */}
          <div className="w-full p-5 rounded-2xl bg-surface-container-lowest/80 border border-surface-container-highest/80 flex flex-col items-center justify-center space-y-3 shadow-inner text-center">
            <p className="text-xs text-white/70 leading-relaxed">
              Bloklanish sababini bilish yoki hisobni qayta faollashtirish uchun rasmiy administrator bilan bog'laning:
            </p>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic('medium')}
              className="w-full py-3 px-4 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#2AABEE]/25 transition-all active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.922z" />
              </svg>
              <span>Admin bilan bog'lanish ({supportContact})</span>
            </a>
          </div>

          {/* Actions */}
          <div className="w-full grid grid-cols-2 gap-2.5 mt-5">
            <button
              type="button"
              disabled={isChecking}
              onClick={handleRefresh}
              className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${isChecking ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isChecking ? 'Tekshirilmoqda...' : 'Qayta tekshirish'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-rose-500/20 border border-surface-container-highest hover:border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Chiqish</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-white/30 mt-6">
          © 2026 PlayBase SaaS Security & Anti-Abuse System
        </p>
      </motion.div>
    </div>
  );
};
