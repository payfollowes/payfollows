'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ArrowDownUp, ChevronDown } from 'lucide-react';
import { SpendingBarChart } from '@/components/charts/spending-bar-chart';
import { buildMonthlySpend } from '@/lib/analytics';
import type { Order } from '@/lib/types';
import { cn } from '@/lib/utils';

export function SpendingCard({
  orders,
  formatAmount,
}: {
  orders: Order[];
  formatAmount: (n: number) => string;
}) {
  const [sortDesc, setSortDesc] = useState(false);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const base = useMemo(() => buildMonthlySpend(orders), [orders]);
  const total = useMemo(() => base.reduce((s, b) => s + b.value, 0), [base]);
  const previous = base.length > 1 ? base[base.length - 2].value : 0;
  const latest = base[base.length - 1]?.value ?? 0;
  const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

  const chartData = useMemo(() => {
    const copy = [...base];
    if (sortDesc) copy.sort((a, b) => b.value - a.value);
    return copy;
  }, [base, sortDesc]);

  const activeIndex =
    selected === undefined
      ? undefined
      : chartData.findIndex((d) => d.fullLabel === base[selected]?.fullLabel);

  return (
    <section className="pf-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-white">Monthly Spending</h3>
          <div className="mt-1.5 flex items-center gap-2.5">
            <span className="font-display text-2xl font-bold text-white tabular">{formatAmount(total)}</span>
            {orders.length > 0 && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                  change >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                )}
              >
                <ArrowUpRight className={cn('h-3 w-3', change < 0 && 'rotate-180')} />
                {Math.abs(change).toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortDesc((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:text-white"
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            {sortDesc ? 'Highest' : 'Sort'}
          </button>
          <div className="relative">
            <select
              value={selected ?? ''}
              onChange={(e) => setSelected(e.target.value === '' ? undefined : Number(e.target.value))}
              className="appearance-none rounded-full border border-white/[0.08] bg-white/[0.04] py-2 pl-3.5 pr-9 text-xs font-semibold text-muted-foreground outline-none transition-all hover:text-white focus:border-primary-500/50"
              aria-label="Filter by month"
            >
              <option value="" className="bg-ink-900">
                Month
              </option>
              {base.map((b, i) => (
                <option key={b.fullLabel} value={i} className="bg-ink-900">
                  {b.fullLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <SpendingBarChart data={chartData} formatAmount={formatAmount} activeIndex={activeIndex} height={250} />
      </div>
    </section>
  );
}
