import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic } from '../utils/haptics';
import { motion } from 'framer-motion';

export const LoginView: React.FC = () => {
  const { initApp, telegramWidgetLogin } = useAppStore();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const botUsername = import.meta.env.VITE_BOT_USERNAME || 'PlayBaseBot';

  useEffect(() => {
    // 1. If inside Telegram WebApp, auto-authenticate
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData && tg.initData.length > 0) {
      initApp();
      return;
    }

    // 2. Global Telegram Login Widget Callback
    (window as any).onTelegramAuth = async (user: any) => {
      console.log('[Telegram Auth] Received payload:', user);
      try {
        await telegramWidgetLogin(user);
      } catch (err) {
        console.error('[Telegram Auth] Failed:', err);
      }
    };

    // 3. Mount Telegram Login Widget
    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '20');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-userpic', 'true');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.async = true;

      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botUsername]);

  const handleSwitchAccount = () => {
    triggerHaptic('light');
    // Open Telegram auth page in popup allowing user to switch account / logout from widget
    window.open(`https://oauth.telegram.org/auth?bot_id=8631087984&origin=${encodeURIComponent(window.location.origin)}`, '_blank', 'width=550,height=480');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/15 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card with Glassmorphism */}
        <div className="bg-[#11141e]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 flex flex-col items-center text-center relative overflow-hidden">
          {/* Top Subtle Neon Edge Line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Neon Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-container via-primary to-cyan-300 flex items-center justify-center shadow-xl shadow-primary/30 mb-4 glow-primary">
            <span className="material-symbols-outlined text-black font-black text-3xl">sports_esports</span>
          </div>

          <h1 className="font-display font-black text-2xl tracking-tight text-white mb-1.5">
            PlayBase SaaS
          </h1>
          <p className="text-xs text-white/50 max-w-[280px] mb-6 leading-relaxed">
            O'yin zallari va klublar uchun avtomatlashtirilgan boshqaruv tizimi
          </p>

          {/* Telegram Login Widget Dedicated Frame */}
          <div className="w-full p-5 sm:p-6 rounded-2xl bg-surface-container-lowest/80 border border-surface-container-highest/80 flex flex-col items-center justify-center space-y-4 shadow-inner relative group">
            {/* Header info inside frame */}
            <div className="flex items-center gap-2 text-xs font-bold text-white/80">
            </div>

            {/* Telegram Widget Container */}
            <div className="w-full flex justify-center items-center min-h-[48px] py-1">
              <div ref={widgetContainerRef} className="flex justify-center items-center" />
            </div>

            <p className="text-[11px] text-white/40 leading-snug">
              Telefon raqamingizga Telegram orqali xavfsiz tasdiqlash so'rovi yuboriladi
            </p>

            {/* Switch Account Option */}
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="text-[11px] text-primary/80 hover:text-primary transition-colors flex items-center gap-1 font-medium pt-1 border-t border-white/5 w-full justify-center"
            >
              <span className="material-symbols-outlined text-xs">switch_account</span>
              <span>Boshqa hisobdan kirish</span>
            </button>
          </div>

          {/* Step by step info */}
          <div className="w-full mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[10px] text-white/50">
            <div className="space-y-1">
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-primary font-bold">1</div>
              <span>Raqam kiritish</span>
            </div>
            <div className="space-y-1">
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-[#2AABEE] font-bold">2</div>
              <span>Tasdiqlash so'rovi</span>
            </div>
            <div className="space-y-1">
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-emerald-400 font-bold">3</div>
              <span>Tizimga kirish</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-white/30 mt-6">
          © 2026 PlayBase SaaS Management System • Barcha ma'lumotlar himoyalangan
        </p>
      </motion.div>
    </div>
  );
};
