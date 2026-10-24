'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { Button } from '@/components/ui/button';
import { SectionHeading } from './features';

const SERVICES = [
  {
    emoji: '📸',
    platform: 'Instagram',
    gradient: 'from-pink-500 to-rose-500',
    items: ['Real Followers', 'Reels Views', 'Story Views', 'Likes & Saves'],
    from: '$0.42 / 1K',
  },
  {
    emoji: '🎵',
    platform: 'TikTok',
    gradient: 'from-slate-100 to-slate-400',
    items: ['Followers', 'Video Views', 'Likes', 'Shares & Saves'],
    from: '$0.18 / 1K',
  },
  {
    emoji: '▶️',
    platform: 'YouTube',
    gradient: 'from-red-500 to-rose-600',
    items: ['Subscribers', 'Watch Hours', 'Shorts Views', 'Likes & Comments'],
    from: '$2.90 / 1K',
  },
  {
    emoji: '👍',
    platform: 'Facebook',
    gradient: 'from-blue-500 to-indigo-600',
    items: ['Page Likes', 'Post Reactions', 'Video Views', 'Followers'],
    from: '$1.10 / 1K',
  },
  {
    emoji: '✈️',
    platform: 'Telegram',
    gradient: 'from-sky-400 to-cyan-600',
    items: ['Channel Members', 'Post Views', 'Reactions', 'Bot Subscribers'],
    from: '$0.65 / 1K',
  },
  {
    emoji: '🎧',
    platform: 'Spotify',
    gradient: 'from-green-400 to-emerald-600',
    items: ['Plays', 'Monthly Listeners', 'Followers', 'Playlist Adds'],
    from: '$0.95 / 1K',
  },
];

export function ServicesShowcase() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.service-card', {
        y: 56,
        opacity: 0,
        duration: 0.8,
        stagger: 0.09,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.service-grid', start: 'top 84%' },
      });
    },
    { scope: root }
  );

  return (
    <section id="services" ref={root} className="relative py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-700/15 blur-[130px]" />
      <div className="container relative">
        <SectionHeading
          eyebrow="Our Services"
          title="One catalog. Every major platform."
          subtitle="Thousands of measurable services across social networks — pick a package, paste your link, and watch growth happen."
        />

        <div className="service-grid mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <motion.div
              key={service.platform}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              className="service-card group relative overflow-hidden rounded-3xl border border-[rgba(167,139,250,0.12)] bg-ink-850/85 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-500/40 hover:shadow-card-hover"
            >
              <div
                className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${service.gradient} opacity-15 blur-2xl transition-opacity group-hover:opacity-30`}
              />
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${service.gradient} text-xl shadow-glow-sm`}
                >
                  {service.emoji}
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  {service.from}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white">{service.platform}</h3>
              <ul className="mt-4 space-y-2.5">
                {service.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary-400" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Browse Full Catalog <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
