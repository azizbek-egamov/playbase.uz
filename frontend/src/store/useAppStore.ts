import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { User, Club, LiveTableData, Product, ProductCategory, Session, SubscriptionPlan } from '../types';
import toast from 'react-hot-toast';

interface AppState {
  user: User | null;
  clubs: Club[];
  currentClub: Club | null;
  liveTables: LiveTableData[];
  serverTime: string | null;
  selectedZoneFilter: string; // 'ALL' or zone_id
  products: Product[];
  categories: ProductCategory[];
  plans: SubscriptionPlan[];
  
  isLoading: boolean;
  isOnline: boolean;
  isBlocked: boolean;
  blockedMessage: string;
  supportTelegram: string;
  currentView: 'dashboard' | 'bar_pos' | 'history' | 'analytics' | 'products' | 'settings' | 'billing';
  
  // Modals state
  activeModal: 'NEW_SESSION' | 'SESSION_MANAGE' | 'CHECKOUT' | 'EXTEND' | 'TRANSFER' | 'ADD_ORDER' | 'BILLING_UPGRADE' | null;
  selectedTable: LiveTableData | null;
  selectedSession: Session | null;

  // Actions
  setUser: (user: User | null) => void;
  setIsBlocked: (isBlocked: boolean, msg?: string, contact?: string) => void;
  setCurrentClub: (club: Club) => void;
  setLiveTables: (tables: LiveTableData[]) => void;
  setSelectedZoneFilter: (zoneId: string) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  openModal: (modal: AppState['activeModal'], table?: LiveTableData | null, session?: Session | null) => void;
  closeModal: () => void;
  logout: () => void;
  devLogin: (payload: { telegram_id: number; username: string; first_name: string; is_owner: boolean }) => Promise<void>;
  telegramWidgetLogin: (data: any) => Promise<void>;
  
  // Async actions
  initApp: () => Promise<void>;
  fetchLiveTables: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  
  startSession: (payload: { table_id: string; is_open_ended: boolean; duration_minutes?: number; customer_name?: string; customer_phone?: string; initial_orders?: Array<{ product_id: string; quantity: number }> }) => Promise<boolean>;
  stopSession: (sessionId: string, payload: { payment_type: string; discount_amount?: number; note?: string }) => Promise<Session | null>;
  extendSession: (sessionId: string, additional_minutes: number) => Promise<boolean>;
  transferTable: (sessionId: string, target_table_id: string) => Promise<boolean>;
  addOrderToSession: (sessionId: string, productId: string, quantity: number) => Promise<boolean>;
  removeOrderFromSession: (sessionId: string, orderId: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  clubs: [],
  currentClub: null,
  liveTables: [],
  serverTime: null,
  selectedZoneFilter: 'ALL',
  products: [],
  categories: [],
  plans: [],
  isLoading: true,
  isOnline: navigator.onLine,
  isBlocked: false,
  blockedMessage: '',
  supportTelegram: '@playbase_support',
  currentView: 'dashboard',
  activeModal: null,
  selectedTable: null,
  selectedSession: null,

  setUser: (user) => set({ user }),
  
  setIsBlocked: (isBlocked, msg, contact) => set({
    isBlocked,
    blockedMessage: msg || "Sizning hisobingiz administrator tomonidan bloklangan.",
    supportTelegram: contact || "@playbase_support"
  }),

  setCurrentClub: (club) => {
    localStorage.setItem('playbase_club_id', club.id);
    set({ currentClub: club });
    get().fetchLiveTables();
    get().fetchProducts();
  },

  setLiveTables: (liveTables) => set({ liveTables }),
  setSelectedZoneFilter: (selectedZoneFilter) => set({ selectedZoneFilter }),
  setCurrentView: (currentView) => set({ currentView }),

  openModal: (activeModal, table = null, session = null) => {
    set({ activeModal, selectedTable: table, selectedSession: session });
  },

  closeModal: () => {
    set({ activeModal: null, selectedTable: null, selectedSession: null });
  },

  logout: () => {
    localStorage.removeItem('playbase_token');
    localStorage.removeItem('playbase_club_id');
    set({
      user: null,
      currentClub: null,
      clubs: [],
      liveTables: [],
      products: [],
      categories: [],
      plans: [],
      isBlocked: false,
      blockedMessage: '',
      isLoading: false,
    });
    toast.success("Tizimdan muvaffaqiyatli chiqildi.");
  },

  devLogin: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/dev-login/', payload);
      if (res?.data?.access) {
        localStorage.setItem('playbase_token', res.data.access);
        set({ user: res.data.user, isBlocked: false });
        
        // Fetch user clubs
        const clubsRes = await apiClient.get('/clubs/');
        const clubs: Club[] = clubsRes.data.results || clubsRes.data || [];
        set({ clubs });

        if (clubs.length > 0) {
          const activeClub = clubs[0];
          set({ currentClub: activeClub });
          localStorage.setItem('playbase_club_id', activeClub.id);
          
          await Promise.all([
            get().fetchLiveTables(),
            get().fetchProducts(),
            get().fetchPlans()
          ]);
        }
      }
    } catch (err: any) {
      console.error('Dev login failed:', err);
      if (err.response?.status === 403 && err.response?.data?.is_blocked) {
        set({
          isBlocked: true,
          blockedMessage: err.response.data.detail || "Sizning hisobingiz administrator tomonidan bloklangan.",
          supportTelegram: err.response.data.support_telegram || "@playbase_support",
          user: null,
        });
        toast.error("Hisobingiz bloklangan!");
        return;
      }
      toast.error("Kirishda xatolik yuz berdi.");
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  telegramWidgetLogin: async (data: any) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/telegram-widget/', data);
      if (res?.data?.access) {
        localStorage.setItem('playbase_token', res.data.access);
        set({ user: res.data.user, isBlocked: false });
        
        // Fetch user clubs
        const clubsRes = await apiClient.get('/clubs/');
        const clubs: Club[] = clubsRes.data.results || clubsRes.data || [];
        set({ clubs });

        if (clubs.length > 0) {
          const activeClub = clubs[0];
          set({ currentClub: activeClub });
          localStorage.setItem('playbase_club_id', activeClub.id);
          
          await Promise.all([
            get().fetchLiveTables(),
            get().fetchProducts(),
            get().fetchPlans()
          ]);
        }
        toast.success("Telegram orqali muvaffaqiyatli kirildi!");
      }
    } catch (err: any) {
      console.error('Telegram widget login error:', err);
      if (err.response?.status === 403 && err.response?.data?.is_blocked) {
        set({
          isBlocked: true,
          blockedMessage: err.response.data.detail || "Sizning hisobingiz administrator tomonidan bloklangan.",
          supportTelegram: err.response.data.support_telegram || "@playbase_support",
          user: null,
        });
        toast.error("Hisobingiz bloklangan!");
        return;
      }
      const msg = err.response?.data?.detail || "Telegram orqali kirishda xatolik yuz berdi.";
      toast.error(msg);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  initApp: async () => {
    set({ isLoading: true });
    try {
      const tg = (window as any).Telegram?.WebApp;
      let token: string | null = localStorage.getItem('playbase_token');

      // 1. If opened in Telegram WebApp with initData, always authenticate fresh
      if (tg && tg.initData && tg.initData.length > 0) {
        tg.ready();
        tg.expand();
        try {
          const authRes = await apiClient.post('/auth/telegram-web-app/', { init_data: tg.initData });
          if (authRes?.data?.access) {
            token = authRes.data.access;
            if (token) {
              localStorage.setItem('playbase_token', token);
            }
            const userObj = authRes.data.user;
            set({ user: userObj, isBlocked: false });
            if (userObj && userObj.is_active === false) {
              set({ isBlocked: true, isLoading: false });
              return;
            }
          }
        } catch (e: any) {
          console.error("Telegram WebApp auth error:", e);
          if (e.response?.status === 403 && e.response?.data?.is_blocked) {
            set({
              isBlocked: true,
              blockedMessage: e.response.data.detail || "Sizning hisobingiz administrator tomonidan bloklangan.",
              supportTelegram: e.response.data.support_telegram || "@playbase_support",
              isLoading: false,
              user: null,
            });
            return;
          }
        }
      } else if (token) {
        // Fetch profile with existing token
        try {
          const meRes = await apiClient.get('/auth/me/');
          set({ user: meRes.data, isBlocked: false });
          if (meRes.data && meRes.data.is_active === false) {
            set({ isBlocked: true, isLoading: false });
            return;
          }
        } catch (e: any) {
          if (e.response?.status === 401 && (e.response?.data?.code === 'user_inactive' || e.response?.data?.detail?.toString().toLowerCase().includes('inactive'))) {
            set({
              isBlocked: true,
              blockedMessage: "Sizning hisobingiz administrator tomonidan bloklangan.",
              supportTelegram: "@playbase_support",
              isLoading: false,
              user: null,
            });
            return;
          }
          localStorage.removeItem('playbase_token');
          token = null;
          set({ user: null });
        }
      }

      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }

      // 2. Fetch user's clubs
      const clubsRes = await apiClient.get('/clubs/');
      const clubs: Club[] = clubsRes.data.results || clubsRes.data || [];
      set({ clubs });

      if (clubs.length > 0) {
        const savedClubId = localStorage.getItem('playbase_club_id');
        const activeClub = clubs.find(c => c.id === savedClubId) || clubs[0];
        
        // If club itself is blocked/inactive
        if (activeClub && activeClub.is_active === false) {
          set({
            isBlocked: true,
            blockedMessage: `"${activeClub.name}" klubi faoliyati administrator tomonidan bloklangan.`,
            supportTelegram: "@playbase_support",
            currentClub: activeClub,
            isLoading: false,
          });
          return;
        }

        set({ currentClub: activeClub });
        localStorage.setItem('playbase_club_id', activeClub.id);
        
        await Promise.all([
          get().fetchLiveTables(),
          get().fetchProducts(),
          get().fetchPlans()
        ]);
      }
    } catch (err: any) {
      console.error('Failed to init app:', err);
      if (err.response?.status === 403 && err.response?.data?.is_blocked) {
        set({
          isBlocked: true,
          blockedMessage: err.response.data.detail,
          supportTelegram: err.response.data.support_telegram || "@playbase_support"
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLiveTables: async () => {
    const club = get().currentClub;
    if (!club) return;
    try {
      const res = await apiClient.get('/tables/status/');
      set({ liveTables: res.data.tables, serverTime: res.data.server_time });
    } catch (err) {
      console.error('Failed to fetch live tables:', err);
    }
  },

  fetchProducts: async () => {
    const club = get().currentClub;
    if (!club) return;
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get('/products/items/'),
        apiClient.get('/products/categories/')
      ]);
      set({
        products: prodRes.data.results || prodRes.data || [],
        categories: catRes.data.results || catRes.data || []
      });
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  },

  fetchPlans: async () => {
    try {
      const res = await apiClient.get('/billing/plans/');
      set({ plans: res.data || [] });
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  },

  startSession: async (payload) => {
    try {
      await apiClient.post('/sessions/start/', payload);
      toast.success("Sessiya muvaffaqiyatli boshlandi!");
      await get().fetchLiveTables();
      get().closeModal();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Sessiyani boshlashda xatolik.";
      toast.error(msg);
      return false;
    }
  },

  stopSession: async (sessionId, payload) => {
    try {
      const res = await apiClient.post(`/sessions/${sessionId}/stop/`, payload);
      toast.success("Sessiya yakunlandi va hisob-kitob qilindi!");
      await get().fetchLiveTables();
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Sessiyani yakunlashda xatolik.";
      toast.error(msg);
      return null;
    }
  },

  extendSession: async (sessionId, additional_minutes) => {
    try {
      await apiClient.post(`/sessions/${sessionId}/extend/`, { additional_minutes });
      toast.success(`Vaqt +${additional_minutes} daqiqaga uzaytirildi!`);
      await get().fetchLiveTables();
      get().closeModal();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Vaqtni uzaytirishda xatolik.";
      toast.error(msg);
      return false;
    }
  },

  transferTable: async (sessionId, target_table_id) => {
    try {
      await apiClient.post(`/sessions/${sessionId}/transfer/`, { target_table_id });
      toast.success("Stol muvaffaqiyatli almashtirildi!");
      await get().fetchLiveTables();
      get().closeModal();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Stolni almashtirishda xatolik.";
      toast.error(msg);
      return false;
    }
  },

  addOrderToSession: async (sessionId, productId, quantity) => {
    try {
      await apiClient.post(`/sessions/${sessionId}/orders/`, { product_id: productId, quantity });
      toast.success("Mahsulot buyurtmaga qo'shildi!");
      await get().fetchLiveTables();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Buyurtma qo'shishda xatolik.";
      toast.error(msg);
      return false;
    }
  },

  removeOrderFromSession: async (sessionId, orderId) => {
    try {
      await apiClient.delete(`/sessions/${sessionId}/orders/${orderId}/`);
      toast.success("Mahsulot buyurtmadan o'chirildi!");
      await get().fetchLiveTables();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "O'chirishda xatolik.";
      toast.error(msg);
      return false;
    }
  }
}));
