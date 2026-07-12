import React from 'react';
import { ArrowRight } from 'lucide-react';

const Cta: React.FC = () => {
  return (
    <section id="register" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-[rgba(20,18,30,0.65)] px-8 py-12 text-center shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">Ready to launch</p>
        <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Create your account and step into the premium panel.</h2>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">
          Start managing services, balances, and support in a clearer and more premium workflow than the average reseller experience.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/#/register" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7E22CE] to-[#C026D3] px-6 py-3 font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] transition hover:scale-[1.03]">
            Register now <ArrowRight className="h-4 w-4" />
          </a>
          <a href="/#/login" className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-6 py-3 font-semibold text-slate-200 transition hover:bg-white/20">
            Sign in
          </a>
        </div>
      </div>
    </section>
  );
};

export default Cta;
