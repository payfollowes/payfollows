import React from 'react';
import { ArrowRight, Compass, TrendingUp, ShieldCheck } from 'lucide-react';
import aboutDashboardIllustration from '../assets/about-dashboard.svg';

const About: React.FC = () => {
  return (
    <section id="panel" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">About the platform</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">A premium reseller control center built for speed and trust.</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fuchsia-200">Global operations</p>
                <p className="text-sm text-slate-400">Built for agencies, creators, and resellers</p>
              </div>
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              PayFollows gives you a polished command center to manage services, balance, payments, and growth metrics. Every layer is designed to feel premium while staying practical for daily operations.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Fast access to top social service categories',
                'Protected wallet and payment history flow',
                'Clean dashboards for placement, delivery and support',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-300">
                  <ShieldCheck className="h-5 w-5 text-fuchsia-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <a href="/#/register" className="mt-8 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-3 font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20">
              Explore the panel <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative rounded-[28px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-4 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="absolute left-6 top-6 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-sm font-medium text-fuchsia-200">
              Live dashboard
            </div>
            <img src={aboutDashboardIllustration} alt="PayFollows dashboard preview" className="mt-12 w-full rounded-[24px] border border-white/10 object-cover" />
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <TrendingUp className="h-5 w-5 text-fuchsia-300" /> Growth overview
              </div>
              <div className="text-sm font-semibold text-white">+24% momentum</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
