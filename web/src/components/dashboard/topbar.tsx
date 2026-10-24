'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, Menu, Coins, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { toast } from 'sonner';

interface TopbarProps {
  title: string;
  onMenu: () => void;
}

export function DashboardTopbar({ title, onMenu }: TopbarProps) {
  const { user, profile, signOut } = useAuth();
  const { currency, setCurrency, currencies, formatAmount } = useCurrency();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-white/[0.07] bg-background/80 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-lg font-bold text-white sm:text-xl">{title}</h1>
      </div>

      {profile && (
        <Badge variant="secondary" className="hidden md:inline-flex">
          <Coins className="h-3.5 w-3.5 text-primary-400" />
          {formatAmount(profile.balance)}
        </Badge>
      )}

      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="hidden h-10 w-36 sm:flex" aria-label="Currency">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={() => toast.info('No new updates right now')}
        className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:text-white"
        aria-label="Updates"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 outline-none transition-colors hover:bg-white/[0.08]">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {(profile?.username || user?.username || 'U').slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="max-w-[110px] truncate text-xs font-semibold text-white">
              {profile?.username || user?.username}
            </p>
            <p className="text-[10px] text-muted-foreground">{profile?.role || 'user'}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')}>
            <LayoutDashboard /> Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/support')}>
            <UserIcon /> Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400">
            <LogOut /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
