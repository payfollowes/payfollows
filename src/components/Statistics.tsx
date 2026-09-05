import React from 'react';
import Reveal from './Reveal';

const stats = [
  { value: '0.001$', caption: 'Per 1k — starting price' },
  { value: '154,284,865', caption: 'Orders completed' },
  { value: '0.3s', caption: 'Average between orders' },
];

/**
 * Results — the template's "See the impact instantly" stat tiles.
 */
const Statistics: React.FC = () => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="container mx-auto text-center mb-14">
          <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
            [results]
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
            See the impact instantly
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-5">
            Faster orders, consistent quality and better margins — with numbers you can watch move.
          </p>
        </div>
      </Reveal>

      <Reveal delay={120}>
      <div className="container mx-auto max-w-5xl bg-brand-container border border-brand-border rounded-3xl p-8 sm:p-12 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {stats.map((stat) => (
            <div key={stat.caption} className="flex flex-col items-center gap-2">
              <p className="text-4xl sm:text-5xl font-bold text-brand-light-purple">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.caption}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-sm mt-12">
          50M+ active clients worldwide · 5,000+ live services on the panel
        </p>
      </div>
      </Reveal>
    </section>
  );
};

export default Statistics;