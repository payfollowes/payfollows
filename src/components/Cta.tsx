import React from 'react';
import Reveal from './Reveal';

/**
 * Cta — the template's "ready to start?" closing section.
 */
const Cta: React.FC = () => {
  return (
    <section id="get-started" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
      <div className="container mx-auto text-center max-w-3xl relative">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(138,43,226,0.3),rgba(255,255,255,0))] -z-10"></div>
        <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
          [ready to start?]
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
          Start growing today
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto mt-6 mb-10">
          Create a free account, add funds, and watch the numbers arrive. Instant delivery,
          wholesale pricing and 24/7 support — without the long workflows.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/#/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-accent to-brand-purple hover:opacity-90 transition-opacity text-white font-semibold px-8 py-4 rounded-lg shadow-purple-glow"
          >
            Get Started
          </a>
          <a
            href="/#/login"
            className="bg-white/10 hover:bg-white/20 transition-colors text-white font-semibold px-8 py-4 rounded-lg border border-white/10"
          >
            Try Demo — Sign In
          </a>
        </div>
      </div>
      </Reveal>
    </section>
  );
};

export default Cta;