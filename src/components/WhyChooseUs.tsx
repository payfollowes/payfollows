import React from 'react';
import Reveal from './Reveal';

const plans = [
  {
    name: 'Starter',
    audience: 'For individual creators',
    price: 'Free to start',
    popular: false,
    features: [
      'Standard service pricing',
      'Points on every order',
      '24/7 support through tickets',
    ],
  },
  {
    name: 'Reseller',
    audience: 'For freelancers & small agencies',
    price: 'Free child panel',
    popular: true,
    features: [
      'Wholesale margins on 5,000+ services',
      'Free child panel for your storefront',
      'Discounts up to 10% by tier',
      'API access for automation',
    ],
  },
  {
    name: 'Agency',
    audience: 'For teams & high volume',
    price: 'Priority everything',
    popular: false,
    features: [
      'Deposit bonus up to 15%',
      'Dedicated account manager',
      'Custom API limits',
      'Bulk order tools',
    ],
  },
];

const paymentMethods = [
  'PayPal',
  'Paytm',
  'Payeer',
  'bKash',
  'WebMoney',
  'Visa',
  'Mastercard',
  'JazzCash',
  'EasyPaisa',
  'Nagad',
  'Rocket',
  'Skrill',
];

/**
 * Pricing — the template's three-tier pricing cards, framed around how
 * PayFollows people resell. Every plan starts with a free account.
 */
const WhyChooseUs: React.FC = () => {
  return (
    <section id="why-us" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="container mx-auto text-center mb-14">
          <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
            [pricing]
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
            Choose how you resell
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-5">
            Every plan starts with a free account — add funds and grow, or resell at your own margin.
          </p>
        </div>
      </Reveal>

      <div className="container mx-auto grid md:grid-cols-3 gap-6 max-w-6xl items-stretch">
        {plans.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 110} className="h-full">
          <div
            className={`rounded-3xl p-8 backdrop-blur-sm flex flex-col relative h-full ${
              plan.popular
                ? 'bg-brand-container border-2 border-brand-purple shadow-purple-glow'
                : 'bg-brand-container border border-brand-border'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-accent to-brand-purple text-white text-xs font-semibold px-4 py-1 rounded-full">
                Most popular
              </span>
            )}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{plan.audience}</p>
            <p className="text-2xl font-bold mt-5 text-brand-light-purple">{plan.price}</p>
            <ul className="flex flex-col gap-3 mt-7 flex-grow">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-green-400 font-bold shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href="/#/register"
              className={`mt-8 text-center font-semibold px-6 py-3 rounded-lg transition-all ${
                plan.popular
                  ? 'bg-gradient-to-r from-brand-accent to-brand-purple hover:opacity-90 shadow-purple-glow-sm text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              Get Started
            </a>
          </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={340}>
        <p className="text-center text-gray-400 text-sm mt-12 max-w-3xl mx-auto px-4">
          We accept: {paymentMethods.join(' · ')}
        </p>
      </Reveal>
    </section>
  );
};

export default WhyChooseUs;