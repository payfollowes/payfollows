'use client';

import { createClient, type User } from '@supabase/supabase-js';

// Placeholder fallbacks keep module evaluation safe during SSR/prerender when
// env vars are absent (e.g. local builds). Real values are required at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key-placeholder';

const FETCH_TIMEOUT_MS = 15_000;
const AUTH_COOKIE_SESSION_ENDPOINT = '/api/auth/session';
const AUTH_COOKIE_CLEAR_ENDPOINT = '/api/auth/clear';

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced in the UI via health banner instead of crashing SSR.
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are not configured');
}

const getAuthStorageKey = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    const projectRef = hostname.split('.')[0]?.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    if (projectRef) return `payfollows.auth.${projectRef}`;
  } catch {
    /* ignore */
  }
  return 'payfollows.auth.token';
};

const AUTH_STORAGE_KEY = getAuthStorageKey(supabaseUrl);

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  if (init?.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(input, { ...(init ?? {}), signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

/** Best-effort mirror of the Supabase session to the legacy backend cookie. */
function syncAuthCookie(rawValue: string | null) {
  if (typeof window === 'undefined') return;
  try {
    let session: { access_token?: string; refresh_token?: string; expires_at?: number; expires_in?: number } | null = null;
    if (rawValue) {
      const parsed = JSON.parse(rawValue);
      session = parsed?.currentSession ?? parsed;
    }
    const body = session?.access_token
      ? {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at ?? null,
          expiresIn: session.expires_in ?? null,
        }
      : {};
    const endpoint = session?.access_token ? AUTH_COOKIE_SESSION_ENDPOINT : AUTH_COOKIE_CLEAR_ENDPOINT;
    void fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      /* legacy backend unreachable — Supabase localStorage session still works */
    });
  } catch {
    /* ignore malformed storage */
  }
}

const browserStorage = {
  getItem: (key: string) => (typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);
    if (key === AUTH_STORAGE_KEY) syncAuthCookie(value);
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    if (key === AUTH_STORAGE_KEY) syncAuthCookie(null);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window === 'undefined' ? undefined : browserStorage,
    storageKey: AUTH_STORAGE_KEY,
    flowType: 'pkce',
  },
  global: {
    headers: { 'Content-Type': 'application/json' },
    fetch: fetchWithTimeout,
  },
});

export async function withSupabaseTimeout<T>(
  promise: PromiseLike<T>,
  label: string,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      }),
    ]);
  } catch (error) {
    if (error instanceof Error && /timeout/i.test(error.message)) {
      console.warn(`[Supabase] ${label} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function getSessionUser(timeoutMs = FETCH_TIMEOUT_MS): Promise<User | null> {
  const {
    data: { session },
    error,
  } = await withSupabaseTimeout(supabase.auth.getSession(), 'auth session lookup', timeoutMs);
  if (error) throw error;
  return session?.user ?? null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
