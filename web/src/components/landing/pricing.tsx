'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { SectionHeading } from './features';
import { Reveal, staggerContainer, staggerItem } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';

interface Plan {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Starter Plan',
    price: '$50',
    tagline: 'Perfect for first-time creators testing growth.',
    features: [
      '$50 account credit',
      '5% bonus on every top-up',
      'Access to 2,500+ services',
      'Standard delivery speed',
      '30-day refill guarantee',
      'Email support',
    ],
    cta: 'Choose this plan',
  },
  {
    name: 'Pro Plan',
    price: '$250',
    tagline: 'For growing brands that need consistent results.',
    features: [
      '$250 account credit',
      '10% bonus on every top-up',
      'Priority order processing',
      'Full reseller API access',
      'Advanced analytics dashboard',
      '24/7 live chat support',
    ],
    cta: 'Choose this plan',
    popular: true,
  },
  {
    name: 'Agency Plan',
    price: '$750',
    tagline: 'For agencies and resellers managing many clients.',
    features: [
      '$750 account credit',
      '15% bonus on every top-up',
      'Dedicated account manager',
      'White-label order reports',
      'Fastest delivery lane',
      'Bulk & scheduled ordering',
    ],
    cta: 'Choose this plan',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-24 bg-ink-900/40 py-20 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-[680px] -translate-x-1/2 rounded-full bg-primary-700/15 blur-[130px]" />
      <div className="container relative">
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title="Straightforward credit plans that fit"
            subtitle="Top up once and spend across every service. Whether you're funding your first idea or scaling an agency, the price stays transparent."
          />
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          className="mt-12 grid items-stretch gap-6 lg:grid-cols-3"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={staggerItem}
              whileHover={{ y: -8 }}
              className={cn(
                'relative flex flex-col rounded-3xl border p-8 backdrop-blur-xl transition-shadow duration-300',
                plan.popular
                  ? 'glow-panel border-primary-500/40 bg-ink-800/95 shadow-glow lg:-mt-4 lg:mb-[-16px]'
                  : 'border-[rgba(167,139,250,0.12)] bg-ink-850/85 hover:border-primary-500/30 hover:shadow-card-hover'
              )}
            >
              {/* hexagon dot texture */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.13]"
                style={{
                  backgroundImage: 'radial-gradient(rgba(167,139,250,0.55) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                  maskImage: 'linear-gradient(180deg, black 0%, transparent 55%)',
                  WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 55%)',
                }}
              />

              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary-gradient px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Most Popular
                </span>
              )}

              <div className="relative">
                <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-muted-foreground">{plan.tagline}</p>
                <p className="mt-5 font-display text-4xl font-bold text-white tabular">
                  {plan.price}
                  <span className="ml-1.5 text-sm font-semibold text-muted-foreground">USD</span>
                </p>
              </div>

              <ul className="relative mt-7 flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground/85">
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                        plan.popular ? 'bg-primary-gradient text-white' : 'bg-primary-500/15 text-primary-300'
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={cn(
                  'group relative mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]',
                  plan.popular
                    ? 'bg-primary-gradient text-white btn-glow hover:brightness-110'
                    : 'border border-white/12 bg-white/[0.05] text-foreground hover:border-primary-500/50 hover:bg-white/[0.09]'
                )}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
