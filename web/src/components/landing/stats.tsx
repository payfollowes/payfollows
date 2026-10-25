'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { Reveal } from '@/components/shared/reveal';

const STATS = [
  { value: 128400, suffix: '+', label: 'Orders Delivered' },
  { value: 24, suffix: '/7', label: 'Automated Uptime' },
  { value: 99.4, suffix: '%', label: 'Order Success Rate', decimals: 1 },
  { value: 18, suffix: 'K+', label: 'Happy Customers' },
];

/**
 * IO + synchronous scroll/resize detection. Mirrors shared/reveal.tsx:
 * framer's useInView relies on IO alone, which can miss crossings during
 * instant programmatic scrolling (tests, anchor jumps) and leaves the
 * counter stranded at zero. The safety timeout covers pre-listener scrolls.
 */
function useSafeInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const inTriggerZone = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight - 60 && rect.bottom > 60;
    };
    if (inTriggerZone()) {
      setInView(true);
      return;
    }
    const reveal = () => {
      if (!inTriggerZone()) return;
      setInView(true);
      cleanup();
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) reveal();
      },
      { rootMargin: '-60px 0px -60px 0px', threshold: 0 }
    );
    io.observe(el);
    window.addEventListener('scroll', reveal, { passive: true, capture: true });
    window.addEventListener('resize', reveal);
    const safety = window.setTimeout(reveal, 350);

    function cleanup() {
      window.clearTimeout(safety);
      io.disconnect();
      window.removeEventListener('scroll', reveal, { capture: true });
      window.removeEventListener('resize', reveal);
    }
    return cleanup;
  }, []);

  return { ref, inView };
}

function Counter({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const { ref, inView } = useSafeInView<HTMLSpanElement>();
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
