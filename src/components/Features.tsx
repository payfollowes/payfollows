
import React from 'react';
import { MessageCircle, Shield, Rocket, Sparkles } from 'lucide-react';

const features = [
  { title: '24/7 support', description: 'Get real help when something matters, with rapid replies and guided responses across every shipment.', icon: MessageCircle },
  { title: 'Trusted security', description: 'A practical, polished environment where wallet control, access security, and protection stay front and center.', icon: Shield },
  { title: 'Fast launches', description: 'Start campaigns instantly, manage the details, and keep everything moving with minimal friction.', icon: Rocket },
  { title: 'Growth-ready experience', description: 'Whether you are scaling a personal brand or operating as a reseller, the dashboard is designed to keep pace.', icon: Sparkles },
];

const Features: React.FC = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="rounded-[24px] border border-white/10 bg-black/25 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
