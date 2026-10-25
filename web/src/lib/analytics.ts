import type { Order } from './types';

export type TrendRange = '1m' | '3m' | '6m' | '1y';

export interface TrendPoint {
  label: string;
  fullLabel: string;
  value: number;
}

export interface BarPoint {
  label: string;
  fullLabel: string;
  value: number;
  count: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Balance trend: walks backwards from the current balance, re-adding each
 * month's spend so older points reflect the balance before those orders.
 * Accounts with no orders get an honest flat line at the real balance —
 * never fabricated projection values.
 */
export function buildBalanceTrend(orders: Order[], currentBalance: number, range: TrendRange): TrendPoint[] {
  const now = new Date();
  const points: TrendPoint[] = [];

  if (range === '1m' || range === '3m') {
    const days = range === '1m' ? 30 : 91;
    const bucketSize = range === '1m' ? 1 : 7;
    const buckets = Math.ceil(days / bucketSize);
    const spendByBucket = new Map<number, number>();

    for (const o of orders) {
      const d = new Date(o.created_at);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
      if (diff < 0 || diff >= days) continue;
      const bucket = Math.floor(diff / bucketSize);
      spendByBucket.set(bucket, (spendByBucket.get(bucket) ?? 0) + (Number(o.charge) || 0));
    }

    let running = currentBalance;
    for (let i = buckets - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * bucketSize * 86_400_000);
      running = running + (spendByBucket.get(i) ?? 0);
      points.push({
        label: range === '1m' ? String(d.getDate()) : `${MONTHS[d.getMonth()]} ${d.getDate()}`,
        fullLabel: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        value: Math.max(0, running),
      });
    }
    return points;
  }

  const months = range === '6m' ? 6 : 12;
  const spendByMonth = new Map<string, number>();
  for (const o of orders) {
    const d = new Date(o.created_at);
    const diffMonths =
      (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diffMonths < 0 || diffMonths >= months) continue;
    const key = monthKey(d);
    spendByMonth.set(key, (spendByMonth.get(key) ?? 0) + (Number(o.charge) || 0));
  }

  let running = currentBalance;
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    running = running + (spendByMonth.get(key) ?? 0);
    points.push({
      label: MONTHS[d.getMonth()],
      fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: Math.max(0, running),
    });
  }
  return points;
}

/** Last six months of real spending + order counts for the bar chart. */
export function buildMonthlySpend(orders: Order[]): BarPoint[] {
  const now = new Date();
  const out: BarPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    let value = 0;
    let count = 0;
    for (const o of orders) {
      if (monthKey(new Date(o.created_at)) === key) {
        value += Number(o.charge) || 0;
        count += 1;
      }
    }
    out.push({
      label: MONTHS[d.getMonth()],
      fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: Math.round(value * 100) / 100,
      count,
    });
  }
  return out;
}

export function pctChange(series: TrendPoint[]): number {
  if (series.length < 2) return 0;
  const first = series[0].value || 1;
  const last = series[series.length - 1].value;
  return ((last - first) / first) * 100;
}
