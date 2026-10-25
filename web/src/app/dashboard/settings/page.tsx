'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Wallet,
  LifeBuoy,
  KeyRound,
  MessageSquare,
  LogOut,
  Eye,
  EyeOff,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { authAPI } from '@/lib/api';
import { formatDate, truncateMiddle } from '@/lib/utils';

export default function UserSettingsPage() {
  const { profile, signOut } = useAuth();
  const { formatAmount } = useCurrency();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const initials = (profile?.username ?? 'U').slice(0, 2).toUpperCase();
  const passwordIssues = [];
  if (password && password.length < 8) passwordIssues.push('At least 8 characters');
  if (confirm && password !== confirm) passwordIssues.push('Passwords do not match');

  const handlePassword = async () => {
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await authAPI.updatePassword(password);
      toast.success('Password updated');
      setPassword('');
      setConfirm('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  const copyId = async () => {
    if (!profile?.id) return;
    await navigator.clipboard.writeText(profile.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <DashboardShell variant="user" title="Settings">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* --------------------------------------------------------- Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary-400" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-lg font-bold text-white">{profile?.username}</p>
                  <Badge variant={profile?.role === 'admin' ? 'info' : 'secondary'}>{profile?.role}</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <Separator />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Account ID</dt>
                <dd className="flex items-center gap-2 font-mono text-xs text-foreground/85">
                  {profile ? truncateMiddle(profile.id, 22) : '—'}
                  <button
                    type="button"
                    onClick={copyId}
                    aria-label="Copy account ID"
                    className="text-muted-foreground transition-colors hover:text-primary-300"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="text-foreground/85">{profile?.created_at ? formatDate(profile.created_at) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Account status</dt>
                <dd>
                  <Badge variant="success">{profile?.status ?? 'active'}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Referral code</dt>
                <dd className="font-mono text-xs text-primary-300">{profile?.referral_code ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {/* ---------------------------------------------------------- Wallet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary-400" /> Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current balance</span>
                <span className="font-display text-lg font-bold text-white tabular">
                  {formatAmount(profile?.balance ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lifetime spent</span>
                <span className="font-semibold text-foreground/85 tabular">{formatAmount(profile?.total_spent ?? 0)}</span>
              </div>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/dashboard/add-funds">Add funds</Link>
              </Button>
            </CardContent>
          </Card>

          {/* -------------------------------------------------------- Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-400" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </div>
              {passwordIssues.length > 0 && (
                <ul className="space-y-1 text-xs text-amber-300">
                  {passwordIssues.map((issue) => (
                    <li key={issue}>• {issue}</li>
                  ))}
                </ul>
              )}
              <Button onClick={handlePassword} disabled={saving || !password} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Update password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------------------------ Support & session */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary-400" /> Support &amp; session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/support">
                  <LifeBuoy className="mr-2 h-4 w-4" /> Support center
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/live-chat">
                  <MessageSquare className="mr-2 h-4 w-4" /> Live chat
                </Link>
              </Button>
            </div>
            <Separator className="my-5" />
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-white">Sign out of this device</p>
                <p className="text-xs text-muted-foreground">
                  Other devices stay signed in. To run two accounts at once, use a separate browser profile or
                  private window — each browser keeps one session per site.
                </p>
              </div>
              <Button variant="outline" className="shrink-0 border-red-500/30 text-red-300 hover:text-red-200" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
