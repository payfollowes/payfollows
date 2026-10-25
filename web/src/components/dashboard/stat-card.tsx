'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const TONES = ['purple', 'blue', 'green', 'amber', 'red', 'pink'] as const;
type Tone = (typeof TONES)[number];

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: Tone;
  index?: number;
}

export function StatCard({ title, value, subtitle, icon: Icon, tone = 'purple', index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={cn('pf-stat', `pf-stat-tone-${tone}`)}
    >
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1.5 truncate font-display text-xl font-bold text-white tabular">{value}</p>
          {subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <span className={cn('pf-stat-icon', `pf-stat-icon-${tone}`)}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
        </span>
      </div>
    </motion.div>
  );
}
