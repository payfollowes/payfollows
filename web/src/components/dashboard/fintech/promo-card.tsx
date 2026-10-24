'use client';

import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';

const AVATARS = [
  { initials: 'AK', bg: 'from-fuchsia-500 to-purple-600' },
  { initials: 'MR', bg: 'from-indigo-500 to-violet-600' },
  { initials: 'ZS', bg: 'from-violet-500 to-fuchsia-500' },
];

export function PromoCard() {
  return (
    <section className="glow-panel relative overflow-hidden rounded-3xl p-6">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-brand-soft" />
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#4c1d95]/40 blur-3xl" />

      {/* Abstract 3D-ish coins */}
      <div className="pointer-events-none absolute -bottom-8 right-0 opacity-70" aria-hidden>
        <div className="relative h-40 w-40">
          <div className="absolute bottom-2 right-2 h-28 w-28 rotate-[24deg] rounded-full border-4 border-white/25 bg-gradient-to-br from-white/30 to-white/5 shadow-2xl" />
          <div className="absolute bottom-10 right-12 h-20 w-20 rotate-[-14deg] rounded-full border-4 border-white/30 bg-gradient-to-br from-white/40 to-white/10 shadow-xl" />
          <div className="absolute bottom-20 right-4 h-12 w-12 rotate-12 rounded-full border-[3px] border-white/40 bg-white/25 shadow-lg" />
        </div>
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <h3 className="max-w-[220px] font-display text-2xl font-bold leading-tight text-white">
          Trusted by Thousands. Grow With Us Today!
        </h3>
        <p className="mt-3 max-w-[240px] text-sm leading-relaxed text-white/80">
          Secure, reliable and trusted by creators worldwide — start scaling your socials in minutes.
        </p>

        <div className="mt-5 flex items-center">
          <div className="flex -space-x-3">
            {AVATARS.map((a) => (
              <span
                key={a.initials}
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${a.bg} text-[11px] font-bold text-white ring-2 ring-white/40`}
              >
                {a.initials}
              </span>
            ))}
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950/80 text-white ring-2 ring-white/40">
              <Plus className="h-4 w-4" />
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/new-order"
          className="group mt-auto inline-flex items-center justify-center gap-2 self-stretch rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          Start Growing
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
