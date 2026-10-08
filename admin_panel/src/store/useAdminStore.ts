import { create } from 'zustand';
import { adminApiClient } from '../api/client';
import type {
  SuperAdminUser, SuperAdminClub, SubscriptionPlan,
  SaaSTransaction, OverviewData, AdminViewType
} from '../types';
import toast from 'react-hot-toast';

interface AdminState {
  adminUser: SuperAdminUser | null;
  token: string | null;
  currentView: AdminViewType;
  isLoading: boolean;
  
  overviewData: OverviewData | null;
  clubs: SuperAdminClub[];
  plans: SubscriptionPlan[];
  transactions: SaaSTransaction[];
  users: SuperAdminUser[];
  
  // Actions
  setCurrentView: (view: AdminViewType) => void;
  initAuth: () => void;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  changePassword: (data: { old_password: string; new_password: string; confirm_new_password: string }) => Promise<boolean>;
  
  fetchOverview: () => Promise<void>;
  fetchClubs: (params?: { status?: string; search?: string }) => Promise<void>;
  extendSubscription: (clubId: string, payload: { days: number; plan_id?: string; is_trial?: boolean }) => Promise<boolean>;
  toggleClubActive: (clubId: string) => Promise<boolean>;
  
  fetchPlans: () => Promise<void>;
  createPlan: (data: Partial<SubscriptionPlan>) => Promise<boolean>;
  updatePlan: (id: string, data: Partial<SubscriptionPlan>) => Promise<boolean>;
  deletePlan: (id: string) => Promise<boolean>;
  
  fetchTransactions: (params?: { provider?: string; status?: string; search?: string }) => Promise<void>;
  fetchUsers: (params?: { role?: string; search?: string }) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<boolean>;
  sendBroadcast: (payload: { target: string; message: string; parse_mode?: string }) => Promise<{ success: boolean; data?: any }>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  adminUser: null,
  token: null,
  currentView: 'overview',
  isLoading: false,
  
  overviewData: null,
  clubs: [],
  plans: [],
  transactions: [],
  users: [],

  setCurrentView: (view) => set({ currentView: view }),

  initAuth: () => {
    const token = localStorage.getItem('playbase_admin_token');
    const userJson = localStorage.getItem('playbase_admin_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ token, adminUser: user });
      } catch (e) {
        localStorage.removeItem('playbase_admin_token');
        localStorage.removeItem('playbase_admin_user');
      }
    }
  },

  login: async ({ username, password }) => {
    set({ isLoading: true });
    try {
      const res = await adminApiClient.post('/auth/login/', { username, password });
      const { access, user } = res.data;
      localStorage.setItem('playbase_admin_token', access);
      localStorage.setItem('playbase_admin_user', JSON.stringify(user));
      set({ token: access, adminUser: user, isLoading: false });
      toast.success(`Xush kelibsiz, ${user.first_name || user.username}!`);
      return true;
    } catch (err: any) {
      set({ isLoading: false });
      const msg = err.response?.data?.non_field_errors?.[0] || 
                  err.response?.data?.detail || 
                  err.response?.data?.username?.[0] || 
                  "Login yoki parol noto'g'ri.";
      toast.error(msg);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('playbase_admin_token');
    localStorage.removeItem('playbase_admin_user');
    set({ token: null, adminUser: null, currentView: 'overview' });
    toast.success("Tizimdan chiqildi.");
  },

  changePassword: async (data) => {
    try {
      const res = await adminApiClient.post('/auth/change-password/', data);
      const { access } = res.data;
      if (access) {
        localStorage.setItem('playbase_admin_token', access);
        set({ token: access });
      }
      toast.success("Parolingiz muvaffaqiyatli o'zgartirildi!");
      return true;
    } catch (err: any) {
      const errors = err.response?.data;
      let msg = "Parolni o'zgartirishda xatolik yuz berdi.";
      if (errors?.old_password?.[0]) msg = errors.old_password[0];
      else if (errors?.confirm_new_password?.[0]) msg = errors.confirm_new_password[0];
      else if (errors?.new_password?.[0]) msg = errors.new_password[0];
      toast.error(msg);
      return false;
    }
  },

  fetchOverview: async () => {
    try {
      const res = await adminApiClient.get('/overview/');
      set({ overviewData: res.data });
    } catch (err) {
      console.error("Overview yuklashda xatolik:", err);
    }
  },

  fetchClubs: async (params) => {
    set({ isLoading: true });
    try {
      const res = await adminApiClient.get('/clubs/', { params });
      set({ clubs: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      console.error("Klublarni yuklashda xatolik:", err);
    }
  },

  extendSubscription: async (clubId, payload) => {
    try {
      const res = await adminApiClient.post(`/clubs/${clubId}/extend-subscription/`, payload);
      const updated = res.data;
      set((state) => ({
        clubs: state.clubs.map((c) => (c.id === clubId ? updated : c)),
      }));
      toast.success(`Klub obunasi +${payload.days} kunga muvaffaqiyatli uzaytirildi!`);
      get().fetchOverview();
      return true;
    } catch (err) {
      toast.error("Obunani uzaytirishda xatolik yuz berdi.");
      return false;
    }
  },

  toggleClubActive: async (clubId) => {
    try {
      const res = await adminApiClient.post(`/clubs/${clubId}/toggle-active/`);
      const updated = res.data;
      set((state) => ({
        clubs: state.clubs.map((c) => (c.id === clubId ? updated : c)),
      }));
      toast.success(updated.is_active ? "Klub faollashtirildi." : "Klub bloklandi.");
      get().fetchOverview();
      return true;
    } catch (err) {
      toast.error("Klub holatini o'zgartirishda xatolik.");
      return false;
    }
  },

  fetchPlans: async () => {
    try {
      const res = await adminApiClient.get('/plans/');
      set({ plans: res.data });
    } catch (err) {
      console.error("Tariflarni yuklashda xatolik:", err);
    }
  },

  createPlan: async (data) => {
    try {
      await adminApiClient.post('/plans/', data);
      toast.success("Yangi tarif rejasi yaratildi!");
      get().fetchPlans();
      return true;
    } catch (err) {
      toast.error("Tarif yaratishda xatolik.");
      return false;
    }
  },

  updatePlan: async (id, data) => {
    try {
      await adminApiClient.patch(`/plans/${id}/`, data);
      toast.success("Tarif rejasi yangilandi!");
      get().fetchPlans();
      return true;
    } catch (err) {
      toast.error("Tarifni yangilashda xatolik.");
      return false;
    }
  },

  deletePlan: async (id) => {
    try {
      await adminApiClient.delete(`/plans/${id}/`);
      toast.success("Tarif o'chirildi.");
      get().fetchPlans();
      return true;
    } catch (err) {
      toast.error("Tarifni o'chirishda xatolik.");
      return false;
    }
  },

  fetchTransactions: async (params) => {
    set({ isLoading: true });
    try {
      const res = await adminApiClient.get('/transactions/', { params });
      set({ transactions: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      console.error("Tranzaksiyalarni yuklashda xatolik:", err);
    }
  },

  fetchUsers: async (params) => {
    set({ isLoading: true });
    try {
      const res = await adminApiClient.get('/users/', { params });
      set({ users: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      console.error("Foydalanuvchilarni yuklashda xatolik:", err);
    }
  },

  toggleUserActive: async (userId) => {
    try {
      const res = await adminApiClient.post(`/users/${userId}/toggle-active/`);
      const updated = res.data;
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? updated : u)),
      }));
      toast.success(updated.is_active ? "Foydalanuvchi faollashtirildi." : "Foydalanuvchi bloklandi.");
      return true;
    } catch (err) {
      toast.error("Foydalanuvchi holatini o'zgartirishda xatolik.");
      return false;
    }
  },

  sendBroadcast: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await adminApiClient.post('/broadcast/', payload);
      set({ isLoading: false });
      toast.success(res.data.detail || "Xabarnoma yuborildi!");
      return { success: true, data: res.data };
    } catch (err: any) {
      set({ isLoading: false });
      toast.error(err.response?.data?.detail || "Xabarnoma yuborishda xatolik yuz berdi.");
      return { success: false };
    }
  }
}));
