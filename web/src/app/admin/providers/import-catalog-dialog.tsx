'use client';

import { useState } from 'react';
import { DownloadCloud, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { adminAPI } from '@/lib/api';
import type { Provider } from '@/lib/types';

interface SyncResult {
  count: number;
  skipped: number;
  message: string;
}

export function ImportCatalogDialog({
  provider,
  onSynced,
}: {
  provider: Provider;
  onSynced?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [markup, setMarkup] = useState(String(provider.markup_percentage ?? 20));
  const [category, setCategory] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const runImport = async () => {
    const markupNum = Number(markup);
    if (!Number.isFinite(markupNum) || markupNum < 0 || markupNum > 500) {
      return toast.error('Markup must be between 0% and 500%');
    }
    setSyncing(true);
    setResult(null);
    try {
      const payload = await adminAPI.syncProviderServices({
        providerId: provider.id,
        markupPercent: markupNum,
        category: category.trim() || undefined,
        replaceExisting,
      });
      const summary = {
        count: payload.count ?? 0,
        skipped: Array.isArray(payload.skipped_services) ? payload.skipped_services.length : 0,
        message: payload.message,
      };
      setResult(summary);
      toast.success(`Imported ${summary.count} services`);
      onSynced?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Catalog import failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1">
          <DownloadCloud /> Import Catalog
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import catalog — {provider.name}</DialogTitle>
          <DialogDescription>
            Pull every service from the provider API, create the matching catalog entries and
            provider mappings, and apply your resell markup in one run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Resell markup (%)</Label>
            <Input
              type="number"
              min="0"
              max="500"
              step="0.5"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              placeholder="20"
            />
            <p className="text-xs text-muted-foreground">
              Customer rate = provider rate × (1 + markup / 100). Margin rules on the server, if
              configured, take precedence.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Category filter (optional)</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Instagram, TikTok — blank imports everything"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords matched against the provider category names.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Replace existing mappings</p>
              <p className="text-xs text-muted-foreground">
                Rebuild the full mapping set and deactivate services the provider no longer offers.
              </p>
            </div>
            <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} />
          </div>

          {result && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Import complete
              </p>
              <p className="mt-1 text-xs text-emerald-200/80">
                {result.count} services synced
                {result.skipped > 0 ? ` · ${result.skipped} skipped` : ''}
              </p>
            </div>
          )}

          {syncing && (
            <div className="flex items-start gap-2 rounded-xl border border-primary-500/25 bg-primary-500/10 p-4 text-xs text-primary-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Large catalogs can take up to a minute. Keep this dialog open while the server
              imports and prices every service.
            </div>
          )}

          <Button className="w-full" onClick={runImport} loading={syncing} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="animate-spin" /> Importing…
              </>
            ) : (
              <>
                <DownloadCloud /> Fetch &amp; import services
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
