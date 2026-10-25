'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wallet, CheckCircle2, XCircle, CreditCard, Smartphone, Bitcoin, Landmark, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { paymentsAPI, walletAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import type { BalanceTransaction, Payment } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

// Display catalog. Availability is decided by the backend capability map
// (/api/payments/methods) so unconfigured gateways never fake a checkout.
const METHOD_CATALOG = [
  { id: 'fastpay', name: 'FastPay', icon: Zap, region: 'MENA / Global' },
  { id: 'payfast', name: 'PayFast', icon: Landmark, region: 'ZA / Global' },
  { id: 'credit_card', name: 'Credit / Debit Card', icon: CreditCard, region: 'Global' },
  { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone, region: 'Pakistan' },
  { id: 'paypal', name: 'PayPal', icon: Wallet, region: 'Global' },
  { id: 'crypto', name: 'Crypto (USDT / BTC)', icon: Bitcoin, region: 'Global' },
];

// Used only if the capability endpoint is unreachable: FastPay remains the
// known-working default gateway.
const FALLBACK_AVAILABILITY: Record<string, boolean> = { fastpay: true };

const QUICK_AMOUNTS = [10, 25, 50, 100, 250];

function AddFundsInner() {
  const params = useSearchParams();
  const { profile, refreshProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const [method, setMethod] = useState('fastpay');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [ledger, setLedger] = useState<BalanceTransaction[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>(FALLBACK_AVAILABILITY);
  const [methodsLoaded, setMethodsLoaded] = useState(false);

  useEffect(() => {
    if (params.get('success') === 'true') {
      toast.success('Payment received — your balance will update shortly.');
      void refreshProfile();
    }
    if (params.get('canceled') === 'true') {
      toast.error('Payment canceled.');
    }
    paymentsAPI
      .getPayments()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setTableLoading(false));
    walletAPI
      .listTransactions(25)
      .then(setLedger)
      .catch(() => setLedger([]));
    paymentsAPI.getMethods().then((methods) => {
      if (methods.length === 0) return; // keep the FastPay fallback
      const map: Record<string, boolean> = {};
      methods.forEach((m) => {
        map[m.id] = m.available;
      });
      setAvailability(map);
      // Default to the first configured gateway instead of a disabled tile.
      const firstLive = methods.find((m) => m.available);
      if (firstLive) setMethod(firstLive.id);
      setMethodsLoaded(true);
    });
  }, [params, refreshProfile]);

  const selectedAvailable = availability[method] !== false;

  const amountNum = Number(amount) || 0;
  const fee = amountNum * 0.02;
  const total = amountNum + fee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum < 5) return toast.error('Minimum deposit is $5.00');
    if (!profile) return toast.error('Profile not loaded');
    if (!selectedAvailable) {
      return toast.error('This payment method is not available yet — please choose a live gateway.');
    }

    setLoading(true);
    try {
      const payment = await paymentsAPI.createPayment(amountNum, method);
      const gateway = await paymentsAPI.createGatewayOrder(payment, profile, method);
      if (gateway?.payment_url || gateway?.redirect_url || gateway?.url) {
        window.location.href = gateway.payment_url || gateway.redirect_url || gateway.url;
      } else {
        toast.info('Deposit request created. Gateway will confirm shortly.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell variant="user" title="Add Funds">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Deposit to your balance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {METHOD_CATALOG.map((m) => {
                  const available = availability[m.id] !== false;
                  const active = method === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      disabled={!available}
                      onClick={() => available && setMethod(m.id)}
                      aria-disabled={!available}
                      className={cn(
                        'relative rounded-2xl border p-4 text-left transition-all',
                        active && available
                          ? 'border-primary-500/60 bg-primary-500/10 shadow-glow-sm'
                          : available
                            ? 'border-white/[0.08] bg-white/[0.04] hover:border-white/20'
                            : 'cursor-not-allowed border-white/[0.05] bg-white/[0.02] opacity-55'
                      )}
                    >
                      {!available && (
                        <span className="absolute right-3 top-3 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                          Soon
                        </span>
                      )}
                      <m.icon
                        className={cn(
                          'h-6 w-6',
                          active && available ? 'text-primary-400' : 'text-muted-foreground'
                        )}
                      />
                      <p className="mt-3 text-sm font-semibold text-white">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.region}</p>
                    </button>
                  );
                })}
              </div>
              {methodsLoaded && !Object.values(availability).some(Boolean) && (
                <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200/90">
                  No payment gateway is configured yet. Deposits will open as soon as the provider credentials are
                  added.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={5}
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary-500/40 hover:text-white"
                    >
                      ${a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl pf-card-inner p-5 text-sm">
                <Row label="Amount" value={formatAmount(amountNum)} />
                <Row label="Processing fee (2%)" value={formatAmount(fee)} />
                <div className="my-2 h-px bg-white/10" />
                <Row label="Total payable" value={formatAmount(total)} bold />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={amountNum < 5 || !selectedAvailable}
              >
                <Wallet /> Continue to Payment
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Balance</p>
            <p className="mt-2 font-display text-4xl font-bold gradient-text">{formatAmount(profile?.balance ?? 0)}</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Funds credited automatically after confirmation
              </p>
              <p className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" /> Minimum deposit: $5.00
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Deposits</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tableLoading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : payments.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No deposits yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 8).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold text-white">{formatAmount(p.amount)}</TableCell>
                        <TableCell className="text-xs capitalize">{(p.payment_method ?? 'manual').replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === 'completed'
                                ? 'success'
                                : p.status === 'pending'
                                  ? 'warning'
                                  : p.status === 'failed'
                                    ? 'destructive'
                                    : 'secondary'
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                          {formatDateTime(p.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balance History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ledger.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No wallet movements yet. Deposits, orders and refunds will appear here.
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {ledger.map((tx) => {
                    const credit = tx.amount >= 0;
                    return (
                      <li key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {tx.description ?? (tx.type ?? 'transaction').replace(/_/g, ' ')}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                            {(tx.type ?? 'transaction').replace(/_/g, ' ')} · {formatDateTime(tx.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-sm font-semibold', credit ? 'text-emerald-400' : 'text-red-400')}>
                            {credit ? '+' : '−'}
                            {formatAmount(Math.abs(tx.amount))}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Bal {formatAmount(tx.balance_after)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-muted-foreground', bold && 'text-white font-semibold')}>{label}</span>
      <span className={cn('text-foreground/90', bold && 'font-display text-lg font-bold text-primary-300')}>{value}</span>
    </div>
  );
}

export default function AddFundsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>}>
      <AddFundsInner />
    </Suspense>
  );
}
