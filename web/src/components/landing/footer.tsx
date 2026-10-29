import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Services', href: '/#services' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Create account', href: '/register' },
      { label: 'Sign in', href: '/login' },
      { label: 'Order history', href: '/dashboard/orders' },
      { label: 'Add funds', href: '/dashboard/add-funds' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Support tickets', href: '/dashboard/support' },
      { label: 'Live chat', href: '/dashboard/live-chat' },
      { label: 'API access', href: '/dashboard/api' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="landing-footer pt-8">
      <div className="container">
        <div className="grid gap-10 border-t border-white/[0.09] py-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Manage social service orders, wallet activity and provider-reported status from one dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/75">{column.title}</h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/[0.07] py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PayFollows. All rights reserved.</p>
          <p>Service availability and terms can vary by provider.</p>
        </div>
      </div>
    </footer>
  );
}
