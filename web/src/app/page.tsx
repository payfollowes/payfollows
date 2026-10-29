import { LandingNavbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ServicesShowcase } from '@/components/landing/services-showcase';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { Pricing } from '@/components/landing/pricing';
import { Faq } from '@/components/landing/faq';
import { CtaBanner } from '@/components/landing/cta';
import { LandingFooter } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-clip">
      <div className="landing-page-thread" aria-hidden="true">
        <span />
      </div>
      <LandingNavbar />
      <Hero />
      <ServicesShowcase />
      <HowItWorks />
      <Features />
      <Pricing />
      <Faq />
      <CtaBanner />
      <LandingFooter />
    </main>
  );
}
