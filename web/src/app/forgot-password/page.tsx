'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/shared/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      await authAPI.requestPasswordReset(email.trim(), redirectTo);
      // Generic confirmation so the response never reveals whether the
      // email address is registered.
      setSent(true);
    } catch (error) {
      // Still show the success state on rate-limit style responses to avoid
      // account enumeration; surface genuine configuration/network errors.
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('rate') || message.includes('too many')) {
        setSent(true);
      } else {
        toast.error(error instanceof Error ? error.message : 'Could not send the recovery link');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure recovery link"
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15">
            <MailCheck className="h-7 w-7 text-primary-300" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold text-white">Check your inbox</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If an account exists for <span className="text-white">{email}</span>, a password reset link is on its
              way. The link expires shortly, so use it soon.
            </p>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setSent(false)}>
            Resend to another email
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="pl-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <Mail /> Send recovery link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
