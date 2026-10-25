'use client';

import {
  SiInstagram,
  SiTiktok,
  SiYoutube,
  SiFacebook,
  SiTelegram,
  SiSpotify,
  SiSnapchat,
  SiX,
} from 'react-icons/si';
import { Linkedin, type LucideIcon } from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type IconComponent = ComponentType<{ size?: number; color?: string; className?: string; style?: CSSProperties }>;

interface BrandMeta {
  Icon: IconComponent;
  color: string;
  glow: string;
}

/** Real brand marks (Simple Icons + Lucide) with official brand colors. */
export const PLATFORM_BRANDS: Record<string, BrandMeta> = {
  Instagram: { Icon: SiInstagram as IconComponent, color: '#E1306C', glow: 'rgba(225,48,108,0.22)' },
  TikTok: { Icon: SiTiktok as IconComponent, color: '#ffffff', glow: 'rgba(37,244,238,0.18)' },
  Twitter: { Icon: SiX as IconComponent, color: '#ffffff', glow: 'rgba(255,255,255,0.14)' },
  Facebook: { Icon: SiFacebook as IconComponent, color: '#1877F2', glow: 'rgba(24,119,242,0.22)' },
  YouTube: { Icon: SiYoutube as IconComponent, color: '#FF0033', glow: 'rgba(255,0,51,0.22)' },
  Telegram: { Icon: SiTelegram as IconComponent, color: '#2AABEE', glow: 'rgba(42,171,238,0.22)' },
  Spotify: { Icon: SiSpotify as IconComponent, color: '#1DB954', glow: 'rgba(29,185,84,0.22)' },
  Snapchat: { Icon: SiSnapchat as IconComponent, color: '#FFFC00', glow: 'rgba(255,252,0,0.16)' },
  LinkedIn: { Icon: Linkedin as LucideIcon as IconComponent, color: '#0A66C2', glow: 'rgba(10,102,194,0.22)' },
};

const FALLBACK: BrandMeta = { Icon: SiX as IconComponent, color: '#a78bfa', glow: 'rgba(124,58,237,0.2)' };

/** Resolve a service category string (e.g. "Instagram Followers") to a platform id. */
export function platformFromCategory(category: string | null | undefined): string | null {
  if (!category) return null;
  const c = category.toLowerCase();
  const match = Object.keys(PLATFORM_BRANDS).find((id) => c.includes(id.toLowerCase()));
  return match ?? (c.includes('x.com') || c.includes('twitter') ? 'Twitter' : null);
}

export function PlatformBrandIcon({
  platformId,
  size = 'md',
  className,
}: {
  platformId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const meta = PLATFORM_BRANDS[platformId] ?? FALLBACK;
  const { Icon } = meta;
  const box =
    size === 'sm'
      ? 'h-8 w-8 rounded-lg'
      : size === 'lg'
        ? 'h-14 w-14 rounded-2xl'
        : size === 'xl'
          ? 'h-16 w-16 rounded-2xl'
          : 'h-11 w-11 rounded-xl';
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 26 : size === 'xl' ? 30 : 20;

  return (
    <span
      className={cn('flex shrink-0 items-center justify-center border border-white/10 bg-white/[0.05]', box, className)}
      style={{ boxShadow: `0 8px 24px -10px ${meta.glow}` }}
    >
      <Icon style={{ color: meta.color }} size={iconSize} />
    </span>
  );
}
