'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SectionHeading } from './features';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Create an account, choose an available service, enter the requested public link and a quantity within the listed limits. Review the calculated charge before confirming.',
  },
  {
    q: 'Do you need my social account password?',
    a: 'The order form asks for a public profile or post link, not your account password. Do not share your password in an order or support ticket.',
  },
  {
    q: 'Which payment methods can I use?',
    a: 'Available gateways are shown in Add Funds. A method is enabled only when its payment integration is configured.',
  },
  {
    q: 'When will my balance update?',
    a: 'A deposit is credited after the payment provider confirms it and the server verifies the event. Your wallet and payment history show the resulting status.',
  },
  {
    q: 'Can every order be refilled or canceled?',
    a: 'No. Refill and cancellation depend on the order status and provider support. Available actions are shown for eligible orders; refund eligibility is reviewed separately.',
  },
  {
    q: 'How is the price calculated?',
    a: 'The charge is calculated from the selected service rate and quantity. The dashboard displays it before you confirm; any deposit fee is shown in Add Funds.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="landing-section scroll-mt-28 py-20 sm:py-24">
      <div className="container grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div className="max-w-md">
          <SectionHeading
            title="Questions, answered plainly."
            subtitle="The current catalog and your account dashboard are the source of truth for availability, pricing and order actions."
          />
        </div>
        <div className="landing-faq-list">
          {FAQS.map((item, index) => {
            const active = open === index;
            const contentId = `landing-faq-answer-${index}`;
            return (
              <div key={item.q} className="landing-faq-item">
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls={active ? contentId : undefined}
                  onClick={() => setOpen(active ? null : index)}
                  className="flex w-full items-center justify-between gap-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  <span className="text-base font-semibold text-white sm:text-lg">{item.q}</span>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-primary-300 transition-transform duration-200', active && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      id={contentId}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-foreground/70">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
