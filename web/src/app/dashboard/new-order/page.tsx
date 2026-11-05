'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Heart,
  Info,
  RefreshCw,
  Link2,
  Hash,
  Gauge,
  Timer,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PLATFORMS } from '@/lib/constants';
import { PlatformBrandIcon } from '@/components/shared/platform-icon';
import { ordersAPI, servicesAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import type { Order, Service } from '@/lib/types';
import { cn } from '@/lib/utils';

function NewOrderInner() {
  const params = useSearchParams();
  const { profile, refreshProfile } = useAuth();
  const { formatAmount } = useCurrency();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderNeedsReview, setOrderNeedsReview] = useState<Order | null>(null);

  const preselectedServiceId = params.get('service');

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    ordersAPI.getOrders().then((orders) => {
      if (!active) return;
      const unresolved = orders.find((order) =>
        ['pending', 'processing'].includes(order.status) && !order.provider_order_id
      );
      if (unresolved) setOrderNeedsReview(unresolved);
    }).catch((error) => {
      console.warn('[NewOrder] Could not check unresolved orders before checkout', error);
    });
    return () => { active = false; };
  }, [profile?.id]);

  useEffect(() => {
    let active = true;
    let baseLoaded = false;
    const applyServices = (rows: Service[]) => {
      const available = rows.filter((s) => s.status === 'active' && s.rate_per_1000 > 0);
      setServices(available);
      if (preselectedServiceId) {
        const svc = available.find((s) => s.id === preselectedServiceId);
        if (svc) {
          setServiceId(svc.id);
          setCategory(svc.category);
        }
      }
    };

    // Render the main catalog as soon as the base service endpoint responds.
    // Provider pricing/details are merged in the background so a slow provider
    // snapshot cannot keep the whole New Order screen on skeletons.
    servicesAPI.getServices().then((rows) => {
      if (!active) return;
      baseLoaded = true;
      applyServices(rows);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      baseLoaded = true;
      setLoading(false);
    });

    servicesAPI.getMergedServices().then((rows) => {
      if (!active) return;
      applyServices(rows);
      setLoading(false);
    }).catch(() => {
      if (active && !baseLoaded) {
        setLoading(false);
        toast.error('Failed to load services');
      }
    });

    return () => { active = false; };
  }, [preselectedServiceId]);

  const matchesPlatform = (service: Service, id: string) => {
    if (id === 'all') return true;
    const value = service.category.toLowerCase();
    const platformName = id.toLowerCase();
    return value.includes(platformName) || (id === 'Twitter' && /(^|[^a-z])x([^a-z]|$)/.test(value));
  };

  const categories = useMemo(() => {
    const filtered = services.filter((service) => matchesPlatform(service, platform));
    return Array.from(new Set(filtered.map((s) => s.category))).sort();
  }, [services, platform]);

  const visibleServices = useMemo(() => {
    let rows = services.filter((service) => matchesPlatform(service, platform));
    if (category) rows = rows.filter((s) => s.category === category);
    if (search.trim()) rows = rows.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    return rows.slice(0, 300);
  }, [services, platform, category, search]);

  const selected = useMemo(() => services.find((s) => s.id === serviceId) || null, [services, serviceId]);
  const selectedInCurrentFilter = selected ? visibleServices.some((s) => s.id === selected.id) : false;
  const serviceOptions = selected && !selectedInCurrentFilter
    ? [selected, ...visibleServices]
    : visibleServices;

  const qty = Number(quantity) || 0;
  const charge = selected && qty > 0 ? (selected.rate_per_1000 / 1000) * qty : 0;
  const quantityValid = selected ? qty >= selected.min_quantity && qty <= selected.max_quantity : false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNeedsReview) {
      return toast.error(`Order #${orderNeedsReview.id} needs review first. Please check Order History before placing another.`);
    }
    if (!selected) return toast.error('Please select a service');
    if (!link.trim()) return toast.error('Please enter your content link');
    if (!quantityValid)
      return toast.error(`Quantity must be between ${selected.min_quantity} and ${selected.max_quantity}`);
    if ((profile?.balance ?? 0) < charge) return toast.error('Insufficient balance — please add funds first');

    setSubmitting(true);
    let savedOrder: Order | null = null;
    try {
      const providerLink = await servicesAPI.resolveProviderLink(selected.id);
      if (!providerLink) throw new Error('This service is temporarily unavailable for ordering.');

      savedOrder = await ordersAPI.createOrder(
        selected.id,
        link.trim(),
        qty,
        selected.completion_time ?? 24
      );
      const providerResult = await ordersAPI.placeWithProvider(savedOrder.id);
      if (providerResult?.pending) {
        setOrderNeedsReview({ ...savedOrder, status: 'processing' });
        toast.info(`Order #${savedOrder.id} is saved; provider confirmation is pending. Do not place it again.`);
      } else {
        toast.success(`Order placed! Charge: ${formatAmount(savedOrder.charge)}`);
      }
      await refreshProfile();
      setLink('');
      setQuantity('');
      setServiceId('');
    } catch (error) {
      if (!savedOrder) {
        toast.error(error instanceof Error ? error.message : 'Could not place order');
        void refreshProfile();
        return;
      }

      // The wallet debit and local order are committed before provider dispatch.
      // Re-read the order so a definite refund is distinguished from an uncertain
      // provider response; never encourage the customer to repeat a charged order.
      let latestOrder: Order | undefined;
      try {
        await refreshProfile();
        latestOrder = (await ordersAPI.getOrders()).find((order) => order.id === savedOrder?.id);
      } catch (refreshError) {
        console.warn('[NewOrder] Could not reconcile provider submission result', refreshError);
      }

      if (latestOrder && ['failed', 'canceled'].includes(latestOrder.status)) {
        toast.error(`Order #${savedOrder.id} was marked ${latestOrder.status}. Its wallet refund was processed; check your balance before trying again.`);
      } else {
        const unresolved = latestOrder || { ...savedOrder, status: 'processing' as const };
        setOrderNeedsReview(unresolved);
        toast.error(`Order #${savedOrder.id} was charged and saved, but provider acceptance is not confirmed. Do not place it again; check Order History or contact support.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell variant="user" title="New Order">
      {/* Platform tabs */}
      <Card className="p-3 sm:p-4">
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={platform === p.id}
              onClick={() => {
                setPlatform(p.id);
                const nextCategory = p.id === 'all'
                  ? ''
                  : services.filter((service) => matchesPlatform(service, p.id)).map((service) => service.category).sort()[0] ?? '';
                setCategory(nextCategory);
                // Deliberately keep serviceId: changing the platform/category
                // filter must not silently replace the user's chosen service.
              }}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                platform === p.id
                  ? 'bg-primary-gradient text-white shadow-glow-sm'
                  : 'border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:text-white'
              )}
            >
              {p.id === 'all' ? (
                <Sparkles className="h-3.5 w-3.5" />
              ) : (
                <PlatformBrandIcon platformId={p.id} size="sm" className="h-7 w-7 border-0 bg-transparent" />
              )}
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="order">
        <TabsList className="grid w-full min-w-0 grid-cols-2 gap-1.5 sm:inline-flex sm:w-auto sm:grid-cols-none sm:gap-1">
          <TabsTrigger value="order" className="w-full min-w-0 justify-start px-2.5 text-xs sm:w-auto sm:justify-center sm:px-4 sm:text-sm">
            <ShoppingCart className="h-4 w-4 shrink-0" /> New Order
          </TabsTrigger>
          <TabsTrigger value="favorites" className="w-full min-w-0 justify-start px-2.5 text-xs sm:w-auto sm:justify-center sm:px-4 sm:text-sm">
            <Heart className="h-4 w-4 shrink-0" /> Favorites
          </TabsTrigger>
          <TabsTrigger value="details" className="w-full min-w-0 justify-start px-2.5 text-xs sm:w-auto sm:justify-center sm:px-4 sm:text-sm">
            <Info className="h-4 w-4 shrink-0" /> Service Details
          </TabsTrigger>
          <TabsTrigger value="updates" className="w-full min-w-0 justify-start px-2.5 text-xs sm:w-auto sm:justify-center sm:px-4 sm:text-sm">
            <RefreshCw className="h-4 w-4 shrink-0" /> Last Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="order">
          {orderNeedsReview && (
            <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-amber-100">Order #{orderNeedsReview.id} needs confirmation</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-100/75">
                    This order is saved but has no confirmed provider order ID. Don’t place it again until its status is resolved.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/orders" className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-amber-200 hover:text-white sm:self-center">
                View Order History <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          )}
          {loading ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Skeleton className="h-[460px]" />
              <Skeleton className="h-[460px]" />
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
              {/* Left: form */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Service</Label>
                      <Select value={serviceId} onValueChange={setServiceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceOptions.map((s) => {
                            const keptSelection = s.id === selected?.id && !selectedInCurrentFilter;
                            return (
                              <SelectItem key={s.id} value={s.id} className="items-start py-3">
                                <span className="flex w-full min-w-0 flex-col items-start gap-1 pr-1">
                                  <span className="text-[11px] font-semibold text-primary-300">{formatAmount(s.rate_per_1000)}/1K</span>
                                  <span className="block w-full whitespace-normal break-words text-xs leading-relaxed text-white">{s.name}</span>
                                  {keptSelection && <span className="text-[10px] text-primary-300">Current selection</span>}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {selected && !selectedInCurrentFilter && (
                        <p className="text-[11px] leading-5 text-primary-200/80">
                          Your selection stays unchanged ({selected.category}). Choose another service only if you want to replace it.
                        </p>
                      )}
                      <div className="relative mt-2">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search services…"
                          className="pl-11"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link">Link</Label>
                      <div className="relative">
                        <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="link"
                          placeholder="https://instagram.com/your-post"
                          className="pl-11"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qty">Quantity</Label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="qty"
                          type="number"
                          min={selected?.min_quantity}
                          max={selected?.max_quantity}
                          placeholder={selected ? `${selected.min_quantity} – ${selected.max_quantity}` : 'Select a service first'}
                          className="pl-11"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>
                      {selected && (
                        <p className="text-xs text-muted-foreground">
                          Min {selected.min_quantity.toLocaleString()} · Max {selected.max_quantity.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                        <p className="text-xs text-muted-foreground">Total Charge</p>
                        <p className="font-display text-xl font-bold text-white">
                          {formatAmount(charge)}
                        </p>
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        loading={submitting}
                        className="sm:px-10"
                        disabled={!selected || Boolean(orderNeedsReview)}
                      >
                        <ShoppingCart /> Buy Service
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Right: details panel */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <Card className="h-full p-6">
                  {!selected ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-400">
                        <Sparkles className="h-8 w-8" />
                      </span>
                      <p className="mt-4 font-display text-lg font-semibold text-white">Pick a service</p>
                      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                        Select a service to review its available description, quantity limits and pricing.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {selected.category}
                        </Badge>
                        <h3 className="font-display text-lg font-bold leading-snug text-white">{selected.name}</h3>
                        {selected.description && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                        <DetailPill icon={Gauge} label="Minimum quantity" value={String(selected.min_quantity)} tone="green" />
                        <DetailPill icon={Gauge} label="Maximum quantity" value={String(selected.max_quantity)} tone="blue" />
                        <DetailPill
                          icon={Timer}
                          label="Delivery estimate"
                          value={selected.completion_time_text || (selected.completion_time ? `${selected.completion_time}h` : 'Not provided')}
                          tone="amber"
                        />
                      </div>

                      <div className="rounded-xl pf-card-inner p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Before you order
                        </p>
                        <p className="mt-3 text-xs leading-relaxed text-foreground/80">
                          Check the service description, destination requirements, quantity limits and price before
                          submitting. Any displayed delivery timing is an estimate and may vary.
                        </p>
                      </div>

                      <div className="rounded-xl border border-primary-500/25 bg-primary-500/[0.08] p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Price per 1000</span>
                          <span className="font-bold text-white">{formatAmount(selected.rate_per_1000)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your balance</span>
                          <span className="font-bold text-primary-300">{formatAmount(profile?.balance ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </form>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          <Card className="p-10 text-center">
            <Heart className="mx-auto h-10 w-10 text-primary-400" />
            <p className="mt-4 font-display text-lg font-semibold text-white">No favorites yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Heart any service from the catalog to pin it here for quick reordering.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card className="p-10 text-center">
            <Info className="mx-auto h-10 w-10 text-primary-400" />
            <p className="mt-4 font-display text-lg font-semibold text-white">Service details</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a service in the New Order tab to view its full specification and delivery estimates.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="updates">
          <Card className="p-10 text-center">
            <RefreshCw className="mx-auto h-10 w-10 text-primary-400" />
            <p className="mt-4 font-display text-lg font-semibold text-white">Everything is up to date</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Service catalog and provider rates were synced recently. New changes appear here automatically.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function DetailPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: 'green' | 'red' | 'blue' | 'amber';
}) {
  const tones: Record<string, string> = {
    green: 'text-emerald-400 bg-emerald-500/15',
    red: 'text-red-400 bg-red-500/15',
    blue: 'text-blue-400 bg-blue-500/15',
    amber: 'text-amber-400 bg-amber-500/15',
  };
  return (
    <div className="rounded-xl pf-card-inner p-3.5">
      <div className="flex items-center gap-2">
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>}>
      <NewOrderInner />
    </Suspense>
  );
}
