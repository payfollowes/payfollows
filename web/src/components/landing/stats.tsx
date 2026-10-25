'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';
import { Reveal } from '@/components/shared/reveal';

const STATS = [
  { value: 128400, suffix: '+', label: 'Orders Delivered' },
  { value: 24, suffix: '/7', label: 'Automated Uptime' },
  { value: 99.4, suffix: '%', label: 'Order Success Rate', decimals: 1 },
  { value: 18, suffix: 'K+', label: 'Happy Customers' },
];

function Counter({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular">
      {display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

export function StatsBand() {
  return (
    <section className="py-16">
      <div className="container">
        <Reveal>
          <div className="glow-panel grid gap-8 rounded-3xl border border-[rgba(167,139,250,0.14)] bg-ink-850/85 p-10 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-4xl font-bold gradient-text">
                  <Counter value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
