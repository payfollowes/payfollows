'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Chrome, Gift, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AuthShell } from '@/components/shared/auth-shell';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const attribution = useMemo(() => {
    const ref = params.get('ref')?.trim() || '';
    const child = params.get('child_of')?.trim() || '';
    if (child) return { kind: 'child' as const, code: child, label: `You're joining as a child panel of ${child}` };
    if (ref) return { kind: 'ref' as const, code: ref, label: `Referral code ${ref} will be linked to your account` };
    return null;
  }, [params]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const metadata: Record<string, string> = {};
      if (attribution?.kind === 'child') metadata.child_code = attribution.code;
      if (attribution?.kind === 'ref') metadata.referral_code = attribution.code;
      const res = await authAPI.signUp(form.email, form.password, form.username.trim(), metadata);
      if (res?.session) {
        await refreshProfile();
        toast.success(
          attribution
            ? `Account created — ${attribution.kind === 'child' ? 'child panel linked' : 'referral linked'}!`
            : 'Account created — welcome to PayFollows!'
        );
        router.push('/dashboard');
      } else {
        toast.success('Account created! Check your email to confirm, then login.');
        router.push('/login');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start growing in under two minutes — it's free"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary-400 hover:text-primary-300">
            Login here
          </Link>
        </p>
      }
    >
      {attribution && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4">
          {attribution.kind === 'child' ? (
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary-300" />
          ) : (
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary-300" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">{attribution.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {attribution.kind === 'child'
                ? 'Your parent can track your orders and transfer balance to your wallet.'
                : 'Both of you unlock rewards once you make your first deposit.'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              required
              minLength={3}
              placeholder="yourname"
              className="pl-11"
              value={form.username}
              onChange={update('username')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              className="pl-11"
              value={form.email}
              onChange={update('email')}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={show ? 'text' : 'password'}
                required
                placeholder="••••••"
                className="pl-11 pr-10"
                value={form.password}
                onChange={update('password')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm"
                type={show ? 'text' : 'password'}
                required
                placeholder="••••••"
                className="pl-11 pr-10"
                value={form.confirm}
                onChange={update('confirm')}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {show ? 'Hide passwords' : 'Show passwords'}
        </button>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <UserPlus /> Create Account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant="secondary"
        className="w-full"
        size="lg"
        type="button"
        onClick={() => authAPI.signInWithGoogle(`${window.location.origin}/dashboard`)}
      >
        <Chrome /> Continue with Google
      </Button>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
