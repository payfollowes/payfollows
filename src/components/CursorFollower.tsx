import React, { useEffect, useRef } from 'react';

const supportsFinePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * CursorFollower — a ring that trails the pointer with lerp, growing over
 * interactive elements. transform/opacity only, rAF-driven, and entirely
 * absent on touch devices or under reduced motion.
 */
const CursorFollower: React.FC = () => {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!supportsFinePointer()) return;

    const el = elRef.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      const interactive = (event.target as Element | null)?.closest(
        'a, button, input, select, textarea, [role="tab"], [data-cursor-active]'
      );
      el.classList.toggle('is-active', !!interactive);
    };

    const loop = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={elRef} className="pf-cursor" aria-hidden="true" />;
};

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Magnetic — pulls the wrapped element toward the cursor (translate only).
 * Desktop fine pointers and no-reduced-motion only.
 */
const Magnetic: React.FC<MagneticProps> = ({ children, className = '', strength = 0.3 }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!supportsFinePointer()) return;

    const el = ref.current;
    if (!el) return;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    };

    const onLeave = () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);

  return (
    <div ref={ref} data-magnetic className={className}>
      {children}
    </div>
  );
};

export default CursorFollower;
export { Magnetic };