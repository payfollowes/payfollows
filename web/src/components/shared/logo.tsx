import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary-gradient shadow-glow-sm',
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
        <path
          d="M4 17.5V6.5L12 11l8-4.5v11M4 17.5L12 22l8-4.5M4 17.5l8-4.5 8 4.5M12 11V4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  href = '/',
  className,
  textClassName,
}: {
  href?: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className={cn('font-display text-lg font-bold tracking-tight text-white', textClassName)}>
        Pay<span className="gradient-text">Follows</span>
      </span>
    </Link>
  );
}
