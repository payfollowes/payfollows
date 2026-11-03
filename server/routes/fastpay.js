import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin, supabaseAdminConfigured } from '../lib/supabaseServer.js';
import { validateRequest, schemas } from '../lib/validation.js';
import { successResponse, errorResponse, asyncHandler } from '../lib/apiResponse.js';
import { requireActiveAccount } from '../lib/authz.js';

const router = express.Router();
const DEFAULT_FRONTEND_URL = 'https://payfollows-web.vercel.app';

function getFrontendUrl() {
  const raw = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_FRONTEND_URL;
  const url = new URL(raw);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('FRONTEND_URL must use HTTPS in production');
  }
  return url.origin;
}

function getWebhookUrl() {
  const raw = String(process.env.FASTPAY_WEBHOOK_URL || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') return null;
    return url.toString();
  } catch {
    return null;
  }
}

router.post(
  '/create-order',
  requireActiveAccount,
  validateRequest(schemas.gatewayOrderSchema),
  asyncHandler(async (req, res) => {
    if (!supabaseAdminConfigured || !supabaseAdmin) {
      return res.status(503).json(errorResponse('SUPABASE_NOT_CONFIGURED', 'Payment service is not configured.'));
    }

    const { paymentId } = req.validatedBody;
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, amount, fee, total, status, payment_provider')
      .eq('id', paymentId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) return res.status(404).json(errorResponse('PAYMENT_NOT_FOUND', 'Payment request not found.'));
    if (payment.status !== 'pending') {
      return res.status(409).json(errorResponse('PAYMENT_NOT_PENDING', 'This payment is no longer pending.'));
    }
    if (payment.payment_provider !== 'fastpay') {
      return res.status(400).json(errorResponse('PAYMENT_PROVIDER_MISMATCH', 'Payment method does not match FastPay.'));
    }

    const apiKey = process.env.FASTPAY_API_KEY;
    const merchantId = process.env.FASTPAY_MERCHANT_ID;
    const baseUrl = process.env.FASTPAY_BASE_URL || 'https://api.fastpay.com/v1';
    const webhookUrl = getWebhookUrl();
    if (!apiKey || !merchantId || !process.env.FASTPAY_WEBHOOK_SECRET || !webhookUrl) {
      return res.status(503).json(errorResponse('FASTPAY_NOT_CONFIGURED', 'FastPay is temporarily unavailable.'));
    }

    let frontendOrigin;
    try {
      frontendOrigin = getFrontendUrl();
    } catch {
      return res.status(503).json(errorResponse('FRONTEND_URL_INVALID', 'Payment return URL is not configured.'));
    }
    const resultUrl = new URL('/dashboard/add-funds', frontendOrigin);
    resultUrl.searchParams.set('payment_id', payment.id);
    const returnUrl = new URL(resultUrl);
    returnUrl.searchParams.set('success', 'true');
    const cancelUrl = new URL(resultUrl);
    cancelUrl.searchParams.set('canceled', 'true');

    // The database record is authoritative. Never accept amount/email/name or
    // redirect URLs from the browser for a gateway transaction.
    const payload = {
      amount: Number(payment.total),
      order_id: payment.id,
      customer_email: req.user.email,
      customer_name: String(req.user.user_metadata?.username || req.user.email || 'PayFollows user').slice(0, 100),
      return_url: returnUrl.toString(),
      cancel_url: cancelUrl.toString(),
      notify_url: webhookUrl,
    };
    const signature = crypto.createHmac('sha256', process.env.FASTPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Merchant-Id': merchantId,
        'X-FastPay-Signature': signature,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[FastPay] order creation failed', { status: response.status, code: data?.code });
      await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', payment.id).eq('user_id', req.user.id);
      return res.status(502).json(errorResponse('FASTPAY_API_ERROR', 'Payment provider could not create this payment.'));
    }

    const orderId = String(data?.order_id || data?.id || '').trim();
    const paymentUrl = String(data?.payment_url || data?.redirect_url || '').trim();
    if (!orderId || !paymentUrl) {
      await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', payment.id).eq('user_id', req.user.id);
      return res.status(502).json(errorResponse('FASTPAY_INVALID_RESPONSE', 'Payment provider returned an incomplete response.'));
    }

    let safePaymentUrl;
    try {
      safePaymentUrl = new URL(paymentUrl);
    } catch {
      return res.status(502).json(errorResponse('FASTPAY_INVALID_URL', 'Payment provider returned an invalid checkout URL.'));
    }
    if (safePaymentUrl.protocol !== 'https:') {
      return res.status(502).json(errorResponse('FASTPAY_INVALID_URL', 'Payment provider returned an insecure checkout URL.'));
    }

    const { error: updateError } = await supabaseAdmin.from('payments').update({
      fastpay_order_id: orderId,
      payment_provider: 'fastpay',
    }).eq('id', payment.id).eq('user_id', req.user.id);
    if (updateError) throw updateError;

    return res.status(200).json(successResponse({ paymentUrl: safePaymentUrl.toString(), order_id: orderId }));
  })
);

export default router;
