'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Grid3X3 } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORMS } from '@/lib/constants';
import { servicesAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { Service } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ServicesPage() {
  const { formatAmount } = useCurrency();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    servicesAPI
      .getMergedServices()
      .then((rows) => setServices(rows.filter((s) => s.status === 'active' && s.rate_per_1000 > 0)))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = services;
    if (platform !== 'all') rows = rows.filter((s) => s.category.includes(platform));
    if (search.trim()) rows = rows.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    return rows.slice(0, 60);
  }, [services, platform, search]);

  return (
    <DashboardShell variant="user" title="Services Catalog">
      <Card className="p-3 sm:p-4">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                platform === p.id
                  ? 'bg-primary-gradient text-white shadow-glow-sm'
                  : 'border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:text-white'
              )}
            >
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br text-[10px]', p.gradient)}>
                {p.emoji}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search thousands of services…"
          className="pl-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-14 text-center">
          <Grid3X3 className="mx-auto h-10 w-10 text-primary-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">No services match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another platform or keyword.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <Card key={service.id} className="card-hover flex flex-col p-5">
              <Badge variant="secondary" className="mb-3 w-fit">
                {service.category}
              </Badge>
              <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-white">{service.name}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Min {service.min_quantity.toLocaleString()}</span>
                <span>Max {service.max_quantity.toLocaleString()}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <div>
                  <p className="font-display text-lg font-bold text-primary-300">{formatAmount(service.rate_per_1000)}</p>
                  <p className="text-[10px] text-muted-foreground">per 1000</p>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/new-order?service=${encodeURIComponent(service.id)}`}>
                    <ShoppingCart className="h-4 w-4" /> Order
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
