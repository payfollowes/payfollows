import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, WalletCards } from 'lucide-react';
import { authAPI, paymentsAPI } from '../../lib/api';
import { isTimeoutError } from '../../lib/utils';
import type { UserProfile } from '../../lib/api';
import { useCurrency } from '../../lib/CurrencyContext';

type PaymentMethod = {
  id: string;
  name: string;
  region?: string;
  type: 'gateway' | 'manual';
  available: boolean;
  endpoint?: string;
  minimumAmount?: number;
  accountName?: string;
  accountDetails?: string;
  instructions?: string;
};

const AddFundsPage: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { formatAmount } = useCurrency();

  const selected = useMemo(() => methods.find((method) => method.id === selectedMethod), [methods, selectedMethod]);
  const minimum = selected?.type === 'manual' ? selected.minimumAmount || 5 : 5;

  useEffect(() => {
    let mounted = true;
    fetch('/api/payments/methods', { credentials: 'include' })
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return;
        const active = (payload?.data?.methods || []).filter((method: PaymentMethod) => method.available);
        setMethods(active);
        setSelectedMethod((current) => current || active[0]?.id || '');
      })
      .catch(() => mounted && setMethods([]));

    const loadProfile = async () => {
      try {
        const userProfile = await authAPI.getUserProfile();
        if (mounted) setProfile(userProfile as UserProfile);
      } catch (loadError: any) {
        if (mounted) setError(isTimeoutError(loadError) ? 'Request timed out. Please refresh.' : 'Failed to load profile.');
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);

  const calculateFee = (value: number) => selected?.type === 'manual' ? 0 : value * 0.02;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    const amountNum = Number(amount);

    if (!Number.isFinite(amountNum) || amountNum < minimum || amountNum > 10000) {
      setError(`Minimum deposit ${formatAmount(minimum)} hai. Maximum ${formatAmount(10000)} hai.`);
      setLoading(false);
      return;
    }
    if (!profile) {
      setError('User profile nahi mila. Dobara sign in karein.');
      setLoading(false);
      return;
    }
    if (!selected?.available) {
      setError('Yeh payment method is waqt available nahi hai.');
      setLoading(false);
      return;
    }

    try {
      if (selected.type === 'manual') {
        if (transactionReference.trim().length < 3) {
          throw new Error('Transfer ke baad transaction reference / ID enter karein.');
        }
        const response = await fetch('/api/payments/manual-deposit', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amountNum, methodId: selected.id, transactionReference: transactionReference.trim() }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error?.message || 'Deposit request submit nahi ho saki.');
        setManualSubmitted(true);
        setNotice(`Deposit request submit ho gayi. Reference: ${payload?.data?.payment?.transaction_id || transactionReference.trim()}. Admin verification ke baad balance update hoga.`);
        setTransactionReference('');
        setLoading(false);
        return;
      }

      const payment = await paymentsAPI.createPayment(amountNum, selected.id);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      let response: Response;
      try {
        response = await fetch(selected.endpoint || '/api/fastpay/create-order', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: (payment as any).id,
            amount: (payment as any).total,
            customerEmail: profile.email,
            customerName: profile.username,
            returnUrl: `${window.location.origin}/#/dashboard/add-funds?success=true&payment_id=${(payment as any).id}`,
            cancelUrl: `${window.location.origin}/#/dashboard/add-funds?canceled=true&payment_id=${(payment as any).id}`,
          }),
          signal: controller.signal,
        });
      } catch (requestError: any) {
        if (requestError.name === 'AbortError') throw new Error('Request timeout');
        throw requestError;
      } finally {
        window.clearTimeout(timeoutId);
      }
      const paymentOrder = await response.json();
      const paymentUrl = paymentOrder?.data?.paymentUrl || paymentOrder?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      const serverError = paymentOrder && (typeof paymentOrder.error === 'object' ? paymentOrder.error.message : paymentOrder.error);
      throw new Error(serverError || 'Payment URL nahi mili.');
    } catch (submitError: any) {
      setError(submitError?.message || 'Payment start nahi ho saki. Dobara koshish karein.');
      setLoading(false);
    }
  };

  const amountNum = Number(amount) || 0;
  const fee = calculateFee(amountNum);
  const total = amountNum + fee;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}
      <div className="rounded-2xl border border-brand-border bg-brand-container p-5 sm:p-8">
        {manualSubmitted ? <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-gray-300">Request pending hai. Aapki wallet balance admin verification se pehle change nahi hogi.</div> : null}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Payment method</label>
            {methods.length === 0 ? <div className="rounded-xl border border-dashed border-brand-border p-5 text-sm text-gray-400">Abhi koi payment method available nahi. Admin se rabta karein.</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {methods.map((method) => <button key={method.id} type="button" onClick={() => { setSelectedMethod(method.id); setManualSubmitted(false); setNotice(''); setError(''); }} className={`min-h-20 rounded-xl border p-3 text-left transition-colors ${selectedMethod === method.id ? 'border-violet-400 bg-violet-500/10 shadow-purple-glow-sm' : 'border-brand-border bg-black/10 hover:border-violet-400/50'}`}>
                <span className="block text-sm font-semibold text-white">{method.name}</span><span className="mt-1 block text-xs text-gray-400">{method.region || (method.type === 'manual' ? 'Manual transfer' : 'Online gateway')}</span>
                {method.type === 'manual' && <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-300"><WalletCards className="h-3 w-3" />Manual verification</span>}
              </button>)}
            </div>}
          </div>

          {selected?.type === 'manual' && <div className="space-y-3 rounded-xl border border-violet-400/20 bg-violet-500/5 p-4">
            <div><h3 className="text-sm font-semibold text-white">Transfer details</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{selected.instructions}</p></div>
            <div className="rounded-lg border border-brand-border bg-black/20 p-3 text-sm"><div className="flex flex-wrap justify-between gap-1"><span className="text-gray-400">Account name</span><span className="font-medium text-white">{selected.accountName || '—'}</span></div><div className="mt-2 flex flex-wrap justify-between gap-1"><span className="text-gray-400">Account / wallet</span><span className="break-all font-mono text-white">{selected.accountDetails}</span></div></div>
            <p className="text-xs text-amber-200/80">Transfer karne ke baad neeche reference submit karein. Admin verify karega; balance foran auto-credit nahi hoga.</p>
          </div>}

          <div>
            <label htmlFor="deposit-amount" className="mb-2 block text-sm font-medium text-gray-300">Amount ({selected?.type === 'manual' ? 'USD' : '$'})</label>
            <input type="number" id="deposit-amount" name="amount" step="0.01" min={minimum} max="10000" value={amount} onChange={(event) => { setAmount(event.target.value); setManualSubmitted(false); }} placeholder="10.00" required className="w-full rounded-xl border border-brand-border bg-brand-input p-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-purple" />
            <p className="mt-2 text-xs text-gray-400">Minimum: {formatAmount(minimum)}{selected?.type === 'manual' ? '. Manual transfer par processing fee nahi.' : '. 2% processing fee apply hogi.'}</p>
          </div>

          {selected?.type === 'manual' && <label htmlFor="transaction-reference" className="block text-sm font-medium text-gray-300">Transaction reference / ID<input id="transaction-reference" name="transactionReference" required minLength={3} maxLength={100} value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="Bank / wallet transaction reference" className="mt-2 w-full rounded-xl border border-brand-border bg-brand-input p-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-purple" /></label>}

          {amountNum > 0 && <div className="space-y-2 rounded-xl border border-brand-border bg-black/20 p-4 text-sm"><div className="flex justify-between"><span className="text-gray-400">Deposit amount</span><span>{formatAmount(amountNum)}</span></div><div className="flex justify-between"><span className="text-gray-400">Processing fee{selected?.type !== 'manual' ? ' (2%)' : ''}</span><span>{formatAmount(fee)}</span></div><hr className="border-brand-border" /><div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatAmount(total)}</span></div></div>}

          <button type="submit" disabled={loading || !selected || amountNum < minimum} className="w-full rounded-xl bg-gradient-to-r from-brand-accent to-brand-purple p-3 font-semibold text-white shadow-purple-glow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Processing...' : selected?.type === 'manual' ? 'Submit for verification' : 'Proceed to payment'}</button>
        </form>
      </div>
    </div>
  );
};

export default AddFundsPage;
