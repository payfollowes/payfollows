'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Clock, Headphones, Wallet, RefreshCw } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast Delivery',
    desc: 'Orders start within seconds. Most campaigns complete in minutes, not days — even at huge volumes.',
  },
  {
    icon: Wallet,
    title: 'Cheapest Rates Online',
    desc: 'Direct provider access with dynamic margins means you always pay the lowest price per 1000.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe & Secure',
    desc: 'Encrypted payments, RLS-protected data and no password requests. Your accounts stay completely safe.',
  },
  {
    icon: RefreshCw,
    title: 'Auto Refill Guarantee',
    desc: 'Drops covered automatically. Every eligible service includes lifetime or 30-day refill protection.',
  },
  {
    icon: Clock,
    title: '24/7 Automated System',
    desc: 'The panel never sleeps — order tracking, refills and syncs run around the clock without manual work.',
  },
  {
    icon: Headphones,
    title: 'Human Support',
    desc: 'Real support agents answer tickets fast, plus a live chat widget for urgent questions.',
  },
];

export function Features() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.feature-card', {
        y: 48,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.feature-grid', start: 'top 82%' },
      });
    },
    { scope: root }
  );

  return (
    <section id="features" ref={root} className="relative py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Why PayFollows"
          title="Everything you need to grow, in one panel"
          subtitle="A complete growth engine trusted by thousands of creators, agencies and resellers worldwide."
        />
        <div className="feature-grid mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="feature-card group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-xl card-hover"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-gradient text-white shadow-glow-sm transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-300">
        {eyebrow}
      </span>
      <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
