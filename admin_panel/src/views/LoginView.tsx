import React, { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Shield, Lock, User, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAdminStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    await login({ username, password });
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none -bottom-20 -right-20" />
      <div className="absolute w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-surface-container/85 backdrop-blur-2xl border border-surface-container-highest rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-primary-container via-primary to-cyan-300 flex items-center justify-center shadow-xl shadow-primary/25 text-surface">
            <Shield className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SaaS Master Control</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            PlayBase Admin
          </h1>
          <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
            Platforma boshqaruv tizimiga kirish
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1.5">
              Login (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1.5">
              Maxfiy Parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-fixed text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 glow-primary active:scale-98"
            >
              {isLoading ? (
                <span>Kirilmoqda...</span>
              ) : (
                <>
                  <span>Boshqaruv Paneliga Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-4 border-t border-surface-container-highest/60 text-center">
          <p className="text-[11px] text-on-surface-variant/70 flex items-center justify-center gap-1.5">
            <KeyRound className="w-3 h-3 text-primary" />
            <span>Faqat vakolatli Master Adminlar uchun himoyalangan hudud</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
