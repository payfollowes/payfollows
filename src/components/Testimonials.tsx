import React from 'react';
import Reveal from './Reveal';
import { getAvatarDataUri } from '../lib/avatar';

const testimonials = [
  {
    rating: '4.9',
    quote:
      'Orders land in minutes and the support team answers at 2am. I resell at my own price and keep the margin.',
    name: 'Melissa Smith',
    role: 'Reseller',
  },
  {
    rating: '5.0',
    quote:
      'We run every client order through PayFollows. The live stats mean I can show results instead of promising them.',
    name: 'Michael John',
    role: 'Agency owner',
  },
  {
    rating: '5.0',
    quote:
      'Release day plays used to be a gamble. Now I drop the link and watch the streams climb.',
    name: 'Isabella',
    role: 'Creator',
  },
];

/**
 * Testimonials — the template's rating quote cards, using the existing
 * PayFollows client scenarios.
 */
const Testimonials: React.FC = () => {
  return (
    <section id="reviews" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <Reveal>
        <div className="container mx-auto text-center mb-14">
          <span className="inline-block bg-purple-500/20 text-brand-light-purple px-4 py-1 rounded-full text-sm font-medium border border-purple-500/30">
            [testimonials]
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mt-6">
            Loved by creators and resellers
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mt-5">
            From solo creators to agencies — people grow faster with PayFollows, without sacrificing
            quality or consistency.
          </p>
        </div>
      </Reveal>

      <div className="container mx-auto grid md:grid-cols-3 gap-6 max-w-6xl">
        {testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.name} delay={index * 100} className="h-full">
          <figure
            className="bg-brand-container border border-brand-border rounded-2xl p-7 backdrop-blur-sm flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-brand-light-purple">
                  {testimonial.rating}
                </span>
                <span className="text-brand-light-purple/60 text-sm tracking-wider">★★★★★</span>
              </div>
              <blockquote className="text-gray-300 mt-4 leading-relaxed">
                “{testimonial.quote}”
              </blockquote>
            </div>
            <figcaption className="flex items-center gap-3.5 mt-6 pt-5 border-t border-brand-border">
              <img
                src={getAvatarDataUri(testimonial.name)}
                alt=""
                className="w-11 h-11 rounded-full border-2 border-brand-purple"
                loading="lazy"
                decoding="async"
              />
              <div>
                <div className="font-semibold text-white">{testimonial.name}</div>
                <div className="text-sm text-gray-400">{testimonial.role}</div>
              </div>
            </figcaption>
          </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;