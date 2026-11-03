import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

export function CtaBanner() {
  return (
    <section className="landing-section landing-cta-section py-20 sm:py-24">
      <div className="container">
        <Reveal className="landing-cta-panel">
          <div className="landing-cta-trace" aria-hidden="true" />
          <div className="landing-cta-copy">
            <p className="landing-eyebrow">Your next step starts here</p>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-5xl">
              Ready to bring your orders into one clear flow?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-foreground/75">
              Create an account to browse the current catalog, review order charges and follow provider-reported status.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#4b20a8] shadow-[0_12px_34px_-16px_rgba(255,255,255,0.55)] transition hover:-translate-y-0.5 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                Create an account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Sign in
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="landing-cta-mascot-wrap" aria-hidden="true">
            <span className="landing-mascot-orbit landing-mascot-orbit-one" />
            <span className="landing-mascot-orbit landing-mascot-orbit-two" />
            <Image
              className="landing-mascot"
              src="/landing-mascot.png"
              alt=""
              width={360}
              height={313}
              draggable={false}
            />
            <span className="landing-mascot-spark landing-mascot-spark-one"><Sparkles /></span>
            <span className="landing-mascot-spark landing-mascot-spark-two"><Sparkles /></span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
