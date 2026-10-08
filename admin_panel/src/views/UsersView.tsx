import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Header } from '../components/Header';
import {
  Users,
  Search,
  UserCheck,
  Shield,
  Ban,
  CheckCircle2,
  Phone,
  Send
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, fetchUsers, toggleUserActive, isLoading } = useAdminStore();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchUsers({ role: roleFilter || undefined, search: searchQuery || undefined });
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers({ role: roleFilter || undefined, search: searchQuery || undefined });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim pb-12">
      <Header
        title="Foydalanuvchilar Boshqaruvi"
        subtitle="Platformada ro'yxatdan o'tgan barcha biznes egalari va kassa xodimlari"
        onRefresh={() => fetchUsers({ role: roleFilter || undefined, search: searchQuery || undefined })}
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-white text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Barcha Rollar</option>
              <option value="OWNER">Klub Egalari (is_owner)</option>
              <option value="STAFF">SuperAdmin / Xodimlar</option>
            </select>
          </div>

          <form onSubmit={handleSearch} className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Username, ism, telefon, Telegram ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container border border-surface-container-highest text-white text-xs focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-on-surface-variant" />
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-surface-container border border-surface-container-highest rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-container-highest bg-surface-container-high/60 text-on-surface-variant font-bold">
                  <th className="p-4 font-semibold">Foydalanuvchi</th>
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">Telefon</th>
                  <th className="p-4 font-semibold">Roli / Huquqi</th>
                  <th className="p-4 font-semibold">Holati</th>
                  <th className="p-4 font-semibold">Ro'yxatdan o'tgan</th>
                  <th className="p-4 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                      Foydalanuvchilar yuklanmoqda...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface font-bold">
                            {(u.first_name?.[0] || u.username?.[0] || 'U').toUpperCase()}
                          </div>
                          <span>{u.first_name || u.username} {u.last_name || ''}</span>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-cyan-400 font-bold">
                        @{u.username || '-'}
                      </td>

                      <td className="p-4 font-mono text-on-surface">
                        {u.phone_number || '-'}
                      </td>

                      <td className="p-4">
                        {u.is_superuser ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            SUPERUSER
                          </span>
                        ) : u.is_owner ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/20 text-primary border border-primary/30">
                            KLUB EGASI
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface-container-highest text-on-surface-variant">
                            OPERATOR
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            u.is_active
                              ? 'bg-primary/20 text-primary'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {u.is_active ? 'FAOL' : 'BLOKLANGAN'}
                        </span>
                      </td>

                      <td className="p-4 text-on-surface-variant font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleUserActive(u.id)}
                          className={`p-1.5 rounded-xl border text-xs transition-all active:scale-95 ${
                            u.is_active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/30'
                          }`}
                          title={u.is_active ? 'Bloklash' : 'Faollashtirish'}
                        >
                          {u.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-on-surface-variant">
                      Foydalanuvchilar topilmadi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
