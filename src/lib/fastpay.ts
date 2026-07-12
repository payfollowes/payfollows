// FastPay Payment Integration
// FastPay API Documentation: https://fastpay.com/docs

interface FastPayConfig {
  merchantId: string;
  apiKey: string;
  baseUrl?: string;
}

interface FastPayOrderRequest {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl?: string;
}

interface FastPayOrderResponse {
  success: boolean;
  orderId: string;
  paymentUrl: string;
  transactionId?: string;
  message?: string;
}

class FastPayClient {
  private merchantId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: FastPayConfig) {
    this.merchantId = config.merchantId;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.fastpay.com/v1';
  }

  async createOrder(request: FastPayOrderRequest): Promise<FastPayOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || 'USD',
          order_id: request.orderId,
          customer_email: request.customerEmail,
          customer_name: request.customerName,
          return_url: request.returnUrl,
          cancel_url: request.cancelUrl,
          notify_url: request.notifyUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to create FastPay order');
      }

      return {
        success: true,
        orderId: String(data?.order_id || data?.id || ''),
        paymentUrl: String(data?.payment_url || data?.redirect_url || ''),
        transactionId: data?.transaction_id || data?.txn_id || undefined,
        message: data?.message,
      };
    } catch (error) {
      console.error('[FastPay] createOrder failed:', error);
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/verify/${encodeURIComponent(transactionId)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return false;
      }

      return data?.status === 'completed' || data?.status === 'success';
    } catch (error) {
      console.error('[FastPay] verifyPayment failed:', error);
      return false;
    }
  }

  async getPaymentStatus(transactionId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${encodeURIComponent(transactionId)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId,
        },
      });

      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('[FastPay] getPaymentStatus failed:', error);
      throw error;
    }
  }

  async handleWebhook(payload: Record<string, unknown>) {
    return payload;
  }
}

export const getFastPayClient = (): FastPayClient => {
  const isNode = typeof window === 'undefined';
  const merchantId = (isNode ? process.env.FASTPAY_MERCHANT_ID : import.meta.env.VITE_FASTPAY_MERCHANT_ID) || '';
  const apiKey = (isNode ? process.env.FASTPAY_API_KEY : '') || '';

  if (!merchantId || !apiKey) {
    if (isNode && !apiKey) {
      console.warn('[FastPay] private API key not configured in server environment; set FASTPAY_API_KEY in server/.env.local or host env.');
    } else if (!isNode && apiKey) {
      console.warn('[FastPay] detected a private FastPay key in a client bundle; keep it server-side only.');
    } else {
      console.warn('[FastPay] credentials not configured');
    }
  }

  return new FastPayClient({
    merchantId,
    apiKey,
    baseUrl: import.meta.env.VITE_FASTPAY_BASE_URL || 'https://api.fastpay.com/v1',
  });
};

export { FastPayClient };
export type { FastPayOrderRequest, FastPayOrderResponse };
