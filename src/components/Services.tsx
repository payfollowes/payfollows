import React, { useState } from 'react';
import { Play, MessageCircle, Radio, Music2, Send, Globe2 } from 'lucide-react';

const servicesTabs = [
  { name: 'Youtube', icon: Play },
  { name: 'Twitter', icon: MessageCircle },
  { name: 'Linkedin', icon: Globe2 },
  { name: 'Telegram', icon: Send },
  { name: 'Spotify', icon: Music2 },
  { name: 'Soundcloud', icon: Radio },
];

const serviceContent = {
  Youtube: {
    title: 'YouTube growth suite',
    description: 'Launch views, likes, subscribers and shares from a focused delivery panel designed to support viral momentum.',
  },
  Twitter: {
    title: 'Twitter reach engine',
    description: 'Push visibility with followers, likes and retweets that keep your message circulating across the feed.',
  },
  Linkedin: {
    title: 'LinkedIn authority flow',
    description: 'Build network traction through profiles, company followers, and engagement that keeps your presence rising.',
  },
  Telegram: {
    title: 'Telegram community boost',
    description: 'Grow communities with members, views and engagement that keep your channel active and trusted.',
  },
  Spotify: {
    title: 'Spotify discovery layer',
    description: 'Increase plays, followers and playlist reach with campaigns tailored for music discovery.',
  },
  Soundcloud: {
    title: 'SoundCloud momentum',
    description: 'Spark new plays, likes and reposts to help each release reach a wider audience quickly.',
  },
};

const Services: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Youtube');
  const activeService = serviceContent[activeTab as keyof typeof serviceContent];

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-[rgba(20,18,30,0.65)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-300">Service suite</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Pick the channel that needs momentum.</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {servicesTabs.map(({ name, icon: Icon }) => (
            <button key={name} onClick={() => setActiveTab(name)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === name ? 'bg-gradient-to-r from-[#7E22CE] to-[#C026D3] text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]' : 'border border-white/10 bg-white/10 text-slate-300 hover:bg-white/20'}`}>
              <Icon className="h-4 w-4" /> {name}
            </button>
          ))}
        </div>
        <div className="mt-8 rounded-[24px] border border-white/10 bg-black/25 p-8 text-center">
          <h3 className="text-2xl font-semibold text-white">{activeService.title}</h3>
          <p className="mx-auto mt-3 max-w-3xl text-lg leading-8 text-slate-400">{activeService.description}</p>
        </div>
      </div>
    </section>
  );
};

export default Services;
