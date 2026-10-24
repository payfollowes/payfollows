'use client';

import Link from 'next/link';
import { ArrowUpRight, Receipt } from 'lucide-react';
import type { Order } from '@/lib/types';
import { statusStyle } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

export function RecentTransactions({
  orders,
  formatAmount,
}: {
  orders: Order[];
  formatAmount: (n: number) => string;
}) {
  const recent = orders.slice(0, 6);

  return (
    <section className="pf-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-white">Recent Transactions</h3>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary-300 transition-colors hover:text-primary-200"
        >
          View All <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 space-y-2.5">
        {recent.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-8 w-8" />}
            title="No transactions yet"
            desc="Your orders and payments will appear here once you start."
            ctaHref="/dashboard/new-order"
            ctaLabel="Place first order"
          />
        ) : (
          recent.map((order) => {
            const name = order.service?.name || order.service_id;
            const style = statusStyle(order.status);
            return (
              <div
                key={order.id}
                className="flex items-center gap-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.03] px-3.5 py-3 transition-all hover:border-primary-500/30 hover:bg-white/[0.05]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/15 text-sm font-bold text-primary-300">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular text-destructive">-{formatAmount(order.charge)}</p>
                  <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.className}`}>
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
