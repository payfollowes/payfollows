import React, { useState } from 'react';
import type { User } from '../App';
import { getAvatarDataUri } from '../lib/avatar';

const Logo: React.FC = () => (
  <div className="flex items-center gap-2.5">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-[#A855F7] to-[#7E22CE] shadow-[0_0_25px_rgba(168,85,247,0.35)]">
      <span className="text-lg font-black tracking-[0.2em] text-white">PF</span>
    </div>
    <a href="/#" className="text-lg font-semibold tracking-tight text-white">PayFollows</a>
  </div>
);

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Platform', href: '#panel' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-40 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-slate-300 transition hover:text-white">
              {item.label}
            </a>
          ))}
          {currentUser ? (
            <a href="/#/dashboard" className="rounded-full border border-fuchsia-400/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
              Go to Dashboard
            </a>
          ) : (
            <a href="/#/login" className="rounded-full bg-gradient-to-r from-[#7E22CE] to-[#C026D3] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] transition hover:scale-[1.03]">
              Sign in
            </a>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-full border border-white/10 bg-white/10 p-2 text-slate-200 transition hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2z" clipRule="evenodd" />
            </svg>
          </button>
          {currentUser ? (
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-white/10 p-1.5">
                <img src={getAvatarDataUri(currentUser.username)} alt="User Avatar" className="h-9 w-9 rounded-full border border-fuchsia-400/30" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[#10081E]/95 p-2 shadow-[0_10px_50px_rgba(0,0,0,0.55)]">
                  <div className="border-b border-white/10 px-3 py-2 text-sm text-slate-400">
                    Signed in as <br />
                    <strong className="text-white">{currentUser.username}</strong>
                  </div>
                  <a href="/#/dashboard" className="block rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">Dashboard</a>
                  <button onClick={onLogout} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-white/10">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/#/register" className="hidden rounded-full bg-gradient-to-r from-[#7E22CE] to-[#C026D3] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] transition hover:scale-[1.03] sm:inline-flex">
              Register
            </a>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-3xl border border-white/10 bg-[#10081E]/90 p-4 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden">
          {navItems.map((item) => (
            <a key={item.label} onClick={() => setMobileOpen(false)} href={item.href} className="block rounded-2xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </a>
          ))}
          <div className="mt-3 border-t border-white/10 pt-3">
            {currentUser ? (
              <>
                <a onClick={() => setMobileOpen(false)} href="/#/dashboard" className="mb-2 block rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-white">
                  Go to Dashboard
                </a>
                <button onClick={() => { setMobileOpen(false); onLogout(); }} className="block w-full rounded-2xl px-4 py-2 text-left text-sm font-semibold text-rose-400 transition hover:bg-white/10">
                  Logout
                </button>
              </>
            ) : (
              <>
                <a onClick={() => setMobileOpen(false)} href="/#/login" className="mb-2 block rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-white">
                  Sign in
                </a>
                <a onClick={() => setMobileOpen(false)} href="/#/register" className="block rounded-2xl bg-gradient-to-r from-[#7E22CE] to-[#C026D3] px-4 py-2 text-center text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
