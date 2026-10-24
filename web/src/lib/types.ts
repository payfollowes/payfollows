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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  severity?: 'info' | 'success' | 'warning' | 'critical';
  is_active?: boolean;
  created_at: string;
}

export interface ProviderServiceLink {
  providerId: string;
  providerServiceId: string;
}
