'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Wallet,
  DollarSign,
  Sparkles,
  ArrowRight,
  Megaphone,
  ShoppingCart,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/dashboard/shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { announcementAPI, ordersAPI, servicesAPI } from '@/lib/api';
import type { Announcement, Order, Service } from '@/lib/types';
import { statusStyle } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';

export default function DashboardOverviewPage() {
  const { profile, refreshProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refreshProfile();
    Promise.all([
      ordersAPI.getOrders().catch(() => []),
      servicesAPI.getMergedServices().catch(() => []),
      announcementAPI.listActive().catch(() => []),
    ]).then(([o, s, a]) => {
      setOrders(o);
      setServices(s);
      setAnnouncements(a);
      setLoading(false);
    });
  }, [refreshProfile]);

  const popular = useMemo(() => services.filter((s) => s.status === 'active').slice(0, 6), [services]);
  const recent = orders.slice(0, 5);

  return (
    <DashboardShell variant="user" title={`Welcome back, ${profile?.username ?? 'friend'} 👋`}>
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard
              index={0}
              title="Total Orders"
              value={orders.length.toLocaleString()}
              subtitle="Orders all time"
              icon={ClipboardList}
              tone="purple"
            />
            <StatCard
              index={1}
              title="Total Spent"
              value={formatAmount(profile?.total_spent ?? 0)}
              subtitle="Lifetime spend"
              icon={DollarSign}
              tone="red"
            />
            <StatCard
              index={2}
              title="Active Balance"
              value={formatAmount(profile?.balance ?? 0)}
              subtitle="Available funds"
              icon={Wallet}
              tone="blue"
            />
            <StatCard
              index={3}
              title="Total Points"
              value="Coming Soon"
              subtitle="Loyalty rewards"
              icon={Sparkles}
              tone="amber"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent orders */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-8 w-8" />}
                title="No orders yet"
                desc="Place your first order and track its progress here."
                ctaHref="/dashboard/new-order"
                ctaLabel="New Order"
              />
            ) : (
              <div className="space-y-3">
                {recent.map((order) => {
                  const style = statusStyle(order.status);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {order.service?.name || order.service_id}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {formatDate(order.created_at)} · Qty {order.quantity}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold text-white">{formatAmount(order.charge)}</span>
                        <Badge className={style.className} variant="outline">
                          {style.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary-400" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : announcements.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                No announcements at the moment.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 4).map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{a.title}</p>
                      <Badge variant={a.severity === 'critical' ? 'destructive' : a.severity === 'warning' ? 'warning' : 'info'}>
                        {a.severity || 'info'}
                      </Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{a.content}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground/70">{formatDate(a.created_at)}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular services */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Popular Services</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/services">
              Browse catalog <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/dashboard/new-order?service=${encodeURIComponent(service.id)}`}
                    className="block h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-glow-sm"
                  >
                    <Badge variant="secondary" className="mb-3">
                      {service.category}
                    </Badge>
                    <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-white">{service.name}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display text-base font-bold text-primary-300">
                        {formatAmount(service.rate_per_1000)}
                        <span className="text-xs font-normal text-muted-foreground"> / 1K</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Min {service.min_quantity.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
