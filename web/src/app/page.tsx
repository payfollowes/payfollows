import { LandingNavbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { PlatformsMarquee } from '@/components/landing/platforms-marquee';
import { Features } from '@/components/landing/features';
import { ServicesShowcase } from '@/components/landing/services-showcase';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StatsBand } from '@/components/landing/stats';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { Faq } from '@/components/landing/faq';
import { CtaBanner } from '@/components/landing/cta';
import { LandingFooter } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip">
      <LandingNavbar />
      <Hero />
      <PlatformsMarquee />
      <ServicesShowcase />
      <StatsBand />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <Faq />
      <CtaBanner />
      <LandingFooter />
    </main>
  );
}
