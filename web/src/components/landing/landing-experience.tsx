import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, CreditCard, Globe2, LockKeyhole, WalletCards } from 'lucide-react';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';
import { Reveal } from '@/components/shared/reveal';

const CHANNELS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Telegram', 'Spotify'];

export function PaymentsOverview() {
  const steps = [
    { icon: CreditCard, title: 'Choose an available method', description: 'Enabled payment options are listed in Add Funds.' },
    { icon: WalletCards, title: 'Review the amount', description: 'Any applicable fee is shown before you confirm.' },
    { icon: Check, title: 'Wait for confirmation', description: 'Your wallet updates after the payment is verified.' },
  ];

  return (
    <section id="payments" className="landing-reference-payments landing-section scroll-mt-28 py-20 sm:py-24">
      <div className="container">
        <div className="landing-reference-payments-shell">
          <Reveal className="landing-reference-payments-intro">
            <p className="landing-eyebrow">Wallet & payments</p>
            <h2>Know what happens before you add funds.</h2>
            <p>Payment options and any applicable fee are displayed in your account before you confirm a deposit. The available methods depend on the integrations enabled for PayFollows.</p>
            <Link href="/register" className="landing-reference-text-link">
              View your account options <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <div className="landing-reference-payment-steps">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delayMs={index * 90}>
                <article className="landing-reference-payment-card">
                  <span className="landing-reference-payment-index">0{index + 1}</span>
                  <span className="landing-reference-payment-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GlobalPlatforms() {
  return (
    <section className="landing-reference-global relative isolate overflow-hidden py-20 sm:py-24">
      <Image
        src="/landing-reference/globe.jpg"
        alt=""
        fill
        sizes="100vw"
        className="landing-reference-global-image"
        aria-hidden="true"
      />
      <div className="landing-reference-global-shade" aria-hidden="true" />
      <div className="container relative z-10">
        <Reveal className="landing-reference-global-copy">
          <span className="landing-reference-global-mark"><Globe2 className="h-4 w-4" aria-hidden="true" /> One connected workspace</span>
          <h2>Different platforms.<br /><span>One clear workflow.</span></h2>
          <p>Explore the social service categories in the PayFollows dashboard, review current provider details and keep your order history together in one place.</p>
          <Link href="/register" className="landing-reference-primary-button">
            Explore PayFollows <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
        <div className="landing-reference-orbit" aria-label="Social platform categories">
          {CHANNELS.map((platform, index) => (
            <div className={`landing-reference-orbit-item orbit-${index + 1}`} key={platform} title={platform}>
              <PlatformBrandIcon platformId={platform} size="md" />
            </div>
          ))}
          <div className="landing-reference-orbit-core">
            <span className="landing-reference-orbit-lock"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></span>
            <span>PayFollows</span>
            <small>Order workspace</small>
          </div>
        </div>
      </div>
    </section>
  );
}
