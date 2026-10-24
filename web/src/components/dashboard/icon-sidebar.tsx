'use client';

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

function RailItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          onClick={onClick}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300',
            active
              ? 'bg-primary-gradient text-white shadow-glow-brand'
              : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
          {item.badge && !active && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-400 shadow-glow-xs" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="ml-3">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function IconSidebar({ variant }: IconSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const nav = variant === 'admin' ? ADMIN_NAV : USER_NAV;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  const settingsHref = variant === 'admin' ? '/admin/settings' : '/dashboard/support';

  return (
    <TooltipProvider delayDuration={150}>
      {/* Desktop fixed icon rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[84px] flex-col items-center border-r border-[rgba(167,139,250,0.12)] bg-ink-900/80 py-5 backdrop-blur-2xl lg:flex">
        <Link href="/" aria-label="PayFollows home" className="mb-8">
          <LogoMark className="h-11 w-11 rounded-2xl" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-2.5">
          {nav.map((item) => (
            <RailItem
              key={item.href}
              item={item}
              active={isActive(pathname, item, variant)}
            />
          ))}
        </nav>

        <div className="flex flex-col items-center gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={settingsHref}
                aria-label="Settings"
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground"
              >
                <Settings className="h-5 w-5" strokeWidth={1.8} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-3">
              Settings
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.8} />
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
