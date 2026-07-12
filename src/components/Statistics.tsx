import React from 'react';
import { DollarSign, Activity, Zap } from 'lucide-react';

const stats = [
  { label: 'Prices from', value: '$0.001 / 1k', icon: DollarSign },
  { label: 'Orders delivered', value: '140,655,487', icon: Activity },
  { label: 'Order cadence', value: '0.14 sec', icon: Zap },
];

const Statistics: React.FC = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">Performance</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Speed, scale, and momentum that keeps up with demand.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="rounded-[24px] border border-white/10 bg-black/25 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-sm uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
