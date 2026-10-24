'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wallet, CheckCircle2, XCircle, CreditCard, Smartphone, Bitcoin, Landmark } from 'lucide-react';
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
import { paymentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import type { Payment } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const METHODS = [
  { id: 'credit_card', name: 'Credit / Debit Card', icon: CreditCard, region: 'Global' },
  { id: 'payfast', name: 'PayFast', icon: Landmark, region: 'ZA / Global' },
  { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone, region: 'Pakistan' },
  { id: 'paypal', name: 'PayPal', icon: Wallet, region: 'Global' },
  { id: 'crypto', name: 'Crypto (USDT / BTC)', icon: Bitcoin, region: 'Global' },
];

const QUICK_AMOUNTS = [10, 25, 50, 100, 250];

function AddFundsInner() {
  const params = useSearchParams();
  const { profile, refreshProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const [method, setMethod] = useState('credit_card');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

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
  }, [params, refreshProfile]);

  const amountNum = Number(amount) || 0;
  const fee = amountNum * 0.02;
  const total = amountNum + fee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum < 5) return toast.error('Minimum deposit is $5.00');
    if (!profile) return toast.error('Profile not loaded');

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
                {METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition-all',
                      method === m.id
                        ? 'border-primary-500/60 bg-primary-500/10 shadow-glow-sm'
                        : 'border-white/[0.08] bg-white/[0.04] hover:border-white/20'
                    )}
                  >
                    <m.icon className={cn('h-6 w-6', method === m.id ? 'text-primary-400' : 'text-muted-foreground')} />
                    <p className="mt-3 text-sm font-semibold text-white">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">{m.region}</p>
                  </button>
                ))}
              </div>

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

              <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-sm">
                <Row label="Amount" value={formatAmount(amountNum)} />
                <Row label="Processing fee (2%)" value={formatAmount(fee)} />
                <div className="my-2 h-px bg-white/10" />
                <Row label="Total payable" value={formatAmount(total)} bold />
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading} disabled={amountNum < 5}>
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
                        <TableCell className="text-xs capitalize">{p.payment_method.replace('_', ' ')}</TableCell>
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
