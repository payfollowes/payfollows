import React from 'react';
import Reveal from './Reveal';

const useCases = [
  {
    number: '001',
    title: 'For creators',
    description:
      'Grow your own accounts with views, likes and followers that arrive on schedule — no agency fees, no waiting lists.',
  },
  {
    number: '002',
    title: 'For agencies',
    description:
      'Run every client order from one balance with live stats you can screenshot and send. Results, not promises.',
  },
  {
    number: '003',
    title: 'For resellers',
    description:
      'Buy wholesale, set your own price and keep the margin — with a free child panel to run your own storefront.',
  },
];

/**
 * Use cases — the template's numbered 001/002/003 rows, mapped to the
 * three people PayFollows serves.
 */
const SmmPanelServices: React.FC = () => {
  return (
    <section id="reseller" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="container mx-auto max-w-4xl text-center mb-14">
          <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
            [use cases]
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
            Built for how you actually sell
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-5">
            Whether you grow one account or a whole portfolio of clients, PayFollows adapts to your
            workflow.
          </p>
        </div>
      </Reveal>

      <div className="container mx-auto max-w-4xl flex flex-col gap-4">
        {useCases.map((item, index) => (
          <Reveal key={item.number} delay={index * 100}>
          <div
            className="bg-brand-container border border-brand-border rounded-2xl p-7 sm:p-8 backdrop-blur-sm hover:border-purple-500/40 transition-colors grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 items-start"
          >
            <span className="text-2xl font-bold text-brand-light-purple/60">{item.number}</span>
            <div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-gray-300 mt-2 leading-relaxed">{item.description}</p>
            </div>
          </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default SmmPanelServices;