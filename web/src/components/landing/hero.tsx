'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check, ChevronDown, Layers3, Link2, Wallet } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const FLOW = [
  { title: 'Choose a service', detail: 'Start with the active catalog.', state: '01' },
  { title: 'Review the charge', detail: 'See the calculated total first.', state: '02' },
  { title: 'Follow the status', detail: 'Updates come from the provider.', state: '03' },
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden pb-24 pt-36 sm:pb-28 sm:pt-40 lg:pb-36 lg:pt-44">
      <div className="landing-hero-aura pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="landing-hero-orbit pointer-events-none absolute" aria-hidden="true" />

      <div className="container relative z-10 grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: EASE }}
          className="max-w-2xl"
        >
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-white text-balance sm:text-6xl lg:text-[4.5rem]">
            Social orders,
            <span className="mt-1 block text-primary-300">in clear motion.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-foreground/75 sm:text-lg sm:leading-8">
            Browse available services, review the charge before confirming, and follow provider-reported status
            from one PayFollows dashboard.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex h-13 min-h-13 items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_12px_32px_-14px_rgba(124,58,237,0.9)] transition duration-200 hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-13 min-h-13 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.025] px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary-300/50 hover:bg-primary-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              See how it works
              <ArrowDown className="h-4 w-4 text-primary-300" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Current services, rates and terms are shown in the catalog.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28, rotateX: 3, rotateY: -3 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
          transition={{ duration: 0.95, delay: reduceMotion ? 0 : 0.12, ease: EASE }}
          className="relative mx-auto w-full max-w-[660px] [perspective:1200px]"
        >
          <div className="landing-preview-frame relative overflow-hidden rounded-[1.5rem] border border-primary-200/15 bg-[#100c19] shadow-[0_34px_100px_-42px_rgba(124,58,237,0.7)]">
            <div className="landing-preview-light" aria-hidden="true" />
            <div
              role="img"
              aria-label="Illustrative PayFollows interface preview showing service selection, charge review and order status tracking."
              className="relative"
            >
              <div className="flex items-center justify-between border-b border-white/[0.09] px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary-200">
                    <Layers3 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">PayFollows</p>
                    <p className="text-xs text-muted-foreground">Order workspace</p>
                  </div>
                </div>
                <span className="rounded-full border border-primary-300/25 bg-primary-300/[0.08] px-3 py-1 text-[11px] font-semibold text-primary-100">
                  Product preview
                </span>
              </div>

              <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
                <div className="px-5 py-6 sm:px-7 sm:py-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">NEW ORDER</p>
                      <h2 className="mt-1 font-display text-xl font-semibold text-white">Build your order</h2>
                    </div>
                    <span className="text-xs font-medium text-primary-200">Step 1 of 3</span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="landing-preview-field">
                      <span className="text-xs font-medium text-muted-foreground">Platform</span>
                      <span className="mt-2 flex items-center justify-between text-sm font-semibold text-white">
                        Choose a platform <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="landing-preview-field">
                      <span className="text-xs font-medium text-muted-foreground">Target link</span>
                      <span className="mt-2 flex items-center gap-2 text-sm text-foreground/70">
                        <Link2 className="h-4 w-4 text-primary-300" aria-hidden="true" />
                        Add a public profile or post link
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/[0.09] pt-4">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Wallet className="h-4 w-4 text-primary-300" aria-hidden="true" />
                        Charge preview
                      </span>
                      <span className="text-xs font-semibold text-white">Shown before confirmation</span>
                    </div>
                  </div>
                </div>

                <div className="landing-preview-side relative border-t border-white/[0.09] px-5 py-6 md:border-l md:border-t-0 sm:px-7 sm:py-8">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Order path</p>
                    <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_rgba(67,212,155,0.75)]" aria-hidden="true" />
                  </div>
                  <ol className="landing-preview-flow mt-6 space-y-6">
                    {FLOW.map((step, index) => (
                      <li key={step.state} className="relative flex gap-4">
                        <span className={`landing-flow-node ${index === 0 ? 'is-active' : ''}`} aria-hidden="true">
                          {index === 0 ? <Check className="h-3.5 w-3.5" /> : step.state}
                        </span>
                        <div className="pt-0.5">
                          <p className="text-sm font-semibold text-white">{step.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-7 border-t border-white/[0.09] pt-4 text-[11px] leading-relaxed text-muted-foreground">
                    Illustration only. Live catalog values appear in your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-preview-orbit" aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}
