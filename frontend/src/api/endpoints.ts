import apiRoutesData from './api-routes.json';

export const API_ROUTES_CONFIG = apiRoutesData;

export const ENDPOINTS = {
  // Live Dashboard & Sessions
  TABLES_STATUS: '/tables/status/',
  SESSION_START: '/sessions/start/',
  SESSION_STOP: (id: string) => `/sessions/${id}/stop/`,
  SESSION_EXTEND: (id: string) => `/sessions/${id}/extend/`,
  SESSION_TRANSFER: (id: string) => `/sessions/${id}/transfer/`,
  SESSION_ADD_ORDER: (id: string) => `/sessions/${id}/orders/`,
  SESSION_REMOVE_ORDER: (id: string, orderId: string) => `/sessions/${id}/orders/${orderId}/`,
  SESSION_HISTORY: '/sessions/history/',

  // Bar POS & Products
  PRODUCTS: '/products/',
  PRODUCT_DETAIL: (id: string) => `/products/${id}/`,
  CATEGORIES: '/products/categories/',
  CATEGORY_DETAIL: (id: string) => `/products/categories/${id}/`,
  BAR_SALES: '/products/sales/',

  // Analytics
  ANALYTICS_DASHBOARD: '/analytics/dashboard/',
  ANALYTICS_REVENUE_TRENDS: '/analytics/revenue-trends/',
  ANALYTICS_PEAK_HOURS: '/analytics/peak-hours/',
  ANALYTICS_TOP_PRODUCTS: '/analytics/top-products/',
  ANALYTICS_PAYMENT_METHODS: '/analytics/payment-methods/',

  // Settings & Management
  CLUB_INFO: '/club/info/',
  ZONES: '/zones/',
  ZONE_DETAIL: (id: string) => `/zones/${id}/`,
  TABLES: '/tables/',
  TABLE_DETAIL: (id: string) => `/tables/${id}/`,

  // Billing
  BILLING_PLANS: '/billing/plans/',
  BILLING_SUBSCRIBE: '/billing/subscribe/',
  BILLING_TRANSACTIONS: '/billing/transactions/',

  // Auth
  AUTH_TELEGRAM_WEBAPP: '/auth/telegram-web-app/',
  AUTH_TELEGRAM_WIDGET: '/auth/telegram-widget/',
  AUTH_TOKEN_REFRESH: '/auth/token/refresh/',
};
