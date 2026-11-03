'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Progressive-enhancement scroll reveal.
 *
 * The hidden state is applied ONLY after hydration via the data-reveal
 * attribute, so SSR markup and no-JS clients always render fully visible
 * content (no stuck opacity-0 sections). An IntersectionObserver flips
 * data-reveal-visible when the element enters the viewport. Elements already
 * on screen at mount are marked visible immediately and never flash hidden.
 *
 * Animation lives in globals.css ([data-reveal] rules), including a
 * prefers-reduced-motion escape hatch.
 */
function useInViewReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Element is considered revealed once its top enters the lower 88%
    // of the viewport (mirrors the old -12% IO root margin).
    const inTriggerZone = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.88 && rect.bottom > 0;
    };

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    if (inTriggerZone()) {
      setVisible(true);
      return;
    }
    setArmed(true);

    const reveal = () => {
      if (!inTriggerZone()) return;
      setVisible(true);
      cleanup();
    };
    // Synchronous on scroll (rect reads for a few dozen elements are cheap).
    // rAF is deliberately avoided: headless browsers can defer animation
    // frames during script-driven scrolling, which stranded elements at
    // opacity 0. IO covers real-world scrolling independently.
    const onScroll = () => reveal();
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) reveal();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 }
    );
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    // Safety net for scrolls that happened before listeners attached.
    const safety = window.setTimeout(reveal, 350);

    function cleanup() {
      window.clearTimeout(safety);
      io.disconnect();
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    }
    return cleanup;
  }, []);

  return {
    ref,
    attrs: {
      'data-reveal': armed ? '' : undefined,
      'data-reveal-visible': visible ? '' : undefined,
    },
  };
}

const revealStyle = (y: number, delayMs: number): CSSProperties =>
  ({
    '--reveal-y': `${y}px`,
    '--reveal-delay': `${delayMs}ms`,
  }) as CSSProperties;

export function Reveal({
  children,
  delayMs = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  y?: number;
  className?: string;
}) {
  const { ref, attrs } = useInViewReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={revealStyle(y, delayMs)} {...attrs}>
      {children}
    </div>
  );
}

/** Plain layout wrapper — staggering is handled per StaggerItem. */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

const STAGGER_STEP_MS = 90;

export function StaggerItem({
  children,
  index,
  y = 26,
  className,
}: {
  children: ReactNode;
  index: number;
  y?: number;
  className?: string;
}) {
  const { ref, attrs } = useInViewReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={revealStyle(y, index * STAGGER_STEP_MS)} {...attrs}>
      {children}
    </div>
  );
}
