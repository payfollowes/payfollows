import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin, supabaseAdminConfigured } from '../lib/supabaseServer.js';
import { successResponse, errorResponse, asyncHandler } from '../lib/apiResponse.js';

const router = express.Router();

function normalizePaymentStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['success', 'completed', 'complete', 'paid'].includes(normalized)) return 'completed';
  if (['failed', 'failure', 'error'].includes(normalized)) return 'failed';
  if (['canceled', 'cancelled'].includes(normalized)) return 'canceled';
  return 'pending';
}

function parsePayload(req) {
  if (Buffer.isBuffer(req.body)) {
    try { return JSON.parse(req.body.toString('utf8')); } catch { return null; }
  }
  return req.body && typeof req.body === 'object' ? req.body : null;
}

function timingSafeHexEqual(expectedHex, receivedHex) {
  try {
    const expected = Buffer.from(String(expectedHex || ''), 'hex');
    const received = Buffer.from(String(receivedHex || ''), 'hex');
    return expected.length > 0 && expected.length === received.length && crypto.timingSafeEqual(expected, received);
  } catch { return false; }
}

async function findPayment(paymentId, gatewayOrderId) {
  for (const [column, value] of [['id', paymentId], ['fastpay_order_id', gatewayOrderId]]) {
    if (!value) continue;
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, amount, fee, total, status, payment_method, payment_provider, transaction_id, fastpay_order_id, metadata')
      .eq(column, String(value))
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return null;
}

router.post('/', asyncHandler(async (req, res) => {
  const secret = process.env.FASTPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json(errorResponse('WEBHOOK_SECRET_MISSING', 'Webhook signing secret is not configured.'));
  if (!supabaseAdminConfigured || !supabaseAdmin) {
    return res.status(503).json(errorResponse('SUPABASE_NOT_CONFIGURED', 'Payment processing is unavailable.'));
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const payload = parsePayload(req);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json(errorResponse('INVALID_PAYLOAD', 'Webhook payload is not valid JSON.'));
  }
  const headerSignature = req.headers['x-fastpay-signature'] || req.headers['x-signature'];
  const signature = Array.isArray(headerSignature) ? headerSignature[0] : headerSignature;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!timingSafeHexEqual(expected, signature)) {
    return res.status(400).json(errorResponse('INVALID_SIGNATURE', 'Invalid signature.'));
  }

  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
  const gatewayOrderId = String(payload.order_id || payload.reference || payload.order || '').trim();
  const paymentId = String(payload.payment_id || metadata.payment_id || gatewayOrderId).trim();
  const transactionId = String(payload.transaction_id || payload.txn_id || '').trim() || null;
  const status = normalizePaymentStatus(payload.status || payload.event);
  const payment = await findPayment(paymentId, gatewayOrderId);
  if (!payment) return res.status(404).json(errorResponse('PAYMENT_NOT_FOUND', 'No matching payment record found.'));
  if (payment.payment_provider !== 'fastpay' || payment.payment_method !== 'fastpay') {
    return res.status(400).json(errorResponse('PAYMENT_PROVIDER_MISMATCH', 'Payment is not a FastPay transaction.'));
  }

  // Bind the provider event to the exact gateway order created for this row.
  if (payment.fastpay_order_id && gatewayOrderId !== payment.fastpay_order_id && gatewayOrderId !== payment.id) {
    return res.status(400).json(errorResponse('ORDER_MISMATCH', 'Gateway order does not match this payment.'));
  }
  if (payload.currency && String(payload.currency).toUpperCase() !== 'USD') {
    return res.status(400).json(errorResponse('CURRENCY_MISMATCH', 'Payment currency does not match the expected currency.'));
  }
  if (status === 'completed') {
    const paidAmount = Number(payload.amount);
    const expectedAmount = Number(payment.total);
    if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - expectedAmount) >= 0.005) {
      return res.status(400).json(errorResponse('AMOUNT_MISMATCH', 'Gateway-paid amount does not match the payment total.'));
    }
  }

  const providerEventId = String(payload.event_id || payload.webhook_id || transactionId || `${gatewayOrderId}:${status}`).slice(0, 255);
  if (!providerEventId) return res.status(400).json(errorResponse('EVENT_ID_MISSING', 'Webhook event identifier is required.'));

  // Credit the wallet before recording the receipt. credit_deposit locks the
  // payment and is idempotent; if it fails, returning 5xx lets FastPay retry.
  // A retry can never be suppressed by a receipt written before a failed credit.
  if (status === 'completed') {
    const { error: creditError } = await supabaseAdmin.rpc('credit_deposit', { p_payment_id: payment.id });
    if (creditError) {
      console.error('[FastPay] atomic deposit credit failed', { paymentId: payment.id, code: creditError.code });
      return res.status(503).json(errorResponse('CREDIT_FAILED', 'Wallet credit failed; the provider may retry this event.'));
    }
  } else if (payment.status !== 'completed') {
    const { error: statusError } = await supabaseAdmin.from('payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', payment.id)
      .neq('status', 'completed');
    if (statusError) throw statusError;
  }

  const mergedMetadata = {
    ...(payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {}),
    fastpay_webhook: payload,
  };
  const { error: metadataError } = await supabaseAdmin.from('payments').update({
    ...(transactionId ? { transaction_id: transactionId } : {}),
    ...(gatewayOrderId && !payment.fastpay_order_id ? { fastpay_order_id: gatewayOrderId } : {}),
    metadata: mergedMetadata,
    updated_at: new Date().toISOString(),
  }).eq('id', payment.id);
  if (metadataError) throw metadataError;

  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from('payment_event_receipts')
    .insert({
      payment_id: payment.id,
      provider_name: 'fastpay',
      provider_event_id: providerEventId,
      event_type: String(payload.event || payload.type || 'payment').slice(0, 100),
      event_status: status,
      payload,
    })
    .select('id')
    .single();
  if (receiptError) {
    if (receiptError.code === '23505' || /duplicate|unique/i.test(String(receiptError.message || ''))) {
      return res.json(successResponse({ paymentId: payment.id, status, idempotent: true }));
    }
    throw receiptError;
  }

  return res.json(successResponse({ paymentId: payment.id, status, idempotent: payment.status === 'completed', receiptId: receipt?.id }));
}));

export default router;
