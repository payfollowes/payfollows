'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ClipboardList, RefreshCw, ExternalLink, Search, Undo2, XCircle, Droplets, Eye, ChevronDown, ChevronUp, Clock3, LifeBuoy } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ordersAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { Order } from '@/lib/types';
import { statusStyle } from '@/lib/constants';
import { formatDateTime, truncateMiddle } from '@/lib/utils';
import { toast } from 'sonner';

function getOrderProgress(order: Order) {
  const quantity = Math.max(0, Number(order.quantity) || 0);
  const knownRemains = order.remains !== null && order.remains !== undefined && Number.isFinite(Number(order.remains));
  const remaining = knownRemains
    ? Math.min(quantity, Math.max(0, Number(order.remains)))
    : order.status === 'completed'
      ? 0
      : null;
  const delivered = remaining === null ? null : Math.max(0, quantity - remaining);
  const percent = quantity > 0 && delivered !== null
    ? Math.min(100, Math.round((delivered / quantity) * 100))
    : 0;

  return { quantity, delivered, remaining, percent };
}

function formatEta(order: Order, now = Date.now()) {
  const hours = Number(order.delivery_time ?? order.service?.completion_time);
  const createdAt = Date.parse(order.created_at);
  if (!Number.isFinite(hours) || hours <= 0 || !Number.isFinite(createdAt)) return null;

  const delta = createdAt + hours * 60 * 60 * 1000 - now;
  const totalMinutes = Math.ceil(Math.abs(delta) / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingHours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const duration = [
    days ? `${days}d` : '',
    remainingHours ? `${remainingHours}h` : '',
    !days && !remainingHours ? `${minutes}m` : '',
  ].filter(Boolean).join(' ');

  return delta > 0 ? `About ${duration} left` : `Estimate passed ${duration} ago`;
}

export default function OrdersPage() {
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await ordersAPI.getOrders());
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.link.toLowerCase().includes(q) ||
          (o.service?.name || '').toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  const sync = async () => {
    setSyncing(true);
    try {
      const result = await ordersAPI.syncOrders();
      await load();
      if (result) toast.success('Order progress updated');
      else toast.error('Could not sync with the provider. Showing the latest saved status.');
    } finally {
      setSyncing(false);
    }
  };

  const refill = async (order: Order) => {
    setActionId(order.id);
    try {
      await ordersAPI.refillOrder(order);
      toast.success('Refill requested — the provider will top up any drops');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Refill failed');
    } finally {
      setActionId(null);
    }
  };

  const cancel = async (order: Order) => {
    if (!window.confirm('Cancel this order at the provider? Refund, if eligible, is handled by support.')) return;
    setActionId(order.id);
    try {
      await ordersAPI.cancelOrder(order);
      toast.success('Cancellation requested');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardShell variant="user" title="My Orders">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by link, service or order ID…"
              className="pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={sync} loading={syncing}>
            <RefreshCw /> Sync
          </Button>
        </div>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center p-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-400">
                <ClipboardList className="h-7 w-7" />
              </span>
              <p className="mt-4 font-display text-lg font-semibold text-white">No orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {orders.length === 0 ? 'Place your first order to see it here.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="hidden md:table-cell">Link</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const style = statusStyle(order.status);
                  const progress = getOrderProgress(order);
                  const eta = formatEta(order);
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <Fragment key={order.id}>
                    <TableRow>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncateMiddle(order.id, 14)}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-sm font-medium text-white">{order.service?.name || order.service_id}</p>
                        {order.is_dripfeed && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                            <Droplets className="h-3 w-3" />
                            Drip · {order.runs_delivered ?? 0}/{order.runs} runs
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-300 hover:text-primary-200"
                        >
                          {truncateMiddle(order.link, 28)} <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-sm">{order.quantity.toLocaleString()}</TableCell>
                      <TableCell className="min-w-[130px] text-xs">
                        {progress.delivered === null ? (
                          <span className="text-muted-foreground">Not synced</span>
                        ) : (
                          <div>
                            <span className="font-medium text-white">{progress.delivered.toLocaleString()} delivered</span>
                            <span className="block text-muted-foreground">{progress.remaining?.toLocaleString()} remaining</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-white">{formatAmount(order.charge)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={style.className}>
                          {style.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {formatDateTime(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            aria-expanded={isExpanded}
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Details
                            {isExpanded ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
                          </Button>
                          {!order.provider_order_id && (order.status === 'pending' || order.status === 'processing') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-amber-500/30 text-xs text-amber-200 hover:text-amber-100"
                              aria-label={`Contact support about order ${order.id}`}
                              onClick={() => window.location.assign(`/dashboard/support?orderId=${encodeURIComponent(order.id)}`)}
                            >
                              <LifeBuoy className="mr-1 h-3.5 w-3.5" /> Help
                            </Button>
                          )}
                          {order.provider_id && order.provider_order_id &&
                            (order.status === 'pending' || order.status === 'processing') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-red-500/30 text-xs text-red-300 hover:text-red-200"
                                loading={actionId === order.id}
                                onClick={() => cancel(order)}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
                              </Button>
                            )}
                          {order.provider_id && order.provider_order_id && order.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-primary-500/30 text-xs text-primary-300 hover:text-primary-200"
                              loading={actionId === order.id}
                              onClick={() => refill(order)}
                            >
                              <Undo2 className="mr-1 h-3.5 w-3.5" /> Refill
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                        <TableCell colSpan={9} className="p-0">
                          <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(220px,1fr)] sm:p-5">
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-white">Delivery progress</p>
                                  <p className="mt-1 text-xs text-muted-foreground">Order {truncateMiddle(order.id, 22)}</p>
                                </div>
                                <Badge variant="outline" className={style.className}>{style.label}</Badge>
                              </div>
                              <div>
                                <div className="mb-2 flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{progress.delivered === null ? 'Waiting for provider progress' : `${progress.percent}% delivered`}</span>
                                  <span className="font-medium text-white">{progress.delivered === null ? `Qty ${progress.quantity.toLocaleString()}` : `${progress.delivered.toLocaleString()} / ${progress.quantity.toLocaleString()}`}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progress.percent}%` }} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                  <p className="text-[11px] text-muted-foreground">Delivered</p>
                                  <p className="mt-1 text-sm font-semibold text-white">{progress.delivered === null ? '—' : progress.delivered.toLocaleString()}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                  <p className="text-[11px] text-muted-foreground">Remaining</p>
                                  <p className="mt-1 text-sm font-semibold text-white">{progress.remaining === null ? '—' : progress.remaining.toLocaleString()}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                  <p className="text-[11px] text-muted-foreground">Starting count</p>
                                  <p className="mt-1 text-sm font-semibold text-white">{order.start_count == null ? '—' : Number(order.start_count).toLocaleString()}</p>
                                </div>
                              </div>
                              {progress.delivered === null && (
                                <p className="text-xs text-muted-foreground">Provider ne abhi delivered/remaining count report nahi kiya. Status update karne ke liye upar Sync dabayen.</p>
                              )}
                            </div>
                            <div className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-4">
                              <div className="flex items-start gap-2.5">
                                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                                <div>
                                  <p className="text-xs font-medium text-white">Estimated time</p>
                                  <p className="mt-1 text-sm text-violet-200">
                                    {order.status === 'completed'
                                      ? 'Completed — no time remaining'
                                      : order.status === 'canceled' || order.status === 'failed'
                                        ? 'Order is no longer active'
                                        : !order.provider_order_id
                                          ? 'Waiting for provider confirmation'
                                          : eta || 'Provider ne ETA share nahi ki'}
                                  </p>
                                  {order.status !== 'completed' && order.status !== 'canceled' && order.status !== 'failed' && order.provider_order_id && eta && (
                                    <p className="mt-1 text-[11px] text-muted-foreground">Service ke estimated completion time par mabni; actual waqt provider ke status par depend karta hai.</p>
                                  )}
                                </div>
                              </div>
                              <a
                                href={order.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
                              >
                                Open order link <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
