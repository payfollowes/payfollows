'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supportAPI } from '@/lib/api';
import type { SupportTicket } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
  open: 'info',
  'in-progress': 'warning',
  resolved: 'success',
  closed: 'secondary',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    supportAPI
      .listMine()
      .then(setTickets)
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error('Please fill subject and message');
    setSubmitting(true);
    try {
      const ticket = await supportAPI.create(subject.trim(), message.trim(), priority);
      setTickets((prev) => [ticket, ...prev]);
      toast.success('Support ticket created');
      setOpen(false);
      setSubject('');
      setMessage('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell variant="user" title="Support Center">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Need help? Open a ticket and our team typically replies within a few hours.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create support ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail — include order IDs where relevant."
                />
              </div>
              <Button type="submit" className="w-full" loading={submitting}>
                <Send /> Submit Ticket
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-14 text-center">
          <LifeBuoy className="mx-auto h-10 w-10 text-primary-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">No tickets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Your conversations with support will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket, i) => (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-base font-semibold text-white">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(ticket.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {ticket.priority || 'medium'}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[ticket.status] || 'secondary'} className="capitalize">
                      {ticket.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed text-foreground/85">
                  {ticket.message}
                </p>
                {ticket.reply && (
                  <div className={cn('mt-3 rounded-xl border border-primary-500/25 bg-primary-500/[0.07] p-4')}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">Support reply</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{ticket.reply}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
