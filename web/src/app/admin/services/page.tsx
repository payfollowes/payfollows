'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ArrowUpToLine } from 'lucide-react';
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
import { adminAPI, servicesAPI } from '@/lib/api';
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
  is_visible_to_users: boolean;
  display_order: string;
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
  is_visible_to_users: true,
  display_order: '0',
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
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [categoryToPrioritize, setCategoryToPrioritize] = useState('');
  const [prioritizingCategory, setPrioritizingCategory] = useState(false);

  const load = () =>
    adminAPI
      .getAllServices()
      .then((rows) => {
        setServices(rows);
        setOrderDrafts({});
      })
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const refreshPublicCatalog = () => {
    servicesAPI.clearCatalogCache();
  };

  const saveStorefrontSetting = async (
    service: Service,
    updates: Pick<Partial<Service>, 'is_visible_to_users' | 'display_order'>
  ) => {
    const previous = {
      is_visible_to_users: service.is_visible_to_users !== false,
      display_order: service.display_order ?? 0,
    };
    const next = { ...previous, ...updates };
    setServices((rows) => rows.map((row) => row.id === service.id ? { ...row, ...next } : row));
    if (updates.display_order !== undefined) {
      setOrderDrafts((drafts) => ({ ...drafts, [service.id]: String(updates.display_order) }));
    }

    try {
      await adminAPI.updateService(service.id, updates);
      refreshPublicCatalog();
      toast.success(updates.is_visible_to_users !== undefined
        ? (updates.is_visible_to_users ? 'Service shown to customers' : 'Service hidden from customers')
        : 'Display order updated');
    } catch (err) {
      setServices((rows) => rows.map((row) => row.id === service.id ? { ...row, ...previous } : row));
      setOrderDrafts((drafts) => ({ ...drafts, [service.id]: String(previous.display_order) }));
      toast.error(err instanceof Error ? err.message : 'Could not update storefront settings');
    }
  };

  const commitDisplayOrder = async (service: Service) => {
    const raw = orderDrafts[service.id] ?? String(service.display_order ?? 0);
    const value = Number(raw);
    if (!Number.isInteger(value) || value < -2_147_483_648 || value > 2_147_483_647) {
      setOrderDrafts((drafts) => ({ ...drafts, [service.id]: String(service.display_order ?? 0) }));
      toast.error('Display order must be a whole number within the supported range');
      return;
    }
    if (value === (service.display_order ?? 0)) return;
    await saveStorefrontSetting(service, { display_order: value });
  };

  const prioritizeCategory = async () => {
    if (!categoryToPrioritize || services.length === 0) return;
    setPrioritizingCategory(true);
    const lowestOrder = services.reduce((lowest, service) => Math.min(lowest, service.display_order ?? 0), 0);
    const nextOrder = Math.max(-2_147_483_647, lowestOrder - 1);
    try {
      await adminAPI.setCategoryDisplayOrder(categoryToPrioritize, nextOrder);
      setServices((rows) => rows.map((row) => row.category === categoryToPrioritize
        ? { ...row, display_order: nextOrder }
        : row));
      setOrderDrafts((drafts) => {
        const next = { ...drafts };
        services.filter((service) => service.category === categoryToPrioritize).forEach((service) => {
          next[service.id] = String(nextOrder);
        });
        return next;
      });
      refreshPublicCatalog();
      toast.success(`${categoryToPrioritize} services moved to the top of the customer catalog`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not prioritize this category');
    } finally {
      setPrioritizingCategory(false);
    }
  };

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
      is_visible_to_users: s.is_visible_to_users !== false,
      display_order: String(s.display_order ?? 0),
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
      is_visible_to_users: form.is_visible_to_users,
      display_order: Number(form.display_order) || 0,
    };
    try {
      if (editing) await adminAPI.updateService(editing.id, payload);
      else await adminAPI.createService(payload as Omit<Service, 'id'>);
      refreshPublicCatalog();
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
      refreshPublicCatalog();
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
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_visible_to_users}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_visible_to_users: v }))}
                  />
                  <Label>Visible to customers</Label>
                </div>
                <div className="space-y-2">
                  <Label>Display order <span className="text-muted-foreground">(lower comes first)</span></Label>
                  <Input type="number" step="1" value={form.display_order} onChange={set('display_order')} />
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

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="prioritize-service-category">Prioritize a category</Label>
            <select
              id="prioritize-service-category"
              value={categoryToPrioritize}
              onChange={(event) => setCategoryToPrioritize(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-ink-950 px-3 text-sm text-white outline-none transition focus:border-primary-400"
            >
              <option value="">Choose a category</option>
              {[...new Set(services.map((service) => service.category))].sort((a, b) => a.localeCompare(b)).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => void prioritizeCategory()} disabled={!categoryToPrioritize || prioritizingCategory || loading}>
            <ArrowUpToLine /> {prioritizingCategory ? 'Moving category…' : 'Move category to top'}
          </Button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Puts all services in the selected category before other categories in the customer catalog. Individual service ordering remains available below.
        </p>
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
                  <TableHead>Customer visibility</TableHead>
                  <TableHead>Order</TableHead>
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
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={s.is_visible_to_users !== false}
                          aria-label={`${s.is_visible_to_users === false ? 'Show' : 'Hide'} ${s.name} ${s.is_visible_to_users === false ? 'to' : 'from'} customers`}
                          onCheckedChange={(checked) => void saveStorefrontSetting(s, { is_visible_to_users: checked })}
                        />
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {s.is_visible_to_users === false ? 'Hidden' : 'Visible'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="1"
                        aria-label={`Display order for ${s.name}`}
                        value={orderDrafts[s.id] ?? String(s.display_order ?? 0)}
                        onChange={(event) => setOrderDrafts((drafts) => ({ ...drafts, [s.id]: event.target.value }))}
                        onBlur={() => void commitDisplayOrder(s)}
                        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                        className="h-9 w-24"
                      />
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
