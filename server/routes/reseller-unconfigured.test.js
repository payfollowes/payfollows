import { describe, expect, it, vi } from 'vitest';

// Dedicated file because named ESM imports bind a vi.mock getter's value at
// module-evaluation time: the unconfigured flag must be the initial value.
const mockConfig = vi.hoisted(() => ({ supabaseAdminConfigured: false }));

vi.mock('../lib/supabaseServer.js', () => ({
  supabase: {},
  supabaseAdmin: null,
  get supabaseAdminConfigured() {
    return mockConfig.supabaseAdminConfigured;
  },
}));

vi.mock('../lib/smmProvider.js', () => ({
  callSmmProvider: vi.fn(),
  extractProviderError: vi.fn(),
  mapProviderStatusToLocal: vi.fn(),
}));

import resellerRouter from './reseller.js';

const dispatch = (body) =>
  new Promise((resolve) => {
    const response = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
        return this;
      },
    };
    resellerRouter.handle(
      { method: 'POST', url: '/action', path: '/action', headers: {}, query: {}, body },
      response,
      () => resolve({ statusCode: 500, payload: { error: 'next called' } })
    );
  });

describe('reseller API without service-role configuration', () => {
  it('fails closed with an SMM-style configuration error', async () => {
    const result = await dispatch({ key: 'any-key', action: 'balance' });
    expect(result.payload.error).toMatch(/not configured/i);
  });
});
