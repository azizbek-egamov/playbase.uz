import React, { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Header } from '../components/Header';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsView: React.FC = () => {
  const { adminUser, changePassword } = useAdminStore();
  
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Yangi parollar bir-biriga mos kelmadi!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setIsSubmitting(true);
    const ok = await changePassword({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmPassword,
    });
    setIsSubmitting(false);

    if (ok) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim pb-12">
      <Header
        title="Admin Xavfsizligi & Sozlamalar"
        subtitle="Master Admin hisob parolini almashtirish va xavfsizlik parametrlari"
      />

      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Change Password Form (7 cols) */}
          <div className="md:col-span-7 bg-surface-container border border-surface-container-highest rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 glow-cyan">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-white text-base">Parolni Almashtirish</h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  Tizim xavfsizligi uchun kuchli paroldan foydalaning
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="text-on-surface-variant font-bold block mb-1.5">
                  Hozirgi Maxfiy Parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-on-surface-variant font-bold block mb-1.5">
                  Yangi Parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Kamida 6 ta belgi"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-on-surface-variant font-bold block mb-1.5">
                  Yangi Parolni Takrorlang
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Yangi parolni tasdiqlang"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface-container-lowest border border-surface-container-highest text-white text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-surface font-display font-black text-sm tracking-wide shadow-lg shadow-cyan-400/20 transition-all flex items-center justify-center gap-2 glow-cyan active:scale-95"
                >
                  {isSubmitting ? (
                    <span>Saqlanmoqda...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Parolni Yangilash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Admin Info & Server Card (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-surface-container border border-surface-container-highest rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary glow-primary font-black text-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-white text-base">
                    {adminUser?.first_name || adminUser?.username || 'SuperAdmin'}
                  </h4>
                  <div className="text-xs text-primary font-mono font-bold">
                    @{adminUser?.username} (Master Admin)
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-surface-container-highest/60 text-xs">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Maqom:</span>
                  <span className="font-bold text-white">Platform Superuser</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Autentifikatsiya:</span>
                  <span className="font-bold text-primary font-mono">JWT Bearer (7 days)</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Ruxsatlar:</span>
                  <span className="font-bold text-cyan-400 font-mono">Full Access (Root)</span>
                </div>
              </div>
            </div>

            {/* Platform Details Card */}
            <div className="bg-surface-container border border-surface-container-highest rounded-3xl p-5 shadow-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-white font-bold">
                <Server className="w-4 h-4 text-purple-400" />
                <span>PlayBase SaaS Arxitekturasi</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed text-[11px]">
                Ushbu Master Admin paneli orqali barcha filiallar, kassa operatsiyalari, obunalar va tariflar markazlashtirilgan holda boshqariladi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
