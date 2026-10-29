import { ArrowUpRight, BadgeCheck, CircleDollarSign, ListChecks, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

const DETAILS = [
  {
    icon: BadgeCheck,
    title: 'Service details before submission',
    description: 'Review the service description and quantity limits before you commit to an order.',
  },
  {
    icon: CircleDollarSign,
    title: 'Charge shown before confirmation',
    description: 'The order form calculates the charge from the selected service and quantity.',
  },
  {
    icon: ListChecks,
    title: 'Order history tied to your account',
    description: 'Follow status updates reported by the connected provider from your dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'No social password field',
    description: 'Orders use the public link you provide. Never share your social account password.',
  },
];

export function Features() {
  return (
    <section id="features" className="landing-section relative scroll-mt-28 py-20 sm:py-24">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="max-w-lg">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white text-balance sm:text-4xl">
            The details stay connected to the order.
          </h2>
          <p className="mt-5 text-base leading-7 text-foreground/70">
            PayFollows brings service selection, wallet charges and provider-reported progress into one clear path.
          </p>
        </Reveal>

        <div className="landing-detail-list">
          {DETAILS.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} className="landing-detail-row" delayMs={index * 70}>
              <span className="landing-detail-icon" aria-hidden="true">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
              <ArrowUpRight className="ml-auto hidden h-4 w-4 text-primary-300/70 sm:block" aria-hidden="true" />
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
