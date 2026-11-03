'use client';

import { Fragment, useEffect, useState } from 'react';
import { Network, Copy, Check, UserPlus, ArrowRight, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { childPanelAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import type { Order, UserProfile } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';
import { statusStyle } from '@/lib/constants';

export default function ChildPanelsPage() {
  const { profile, refreshProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const [children, setChildren] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [attachCode, setAttachCode] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [transferFor, setTransferFor] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [childOrders, setChildOrders] = useState<Record<string, Order[]>>({});

  const load = () =>
    childPanelAPI
      .listChildren()
      .then(setChildren)
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    void refreshProfile();
    void load();
  }, [refreshProfile]);

  const inviteLink =
    typeof window !== 'undefined' && profile?.referral_code
      ? `${window.location.origin}/register?child_of=${profile.referral_code}`
      : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  const attach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachCode.trim()) return;
    setAttaching(true);
    try {
      await childPanelAPI.attachByCode(attachCode.trim().toUpperCase());
      toast.success('Linked to the panel owner');
      setAttachCode('');
      await refreshProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not link the account');
    } finally {
      setAttaching(false);
    }
  };

  const transfer = async (childId: string) => {
    const amount = Number(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }
    try {
      await childPanelAPI.transfer(childId, amount);
      toast.success(`Transferred ${formatAmount(amount)}`);
      setTransferAmount('');
      setTransferFor(null);
      await Promise.all([refreshProfile(), load()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    }
  };

  const toggleOrders = async (childId: string) => {
    if (expanded === childId) {
      setExpanded(null);
      return;
    }
    setExpanded(childId);
    if (!childOrders[childId]) {
      try {
        const orders = await childPanelAPI.childOrders(childId);
        setChildOrders((prev) => ({ ...prev, [childId]: orders }));
      } catch {
        toast.error('Could not load child orders');
      }
    }
  };

  return (
    <DashboardShell variant="user" title="Child Panels">
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary-400" /> Invite sub-accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Anyone who registers with your panel link becomes your child account. You can fund their wallet and
                monitor every order they place.
              </p>
              <code className="block truncate rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-emerald-300">
                {inviteLink || '—'}
              </code>
              <Button variant="secondary" className="w-full" onClick={copyLink} disabled={!inviteLink}>
                {copied ? <Check className="text-emerald-400" /> : <Copy />} Copy invite link
              </Button>
            </CardContent>
          </Card>

          {!profile?.parent_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-5 w-5 text-primary-400" /> Join someone else&apos;s panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={attach} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="code">Panel owner code</Label>
                    <Input
                      id="code"
                      placeholder="PFXXXXXXXX"
                      value={attachCode}
                      onChange={(e) => setAttachCode(e.target.value)}
                      className="font-mono uppercase"
                    />
                  </div>
                  <Button type="submit" variant="outline" className="w-full" loading={attaching}>
                    <ArrowRight /> Link my account
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {profile?.parent_id && (
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                This account is linked to a panel owner. Wallet funding and order activity are visible to them.
              </p>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My child accounts ({children.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : children.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No child accounts yet. Share your invite link to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {children.map((child) => (
                    <Fragment key={child.id}>
                      <TableRow>
                        <TableCell>
                          <p className="font-semibold text-white">{child.username}</p>
                          <p className="text-xs text-muted-foreground">{child.email}</p>
                          <Badge variant="secondary" className="mt-1 capitalize">
                            {child.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-primary-300">{formatAmount(child.balance)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatAmount(child.total_spent)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => toggleOrders(child.id)}>
                              {expanded === child.id ? <ChevronUp /> : <ChevronDown />} Orders
                            </Button>
                            <Button size="sm" onClick={() => { setTransferFor(child.id); setTransferAmount(''); }}>
                              <Send /> Fund
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {transferFor === child.id && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <div className="flex flex-col gap-3 rounded-xl border border-primary-500/25 bg-primary-500/[0.06] p-4 sm:flex-row sm:items-end">
                              <div className="flex-1 space-y-1.5">
                                <Label>Amount to transfer to {child.username}</Label>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                />
                              </div>
                              <Button onClick={() => transfer(child.id)}>Confirm transfer</Button>
                              <Button variant="ghost" onClick={() => setTransferFor(null)}>
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {expanded === child.id && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-white/[0.02]">
                            {childOrders[child.id]?.length ? (
                              <ul className="space-y-2">
                                {childOrders[child.id].map((o) => (
                                  <li key={o.id} className="flex items-center justify-between gap-3 text-xs">
                                    <span className="truncate text-muted-foreground">
                                      {o.service?.name ?? o.service_id} · {o.quantity} qty
                                    </span>
                                    <span className="flex items-center gap-3">
                                      <span className="font-semibold text-white">{formatAmount(o.charge)}</span>
                                      <Badge
                                        variant="outline"
                                        className={cn('capitalize', statusStyle(o.status).className)}
                                      >
                                        {o.status}
                                      </Badge>
                                      <span className="text-muted-foreground/70">{formatDateTime(o.created_at)}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="py-2 text-center text-xs text-muted-foreground">No orders from this account.</p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
