'use client';

import { PLATFORMS } from '@/lib/constants';

export function PlatformsMarquee() {
  const items = [...PLATFORMS.slice(1), ...PLATFORMS.slice(1)];
  return (
    <section className="relative border-y border-white/[0.06] py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
        {items.map((platform, i) => (
          <div
            key={`${platform.id}-${i}`}
            className="flex h-14 w-44 shrink-0 items-center justify-center gap-3 rounded-2xl border border-[rgba(167,139,250,0.12)] bg-ink-850/80 px-5 backdrop-blur-xl transition-colors hover:border-primary-500/40"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${platform.gradient} text-sm`}
            >
              {platform.emoji}
            </span>
            <span className="text-sm font-semibold text-foreground/90">{platform.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
