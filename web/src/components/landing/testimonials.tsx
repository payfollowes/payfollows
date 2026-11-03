import { ArrowUpRight, BadgeCheck, CircleDollarSign, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { SectionHeading } from './features';
import { Reveal } from '@/components/shared/reveal';

const STEPS = [
  { icon: ClipboardList, title: 'Choose a listed service', text: 'Check the service description and quantity limits in your dashboard.' },
  { icon: CircleDollarSign, title: 'Review the charge', text: 'The order charge is calculated from the selected service and quantity.' },
  { icon: BadgeCheck, title: 'Follow the order status', text: 'Your order history shows the status returned by the connected provider.' },
];

export function Testimonials() {
  return (
    <section id="reviews" className="scroll-mt-24 py-20 lg:py-24">
      <div className="container">
        <Reveal>
          <SectionHeading
            title="A clear path from selection to status"
            subtitle="We do not publish anonymous reviews or customer growth numbers. Here is what the product flow actually provides."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title}>
              <article className="h-full rounded-3xl border border-[rgba(167,139,250,0.12)] bg-ink-850/85 p-7 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">Step 0{index + 1}</p>
                <h3 className="mt-2 font-display text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-300 hover:text-white">
            Explore your dashboard <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
