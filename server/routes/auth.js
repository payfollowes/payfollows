import express from 'express';
import {
  supabase,
  supabaseAdmin,
  supabaseConfigured,
  supabaseAdminConfigured,
} from '../lib/supabaseServer.js';
import {
  clearAuthCookies,
  getAuthCookieConfig,
  readAuthCookies,
  setAuthCookies,
} from '../lib/authCookies.js';
import { successResponse, errorResponse, asyncHandler } from '../lib/apiResponse.js';

const router = express.Router();
const AUTH_VERIFY_TIMEOUT_MS = 1500;

const withTimeout = (promise, timeoutMs, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);

const getAuthClient = () => {
  if (supabaseConfigured && supabase) {
    return supabase;
  }

  if (supabaseAdminConfigured && supabaseAdmin) {
    return supabaseAdmin;
  }

  return null;
};

const verifySessionToken = async (token) => {
  const authClient = getAuthClient();
  if (!authClient) {
    throw new Error('AUTH_UNAVAILABLE');
  }

  const { data, error } = await withTimeout(
    authClient.auth.getUser(token),
    AUTH_VERIFY_TIMEOUT_MS,
    'auth getUser'
  );

  if (error || !data?.user) {
    throw new Error('INVALID_TOKEN');
  }

  return data.user;
};

router.post('/session', asyncHandler(async (req, res) => {
  const accessToken = String(req.body?.accessToken || '').trim();
  const refreshToken = String(req.body?.refreshToken || '').trim();
  const expiresAt = Number.parseInt(String(req.body?.expiresAt || ''), 10);
  const expiresIn = Number.parseInt(String(req.body?.expiresIn || ''), 10);

  if (!accessToken || !refreshToken) {
    clearAuthCookies(res);
    return res.status(400).json(
      errorResponse('MISSING_TOKENS', 'Missing accessToken or refreshToken', { cookieConfig: getAuthCookieConfig() })
    );
  }

  try {
    await verifySessionToken(accessToken);
  } catch (error) {
    clearAuthCookies(res);
    if (error?.message === 'AUTH_UNAVAILABLE') {
      return res.status(503).json(
        errorResponse('AUTH_UNAVAILABLE', 'Authentication is not configured on this server.', { cookieConfig: getAuthCookieConfig() })
      );
    }

    return res.status(401).json(
      errorResponse('INVALID_TOKEN', 'Invalid access token', { cookieConfig: getAuthCookieConfig() })
    );
  }

  setAuthCookies(res, {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : undefined,
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : undefined,
  });

  return res.status(200).json(
    successResponse({ cookieConfig: getAuthCookieConfig(), verified: true })
  );
}));

router.post('/clear', (_req, res) => {
  clearAuthCookies(res);
  return res.status(200).json(
    successResponse({ cookieConfig: getAuthCookieConfig() })
  );
});

router.get('/session', asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, expiresAt } = readAuthCookies(req);

  if (!accessToken || !refreshToken) {
    return res.status(200).json(
      successResponse({ sessionPresent: false, cookieConfig: getAuthCookieConfig() })
    );
  }

  const authClient = getAuthClient();
  if (!authClient) {
    return res.status(503).json(
      errorResponse('AUTH_UNAVAILABLE', 'Authentication is not configured on this server.')
    );
  }

  try {
    const user = await verifySessionToken(accessToken);
    return res.status(200).json(
      successResponse({
        sessionPresent: true,
        expiresAt,
        cookieConfig: getAuthCookieConfig(),
        user: { id: user.id, email: user.email || null },
        verified: true,
      })
    );
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json(
      errorResponse('INVALID_TOKEN', 'Invalid or expired access token', { cookieConfig: getAuthCookieConfig() })
    );
  }

}));

export default router;
