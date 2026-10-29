import { ArrowUpRight, BadgeCheck, CircleDollarSign, ListChecks, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

const DETAILS = [
  {
    icon: BadgeCheck,
    title: 'Service details up front',
    description: 'Review descriptions and quantity limits before you decide what to order.',
    tone: 'violet',
  },
  {
    icon: CircleDollarSign,
    title: 'Know the charge first',
    description: 'The order form calculates the total from the current rate and quantity.',
    tone: 'green',
  },
  {
    icon: ListChecks,
    title: 'A clear order history',
    description: 'Follow status updates reported by the connected provider from your dashboard.',
    tone: 'blue',
  },
  {
    icon: ShieldCheck,
    title: 'Your password stays yours',
    description: 'Orders use the public link you provide. Never share a social account password.',
    tone: 'pink',
  },
];

export function Features() {
  return (
    <section id="features" className="landing-section landing-benefits-section relative scroll-mt-28 py-20 sm:py-24">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow">Made for a clearer workflow</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-4xl">
            The important details, all in one place.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-foreground/70">
            PayFollows brings service selection, wallet charges and provider-reported progress into one straightforward flow.
          </p>
        </Reveal>

        <div className="landing-benefit-grid mt-12">
          {DETAILS.map(({ icon: Icon, title, description, tone }, index) => (
            <Reveal key={title} delayMs={index * 65}>
              <article className={`landing-benefit-card is-${tone}`}>
                <div className="landing-benefit-card-top">
                  <span className="landing-detail-icon" aria-hidden="true"><Icon className="h-5 w-5" /></span>
                  <span className="landing-benefit-number">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                <ArrowUpRight className="landing-benefit-arrow h-4 w-4" aria-hidden="true" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-xl">
      <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-7 text-foreground/70">{subtitle}</p>}
    </div>
  );
}
