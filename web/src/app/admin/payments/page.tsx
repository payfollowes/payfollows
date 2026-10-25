'use client';

import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { Payment } from '@/lib/types';
import { formatDateTime, truncateMiddle } from '@/lib/utils';
import { DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export default function AdminPaymentsPage() {
  const { formatAmount } = useCurrency();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    adminAPI
      .getAllPayments()
      .then(setPayments)
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const completed = payments.filter((p) => p.status === 'completed');
  const pending = payments.filter((p) => p.status === 'pending');
  const revenue = completed.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <DashboardShell variant="admin" title="Payment Logs">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} title="Total Revenue" value={formatAmount(revenue)} icon={DollarSign} tone="green" />
        <StatCard index={1} title="Completed" value={String(completed.length)} icon={CheckCircle2} tone="purple" />
        <StatCard index={2} title="Pending" value={String(pending.length)} icon={Clock} tone="amber" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-400" /> All Transactions
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={load}>
            <RefreshCw /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : payments.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Transaction</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, 100).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{truncateMiddle(p.id, 12)}</TableCell>
                    <TableCell className="text-sm font-medium text-white">{p.user?.username || '—'}</TableCell>
                    <TableCell className="text-xs capitalize">{(p.payment_method ?? 'manual').replace(/_/g, ' ')}</TableCell>
                    <TableCell className="font-semibold text-white">{formatAmount(p.amount)}</TableCell>
                    {/* Legacy rows may predate the fee column — never render $NaN. */}
                    <TableCell className="text-sm text-muted-foreground">
                      {p.fee == null || Number.isNaN(Number(p.fee)) ? '—' : formatAmount(p.fee)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : p.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden font-mono text-[11px] text-muted-foreground lg:table-cell">
                      {p.transaction_id ? truncateMiddle(p.transaction_id, 18) : '—'}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{formatDateTime(p.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
