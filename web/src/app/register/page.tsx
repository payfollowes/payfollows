'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AuthShell } from '@/components/shared/auth-shell';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const res = await authAPI.signUp(form.email, form.password, form.username.trim());
      if (res?.session) {
        await refreshProfile();
        toast.success('Account created — welcome to PayFollows!');
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
