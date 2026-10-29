import { Navbar, Hero, Testimonials, WhyChoose, CheapPanel } from "./components/TopSections";
import { Payments, HowWorks, Services, Worldwide, LearnVideo, Advantages, Comparison, FAQ, Blog, Footer, TelegramJoin } from "./components/BottomSections";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Testimonials />
        <WhyChoose />
        <CheapPanel />
        <Payments />
        <HowWorks />
        <Services />
        <Worldwide />
        <LearnVideo />
        <Advantages />
        <Comparison />
        <FAQ />
        <Blog />
      </main>
      <Footer />
      <TelegramJoin />
    </>
  );
}
