import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from './features';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';
import { PLATFORMS } from '@/lib/constants';

export function ServicesShowcase() {
  return (
    <section id="services" className="landing-section relative scroll-mt-28 py-20 sm:py-24">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <SectionHeading
            title="Start with the platform."
            subtitle="Browse the current service catalog by platform. Availability, rates and terms can vary by provider."
          />
          <div className="landing-platform-console">
            <div className="flex flex-col gap-2 border-b border-white/[0.09] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-sm font-semibold text-white">Platform filters</p>
                <p className="mt-1 text-xs text-muted-foreground">Shown in the service catalog</p>
              </div>
              <span className="text-xs font-medium text-primary-200">Explore what’s currently available</span>
            </div>
            <ul className="grid grid-cols-2 gap-px bg-white/[0.07] sm:grid-cols-3">
              {PLATFORMS.slice(1).map((platform) => (
                <li key={platform.id} className="flex items-center gap-3 bg-[#100c19] px-4 py-4 sm:px-5">
                  <PlatformBrandIcon platformId={platform.id} size="sm" />
                  <span className="text-sm font-medium text-foreground/85">{platform.label}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Sign in to see live services, quantity limits and pricing before you place an order.
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
      </div>
    </section>
  );
}
