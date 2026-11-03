import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({
  icon,
  title,
  desc,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-400">
        {icon}
      </span>
      <p className="mt-4 font-display text-base font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{desc}</p>
      <Button className="mt-5" size="sm" asChild>
        <Link href={ctaHref}>
          {ctaLabel} <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
