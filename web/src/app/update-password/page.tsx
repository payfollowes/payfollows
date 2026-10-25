'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/shared/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';

function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const guard = async () => {
      // The recovery link should have established a session via /auth/callback.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Your reset link has expired. Please request a new one.');
        router.replace('/forgot-password');
        return;
      }
      setChecking(false);
    };
    void guard();
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updatePassword(password);
      toast.success('Password updated — you can use it on your next login');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the password');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={show ? 'text' : 'password'}
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="pl-11 pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm"
            type={show ? 'text' : 'password'}
            required
            minLength={8}
            placeholder="Re-enter your password"
            className="pl-11"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        <KeyRound /> Update password
      </Button>
    </form>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <AuthShell
        title="Set a new password"
        subtitle="Choose a strong password you don't reuse elsewhere"
        footer={
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        }
      >
        <UpdatePasswordForm />
      </AuthShell>
    </Suspense>
  );
}
