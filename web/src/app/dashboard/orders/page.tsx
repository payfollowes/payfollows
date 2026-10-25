'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, RefreshCw, ExternalLink, Search, Undo2, XCircle } from 'lucide-react';
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

export default function OrdersPage() {
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);

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
    await ordersAPI.syncOrders();
    await load();
    setSyncing(false);
    toast.success('Order statuses synced');
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
                  <TableHead>Charge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const style = statusStyle(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncateMiddle(order.id, 14)}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-sm font-medium text-white">{order.service?.name || order.service_id}</p>
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
                        {order.provider_id && order.provider_order_id ? (
                          <div className="flex justify-end gap-1.5">
                            {(order.status === 'pending' || order.status === 'processing') && (
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
                            {order.status === 'completed' && (
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
                        ) : (
                          <p className="text-right text-[11px] text-muted-foreground">—</p>
                        )}
                      </TableCell>
                    </TableRow>
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
