'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  ShieldCheck,
  Timer,
  Sparkles,
  Droplets,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import type { Service } from '@/lib/types';
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
  const [dripEnabled, setDripEnabled] = useState(false);
  const [dripRuns, setDripRuns] = useState('5');
  const [dripInterval, setDripInterval] = useState('60');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    servicesAPI
      .getMergedServices()
      .then((rows) => {
        const active = rows.filter((s) => s.status === 'active' && s.rate_per_1000 > 0);
        setServices(active);
        const preselected = params.get('service');
        if (preselected) {
          const svc = active.find((s) => s.id === preselected);
          if (svc) {
            setServiceId(svc.id);
            setCategory(svc.category);
          }
        }
      })
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const filtered = platform === 'all' ? services : services.filter((s) => s.category.includes(platform));
    return Array.from(new Set(filtered.map((s) => s.category))).sort();
  }, [services, platform]);

  const visibleServices = useMemo(() => {
    let rows = services;
    if (platform !== 'all') rows = rows.filter((s) => s.category.includes(platform));
    if (category) rows = rows.filter((s) => s.category === category);
    if (search.trim()) rows = rows.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    return rows.slice(0, 300);
  }, [services, platform, category, search]);

  const selected = useMemo(() => services.find((s) => s.id === serviceId) || null, [services, serviceId]);

  const qty = Number(quantity) || 0;
  const charge = selected && qty > 0 ? (selected.rate_per_1000 / 1000) * qty : 0;
  const quantityValid = selected ? qty >= selected.min_quantity && qty <= selected.max_quantity : false;
  const runs = Number(dripRuns) || 0;
  const intervalMinutes = Number(dripInterval) || 0;
  const dripValid = !dripEnabled || (runs >= 2 && runs <= 100000 && intervalMinutes >= 1 && intervalMinutes <= 10080);
  const perRun = dripEnabled && runs > 0 ? Math.floor(qty / runs) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return toast.error('Please select a service');
    if (!link.trim()) return toast.error('Please enter your content link');
    if (!quantityValid)
      return toast.error(`Quantity must be between ${selected.min_quantity} and ${selected.max_quantity}`);
    if (dripEnabled && !dripValid)
      return toast.error('Drip-feed needs 2+ runs and an interval between 1 minute and 7 days');
    if ((profile?.balance ?? 0) < charge) return toast.error('Insufficient balance — please add funds first');

    setSubmitting(true);
    try {
      const order = await ordersAPI.createOrder(
        selected.id,
        link.trim(),
        qty,
        selected.completion_time ?? 24,
        undefined,
        undefined,
        dripEnabled ? { runs, intervalMinutes } : undefined
      );

      // Best-effort placement through the provider bridge
      try {
        const providerLink = await servicesAPI.resolveProviderLink(selected.id);
        if (providerLink) {
          await ordersAPI.placeWithProvider(
            providerLink.providerId,
            providerLink.providerServiceId,
            link.trim(),
            qty
          );
        }
      } catch (err) {
        console.warn('[new-order] provider placement pending', err);
      }

      toast.success(`Order placed! Charge: ${formatAmount(order.charge)}`);
      await refreshProfile();
      setLink('');
      setQuantity('');
      setServiceId('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not place order');
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
              onClick={() => {
                setPlatform(p.id);
                setCategory('');
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
        <TabsList>
          <TabsTrigger value="order">
            <ShoppingCart className="h-4 w-4" /> New Order
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="h-4 w-4" /> Favorites
          </TabsTrigger>
          <TabsTrigger value="details">
            <Info className="h-4 w-4" /> Service Details
          </TabsTrigger>
          <TabsTrigger value="updates">
            <RefreshCw className="h-4 w-4" /> Last Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="order">
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
                        <SelectContent className="max-h-80">
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
                        <SelectContent className="max-h-96">
                          {visibleServices.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <span className="mr-2 text-primary-300 font-semibold">
                                {formatAmount(s.rate_per_1000)}/1K
                              </span>
                              {s.name.length > 70 ? `${s.name.slice(0, 70)}…` : s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                    {/* Drip-feed delivery */}
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                            <Droplets className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">Drip-feed delivery</p>
                            <p className="text-xs text-muted-foreground">
                              Split the total quantity into gradual runs instead of one instant delivery
                            </p>
                          </div>
                        </div>
                        <Switch checked={dripEnabled} onCheckedChange={setDripEnabled} />
                      </div>

                      {dripEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 space-y-4 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="runs" className="text-xs">
                                Number of runs
                              </Label>
                              <Input
                                id="runs"
                                type="number"
                                min={2}
                                max={100000}
                                value={dripRuns}
                                onChange={(e) => setDripRuns(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="interval" className="text-xs">
                                Interval (minutes)
                              </Label>
                              <Input
                                id="interval"
                                type="number"
                                min={1}
                                max={10080}
                                value={dripInterval}
                                onChange={(e) => setDripInterval(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: '30 min', mins: 30 },
                              { label: '1 hour', mins: 60 },
                              { label: '6 hours', mins: 360 },
                              { label: '24 hours', mins: 1440 },
                            ].map((preset) => (
                              <button
                                key={preset.mins}
                                type="button"
                                onClick={() => setDripInterval(String(preset.mins))}
                                className={cn(
                                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                  intervalMinutes === preset.mins
                                    ? 'border-primary-500/50 bg-primary-500/15 text-primary-200'
                                    : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-white'
                                )}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          {qty > 0 && runs >= 2 && (
                            <div className="rounded-xl border border-primary-500/20 bg-primary-500/[0.08] p-3 text-xs leading-relaxed text-primary-100/90">
                              <span className="font-bold text-white">{qty.toLocaleString()}</span> total units split
                              across <span className="font-bold text-white">{runs}</span> runs
                              {perRun > 0 && (
                                <>
                                  {' '}
                                  (~<span className="font-bold text-white">{perRun.toLocaleString()}</span> per run),
                                  delivered every{' '}
                                  <span className="font-bold text-white">
                                    {intervalMinutes >= 1440
                                      ? `${intervalMinutes / 1440} day(s)`
                                      : intervalMinutes >= 60
                                        ? `${intervalMinutes / 60} hour(s)`
                                        : `${intervalMinutes} min`}
                                  </span>
                                </>
                              )}
                              . Total charge stays {formatAmount(charge)}.
                            </div>
                          )}
                          {!dripValid && (
                            <p className="text-xs font-medium text-red-400">
                              Runs must be 2–100000 and interval 1–10080 minutes (7 days).
                            </p>
                          )}
                        </motion.div>
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
                        disabled={!selected || (dripEnabled && !dripValid)}
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
                        Select a category and service to see quality, delivery speed, refill policy and pricing
                        details here.
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

                      <div className="grid grid-cols-2 gap-3">
                        <DetailPill icon={ShieldCheck} label="Quality" value="High Quality" tone="green" />
                        <DetailPill
                          icon={Timer}
                          label="Start Time"
                          value={selected.completion_time_text || '0–1 Hour'}
                          tone="red"
                        />
                        <DetailPill icon={RefreshCw} label="Refill" value="30 Days" tone="blue" />
                        <DetailPill
                          icon={Gauge}
                          label="Speed"
                          value={selected.completion_time ? `${selected.completion_time}h` : 'Instant'}
                          tone="amber"
                        />
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Notes
                        </p>
                        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-foreground/80">
                          <li>• Profile/post must be public while the order is in progress.</li>
                          <li>• Do not change the username or delete the linked content.</li>
                          <li>• Average speed and delivery time are estimates based on recent orders.</li>
                          <li>• Refill guarantee covers unexpected drops within the policy window.</li>
                          <li>• You can request analytics of delivery speed after completion.</li>
                        </ul>
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
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
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
