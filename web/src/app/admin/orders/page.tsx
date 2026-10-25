'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { adminAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { Order, OrderStatus } from '@/lib/types';
import { statusStyle } from '@/lib/constants';
import { formatDateTime, truncateMiddle } from '@/lib/utils';

const STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'canceled', 'failed'];

export default function AdminOrdersPage() {
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const load = () =>
    adminAPI
      .getAllOrders()
      .then(setOrders)
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (status !== 'all' && o.status !== status) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          o.link.toLowerCase().includes(q) ||
          (o.service?.name || '').toLowerCase().includes(q) ||
          (o.user?.username || '').toLowerCase().includes(q)
        );
      }),
    [orders, status, search]
  );

  const changeStatus = async (order: Order, next: OrderStatus) => {
    try {
      await adminAPI.updateOrderStatus(order.id, next);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
      toast.success(`Order marked ${next}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const refund = async (order: Order) => {
    setRefundingId(order.id);
    try {
      await adminAPI.refundOrder(order.id);
      toast.success(`Refunded ${formatAmount(order.charge)} to the user's wallet`);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Refund failed');
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <DashboardShell variant="admin" title="Order Management">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search orders…" className="pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={load}>
            <RefreshCw /> Refresh
          </Button>
        </div>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Service</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const style = statusStyle(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{truncateMiddle(order.id, 12)}</TableCell>
                      <TableCell className="text-sm font-medium text-white">{order.user?.username || '—'}</TableCell>
                      <TableCell className="hidden max-w-[220px] md:table-cell">
                        <p className="truncate text-sm">{order.service?.name || order.service_id}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{truncateMiddle(order.link, 30)}</p>
                      </TableCell>
                      <TableCell className="text-sm">{order.quantity.toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">{formatAmount(order.charge)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={style.className}>{style.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{formatDateTime(order.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select value={order.status} onValueChange={(v) => changeStatus(order, v as OrderStatus)}>
                            <SelectTrigger className="h-9 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(order.status === 'canceled' || order.status === 'failed') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 border-emerald-500/30 text-xs text-emerald-400 hover:text-emerald-300"
                              loading={refundingId === order.id}
                              onClick={() => refund(order)}
                            >
                              <Undo2 className="mr-1 h-3.5 w-3.5" /> Refund
                            </Button>
                          )}
                        </div>
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
