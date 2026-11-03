import express from 'express';
import { supabaseAdmin, supabaseAdminConfigured } from '../lib/supabaseServer.js';
import { callSmmProvider, extractProviderError, mapProviderStatusToLocal } from '../lib/smmProvider.js';

const router = express.Router();

const CURRENCY = 'USD';
const SERVICES_LIMIT = 50000;

// SMM-panel convention: business failures are HTTP 200 with an `error` field so
// reseller automation can parse one response shape. Only infrastructure faults
// use 5xx.
const smmError = (res, message) => res.status(200).json({ error: String(message || 'Request failed') });

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());

const toInteger = (value, fallback = NaN) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const localToSmmStatus = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'canceled':
      return 'Canceled';
    case 'failed':
      return 'Failed';
    default:
      return 'In progress';
  }
};

async function authenticateApiKey(req, res) {
  if (!supabaseAdminConfigured || !supabaseAdmin) {
    smmError(res, 'Reseller API is not configured');
    return null;
  }

  const key = String(req.body?.key ?? req.query?.key ?? '').trim();
  if (!key) {
    smmError(res, 'Missing API key. Pass your profile API key as "key".');
    return null;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, username, email, balance, status, api_key')
    .eq('api_key', key)
    .maybeSingle();

  if (error) {
    console.error('[reseller] API key lookup failed:', error.message);
    res.status(500).json({ error: 'Internal error while validating the API key' });
    return null;
  }
  if (!profile) {
    smmError(res, 'Invalid API key');
    return null;
  }
  if (profile.status !== 'active') {
    smmError(res, `Account is ${profile.status || 'not active'}`);
    return null;
  }

  return profile;
}

async function loadOwnedOrder(profile, orderId) {
  if (!isUuid(orderId)) return { error: 'Invalid order id' };

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, service:services(id, name)')
    .eq('id', String(orderId).trim())
    .eq('user_id', profile.id)
    .maybeSingle();

  if (error) return { error: 'Failed to load the order' };
  if (!order) return { error: 'Order not found' };
  return { order };
}

async function resolveProviderLink(serviceId) {
  const { data, error } = await supabaseAdmin
    .from('provider_services')
    .select('provider_id, provider_service_id, provider:providers(id, name, api_url, api_key)')
    .eq('service_id', serviceId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('[reseller] provider link lookup failed:', error.message);
    return null;
  }
  const row = data?.[0];
  const provider = Array.isArray(row?.provider) ? row.provider[0] : row?.provider;
  if (!row || !provider?.api_url || !provider?.api_key) return null;
  return { row, provider };
}

function orderStatusPayload(order) {
  return {
    charge: Number(order.charge ?? 0),
    start_count: Number(order.start_count ?? 0),
    status: localToSmmStatus(order.status),
    remains: Number(order.remains ?? Math.max(Number(order.quantity) || 0, 0)),
    currency: CURRENCY,
  };
}

async function handleAction(req, res) {
  const profile = await authenticateApiKey(req, res);
  if (!profile) return;

  const action = String(req.body?.action ?? req.query?.action ?? '').trim().toLowerCase();
  const input = { ...req.query, ...req.body };

  try {
    switch (action) {
      case 'balance':
        return res.status(200).json({
          balance: Number(profile.balance ?? 0).toFixed(2),
          currency: CURRENCY,
        });

      case 'services': {
        const { data: services, error } = await supabaseAdmin
          .from('services')
          .select('id, name, category, rate_per_1000, min_quantity, max_quantity')
          .eq('status', 'active')
          .gt('rate_per_1000', 0)
          .order('category', { ascending: true })
          .order('name', { ascending: true })
          .limit(SERVICES_LIMIT);

        if (error) {
          console.error('[reseller] services list failed:', error.message);
          return res.status(500).json({ error: 'Failed to load services' });
        }

        return res.status(200).json(
          (services || []).map((svc) => ({
            service: svc.id,
            name: svc.name,
            type: 'default',
            category: svc.category,
            rate: Number(svc.rate_per_1000),
            min: Number(svc.min_quantity),
            max: Number(svc.max_quantity),
            dripfeed: false,
            refill: false,
            cancel: false,
          }))
        );
      }

      case 'add': {
        const serviceId = String(input.service ?? '').trim();
        const link = String(input.link ?? '').trim();
        const quantity = toInteger(input.quantity);

        if (!isUuid(serviceId)) return smmError(res, 'Invalid or missing "service" id');
        if (!link) return smmError(res, 'Missing "link"');
        if (!Number.isFinite(quantity) || quantity <= 0) return smmError(res, 'Invalid "quantity"');

        const { data: order, error: orderError } = await supabaseAdmin.rpc('place_order_for_user', {
          p_user_id: profile.id,
          p_service_id: serviceId,
          p_link: link,
          p_quantity: quantity,
          p_delivery_time: 24,
        });

        if (orderError) {
          return smmError(res, orderError.message || 'Could not place the order');
        }

        // Best-effort upstream placement, mirroring the web checkout flow:
        // a provider hiccup never loses the local (already charged) order —
        // the sync job reconciles pending orders.
        try {
          const linkInfo = await resolveProviderLink(serviceId);
          if (linkInfo) {
            const { row, provider } = linkInfo;
            const result = await callSmmProvider(provider, {
              action: 'add',
              service: String(row.provider_service_id),
              link,
              quantity: String(quantity),
            });
            const providerError = extractProviderError(result);
            if (!providerError && result?.order) {
              await supabaseAdmin
                .from('orders')
                .update({
                  provider_id: provider.id,
                  provider_order_id: String(result.order),
                  status: mapProviderStatusToLocal(result.status),
                })
                .eq('id', order.id);
            } else {
              console.warn('[reseller] provider add pending:', providerError || 'no order id');
            }
          }
        } catch (providerErr) {
          console.warn('[reseller] provider placement failed, order stays pending:', providerErr.message);
        }

        return res.status(200).json({ order: order.id });
      }

      case 'status': {
        const ids = String(input.orders ?? input.order ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
          .filter(isUuid);
        if (ids.length === 0) return smmError(res, 'Missing or invalid "order"');

        if (ids.length === 1) {
          const { order, error } = await loadOwnedOrder(profile, ids[0]);
          if (error) return smmError(res, error);
          return res.status(200).json(orderStatusPayload(order));
        }

        const { data: orders, error } = await supabaseAdmin
          .from('orders')
          .select('*')
          .in('id', ids)
          .eq('user_id', profile.id);

        if (error) return res.status(500).json({ error: 'Failed to load orders' });
        const payload = {};
        (orders || []).forEach((o) => {
          payload[o.id] = orderStatusPayload(o);
        });
        return res.status(200).json(payload);
      }

      case 'refill': {
        const { order, error } = await loadOwnedOrder(profile, input.order);
        if (error) return smmError(res, error);
        if (order.status !== 'completed') return smmError(res, 'Only completed orders can be refilled');
        if (!order.provider_id || !order.provider_order_id) {
          return smmError(res, 'This order is not linked to a provider');
        }

        const { data: provider, error: providerError } = await supabaseAdmin
          .from('providers')
          .select('id, name, api_url, api_key')
          .eq('id', order.provider_id)
          .single();
        if (providerError || !provider) return smmError(res, 'Provider not found');

        const result = await callSmmProvider(provider, {
          action: 'refill',
          order: String(order.provider_order_id),
        });
        const upstreamError = extractProviderError(result);
        if (upstreamError) return smmError(res, upstreamError);

        return res.status(200).json({ refill: result?.refill ?? order.provider_order_id });
      }

      case 'cancel': {
        const { order, error } = await loadOwnedOrder(profile, input.order);
        if (error) return smmError(res, error);
        if (!['pending', 'processing'].includes(order.status)) {
          return smmError(res, 'Only pending or processing orders can be canceled');
        }
        if (!order.provider_id || !order.provider_order_id) {
          return smmError(res, 'This order is not linked to a provider');
        }

        const { data: provider, error: providerError } = await supabaseAdmin
          .from('providers')
          .select('id, name, api_url, api_key')
          .eq('id', order.provider_id)
          .single();
        if (providerError || !provider) return smmError(res, 'Provider not found');

        const result = await callSmmProvider(provider, {
          action: 'cancel',
          orders: String(order.provider_order_id),
        });
        const upstreamError = extractProviderError(result);
        if (upstreamError) return smmError(res, upstreamError);

        await supabaseAdmin.from('orders').update({ status: 'canceled' }).eq('id', order.id);

        return res.status(200).json({ cancel: 1, order: order.id });
      }

      default:
        return smmError(res, `Unknown action "${action || ''}". Supported: balance, services, add, status, refill, cancel`);
    }
  } catch (err) {
    console.error('[reseller] unhandled error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

// POST is the SMM standard; GET is accepted for read-only convenience calls.
router.post('/action', handleAction);
router.get('/action', handleAction);

export default router;
