export interface SuperAdminUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_owner: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SuperAdminClub {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  currency: string;
  rounding_unit: number;
  owner: string;
  owner_name?: string;
  owner_username?: string;
  owner_phone?: string;
  owner_telegram_id?: number;
  active_plan?: string;
  active_plan_name?: string;
  plan_expires_at?: string;
  is_trial: boolean;
  is_active: boolean;
  has_active_subscription: boolean;
  days_left: number;
  tables_count: number;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  price_per_month: number;
  max_tables: number;
  max_staff: number;
  features_json?: Record<string, any>;
  is_active: boolean;
  clubs_count?: number;
  created_at?: string;
}

export interface SaaSTransaction {
  id: string;
  club: string;
  club_name?: string;
  owner_name?: string;
  owner_phone?: string;
  plan: string;
  plan_name?: string;
  amount: number;
  provider: 'PAYME' | 'CLICK';
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OverviewData {
  total_clubs: number;
  active_subscribed_clubs: number;
  trial_clubs: number;
  expired_clubs: number;
  blocked_clubs: number;
  total_tables: number;
  total_users: number;
  active_sessions_count: number;
  total_revenue: number;
  mrr_revenue: number;
  payme_revenue: number;
  click_revenue: number;
  daily_registrations: Array<{ date: string; count: number }>;
  recent_transactions: SaaSTransaction[];
}

export type AdminViewType = 'overview' | 'clubs' | 'plans' | 'billing' | 'users' | 'broadcast' | 'settings';
