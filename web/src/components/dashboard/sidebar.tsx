'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X, Gift } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { USER_NAV, ADMIN_NAV, type NavItem } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SidebarProps {
  variant: 'user' | 'admin';
  mobileOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ variant, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { formatAmount } = useCurrency();
  const nav: NavItem[] = variant === 'admin' ? ADMIN_NAV : USER_NAV;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/[0.07] bg-[#0c1020]/95 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-[72px] items-center justify-between px-6">
          <Logo />
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile mini card */}
        <div className="mx-4 mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback>{(profile?.username || user?.username || 'U').slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile?.username || user?.username}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-semibold text-primary-300">
                {variant === 'admin' ? 'Administrator' : 'Member'}
              </span>
            </div>
          </div>
          {variant === 'user' && (
            <div className="mt-3 rounded-xl bg-primary-gradient/10 border border-primary-500/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance</p>
              <p className="font-display text-base font-bold text-white">
                {formatAmount(profile?.balance ?? 0)}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 no-scrollbar">
          {nav.map((item) => {
            const active =
              item.href === `/${variant}`
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary-gradient text-white shadow-glow-sm'
                    : 'text-muted-foreground hover:bg-white/[0.05] hover:text-white'
                )}
              >
                <item.icon className={cn('h-[18px] w-[18px]', active ? 'text-white' : 'text-current opacity-80')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bonus card */}
        {variant === 'user' && (
          <div className="mx-4 mb-4 rounded-2xl border border-primary-500/25 bg-primary-500/[0.08] p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary-400" />
              <p className="text-xs font-semibold text-white">Referral Bonus</p>
            </div>
            <p className="mt-2 font-display text-xl font-bold text-white">
              {formatAmount(2.5)} <span className="text-xs font-normal text-muted-foreground">per referral</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-primary-gradient" />
            </div>
            <Link href="/dashboard/api" className="mt-2 block text-[11px] font-medium text-primary-300 hover:text-primary-200">
              See details →
            </Link>
          </div>
        )}

        <div className="border-t border-white/[0.07] p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
