'use client';

import { getSessionUser, supabase, withSupabaseTimeout } from './supabase/client';
import type {
  Announcement,
  BalanceTransaction,
  Order,
  OrderStatus,
  Payment,
  Provider,
  ProviderServiceLink,
  Service,
  SupportTicket,
  UserProfile,
} from './types';

/**
 * Legacy Vite panel owns the serverless API (services cache, provider bridge,
 * payments, admin endpoints). In production the new app calls it cross-origin;
 * in dev Next rewrites proxy relative /api paths to it.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
}

const AUTH_LOOKUP_TIMEOUT_MS = 8000;
const SUPABASE_QUERY_TIMEOUT_MS = 12000;

async function getAuthenticatedUser() {
  const user = await getSessionUser(AUTH_LOOKUP_TIMEOUT_MS);
  if (!user) throw new Error('User not authenticated');
  return user;
}

async function runQuery<T>(operation: PromiseLike<T>, label: string) {
  return withSupabaseTimeout(operation, label, SUPABASE_QUERY_TIMEOUT_MS);
}

/* ------------------------------------------------------------------ */
/* Provider services snapshot (cached, resilient)                      */
/* ------------------------------------------------------------------ */

const PROVIDER_SERVICES_TTL = 60_000;
const PROVIDER_BACKOFF = 8_000;
let providerCache: any[] = [];
let providerCacheExpires = 0;
let providerBackoffUntil = 0;

export async function getProviderServicesSnapshot(): Promise<any[]> {
  const now = Date.now();
  if (providerCacheExpires > now) return providerCache;
  if (providerBackoffUntil > now) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await apiFetch('/api/integrations/provider-services', { signal: controller.signal });
    if (!res.ok) throw new Error(`provider services ${res.status}`);
    const payload = await res.json().catch(() => ({}));
    const body = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
    providerCache = Array.isArray(body?.providerServices) ? body.providerServices : [];
    providerCacheExpires = Date.now() + PROVIDER_SERVICES_TTL;
    providerBackoffUntil = 0;
    return providerCache;
  } catch (error) {
    providerBackoffUntil = Date.now() + PROVIDER_BACKOFF;
    console.warn('[provider] snapshot failed, using regular services only', error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchProviderServiceLink(serviceId: string): Promise<ProviderServiceLink | null> {
  try {
    const res = await apiFetch(
      `/api/integrations/provider-service-link?service_id=${encodeURIComponent(serviceId)}`
    );
    if (!res.ok) return null;
    const payload = await res.json().catch(() => ({}));
    const link = payload?.providerLink;
    const providerId = String(link?.provider_id || link?.providerId || '').trim();
    const providerServiceId = String(link?.provider_service_id || link?.providerServiceId || '').trim();
    return providerId && providerServiceId ? { providerId, providerServiceId } : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const authAPI = {
  async signIn(email: string, password: string) {
    const res = await runQuery(
      supabase.auth.signInWithPassword({ email, password }),
      'auth sign in'
    );
    if ((res as any).error) {
      const err = (res as any).error;
      throw new Error(err.message || 'Invalid login credentials');
    }
    return (res as any).data;
  },

  async signUp(email: string, password: string, username: string) {
    const { data, error } = await runQuery(
      supabase.auth.signUp({ email, password, options: { data: { username } } }),
      'auth sign up'
    );
    if (error) throw error;
    if (data.user) {
      const { error: profileError } = await runQuery(
        // The handle_new_user trigger already creates the profile; treat this
        // as a best-effort fallback that never overwrites an existing row
        // (clients have no direct UPDATE policy on user_profiles).
        supabase
          .from('user_profiles')
          .upsert({ id: data.user.id, email, username, role: 'user' }, {
            onConflict: 'id',
            ignoreDuplicates: true,
          }),
        'profile upsert'
      );
      if (profileError) console.warn('[auth] profile upsert warning', profileError);
    }
    return data;
  },

  async signInWithGoogle(redirectTo = `${window.location.origin}/dashboard`) {
    const { data, error } = await runQuery(
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { prompt: 'select_account' } },
      }),
      'google oauth'
    );
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await runQuery(supabase.auth.signOut(), 'sign out');
    if (error) throw error;
  },

  async getUserProfile(): Promise<UserProfile | null> {
    const user = await getSessionUser(AUTH_LOOKUP_TIMEOUT_MS);
    if (!user) return null;
    const { data, error } = await runQuery(
      supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      'user profile'
    );
    if (error) throw error;
    return (data as UserProfile) ?? null;
  },

  async getCurrentUser() {
    const user = await getSessionUser(AUTH_LOOKUP_TIMEOUT_MS);
    if (!user) return null;
    const { data: profile, error } = await runQuery(
      supabase.from('user_profiles').select('username, role').eq('id', user.id).maybeSingle(),
      'current user'
    );
    if (error) throw error;
    if (!profile) return null;
    return { id: user.id, username: profile.username, role: profile.role as 'user' | 'admin' };
  },
};

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export const servicesAPI = {
  async getServices(category?: string): Promise<Service[]> {
    const res = await apiFetch('/api/services');
    if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`);
    const payload = await res.json().catch(() => ({}));
    const rows: Service[] = Array.isArray(payload?.services) ? payload.services : [];
    return category ? rows.filter((s) => s.category === category) : rows;
  },

  async getService(id: string): Promise<Service> {
    const res = await apiFetch(`/api/services/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Failed to fetch service: ${res.status}`);
    const payload = await res.json().catch(() => ({}));
    return payload.service as Service;
  },

  async getMergedServices(category?: string): Promise<Service[]> {
    try {
      const [regular, providerServices] = await Promise.all([
        this.getServices(),
        getProviderServicesSnapshot(),
      ]);
      if (!providerServices.length) {
        return category ? regular.filter((s) => s.category === category) : regular;
      }
      const byServiceId = new Map<string, any>();
      providerServices.forEach((ps: any) => {
        const sid = String(ps?.service_id || '').trim();
        if (!sid || byServiceId.has(sid)) return;
        if (ps?.status && ps.status !== 'active') return;
        byServiceId.set(sid, ps);
      });
      const merged = regular.map((service) => {
        const info = byServiceId.get(service.id);
        if (!info) return service;
        const linked = Array.isArray(info.services) ? info.services[0] : info.services;
        const completion = linked?.completion_time ?? service.completion_time ?? null;
        return {
          ...service,
          rate_per_1000: Number(info.our_rate ?? service.rate_per_1000),
          min_quantity: Number(info.min_quantity ?? service.min_quantity),
          max_quantity: Number(info.max_quantity ?? service.max_quantity),
          completion_time: completion === null || completion === undefined ? null : Number(completion),
          completion_time_text: info?.completion_time_text ?? service.completion_time_text ?? null,
        };
      });
      return category ? merged.filter((s) => s.category === category) : merged;
    } catch (error) {
      console.error('[services] merge failed', error);
      return this.getServices(category);
    }
  },

  async resolveProviderLink(serviceId: string): Promise<ProviderServiceLink | null> {
    const snapshot = (await getProviderServicesSnapshot()).find(
      (row: any) =>
        row?.status !== 'inactive' && String(row?.service_id || '').trim() === String(serviceId).trim()
    );
    if (snapshot?.provider_id && snapshot?.provider_service_id) {
      return {
        providerId: String(snapshot.provider_id).trim(),
        providerServiceId: String(snapshot.provider_service_id).trim(),
      };
    }
    return fetchProviderServiceLink(serviceId);
  },
};

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const ordersAPI = {
  async createOrder(
    serviceId: string,
    link: string,
    quantity: number,
    deliveryTime = 24,
    providerId?: string,
    providerOrderId?: string
  ): Promise<Order> {
    // Atomic, server-side operation: the place_order RPC validates the
    // service, resolves the margin-managed rate, checks the balance under a
    // row lock, inserts the order, debits the wallet and writes a ledger entry
    // in one transaction. Direct client balance writes are blocked by RLS.
    await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase.rpc('place_order', {
        p_service_id: serviceId,
        p_link: link,
        p_quantity: quantity,
        p_delivery_time: deliveryTime,
        p_provider_id: providerId ?? null,
        p_provider_order_id: providerOrderId ?? null,
      }),
      'place order'
    );
    if (error) throw error;
    return data as Order;
  },

  async getOrders(): Promise<Order[]> {
    const user = await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase
        .from('orders')
        .select('*, service:services(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      'user orders'
    );
    if (error) throw error;
    return data as Order[];
  },

  async syncOrders() {
    try {
      const res = await apiFetch('/api/provider/sync-local-orders', { method: 'POST' });
      if (!res.ok) return null;
      return res.json().catch(() => null);
    } catch (error) {
      console.warn('[orders] sync failed', error);
      return null;
    }
  },

  async placeWithProvider(providerId: string, providerServiceId: string, link: string, quantity: number) {
    const res = await apiFetch('/api/provider/add-order', {
      method: 'POST',
      body: JSON.stringify({
        provider_id: providerId,
        service: Number(providerServiceId),
        link,
        quantity,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.error || 'Provider order failed');
    return payload;
  },
};

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export const paymentsAPI = {
  async createPayment(amount: number, paymentMethod: string): Promise<Payment> {
    const user = await getAuthenticatedUser();
    const fee = amount * 0.02;
    const total = amount + fee;
    const { data, error } = await runQuery(
      supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount,
          fee,
          total,
          payment_method: paymentMethod,
          payment_provider: 'fastpay',
        })
        .select()
        .single(),
      'create payment'
    );
    if (error) throw error;
    return data as Payment;
  },

  async getPayments(): Promise<Payment[]> {
    const user = await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      'user payments'
    );
    if (error) throw error;
    return data as Payment[];
  },

  async createGatewayOrder(payment: Payment, profile: UserProfile, method: string) {
    const endpoint = method === 'payfast' ? '/api/payments/payfast' : '/api/fastpay/create-order';
    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        paymentId: payment.id,
        amount: payment.total,
        customerEmail: profile.email,
        customerName: profile.username,
        returnUrl: `${window.location.origin}/dashboard/add-funds?success=true&payment_id=${payment.id}`,
        cancelUrl: `${window.location.origin}/dashboard/add-funds?canceled=true&payment_id=${payment.id}`,
      }),
    });
    if (!res.ok) throw new Error(`Payment gateway error (${res.status})`);
    return res.json().catch(() => ({}));
  },
};

/* ------------------------------------------------------------------ */
/* Support + announcements                                             */
/* ------------------------------------------------------------------ */

export const supportAPI = {
  async listMine(): Promise<SupportTicket[]> {
    const user = await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      'my tickets'
    );
    if (error) throw error;
    return (data as SupportTicket[]) ?? [];
  },

  async create(subject: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    const user = await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase
        .from('support_tickets')
        .insert({ user_id: user.id, subject, message, status: 'open', priority })
        .select()
        .single(),
      'create ticket'
    );
    if (error) throw error;
    return data as SupportTicket;
  },
};

export const announcementAPI = {
  async listActive(): Promise<Announcement[]> {
    const { data, error } = await runQuery(
      supabase
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10),
      'active announcements'
    );
    if (error) throw error;
    return (data as Announcement[]) ?? [];
  },
};

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export const adminAPI = {
  async getDashboardStats() {
    const [usersRes, ordersRes, paymentsRes, servicesRes] = await Promise.all([
      runQuery(supabase.from('user_profiles').select('id', { count: 'exact', head: true }), 'users count'),
      runQuery(supabase.from('orders').select('id, status, charge', { count: 'exact' }), 'orders stats'),
      runQuery(supabase.from('payments').select('id, amount, status', { count: 'exact' }), 'payments stats'),
      runQuery(supabase.from('services').select('id', { count: 'exact', head: true }), 'services count'),
    ]);
    if (usersRes.error) throw usersRes.error;
    if (ordersRes.error) throw ordersRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    if (servicesRes.error) throw servicesRes.error;

    const totalRevenue =
      paymentsRes.data?.filter((p) => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0) || 0;
    return {
      totalUsers: usersRes.count || 0,
      totalOrders: ordersRes.count || 0,
      totalRevenue,
      totalServices: servicesRes.count || 0,
      pendingOrders: ordersRes.data?.filter((o) => o.status === 'pending').length || 0,
      completedOrders: ordersRes.data?.filter((o) => o.status === 'completed').length || 0,
    };
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await runQuery(
      supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
      'admin users'
    );
    if (error) throw error;
    return (data as UserProfile[]) ?? [];
  },

  async updateUserBalance(userId: string, balance: number, reason?: string) {
    // Routed through an admin-only RPC so the delta lands in the ledger and
    // direct balance writes (blocked by the profile guard trigger) never happen.
    const { data, error } = await runQuery(
      supabase.rpc('admin_set_balance', {
        p_user_id: userId,
        p_new_balance: balance,
        p_reason: reason ?? 'Manual admin adjustment',
      }),
      'update balance'
    );
    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, role: 'user' | 'admin') {
    const { data, error } = await runQuery(
      supabase.from('user_profiles').update({ role }).eq('id', userId).select().single(),
      'update role'
    );
    if (error) throw error;
    return data;
  },

  async updateUserStatus(userId: string, status: string) {
    const { data, error } = await runQuery(
      supabase.from('user_profiles').update({ status }).eq('id', userId).select().single(),
      'update status'
    );
    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');
    const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/delete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        payload?.error && typeof payload.error === 'object' ? payload.error.message : payload?.error || 'Delete failed'
      );
    }
  },

  async getAllServices(): Promise<Service[]> {
    const { data, error } = await runQuery(
      supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true }),
      'admin services'
    );
    if (error) throw error;
    return (data as Service[]) ?? [];
  },

  async createService(service: Omit<Service, 'id'>) {
    const { data, error } = await runQuery(
      supabase.from('services').insert(service).select().single(),
      'create service'
    );
    if (error) throw error;
    return data as Service;
  },

  async updateService(serviceId: string, updates: Partial<Service>) {
    const { data, error } = await runQuery(
      supabase.from('services').update(updates).eq('id', serviceId).select().single(),
      'update service'
    );
    if (error) throw error;
    return data as Service;
  },

  async deleteService(serviceId: string) {
    const { error } = await runQuery(
      supabase.from('services').delete().eq('id', serviceId),
      'delete service'
    );
    if (error) throw error;
  },

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await runQuery(
      supabase
        .from('orders')
        .select('*, service:services(*), user:user_profiles(username, email)')
        .order('created_at', { ascending: false }),
      'admin orders'
    );
    if (error) throw error;
    return (data as Order[]) ?? [];
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const { data, error } = await runQuery(
      supabase.from('orders').update({ status }).eq('id', orderId).select().single(),
      'update order status'
    );
    if (error) throw error;
    return data as Order;
  },

  async refundOrder(orderId: string, reason?: string) {
    // Admin-only RPC: validates the order state, credits the wallet atomically,
    // reverses total_spent and appends a ledger row. Idempotent per order.
    const { data, error } = await runQuery(
      supabase.rpc('refund_order', {
        p_order_id: orderId,
        p_reason: reason ?? 'Order refund',
      }),
      'refund order'
    );
    if (error) throw error;
    return data as Order;
  },

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await runQuery(
      supabase
        .from('payments')
        .select('*, user:user_profiles(username, email)')
        .order('created_at', { ascending: false }),
      'admin payments'
    );
    if (error) throw error;
    return (data as Payment[]) ?? [];
  },

  async getAllProviders(): Promise<Provider[]> {
    const { data, error } = await runQuery(
      supabase.from('providers').select('*').order('created_at', { ascending: false }),
      'admin providers'
    );
    if (error) throw error;
    return (data as Provider[]) ?? [];
  },

  async createProvider(provider: Partial<Provider>) {
    const { data, error } = await runQuery(
      supabase.from('providers').insert(provider).select().single(),
      'create provider'
    );
    if (error) throw error;
    return data as Provider;
  },

  async updateProvider(providerId: string, updates: Partial<Provider>) {
    const { data, error } = await runQuery(
      supabase.from('providers').update(updates).eq('id', providerId).select().single(),
      'update provider'
    );
    if (error) throw error;
    return data as Provider;
  },

  async deleteProvider(providerId: string) {
    const { error } = await runQuery(
      supabase.from('providers').delete().eq('id', providerId),
      'delete provider'
    );
    if (error) throw error;
  },

  async getAllTickets(): Promise<SupportTicket[]> {
    const { data, error } = await runQuery(
      supabase
        .from('support_tickets')
        .select('*, user:user_profiles(username, email)')
        .order('created_at', { ascending: false }),
      'admin tickets'
    );
    if (error) throw error;
    return (data as SupportTicket[]) ?? [];
  },

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>) {
    const { data, error } = await runQuery(
      supabase.from('support_tickets').update(updates).eq('id', ticketId).select().single(),
      'update ticket'
    );
    if (error) throw error;
    return data as SupportTicket;
  },

  async listAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await runQuery(
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      'admin announcements'
    );
    if (error) throw error;
    return (data as Announcement[]) ?? [];
  },

  async createAnnouncement(input: {
    subject: string;
    message: string;
    type?: Announcement['type'];
  }) {
    const { data, error } = await runQuery(
      supabase
        .from('announcements')
        .insert({
          subject: input.subject,
          message: input.message,
          type: input.type ?? 'info',
          status: 'published',
        })
        .select()
        .single(),
      'create announcement'
    );
    if (error) throw error;
    return data as Announcement;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>) {
    const { data, error } = await runQuery(
      supabase.from('announcements').update(updates).eq('id', id).select().single(),
      'update announcement'
    );
    if (error) throw error;
    return data as Announcement;
  },

  async deleteAnnouncement(id: string) {
    const { error } = await runQuery(
      supabase.from('announcements').delete().eq('id', id),
      'delete announcement'
    );
    if (error) throw error;
  },
};

/* ------------------------------------------------------------------ */
/* Wallet ledger                                                       */
/* ------------------------------------------------------------------ */

export const walletAPI = {
  async listTransactions(limit = 50) {
    const { data, error } = await runQuery(
      supabase
        .from('balance_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit),
      'list ledger'
    );
    if (error) throw error;
    return (data as BalanceTransaction[]) ?? [];
  },
};
