'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, Eye, EyeOff, Loader2, Plus, Save, Trash2, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { paymentMethodsAdminAPI, type ManualPaymentMethodConfig, type PaymentGatewayConfig } from '@/lib/api';

const blankMethod: Omit<ManualPaymentMethodConfig, 'type'> = {
  id: '', name: '', region: 'Pakistan', accountName: '', accountDetails: '', instructions: '', minimumAmount: 5, active: true,
};
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<ManualPaymentMethodConfig[]>([]);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [fastpayEnabled, setFastpayEnabled] = useState(false);
  const [form, setForm] = useState(blankMethod);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    paymentMethodsAdminAPI.getSettings()
      .then((data) => {
        setMethods(data.methods || []);
        setGateways(data.gateways || []);
        setFastpayEnabled(Boolean(data.gateways?.find((gateway) => gateway.id === 'fastpay')?.enabled));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Payment settings load nahi huin'))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => { setForm(blankMethod); setEditingId(null); };

  const addOrUpdate = (event: React.FormEvent) => {
    event.preventDefault();
    const id = editingId || slugify(form.name);
    if (!id || !form.name.trim() || !form.accountDetails.trim() || !form.instructions.trim()) {
      toast.error('Naam, account details aur instructions zaroori hain.');
      return;
    }
    if (form.minimumAmount < 5 || form.minimumAmount > 10000 || !Number.isFinite(form.minimumAmount)) {
      toast.error('Minimum deposit $5 se kam nahi ho sakta.');
      return;
    }
    if (!editingId && methods.some((method) => method.id === id)) {
      toast.error('Is naam ka method pehle se mojood hai.');
      return;
    }
    const next: ManualPaymentMethodConfig = { ...form, id, name: form.name.trim(), type: 'manual' };
    setMethods((current) => editingId ? current.map((method) => method.id === editingId ? next : method) : [...current, next]);
    resetForm();
  };

  const save = async () => {
    setSaving(true);
    try {
      const savedMethods = await paymentMethodsAdminAPI.save(methods, fastpayEnabled);
      setMethods(savedMethods);
      toast.success('Payment methods save ho gaye');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment methods save nahi ho sake');
    } finally {
      setSaving(false);
    }
  };

  const fastpay = gateways.find((gateway) => gateway.id === 'fastpay');

  if (loading) return <DashboardShell variant="admin" title="Payment Methods"><div className="flex h-56 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading payment settings…</div></DashboardShell>;

  return (
    <DashboardShell variant="admin" title="Payment Methods">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm text-muted-foreground">Customer Add Funds screen par dikhne wale methods manage karein.</p><p className="mt-1 text-xs text-muted-foreground">Manual transfers admin verification ke baad hi wallet credit karte hain.</p></div>
        <Button onClick={save} loading={saving}><Save /> Save changes</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary-400" />Automatic gateway</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-white">FastPay</p><p className="mt-1 text-xs text-muted-foreground">Gateway secrets sirf Vercel server environment mein rakhein.</p></div><Badge variant={fastpay?.configured ? 'success' : 'warning'}>{fastpay?.configured ? 'Configured' : 'Needs server credentials'}</Badge></div>
              <div className="flex items-center justify-between rounded-xl pf-card-inner p-3"><Label htmlFor="fastpay-visible">Customers ko FastPay dikhayein</Label><Switch id="fastpay-visible" checked={fastpayEnabled} disabled={!fastpay?.configured} onCheckedChange={setFastpayEnabled} /></div>
              {!fastpay?.configured && <p className="flex gap-2 text-xs text-amber-200/80"><AlertTriangle className="h-4 w-4 shrink-0" />FASTPAY_API_KEY, FASTPAY_MERCHANT_ID, FASTPAY_WEBHOOK_SECRET aur FASTPAY_WEBHOOK_URL set hone tak FastPay available nahi hoga.</p>}
              <p className="text-xs text-muted-foreground">Naye automatic gateways ko unke provider-specific API, checkout aur webhook code ke saath integrate karna hoga. Sirf list mein naam add karke auto-payments enable nahi hote.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between"><span>Manual transfer methods</span><Badge variant="secondary">{methods.length}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {methods.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">Abhi manual methods add nahi kiye.</p> : methods.map((method) => <div key={method.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3"><div className="rounded-xl bg-primary-500/10 p-2.5 text-primary-300"><WalletCards className="h-5 w-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{method.name}</p><Badge variant={method.active ? 'success' : 'secondary'}>{method.active ? 'Visible' : 'Hidden'}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{method.region || 'Manual'} · Min. ${Number(method.minimumAmount).toFixed(2)}</p><p className="mt-2 break-all text-xs text-muted-foreground">{method.accountName ? `${method.accountName} · ` : ''}{method.accountDetails}</p></div></div>
                  <div className="flex items-center gap-2 self-end sm:self-auto"><Button type="button" variant="ghost" size="icon" aria-label={method.active ? 'Hide method' : 'Show method'} onClick={() => setMethods((all) => all.map((item) => item.id === method.id ? { ...item, active: !item.active } : item))}>{method.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button><Button type="button" variant="secondary" size="sm" onClick={() => { setEditingId(method.id); setForm({ ...method }); }}>Edit</Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${method.name}`} onClick={() => { if (window.confirm(`Remove ${method.name} from customer options?`)) setMethods((all) => all.filter((item) => item.id !== method.id)); }}><Trash2 className="h-4 w-4 text-red-400" /></Button></div>
                </div>
              </div>)}
              <p className="text-xs text-muted-foreground">Customer ke transfer requests pending rehte hain. Payment Logs se transfer verify karke approve/reject karein.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit manual method' : 'Add manual method'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addOrUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="method-name">Method name</Label><Input id="method-name" required maxLength={60} placeholder="JazzCash" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="method-region">Region</Label><Input id="method-region" maxLength={60} placeholder="Pakistan" value={form.region} onChange={(event) => setForm((value) => ({ ...value, region: event.target.value }))} /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="account-name">Account holder</Label><Input id="account-name" maxLength={100} placeholder="Registered account name" value={form.accountName} onChange={(event) => setForm((value) => ({ ...value, accountName: event.target.value }))} /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="account-details">Account number / IBAN / wallet</Label><Input id="account-details" required maxLength={160} placeholder="Wallet number or IBAN" value={form.accountDetails} onChange={(event) => setForm((value) => ({ ...value, accountDetails: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="minimum-amount">Minimum deposit (USD)</Label><Input id="minimum-amount" required type="number" min={5} max={10000} step="0.01" value={form.minimumAmount} onChange={(event) => setForm((value) => ({ ...value, minimumAmount: Number(event.target.value) }))} /></div>
                <div className="flex items-center gap-2 self-end pb-3"><Switch id="method-active" checked={form.active} onCheckedChange={(active) => setForm((value) => ({ ...value, active }))} /><Label htmlFor="method-active">Show to customers</Label></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="method-instructions">Customer instructions</Label><textarea id="method-instructions" required maxLength={500} rows={4} value={form.instructions} onChange={(event) => setForm((value) => ({ ...value, instructions: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-primary-400" placeholder="Explain how to transfer and submit transaction reference." /></div>
              </div>
              <div className="flex flex-wrap gap-2"><Button type="submit" variant="outline"><Plus className="h-4 w-4" />{editingId ? 'Update method' : 'Add method'}</Button>{editingId && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}</div>
              <p className="text-xs text-muted-foreground">Add/edit/hide/remove changes tabhi live honge jab upar Save changes press karein.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
