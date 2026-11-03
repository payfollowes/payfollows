import Link from 'next/link';
import { ArrowRight, Check, ClipboardList, Search, WalletCards, MousePointer2 } from 'lucide-react';
import { SectionHeading } from './features';
import { Reveal } from '@/components/shared/reveal';

const STEPS = [
  {
    icon: Search,
    title: 'Create an account',
    description: 'Sign up to access the dashboard and browse the services currently available to your account.',
  },
  {
    icon: ClipboardList,
    title: 'Choose a service',
    description: 'Review its description, link requirements, quantity limits and current rate before selecting it.',
  },
  {
    icon: WalletCards,
    title: 'Review and submit',
    description: 'Enter the requested public link and quantity. Check the calculated charge before confirming.',
  },
  {
    icon: MousePointer2,
    title: 'Follow the status',
    description: 'Check your order history for status updates reported by the connected provider and any eligible actions.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-process-section landing-reference-process scroll-mt-28 py-20 sm:py-24">
      <div className="container">
        <div className="landing-reference-process-heading">
          <Reveal className="max-w-md">
            <p className="landing-eyebrow">A straightforward workflow</p>
            <SectionHeading
              title="From service selection to order status."
              subtitle="The key details stay visible at each step, so you can review the service and charge before submitting."
            />
            <Link
              href="/register"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
          <p className="landing-reference-process-aside">Your dashboard is the source of truth for live service availability, rates and provider-reported progress.</p>
        </div>

        <ol className="landing-reference-step-grid">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className={`landing-reference-step-card${index === STEPS.length - 1 ? ' is-final' : ''}`} style={{ animationDelay: `${index * 80}ms` }}>
              <span className="landing-reference-step-number">0{index + 1}</span>
              <span className="landing-reference-step-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div className="landing-reference-step-copy">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              {index === STEPS.length - 1 && <span className="landing-reference-step-check"><Check className="h-4 w-4" aria-hidden="true" /></span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
