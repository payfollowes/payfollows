'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';
import { Star, Quote } from 'lucide-react';
import { SectionHeading } from './features';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const REVIEWS = [
  {
    name: 'Ayesha Khan',
    role: 'Beauty Influencer',
    text: 'My Instagram grew 40K followers in two months. Delivery starts instantly and the refill guarantee actually works. Best panel I have used.',
  },
  {
    name: 'Daniel Carter',
    role: 'Agency Owner',
    text: 'We resell PayFollows services to 60+ clients. The API is rock solid, margins are great and support replies within minutes every single time.',
  },
  {
    name: 'Bilal Ahmed',
    role: 'TikTok Creator',
    text: 'Cheapest TikTok views I could find with real retention. My videos hit the For You page consistently after the first boost.',
  },
  {
    name: 'Maria Lopez',
    role: 'YouTube Creator',
    text: 'Watch hours and subscribers delivered exactly as promised. The dashboard makes tracking every order effortless. Highly recommended.',
  },
  {
    name: 'Hamza Sheikh',
    role: 'E-commerce Marketer',
    text: 'Deposits are instant, prices are transparent and there are no hidden fees. The new order form takes literally 30 seconds.',
  },
];

export function Testimonials() {
  const autoplay = useRef(
    Autoplay({ delay: 3800, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [autoplay.current]);

  return (
    <section id="reviews" className="py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by creators and agencies"
          subtitle="Real feedback from thousands of customers scaling their social presence every day."
        />

        <div className="mt-14 overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5 px-1">
            {REVIEWS.map((review) => (
              <article
                key={review.name}
                className="shrink-0 grow-0 basis-full sm:basis-[46%] lg:basis-[31.5%] rounded-3xl border border-[rgba(167,139,250,0.12)] bg-ink-850/85 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-500/40 hover:shadow-card-hover"
              >
                <Quote className="h-8 w-8 text-primary-500/50" />
                <div className="mt-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/85">{review.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{review.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
