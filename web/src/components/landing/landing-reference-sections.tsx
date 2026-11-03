import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  CircleHelp,
  ClipboardList,
  ExternalLink,
  Eye,
  HelpCircle,
  Link2,
  ListChecks,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';
import { Reveal } from '@/components/shared/reveal';

const VALUE_CARDS = [
  {
    icon: Eye,
    title: 'Review the service first',
    body: 'Service descriptions, input requirements and quantity limits appear in the catalog before you place an order.',
  },
  {
    icon: CircleDollarSign,
    title: 'See the charge before confirming',
    body: 'The order form calculates the charge from the selected service rate and quantity before submission.',
  },
  {
    icon: ListChecks,
    title: 'Keep order details together',
    body: 'Check your order history for provider-reported status and any actions currently available for that order.',
  },
];

export function OrderPreview() {
  return (
    <section className="landing-reference-overview landing-section py-20 sm:py-24">
      <div className="container landing-reference-overview-grid">
        <Reveal className="landing-reference-overview-copy">
          <p className="landing-eyebrow">A clearer order flow</p>
          <h2>Know what you’re submitting before you confirm.</h2>
          <p>Choose a service from the live catalog, enter the requested public link and quantity, then review the calculated charge before placing the order.</p>
          <div className="landing-reference-assurance"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> PayFollows does not ask for your social account password in the order form.</div>
          <Link href="/register" className="landing-reference-primary-button mt-7">
            Create an account <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
        <Reveal className="landing-reference-order-window" delayMs={100}>
          <div className="landing-reference-window-head">
            <div className="landing-reference-window-dots"><i /><i /><i /></div>
            <span>Illustrative order preview</span>
            <span className="landing-reference-window-state">Review first</span>
          </div>
          <div className="landing-reference-order-field">
            <small>Platform</small>
            <span><PlatformBrandIcon platformId="Instagram" size="sm" /> Instagram <ArrowRight className="ml-auto h-4 w-4 rotate-90 text-white/40" aria-hidden="true" /></span>
          </div>
          <div className="landing-reference-order-field">
            <small>Service</small>
            <span className="landing-reference-order-placeholder">Select a service from the live catalog</span>
          </div>
          <div className="landing-reference-order-field">
            <small>Target link</small>
            <span className="landing-reference-order-placeholder"><Link2 className="h-4 w-4 text-primary-200" aria-hidden="true" /> Paste a public profile or post URL</span>
          </div>
          <div className="landing-reference-order-summary">
            <span>Calculated charge</span>
            <b>Shown before confirmation</b>
          </div>
          <p className="landing-reference-order-note"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Illustrative only. Live services, fields and rates may differ.</p>
        </Reveal>
      </div>
    </section>
  );
}

export function WhyPayFollows() {
  return (
    <section className="landing-reference-why landing-section py-20 sm:py-24">
      <div className="container">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">Designed around useful details</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-white text-balance sm:text-4xl lg:text-5xl">A practical way to manage social service orders.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-foreground/70">Use one account to explore the catalog, review order costs and keep track of service-order updates.</p>
        </Reveal>
        <div className="landing-reference-value-grid mt-11">
          {VALUE_CARDS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delayMs={index * 80}>
              <article className={`landing-reference-value-card value-${index + 1}`}>
                <span className="landing-reference-value-number">0{index + 1}</span>
                <span className="landing-reference-value-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductWalkthrough() {
  const nodes = [
    { icon: ClipboardList, label: 'Catalog', title: 'Read service details', text: 'Check current rates, limits and provider notes.' },
    { icon: Link2, label: 'Order form', title: 'Add the requested details', text: 'Provide the public link and a valid quantity.' },
    { icon: CircleDollarSign, label: 'Confirmation', title: 'Review the charge', text: 'See the calculated amount before submitting.' },
    { icon: ListChecks, label: 'Order history', title: 'Follow reported status', text: 'View status updates and available actions.' },
  ];

  return (
    <section className="landing-reference-walkthrough landing-section py-20 sm:py-24">
      <div className="container">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">A quick visual guide</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-white text-balance sm:text-4xl lg:text-5xl">From catalog to order history.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-foreground/70">This is an illustrative overview of the steps in PayFollows—not a recording of the live dashboard.</p>
        </Reveal>
        <div className="landing-reference-walkthrough-board mt-11">
          <div className="landing-reference-walkthrough-top"><span>ORDER WORKFLOW</span><span className="landing-reference-live-indicator"><i /> Details vary by service</span></div>
          <div className="landing-reference-walkthrough-track" aria-hidden="true"><span /></div>
          <ol className="landing-reference-walkthrough-grid">
            {nodes.map(({ icon: Icon, label, title, text }, index) => (
              <li className="landing-reference-walkthrough-node" key={label}>
                <span className="landing-reference-walkthrough-number">0{index + 1}</span>
                <span className="landing-reference-walkthrough-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <small>{label}</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function ProductBoundaries() {
  return (
    <section className="landing-reference-boundaries landing-section py-20 sm:py-24">
      <div className="container">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">Different tools, different jobs</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-white text-balance sm:text-4xl lg:text-5xl">A service-order panel is not an ads platform.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-foreground/70">PayFollows helps you submit and track catalog orders. Paid-ad platforms are used to create and manage advertising campaigns.</p>
        </Reveal>
        <div className="landing-reference-boundary-grid mt-10">
          <article className="landing-reference-boundary-card is-payfollows">
            <div className="landing-reference-boundary-icon"><BadgeCheck className="h-5 w-5" aria-hidden="true" /></div>
            <p className="landing-reference-panel-label">PayFollows</p>
            <h3>Catalog-based service orders</h3>
            <ul>
              <li><CheckMark />Review service requirements and current rates</li>
              <li><CheckMark />Submit an order using the requested public link</li>
              <li><CheckMark />View provider-reported status in order history</li>
            </ul>
          </article>
          <article className="landing-reference-boundary-card">
            <div className="landing-reference-boundary-icon is-neutral"><UsersRound className="h-5 w-5" aria-hidden="true" /></div>
            <p className="landing-reference-panel-label">Paid advertising</p>
            <h3>Campaign planning and delivery</h3>
            <ul>
              <li><CheckMark />Set campaign objectives and audience targeting</li>
              <li><CheckMark />Choose ad creative, placements and budget</li>
              <li><CheckMark />Review campaign results in the ad platform</li>
            </ul>
          </article>
        </div>
        <p className="landing-reference-boundary-note">Service performance depends on the selected provider and service terms. PayFollows does not promise viral reach or a specific audience outcome.</p>
      </div>
    </section>
  );
}

function CheckMark() {
  return <span className="landing-reference-list-check" aria-hidden="true"><Check className="h-3.5 w-3.5" /></span>;
}

export function SupportSpotlight() {
  return (
    <section className="landing-reference-support landing-section py-20 sm:py-24">
      <div className="container">
        <Reveal className="landing-reference-support-panel">
          <div className="landing-reference-support-copy">
            <span className="landing-reference-support-icon"><HelpCircle className="h-5 w-5" aria-hidden="true" /></span>
            <p className="landing-eyebrow">Help when you need it</p>
            <h2>Questions about an order or account?</h2>
            <p>Check the FAQs for common answers. Sign in to access the support options available to your account.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/#faq" className="landing-reference-secondary-button">Read the FAQs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/login" className="landing-reference-primary-button">Sign in for support <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="landing-reference-support-visual" aria-hidden="true">
            <div className="landing-reference-support-glow" />
            <div className="landing-reference-support-tile tile-one"><ClipboardList /><span>Order details</span></div>
            <div className="landing-reference-support-tile tile-two"><CircleDollarSign /><span>Charges</span></div>
            <div className="landing-reference-support-tile tile-three"><ListChecks /><span>Status updates</span></div>
            <div className="landing-reference-support-core"><HelpCircle /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FloatingHelp() {
  return (
    <Link href="/#faq" className="landing-reference-floating-help" aria-label="Jump to frequently asked questions">
      <CircleHelp className="h-5 w-5" aria-hidden="true" />
      <span>FAQs</span>
    </Link>
  );
}
