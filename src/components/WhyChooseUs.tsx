
import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const WhyChooseUs: React.FC = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">Why PayFollows</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Crafted for serious growth, not noise.</h2>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            Every experience is tuned for clarity and speed, from quick order placement to a cleaner support loop. The result feels more like a premium ops layer than a generic panel.
          </p>
          <div className="mt-8 space-y-3">
            {['Built for agencies, creators, and resellers', 'Flexible service selection with polished delivery controls', 'Low-friction onboarding and a secure balance experience'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-fuchsia-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <a href="/#/register" className="mt-8 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-3 font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20">
            Join the panel <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <h3 className="text-xl font-semibold text-white">Quality-first service</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">Carefully organized flows and consistent handling keep service quality high at each step.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <h3 className="text-xl font-semibold text-white">Always-on support</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">The support experience stays active across tickets, chats and guided next steps.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
