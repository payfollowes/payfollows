import { supabaseAdmin } from './supabaseServer.js';

const METHOD_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,39}$/;

export const normalizeManualPaymentMethod = (method) => {
  if (!method || typeof method !== 'object') return null;
  const id = String(method.id || '').trim().toLowerCase();
  const name = String(method.name || '').trim();
  const region = String(method.region || '').trim();
  const accountName = String(method.accountName || '').trim();
  const accountDetails = String(method.accountDetails || '').trim();
  const instructions = String(method.instructions || '').trim();
  const minimumAmount = Number(method.minimumAmount ?? 5);
  if (!METHOD_ID_PATTERN.test(id) || !name || name.length > 60) return null;
  if (region.length > 60 || accountName.length > 100 || accountDetails.length > 160 || instructions.length > 500) return null;
  if (!Number.isFinite(minimumAmount) || minimumAmount < 5 || minimumAmount > 10000) return null;
  if (!accountDetails || !instructions) return null;
  return {
    id,
    name,
    region,
    accountName,
    accountDetails,
    instructions,
    minimumAmount: Math.round(minimumAmount * 100) / 100,
    active: method.active === true,
    type: 'manual',
  };
};

export const readPaymentMethodSettings = async (database = supabaseAdmin) => {
  if (!database?.from) return { settings: {}, methods: [] };
  const query = database.from('app_settings');
  if (!query?.select) return { settings: {}, methods: [] };
  const { data, error } = await query
    .select('config')
    .eq('id', 'default')
    .maybeSingle();
  if (error) {
    const message = String(error.message || '').toLowerCase();
    if (String(error.code || '') === '42P01' || message.includes('app_settings')) {
      return { settings: {}, methods: [] };
    }
    throw error;
  }
  const settings = data?.config && typeof data.config === 'object' ? data.config : {};
  const methods = Array.isArray(settings.paymentMethods)
    ? settings.paymentMethods.map(normalizeManualPaymentMethod).filter(Boolean)
    : [];
  return { settings, methods };
};

export { METHOD_ID_PATTERN };
