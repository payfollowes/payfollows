
import React from 'react';
import { BadgeCheck, BarChart3, ShieldCheck, Zap } from 'lucide-react';

const benefitItems = [
  {
    title: 'Secure payment flow',
    description: 'Deposit, withdraw, and manage transactions with payment methods and guardrails that feel reliable and effortless.',
    icon: ShieldCheck,
  },
  {
    title: 'Live metrics',
    description: 'Track orders, health, and growth in real time from one polished command center.',
    icon: BarChart3,
  },
  {
    title: 'Premium service quality',
    description: 'Every package is designed to stay safe, consistent, and compliant with platform expectations.',
    icon: BadgeCheck,
  },
  {
    title: 'Rapid execution',
    description: 'Fast processing and a clean workflow mean your orders move quickly without losing clarity.',
    icon: Zap,
  },
];

const BenefitCard: React.FC<{ icon: React.ElementType; title: string; description: string }> = ({ icon: Icon, title, description }) => (
  <div className="rounded-[24px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 text-left shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-fuchsia-400/30">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
    <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
  </div>
);

const Benefits: React.FC = () => {
  return (
    <section id="benefits" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">Advantages</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Why creators and resellers choose PayFollows.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefitItems.map((item, index) => (
            <BenefitCard key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
