import { Logo } from '@/components/shared/logo';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-[520px] -translate-x-1/2 rounded-full bg-primary-600/25 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-brand-bright/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glow-panel rounded-[28px] border border-[rgba(167,139,250,0.16)] bg-ink-900/85 p-8 shadow-glow-lg backdrop-blur-2xl">
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
        <div className="mt-6 text-center">{footer}</div>
      </div>
    </main>
  );
}
