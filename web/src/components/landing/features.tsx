'use client';

import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Clock, Headphones, Wallet, RefreshCw } from 'lucide-react';
import { Reveal, staggerContainer, staggerItem } from '@/components/shared/reveal';

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
  return (
    <section id="features" className="relative scroll-mt-24 py-20 lg:py-24">
      <div className="container">
        <Reveal>
          <SectionHeading
            eyebrow="Why PayFollows"
            title="Why creators stick with us"
            subtitle="We combine clarity, trust and high-performing delivery to produce results that actually matter."
          />
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          className="feature-grid mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group relative overflow-hidden rounded-3xl border border-[rgba(167,139,250,0.12)] bg-ink-850/85 p-7 backdrop-blur-xl transition-colors duration-300 hover:border-primary-500/40 hover:shadow-card-hover"
            >
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary-600/25 blur-3xl transition-all duration-500 group-hover:bg-primary-500/35" />
              <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-gradient text-white shadow-glow-sm transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-5 font-display text-lg font-bold text-white">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
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
      <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-300">
        {eyebrow}
      </span>
      <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
