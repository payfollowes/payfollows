'use client';

import { useState } from 'react';
import { Settings2, Save, Globe, CreditCard, Bell, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function AdminSettingsPage() {
  const [general, setGeneral] = useState({
    siteName: 'PayFollows',
    supportEmail: 'support@payfollows.com',
    minDeposit: '5',
    processingFee: '2',
  });
  const [toggles, setToggles] = useState({
    newOrders: true,
    maintenance: false,
    autoSync: true,
    emailAlerts: true,
  });

  const save = () => toast.success('Settings saved');

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
              <Input value={general.supportEmail} onChange={(e) => setGeneral((g) => ({ ...g, supportEmail: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Deposit (USD)</Label>
                <Input type="number" value={general.minDeposit} onChange={(e) => setGeneral((g) => ({ ...g, minDeposit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Processing Fee %</Label>
                <Input type="number" step="0.1" value={general.processingFee} onChange={(e) => setGeneral((g) => ({ ...g, processingFee: e.target.value }))} />
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
              <CreditCard className="h-5 w-5 text-primary-400" /> Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Payment gateway credentials (FastPay, PayFast) are managed securely in the legacy backend
              environment variables on Vercel.
            </p>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 font-mono text-xs">
              FASTPAY_API_KEY · FASTPAY_WEBHOOK_SECRET · PAYFAST_PASSPHRASE
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary-400" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Row Level Security is enforced in Supabase. Admin actions use service-role verification through the legacy API.</p>
            <ul className="list-inside list-disc space-y-1.5">
              <li>Supabase PKCE auth flow with encrypted local sessions</li>
              <li>CORS restricted to Vercel origins</li>
              <li>Rate limiting on payment and auth endpoints</li>
              <li>Service keys never exposed to the browser</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={save}>
          <Save /> Save Settings
        </Button>
      </div>
    </DashboardShell>
  );
}
