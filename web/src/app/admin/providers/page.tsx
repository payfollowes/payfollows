'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Server, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { Provider } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ImportCatalogDialog } from './import-catalog-dialog';

const EMPTY = { name: '', api_url: '', api_key: '', balance: '0', markup_percentage: '20', status: 'active' as Provider['status'] };

export default function AdminProvidersPage() {
  const { formatAmount } = useCurrency();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});

  const loadCounts = async (rows: Provider[]) => {
    const entries = await Promise.all(
      rows.map(async (p) => {
        try {
          return [p.id, await adminAPI.countProviderServices(p.id)] as const;
        } catch {
          return [p.id, 0] as const;
        }
      })
    );
    setServiceCounts(Object.fromEntries(entries));
  };

  const load = () =>
    adminAPI
      .getAllProviders()
      .then((rows) => {
        setProviders(rows);
        void loadCounts(rows);
      })
      .catch(() => toast.error('Failed to load providers'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (p: Provider) => {
    setEditing(p);
    setForm({
      name: p.name,
      api_url: p.api_url,
      api_key: p.api_key,
      balance: String(p.balance ?? 0),
      markup_percentage: String(p.markup_percentage ?? 20),
      status: p.status,
    });
    setDialogOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      api_url: form.api_url,
      api_key: form.api_key,
      balance: Number(form.balance),
      markup_percentage: Number(form.markup_percentage),
      status: form.status,
    };
    try {
      if (editing) await adminAPI.updateProvider(editing.id, payload);
      else await adminAPI.createProvider(payload);
      toast.success(editing ? 'Provider updated' : 'Provider created');
      setDialogOpen(false);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Provider) => {
    if (!window.confirm(`Delete provider ${p.name}?`)) return;
    try {
      await adminAPI.deleteProvider(p.id);
      toast.success('Provider deleted');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <DashboardShell variant="admin" title="Provider Management">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus /> Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={form.name} onChange={set('name')} placeholder="DaoSMM" />
              </div>
              <div className="space-y-2">
                <Label>API URL</Label>
                <Input required value={form.api_url} onChange={set('api_url')} placeholder="https://api.provider.com/v2" />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input required value={form.api_key} onChange={set('api_key')} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input type="number" step="0.01" value={form.balance} onChange={set('balance')} />
                </div>
                <div className="space-y-2">
                  <Label>Markup %</Label>
                  <Input type="number" step="0.1" value={form.markup_percentage} onChange={set('markup_percentage')} />
                </div>
              </div>
              <Button type="submit" className="w-full" loading={saving}>
                {editing ? 'Save Changes' : 'Create Provider'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : providers.length === 0 ? (
        <Card className="p-14 text-center">
          <Server className="mx-auto h-10 w-10 text-primary-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">No providers configured</p>
          <p className="mt-1 text-sm text-muted-foreground">Connect an SMM provider API to start reselling.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className="p-6 card-hover">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                  <Server className="h-5 w-5" />
                </span>
                <Badge variant={p.status === 'active' ? 'success' : p.status === 'error' ? 'destructive' : 'secondary'}>
                  {p.status}
                </Badge>
              </div>
              <p className="mt-4 font-display text-lg font-bold text-white">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.api_url}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Balance</p>
                  <p className="font-semibold text-white">{formatAmount(p.balance ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Markup</p>
                  <p className="font-semibold text-white">{p.markup_percentage ?? 0}%</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Last sync: {formatDate(p.last_sync)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Linked services:{' '}
                <span className="font-semibold text-primary-300">
                  {(serviceCounts[p.id] ?? 0).toLocaleString()}
                </span>
              </p>
              <div className="mt-4 flex gap-2">
                <ImportCatalogDialog provider={p} onSynced={() => void load()} />
                <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
                  <Pencil /> Edit
                </Button>
                <Button variant="destructive" size="icon" onClick={() => remove(p)} aria-label="Delete">
                  <Trash2 />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-primary-400" />
          <div>
            <p className="text-sm font-semibold text-white">Provider sync runs automatically</p>
            <p className="text-xs text-muted-foreground">
              Services and balances sync daily via the legacy backend cron (00:00 UTC).
            </p>
          </div>
        </div>
      </Card>
    </DashboardShell>
  );
}
