import React, { useEffect, useRef } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** Stagger delay in ms, applied via CSS custom property. */
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal wrapper: element starts translated/faded (see [data-reveal]
 * in index.css) and settles when it enters the viewport. Reduced-motion
 * users get static content — the observer short-circuits immediately.
 */
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-revealed');
      return;
    }

    el.style.setProperty('--reveal-delay', `${delay}ms`);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
};

export default Reveal;