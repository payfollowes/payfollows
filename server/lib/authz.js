import { supabase, supabaseAdmin, supabaseConfigured } from './supabaseServer.js';
import { readAuthCookies } from './authCookies.js';
import { errorResponse } from './apiResponse.js';

const getAccessTokenFromRequest = (req) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return String(match[1]).trim();
    }
  }

  const cookieTokens = readAuthCookies(req);
  if (cookieTokens?.accessToken) {
    return String(cookieTokens.accessToken).trim();
  }

  return '';
};

const getVerifiedUser = async (req) => {
  if (!supabaseConfigured || !supabase) {
    return { user: null, error: errorResponse('AUTH_UNAVAILABLE', 'Authentication is not configured.') };
  }

  const accessToken = getAccessTokenFromRequest(req);
  if (!accessToken) {
    return { user: null, error: errorResponse('MISSING_TOKEN', 'Missing session token.') };
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    return { user: null, error: errorResponse('INVALID_TOKEN', 'Invalid or expired access token.') };
  }

  return { user: data.user, error: null };
};

export const requireAuth = async (req, res, next) => {
  const { user, error } = await getVerifiedUser(req);
  if (!user) {
    return res.status(error?.error?.code === 'MISSING_TOKEN' ? 401 : 401).json(error || errorResponse('UNAUTHORIZED', 'Authentication required.'));
  }

  req.user = user;
  next();
};

export const requireAdmin = async (req, res, next) => {
  const { user, error } = await getVerifiedUser(req);
  if (!user) {
    return res.status(401).json(error || errorResponse('UNAUTHORIZED', 'Authentication required.'));
  }

  const { data: profile, error: profileError } = await (supabaseAdmin || supabase)
    .from('user_profiles')
    .select('id, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return res.status(403).json(errorResponse('FORBIDDEN', 'Administrator privileges required.'));
  }

  if (profile.status !== 'active') {
    return res.status(403).json(errorResponse('ACCOUNT_INACTIVE', 'Account is not active.'));
  }

  if (profile.role !== 'admin') {
    return res.status(403).json(errorResponse('FORBIDDEN', 'Administrator privileges required.'));
  }

  req.user = user;
  req.adminUser = profile;
  next();
};

export const requireActiveAccount = async (req, res, next) => {
  const { user, error } = await getVerifiedUser(req);
  if (!user) {
    return res.status(401).json(error || errorResponse('UNAUTHORIZED', 'Authentication required.'));
  }

  const { data: profile, error: profileError } = await (supabaseAdmin || supabase)
    .from('user_profiles')
    .select('id, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.status !== 'active') {
    return res.status(403).json(errorResponse('ACCOUNT_INACTIVE', 'Account is not active.'));
  }

  req.user = user;
  next();
};

export const requireCronSecret = (req, res, next) => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return res.status(503).json(errorResponse('CRON_NOT_CONFIGURED', 'CRON_SECRET is not configured.'));
  }

  const authHeader = req.headers['authorization'] || req.headers['x-cron-secret'] || '';
  const provided = String(authHeader).startsWith('Bearer ') ? String(authHeader).slice(7) : String(authHeader);

  if (provided !== expected) {
    return res.status(401).json(errorResponse('INVALID_CRON_SECRET', 'Invalid cron secret.'));
  }

  next();
};
