'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

const STATS = [
  { value: 128400, suffix: '+', label: 'Orders Delivered' },
  { value: 24, suffix: '/7', label: 'Automated Uptime' },
  { value: 99.4, suffix: '%', label: 'Order Success Rate', decimals: 1 },
  { value: 18, suffix: 'K+', label: 'Happy Customers' },
];

function Counter({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: value,
        duration: 2.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent =
              obj.val.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }) + suffix;
          }
        },
      });
    },
    { scope: ref }
  );

  return <span ref={ref}>0{suffix}</span>;
}

export function StatsBand() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.stat-item', {
        y: 36,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 85%' },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="py-16">
      <div className="container">
        <div className="glow-panel grid gap-5 rounded-3xl border border-[rgba(167,139,250,0.14)] bg-ink-850/85 p-10 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="stat-item text-center">
              <p className="font-display text-4xl font-bold gradient-text">
                <Counter value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
