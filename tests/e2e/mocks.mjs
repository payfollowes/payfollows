/**
 * Offline network layer for UI E2E: a real local HTTP stub (see
 * stub-server.mjs) serves emulated Supabase/legacy responses, while
 * Playwright only rewrites intercepted URLs to point at it. Mutation calls
 * are recorded server-side and exposed via `mutations`.
 */
import { createStubServer } from './stub-server.mjs';
import * as fx from './fixtures.mjs';

const STUB_ORIGIN = 'http://127.0.0.1:3100';

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function jwtFor(profile) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    iss: 'https://irzbtrujbxmkudnmdpig.supabase.co/auth/v1',
    ref: 'irzbtrujbxmkudnmdpig',
    sub: profile.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: profile.email,
    session_id: `sess-${profile.id}`,
    user_metadata: { username: profile.username },
    app_metadata: { role: profile.role },
    iat: 1_792_000_000,
    exp: 2_000_000_000,
  });
  return `${header}.${payload}.mock-signature`;
}

function sessionFor(role) {
  const profile = role === 'admin' ? fx.adminProfile : fx.userProfile;
  return {
    access_token: jwtFor(profile),
    refresh_token: `fake-refresh-${role}`,
    expires_in: 3600,
    expires_at: 2_000_000_000,
    token_type: 'bearer',
    user: {
      id: profile.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: profile.email,
      user_metadata: { username: profile.username },
      app_metadata: { role: profile.role },
      created_at: fx.NOW,
    },
  };
}

export function seedSession(page, role = 'user') {
  // Mirror getAuthStorageKey() in the app's Supabase client.
  const projectRef = new URL(process.env.E2E_SUPABASE_URL || STUB_ORIGIN).hostname
    .split('.')[0]
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase();
  const key = `payfollows.auth.${projectRef}`;
  const value = JSON.stringify(sessionFor(role));
  return page.addInitScript(
    ([k, v]) => {
      window.localStorage.setItem(k, v);
    },
    [key, value]
  );
}

let sharedStub = null;

/** One stub for the whole test process — avoids keep-alive socket churn. */
export async function startSharedStub() {
  if (!sharedStub) {
    const stub = createStubServer();
    try {
      await stub.start();
    } catch (err) {
      // EADDRINUSE etc. must surface loudly instead of leaving a dead stub
      // that silently sends traffic to a previous run's server.
      throw new Error(`shared stub failed to listen on :3100 — ${err.message}`);
    }
    sharedStub = stub;
  }
  return sharedStub;
}

export async function stopSharedStub() {
  if (sharedStub) {
    await sharedStub.stop();
    sharedStub = null;
  }
}

export function resetMutations() {
  // Clear IN PLACE: callers destructure the mutations getter into a const, so
  // replacing the array reference would leave them pointing at stale data.
  if (sharedStub) sharedStub.state.mutations.length = 0;
}

export async function installMocks(page) {
  const stub = await startSharedStub();

  // Analytics/realtime have no local equivalent — drop them.
  await page.route('**/va.vercel-scripts.com/**', (route) => route.abort());
  await page.route('**/_vercel/insights/**', (route) => route.abort());
  await page.route('**/realtime/**', (route) => route.abort());
  // Supabase and legacy /api calls reach the stub directly: Supabase via the
  // build-time NEXT_PUBLIC_SUPABASE_URL, /api via the Next rewrite to
  // E2E_API_TARGET (both set in web/.env.local). Same-origin browser traffic
  // means no CORS preflights.

  return {
    stub,
    get mutations() {
      return stub.state.mutations;
    },
  };
}
