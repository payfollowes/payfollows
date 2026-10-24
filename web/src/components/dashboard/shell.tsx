'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardSidebar } from './sidebar';
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-9 w-9 animate-spin text-primary-500" />
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    );
  }

  if (variant === 'admin' && profile?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Admin access required. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardSidebar variant={variant} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-72">
        <DashboardTopbar title={title} onMenu={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
