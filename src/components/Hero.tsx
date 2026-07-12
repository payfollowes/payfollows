import React, { useState } from 'react';
import { ArrowRight, Crown, Sparkles, ShieldCheck, PlayCircle, Lock } from 'lucide-react';
import { authAPI } from '../lib/api';
import aboutDashboardIllustration from '../assets/about-dashboard.svg';

const Hero: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const heroStats = [
    { label: 'Instant flow', value: '24/7' },
    { label: 'Orders moved', value: '140M+' },
    { label: 'Avg. response', value: '< 2m' },
  ];

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authAPI.signInWithCredentials(credentials.username, credentials.password, '#/dashboard/new-order');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await authAPI.signInWithGoogle('#/dashboard/new-order');
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <section id="hero" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-sm font-medium text-fuchsia-200">
            <Crown className="h-4 w-4" /> Provider-grade dashboard experience
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Command your growth from a premium panel.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            PayFollows blends a luxury dark-fantasy interface with real reseller workflows, instant orders, and live performance insights for digital creators and agencies.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/#/register" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7E22CE] to-[#C026D3] px-6 py-3 font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.3)] transition hover:scale-[1.03]">
              Create account <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/#/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 font-semibold text-slate-200 transition hover:bg-white/20">
              <PlayCircle className="h-4 w-4" /> View dashboard demo
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-xl">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-5 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <input type="text" placeholder="Username" value={credentials.username} onChange={(e) => handleInputChange('username', e.target.value)} disabled={isLoading} className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50" />
                  <svg xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </div>
                <div className="relative flex-1">
                  <input type="password" placeholder="Password" value={credentials.password} onChange={(e) => handleInputChange('password', e.target.value)} disabled={isLoading} className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50" />
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-2 transition hover:text-slate-200">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-white/20 bg-black/20 text-fuchsia-500 focus:ring-fuchsia-500" />
                  <span>Remember me</span>
                </label>
                <a href="#/forgot-password" className="transition hover:text-white">Forgot password?</a>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={isLoading} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7E22CE] to-[#C026D3] px-4 py-3 font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                  {isLoading ? 'Signing in...' : 'Go to login'} <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleGoogleLogin} disabled={googleLoading || isLoading} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2H12z" />
                    <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1l-3.1 2.4C5 18.8 8.2 21 12 21z" />
                    <path fill="#4A90E2" d="M6.4 13c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L3.3 6.6C2.5 8 2 9.4 2 11s.5 3 1.3 4.4L6.4 13z" />
                    <path fill="#FBBC05" d="M12 4.9c1.4 0 2.7.5 3.8 1.5l2.8-2.8C16.8 1.9 14.6 1 12 1 8.2 1 5 3.2 3.3 6.6L6.4 9c.8-2.3 3-4.1 5.6-4.1z" />
                  </svg>
                  {googleLoading ? 'Redirecting...' : 'Google Login'}
                </button>
              </div>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">Do not have an account? <a href="/#/register" className="font-semibold text-fuchsia-300 transition hover:text-white">Sign up</a></p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-fuchsia-500/30 via-violet-500/20 to-transparent blur-3xl" />
          <div className="relative rounded-[32px] border border-white/10 bg-[rgba(20,18,30,0.7)] p-3 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-xl">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Sparkles className="h-4 w-4 text-fuchsia-300" /> Live dashboard preview
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                Secure
              </div>
            </div>
            <img src={aboutDashboardIllustration} alt="PayFollows dashboard preview" className="mt-4 w-full rounded-[24px] border border-white/10 object-cover" />
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Reseller controls</p>
                  <p className="text-sm text-slate-400">Track balance, services, and orders in one view</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
