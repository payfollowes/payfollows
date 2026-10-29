import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

const CHECKS = [
  'Service rates and quantity limits are shown in the catalog.',
  'The calculated order charge is visible before confirmation.',
  'Available payment methods and any deposit fee are shown in Add Funds.',
];

export function Pricing() {
  return (
    <section id="pricing" className="landing-section scroll-mt-28 py-20 sm:py-24">
      <div className="container">
        <Reveal className="landing-pricing-panel">
          <div className="landing-pricing-orbit" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <h2 className="max-w-lg font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-4xl">
                Pricing stays attached to the service you choose.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-foreground/70">
                No fixed package grid to guess from. Review the live rate, limits and calculated total in the order flow.
              </p>
            </div>
            <div>
              <ul className="landing-pricing-list">
                {CHECKS.map((item) => (
                  <li key={item} className="flex gap-3 py-3 text-sm leading-6 text-foreground/85">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="group mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                See current catalog
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
