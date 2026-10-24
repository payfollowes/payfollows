'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminAPI } from '@/lib/api';
import type { Announcement } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', severity: 'info' });
  const [saving, setSaving] = useState(false);

  const load = () =>
    adminAPI
      .listAnnouncements()
      .then(setItems)
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await adminAPI.createAnnouncement(form);
      setItems((prev) => [created, ...prev]);
      toast.success('Announcement published');
      setOpen(false);
      setForm({ title: '', content: '', severity: 'info' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await adminAPI.updateAnnouncement(a.id, { is_active: !a.is_active });
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)));
      toast.success('Announcement updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const remove = async (a: Announcement) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await adminAPI.deleteAnnouncement(a.id);
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      toast.success('Deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <DashboardShell variant="admin" title="Announcements">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea rows={5} required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" loading={saving}>
                Publish
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-14 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-primary-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">No announcements yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Publish one to notify every dashboard user.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                    <Megaphone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-white">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={a.severity === 'critical' ? 'destructive' : a.severity === 'warning' ? 'warning' : a.severity === 'success' ? 'success' : 'info'}>
                    {a.severity}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Switch checked={a.is_active !== false} onCheckedChange={() => toggleActive(a)} />
                    <span className="text-xs text-muted-foreground">{a.is_active === false ? 'Hidden' : 'Live'}</span>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => remove(a)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">{a.content}</p>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
