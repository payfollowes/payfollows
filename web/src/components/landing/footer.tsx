import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

const COLUMNS = [
  {
    title: 'Platforms',
    links: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Telegram', 'Spotify'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Blog', 'Terms of Service', 'Privacy Policy', 'Refund Policy'],
  },
  {
    title: 'Support',
    links: ['Contact Us', 'FAQ', 'API Docs', 'Order Status', 'Live Chat'],
  },
];

export function LandingFooter() {
  return (
    <footer className="pb-10">
      <div className="container">
        <div className="relative overflow-hidden rounded-[32px] border border-[rgba(167,139,250,0.14)] bg-ink-900/90 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-600/20 blur-3xl" />

          <div className="relative p-8 sm:p-12">
            <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
              <div>
                <Logo />
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Helping creators launch faster with high-converting social growth. Real engagement,
                  instant delivery and 24/7 human support across every major platform.
                </p>
                <div className="mt-6 flex gap-3">
                  {['𝕏', 'in', 'ig', 'tg'].map((s) => (
                    <span
                      key={s}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-muted-foreground transition-all hover:border-primary-500/40 hover:text-white"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {COLUMNS.map((col) => (
                  <div key={col.title}>
                    <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                      {col.title}
                    </h4>
                    <ul className="mt-5 space-y-3">
                      {col.links.map((link) => (
                        <li key={link}>
                          <Link
                            href="/#"
                            className="text-sm text-muted-foreground transition-colors hover:text-primary-300"
                          >
                            {link}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-8 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} PayFollows. All rights reserved.
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Made with <Heart className="h-3.5 w-3.5 fill-primary-400 text-primary-400" /> for creators worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
