import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CreditCard, Eye, EyeOff, Loader2, Plus, Save, Trash2, WalletCards } from 'lucide-react';

type ManualMethod = {
  id: string;
  name: string;
  region: string;
  accountName: string;
  accountDetails: string;
  instructions: string;
  minimumAmount: number;
  active: boolean;
  type: 'manual';
};

type Gateway = { id: string; name: string; configured: boolean; enabled: boolean };
type MethodForm = Omit<ManualMethod, 'type'>;

const emptyForm: MethodForm = {
  id: '', name: '', region: 'Pakistan', accountName: '', accountDetails: '',
  instructions: '', minimumAmount: 5, active: true,
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const getErrorMessage = (payload: any) => payload?.error?.message || payload?.message || 'Request mukammal nahi ho saka.';

const PaymentMethodsPage: React.FC = () => {
  const [methods, setMethods] = useState<ManualMethod[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [fastpayEnabled, setFastpayEnabled] = useState(false);
  const [form, setForm] = useState<MethodForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const fastpay = useMemo(() => gateways.find((item) => item.id === 'fastpay'), [gateways]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/payment-methods', { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(getErrorMessage(payload));
        return payload?.data || {};
      })
      .then((data) => {
        if (!mounted) return;
        setMethods(Array.isArray(data.methods) ? data.methods : []);
        setGateways(Array.isArray(data.gateways) ? data.gateways : []);
        setFastpayEnabled(Boolean(data.gateways?.find((item: Gateway) => item.id === 'fastpay')?.enabled));
      })
      .catch((err) => mounted && setError(err.message || 'Payment methods load nahi ho sake.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const startEdit = (method: ManualMethod) => {
    setEditingId(method.id);
    setForm({ ...method });
    setError('');
  };

  const submitMethod = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const id = editingId || slugify(form.name);
    if (!id || !form.name.trim() || !form.accountDetails.trim() || !form.instructions.trim()) {
      setError('Method ka naam, account details aur customer instructions zaroori hain.');
      return;
    }
    if (form.minimumAmount < 5 || !Number.isFinite(Number(form.minimumAmount))) {
      setError('Minimum deposit kam az kam $5 hona chahiye.');
      return;
    }
    if (!editingId && methods.some((method) => method.id === id)) {
      setError('Is naam ka payment method pehle se mojood hai.');
      return;
    }
    const next = { ...form, id, name: form.name.trim(), type: 'manual' as const, minimumAmount: Number(form.minimumAmount) };
    setMethods((current) => editingId
      ? current.map((method) => method.id === editingId ? next : method)
      : [...current, next]);
    resetForm();
  };

  const saveChanges = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methods, fastpayEnabled }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload));
      setMethods(payload?.data?.methods || methods);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setError(err?.message || 'Payment settings save nahi ho sake.');
    } finally {
      setSaving(false);
    }
  };

  const removeMethod = (id: string) => {
    const item = methods.find((method) => method.id === id);
    if (!item || !window.confirm(`“${item.name}” ko payment options se remove kar dein?`)) return;
    setMethods((current) => current.filter((method) => method.id !== id));
    if (editingId === id) resetForm();
  };

  if (loading) return <div className="rounded-2xl border border-brand-border bg-brand-container p-8 text-center text-gray-300">Payment settings load ho rahi hain...</div>;

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Payments</p>
          <h1 className="mt-1 text-2xl font-bold">Payment integrations</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">Customer deposit options yahan manage karein. Manual transfer ko admin verify karne ke baad hi wallet credit hota hai.</p>
        </div>
        <button onClick={saveChanges} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent to-brand-purple px-4 py-2.5 text-sm font-semibold shadow-purple-glow-sm disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {saved && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">Payment method settings save ho gayi hain.</div>}

      <section className="rounded-2xl border border-brand-border bg-brand-container p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><CreditCard className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-semibold">FastPay automatic gateway</h2><p className="mt-1 text-sm text-gray-400">FastPay credentials server environment mein set hoti hain; secret keys dashboard/database mein store nahi hotin.</p></div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${fastpay?.configured ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{fastpay?.configured ? 'Credentials configured' : 'Needs server credentials'}</span>
            </div>
            <label className={`mt-4 flex items-center gap-3 text-sm ${fastpay?.configured ? 'cursor-pointer text-gray-200' : 'cursor-not-allowed text-gray-500'}`}>
              <input type="checkbox" checked={fastpayEnabled} disabled={!fastpay?.configured} onChange={(event) => setFastpayEnabled(event.target.checked)} className="h-4 w-4 accent-violet-500" />
              Customers ko FastPay option dikhayein
            </label>
            {!fastpay?.configured && <p className="mt-2 text-xs text-gray-500">FASTPAY_API_KEY, FASTPAY_MERCHANT_ID, FASTPAY_WEBHOOK_SECRET aur FASTPAY_WEBHOOK_URL set karne ke baad gateway enable ho sakta hai.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="rounded-2xl border border-brand-border bg-brand-container p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold">Manual transfer methods</h2><p className="mt-1 text-sm text-gray-400">Easypaisa, JazzCash, bank transfer ya doosra manual option.</p></div><span className="rounded-full bg-black/20 px-2.5 py-1 text-xs text-gray-400">{methods.length} total</span></div>
          {methods.length === 0 ? <div className="rounded-xl border border-dashed border-brand-border p-6 text-center text-sm text-gray-400">Abhi koi manual method add nahi hua.</div> : <div className="space-y-3">
            {methods.map((method) => <article key={method.id} className="rounded-xl border border-brand-border bg-black/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3"><div className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><WalletCards className="h-4 w-4" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{method.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${method.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-gray-500/15 text-gray-400'}`}>{method.active ? 'Visible to customers' : 'Hidden'}</span></div><p className="mt-1 truncate text-xs text-gray-400">{method.region || 'Manual transfer'} · Min. ${Number(method.minimumAmount).toFixed(2)}</p><p className="mt-2 text-xs text-gray-500">{method.accountName ? `${method.accountName} · ` : ''}{method.accountDetails}</p></div></div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <button type="button" aria-label={method.active ? `Hide ${method.name}` : `Show ${method.name}`} title={method.active ? 'Hide from customers' : 'Show to customers'} onClick={() => setMethods((current) => current.map((item) => item.id === method.id ? { ...item, active: !item.active } : item))} className="rounded-lg border border-brand-border p-2 text-gray-300 hover:bg-white/5">{method.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                  <button type="button" onClick={() => startEdit(method)} className="rounded-lg border border-brand-border px-3 py-2 text-xs font-medium text-gray-200 hover:bg-white/5">Edit</button>
                  <button type="button" aria-label={`Remove ${method.name}`} onClick={() => removeMethod(method.id)} className="rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>)}
          </div>}
          <p className="mt-4 text-xs leading-relaxed text-gray-500">Manual deposits pehle pending rehte hain. Admin transfer verify kar ke approve karega; approve se pehle wallet mein balance add nahi hota.</p>
        </div>

        <form onSubmit={submitMethod} className="space-y-4 rounded-2xl border border-brand-border bg-brand-container p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{editingId ? 'Edit method' : 'Add manual method'}</h2><p className="mt-1 text-sm text-gray-400">Customer ko transfer ke liye dikhne wali details.</p></div>{editingId && <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-white">Cancel edit</button>}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-gray-300">Method name<input required maxLength={60} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, ...(!editingId ? { id: slugify(event.target.value) } : {}) }))} placeholder="JazzCash" className="mt-1.5 w-full rounded-lg border border-brand-border bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" /></label>
            <label className="text-xs text-gray-300">Region<input maxLength={60} value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} placeholder="Pakistan" className="mt-1.5 w-full rounded-lg border border-brand-border bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" /></label>
            <label className="text-xs text-gray-300 sm:col-span-2">Account holder name<input maxLength={100} value={form.accountName} onChange={(event) => setForm((current) => ({ ...current, accountName: event.target.value }))} placeholder="Account par registered naam" className="mt-1.5 w-full rounded-lg border border-brand-border bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" /></label>
            <label className="text-xs text-gray-300 sm:col-span-2">Account number / IBAN / wallet<input required maxLength={160} value={form.accountDetails} onChange={(event) => setForm((current) => ({ ...current, accountDetails: event.target.value }))} placeholder="03xx xxxxxxx ya IBAN" className="mt-1.5 w-full rounded-lg border border-brand-border bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" /></label>
            <label className="text-xs text-gray-300">Minimum deposit (USD)<input required type="number" min="5" max="10000" step="0.01" value={form.minimumAmount} onChange={(event) => setForm((current) => ({ ...current, minimumAmount: Number(event.target.value) }))} className="mt-1.5 w-full rounded-lg border border-brand-border bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" /></label>
            <label className="flex items-center gap-2 self-end pb-3 text-xs text-gray-300"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="h-4 w-4 accent-violet-500" />Customer ko show karein</label>
            <label className="text-xs text-gray-300 sm:col-span-2">Payment instructions<textarea required maxLength={500} rows={4} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} placeholder="Customer ko transfer aur transaction reference submit karne ka tareeqa batayein." className="mt-1.5 w-full resize-y rounded-lg border border-brand-border bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" /></label>
          </div>
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20"><Plus className="h-4 w-4" />{editingId ? 'Update method' : 'Add method to list'}</button>
          <p className="text-xs text-gray-500">List mein add/edit/remove ke baad upar <b className="font-medium text-gray-300">Save changes</b> zaroor dabayein.</p>
        </form>
      </section>
    </div>
  );
};

export default PaymentMethodsPage;
