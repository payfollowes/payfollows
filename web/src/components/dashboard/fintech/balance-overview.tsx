'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { BalanceAreaChart } from '@/components/charts/balance-area-chart';
import { buildBalanceTrend, pctChange, type TrendRange } from '@/lib/analytics';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';

const RANGES: { id: TrendRange; label: string }[] = [
  { id: '1y', label: '1 year' },
  { id: '6m', label: '6 month' },
  { id: '3m', label: '3 month' },
  { id: '1m', label: '1 month' },
];

export function BalanceOverview({
  orders,
  balance,
  formatAmount,
}: {
  orders: Order[];
  balance: number;
  formatAmount: (n: number) => string;
}) {
  const [range, setRange] = useState<TrendRange>('6m');

  const series = useMemo(() => buildBalanceTrend(orders, balance, range), [orders, balance, range]);
  const change = useMemo(() => pctChange(series), [series]);
  const annualAverage = useMemo(
    () => series.reduce((sum, p) => sum + p.value, 0) / Math.max(series.length, 1),
    [series]
  );

  return (
    <section className="pf-card glow-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Total Balance</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-bold text-white tabular sm:text-4xl">
              {formatAmount(balance)}
            </h2>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                change >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
              )}
            >
              {change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5 rotate-180" />}
              {Math.abs(change).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                range === r.id
                  ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'text-muted-foreground hover:text-white'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <BalanceAreaChart data={series} formatAmount={formatAmount} height={290} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <p className="text-xs text-muted-foreground">
          Average balance across range
          <span className="ml-2 font-display text-sm font-bold text-white tabular">
            {formatAmount(annualAverage)}
          </span>
        </p>
        <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" /> Actual balance
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-400 shadow-glow-xs" /> Trend projection
          </span>
        </div>
      </div>
    </section>
  );
}
