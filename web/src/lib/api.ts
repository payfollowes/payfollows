'use client';

import { getSessionUser, supabase, withSupabaseTimeout } from './supabase/client';
import type {
  Announcement,
  AppNotification,
  AuditLog,
  BalanceTransaction,
  ChatChannel,
  ChatMessage,
  MarginRule,
  MarginRuleInput,
  Order,
  OrderStatus,
  Payment,
  PlatformEarning,
  PlatformSettings,
  PlatformSummaryRow,
  Provider,
  ProviderServiceLink,
  ReferralReward,
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
  // Attach the Supabase access token as a Bearer header so legacy bridge calls
  // authenticate reliably across domains (cookies alone are SameSite-fragile
  // between *.vercel.app sites). Explicit headers always win.
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (!headers.has('Authorization')) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  });
}

const AUTH_LOOKUP_TIMEOUT_MS = 8000;
const SUPABASE_QUERY_TIMEOUT_MS = 12000;

/** Error carrying the legacy bridge's HTTP status so callers can spot 401/403. */
export class BridgeError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'BridgeError';
    this.status = status;
  }
}

export function bridgeError(res: Response, payload: any, fallback: string): BridgeError {
  return new BridgeError(res.status, payload?.message || payload?.error?.message || fallback);
}

/** Auth failures are handled by the shell's redirect, so pages can skip their own toast. */
export function isAuthError(err: unknown): boolean {
  return err instanceof BridgeError && (err.status === 401 || err.status === 403);
}

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

  async signUp(
    email: string,
    password: string,
    username: string,
    metadata: Record<string, string> = {}
  ) {
    const { data, error } = await runQuery(
      supabase.auth.signUp({ email, password, options: { data: { username, ...metadata } } }),
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

  // Sends a Supabase password-recovery email. The link points at /auth/callback
  // which exchanges the PKCE code and lands the user on /update-password.
  async requestPasswordReset(email: string, redirectTo: string) {
    const { data, error } = await runQuery(
      supabase.auth.resetPasswordForEmail(email, { redirectTo }),
      'request password reset'
    );
    if (error) throw error;
    return data;
  },

  // Sets a new password for the recovered session (must run after the callback
  // has established the recovery session).
  async updatePassword(newPassword: string) {
    const { data, error } = await runQuery(
      supabase.auth.updateUser({ password: newPassword }),
      'update password'
    );
    if (error) throw error;
    return data;
  },

  // Rotates the reseller API key via the authenticated SECURITY DEFINER RPC.
  // The guard trigger blocks direct client writes of user_profiles.api_key,
  // so key rotation must go through this RPC.
  async regenerateApiKey(): Promise<string> {
    const { data, error } = await runQuery(
      supabase.rpc('regenerate_api_key'),
      'regenerate api key'
    );
    if (error) throw error;
    return data as string;
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
      // Navigation teardown aborts in-flight fetches (AbortError / Failed to
      // fetch). The regular catalog fallback still applies, so this is a
      // handled degradation, not an app error — keep it out of error logs.
      const isAbort =
        (error as { name?: string })?.name === 'AbortError' ||
        String((error as { message?: string })?.message || '').includes('Failed to fetch');
      if (!isAbort) console.error('[services] merge failed', error);
      else console.warn('[services] merge skipped (request aborted), using base catalog');
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
    providerOrderId?: string,
    drip?: { runs: number; intervalMinutes: number }
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
        p_runs: drip?.runs ?? null,
        p_interval_minutes: drip?.intervalMinutes ?? null,
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

  // Ask the upstream provider to refill a delivered order (guarantee claim).
  async refillOrder(order: Order) {
    if (!order.provider_id || !order.provider_order_id) {
      throw new Error('This order is not linked to a provider yet');
    }
    const res = await apiFetch('/api/provider/refill', {
      method: 'POST',
      body: JSON.stringify({ provider_id: order.provider_id, orders: order.provider_order_id }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.details || payload?.error || 'Refill request failed');
    return payload;
  },

  // Cancel an in-progress order at the provider. Wallet refund (when allowed)
  // is handled separately by an admin through refund_order().
  async cancelOrder(order: Order) {
    if (!order.provider_id || !order.provider_order_id) {
      throw new Error('This order is not linked to a provider yet');
    }
    const res = await apiFetch('/api/provider/cancel', {
      method: 'POST',
      body: JSON.stringify({ provider_id: order.provider_id, orders: order.provider_order_id }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.details || payload?.error || 'Cancel request failed');
    return payload;
  },
};

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export interface PaymentMethodInfo {
  id: string;
  name: string;
  region: string;
  available: boolean;
  comingSoon?: boolean;
  endpoint?: string;
}

export const paymentsAPI = {
  // Capability map from the backend: only configured gateways are selectable;
  // everything else renders as "Coming soon" in the wallet UI.
  async getMethods(): Promise<PaymentMethodInfo[]> {
    try {
      const res = await fetch(apiUrl('/payments/methods'), {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return [];
      const body = await res.json();
      return (body?.data?.methods ?? []) as PaymentMethodInfo[];
    } catch {
      return [];
    }
  },

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
          payment_provider: paymentMethod === 'payfast' ? 'payfast' : 'fastpay',
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
    if (method !== 'fastpay' && method !== 'payfast') {
      throw new Error('This payment method is not available yet. Please choose a live gateway.');
    }
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

  async countProviderServices(providerId: string): Promise<number> {
    const { count, error } = await runQuery(
      supabase
        .from('provider_services')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', providerId),
      'count provider services'
    );
    if (error) throw error;
    return count ?? 0;
  },

  // Pulls the provider's full SMM catalog through the legacy admin bridge,
  // upserts services + provider_services with the given markup and returns
  // the import summary. Runs server-side so the provider API key stays secret.
  async syncProviderServices(input: {
    providerId: string;
    markupPercent: number;
    category?: string;
    replaceExisting?: boolean;
  }): Promise<{ success: boolean; count: number; skipped_services: unknown[]; message: string }> {
    const res = await apiFetch('/api/admin/sync-provider-services', {
      method: 'POST',
      body: JSON.stringify({
        provider_id: input.providerId,
        markup_percent: input.markupPercent,
        category: input.category || undefined,
        replace_existing: input.replaceExisting ?? true,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload?.success === false) {
      throw new Error(payload?.message || payload?.error?.message || 'Catalog sync failed');
    }
    return payload;
  },

  // Margin rules live behind the legacy admin bridge (service-role table).
  // The bridge enforces an authenticated admin session on every call.
  async listMarginRules(filters?: { providerId?: string; active?: boolean }): Promise<MarginRule[]> {
    const query = new URLSearchParams();
    if (filters?.providerId) query.set('provider_id', filters.providerId);
    if (filters?.active !== undefined) query.set('active', String(filters.active));
    const res = await apiFetch(`/api/admin/margin-rules?${query.toString()}`);
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload?.success === false) {
      throw bridgeError(res, payload, 'Failed to load margin rules');
    }
    return Array.isArray(payload?.rules) ? payload.rules : [];
  },

  async createMarginRule(input: MarginRuleInput): Promise<MarginRule> {
    const res = await apiFetch('/api/admin/margin-rules', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload?.success === false) {
      throw bridgeError(res, payload, 'Failed to create margin rule');
    }
    return payload.rule;
  },

  async updateMarginRule(ruleId: string, input: MarginRuleInput): Promise<MarginRule> {
    const res = await apiFetch(`/api/admin/margin-rules/${encodeURIComponent(ruleId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload?.success === false) {
      throw bridgeError(res, payload, 'Failed to update margin rule');
    }
    return payload.rule;
  },

  async deleteMarginRule(ruleId: string): Promise<void> {
    const res = await apiFetch(`/api/admin/margin-rules/${encodeURIComponent(ruleId)}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      const payload = await res.json().catch(() => ({}));
      throw bridgeError(res, payload, 'Failed to delete margin rule');
    }
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

/* ------------------------------------------------------------------ */
/* Notifications (P2)                                                  */
/* ------------------------------------------------------------------ */

export const notificationsAPI = {
  async list(limit = 20): Promise<AppNotification[]> {
    const { data, error } = await runQuery(
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit),
      'list notifications'
    );
    if (error) throw error;
    return (data as AppNotification[]) ?? [];
  },

  async unreadCount(): Promise<number> {
    const { count, error } = await runQuery(
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null),
      'unread notifications'
    );
    if (error) throw error;
    return count ?? 0;
  },

  async markRead(id: string) {
    const { error } = await runQuery(
      supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id),
      'mark notification read'
    );
    if (error) throw error;
  },

  async markAllRead() {
    const { error } = await runQuery(
      supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null),
      'mark all notifications read'
    );
    if (error) throw error;
  },
};

/* ------------------------------------------------------------------ */
/* Referrals (P2)                                                      */
/* ------------------------------------------------------------------ */

export const referralAPI = {
  async listReferredUsers(): Promise<Array<UserProfile & { rewards?: ReferralReward[] }>> {
    const user = await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase
        .from('user_profiles')
        .select('*')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false }),
      'referred users'
    );
    if (error) throw error;
    return (data as UserProfile[]) ?? [];
  },

  async listRewards(): Promise<ReferralReward[]> {
    const { data, error } = await runQuery(
      supabase
        .from('referral_rewards')
        .select('*')
        .order('created_at', { ascending: false }),
      'referral rewards'
    );
    if (error) throw error;
    return (data as ReferralReward[]) ?? [];
  },
};

/* ------------------------------------------------------------------ */
/* Child panels (P2)                                                   */
/* ------------------------------------------------------------------ */

export const childPanelAPI = {
  async listChildren(): Promise<UserProfile[]> {
    const user = await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase
        .from('user_profiles')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false }),
      'child panels'
    );
    if (error) throw error;
    return (data as UserProfile[]) ?? [];
  },

  async attachByCode(code: string): Promise<string> {
    const { data, error } = await runQuery(
      supabase.rpc('attach_to_parent', { p_code: code }),
      'attach child panel'
    );
    if (error) throw error;
    return data as string;
  },

  async transfer(childId: string, amount: number): Promise<number> {
    const { data, error } = await runQuery(
      supabase.rpc('transfer_to_child', { p_child_id: childId, p_amount: amount }),
      'transfer to child'
    );
    if (error) throw error;
    return data as number;
  },

  async childOrders(childId: string): Promise<Order[]> {
    const { data, error } = await runQuery(
      supabase
        .from('orders')
        .select('*, service:services(id, name)')
        .eq('user_id', childId)
        .order('created_at', { ascending: false })
        .limit(50),
      'child orders'
    );
    if (error) throw error;
    return (data as Order[]) ?? [];
  },
};

/* ------------------------------------------------------------------ */
/* Audit logs (P2, admin only via RLS)                                 */
/* ------------------------------------------------------------------ */

export const auditAPI = {
  async list(options: { limit?: number; entityType?: string } = {}): Promise<AuditLog[]> {
    const limit = options.limit ?? 50;
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (options.entityType) query = query.eq('entity_type', options.entityType);
    const { data, error } = await runQuery(query, 'audit logs');
    if (error) throw error;
    return (data as AuditLog[]) ?? [];
  },

  async record(action: string, entityType?: string, entityId?: string, metadata?: Record<string, unknown>) {
    const { error } = await runQuery(
      supabase.rpc('write_audit', {
        p_action: action,
        p_entity_type: entityType ?? null,
        p_entity_id: entityId ?? null,
        p_metadata: metadata ?? {},
      }),
      'write audit'
    );
    if (error) throw error;
  },
};

/* ------------------------------------------------------------------ */
/* Live chat (P2) — tables pre-existed with full RLS                   */
/* ------------------------------------------------------------------ */

export const chatAPI = {
  async getOrCreateChannel(): Promise<ChatChannel> {
    const user = await getAuthenticatedUser();
    const { data: existing, error: findError } = await runQuery(
      supabase
        .from('chat_channels')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'web')
        .maybeSingle(),
      'find chat channel'
    );
    if (findError) throw findError;
    if (existing) return existing as ChatChannel;

    const { data: created, error: createError } = await runQuery(
      supabase
        .from('chat_channels')
        .insert({ user_id: user.id, platform: 'web', status: 'open' })
        .select()
        .single(),
      'create chat channel'
    );
    if (createError) throw createError;
    return created as ChatChannel;
  },

  async listMessages(channelId: string): Promise<ChatMessage[]> {
    const { data, error } = await runQuery(
      supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(200),
      'chat messages'
    );
    if (error) throw error;
    return (data as ChatMessage[]) ?? [];
  },

  async sendMessage(channelId: string, body: string, senderRole: 'user' | 'admin'): Promise<ChatMessage> {
    const user = await getAuthenticatedUser();
    const { data, error } = await runQuery(
      supabase
        .from('chat_messages')
        .insert({ channel_id: channelId, sender_id: user.id, sender_role: senderRole, body: body.trim() })
        .select()
        .single(),
      'send chat message'
    );
    if (error) throw error;
    return data as ChatMessage;
  },

  async listChannels(): Promise<ChatChannel[]> {
    const { data, error } = await runQuery(
      supabase
        .from('chat_channels')
        .select('*, user:user_profiles(username, email)')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(100),
      'chat channels'
    );
    if (error) throw error;
    return (data as ChatChannel[]) ?? [];
  },

  async setChannelStatus(channelId: string, status: ChatChannel['status']) {
    const { error } = await runQuery(
      supabase.from('chat_channels').update({ status }).eq('id', channelId),
      'update chat channel'
    );
    if (error) throw error;
  },
};

/* ------------------------------------------------------------------ */
/* Platform settings (P2)                                              */
/* ------------------------------------------------------------------ */

export const settingsAPI = {
  async get(): Promise<PlatformSettings> {
    const { data, error } = await runQuery(
      supabase.from('app_settings').select('config').eq('id', 'platform').maybeSingle(),
      'platform settings'
    );
    if (error) throw error;
    return ((data as { config: PlatformSettings } | null)?.config ?? {}) as PlatformSettings;
  },

  async update(config: PlatformSettings): Promise<PlatformSettings> {
    const { data, error } = await runQuery(
      supabase
        .from('app_settings')
        .upsert({ id: 'platform', config, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select()
        .single(),
      'update platform settings'
    );
    if (error) throw error;
    return (data as { config: PlatformSettings }).config;
  },
};

/* ------------------------------------------------------------------ */
/* Financial screens (P2, admin only via RLS)                          */
/* ------------------------------------------------------------------ */

export const financialAPI = {
  async earnings(limit = 50): Promise<PlatformEarning[]> {
    const { data, error } = await runQuery(
      supabase
        .from('platform_earnings')
        .select('*')
        .order('order_date', { ascending: false })
        .limit(limit),
      'platform earnings'
    );
    if (error) throw error;
    return (data as PlatformEarning[]) ?? [];
  },

  async summary(days = 30): Promise<PlatformSummaryRow[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await runQuery(
      supabase
        .from('platform_summary')
        .select('*')
        .gte('date', since.toISOString().slice(0, 10))
        .order('date', { ascending: true }),
      'platform summary'
    );
    if (error) throw error;
    return (data as PlatformSummaryRow[]) ?? [];
  },

  async paymentLogs(limit = 50) {
    const { data, error } = await runQuery(
      supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit),
      'payment logs'
    );
    if (error) throw error;
    return data ?? [];
  },

  async payouts(limit = 50) {
    const { data, error } = await runQuery(
      supabase
        .from('provider_payouts')
        .select('*, provider:providers(id, name)')
        .order('created_at', { ascending: false })
        .limit(limit),
      'provider payouts'
    );
    if (error) throw error;
    return data ?? [];
  },
};
