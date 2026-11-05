'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingCart } from 'lucide-react';

export function PromoCard() {
  return (
    <section className="glow-panel relative overflow-hidden rounded-3xl p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-brand-soft" />
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#4c1d95]/40 blur-3xl" />
      <ShoppingCart className="pointer-events-none absolute -bottom-8 right-3 h-36 w-36 rotate-[-10deg] text-white/[0.08]" aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="max-w-[260px] font-display text-2xl font-bold leading-tight text-white">
          Ready for your next order?
        </h3>
        <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-white/80">
          Browse services, review the details, and check the charge before placing an order.
        </p>

        <Link
          href="/dashboard/new-order"
          className="group mt-6 inline-flex min-h-12 items-center justify-center gap-2 self-stretch rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          Create an order
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
