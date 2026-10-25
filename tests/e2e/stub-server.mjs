/**
 * Local HTTP stub that emulates Supabase auth/REST and the legacy backend.
 *
 * Why a real server instead of page.route fulfill: the only Chromium build
 * reachable from this sandbox (@sparticuz/chromium 153) mismatches Playwright
 * 1.58's CDP protocol, so custom response headers on route.fulfill are
 * stripped. A genuine HTTP server preserves headers (notably content-range,
 * which PostgREST count queries depend on).
 */
import http from 'node:http';
import * as fx from './fixtures.mjs';

const PORT = 3_100;
const HOST = '127.0.0.1';

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

export class StubState {
  constructor() {
    // Single long-lived stub serves both roles; the active role is derived
    // per request from the JWT subject so no server restart is needed.
    this.role = 'user';
    this.mutations = [];
    this.notifications = fx.notifications.map((n) => ({ ...n }));
    this.settings = JSON.parse(JSON.stringify(fx.platformSettings));
  }
}

function roleFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64url').toString('utf8'));
    return payload.sub === fx.ADMIN_ID ? 'admin' : 'user';
  } catch {
    return 'user';
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

export function createStubServer() {
  const state = new StubState();

  const corsHeaders = {
    'access-control-allow-origin': '*',
    // Cross-origin fetch hides non-safelisted headers (e.g. content-range)
    // unless they are explicitly exposed to page JavaScript.
    'access-control-expose-headers': 'content-range, prefer, content-location',
  };

  const send = (res, status, payload, headers = {}) => {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    res.writeHead(status, {
      'content-type': 'application/json',
      ...corsHeaders,
      'content-length': Buffer.byteLength(body),
      ...headers,
    });
    res.end(body);
  };

  const handle = async (req, res) => {
    const url = new URL(req.url, `http://${HOST}`);
    const role = roleFromRequest(req);
    state.role = role;
    const me = role === 'admin' ? fx.adminProfile : fx.userProfile;
    const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req) : {};

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...corsHeaders,
        'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS',
        'access-control-allow-headers': '*',
      });
      return res.end();
    }

    /* ----------------------------------------------------- Legacy backend */
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname.startsWith('/api/auth/')) return send(res, 200, { ok: true });
      if (url.pathname.includes('provider-services')) {
        return send(res, 200, { success: true, data: { providerServices: [] } });
      }
      if (url.pathname.startsWith('/api/services')) {
        return send(res, 200, { services: fx.services });
      }
      return send(res, 200, { success: true, data: [] });
    }

    /* ------------------------------------------------------------- Auth */
    if (url.pathname.includes('/auth/v1/')) {
      if (url.pathname.endsWith('/user')) return send(res, 200, sessionFor(role).user);
      return send(res, 200, sessionFor(role));
    }

    /* --------------------------------------------------------- REST/RPC */
    const parts = url.pathname.split('/').filter(Boolean);
    const v1 = parts.indexOf('v1');
    const kind = parts[v1 + 1];
    const target = parts[v1 + 2];

    if (kind === 'rpc') {
      state.mutations.push({ rpc: target, body });
      switch (target) {
        case 'place_order':
          return send(res, 200, { ...fx.orders[0], id: 'ord-new-mock', charge: 12 });
        case 'transfer_to_child':
          return send(res, 200, 10);
        case 'attach_to_parent':
          return send(res, 200, fx.USER_ID);
        case 'write_audit':
          return send(res, 200, 'aud-new-mock');
        default:
          return send(res, 200, null);
      }
    }

    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      state.mutations.push({ method: req.method, table: kind, body });

      if (kind === 'notifications' && req.method === 'PATCH') {
        // mark read: unread count drops to zero
        state.notifications = state.notifications.map((n) => ({ ...n, read_at: fx.NOW }));
        return send(res, 200, body);
      }
      if (kind === 'chat_messages' && req.method === 'POST') {
        return send(res, 201, { id: `msg-new-${Date.now()}`, created_at: fx.NOW, ...body });
      }
      if (req.method === 'POST') {
        return send(res, 201, { id: `${kind}-new-${Date.now()}`, created_at: fx.NOW, ...body });
      }
      return send(res, 200, body);
    }

    // GET reads
    switch (kind) {
      case 'user_profiles': {
        if (url.search.includes('parent_id=eq')) return send(res, 200, [fx.childProfile]);
        if (url.search.includes('referred_by=eq')) return send(res, 200, fx.referredUsers);
        return send(res, 200, [me]);
      }
      case 'notifications': {
        const isCount = req.method === 'HEAD' || url.search.includes('select=id');
        if (isCount) {
          if (process.env.STUB_DEBUG) console.log('[stub] count HEAD prefer=', req.headers.prefer, 'accept=', req.headers.accept);
          const unread = state.notifications.filter((n) => n.read_at === null);
          const range = `0-${Math.max(0, unread.length - 1)}/${unread.length}`;
          if (req.method === 'HEAD') {
            // HEAD responses must carry no body — Chromium drops headers on
            // malformed HEAD-with-body framing.
            res.writeHead(200, {
              'content-type': 'application/json',
              ...corsHeaders,
              'content-range': range,
              'content-length': '0',
            });
            return res.end();
          }
          return send(res, 200, unread.map((n) => ({ id: n.id })), { 'content-range': range });
        }
        return send(res, 200, state.notifications);
      }
      case 'referral_rewards':
        return send(res, 200, fx.referralRewards);
      case 'orders':
        return send(res, 200, fx.orders);
      case 'services':
        return send(res, 200, fx.services);
      case 'chat_channels':
        return send(res, 200, role === 'admin' ? fx.chatChannels : [fx.chatChannels[0]]);
      case 'chat_messages':
        return send(res, 200, fx.chatMessages);
      case 'app_settings':
        return send(res, 200, [{ id: 'platform', config: state.settings }]);
      case 'platform_earnings':
        return send(res, 200, fx.platformEarnings);
      case 'platform_summary':
        return send(res, 200, fx.platformSummary);
      case 'payment_logs':
        return send(res, 200, fx.paymentLogs);
      case 'provider_payouts':
        return send(res, 200, fx.providerPayouts);
      case 'audit_logs':
        return send(res, 200, fx.auditLogs);
      case 'announcements':
        return send(res, 200, []);
      default:
        return send(res, 200, []);
    }
  };

  // Never let a handler throw into the socket — a reset mid-response surfaces
  // in the browser as TypeError: Failed to fetch. Answer with a JSON 500.
  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      if (process.env.STUB_DEBUG) console.error('[stub] handler error', req.url, err);
      if (!res.headersSent) {
        send(res, 500, { error: 'stub_handler_error', detail: String(err?.message || err) });
      } else {
        res.destroy();
      }
    });
  });

  // Chromium/Next reuse idle keep-alive sockets; keep them alive for the whole
  // run so the server never closes a socket the client is about to reuse
  // (that race surfaces as TypeError: Failed to fetch).
  server.keepAliveTimeout = 120_000;
  server.headersTimeout = 121_000;
  server.requestTimeout = 0;
  server.on('clientError', (err, socket) => {
    if (!socket.destroyed) socket.destroy();
  });

  // Track live connections so stop() can force-close them. Plain
  // server.close() waits for keep-alive sockets to time out (120s here),
  // which used to leave zombie test processes holding port 3100.
  const sockets = new Set();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  return {
    start: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(PORT, HOST, () => resolve(`http://${HOST}:${PORT}`));
      }),
    stop: () =>
      new Promise((resolve) => {
        if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
        for (const socket of sockets) socket.destroy();
        server.close(() => resolve());
      }),
    state,
  };
}
