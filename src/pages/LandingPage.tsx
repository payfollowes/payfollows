import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Benefits from '../components/Benefits';
import Services from '../components/Services';
import Testimonials from '../components/Testimonials';
import Features from '../components/Features';
import Statistics from '../components/Statistics';
import WhyChooseUs from '../components/WhyChooseUs';
import Faq from '../components/Faq';
import Cta from '../components/Cta';
import Footer from '../components/Footer';
import type { User } from '../App';

interface LandingPageProps {
  currentUser: User | null;
  onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05020B] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_34%),radial-gradient(circle_at_82%_0%,_rgba(192,38,211,0.18),_transparent_28%),linear-gradient(135deg,_#05020B_0%,_#090411_38%,_#12071B_100%)]" />
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="absolute left-[-8rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-violet-500/15 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Header currentUser={currentUser} onLogout={onLogout} />
        <main className="pb-20">
          <Hero />
          <About />
          <Benefits />
          <Services />
          <Statistics />
          <Testimonials />
          <Features />
          <WhyChooseUs />
          <Faq />
          <Cta />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
