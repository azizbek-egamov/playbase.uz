import React from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { RefreshCw, KeyRound, UserCheck, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRefresh }) => {
  const { adminUser, setCurrentView } = useAdminStore();

  return (
    <header className="h-16 bg-surface-container/80 backdrop-blur-md border-b border-surface-container-highest px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <div>
        <h2 className="font-display font-black text-white text-base tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h2>
        {subtitle && <p className="text-[11px] text-on-surface-variant font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-white transition-colors border border-surface-container-highest flex items-center gap-1.5 text-xs font-semibold active:scale-95"
            title="Ma'lumotlarni yangilash"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        )}

        <button
          onClick={() => setCurrentView('settings')}
          className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Parolni almashtirish</span>
        </button>

        <div className="h-6 w-[1px] bg-surface-container-highest" />

        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary glow-primary font-bold text-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-white leading-tight">
              {adminUser?.first_name || adminUser?.username || 'SuperAdmin'}
            </div>
            <div className="text-[10px] text-primary font-mono font-semibold">Master Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
