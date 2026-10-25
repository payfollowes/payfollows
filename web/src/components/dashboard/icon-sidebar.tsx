'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { USER_NAV, ADMIN_NAV, type NavItem } from '@/lib/constants';
import { toast } from 'sonner';

interface IconSidebarProps {
  variant: 'user' | 'admin';
}

function isActive(pathname: string, item: NavItem, variant: 'user' | 'admin') {
  return item.href === `/${variant}` ? pathname === item.href : pathname.startsWith(item.href);
}

function RowLabel({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'whitespace-nowrap text-sm font-semibold transition-opacity duration-200',
        expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      {children}
    </span>
  );
}

export function IconSidebar({ variant }: IconSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const nav = variant === 'admin' ? ADMIN_NAV : USER_NAV;
  const [expanded, setExpanded] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  const settingsHref = variant === 'admin' ? '/admin/settings' : '/dashboard/settings';

  return (
    <TooltipProvider delayDuration={150}>
      {/* Desktop rail — icon-only by default, expands to full labels on hover */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-[rgba(167,139,250,0.12)] bg-ink-900/95 backdrop-blur-2xl transition-[width,box-shadow] duration-300 ease-out lg:flex',
          expanded ? 'w-[264px] shadow-2xl' : 'w-[84px]'
        )}
      >
        {/* Brand */}
        <div className="flex h-[72px] shrink-0 items-center px-[18px]">
          <Link href="/" aria-label="PayFollows home" className="flex items-center">
            <LogoMark className="h-10 w-10 shrink-0 rounded-xl" />
            <span
              className={cn(
                'ml-3 whitespace-nowrap font-display text-lg font-bold tracking-tight text-white transition-opacity duration-200',
                expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
            >
              Pay<span className="gradient-text">Follows</span>
            </span>
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {nav.map((item) => {
            const active = isActive(pathname, item, variant);
            const Icon = item.icon;
            return (
              <Tooltip key={item.href} open={expanded ? false : undefined}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex h-11 items-center rounded-xl px-2 transition-all duration-200',
                      active
                        ? 'bg-primary-gradient text-white shadow-glow-brand'
                        : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                    </span>
                    <RowLabel expanded={expanded}>{item.label}</RowLabel>
                    {item.badge && !active && (
                      <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full bg-primary-400 shadow-glow-xs" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-3">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Settings + sign out — always visible, labels on expand */}
        <div className="shrink-0 space-y-1 border-t border-white/[0.07] p-3">
          <Tooltip open={expanded ? false : undefined}>
            <TooltipTrigger asChild>
              <Link
                href={settingsHref}
                aria-label="Settings"
                className={cn(
                  'flex h-11 items-center rounded-xl px-2 transition-all duration-200',
                  pathname === settingsHref
                    ? 'bg-white/[0.08] text-white'
                    : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <Settings className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <RowLabel expanded={expanded}>Settings</RowLabel>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-3">
              Settings
            </TooltipContent>
          </Tooltip>

          <Tooltip open={expanded ? false : undefined}>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="flex h-11 w-full items-center rounded-xl px-2 text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <LogOut className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <RowLabel expanded={expanded}>Sign out</RowLabel>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-3">
              Sign out
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 overflow-x-auto rounded-3xl border border-[rgba(167,139,250,0.14)] bg-ink-900/95 px-2 py-2 shadow-card backdrop-blur-2xl no-scrollbar lg:hidden">
        {nav.map((item) => {
          const active = isActive(pathname, item, variant);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex h-11 min-w-[44px] flex-1 shrink-0 items-center justify-center rounded-2xl transition-all',
                active
                  ? 'bg-primary-gradient text-white shadow-glow-brand'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
