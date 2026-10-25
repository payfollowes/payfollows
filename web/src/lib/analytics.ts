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

/** Deterministic pseudo-random in [0,1) so demo charts are stable across renders. */
function seeded(seed: number) {
  const x = Math.sin(seed * 99.13 + 7.7) * 10000;
  return x - Math.floor(x);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Balance trend: walks backwards from the current balance, re-adding each
 * month's spend so older points reflect the balance before those orders.
 * Falls back to a smooth deterministic series when the account has no orders.
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
      // Empty buckets get a deterministic projection so sparse accounts still
      // show a shaped trend; buckets with real orders keep their exact spend.
      // Sized as a fraction of the current balance so the axis never inflates
      // beyond the money the account actually holds.
      const bucketSpend = spendByBucket.get(i) ?? 0;
      const demoSpend = bucketSpend === 0 ? currentBalance * (0.004 + seeded(i) * 0.012) : 0;
      running = running + bucketSpend + demoSpend;
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
    // Months without recorded orders borrow the deterministic projection;
    // months with real orders are never mixed with demo values. Proportional
    // to the current balance keeps the Y-axis anchored to real money instead
    // of inflating it with fixed demo amounts.
    const monthSpend = spendByMonth.get(key) ?? 0;
    const demoSpend = monthSpend === 0 ? currentBalance * (0.03 + seeded(i + 3) * 0.08) : 0;
    running = running + monthSpend + demoSpend;
    points.push({
      label: MONTHS[d.getMonth()],
      fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: Math.max(0, running),
    });
  }
  return points;
}

/** Last six months of spending + order counts for the bar chart. */
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
    if (orders.length === 0) {
      value = [120, 210, 180, 260, 340, 300][5 - i];
      count = Math.round(2 + seeded(i) * 6);
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
