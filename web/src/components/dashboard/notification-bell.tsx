'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Info, ShoppingBag, CreditCard, Gift, LifeBuoy, Network } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsAPI } from '@/lib/api';
import type { AppNotification, NotificationType } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const TYPE_ICON: Record<NotificationType, typeof Info> = {
  info: Info,
  order: ShoppingBag,
  payment: CreditCard,
  system: Info,
  referral: Gift,
  support: LifeBuoy,
  child: Network,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  info: 'text-blue-400 bg-blue-500/12',
  order: 'text-primary-300 bg-primary-500/12',
  payment: 'text-emerald-400 bg-emerald-500/12',
  system: 'text-amber-300 bg-amber-400/12',
  referral: 'text-fuchsia-300 bg-fuchsia-500/12',
  support: 'text-sky-300 bg-sky-500/12',
  child: 'text-violet-300 bg-violet-500/12',
};

const POLL_MS = 45_000;

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        notificationsAPI.list(15),
        notificationsAPI.unreadCount(),
      ]);
      if (!mounted.current) return;
      setItems(list);
      setUnread(count);
    } catch {
      /* auth/network blips must never break the topbar */
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    // Refetch when the user returns to the tab/window so new announcements,
    // chat replies and ticket responses surface without a 45s wait.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const onFocus = () => void refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      mounted.current = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const markAll = async () => {
    try {
      await notificationsAPI.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setUnread(0);
    } catch {
      /* non-critical */
    }
  };

  const openItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.read_at) {
      try {
        await notificationsAPI.markRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* non-critical */
      }
    }
    if (n.link) router.push(n.link);
  };

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) void refresh(); }}>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-muted-foreground transition-all hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink-950 bg-primary-500 px-1 text-[10px] font-bold text-white shadow-glow-xs">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] max-w-[calc(100vw-2rem)] p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-bold text-white">Notifications</span>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-300 hover:text-primary-200"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-muted-foreground">
              You&apos;re all caught up — notifications will appear here.
            </p>
          ) : (
            items.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Info;
              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => void openItem(n)}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', TYPE_COLOR[n.type])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn('truncate text-sm font-semibold', n.read_at ? 'text-muted-foreground' : 'text-white')}>
                        {n.title}
                      </span>
                      {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-400" />}
                    </span>
                    {n.body && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.body}</span>}
                    <span className="mt-1 block text-[10px] text-muted-foreground/70">{formatDateTime(n.created_at)}</span>
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
