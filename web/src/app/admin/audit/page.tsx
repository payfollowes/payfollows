'use client';

import { useEffect, useMemo, useState } from 'react';
import { ScrollText, Search, ShieldCheck } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auditAPI } from '@/lib/api';
import type { AuditLog } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const toneForAction = (action: string) => {
  if (action.includes('delete')) return 'destructive' as const;
  if (action.includes('update') || action.includes('status')) return 'warning' as const;
  if (action.includes('insert') || action.includes('create')) return 'info' as const;
  return 'secondary' as const;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('all');

  useEffect(() => {
    auditAPI
      .list({ limit: 200 })
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const entities = useMemo(
    () => ['all', ...Array.from(new Set(logs.map((l) => l.entity_type).filter(Boolean) as string[]))],
    [logs]
  );

  const filtered = logs.filter((l) => {
    if (entity !== 'all' && l.entity_type !== entity) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_id?.toLowerCase().includes(q) ||
      (l.actor_role ?? '').toLowerCase().includes(q) ||
      JSON.stringify(l.metadata ?? {}).toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell variant="admin" title="Audit Logs">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary-400" />
            System activity ({filtered.length})
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search actions, ids, metadata"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 sm:w-72"
              />
            </div>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-primary-500/50"
              aria-label="Filter by entity"
            >
              {entities.map((e) => (
                <option key={e} value={e} className="bg-ink-900">
                  {e === 'all' ? 'All entities' : e}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-primary-400/60" />
              No audit events match the current filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {log.actor_role || 'system'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={toneForAction(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="text-xs font-semibold text-white">{log.entity_type}</p>
                      {log.entity_id && (
                        <p className="truncate font-mono text-[10px] text-muted-foreground">{log.entity_id}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-[380px] lg:table-cell">
                      <pre
                        className={cn(
                          'max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/[0.07] bg-black/30 p-2 font-mono text-[10px] text-muted-foreground'
                        )}
                      >
                        {JSON.stringify(log.metadata ?? {}, null, 2)}
                      </pre>
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
