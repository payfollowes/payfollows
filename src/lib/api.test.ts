import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSessionUser = vi.hoisted(() => vi.fn());
const mockWithSupabaseTimeout = vi.hoisted(() => vi.fn((promise: Promise<unknown>) => promise));
const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
}));

vi.mock('./supabase', () => ({
  getSessionUser: mockGetSessionUser,
  supabase: mockSupabaseClient,
  withSupabaseTimeout: mockWithSupabaseTimeout,
}));

import { authAPI, paymentsAPI } from './api';

describe('auth and payments APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionUser.mockResolvedValue({ id: 'user-1' });
  });

  it('creates a profile row after a successful sign-up', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const upsertChain = {
      error: null,
    };
    mockSupabaseClient.from.mockReturnValue({
      upsert: vi.fn().mockResolvedValue(upsertChain),
    });

    const result = await authAPI.signUp('user@example.com', 'pw123', 'user');

    expect(result.user.id).toBe('user-1');
    expect(mockSupabaseClient.from).toHaveBeenCalled();
  });

  it('creates a payment record when requested', async () => {
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'payment-1', user_id: 'user-1', amount: 10 }, error: null }),
    };
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockReturnValue(insertChain),
    });

    const result = await paymentsAPI.createPayment(10, 'fastpay');

    expect(result.id).toBe('payment-1');
  });
});
