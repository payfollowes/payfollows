'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Rocket } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { Button } from '@/components/ui/button';

export function CtaBanner() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.cta-inner', {
        y: 50,
        opacity: 0,
        scale: 0.96,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 82%' },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="py-24">
      <div className="container">
        <div className="cta-inner relative overflow-hidden rounded-3xl border border-primary-500/25 bg-primary-gradient p-12 text-center shadow-glow-lg sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-black/25 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Rocket className="h-3.5 w-3.5" /> Start growing in under 2 minutes
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl text-balance">
              Ready to scale your social presence with the fastest SMM panel?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85">
              Create your free account, deposit funds and launch your first campaign today. No subscriptions,
              no commitments.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-white/90 btn-glow"
                asChild
              >
                <Link href="/register">
                  Create Free Account <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/login">Login to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
