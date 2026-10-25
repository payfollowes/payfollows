'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Activity, Landmark, Receipt } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { financialAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { PlatformEarning, PlatformSummaryRow } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

export default function AdminFinancialPage() {
  const { formatAmount } = useCurrency();
  const [summary, setSummary] = useState<PlatformSummaryRow[]>([]);
  const [earnings, setEarnings] = useState<PlatformEarning[]>([]);
  const [payouts, setPayouts] = useState<Record<string, unknown>[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      financialAPI.summary(30).catch(() => []),
      financialAPI.earnings(25).catch(() => []),
      financialAPI.payouts(25).catch(() => []),
      financialAPI.paymentLogs(25).catch(() => []),
    ]).then(([s, e, p, l]) => {
      setSummary(s);
      setEarnings(e);
      setPayouts(p);
      setLogs(l);
      setLoading(false);
    });
  }, []);

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, row) => ({
        charges: acc.charges + Number(row.total_customer_charges || 0),
        costs: acc.costs + Number(row.total_provider_costs || 0),
        gross: acc.gross + Number(row.gross_profit || 0),
        net: acc.net + Number(row.net_profit || 0),
        orders: acc.orders + Number(row.total_orders || 0),
        successful: acc.successful + Number(row.successful_orders || 0),
      }),
      { charges: 0, costs: 0, gross: 0, net: 0, orders: 0, successful: 0 }
    );
  }, [summary]);

  const maxCharges = useMemo(
    () => Math.max(1, ...summary.map((r) => Number(r.total_customer_charges || 0))),
    [summary]
  );

  const successRate = totals.orders ? Math.round((totals.successful / totals.orders) * 100) : 0;

  return (
    <DashboardShell variant="admin" title="Financial Overview">
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Customer charges (30d)"
            value={formatAmount(totals.charges)}
            icon={DollarSign}
          />
          <StatCard
            title="Provider costs"
            value={formatAmount(totals.costs)}
            icon={Landmark}
            tone="red"
          />
          <StatCard
            title="Gross profit"
            value={formatAmount(totals.gross)}
            icon={TrendingUp}
            tone="green"
          />
          <StatCard
            title="Net profit / success"
            value={`${formatAmount(totals.net)} · ${successRate}%`}
            icon={Activity}
            tone="blue"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary-400" /> Daily revenue — last 30 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40" />
          ) : summary.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No summarized data yet. Daily summaries populate as orders complete.
            </p>
          ) : (
            <div className="flex h-44 items-end gap-1.5">
              {summary.map((row) => {
                const value = Number(row.total_customer_charges || 0);
                const profit = Number(row.net_profit || 0);
                return (
                  <div
                    key={row.date}
                    // h-full is required: the parent's items-end prevents
                    // flex stretch, so without a definite height the bar's
                    // percentage height resolves against auto → 0px.
                    className="group relative flex h-full flex-1 flex-col justify-end"
                    title={`${row.date}: ${formatAmount(value)} charges, ${formatAmount(profit)} net`}
                  >
                    <div
                      className={cn(
                        'w-full rounded-t-md transition-all',
                        profit >= 0 ? 'bg-primary-500/70 group-hover:bg-primary-400' : 'bg-red-500/60'
                      )}
                      style={{ height: `${Math.max(4, (value / maxCharges) * 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent platform earnings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <Skeleton className="m-5 h-32" />
            ) : earnings.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No earnings records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(e.order_date)}
                      </TableCell>
                      <TableCell className="font-semibold text-white">{formatAmount(e.customer_charge)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatAmount(e.provider_cost)}</TableCell>
                      <TableCell className="font-semibold text-emerald-400">
                        {formatAmount(e.platform_profit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {e.status}
                        </Badge>
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-5 w-5 text-primary-400" /> Provider payouts & payment logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-0">
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payouts ({payouts.length})
              </p>
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payouts recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {payouts.slice(0, 6).map((p) => (
                    <li
                      key={String(p.id)}
                      className="flex items-center justify-between rounded-xl pf-card-inner px-4 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {String(p.payout_method || 'payout')} · {formatDateTime(String(p.created_at))}
                      </span>
                      <span className="font-semibold text-white">{formatAmount(Number(p.total_amount || 0))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 pt-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment events ({logs.length})
              </p>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment events yet.</p>
              ) : (
                <ul className="space-y-2">
                  {logs.slice(0, 6).map((l) => (
                    <li
                      key={String(l.id)}
                      className="flex items-center justify-between rounded-xl pf-card-inner px-4 py-2.5 text-sm"
                    >
                      <span className="capitalize text-muted-foreground">{String(l.action || 'event')}</span>
                      <span className="text-xs text-muted-foreground/70">{formatDateTime(String(l.created_at))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
