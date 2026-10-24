import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_50%_45%_at_50%_45%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-700/20 blur-[110px]" />
      <p className="relative font-display text-7xl font-bold gradient-text">404</p>
      <h1 className="relative mt-4 font-display text-2xl font-bold text-white">Page not found</h1>
      <p className="relative mt-2 max-w-sm text-sm text-muted-foreground">
        The page you are looking for moved, was removed, or never existed.
      </p>
      <div className="relative mt-8 flex gap-3">
        <Button asChild>
          <Link href="/">
            <Home /> Go Home
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard">
            <ArrowLeft /> Dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}
