'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ClipboardList, DollarSign, Grid3X3, Clock, CheckCircle2, ArrowRight, LifeBuoy } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { Order, SupportTicket } from '@/lib/types';
import { statusStyle } from '@/lib/constants';
import { formatDateTime, truncateMiddle } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalServices: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function AdminOverviewPage() {
  const { formatAmount } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboardStats().catch(() => null),
      adminAPI.getAllOrders().catch(() => []),
      adminAPI.getAllTickets().catch(() => []),
    ]).then(([s, o, t]) => {
      setStats(s);
      setOrders(o);
      setTickets(t);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell variant="admin" title="Admin Overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard index={0} title="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} tone="purple" />
            <StatCard index={1} title="Total Orders" value={stats.totalOrders.toLocaleString()} icon={ClipboardList} tone="blue" />
            <StatCard index={2} title="Revenue" value={formatAmount(stats.totalRevenue)} icon={DollarSign} tone="green" />
            <StatCard index={3} title="Services" value={stats.totalServices.toLocaleString()} icon={Grid3X3} tone="amber" />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={<Clock className="h-5 w-5" strokeWidth={2.1} />} label="Pending Orders" value={stats?.pendingOrders ?? 0} loading={loading} tone="amber" />
        <MiniStat icon={<CheckCircle2 className="h-5 w-5" strokeWidth={2.1} />} label="Completed Orders" value={stats?.completedOrders ?? 0} loading={loading} tone="green" />
        <MiniStat icon={<LifeBuoy className="h-5 w-5" strokeWidth={2.1} />} label="Open Tickets" value={tickets.filter((t) => t.status === 'open').length} loading={loading} tone="blue" />
        <MiniStat icon={<DollarSign className="h-5 w-5" strokeWidth={2.1} />} label="Recent Orders" value={orders.length} loading={loading} tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Latest Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                Manage <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
            ) : (
              orders.slice(0, 6).map((order) => {
                const style = statusStyle(order.status);
                return (
                  <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl pf-card-inner px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{order.service?.name || order.service_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.user?.username || truncateMiddle(order.user_id, 10)} · {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold">{formatAmount(order.charge)}</span>
                      <Badge variant="outline" className={style.className}>{style.label}</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Open Tickets</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/support">View</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : tickets.filter((t) => t.status !== 'closed').slice(0, 5).length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                All caught up — no open tickets.
              </p>
            ) : (
              tickets
                .filter((t) => t.status !== 'closed')
                .slice(0, 5)
                .map((t) => (
                  <div key={t.id} className="rounded-xl pf-card-inner p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{t.subject}</p>
                      <Badge variant="info" className="capitalize shrink-0">{t.status.replace('-', ' ')}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.message}</p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function MiniStat({
  icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  tone: 'amber' | 'green' | 'blue' | 'purple';
}) {
  return (
    <div className={`pf-stat flex items-center gap-4 pf-stat-tone-${tone}`}>
      <span className={`pf-stat-icon pf-stat-icon-${tone}`}>{icon}</span>
      <div className="relative z-[1]">
        <p className="font-display text-2xl font-bold text-white tabular">{loading ? '—' : value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
