'use client';

import Link from 'next/link';
import { ArrowRight, Rocket } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';
import { LogoMark } from '@/components/shared/logo';

export function CtaBanner() {
  return (
    <section className="py-20 lg:py-24">
      <div className="container">
        <Reveal>
          <div className="glow-panel relative overflow-hidden rounded-[32px] border border-[rgba(167,139,250,0.18)] bg-ink-900 px-6 py-20 text-center sm:px-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary-600/35 blur-[130px]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary-600/20 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]" />

            <div className="relative">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
                <LogoMark className="h-14 w-14 rounded-2xl" />
              </span>

              <h2 className="mx-auto mt-8 max-w-2xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl text-balance">
                Ready to launch growth that actually works?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Create your free account, deposit funds and launch your first campaign in under two minutes.
                No subscriptions, no commitments.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-14 items-center gap-2 rounded-full bg-primary-gradient px-8 text-base font-bold text-white btn-glow transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Rocket className="h-5 w-5" />
                  Get Started Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center rounded-full border border-white/12 bg-white/[0.04] px-8 text-base font-bold text-foreground backdrop-blur transition-all hover:border-primary-500/50 hover:bg-white/[0.08] active:scale-[0.98]"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
