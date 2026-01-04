/**
 * Types for RentFlow Universal Rental System
 */

// ==================== ENUMS ====================

export type SessionStatus = "active" | "completed" | "cancelled" | "expired";
export type BillingType = "per_minute" | "per_hour" | "fixed" | "per_game";
export type PaymentType = "cash" | "card" | "transfer";
export type UserRole = "super_admin" | "admin" | "staff";
export type TenantRole = "owner" | "manager" | "staff";
export type DiscountType = "percentage" | "fixed_amount";

// ==================== AUTH ====================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
}

export interface TenantInfo {
  id: number;
  name: string;
  slug: string;
  role: TenantRole;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  tenants: TenantInfo[];
}

// ==================== TENANT ====================

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  id: number;
  currency: string;
  currency_symbol: string;
  default_billing_type: BillingType;
  default_price: number;
  working_hours_start: string | null;
  working_hours_end: string | null;
  esp_timeout: number;
  updated_at: string;
}

// ==================== CATEGORY ====================

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  custom_fields_schema: Record<string, unknown>;
  assets_count: number;
  created_at: string;
  updated_at: string;
}

// ==================== ASSET ====================

export interface IotDevice {
  id: number;
  name: string;
  device_type: string;
  ip_address: string;
  mac_address: string;
  is_online: boolean;
  last_seen_at: string | null;
  metadata: Record<string, unknown>;
}

export interface AssetIotDevice {
  id: number;
  device: IotDevice;
  config: {
    gpioPin?: number;
    action?: string;
  };
}

export interface Asset {
  id: number;
  category: number;
  category_name: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  custom_fields: Record<string, unknown>;
  is_occupied: boolean;
  iot_devices: AssetIotDevice[];
  created_at: string;
  updated_at: string;
}

export interface AssetWithSession extends Asset {
  active_session: RentalSession | null;
}

// ==================== SESSION ====================

export interface RentalSession {
  id: string;
  asset: number;
  asset_name: string;
  category_name: string;
  started_at: string;
  ended_at: string | null;
  planned_duration: number | null;
  actual_duration: number | null;
  billing_type: BillingType;
  price_snapshot: number;
  pricing_rule: number | null;
  subtotal: number | null;
  discount_amount: number;
  total_cost: number | null;
  status: SessionStatus;
  payment_type: PaymentType | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ==================== PRICING ====================

export interface PricingRule {
  id: number;
  category: number | null;
  category_name: string | null;
  asset: number | null;
  asset_name: string | null;
  name: string;
  billing_type: BillingType;
  price: number;
  min_duration: number | null;
  day_of_week_start: number | null;
  day_of_week_end: number | null;
  time_start: string | null;
  time_end: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: number;
  name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_session_duration: number | null;
  min_total_amount: number | null;
  max_usages: number | null;
  current_usages: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== REPORTS ====================

export interface ReportTotals {
  revenue: number;
  sessions: number;
  avg_duration: number;
  avg_check: number;
  occupancy_rate: number;
}

export interface ReportPeriodData {
  period: string;
  revenue: number;
  sessions: number;
  avg_duration: number;
}

export interface TopAsset {
  asset__id: number;
  asset__name: string;
  asset__category__name: string;
  revenue: number;
  sessions: number;
}

export interface TopCategory {
  asset__category__id: number;
  asset__category__name: string;
  revenue: number;
  sessions: number;
}

export interface ReportSummary {
  totals: ReportTotals;
  by_period: ReportPeriodData[];
  top_assets: TopAsset[];
  top_categories: TopCategory[];
}

// ==================== LEGACY (для совместимости) ====================

export interface TableWithSession {
  id: number;
  name: string;
  description: string | null;
  gpioPin: number;
  hourlyRate: number;
  isActive: boolean;
  activeSession: {
    id: string;
    startedAt: Date;
    duration: number | null;
    hourlyRate: number;
    status: SessionStatus;
  } | null;
}
