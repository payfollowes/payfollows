export type UserRole = 'user' | 'admin';

export interface AppUser {
  id?: string;
  username: string;
  email?: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  api_key?: string | null;
  role: UserRole;
  status?: string;
  balance: number;
  total_spent: number;
  created_at: string;
  referral_code?: string | null;
  referred_by?: string | null;
  parent_id?: string | null;
}

export type NotificationType = 'info' | 'order' | 'payment' | 'system' | 'referral' | 'support' | 'child';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_id: string;
  trigger_payment_id: string | null;
  reward_amount: number;
  status: 'paid' | 'reversed';
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatChannel {
  id: string;
  user_id: string;
  platform: string;
  status: 'open' | 'pending' | 'closed';
  last_message: string | null;
  last_sender_role: 'user' | 'admin' | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  user?: { username: string; email: string };
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string | null;
  sender_role: 'user' | 'admin';
  body: string;
  created_at: string;
}

export interface PlatformSettings {
  site_name?: string;
  support_email?: string;
  min_deposit?: number;
  processing_fee_pct?: number;
  maintenance?: boolean;
  new_orders?: boolean;
  auto_sync?: boolean;
  email_alerts?: boolean;
  referral_reward_enabled?: boolean;
  referral_reward_amount?: number;
}

export interface PlatformEarning {
  id: string;
  order_id: string;
  user_id: string;
  provider_id: string | null;
  customer_charge: number;
  provider_cost: number;
  platform_profit: number;
  platform_commission: number;
  status: string;
  order_date: string;
  completion_date: string | null;
}

export interface PlatformSummaryRow {
  date: string;
  total_customer_charges: number;
  total_provider_costs: number;
  gross_profit: number;
  net_profit: number;
  total_orders: number;
  successful_orders: number;
  failed_orders: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  rate_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  completion_time?: number | null;
  completion_time_text?: string | null;
  time_pricing?: Record<string, number> | null;
  status: 'active' | 'inactive';
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'canceled' | 'failed';

export interface Order {
  id: string;
  user_id: string;
  service_id: string;
  provider_id?: string | null;
  link: string;
  quantity: number;
  charge: number;
  delivery_time?: number | null;
  status: OrderStatus;
  provider_order_id?: string | null;
  start_count?: number | null;
  remains?: number | null;
  created_at: string;
  is_dripfeed?: boolean;
  runs?: number | null;
  interval_minutes?: number | null;
  runs_delivered?: number;
  service?: Service;
  user?: { username: string; email: string };
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'canceled';

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  total: number;
  payment_method: string;
  payment_provider: string;
  transaction_id: string | null;
  status: PaymentStatus;
  fastpay_order_id: string | null;
  created_at: string;
  user?: { username: string; email: string };
}

export type LedgerEntryType =
  | 'deposit'
  | 'order_debit'
  | 'refund'
  | 'admin_adjustment'
  | 'referral_bonus';

export interface BalanceTransaction {
  id: string;
  user_id: string;
  type: LedgerEntryType;
  amount: number; // signed: positive credit, negative debit
  balance_after: number;
  reference_type: 'payment' | 'order' | 'manual' | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  api_secret?: string;
  balance: number;
  markup_percentage?: number | null;
  status: 'active' | 'inactive' | 'error';
  last_sync?: string;
  created_at?: string;
}

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  user_id?: string;
  subject: string;
  message: string;
  reply?: string;
  status: TicketStatus;
  priority?: TicketPriority;
  created_at: string;
  updated_at?: string;
  user?: { username: string; email: string };
}

export type AnnouncementType = 'info' | 'warning' | 'success';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';

export interface Announcement {
  id: string;
  subject: string;
  message: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  created_at: string;
  updated_at?: string;
}

export interface ProviderServiceLink {
  providerId: string;
  providerServiceId: string;
}

export type MarginType = 'percent' | 'fixed';

export interface MarginRule {
  id: string;
  provider_id: string | null;
  service_id: string | null;
  category: string | null;
  margin_type: MarginType;
  margin_value: number;
  min_margin: number | null;
  max_margin: number | null;
  active: boolean;
  priority: number;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MarginRuleInput {
  provider_id?: string | null;
  service_id?: string | null;
  category?: string | null;
  margin_type: MarginType;
  margin_value: number;
  min_margin?: number | null;
  max_margin?: number | null;
  active: boolean;
  priority: number;
}
