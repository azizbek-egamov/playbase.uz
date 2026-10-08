import React from 'react';
import { useAdminStore } from '../store/useAdminStore';
import type { AdminViewType } from '../types';
import {
  LayoutDashboard,
  Building2,
  Gem,
  CreditCard,
  Users,
  Send,
  Settings,
  LogOut,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface NavItem {
  id: AdminViewType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, logout, clubs, overviewData } = useAdminStore();

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Global Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'clubs',
      label: 'Klublar (Tenants)',
      icon: <Building2 className="w-5 h-5" />,
      badge: overviewData ? `${overviewData.total_clubs}` : undefined,
    },
    {
      id: 'plans',
      label: 'SaaS Tariflari',
      icon: <Gem className="w-5 h-5" />,
    },
    {
      id: 'billing',
      label: 'Moliya & To\'lovlar',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: 'Foydalanuvchilar',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'broadcast',
      label: 'Telegram E\'lon',
      icon: <Send className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Xavfsizlik & Parol',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-surface-container border-r border-surface-container-highest flex flex-col justify-between shrink-0 min-h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-surface-container-highest flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-container via-primary to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/20 text-surface">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-black text-white text-base tracking-tight">PlayBase</h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MASTER
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono">Platform Admin</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-surface shadow-lg shadow-primary/25 glow-primary'
                    : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      isActive ? 'bg-surface/25 text-surface' : 'bg-surface-container-highest text-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status & Logout */}
      <div className="p-4 border-t border-surface-container-highest space-y-3">
        <div className="p-3 rounded-2xl bg-surface-container-lowest/80 border border-surface-container-highest/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-[11px] font-semibold text-on-surface-variant">SaaS API Online</span>
          </div>
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan Chiqish</span>
        </button>
      </div>
    </aside>
  );
};
