import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/space-grotesk';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Providers as AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'PayFollows — Social Service Orders & Wallet',
  description:
    'Browse social media services, review order pricing and track provider-reported order status in your PayFollows dashboard.',
  keywords: ['social media services', 'social service orders', 'PayFollows'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://payfollows-web.vercel.app'),
  openGraph: {
    title: 'PayFollows — Social Service Orders & Wallet',
    description: 'Manage service orders, wallet activity and order status with PayFollows.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0712',
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
