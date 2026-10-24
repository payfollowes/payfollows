'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Star, ArrowRight, UserPlus, TrendingUp, Youtube, Instagram } from 'lucide-react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { Button } from '@/components/ui/button';

export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero-badge', { y: 28, opacity: 0, duration: 0.7 })
          .from('.hero-line', { y: 46, opacity: 0, duration: 0.85, stagger: 0.12 }, '-=0.35')
          .from('.hero-sub', { y: 24, opacity: 0, duration: 0.6 }, '-=0.45')
          .from('.hero-cta', { y: 24, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.35')
          .from('.hero-rating', { y: 20, opacity: 0, duration: 0.55 }, '-=0.3')
          .from('.hero-mockup', { y: 60, opacity: 0, scale: 0.94, duration: 1 }, '-=0.9')
          .from('.float-card', { y: 30, opacity: 0, scale: 0.9, duration: 0.7, stagger: 0.14 }, '-=0.6');

        // Continuous floating animation for the glass stat cards
        gsap.utils.toArray<HTMLElement>('.float-card').forEach((card, i) => {
          gsap.to(card, {
            y: i % 2 === 0 ? -14 : 12,
            duration: 3.4 + i * 0.45,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });

        // Ambient particles
        gsap.fromTo(
          '.hero-particle',
          { opacity: 0.2, scale: 0.8 },
          {
            opacity: 1,
            scale: 1.25,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: 0.35,
          }
        );

        // Scroll parallax
        gsap.to('.hero-copy', {
          y: -60,
          opacity: 0.25,
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to('.hero-visual', {
          y: 90,
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      }, root);

      return () => ctx.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden pt-36 pb-24 lg:pt-44 lg:pb-32">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-primary-600/20 blur-[140px]" />
      {[
        { top: '12%', left: '14%' },
        { top: '22%', left: '82%' },
        { top: '58%', left: '8%' },
        { top: '70%', left: '90%' },
        { top: '40%', left: '48%' },
      ].map((pos, i) => (
        <span
          key={i}
          className="hero-particle pointer-events-none absolute h-2 w-2 rounded-full bg-primary-400 shadow-glow-sm"
          style={pos}
        />
      ))}

      <div className="container relative grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div className="hero-copy text-center lg:text-left">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            #1 SMM Panel in the Whole World!
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.12] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <span className="hero-line block">Fastest</span>
            <span className="hero-line block">
              <span className="mx-3 inline-flex translate-y-1 items-center rounded-2xl bg-primary-gradient p-2.5 shadow-glow">
                <Zap className="h-7 w-7 fill-white text-white" />
              </span>
              Cheapest
            </span>
            <span className="hero-line block">
              Social Media <span className="gradient-text">Marketing</span>
            </span>
          </h1>

          <p className="hero-sub mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0">
            Grow every social account with real, high-retention engagement. Instagram followers, TikTok
            views, YouTube subscribers — delivered at record speed with the cheapest rates online.
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center">
            <div className="hero-cta">
              <Button size="lg" asChild>
                <Link href="/register">
                  Explore Services <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="hero-cta">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  <UserPlus /> Register for Free
                </Link>
              </Button>
            </div>
          </div>

          <div className="hero-rating mt-9 flex items-center justify-center gap-3 lg:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00b67a]/15 text-[#00b67a]">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Trustpilot</p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1.5 text-xs text-muted-foreground">12k+ User Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="hero-visual relative mx-auto w-full max-w-md lg:max-w-none">
          <HeroMockup />

          {/* Floating stat cards */}
          <div className="float-card absolute -left-4 bottom-10 z-20 w-44 rounded-2xl glass-strong p-4 shadow-card sm:-left-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-bold text-white">90.35%</p>
                <p className="text-[11px] text-muted-foreground">Follower Increase</p>
              </div>
            </div>
          </div>

          <div className="float-card absolute -right-3 top-8 z-20 w-48 rounded-2xl glass-strong p-4 shadow-card sm:-right-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-400">
                <Instagram className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-bold text-white">65.3K</p>
                <p className="text-[11px] text-emerald-400">▲ 123.56% Last 7 Days</p>
              </div>
            </div>
          </div>

          <div className="float-card absolute -top-5 left-10 z-20 rounded-2xl glass-strong px-4 py-3 shadow-card">
            <p className="text-xs text-muted-foreground">New Followers</p>
            <p className="font-display text-lg font-bold text-emerald-400">+15,234</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="hero-mockup relative rounded-3xl border border-white/10 bg-[#0e1222]/80 p-5 shadow-card backdrop-blur-xl">
      {/* Browser chrome */}
      <div className="mb-5 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <div className="ml-3 flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-center text-[11px] text-muted-foreground">
          payfollows.com/dashboard
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center">
        <div className="mx-auto relative h-24 w-24">
          <div className="h-24 w-24 rounded-full bg-primary-gradient p-[3px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#161b30] font-display text-3xl font-bold text-white">
              S
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-white">
            <Instagram className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 font-display text-lg font-bold text-white">Stephanie</p>
        <p className="text-xs text-muted-foreground">Influencer · Lifestyle</p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-glow-sm">
          Follow <span className="rounded-md bg-white/20 px-1.5 text-xs">+</span>
        </button>
      </div>

      {/* Chart card */}
      <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold text-white">YouTube</span>
          </div>
          <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
            LIVE
          </span>
        </div>
        <div className="flex h-24 items-end gap-2">
          {[42, 58, 38, 70, 52, 82, 64, 95, 74, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary-700/60 to-primary-400"
              style={{ height: `${h}%`, opacity: 0.45 + i * 0.055 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
