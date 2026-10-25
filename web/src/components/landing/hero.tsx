'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, UserPlus, TrendingUp, Instagram, Youtube, Star } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const TRUST_BRANDS = ['Lumina', 'PromptPilot', 'Screen', 'EverMedia', 'TaskFlow'];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 34 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay, ease: EASE },
});

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 lg:pt-44">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_70%_55%_at_50%_30%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-44 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-full bg-primary-600/22 blur-[150px]" />
      {[
        { top: '14%', left: '12%' },
        { top: '24%', left: '86%' },
        { top: '52%', left: '7%' },
        { top: '64%', left: '92%' },
        { top: '38%', left: '50%' },
      ].map((pos, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-2 w-2 rounded-full bg-primary-400 shadow-glow-sm"
          style={pos}
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.3, 0.85] }}
          transition={{ duration: 2.6 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="container relative text-center">
        <motion.div {...fadeUp(0.05)}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            Onboarding new creators this week
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.15, ease: EASE }}
          className="mx-auto mt-7 max-w-4xl font-display text-5xl font-bold leading-[1.06] tracking-tight text-balance sm:text-6xl lg:text-7xl"
        >
          <span className="block text-white">Grow faster.</span>
          <span className="block gradient-text">Convert better.</span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.35)}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          The premium SMM panel for creators, agencies and resellers. Instagram followers, TikTok views,
          YouTube subscribers — delivered at record speed with the cheapest rates online.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.48, ease: EASE }}
          className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="group inline-flex h-14 items-center gap-2 rounded-full bg-primary-gradient px-8 text-base font-bold text-white btn-glow transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/register"
            className="inline-flex h-14 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-8 text-base font-bold text-foreground backdrop-blur transition-all hover:border-primary-500/50 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <UserPlus className="h-5 w-5" /> Register Free
          </Link>
        </motion.div>

        <motion.div
          {...fadeUp(0.6)}
          className="mt-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Trusted by 10k+ creators worldwide
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-70">
            {TRUST_BRANDS.map((b) => (
              <span key={b} className="font-display text-sm font-bold tracking-wide text-muted-foreground">
                {b}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 56, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.72, ease: EASE }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div className="glow-panel rounded-[28px]">
            <div className="overflow-hidden rounded-[28px] border border-[rgba(167,139,250,0.18)] bg-ink-900/90 shadow-glow-lg backdrop-blur-2xl">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <div className="ml-3 flex-1 rounded-full bg-white/5 px-4 py-1.5 text-center text-[11px] text-muted-foreground">
                  payfollows.com/dashboard
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.07] bg-ink-850 p-5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Total Balance</p>
                      <p className="mt-1 font-display text-2xl font-bold text-white tabular">$10,120.50</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
                      <TrendingUp className="h-3.5 w-3.5" /> 2.92%
                    </span>
                  </div>
                  <div className="mt-4 flex h-28 items-end gap-1.5">
                    {[38, 52, 44, 66, 58, 78, 62, 88, 72, 96, 80, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-primary-700/50 to-brand-soft"
                        style={{ height: `${h}%`, opacity: 0.4 + i * 0.05 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary-500/25 bg-gradient-to-br from-primary-700 to-brand-bright p-5 text-left">
                  <p className="text-xs font-semibold text-white/70">My Wallet</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white tabular">$12,850.00</p>
                  <div className="mt-5 flex gap-2">
                    <span className="flex-1 rounded-xl bg-white/15 py-2 text-center text-[11px] font-bold text-white">
                      Add Funds
                    </span>
                    <span className="flex-1 rounded-xl bg-white py-2 text-center text-[11px] font-bold text-primary-700">
                      New Order
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <motion.div
            className="absolute -left-4 top-16 z-20 hidden w-44 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-card backdrop-blur-xl sm:block lg:-left-12"
            animate={{ y: [-13, 11, -13] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="font-display text-xl font-bold text-white tabular">90.35%</p>
                <p className="text-[11px] text-muted-foreground">Follower increase</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute -right-4 bottom-10 z-20 hidden w-48 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-card backdrop-blur-xl sm:block lg:-right-12"
            animate={{ y: [11, -13, 11] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-400">
                <Instagram className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="font-display text-xl font-bold text-white tabular">65.3K</p>
                <p className="text-[11px] text-success">▲ 123.56% this week</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute -top-5 right-16 z-20 hidden rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 shadow-card backdrop-blur-xl md:block"
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex items-center gap-2 text-left">
              <Youtube className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">New subscribers</p>
                <p className="font-display text-sm font-bold text-success tabular">+15,234</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary-600/25 via-primary-600/8 to-transparent blur-2xl" />

      <span className="sr-only">
        <Star /> Top rated SMM panel with 12k+ user rating
      </span>
    </section>
  );
}
