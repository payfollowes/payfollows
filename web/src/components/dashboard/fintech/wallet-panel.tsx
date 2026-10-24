'use client';

import Link from 'next/link';
import { ArrowDownToLine, ArrowUpRight, Plus, Wallet } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo';

export function WalletPanel({
  balance,
  formatAmount,
}: {
  balance: number;
  formatAmount: (n: number) => string;
}) {
  return (
    <section className="glow-panel relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-brand-bright p-5 sm:p-6">
      <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#4c1d95]/50 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-white">My Wallet</h3>
          <Link
            href="/dashboard/add-funds"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur transition-all hover:bg-white/25"
          >
            <Plus className="h-3.5 w-3.5" /> Add new
          </Link>
        </div>

        {/* Layered cards */}
        <div className="relative mt-6 h-[224px]">
          {/* Back card */}
          <div className="absolute left-4 right-4 top-0 h-24 rotate-[-4deg] rounded-2xl border border-white/15 bg-ink-950/45 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">PayFollows</span>
              <span className="text-xs font-bold text-white/50">{formatAmount(balance * 0.48)}</span>
            </div>
          </div>
          {/* Middle card */}
          <div className="absolute left-2 right-2 top-7 h-24 rotate-[2.5deg] rounded-2xl border border-white/20 bg-ink-950/60 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Savings</span>
              <span className="text-xs font-bold text-white/60">{formatAmount(balance * 0.72)}</span>
            </div>
          </div>

          {/* Front dominant card */}
          <div className="absolute inset-x-0 top-14 rounded-3xl border border-white/20 bg-ink-950/85 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <LogoMark className="h-9 w-9 rounded-xl" />
              {/* Chip */}
              <div className="h-9 w-12 rounded-lg border border-white/25 bg-gradient-to-br from-[#e7c98f] to-[#b98a4e] shadow-inner">
                <div className="m-auto mt-3 h-px w-8 bg-white/50" />
                <div className="m-auto mt-1.5 h-px w-8 bg-white/30" />
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold text-white/60">Balance</p>
                <p className="mt-1 font-display text-3xl font-bold text-white tabular">
                  {formatAmount(balance)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-1 text-xs font-bold text-success">
                <ArrowUpRight className="h-3.5 w-3.5" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/add-funds"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink-950/55 text-sm font-bold text-white backdrop-blur transition-all hover:bg-ink-950/75 active:scale-[0.98]"
          >
            <ArrowDownToLine className="h-4 w-4" /> Add Funds
          </Link>
          <Link
            href="/dashboard/new-order"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-primary-700 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wallet className="h-4 w-4" /> New Order
          </Link>
        </div>
      </div>
    </section>
  );
}
