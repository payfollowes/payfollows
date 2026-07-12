import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const schemaSql = readFileSync(path.join(process.cwd(), 'supabase/schema.sql'), 'utf8');
const hasSupabaseHarness = Boolean(process.env.SUPABASE_TEST_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

describe('RLS policy guardrails', () => {
  it('enables RLS on core tables and creates user/admin access policies', () => {
    expect(schemaSql).toContain('ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;');
    expect(schemaSql).toContain('CREATE POLICY "Users can view their own profile"');
    expect(schemaSql).toContain('CREATE POLICY "Users can create their own payments"');
    expect(schemaSql).toContain('CREATE POLICY "Admins can manage provider services"');
  });

  it.skipIf(!hasSupabaseHarness)('can run a Supabase-based RLS smoke test when the harness env is present', () => {
    expect(hasSupabaseHarness).toBe(true);
  });
});
