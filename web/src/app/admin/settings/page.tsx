'use client';

import { useEffect, useState } from 'react';
import { Save, Globe, CreditCard, Bell, ShieldCheck, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { settingsAPI, auditAPI } from '@/lib/api';
import type { PlatformSettings } from '@/lib/types';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [general, setGeneral] = useState({
    siteName: 'PayFollows',
    supportEmail: 'support@payfollows.com',
    minDeposit: '5',
    processingFee: '2',
    referralRewardAmount: '2',
  });
  const [toggles, setToggles] = useState({
    newOrders: true,
    maintenance: false,
    autoSync: true,
    emailAlerts: true,
    referralEnabled: true,
  });

  useEffect(() => {
    settingsAPI
      .get()
      .then((cfg: PlatformSettings) => {
        setGeneral({
          siteName: cfg.site_name ?? 'PayFollows',
          supportEmail: cfg.support_email ?? 'support@payfollows.com',
          minDeposit: String(cfg.min_deposit ?? 5),
          processingFee: String(cfg.processing_fee_pct ?? 2),
          referralRewardAmount: String(cfg.referral_reward_amount ?? 2),
        });
        setToggles({
          newOrders: cfg.new_orders ?? true,
          maintenance: cfg.maintenance ?? false,
          autoSync: cfg.auto_sync ?? true,
          emailAlerts: cfg.email_alerts ?? true,
          referralEnabled: cfg.referral_reward_enabled ?? true,
        });
      })
      .catch(() => toast.error('Could not load settings — showing defaults'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const config: PlatformSettings = {
        site_name: general.siteName,
        support_email: general.supportEmail,
        min_deposit: Number(general.minDeposit) || 0,
        processing_fee_pct: Number(general.processingFee) || 0,
        referral_reward_amount: Number(general.referralRewardAmount) || 0,
        new_orders: toggles.newOrders,
        maintenance: toggles.maintenance,
        auto_sync: toggles.autoSync,
        email_alerts: toggles.emailAlerts,
        referral_reward_enabled: toggles.referralEnabled,
      };
      await settingsAPI.update(config);
      await auditAPI
        .record('settings.updated', 'app_settings', 'platform', { ...config })
        .catch(() => undefined);
      toast.success('Platform settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell variant="admin" title="Settings">
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading settings…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell variant="admin" title="Settings">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary-400" /> General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={general.siteName} onChange={(e) => setGeneral((g) => ({ ...g, siteName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                type="email"
                value={general.supportEmail}
                onChange={(e) => setGeneral((g) => ({ ...g, supportEmail: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Deposit (USD)</Label>
                <Input
                  type="number"
                  value={general.minDeposit}
                  onChange={(e) => setGeneral((g) => ({ ...g, minDeposit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Processing Fee %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={general.processingFee}
                  onChange={(e) => setGeneral((g) => ({ ...g, processingFee: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-400" /> System Toggles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { key: 'newOrders' as const, label: 'Accept new orders', desc: 'Allow customers to place orders' },
              { key: 'maintenance' as const, label: 'Maintenance mode', desc: 'Temporarily disable the storefront' },
              { key: 'autoSync' as const, label: 'Automatic provider sync', desc: 'Daily catalog and balance sync' },
              { key: 'emailAlerts' as const, label: 'Email alerts', desc: 'Notify admins of payments and tickets' },
            ].map((row) => (
              <div key={row.key}>
                <div className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-white">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                  <Switch checked={toggles[row.key]} onCheckedChange={(v) => setToggles((t) => ({ ...t, [row.key]: v }))} />
                </div>
                <Separator />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary-400" /> Referral program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-white">Enable referral rewards</p>
                <p className="text-xs text-muted-foreground">Credit referrers on a referred user&apos;s first deposit</p>
              </div>
              <Switch
                checked={toggles.referralEnabled}
                onCheckedChange={(v) => setToggles((t) => ({ ...t, referralEnabled: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reward amount (USD)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={general.referralRewardAmount}
                onChange={(e) => setGeneral((g) => ({ ...g, referralRewardAmount: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-400" /> Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Gateway credentials (FastPay, PayFast) are managed securely in the legacy backend environment variables on
              Vercel. The live capability map at <code className="text-primary-300">/api/payments/methods</code> reflects
              what is currently configured.
            </p>
            <div className="rounded-xl pf-card-inner p-4 font-mono text-xs">
              FASTPAY_API_KEY · FASTPAY_WEBHOOK_SECRET · PAYFAST_PASSPHRASE
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary-400" /> Security &amp; audit
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-1.5">
              <li>Row Level Security is enforced in Supabase; every settings change is written to the audit log.</li>
              <li>Supabase PKCE auth flow with encrypted local sessions and self-service password recovery.</li>
              <li>Service keys never exposed to the browser; wallet mutations only run through definer RPCs.</li>
              <li>
                Inspect the full trail on the <span className="text-primary-300">Audit Logs</span> admin page.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} loading={saving}>
          <Save /> Save Settings
        </Button>
      </div>
    </DashboardShell>
  );
}
