import React from 'react';
import Reveal from './Reveal';

const features = [
  {
    icon: '🛡️',
    title: 'Secure payments',
    description: 'PayPal, cards and crypto, plus Paytm, bKash, JazzCash and more — all on a secure gateway.',
    tagline: 'Your money stays safe.',
  },
  {
    icon: '📊',
    title: 'Real-time order data',
    description: 'Live status and delivery stats on every order — queued, running, partial or complete.',
    tagline: 'Know what is working.',
  },
  {
    icon: '🏆',
    title: 'Genuine quality',
    description: 'Services run from real accounts and stay within each platform’s terms and services.',
    tagline: 'Growth that protects your reputation.',
  },
  {
    icon: '🚀',
    title: 'Fastest delivery',
    description: 'Orders start within seconds of checkout — because in social growth, timing decides results.',
    tagline: 'Delivered before you close the tab.',
  },
];

/**
 * Features — the template's 4-card feature grid, carrying the PayFollows
 * benefit set (secure payments, real-time data, quality, speed).
 */
const Features: React.FC = () => {
  return (
    <section id="features" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="container mx-auto text-center mb-14">
          <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
            [features]
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
            Everything you need to grow on social
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-5">
            Buy, track and resell — faster, and without starting from scratch on every order.
          </p>
        </div>
      </Reveal>

      <div className="container mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 90} className="h-full">
          <div
            className="bg-brand-container border border-brand-border rounded-2xl p-7 backdrop-blur-sm flex flex-col h-full hover:border-purple-500/40 transition-colors"
          >
            <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-lg"></div>
              <div className="relative w-14 h-14 bg-black/30 rounded-full flex items-center justify-center border border-purple-500/30">
                <span className="text-2xl">{feature.icon}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold">{feature.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed mt-3 flex-grow">{feature.description}</p>
            <p className="text-brand-light-purple text-sm font-medium mt-4">{feature.tagline}</p>
          </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Features;