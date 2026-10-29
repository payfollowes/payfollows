import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

export function CtaBanner() {
  return (
    <section className="landing-section py-20 sm:py-24">
      <div className="container">
        <Reveal className="landing-cta-panel">
          <div className="landing-cta-trace" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-5xl">
              Ready to bring your orders into one clear flow?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-foreground/70">
              Create an account to browse the current catalog, review order charges and follow provider-reported status.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Create an account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary-300/50 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                Sign in
                <ArrowUpRight className="h-4 w-4 text-primary-300" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
