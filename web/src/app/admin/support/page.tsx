'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminAPI } from '@/lib/api';
import type { SupportTicket, TicketStatus } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
  open: 'info',
  'in-progress': 'warning',
  resolved: 'success',
  closed: 'secondary',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () =>
    adminAPI
      .getAllTickets()
      .then(setTickets)
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (ticket: SupportTicket, status: TicketStatus) => {
    try {
      const updated = await adminAPI.updateTicket(ticket.id, { status });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...updated } : t)));
      toast.success(`Ticket ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  const reply = async (ticket: SupportTicket) => {
    const text = (replies[ticket.id] || '').trim();
    if (!text) return toast.error('Write a reply first');
    setSavingId(ticket.id);
    try {
      const updated = await adminAPI.updateTicket(ticket.id, { reply: text, status: 'in-progress' });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...updated } : t)));
      setReplies((prev) => ({ ...prev, [ticket.id]: '' }));
      toast.success('Reply sent');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardShell variant="admin" title="Support Tickets">
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-14 text-center">
          <LifeBuoy className="mx-auto h-10 w-10 text-primary-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">No tickets</p>
          <p className="mt-1 text-sm text-muted-foreground">Customer support requests will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-semibold text-white">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.user?.username || ticket.user?.email || 'User'} · {formatDateTime(ticket.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{ticket.priority || 'medium'}</Badge>
                  <Badge variant={STATUS_VARIANT[ticket.status] || 'secondary'} className="capitalize">
                    {ticket.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed text-foreground/85">{ticket.message}</p>

              {ticket.reply && (
                <div className="mt-3 rounded-xl border border-primary-500/25 bg-primary-500/[0.07] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">Your reply</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{ticket.reply}</p>
                </div>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <Textarea
                  rows={2}
                  placeholder="Write a reply…"
                  value={replies[ticket.id] || ''}
                  onChange={(e) => setReplies((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                />
                <Button onClick={() => reply(ticket)} loading={savingId === ticket.id}>
                  <Send /> Reply
                </Button>
                <Select value={ticket.status} onValueChange={(v) => setStatus(ticket, v as TicketStatus)}>
                  <SelectTrigger className="md:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
