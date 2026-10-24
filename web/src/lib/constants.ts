import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Grid3X3,
  Wallet,
  LifeBuoy,
  KeyRound,
  Users,
  Settings,
  Server,
  CreditCard,
  Megaphone,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const USER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Order', href: '/dashboard/new-order', icon: ShoppingCart },
  { label: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
  { label: 'Services', href: '/dashboard/services', icon: Grid3X3 },
  { label: 'Add Funds', href: '/dashboard/add-funds', icon: Wallet },
  { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { label: 'API', href: '/dashboard/api', icon: KeyRound },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Services', href: '/admin/services', icon: Grid3X3 },
  { label: 'Providers', href: '/admin/providers', icon: Server },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Support', href: '/admin/support', icon: LifeBuoy },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export interface Platform {
  id: string;
  label: string;
  gradient: string;
  emoji: string;
}

export const PLATFORMS: Platform[] = [
  { id: 'all', label: 'All Services', gradient: 'from-violet-500 to-fuchsia-500', emoji: '✦' },
  { id: 'Instagram', label: 'Instagram', gradient: 'from-pink-500 to-rose-500', emoji: '📸' },
  { id: 'TikTok', label: 'TikTok', gradient: 'from-slate-200 to-slate-400', emoji: '🎵' },
  { id: 'Twitter', label: 'Twitter / X', gradient: 'from-sky-400 to-blue-600', emoji: '𝕏' },
  { id: 'Facebook', label: 'Facebook', gradient: 'from-blue-500 to-indigo-600', emoji: '👍' },
  { id: 'YouTube', label: 'YouTube', gradient: 'from-red-500 to-rose-600', emoji: '▶️' },
  { id: 'Telegram', label: 'Telegram', gradient: 'from-sky-400 to-cyan-600', emoji: '✈️' },
  { id: 'Spotify', label: 'Spotify', gradient: 'from-green-400 to-emerald-600', emoji: '🎧' },
  { id: 'Snapchat', label: 'Snapchat', gradient: 'from-yellow-300 to-amber-400', emoji: '👻' },
  { id: 'LinkedIn', label: 'LinkedIn', gradient: 'from-blue-600 to-sky-700', emoji: '💼' },
];

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'processing', label: 'Processing', label2: 'In Progress', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { value: 'completed', label: 'Completed', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { value: 'canceled', label: 'Canceled', className: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  { value: 'failed', label: 'Failed', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
] as const;

export function statusStyle(status: string) {
  return (
    ORDER_STATUSES.find((s) => s.value === status) ?? {
      label: status,
      className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    }
  );
}
