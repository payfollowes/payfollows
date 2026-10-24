'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/lib/analytics';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
  formatter: (n: number) => string;
}

function ChartTooltip({ active, payload, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-2xl border border-[rgba(167,139,250,0.25)] bg-ink-900/95 px-4 py-3 shadow-card backdrop-blur-xl">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        {point.fullLabel}
        <span className="text-primary-300">↗</span>
      </p>
      <p className="mt-1 font-display text-base font-bold text-white tabular">{formatter(point.value)}</p>
    </div>
  );
}

export function BalanceAreaChart({
  data,
  formatAmount,
  height = 300,
}: {
  data: TrendPoint[];
  formatAmount: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9f67ff" stopOpacity={0.55} />
            <stop offset="55%" stopColor="#7c3aed" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="balanceStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b990ff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="rgba(167,139,250,0.08)" vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          dy={10}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={58}
          ticks={ticks}
          tickFormatter={(v: number) => formatAmount(v).replace(/\.\d+$/, '')}
        />
        <Tooltip
          content={<ChartTooltip formatter={formatAmount} />}
          cursor={{ stroke: 'rgba(167,139,250,0.35)', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="url(#balanceStroke)"
          strokeWidth={2.5}
          fill="url(#balanceFill)"
          dot={false}
          activeDot={{
            r: 6,
            fill: '#fff',
            stroke: '#7c3aed',
            strokeWidth: 3,
            style: { filter: '0 0 12px rgba(124,58,237,0.8)' },
          }}
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
