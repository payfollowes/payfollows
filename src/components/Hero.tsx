import React, { useState } from 'react';
import { authAPI } from '../lib/api';
import Reveal from './Reveal';
import { Magnetic } from './CursorFollower';

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const HEADLINE_LINES = ['Social growth', 'that pays', 'for itself.'];

/**
 * Hero — full-viewport top block split left/right on desktop: copy
 * (eyebrow, word-split headline, sub, CTAs) on the left, the login
 * panel (product UI) on the right. Stacks on mobile with centered copy.
 * Colors unchanged; motion is transform/opacity only and fully disabled
 * under reduced motion.
 */
const Hero: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      await authAPI.signIn(credentials.username, credentials.password);
      const user = await authAPI.getCurrentUser();
      if (!user) {
        setError('Signed in, but your profile could not be loaded. Please try again.');
        return;
      }
      window.location.hash = '#/dashboard/new-order';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
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

  let wordIndex = 0;

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Ambient floating glows (transform-only animation) */}
      <div className="pointer-events-none absolute -left-28 top-32 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl pf-float" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-28 top-2/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl pf-float-slow" aria-hidden="true" />

      {/* Full-height hero: left column = copy, right column = product panel */}
      <div className="container mx-auto max-w-6xl min-h-[calc(100dvh-96px)] flex flex-col justify-center py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <span
              className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1.5 rounded-full text-sm font-medium border border-purple-500/30 hero-fade-in"
              style={{ '--rise-delay': '0.9s' } as React.CSSProperties}
            >
              [social media panel]
            </span>

            <h1 className="mt-8 text-[clamp(2.5rem,4.5vw,4.25rem)] font-bold leading-[1.06] tracking-tight">
              {HEADLINE_LINES.map((line, lineIndex) => (
                <span key={line} className="hero-line">
                  {line.split(' ').map((word) => {
                    const delay = lineIndex * 160 + wordIndex * 70;
                    wordIndex += 1;
                    return (
                      <span
                        key={`${line}-${word}`}
                        className="hero-word"
                        style={{ '--word-delay': `${delay}ms` } as React.CSSProperties}
                      >
                        {word}
                        {lineIndex < HEADLINE_LINES.length - 1 ? ' ' : ''}
                      </span>
                    );
                  })}
                </span>
              ))}
            </h1>

            <p
              className="text-gray-300 max-w-xl mx-auto lg:mx-0 mt-7 text-lg hero-fade-in"
              style={{ '--rise-delay': '1.05s' } as React.CSSProperties}
            >
              PayFollows is the reseller-friendly SMM panel: 5,000+ live services across every major
              platform, priced from $0.001 per thousand and delivered in seconds.
            </p>

            <div
              className="flex flex-wrap justify-center lg:justify-start gap-4 mt-10 hero-fade-in"
              style={{ '--rise-delay': '1.2s' } as React.CSSProperties}
            >
              <Magnetic>
                <a
                  href="/#/register"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-accent to-brand-purple hover:opacity-90 transition-opacity text-white font-semibold px-8 py-4 rounded-lg shadow-purple-glow"
                >
                  Get Started
                </a>
              </Magnetic>
              <Magnetic>
                <button
                  onClick={() => scrollToSection('services')}
                  className="bg-white/10 hover:bg-white/20 transition-colors text-white font-semibold px-8 py-4 rounded-lg border border-white/10"
                >
                  Explore Services
                </button>
              </Magnetic>
            </div>
          </div>

          {/* Right: product panel — the login card */}
          <div className="w-full max-w-md mx-auto">
            <Reveal delay={1300}>
              <div className="bg-brand-container border border-brand-border rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-purple-glow-sm">
                <h2 className="text-xl font-bold text-center">Sign in to your panel</h2>
                <p className="text-gray-400 text-sm text-center mt-2">
                  Order, track and resell from one dashboard.
                </p>

                <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="relative">
                    <svg
                      className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Username"
                      value={credentials.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-black/20 border border-brand-border rounded-lg p-3 pl-10 focus:ring-2 focus:ring-brand-purple focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  <div className="relative">
                    <svg
                      className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <input
                      type="password"
                      placeholder="Password"
                      value={credentials.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-black/20 border border-brand-border rounded-lg p-3 pl-10 focus:ring-2 focus:ring-brand-purple focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isLoading}
                        className="form-checkbox bg-black/20 border-brand-border rounded text-brand-purple focus:ring-brand-purple disabled:opacity-50"
                      />
                      <span>Remember me</span>
                    </label>
                    <a href="#/forgot-password" className="hover:text-white transition-colors">
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-brand-accent to-brand-purple hover:opacity-90 transition-opacity text-white font-semibold p-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                  </button>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="h-px flex-1 bg-white/10"></span>
                    <span>or</span>
                    <span className="h-px flex-1 bg-white/10"></span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || isLoading}
                    className="w-full bg-white/10 hover:bg-white/20 transition-colors text-white font-semibold p-3 rounded-lg flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2H12z" />
                      <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1l-3.1 2.4C5 18.8 8.2 21 12 21z" />
                      <path fill="#4A90E2" d="M6.4 13c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L3.3 6.6C2.5 8 2 9.4 2 11s.5 3 1.3 4.4L6.4 13z" />
                      <path fill="#FBBC05" d="M12 4.9c1.4 0 2.7.5 3.8 1.5l2.8-2.8C16.8 1.9 14.6 1 12 1 8.2 1 5 3.2 3.3 6.6L6.4 9c.8-2.3 3-4.1 5.6-4.1z" />
                    </svg>
                    <span>{googleLoading ? 'Redirecting...' : 'Login with Google'}</span>
                  </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                  Do not have an account?{' '}
                  <a href="/#/register" className="font-semibold text-brand-light-purple hover:text-white transition-colors">
                    Sign up
                  </a>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;