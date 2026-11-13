'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, Globe2, LogOut, MoreHorizontal, Plus, Settings, MessageSquare, Wallet } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const mobilePrimary = nav.slice(0, 5);
  const mobileMore = nav.slice(5);
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

      {/* Mobile user nav: dark glass dock with a raised, branded Add Order action. */}
      {variant === 'user' ? (
        <nav aria-label="Mobile navigation" className="mobile-action-nav fixed inset-x-3 z-40 grid h-[68px] grid-cols-5 items-center rounded-[26px] border border-[rgba(167,139,250,0.16)] bg-ink-900/95 px-2 shadow-card backdrop-blur-2xl lg:hidden">
          <Link
            href="/dashboard"
            aria-label="Dashboard"
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
            className={cn('flex h-11 items-center justify-center rounded-2xl transition-colors', pathname === '/dashboard' ? 'bg-primary-500/15 text-primary-300' : 'text-muted-foreground hover:bg-white/[0.06] hover:text-white')}
          >
            <Globe2 className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </Link>
          <Link
            href="/dashboard/add-funds"
            aria-label="Add funds"
            aria-current={isActive(pathname, USER_NAV[4], 'user') ? 'page' : undefined}
            className={cn('flex h-11 items-center justify-center rounded-2xl transition-colors', isActive(pathname, USER_NAV[4], 'user') ? 'bg-primary-500/15 text-primary-300' : 'text-muted-foreground hover:bg-white/[0.06] hover:text-white')}
          >
            <Wallet className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </Link>
          <span aria-hidden="true" className="h-11" />
          <Link
            href="/dashboard/live-chat"
            aria-label="Live chat"
            aria-current={isActive(pathname, USER_NAV[7], 'user') ? 'page' : undefined}
            className={cn('flex h-11 items-center justify-center rounded-2xl transition-colors', isActive(pathname, USER_NAV[7], 'user') ? 'bg-primary-500/15 text-primary-300' : 'text-muted-foreground hover:bg-white/[0.06] hover:text-white')}
          >
            <MessageSquare className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </Link>
          <Link
            href="/dashboard/orders"
            aria-label="Orders"
            aria-current={isActive(pathname, USER_NAV[2], 'user') ? 'page' : undefined}
            className={cn('flex h-11 items-center justify-center rounded-2xl transition-colors', isActive(pathname, USER_NAV[2], 'user') ? 'bg-primary-500/15 text-primary-300' : 'text-muted-foreground hover:bg-white/[0.06] hover:text-white')}
          >
            <ClipboardList className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </Link>
          <Link
            href="/dashboard/new-order"
            aria-label="Add order"
            title="Add order"
            aria-current={isActive(pathname, USER_NAV[1], 'user') ? 'page' : undefined}
            className="absolute left-1/2 top-[-17px] flex h-[82px] w-[80px] -translate-x-1/2 flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            <span className="flex h-[58px] w-[58px] items-center justify-center rounded-[20px] border border-white/15 bg-primary-gradient text-white shadow-glow-brand ring-4 ring-ink-900 transition-transform active:scale-95">
              <Plus className="h-7 w-7" strokeWidth={1.9} />
            </span>
            <span className="mt-1 text-[10px] font-semibold leading-none text-muted-foreground">Add order</span>
          </Link>
        </nav>
      ) : (
        <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 rounded-3xl border border-[rgba(167,139,250,0.14)] bg-ink-900/95 px-1.5 py-2 shadow-card backdrop-blur-2xl lg:hidden">
          {mobilePrimary.map((item) => {
            const active = isActive(pathname, item, variant);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 min-w-0 flex-1 items-center justify-center rounded-2xl transition-all',
                  active
                    ? 'bg-primary-gradient text-white shadow-glow-brand'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More navigation options"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="max-h-[70dvh] w-64 overflow-y-auto">
              <DropdownMenuLabel>More pages</DropdownMenuLabel>
              {mobileMore.map((item) => {
                const active = isActive(pathname, item, variant);
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild className={active ? 'bg-primary-500/15 text-white' : ''}>
                    <Link href={item.href} aria-current={active ? 'page' : undefined}>
                      <Icon aria-hidden="true" /> {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void handleSignOut()} className="text-red-400 focus:text-red-400">
                <LogOut aria-hidden="true" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      )}
    </TooltipProvider>
  );
}
