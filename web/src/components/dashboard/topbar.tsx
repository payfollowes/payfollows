'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { USER_NAV, ADMIN_NAV } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NotificationBell } from './notification-bell';

interface TopbarProps {
  variant: 'user' | 'admin';
}

interface SearchResult {
  label: string;
  href: string;
  icon: LucideIcon;
  hint: string;
}

export function DashboardTopbar({ variant }: TopbarProps) {
  const { user, profile, signOut } = useAuth();
  const { currency, setCurrency, currencies, formatAmount } = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const nav = variant === 'admin' ? ADMIN_NAV : USER_NAV;
  const inputRef = useRef<HTMLInputElement>(null);

  const pageTitle = useMemo(() => {
    const match = nav
      .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (match) return match.label;
    const seg = pathname.split('/').filter(Boolean).pop() ?? 'Dashboard';
    return seg
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [pathname, nav]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    const base: SearchResult[] = nav.map((i) => ({
      label: i.label,
      href: i.href,
      icon: i.icon,
      hint: 'Go to page',
    }));
    if (!q) return base.slice(0, 6);
    return base.filter((r) => r.label.toLowerCase().includes(q));
  }, [query, nav]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[0]) {
      go(results[0].href);
    } else if (variant === 'user') {
      router.push(`/dashboard/services?q=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const handleRefresh = () => {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 900);
    toast.success('Workspace refreshed');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  const initial = (profile?.username || user?.username || 'U').slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(167,139,250,0.10)] bg-ink-950/75 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Current page title — lives in the topbar instead of repeating above content */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <span className="h-8 w-1.5 rounded-full bg-primary-gradient shadow-glow-xs" />
          <h1 className="whitespace-nowrap font-display text-lg font-bold tracking-tight text-white">
            {pageTitle}
          </h1>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative min-w-0 flex-1">
          <form onSubmit={onSearchSubmit}>
            <div className="group flex h-12 max-w-xl items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 transition-all focus-within:border-primary-500/50 focus-within:shadow-glow-xs">
              <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search PayFollows"
              />
              <kbd className="hidden shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
                Ctrl + Space
              </kbd>
            </div>
          </form>

          {open && (
            <div className="absolute left-0 right-0 top-[52px] z-50 max-w-xl overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.16)] bg-ink-900/95 p-2 shadow-card backdrop-blur-2xl">
              {results.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No matches — press Enter to search services
                </p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.href}
                    onClick={() => go(r.href)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                      <r.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{r.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{r.hint}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Balance pill (mobile hides) */}
        {profile && variant === 'user' && (
          <div className="hidden items-center gap-2 rounded-2xl border border-primary-500/25 bg-primary-500/10 px-4 py-2.5 xl:flex">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Balance
            </span>
            <span className="font-display text-sm font-bold text-white tabular">{formatAmount(profile.balance)}</span>
          </div>
        )}

        {/* Icon actions */}
        <button
          onClick={handleRefresh}
          aria-label="Refresh"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-muted-foreground transition-all hover:text-foreground"
        >
          <RefreshCw className={cn('h-[18px] w-[18px]', spinning && 'animate-spin')} />
        </button>

        <NotificationBell />

        <button
          onClick={() => toast('Dark mode is curated for the PayFollows experience', { icon: <Moon className="h-4 w-4 text-primary-300" /> })}
          aria-label="Theme"
          className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-muted-foreground transition-all hover:text-foreground sm:flex"
        >
          <Moon className="h-[18px] w-[18px]" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] py-1.5 pl-1.5 pr-2.5 outline-none transition-all hover:bg-white/[0.08] sm:pr-3.5">
            <Avatar className="h-9 w-9 ring-2 ring-primary-500/40">
              <AvatarFallback className="bg-primary-gradient text-xs text-white">{initial}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <p className="max-w-[130px] truncate text-xs font-bold text-white">
                {profile?.username || user?.username || 'PayFollows user'}
              </p>
              <p className="text-[10px] font-medium capitalize text-muted-foreground">
                @{(profile?.username || user?.username || 'user').toLowerCase().replace(/\s+/g, '_')}
              </p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <p className="text-sm font-bold text-white">{profile?.username || user?.username}</p>
              <p className="text-[11px] font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')}
            >
              <LayoutDashboard /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(variant === 'admin' ? '/admin/settings' : '/dashboard/settings')}
            >
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(variant === 'admin' ? '/admin/support' : '/dashboard/support')}>
              <LifeBuoy /> Support
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Currency · {currency}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                {currencies.map((c) => (
                  <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)}>
                    {c.symbol} {c.code}
                    {currency === c.code && <Check className="ml-auto h-3.5 w-3.5 text-primary-300" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400">
              <LogOut /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
