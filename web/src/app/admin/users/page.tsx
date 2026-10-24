'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2, ShieldCheck, UserCheck, Ban, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminAPI } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import type { UserProfile } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const { formatAmount } = useCurrency();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [balanceTarget, setBalanceTarget] = useState<UserProfile | null>(null);
  const [balanceValue, setBalanceValue] = useState('');

  const load = () =>
    adminAPI
      .getAllUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const saveBalance = async () => {
    if (!balanceTarget) return;
    const val = Number(balanceValue);
    if (!Number.isFinite(val) || val < 0) return toast.error('Enter a valid amount');
    try {
      await adminAPI.updateUserBalance(balanceTarget.id, val);
      toast.success('Balance updated');
      setBalanceTarget(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const toggleRole = async (u: UserProfile) => {
    try {
      await adminAPI.updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin');
      toast.success('Role updated');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const toggleStatus = async (u: UserProfile) => {
    try {
      await adminAPI.updateUserStatus(u.id, u.status === 'banned' ? 'active' : 'banned');
      toast.success('Status updated');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const remove = async (u: UserProfile) => {
    if (!window.confirm(`Delete account ${u.username}? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      toast.success('User deleted');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <DashboardShell variant="admin" title="User Management">
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users by name or email…" className="pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">{u.username?.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white">{u.username}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'banned' ? 'destructive' : 'success'}>
                        {u.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-white">{formatAmount(u.balance ?? 0)}</TableCell>
                    <TableCell className="text-sm">{formatAmount(u.total_spent ?? 0)}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{formatDate(u.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm">Manage</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog open={balanceTarget?.id === u.id} onOpenChange={(o) => !o && setBalanceTarget(null)}>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setBalanceTarget(u); setBalanceValue(String(u.balance ?? 0)); }}>
                                <Wallet /> Adjust Balance
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust balance — {u.username}</DialogTitle>
                              </DialogHeader>
                              <Input type="number" step="0.01" value={balanceValue} onChange={(e) => setBalanceValue(e.target.value)} />
                              <Button onClick={saveBalance}>Save Balance</Button>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuItem onClick={() => toggleRole(u)}>
                            <ShieldCheck /> {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(u)}>
                            {u.status === 'banned' ? <UserCheck /> : <Ban />}
                            {u.status === 'banned' ? 'Unban User' : 'Ban User'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => remove(u)} className="text-red-400 focus:text-red-400">
                            <Trash2 /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
