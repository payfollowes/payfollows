'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from './features';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/shared/reveal';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';

const SERVICES = [
  {
    id: 'Instagram',
    platform: 'Instagram',
    items: ['Real Followers', 'Reels Views', 'Story Views', 'Likes & Saves'],
    from: '$0.42 / 1K',
  },
  {
    id: 'TikTok',
    platform: 'TikTok',
    items: ['Followers', 'Video Views', 'Likes', 'Shares & Saves'],
    from: '$0.18 / 1K',
  },
  {
    id: 'YouTube',
    platform: 'YouTube',
    items: ['Subscribers', 'Watch Hours', 'Shorts Views', 'Likes & Comments'],
    from: '$2.90 / 1K',
  },
  {
    id: 'Facebook',
    platform: 'Facebook',
    items: ['Page Likes', 'Post Reactions', 'Video Views', 'Followers'],
    from: '$1.10 / 1K',
  },
  {
    id: 'Telegram',
    platform: 'Telegram',
    items: ['Channel Members', 'Post Views', 'Reactions', 'Bot Subscribers'],
    from: '$0.65 / 1K',
  },
  {
    id: 'Spotify',
    platform: 'Spotify',
    items: ['Plays', 'Monthly Listeners', 'Followers', 'Playlist Adds'],
    from: '$0.95 / 1K',
  },
];

export function ServicesShowcase() {
  return (
    <section id="services" className="relative scroll-mt-24 py-20 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-700/15 blur-[130px]" />
      <div className="container relative">
        <Reveal>
          <SectionHeading
            eyebrow="Our Services"
            title="One catalog. Every major platform."
            subtitle="Thousands of measurable services across social networks — pick a package, paste your link, and watch growth happen."
          />
        </Reveal>

        <StaggerGroup className="service-grid mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <StaggerItem key={service.platform} index={index} className="h-full">
            <div
              className="group relative h-full overflow-hidden rounded-3xl border border-[rgba(167,139,250,0.12)] bg-ink-850/85 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-500/40 hover:shadow-card-hover"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary-600/20 blur-3xl transition-opacity duration-500 group-hover:bg-primary-500/30" />

              <div className="flex items-center justify-between">
                <PlatformBrandIcon platformId={service.id} size="lg" />
                <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  {service.from}
                </span>
              </div>

              <h3 className="mt-5 font-display text-xl font-bold text-white">{service.platform}</h3>
              <ul className="mt-4 space-y-2.5">
                {service.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/15">
                      <Check className="h-3 w-3 text-primary-300" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary-300 transition-colors hover:text-primary-200"
              >
                Start growing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Browse Full Catalog <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
