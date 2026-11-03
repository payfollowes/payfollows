import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  total: number;
  payment_method: string;
  payment_provider: string;
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'canceled';
  metadata?: Record<string, any> | null;
  created_at: string;
  user?: { username?: string; email?: string } | null;
};

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;
const getMessage = (payload: any) => payload?.error?.message || payload?.message || 'Request mukammal nahi ho saki.';

const PaymentLogsPage: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDeposits = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/admin/manual-deposits', { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(getMessage(payload));
      setDeposits(payload?.data?.deposits || []);
    } catch (loadError: any) {
      setError(loadError?.message || 'Manual deposits load nahi ho sake.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDeposits(); }, [loadDeposits]);

  const review = async (deposit: Deposit, action: 'approve' | 'reject') => {
    const promptText = action === 'approve'
      ? `Kya aapne ${money(deposit.amount)} ka transfer verify kar liya hai? Approve karne se customer wallet credit ho jayegi.`
      : `Is ${money(deposit.amount)} deposit ko reject karein?`;
    if (!window.confirm(promptText)) return;
    const reason = action === 'reject' ? (window.prompt('Rejection reason (optional):') || '') : '';
    setBusyId(deposit.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/manual-deposits/${encodeURIComponent(deposit.id)}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(getMessage(payload));
      setNotice(action === 'approve' ? 'Deposit approve hui aur wallet ko credit kar diya gaya.' : 'Deposit reject kar di gayi.');
      await loadDeposits();
    } catch (reviewError: any) {
      setError(reviewError?.message || 'Deposit review nahi ho saki.');
    } finally {
      setBusyId('');
    }
  };

  const pending = deposits.filter((deposit) => deposit.status === 'pending');

  return (
    <div className="space-y-5 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Payments</p><h1 className="mt-1 text-2xl font-bold">Payment logs & reviews</h1><p className="mt-1 text-sm text-gray-400">Manual deposit ko approve karne se pehle transaction apne provider/bank mein verify karein.</p></div>
        <button onClick={() => { setLoading(true); void loadDeposits(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-sm text-gray-200 hover:bg-white/5"><RefreshCw className="h-4 w-4" />Refresh</button>
      </div>
      {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}

      <section className="rounded-2xl border border-brand-border bg-brand-container p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold">Pending manual deposits</h2><p className="mt-1 text-xs text-gray-400">Approve ya reject karne se pehle bank/wallet transaction match karein.</p></div><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">{pending.length} pending</span></div>
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Deposits load ho rahi hain...</div> : deposits.length === 0 ? <div className="rounded-xl border border-dashed border-brand-border p-8 text-center text-sm text-gray-400">Abhi koi manual deposit request nahi.</div> : <div className="space-y-3">
          {deposits.map((deposit) => {
            const methodName = deposit.metadata?.manual_method?.name || deposit.payment_method;
            const pendingStatus = deposit.status === 'pending';
            return <article key={deposit.id} className="rounded-xl border border-brand-border bg-black/10 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{methodName}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${deposit.status === 'pending' ? 'bg-amber-500/10 text-amber-200' : deposit.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{deposit.status}</span></div>
                  <p className="mt-1 text-sm text-gray-300">{deposit.user?.username || 'Customer'} <span className="text-gray-500">{deposit.user?.email ? `· ${deposit.user.email}` : ''}</span></p>
                  <div className="mt-2 grid gap-x-5 gap-y-1 text-xs text-gray-400 sm:grid-cols-2"><span>Amount: <b className="font-semibold text-white">{money(deposit.amount)}</b></span><span>Transaction ref: <b className="break-all font-mono font-medium text-gray-200">{deposit.transaction_id || 'Not provided'}</b></span><span>Submitted: {new Date(deposit.created_at).toLocaleString()}</span><span>Payment ID: <span className="font-mono">{deposit.id}</span></span></div>
                </div>
                {pendingStatus && <div className="flex shrink-0 gap-2">
                  <button disabled={busyId === deposit.id} onClick={() => void review(deposit, 'reject')} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Reject</button>
                  <button disabled={busyId === deposit.id} onClick={() => void review(deposit, 'approve')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />{busyId === deposit.id ? 'Saving...' : 'Verify & approve'}</button>
                </div>}
              </div>
            </article>;
          })}
        </div>}
        {!loading && pending.length === 0 && deposits.length > 0 && <div className="mt-4 flex items-center gap-2 text-xs text-gray-500"><Clock3 className="h-4 w-4" />Koi pending manual deposit nahi hai.</div>}
      </section>
    </div>
  );
};

export default PaymentLogsPage;
