'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Services', href: '/#services' },
  { label: 'Why Us', href: '/#features' },
  { label: 'Reviews', href: '/#reviews' },
  { label: 'FAQ', href: '/#faq' },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav
        className={cn(
          'container flex h-16 items-center justify-between rounded-full px-4 transition-all duration-300 sm:px-6',
          scrolled
            ? 'border border-[rgba(167,139,250,0.18)] bg-ink-900/85 shadow-card backdrop-blur-2xl'
            : 'pf-card-inner backdrop-blur-xl'
        )}
      >
        <Logo />

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/login"
            className="rounded-full border border-white/12 px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:border-primary-500/50 hover:bg-white/[0.05]"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 rounded-full bg-primary-gradient px-5 py-2.5 text-sm font-bold text-white btn-glow transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Start Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="container mt-2 rounded-3xl border border-[rgba(167,139,250,0.18)] bg-ink-900/95 p-4 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 rounded-full border border-white/12 py-3 text-center text-sm font-bold"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex-1 rounded-full bg-primary-gradient py-3 text-center text-sm font-bold text-white"
                >
                  Start Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
