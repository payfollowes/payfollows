import Link from 'next/link';
import { ArrowRight, Check, CircleDollarSign, ListChecks, Search } from 'lucide-react';
import { SectionHeading } from './features';
import { Reveal } from '@/components/shared/reveal';

const STEPS = [
  {
    icon: Search,
    title: 'Choose from the catalog',
    description: 'Review the service description, limits and current rate for the option you select.',
  },
  {
    icon: CircleDollarSign,
    title: 'Review before confirming',
    description: 'See the calculated order charge before submitting. Add-funds options and any fee are shown in that flow.',
  },
  {
    icon: ListChecks,
    title: 'Follow provider-reported status',
    description: 'Your order history keeps the status and eligible actions connected to your account.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-process-section scroll-mt-28 py-20 sm:py-24">
      <div className="container grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <Reveal className="max-w-lg">
          <SectionHeading
            title="One deliberate path, from selection to status."
            subtitle="Service details, charges and status updates stay connected throughout the order flow."
          />
          <Link
            href="/register"
            className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            Start with the catalog
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Reveal>

        <ol className="landing-step-list">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} className="landing-step-row" delayMs={index * 90}>
              <span className="landing-step-index" aria-hidden="true">0{index + 1}</span>
              <span className="landing-step-icon" aria-hidden="true"><Icon className="h-5 w-5" /></span>
              <div className="pb-7">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
              {index === STEPS.length - 1 && (
                <span className="landing-step-complete" aria-label="Flow ends with your order history">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
