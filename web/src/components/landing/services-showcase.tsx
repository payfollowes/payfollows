'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ExternalLink, LayoutGrid } from 'lucide-react';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';
import { PLATFORMS } from '@/lib/constants';
import { Reveal } from '@/components/shared/reveal';

const PLATFORM_COPY: Record<string, { title: string; description: string }> = {
  Instagram: {
    title: 'Instagram services',
    description: 'Check the live catalog for Instagram options, then review each listed service’s requirements and current rate before ordering.',
  },
  TikTok: {
    title: 'TikTok services',
    description: 'See whether TikTok options are currently listed for your account, and review link format, quantity limits and rate before submitting.',
  },
  Twitter: {
    title: 'X services',
    description: 'Check the live catalog for X options. Any listed service includes its current availability, limits and provider terms.',
  },
  Facebook: {
    title: 'Facebook services',
    description: 'Review any Facebook options currently listed for your account, including their requirements and displayed pricing.',
  },
  YouTube: {
    title: 'YouTube services',
    description: 'Check the live YouTube catalog for current options, supported link types, descriptions and quantity limits.',
  },
  Telegram: {
    title: 'Telegram services',
    description: 'Review any Telegram options in the current catalog and confirm their target link and service conditions before ordering.',
  },
  Spotify: {
    title: 'Spotify services',
    description: 'Check the live catalog for Spotify options and review their current service details and provider terms before you confirm.',
  },
  Snapchat: {
    title: 'Snapchat services',
    description: 'See whether Snapchat options are currently listed for your account and review their requirements in the service catalog.',
  },
  LinkedIn: {
    title: 'LinkedIn services',
    description: 'Check the current catalog for LinkedIn options and review any listed service’s limits, rate and provider notes.',
  },
};

const CATALOG_STEPS = [
  'Service details and requirements',
  'Current rate and quantity limits',
  'Calculated charge before confirmation',
];

export function ServicesShowcase() {
  const [active, setActive] = useState('Instagram');
  const copy = PLATFORM_COPY[active] ?? PLATFORM_COPY.Instagram;

  return (
    <section id="services" className="landing-section landing-services-section landing-reference-services relative scroll-mt-28 py-20 sm:py-24">
      <div className="container relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">Explore the catalog</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-4xl lg:text-5xl">
            Social services, organized by platform.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-foreground/70">
            Choose a platform to get a feel for the catalog. Sign in to view the live service list, rates and limits available to your account.
          </p>
        </Reveal>

        <div className="landing-reference-tabs mt-10" aria-label="Filter service overview by platform">
          {PLATFORMS.slice(1).map((platform) => {
            const selected = active === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(platform.id)}
                className={`landing-reference-tab${selected ? ' is-active' : ''}`}
              >
                <PlatformBrandIcon platformId={platform.id} size="sm" className="landing-reference-tab-icon" />
                <span>{platform.label}</span>
              </button>
            );
          })}
        </div>

        <Reveal className="landing-reference-service-panel mt-5" key={active}>
          <div className="landing-reference-service-copy">
            <span className="landing-reference-service-icon">
              <PlatformBrandIcon platformId={active} size="lg" />
            </span>
            <p className="landing-reference-panel-label">Platform overview</p>
            <h3>{copy.title}</h3>
            <p className="landing-reference-service-description">{copy.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="landing-reference-primary-button">
                Open the catalog <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className="landing-reference-secondary-button">Sign in</Link>
            </div>
          </div>
          <div className="landing-reference-service-preview" aria-label="What to review in the service catalog">
            <div className="landing-preview-windowbar"><span /><span /><span /><b>Service details</b></div>
            <div className="landing-preview-row">
              <span className="landing-preview-row-icon"><PlatformBrandIcon platformId={active} size="sm" /></span>
              <span><small>Selected platform</small><strong>{active === 'Twitter' ? 'X (Twitter)' : active}</strong></span>
              <Check className="landing-preview-check" aria-hidden="true" />
            </div>
            <div className="landing-preview-divider" />
            {CATALOG_STEPS.map((step, index) => (
              <div key={step} className="landing-preview-checkrow">
                <span className="landing-preview-number">0{index + 1}</span>
                <span>{step}</span>
                {index === 0 && <ExternalLink className="ml-auto h-3.5 w-3.5 text-white/35" aria-hidden="true" />}
              </div>
            ))}
            <div className="landing-preview-note"><LayoutGrid className="h-4 w-4" aria-hidden="true" /> Illustration only. Live catalog details can change.</div>
          </div>
        </Reveal>

        <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-muted-foreground">
          Service availability, rates and terms are set by providers and may change. The dashboard shows the current details before you order.
        </p>
      </div>
    </section>
  );
}
