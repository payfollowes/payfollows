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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/dashboard/shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BalanceOverview } from '@/components/dashboard/fintech/balance-overview';
import { PromoCard } from '@/components/dashboard/fintech/promo-card';
import { SpendingCard } from '@/components/dashboard/fintech/spending-card';
import { WalletPanel } from '@/components/dashboard/fintech/wallet-panel';
import { RecentTransactions } from '@/components/dashboard/fintech/recent-transactions';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { announcementAPI, ordersAPI, servicesAPI } from '@/lib/api';
import type { Announcement, Order, Service } from '@/lib/types';
import { formatDate } from '@/lib/utils';

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

  return (
    <DashboardShell variant="user" title={`Welcome back, ${profile?.username ?? 'friend'} 👋`}>
      {/* ── Premium fintech composition: center workspace + right finance rail ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Center column */}
        <div className="space-y-6">
          {loading ? (
            <Skeleton className="h-[420px] rounded-3xl" />
          ) : (
            <BalanceOverview orders={orders} balance={profile?.balance ?? 0} formatAmount={formatAmount} />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PromoCard />
            {loading ? (
              <Skeleton className="h-[380px] rounded-3xl" />
            ) : (
              <SpendingCard orders={orders} formatAmount={formatAmount} />
            )}
          </div>

          {/* Popular services */}
          <Card className="rounded-3xl">
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
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : popular.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-400">
                    <ShoppingCart className="h-7 w-7" />
                  </span>
                  <p className="mt-4 font-display text-base font-semibold text-white">Services coming soon</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    The catalog is being prepared. Check back shortly.
                  </p>
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
                        className="pf-card-hover block h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
                      >
                        <Badge variant="secondary" className="mb-3">
                          {service.category}
                        </Badge>
                        <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-white">{service.name}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-display text-base font-bold text-primary-300 tabular">
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
        </div>

        {/* Right finance rail */}
        <div className="space-y-6">
          {loading ? (
            <Skeleton className="h-[420px] rounded-3xl" />
          ) : (
            <WalletPanel balance={profile?.balance ?? 0} formatAmount={formatAmount} />
          )}

          {loading ? (
            <Skeleton className="h-[360px] rounded-3xl" />
          ) : (
            <RecentTransactions orders={orders} formatAmount={formatAmount} />
          )}

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-[18px] w-[18px] text-primary-400" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 rounded-2xl" />
                  <Skeleton className="h-20 rounded-2xl" />
                </div>
              ) : announcements.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                  No announcements at the moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 3).map((a) => (
                    <div key={a.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{a.subject}</p>
                        <Badge variant={a.type === 'warning' ? 'warning' : a.type === 'success' ? 'success' : 'info'}>
                          {a.type || 'info'}
                        </Badge>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{a.message}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground/70">{formatDate(a.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Secondary SMM metrics ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <StatCard index={0} title="Total Orders" value={orders.length.toLocaleString()} subtitle="Orders all time" icon={ClipboardList} tone="purple" />
            <StatCard index={1} title="Total Spent" value={formatAmount(profile?.total_spent ?? 0)} subtitle="Lifetime spend" icon={DollarSign} tone="red" />
            <StatCard index={2} title="Active Balance" value={formatAmount(profile?.balance ?? 0)} subtitle="Available funds" icon={Wallet} tone="green" />
            <StatCard index={3} title="Total Points" value="Coming Soon" subtitle="Loyalty rewards" icon={Sparkles} tone="amber" />
          </>
        )}
      </div>
    </DashboardShell>
  );
}
