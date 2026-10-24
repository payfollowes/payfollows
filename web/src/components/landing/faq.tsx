'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SectionHeading } from './features';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'How fast does my order start?',
    a: 'Most orders begin within seconds of checkout. Peak-time services typically start within 0–15 minutes, and every service page shows the guaranteed start time.',
  },
  {
    q: 'Is it safe for my social accounts?',
    a: 'Yes. We never ask for your passwords — only public post or profile links. Services use promotion methods that respect platform guidelines, and RLS-protected accounts keep your data safe.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'You can deposit via FastPay, PayFast, credit/debit cards, EasyPaisa, PayPal and crypto. Funds are credited to your panel balance instantly after confirmation.',
  },
  {
    q: 'What happens if my followers drop?',
    a: 'Eligible services include a 30-day or lifetime refill guarantee. If drops occur, open a ticket or use the refill action and the count is restored automatically.',
  },
  {
    q: 'Do you offer an API for resellers?',
    a: 'Absolutely. Every account gets a unique API key with standard SMM-panel endpoints (services list, add order, status, refill) so you can automate your own storefront.',
  },
  {
    q: 'Can I cancel an order?',
    a: 'Orders that have not started processing can be canceled from the Orders page and the charge is refunded to your balance immediately.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24">
      <div className="container max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const active = open === i;
            return (
              <div
                key={item.q}
                className={cn(
                  'overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors',
                  active ? 'border-primary-500/40 bg-primary-500/[0.07]' : 'border-white/[0.08] bg-white/[0.04]'
                )}
              >
                <button
                  onClick={() => setOpen(active ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-base font-semibold text-white">{item.q}</span>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-primary-400 transition-transform duration-300', active && 'rotate-180')}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
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
