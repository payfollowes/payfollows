'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { Service } from '@/lib/types';

type FormState = {
  name: string;
  category: string;
  description: string;
  rate_per_1000: string;
  min_quantity: string;
  max_quantity: string;
  completion_time: string;
  status: 'active' | 'inactive';
};

const EMPTY: FormState = {
  name: '',
  category: '',
  description: '',
  rate_per_1000: '',
  min_quantity: '50',
  max_quantity: '10000',
  completion_time: '24',
  status: 'active',
};

export default function AdminServicesPage() {
  const { formatAmount } = useCurrency();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () =>
    adminAPI
      .getAllServices()
      .then(setServices)
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      description: s.description || '',
      rate_per_1000: String(s.rate_per_1000),
      min_quantity: String(s.min_quantity),
      max_quantity: String(s.max_quantity),
      completion_time: String(s.completion_time ?? 24),
      status: s.status,
    });
    setDialogOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      rate_per_1000: Number(form.rate_per_1000),
      min_quantity: Number(form.min_quantity),
      max_quantity: Number(form.max_quantity),
      completion_time: Number(form.completion_time),
      status: form.status,
    };
    try {
      if (editing) await adminAPI.updateService(editing.id, payload);
      else await adminAPI.createService(payload as Omit<Service, 'id'>);
      toast.success(editing ? 'Service updated' : 'Service created');
      setDialogOpen(false);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Service) => {
    if (!window.confirm(`Delete service "${s.name}"?`)) return;
    try {
      await adminAPI.deleteService(s.id);
      toast.success('Service deleted');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <DashboardShell variant="admin" title="Service Management">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search services…" className="pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus /> Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Service' : 'Create Service'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Name</Label>
                  <Input required value={form.name} onChange={set('name')} placeholder="Instagram — Followers [Real]" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input required value={form.category} onChange={set('category')} placeholder="Instagram Followers" />
                </div>
                <div className="space-y-2">
                  <Label>Rate / 1000 (USD)</Label>
                  <Input required type="number" step="0.001" min="0" value={form.rate_per_1000} onChange={set('rate_per_1000')} />
                </div>
                <div className="space-y-2">
                  <Label>Min Quantity</Label>
                  <Input required type="number" min="1" value={form.min_quantity} onChange={set('min_quantity')} />
                </div>
                <div className="space-y-2">
                  <Label>Max Quantity</Label>
                  <Input required type="number" min="1" value={form.max_quantity} onChange={set('max_quantity')} />
                </div>
                <div className="space-y-2">
                  <Label>Completion (hours)</Label>
                  <Input type="number" min="1" value={form.completion_time} onChange={set('completion_time')} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.status === 'active'}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, status: v ? 'active' : 'inactive' }))}
                  />
                  <Label>Active</Label>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea rows={3} value={form.description} onChange={set('description')} placeholder="Customer-facing service description" />
                </div>
                <Button type="submit" className="sm:col-span-2" loading={saving}>
                  {editing ? 'Save Changes' : 'Create Service'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rate / 1K</TableHead>
                  <TableHead className="hidden md:table-cell">Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-sm font-medium text-white">{s.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.category}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary-300">{formatAmount(s.rate_per_1000)}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {s.min_quantity.toLocaleString()} – {s.max_quantity.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'active' ? 'success' : 'secondary'}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="icon" onClick={() => openEdit(s)} aria-label="Edit">
                          <Pencil />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => remove(s)} aria-label="Delete">
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
