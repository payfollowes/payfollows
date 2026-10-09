import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin, supabaseAdminConfigured } from '../lib/supabaseServer.js';
import { successResponse, errorResponse, asyncHandler } from '../lib/apiResponse.js';

const router = express.Router();

const normalizePaymentStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['success', 'completed', 'complete', 'paid'].includes(normalized)) return 'completed';
  if (['failed', 'failure', 'error'].includes(normalized)) return 'failed';
  if (['canceled', 'cancelled'].includes(normalized)) return 'canceled';
  return 'pending';
};

const jsonPayloadFromRequest = (req) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf8'));
    } catch {
      return null;
    }
  }

  return req.body && typeof req.body === 'object' ? req.body : {};
};

const safeTimingEqual = (expectedHex, receivedHex) => {
  if (!expectedHex || !receivedHex) return false;
  try {
    const expected = Buffer.from(expectedHex, 'hex');
    const received = Buffer.from(receivedHex, 'hex');
    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(expected, received);
  } catch {
    return false;
  }
};

async function findPaymentRecord(paymentId, fastpayOrderId, transactionId) {
  const lookups = [
    ['id', paymentId],
    ['fastpay_order_id', fastpayOrderId],
    ['transaction_id', transactionId],
  ];

  for (const [column, rawValue] of lookups) {
    const value = String(rawValue || '').trim();
    if (!value) continue;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, amount, status, transaction_id, fastpay_order_id, metadata')
      .eq(column, value)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  return null;
}

// FastPay webhook receiver
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const secret = process.env.FASTPAY_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(503).json(errorResponse('WEBHOOK_SECRET_MISSING', 'Webhook signing secret is not configured.'));
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const payload = jsonPayloadFromRequest(req);

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json(errorResponse('INVALID_PAYLOAD', 'Webhook payload is not valid JSON.'));
    }

    const rawSignature = req.headers['x-fastpay-signature'] || req.headers['x-signature'];
    const signature = Array.isArray(rawSignature) ? rawSignature[0] : rawSignature;
    if (!signature) {
      console.warn('[FastPay] webhook received without signature header');
      return res.status(400).json(errorResponse('MISSING_SIGNATURE', 'Missing signature header'));
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!safeTimingEqual(expected, String(signature).trim())) {
      console.warn('[FastPay] invalid webhook signature');
      return res.status(400).json(errorResponse('INVALID_SIGNATURE', 'Invalid signature'));
    }

    const providerTxnId = payload.transaction_id || payload.id || payload.txn_id || null;
    const fastpayOrderId = payload.order_id || payload.reference || payload.order || null;
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
    const paymentId = payload.payment_id || metadata.payment_id || fastpayOrderId || null;
    const status = normalizePaymentStatus(payload.status || payload.event || 'pending');
    const amount = Number(payload.amount || 0);

    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return res.status(503).json(errorResponse('SUPABASE_NOT_CONFIGURED', 'Supabase admin client is not configured.'));
    }

    const paymentRecord = await findPaymentRecord(paymentId, fastpayOrderId, providerTxnId);
    if (!paymentRecord) {
      console.warn('[FastPay] webhook received for unknown payment', {
        paymentId,
        fastpayOrderId,
        providerTxnId,
      });
      return res.status(404).json(errorResponse('PAYMENT_NOT_FOUND', 'No matching payment record found.'));
    }

    const providerEventId = providerTxnId || fastpayOrderId || `${paymentRecord.id}`;
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from('payment_event_receipts')
      .insert({
        payment_id: paymentRecord.id,
        provider_name: 'fastpay',
        provider_event_id: String(providerEventId),
        event_type: 'payment',
        event_status: status,
        payload,
      })
      .select('id, payment_id, provider_event_id')
      .single();

    if (receiptError) {
      const isDuplicate = receiptError?.code === '23505' || /duplicate|unique/i.test(String(receiptError?.message || ''));
      if (isDuplicate) {
        return res.json(successResponse({ paymentId: paymentRecord.id, status, idempotent: true, duplicate: true }));
      }
      console.error('[FastPay] payment event receipt insert failed', receiptError);
      return res.status(500).json(errorResponse('EVENT_RECEIPT_FAILED', 'Failed to record webhook event.'));
    }

    const mergedMetadata = {
      ...(paymentRecord.metadata && typeof paymentRecord.metadata === 'object' ? paymentRecord.metadata : {}),
      fastpay_webhook: payload,
    };

    const { data: updatedPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status,
        transaction_id: providerTxnId || paymentRecord.transaction_id,
        fastpay_order_id: fastpayOrderId || paymentRecord.fastpay_order_id,
        metadata: mergedMetadata,
      })
      .eq('id', paymentRecord.id)
      .select('id, user_id, amount, status')
      .single();

    if (paymentError) {
      console.error('Error updating payment record from webhook', paymentError);
      return res.status(500).json(errorResponse('UPDATE_FAILED', 'Failed to update payment record'));
    }

    if (status === 'completed' && paymentRecord.status !== 'completed') {
      const { data: userProfile, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, balance')
        .eq('id', paymentRecord.user_id)
        .single();

      if (userError) {
        console.error('Error fetching user for balance credit', userError);
      } else if (userProfile) {
        const creditAmount = Number(updatedPayment.amount || paymentRecord.amount || amount || 0);
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ balance: Number(userProfile.balance || 0) + creditAmount })
          .eq('id', paymentRecord.user_id);

        if (updateError) {
          console.error('Failed to update user balance', updateError);
        }
      }
    }

    return res.json(successResponse({ paymentId: updatedPayment.id, status, idempotent: false, receiptId: receipt?.id || null }));
  })
);

export default router;
