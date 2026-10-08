export type TableStatus = 'IDLE' | 'OCCUPIED' | 'MAINTENANCE';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentType = 'CASH' | 'CARD' | 'TRANSFER' | 'DEBT';
export type BarPaymentType = 'CASH' | 'CARD' | 'TRANSFER' | 'DEBT';
export type MemberRole = 'OWNER' | 'ADMIN' | 'CASHIER';

export interface User {
  id: string;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  is_owner: boolean;
  is_active?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  price_per_month: number;
  max_tables: number;
  max_staff: number;
  features_json: Record<string, any>;
  is_active: boolean;
}

export interface Zone {
  id: string;
  club: string;
  name: string;
  hourly_rate: number;
  color_code: string;
  icon: string;
  order: number;
  is_active: boolean;
  tables_count?: number;
}

export interface GameTable {
  id: string;
  club: string;
  zone: string;
  zone_name: string;
  zone_hourly_rate: number;
  zone_color_code: string;
  name: string;
  number: number;
  status: TableStatus;
  order: number;
  is_active: boolean;
  is_plan_locked?: boolean;
  lock_reason?: string;
}

export interface OrderItem {
  id: string;
  session: string;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Session {
  id: string;
  table: string;
  table_name: string;
  table_number: number;
  zone_name: string;
  zone_color: string;
  club: string;
  customer_name?: string;
  customer_phone?: string;
  start_time: string;
  end_time?: string;
  planned_end_time?: string;
  is_open_ended: boolean;
  duration_minutes?: number;
  applied_hourly_rate: number;
  time_amount: number;
  bar_amount: number;
  discount_amount: number;
  total_amount: number;
  current_time_amount?: number;
  current_total_amount?: number;
  elapsed_seconds?: number;
  remaining_seconds?: number;
  payment_type: PaymentType;
  status: SessionStatus;
  note?: string;
  orders: OrderItem[];
  created_at: string;
}

export interface LiveTableData {
  id: string;
  name: string;
  number: number;
  status: TableStatus;
  zone_id: string;
  zone_name: string;
  zone_color: string;
  zone_icon: string;
  hourly_rate: number;
  active_session: Session | null;
  is_plan_locked?: boolean;
  lock_reason?: string;
}

export interface ProductCategory {
  id: string;
  club: string;
  name: string;
  icon: string;
  order: number;
  products_count?: number;
}

export interface Product {
  id: string;
  club: string;
  category?: string;
  category_name?: string;
  name: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  barcode?: string;
  image_url?: string;
  is_available: boolean;
}

export interface Club {
  id: string;
  name: string;
  owner: User;
  address?: string;
  phone?: string;
  logo_url?: string;
  currency: string;
  rounding_unit: number;
  active_plan?: string;
  active_plan_detail?: SubscriptionPlan;
  plan_expires_at?: string;
  is_trial: boolean;
  is_active: boolean;
  has_active_subscription: boolean;
  days_left: number;
  zones: Zone[];
  tables_count: number;
}
