'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SectionHeading } from './features';
import { cn } from '@/lib/utils';

const FAQ_CATEGORIES = [
  {
    name: 'General',
    items: [
      { q: 'What is PayFollows?', a: 'PayFollows is a dashboard for browsing social service categories, submitting eligible orders and checking their provider-reported status.' },
      { q: 'What is an SMM panel?', a: 'An SMM panel is a service-order platform. The specific services, requirements and provider terms vary by catalog item.' },
      { q: 'Where can I check current availability?', a: 'Sign in and open the live catalog. It shows the services and rates currently available to your account.' },
    ],
  },
  {
    name: 'Getting started',
    items: [
      { q: 'How do I place an order?', a: 'Choose a listed service, enter the requested public link and a quantity within the shown limits, then review the calculated charge before confirming.' },
      { q: 'What information does an order need?', a: 'The required input depends on the service. The order form and service description show the supported link type and quantity limits.' },
      { q: 'Do you need my social account password?', a: 'The order form requests a public profile or post link, not your social account password. Never share your password in an order or support message.' },
    ],
  },
  {
    name: 'Services & orders',
    items: [
      { q: 'Which social platforms are listed?', a: 'The catalog includes platform categories such as Instagram, TikTok, X, Facebook, YouTube, Telegram, Spotify, Snapchat and LinkedIn. Exact service availability can change; check the live catalog.' },
      { q: 'How can I follow an order?', a: 'Your order history displays status updates reported by the connected provider, along with any actions currently available for that order.' },
      { q: 'Can I cancel or request a refill?', a: 'Those options depend on the order status, service terms and provider support. The dashboard displays actions for eligible orders; refund eligibility is reviewed separately.' },
    ],
  },
  {
    name: 'Pricing & payments',
    items: [
      { q: 'How is an order charge calculated?', a: 'The charge is calculated from the selected service rate and quantity. Review the displayed total before you confirm the order.' },
      { q: 'Which payment methods can I use?', a: 'Available gateways and any applicable fee are shown in Add Funds. Payment methods depend on the integrations enabled for PayFollows.' },
      { q: 'When does a deposit reach my wallet?', a: 'A deposit is credited after the payment provider confirms it and the server verifies the event. Check your wallet and payment history for its status.' },
    ],
  },
];

export function Faq() {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();
  const category = FAQ_CATEGORIES[categoryIndex];

  return (
    <section id="faq" className="landing-section scroll-mt-28 py-20 sm:py-24">
      <div className="container grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div className="max-w-md">
          <p className="landing-eyebrow">Help & answers</p>
          <SectionHeading
            title="Questions, answered plainly."
            subtitle="The live catalog and your account dashboard are the source of truth for availability, pricing and order actions."
          />
        </div>
        <div>
          <div className="landing-reference-faq-tabs" aria-label="Filter frequently asked questions">
            {FAQ_CATEGORIES.map((item, index) => (
              <button
                key={item.name}
                type="button"
                aria-pressed={categoryIndex === index}
                onClick={() => { setCategoryIndex(index); setOpen(0); }}
                className={categoryIndex === index ? 'is-active' : ''}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="landing-faq-list" key={category.name}>
            {category.items.map((item, index) => {
              const active = open === index;
              const contentId = `landing-faq-${categoryIndex}-${index}`;
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
      </div>
    </section>
  );
}
