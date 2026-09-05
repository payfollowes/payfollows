import React from 'react';
import Reveal from './Reveal';

const exampleServices = [
  {
    platform: 'YouTube',
    tags: ['Views', 'Subscribers', 'Watch time'],
    description:
      'Grow watch hours and channel authority with real-account views, likes and subscribers.',
    footer: 'Starts in seconds',
  },
  {
    platform: 'Instagram',
    tags: ['Followers', 'Likes', 'Story views'],
    description:
      'Followers and engagement from genuine profiles, with country targeting on most services.',
    footer: 'Starts in seconds',
  },
  {
    platform: 'TikTok',
    tags: ['Views', 'Followers', 'Likes'],
    description:
      'Short-form reach that rides the For You page — drop a link and watch it climb.',
    footer: 'Starts in seconds',
  },
];

/**
 * Services — the template's "examples" cards: platform, tags, description.
 */
const Services: React.FC = () => {
  return (
    <section id="services" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="container mx-auto text-center mb-14">
          <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
            [services]
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
            See what you can order right now
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-5">
            From short-form reach to long-form authority — services tailored to any channel, ready
            the moment you place an order.
          </p>
        </div>
      </Reveal>

      <div className="container mx-auto grid md:grid-cols-3 gap-6 max-w-6xl">
        {exampleServices.map((service, index) => (
          <Reveal key={service.platform} delay={index * 90} className="h-full">
          <div
            className="bg-brand-container border border-brand-border rounded-2xl p-7 backdrop-blur-sm flex flex-col h-full hover:border-purple-500/40 transition-colors"
          >
            <h3 className="text-2xl font-bold">{service.platform}</h3>
            <div className="flex flex-wrap gap-2 mt-4">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/10 text-gray-300 rounded-md px-2.5 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mt-5 flex-grow">
              {service.description}
            </p>
            <p className="text-brand-light-purple text-sm font-medium mt-5">{service.footer}</p>
          </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Services;