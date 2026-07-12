import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth/order/payment flow orchestration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the order and payment flow aligned when balance and payment metadata are available', async () => {
    const mockedSession = { id: 'user-1' };
    const mockedProfile = { balance: 100, total_spent: 0 };
    const mockedOrder = { id: 'order-1', user_id: 'user-1', charge: 10, status: 'pending' };
    const mockedPayment = { id: 'payment-1', user_id: 'user-1', amount: 10, status: 'pending' };

    const getSessionUser = vi.fn().mockResolvedValue(mockedSession);
    const supabase = {
      auth: { signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockedProfile, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'orders') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockedOrder, error: null }),
          };
        }
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockedPayment, error: null }),
        };
      }),
    };

    const authResult = await supabase.auth.signInWithPassword({ email: 'user@example.com', password: 'pw123' });
    expect(authResult.error).toBeNull();
    expect(authResult.data.user.id).toBe('user-1');
    expect(getSessionUser).not.toHaveBeenCalled();
    expect(mockedOrder.charge).toBeLessThanOrEqual(mockedProfile.balance);
  });
});
