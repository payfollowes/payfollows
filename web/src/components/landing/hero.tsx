'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, UserPlus, TrendingUp, Instagram, Youtube, Star } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';

const TRUST_BRANDS = ['Lumina', 'PromptPilot', 'Screen', 'EverMedia', 'TaskFlow'];

export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero-badge', { y: 26, opacity: 0, duration: 0.7 })
          .from('.hero-line', { y: 44, opacity: 0, duration: 0.85, stagger: 0.12 }, '-=0.35')
          .from('.hero-sub', { y: 22, opacity: 0, duration: 0.6 }, '-=0.45')
          .from('.hero-cta', { y: 22, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.35')
          .from('.hero-trust', { y: 18, opacity: 0, duration: 0.55 }, '-=0.3')
          .from('.hero-mockup', { y: 56, opacity: 0, scale: 0.95, duration: 1 }, '-=0.85')
          .from('.float-card', { y: 28, opacity: 0, scale: 0.9, duration: 0.7, stagger: 0.14 }, '-=0.6');

        gsap.utils.toArray<HTMLElement>('.float-card').forEach((card, i) => {
          gsap.to(card, {
            y: i % 2 === 0 ? -13 : 11,
            duration: 3.4 + i * 0.45,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });

        gsap.utils.toArray<HTMLElement>('.hero-particle').forEach((p, i) => {
          gsap.fromTo(
            p,
            { opacity: 0.2, scale: 0.8 },
            { opacity: 1, scale: 1.3, duration: 2.4 + i * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' }
          );
        });
      }, root);
      return () => ctx.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden pb-20 pt-36 lg:pt-44">
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
        <span
          key={i}
          className="hero-particle pointer-events-none absolute h-2 w-2 rounded-full bg-primary-400 shadow-glow-sm"
          style={pos}
        />
      ))}

      <div className="container relative text-center">
        {/* Badge */}
        <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300">
          <Sparkles className="h-3.5 w-3.5" />
          Onboarding new creators this week
        </div>

        {/* Headline */}
        <h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl font-bold leading-[1.06] tracking-tight text-balance sm:text-6xl lg:text-7xl">
          <span className="hero-line block text-white">Grow faster.</span>
          <span className="hero-line block gradient-text">Convert better.</span>
        </h1>

        <p className="hero-sub mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          The premium SMM panel for creators, agencies and resellers. Instagram followers, TikTok views,
          YouTube subscribers — delivered at record speed with the cheapest rates online.
        </p>

        {/* CTAs */}
        <div className="hero-cta mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
        </div>

        {/* Trust row */}
        <div className="hero-trust mt-10">
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
        </div>

        {/* Dashboard preview */}
        <div className="hero-mockup relative mx-auto mt-16 max-w-4xl">
          <div className="glow-panel rounded-[28px]">
            <div className="overflow-hidden rounded-[28px] border border-[rgba(167,139,250,0.18)] bg-ink-900/90 shadow-glow-lg backdrop-blur-2xl">
              {/* browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <div className="ml-3 flex-1 rounded-full bg-white/5 px-4 py-1.5 text-center text-[11px] text-muted-foreground">
                  payfollows.com/dashboard
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-3">
                {/* Mini balance chart */}
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

                {/* Mini wallet */}
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
          <div className="float-card absolute -left-4 top-16 z-20 hidden w-44 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-card backdrop-blur-xl sm:block lg:-left-12">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="font-display text-xl font-bold text-white tabular">90.35%</p>
                <p className="text-[11px] text-muted-foreground">Follower increase</p>
              </div>
            </div>
          </div>

          <div className="float-card absolute -right-4 bottom-10 z-20 hidden w-48 rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-card backdrop-blur-xl sm:block lg:-right-12">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-400">
                <Instagram className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="font-display text-xl font-bold text-white tabular">65.3K</p>
                <p className="text-[11px] text-success">▲ 123.56% this week</p>
              </div>
            </div>
          </div>

          <div className="float-card absolute -top-5 right-16 z-20 hidden rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 shadow-card backdrop-blur-xl md:block">
            <div className="flex items-center gap-2 text-left">
              <Youtube className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">New subscribers</p>
                <p className="font-display text-sm font-bold text-success tabular">+15,234</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ambient glow band */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary-600/25 via-primary-600/8 to-transparent blur-2xl" />

      {/* Hidden rating anchor for accessibility */}
      <span className="sr-only">
        <Star /> Top rated SMM panel with 12k+ user rating
      </span>
    </section>
  );
}
