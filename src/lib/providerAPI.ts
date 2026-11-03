/**
 * Authenticated provider bridge client. User order actions refer only to the
 * caller's local order ID; the server derives upstream identifiers from the
 * owned database row.
 */
async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: 'include', ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || payload?.message || `Request failed (${response.status})`);
  }
  return payload;
}

export const providerAPI = {
  async getServices(providerId: string) {
    const data = await requestJson(`/api/provider/services?provider_id=${encodeURIComponent(providerId)}`);
    return data.services || [];
  },

  async addOrder(localOrderId: string) {
    return requestJson('/api/provider/add-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ local_order_id: localOrderId }),
    });
  },

  async getOrderStatus(localOrderId: string) {
    const data = await requestJson(`/api/provider/order-status?local_order_id=${encodeURIComponent(localOrderId)}`);
    return data.status;
  },

  async getBalance(providerId: string) {
    const data = await requestJson(`/api/provider/balance?provider_id=${encodeURIComponent(providerId)}`);
    return { balance: data.balance, currency: data.currency };
  },

  async createRefill(localOrderId: string) {
    return requestJson('/api/provider/refill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ local_order_id: localOrderId }),
    });
  },

  async cancelOrder(localOrderId: string) {
    return requestJson('/api/provider/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ local_order_id: localOrderId }),
    });
  },
};

export default providerAPI;
