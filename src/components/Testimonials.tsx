
import React from 'react';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import { getAvatarDataUri } from '../lib/avatar';

const testimonials = [
  { name: 'Melissa Smith', metric: '321,514 followers' },
  { name: 'Michael John', metric: '50M subscribers' },
  { name: 'Isabella', metric: '132,512 listeners' },
];

const Testimonials: React.FC = () => {
  return (
    <section id="reviews" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fuchsia-200">Trusted by creators</p>
              <p className="text-sm text-slate-400">Real growth stories at scale</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                <div className="flex items-center gap-4">
                  <img src={getAvatarDataUri(testimonial.name)} alt={testimonial.name} className="h-14 w-14 rounded-full border border-fuchsia-400/30" />
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-400">{testimonial.metric}</p>
                  </div>
                </div>
                <div className="rounded-full bg-fuchsia-500/10 p-2 text-fuchsia-200">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">Social proof</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">The premium layer behind every fast-moving campaign.</h2>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            PayFollows brings a high-end experience to everyday operations. From order placement to support and balance management, it feels like a polished growth OS for modern digital brands.
          </p>
          <div className="mt-8 rounded-[24px] border border-white/10 bg-black/25 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Community impact</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black text-white">99.8%</span>
              <span className="pb-1 text-sm text-slate-400">delivery confidence</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
