import React from 'react';
import Reveal from './Reveal';

const painPoints = [
  'Waiting on other panels to answer and deliver',
  'Re-ordering manually for every single client',
  'No delivery data, no margins, no trust to resell on',
];

const payfollowsFlow = [
  'Wholesale prices on 5,000+ live services',
  'Orders start in seconds and are tracked live',
  'Resell at your own margin with a free child panel',
];

/**
 * About — the template's "the difference" split: where growth stalls
 * vs. the PayFollows flow.
 */
const About: React.FC = () => {
  return (
    <section id="about" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="container mx-auto text-center mb-14">
          <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
            [the difference]
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
            Where social growth stalls, PayFollows begins
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-5">
            See how one balance replaces slow, manual ordering with instant, structured delivery
            across every major platform.
          </p>
        </div>
      </Reveal>

      <Reveal delay={120}>
      <div className="container mx-auto grid md:grid-cols-2 gap-8 max-w-5xl">
        <div className="bg-brand-container border border-brand-border rounded-3xl p-8 backdrop-blur-sm">
          <h3 className="text-2xl font-bold mb-6">Growth the hard way</h3>
          <ul className="flex flex-col gap-5">
            {painPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-gray-300">
                <span className="text-red-400 font-bold shrink-0">✗</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-brand-container border border-brand-purple/40 rounded-3xl p-8 backdrop-blur-sm shadow-purple-glow-sm">
          <h3 className="text-2xl font-bold mb-6">The PayFollows flow</h3>
          <ul className="flex flex-col gap-5">
            {payfollowsFlow.map((point) => (
              <li key={point} className="flex items-start gap-3 text-gray-300">
                <span className="text-green-400 font-bold shrink-0">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </Reveal>
    </section>
  );
};

export default About;