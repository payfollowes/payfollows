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
          <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent lg:block" />
          {STEPS.map((step, i) => (
            <div key={step.title} className="step-card relative text-center">
              <div className="relative z-10 mx-auto flex h-18 w-18 items-center justify-center">
                <span className="flex h-18 w-18 items-center justify-center rounded-2xl border border-primary-500/30 bg-[#121627] p-5 shadow-glow-sm">
                  <step.icon className="h-7 w-7 text-primary-400" />
                </span>
                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-gradient font-display text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
