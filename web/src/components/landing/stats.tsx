import { BookOpenCheck, CreditCard, ListChecks, Wallet } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';

const CAPABILITIES = [
  { icon: BookOpenCheck, title: 'Browse listed services', description: 'Review service details and quantity limits before ordering.' },
  { icon: Wallet, title: 'Use wallet balance', description: 'Order charges are shown before you confirm.' },
  { icon: ListChecks, title: 'Track each order', description: 'See status updates tied to your own order history.' },
  { icon: CreditCard, title: 'See live payment options', description: 'Only gateways currently configured are enabled at checkout.' },
];

export function StatsBand() {
  return (
    <section className="py-16">
      <div className="container">
        <Reveal>
          <div className="glow-panel grid gap-8 rounded-3xl border border-[rgba(167,139,250,0.14)] bg-ink-850/85 p-8 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-sm font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
