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
  Percent,
  Gift,
  Network,
  MessageSquare,
  TrendingUp,
  ScrollText,
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
  { label: 'Referrals', href: '/dashboard/referrals', icon: Gift },
  { label: 'Child Panels', href: '/dashboard/child-panels', icon: Network },
  { label: 'Live Chat', href: '/dashboard/live-chat', icon: MessageSquare },
  { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { label: 'API', href: '/dashboard/api', icon: KeyRound },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Services', href: '/admin/services', icon: Grid3X3 },
  { label: 'Providers', href: '/admin/providers', icon: Server },
  { label: 'Margins', href: '/admin/margins', icon: Percent },
  { label: 'Financial', href: '/admin/financial', icon: TrendingUp },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Live Chat', href: '/admin/live-chat', icon: MessageSquare },
  { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Support', href: '/admin/support', icon: LifeBuoy },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export interface Platform {
  id: string;
  label: string;
}

export const PLATFORMS: Platform[] = [
  { id: 'all', label: 'All Services' },
  { id: 'Instagram', label: 'Instagram' },
  { id: 'TikTok', label: 'TikTok' },
  { id: 'Twitter', label: 'Twitter / X' },
  { id: 'Facebook', label: 'Facebook' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'Telegram', label: 'Telegram' },
  { id: 'Spotify', label: 'Spotify' },
  { id: 'Snapchat', label: 'Snapchat' },
  { id: 'LinkedIn', label: 'LinkedIn' },
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
