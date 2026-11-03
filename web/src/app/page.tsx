import { LandingNavbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ServicesShowcase } from '@/components/landing/services-showcase';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { PaymentsOverview, GlobalPlatforms } from '@/components/landing/landing-experience';
import { OrderPreview, WhyPayFollows, ProductWalkthrough, ProductBoundaries, SupportSpotlight, FloatingHelp } from '@/components/landing/landing-reference-sections';
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
      <OrderPreview />
      <WhyPayFollows />
      <Pricing />
      <PaymentsOverview />
      <HowItWorks />
      <ServicesShowcase />
      <GlobalPlatforms />
      <ProductWalkthrough />
      <Features />
      <ProductBoundaries />
      <Faq />
      <SupportSpotlight />
      <CtaBanner />
      <LandingFooter />
      <FloatingHelp />
    </main>
  );
}
