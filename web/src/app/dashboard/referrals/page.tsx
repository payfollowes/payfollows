'use client';

import { useEffect, useMemo, useState } from 'react';
import { Gift, Copy, Check, Users, Wallet, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { referralAPI, settingsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import type { ReferralReward, UserProfile, PlatformSettings } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export default function ReferralsPage() {
  const { profile, refreshProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const [referred, setReferred] = useState<UserProfile[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void refreshProfile();
    Promise.all([
      referralAPI.listReferredUsers().catch(() => []),
      referralAPI.listRewards().catch(() => []),
      settingsAPI.get().catch(() => ({})),
    ]).then(([users, rewardRows, cfg]) => {
      setReferred(users);
      setRewards(rewardRows);
      setSettings(cfg);
      setLoading(false);
    });
  }, [refreshProfile]);

  const code = profile?.referral_code ?? '—';
  const link = useMemo(
    () => (typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${code}` : ''),
    [code]
  );
  const totalEarned = rewards.reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);
  const rewardAmount = settings.referral_reward_amount ?? 2;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Clipboard unavailable — copy the link manually');
    }
  };

  const share = async () => {
    const shareData = {
      title: 'Join PayFollows',
      text: 'Get the cheapest SMM services on PayFollows — sign up with my link:',
      url: link,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await copy(link, 'Referral link');
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <DashboardShell variant="user" title="Referrals">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary-400" /> Your referral program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.07] p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-300" />
                  <div className="text-sm leading-relaxed text-muted-foreground">
                    Share your link. When someone you referred completes their{' '}
                    <span className="font-semibold text-white">first deposit</span>, you earn a{' '}
                    <span className="font-semibold text-primary-300">{formatAmount(rewardAmount)}</span> wallet
                    reward — automatically, no tickets needed.
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your code</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-primary-300">
                    {code}
                  </code>
                  <Button variant="secondary" onClick={() => copy(code, 'Code')}>
                    <Copy /> Copy code
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referral link</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-emerald-300">
                    {link}
                  </code>
                  <Button variant="secondary" onClick={() => copy(link, 'Link')}>
                    {copied ? <Check className="text-emerald-400" /> : <Copy />} Copy
                  </Button>
                  <Button onClick={share}>
                    <Share2 /> Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referred accounts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : referred.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No referrals yet — share your link to start earning.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referred.map((u) => {
                      const rewarded = rewards.some((r) => r.referred_id === u.id);
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <p className="font-semibold text-white">{u.username}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={rewarded ? 'success' : 'warning'}>
                              {rewarded ? 'Rewarded' : 'Pending first deposit'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total earned</p>
                <p className="font-display text-3xl font-bold gradient-text">{formatAmount(totalEarned)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Referred users</p>
                <p className="font-display text-3xl font-bold text-white">{referred.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reward history</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rewards.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No rewards yet.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {rewards.map((r) => (
                    <li key={r.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-white">Referral reward</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">+{formatAmount(r.reward_amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
