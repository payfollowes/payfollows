import React from 'react';

const Logo: React.FC = () => (
  <div className="flex items-center gap-2.5">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-[#A855F7] to-[#7E22CE] shadow-[0_0_25px_rgba(168,85,247,0.35)]">
      <span className="text-sm font-black tracking-[0.24em] text-white">PF</span>
    </div>
    <span className="text-lg font-semibold tracking-tight text-white">PayFollows</span>
  </div>
);

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-black/20 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 text-sm leading-7 text-slate-400">Emam Media LTD</p>
          <p className="text-sm leading-7 text-slate-400">Address: 20-22 Wenlock Road, London, England, N1 7GU</p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Quick links</h4>
          <div className="flex flex-col gap-3 text-sm text-slate-400">
            <a href="/#/register" className="transition hover:text-white">Sign up</a>
            <a href="#" className="transition hover:text-white">Terms</a>
            <a href="#benefits" className="transition hover:text-white">How it works</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Trusted for</h4>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2">Reseller operations</span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2">Secure deposits</span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2">24/7 support</span>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-center text-sm text-slate-500">
        <p>Copyright © 2025 PayFollows. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
