import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';
import { PLATFORMS } from '@/lib/constants';

export function ServicesShowcase() {
  return (
    <section id="services" className="landing-section landing-services-section relative scroll-mt-28 py-20 sm:py-24">
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow">One workspace, many platforms</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-4xl">
            Choose where you want to grow.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-foreground/70">
            Explore social service categories in one place. Sign in to see the live services, rates and quantity limits available to your account.
          </p>
        </div>

        <div className="landing-platform-console mt-11">
          <div className="flex flex-col gap-2 border-b border-white/[0.09] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="text-sm font-semibold text-white">Explore by platform</p>
              <p className="mt-1 text-xs text-muted-foreground">Real platform marks · live catalog after sign in</p>
            </div>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 text-xs font-semibold text-primary-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              Open the catalog
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          <ul className="landing-platform-grid">
            {PLATFORMS.slice(1).map((platform) => (
              <li key={platform.id} className="landing-platform-card">
                <PlatformBrandIcon platformId={platform.id} size="lg" className="landing-platform-card-icon" />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{platform.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">View current services</p>
                </div>
                <ArrowRight className="landing-platform-card-arrow ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Service availability, rates and terms are set by providers and can change. Review the live details before placing an order.
            </p>
            <Link
              href="/register"
              className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              Explore the catalog
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
