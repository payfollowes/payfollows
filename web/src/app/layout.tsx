import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Providers as AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'PayFollows — Fastest & Cheapest Social Media Marketing Panel',
  description:
    'PayFollows is the #1 SMM panel for Instagram, TikTok, YouTube, Facebook and more. Fast delivery, cheapest prices, 24/7 support.',
  keywords: ['SMM panel', 'social media marketing', 'Instagram followers', 'TikTok views', 'YouTube subscribers'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://payfollows.vercel.app'),
  openGraph: {
    title: 'PayFollows — #1 SMM Panel',
    description: 'Fastest & cheapest social media marketing services.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#080b14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen">
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
