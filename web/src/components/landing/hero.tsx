'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';

const SOCIAL_PLATFORMS = [
  { id: 'Instagram', label: 'Instagram' },
  { id: 'TikTok', label: 'TikTok' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'Twitter', label: 'X' },
  { id: 'Facebook', label: 'Facebook' },
  { id: 'Telegram', label: 'Telegram' },
];

function SocialGlobe() {
  return (
    <img
      className="landing-hero-globe"
      src="/landing-social-world.svg"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const entrance = reduceMotion ? false : { opacity: 0, y: 18 };
  const reveal = { opacity: 1, y: 0 };
  const transition = { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section className="landing-hero relative isolate overflow-hidden pb-8 pt-28 sm:pt-32 lg:pt-36">
      <div className="landing-hero-aura pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container relative z-10">
        <div className="landing-hero-stage">
          <SocialGlobe />
          <div className="landing-hero-vignette" aria-hidden="true" />

          <motion.div
            initial={entrance}
            animate={reveal}
            transition={transition}
            className="landing-hero-copy"
          >
            <p className="landing-hero-kicker">
              <span className="landing-hero-kicker-dot" aria-hidden="true" />
              PayFollows social workspace
            </p>
            <h1 className="landing-hero-title text-balance">
              <span className="landing-hero-title-main">SOCIAL</span>
              <span className="landing-hero-title-accent">ORDERS</span>
            </h1>
            <p className="landing-hero-description">
              Browse social media services, review the charge before you confirm, and follow provider-reported progress
              from one clear workspace.
            </p>
            <div className="landing-hero-actions">
              <Link
                href="/register"
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_12px_36px_-14px_rgba(124,58,237,0.9)] transition duration-200 hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Explore services
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.035] px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary-300/50 hover:bg-primary-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20">
                  <ArrowDown className="h-3 w-3 text-primary-200" aria-hidden="true" />
                </span>
                How it works
              </Link>
            </div>
          </motion.div>

          <motion.aside
            initial={entrance}
            animate={reveal}
            transition={{ ...transition, delay: reduceMotion ? 0 : 0.12 }}
            className="landing-hero-float-card landing-hero-catalog"
            aria-label="Service catalog preview"
          >
            <div className="landing-hero-card-heading">
              <span className="landing-hero-card-icon"><ShieldCheck className="h-4 w-4" aria-hidden="true" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Browse</p>
                <p className="mt-1 text-sm font-semibold text-white">Service catalog</p>
              </div>
            </div>
            <div className="landing-hero-mini-list">
              {SOCIAL_PLATFORMS.slice(0, 3).map((platform) => (
                <div key={platform.id} className="landing-hero-mini-row">
                  <PlatformBrandIcon platformId={platform.id} size="sm" />
                  <span className="text-sm font-medium text-foreground/90">{platform.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </div>
              ))}
            </div>
            <p className="landing-hero-card-footnote">See the current catalog after sign in.</p>
          </motion.aside>

          <motion.aside
            initial={entrance}
            animate={reveal}
            transition={{ ...transition, delay: reduceMotion ? 0 : 0.22 }}
            className="landing-hero-float-card landing-hero-order"
            aria-label="Illustrative order preview"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Order preview</p>
                <p className="mt-1 text-sm font-semibold text-white">New order</p>
              </div>
              <span className="landing-hero-secure-mark" aria-hidden="true"><Check className="h-3.5 w-3.5" /></span>
            </div>
            <div className="landing-hero-select mt-4">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <PlatformBrandIcon platformId="Instagram" size="sm" /> Platform
              </span>
              <span className="mt-2 flex items-center justify-between text-sm font-semibold text-white">
                Choose a platform <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </span>
            </div>
            <div className="landing-hero-select mt-2.5">
              <span className="text-xs text-muted-foreground">Target link</span>
              <span className="mt-2 flex items-center gap-2 text-xs text-foreground/75">
                <Link2 className="h-3.5 w-3.5 text-primary-200" aria-hidden="true" />
                Paste a public post or profile URL
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-3">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <CircleDollarSign className="h-4 w-4 text-primary-200" aria-hidden="true" />
                Charge preview
              </span>
              <span className="text-[11px] font-semibold text-primary-100">Before confirmation</span>
            </div>
          </motion.aside>

          <div className="landing-hero-platform-rail" aria-label="Social platform categories">
            <p className="landing-hero-platform-caption">Social platform categories</p>
            <ul className="landing-hero-platform-list">
              {SOCIAL_PLATFORMS.map((platform) => (
                <li key={platform.id}>
                  <span className="landing-hero-platform-item" role="img" aria-label={platform.label} title={platform.label}>
                    <PlatformBrandIcon platformId={platform.id} size="sm" className="landing-hero-platform-icon" />
                    <span>{platform.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="landing-hero-disclaimer">Illustrative product preview. Availability and pricing are shown in the live catalog.</p>
        </div>
      </div>
    </section>
  );
}
