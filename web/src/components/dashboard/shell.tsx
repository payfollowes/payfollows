'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { IconSidebar } from './icon-sidebar';
import { DashboardTopbar } from './topbar';
import { useAuth } from '@/lib/auth';

interface DashboardShellProps {
  variant: 'user' | 'admin';
  title: string;
  children: React.ReactNode;
}

export function DashboardShell({ variant, title, children }: DashboardShellProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (variant === 'admin' && profile && profile.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, user, profile, variant, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </span>
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    );
  }

  if (variant === 'admin' && profile?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6 text-center">
        <p className="text-sm text-muted-foreground">Admin access required. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <IconSidebar variant={variant} />

      <div className="lg:pl-[84px]">
        <DashboardTopbar variant={variant} />

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mx-auto max-w-[1440px] space-y-6">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-primary-gradient shadow-glow-xs" />
              <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{title}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
