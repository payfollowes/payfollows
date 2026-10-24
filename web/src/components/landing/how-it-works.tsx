'use client';

import { useRef } from 'react';
import { UserPlus, Wallet, ShoppingCart, TrendingUp } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { SectionHeading } from './features';

const STEPS = [
  { icon: UserPlus, title: 'Create Account', desc: 'Sign up free in under a minute with just your email and username.' },
  { icon: Wallet, title: 'Add Funds', desc: 'Deposit securely via card, EasyPaisa, PayPal, crypto or FastPay.' },
  { icon: ShoppingCart, title: 'Place Order', desc: 'Choose from thousands of services, paste your link and confirm.' },
  { icon: TrendingUp, title: 'Watch Growth', desc: 'Track live progress from your dashboard while results roll in.' },
];

export function HowItWorks() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.step-card', {
        y: 44,
        opacity: 0,
        duration: 0.7,
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.steps-grid', start: 'top 84%' },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="py-24">
      <div className="container">
        <SectionHeading
          eyebrow="How It Works"
          title="Four steps between you and viral growth"
          subtitle="No learning curve. The whole workflow is designed to take less than two minutes."
        />
        <div className="steps-grid relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent lg:block" />
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="step-card group relative rounded-3xl border border-[rgba(167,139,250,0.12)] bg-ink-850/85 p-7 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-500/40 hover:shadow-card-hover"
            >
              <div className="pointer-events-none absolute -top-14 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-primary-600/20 blur-3xl transition-opacity duration-500 group-hover:bg-primary-500/30" />
              <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-500/30 bg-ink-900 p-4 shadow-glow-sm">
                  <step.icon className="h-7 w-7 text-primary-400" />
                </span>
                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-gradient font-display text-xs font-bold text-white shadow-glow-xs">
                  {i + 1}
                </span>
              </div>
              <h3 className="relative mt-5 font-display text-lg font-bold text-white">{step.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
