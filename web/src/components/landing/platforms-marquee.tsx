'use client';

import { PLATFORMS } from '@/lib/constants';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';

export function PlatformsMarquee() {
  const items = [...PLATFORMS.slice(1), ...PLATFORMS.slice(1)];
  return (
    <section className="relative border-y border-[rgba(167,139,250,0.12)] bg-ink-900/50 py-9">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-950 to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-950 to-transparent sm:w-40" />
      <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
        {items.map((platform, i) => (
          <div
            key={`${platform.id}-${i}`}
            className="flex h-16 w-48 shrink-0 items-center gap-3.5 rounded-2xl border border-[rgba(167,139,250,0.12)] bg-ink-850/80 px-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary-500/40"
          >
            <PlatformBrandIcon platformId={platform.id} size="sm" />
            <span className="text-sm font-bold text-foreground/90">{platform.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
