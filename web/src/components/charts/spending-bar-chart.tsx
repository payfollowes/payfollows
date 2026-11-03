'use client';

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  LabelList,
} from 'recharts';
import type { BarPoint } from '@/lib/analytics';

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BarPoint }>;
  formatter: (n: number) => string;
}

function BarTooltip({ active, payload, formatter }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-[rgba(167,139,250,0.25)] bg-ink-900/95 px-4 py-3 shadow-card backdrop-blur-xl">
      <p className="text-[11px] font-semibold text-muted-foreground">{p.fullLabel}</p>
      <p className="mt-1 font-display text-sm font-bold text-white tabular">{formatter(p.value)}</p>
      <p className="text-[11px] text-primary-300">{p.count} orders</p>
    </div>
  );
}

export function SpendingBarChart({
  data,
  formatAmount,
  height = 240,
  activeIndex: forcedActive,
}: {
  data: BarPoint[];
  formatAmount: (n: number) => string;
  height?: number;
  activeIndex?: number;
}) {
  const maxIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const activeIndex = forcedActive ?? maxIndex;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 26, right: 8, left: 8, bottom: 0 }} barCategoryGap="28%">
        <defs>
          <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b990ff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="barIdle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2f5c" />
            <stop offset="100%" stopColor="#221a36" />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} />
        <Tooltip
          cursor={{ fill: 'rgba(167,139,250,0.06)', radius: 12 }}
          content={<BarTooltip formatter={formatAmount} />}
        />
        <Bar dataKey="value" radius={[10, 10, 10, 10]} animationDuration={800}>
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v: unknown) => {
              const n = Number(v);
              return n > 0 ? formatAmount(n).replace(/\.\d+$/, '') : '';
            }}
            style={{ fill: '#b6acc9', fontSize: 11, fontWeight: 600 }}
          />
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i === activeIndex ? 'url(#barActive)' : 'url(#barIdle)'}
              style={i === activeIndex ? { filter: '0 0 18px rgba(124,58,237,0.55)' } : undefined}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
