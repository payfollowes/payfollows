'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { adminAPI, isAuthError } from '@/lib/api';
import type { MarginRule, MarginRuleInput, MarginType, Provider } from '@/lib/types';

type FormState = {
  provider_id: string;
  category: string;
  service_id: string;
  margin_type: MarginType;
  margin_value: string;
  min_margin: string;
  max_margin: string;
  priority: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  provider_id: '',
  category: '',
  service_id: '',
  margin_type: 'percent',
  margin_value: '20',
  min_margin: '',
  max_margin: '',
  priority: '100',
  active: true,
};

export default function AdminMarginsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [rules, setRules] = useState<MarginRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [activeOnly, setActiveOnly] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarginRule | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const providerName = useMemo(() => {
    const map = new Map<string, string>();
    providers.forEach((p) => map.set(p.id, p.name));
    return (id: string | null) => (id ? map.get(id) ?? 'Unknown provider' : 'Global default');
  }, [providers]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [providerRows, ruleRows] = await Promise.all([
        // Provider names only power the filter/dialog labels; never let their
        // failure (e.g. RLS during the login redirect) block the rules table.
        adminAPI.getAllProviders().catch(() => [] as Provider[]),
        adminAPI.listMarginRules({ active: activeOnly ? true : undefined }),
      ]);
      setProviders(providerRows);
      setRules(providerFilter === 'all' ? ruleRows : ruleRows.filter((r) => r.provider_id === providerFilter));
    } catch (err) {
      // 401/403 means the shell is already redirecting to login / dashboard.
      if (!isAuthError(err)) toast.error('Failed to load margin rules');
    } finally {
      setLoading(false);
    }
  }, [activeOnly, providerFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, provider_id: providerFilter !== 'all' ? providerFilter : '' });
    setDialogOpen(true);
  };

  const openEdit = (rule: MarginRule) => {
    setEditing(rule);
    setForm({
      provider_id: rule.provider_id ?? '',
      category: rule.category ?? '',
      service_id: rule.service_id ?? '',
      margin_type: rule.margin_type,
      margin_value: String(rule.margin_value ?? 0),
      min_margin: rule.min_margin != null ? String(rule.min_margin) : '',
      max_margin: rule.max_margin != null ? String(rule.max_margin) : '',
      priority: String(rule.priority ?? 100),
      active: rule.active,
    });
    setDialogOpen(true);
  };

  const buildPayload = (): MarginRuleInput => ({
    provider_id: form.provider_id || null,
    service_id: form.service_id.trim() || null,
    category: form.category.trim() || null,
    margin_type: form.margin_type,
    margin_value: Number(form.margin_value) || 0,
    min_margin: form.min_margin === '' ? null : Number(form.min_margin) || 0,
    max_margin: form.max_margin === '' ? null : Number(form.max_margin) || 0,
    active: form.active,
    priority: Number(form.priority) || 100,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) await adminAPI.updateMarginRule(editing.id, payload);
      else await adminAPI.createMarginRule(payload);
      toast.success(editing ? 'Margin rule updated' : 'Margin rule created');
      setDialogOpen(false);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule: MarginRule) => {
    setTogglingId(rule.id);
    try {
      await adminAPI.updateMarginRule(rule.id, {
        provider_id: rule.provider_id,
        service_id: rule.service_id,
        category: rule.category,
        margin_type: rule.margin_type,
        margin_value: Number(rule.margin_value),
        min_margin: rule.min_margin,
        max_margin: rule.max_margin,
        active: !rule.active,
        priority: rule.priority,
      });
      toast.success(rule.active ? 'Rule deactivated' : 'Rule activated');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (rule: MarginRule) => {
    if (!window.confirm('Delete this margin rule?')) return;
    try {
      await adminAPI.deleteMarginRule(rule.id);
      toast.success('Margin rule deleted');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <DashboardShell variant="admin" title="Margin Management">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-full sm:w-72" aria-label="Filter by provider">
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} />
            Active rules only
          </label>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus /> New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Margin Rule' : 'New Margin Rule'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={form.provider_id} onValueChange={(v) => setForm((f) => ({ ...f, provider_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Global default (all providers)" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A provider-level rule with no category/service becomes that provider&apos;s default markup on sync.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category (optional)</Label>
                  <Input value={form.category} onChange={set('category')} placeholder="Instagram" />
                </div>
                <div className="space-y-2">
                  <Label>Service ID (optional)</Label>
                  <Input value={form.service_id} onChange={set('service_id')} placeholder="UUID" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Margin type</Label>
                  <Select
                    value={form.margin_type}
                    onValueChange={(v) => setForm((f) => ({ ...f, margin_type: v as MarginType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent (%)</SelectItem>
                      <SelectItem value="fixed">Fixed amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Margin value</Label>
                  <Input type="number" step="0.01" min="0" required value={form.margin_value} onChange={set('margin_value')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min margin (optional)</Label>
                  <Input type="number" step="0.01" min="0" value={form.min_margin} onChange={set('min_margin')} />
                </div>
                <div className="space-y-2">
                  <Label>Max margin (optional)</Label>
                  <Input type="number" step="0.01" min="0" value={form.max_margin} onChange={set('max_margin')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input type="number" step="1" min="1" value={form.priority} onChange={set('priority')} />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    id="rule-active"
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
                  />
                  <Label htmlFor="rule-active" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
              <Button type="submit" className="w-full" loading={saving}>
                {editing ? 'Save Changes' : 'Create Rule'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Percent rules multiply the provider rate (e.g. 20% on $0.10 = $0.12); fixed rules add an amount per 1,000.
            The newest active provider-level rule is applied automatically during catalog imports and the nightly
            provider sync. Re-import the catalog to reprice existing services immediately.
          </p>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card className="p-14 text-center">
          <Percent className="mx-auto h-10 w-10 text-primary-400" />
          <p className="mt-4 font-display text-lg font-semibold text-white">No margin rules yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a provider default rule to control markup across the whole catalog.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider / Scope</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Bounds</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <p className="font-semibold text-white">{providerName(rule.provider_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.category ? `Category: ${rule.category}` : 'All categories'}
                        {rule.service_id ? ` · Service: ${rule.service_id.slice(0, 8)}…` : ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.margin_type === 'percent' ? 'secondary' : 'outline'}>
                        {rule.margin_type === 'percent' ? 'Percent' : 'Fixed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-white">
                      {rule.margin_type === 'percent'
                        ? `${Number(rule.margin_value).toLocaleString()}%`
                        : `+${Number(rule.margin_value).toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rule.min_margin != null || rule.max_margin != null
                        ? `${rule.min_margin != null ? Number(rule.min_margin) : '—'} – ${
                            rule.max_margin != null ? Number(rule.max_margin) : '—'
                          }`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rule.priority}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.active}
                        disabled={togglingId === rule.id}
                        onCheckedChange={() => void toggleActive(rule)}
                        aria-label="Toggle rule active state"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="icon" onClick={() => openEdit(rule)} aria-label="Edit rule">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => void remove(rule)} aria-label="Delete rule">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
