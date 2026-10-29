import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { A } from "../data/content";

export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: any }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-1.5 text-xs text-white/85 backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-[#be00df] shadow-[0_0_8px_#be00df]" />
      {children}
    </span>
  );
}

export function SectionHead({ before, accent, sub, badge, breakLine = true, className = "" }: { before: string; accent: string; sub?: string; badge?: string; breakLine?: boolean; className?: string }) {
  return (
    <Reveal className={`mx-auto flex max-w-[960px] flex-col items-center px-2 text-center ${className}`}>
      {badge && <div className="mb-4"><Badge>{badge}</Badge></div>}
      <h2 className="max-w-[820px] font-heading text-3xl font-bold leading-[1.2] sm:text-4xl lg:text-[48px]">
        {before}
        {breakLine ? <br className="hidden sm:block" /> : " "}
        <span className="text-grad">{accent}</span>
      </h2>
      {sub && <p className="mt-4 max-w-[760px] text-sm font-light leading-relaxed text-white/70 sm:text-base">{sub}</p>}
    </Reveal>
  );
}

export function GlowButton({ href = "#", children, className = "" }: { href?: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={`btn-glow group inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white ${className}`}>
      <span className="inline-flex items-center gap-2">{children}</span>
    </a>
  );
}

export function OutlineButton({ href = "#", children, className = "" }: { href?: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={`btn-outline inline-flex items-center justify-center px-7 py-3 text-sm font-medium text-white ${className}`}>
      {children}
    </a>
  );
}

export function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <a href="#" aria-label="GrowFollows home" className="shrink-0">
      <img src={A("home/logo.png")} alt="GrowFollows" className={`w-auto ${className}`} />
    </a>
  );
}

type IP = { className?: string };
const S = ({ children, className, fill }: { children: ReactNode; className?: string; fill?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className ?? "h-4 w-4"} fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
export const Icons = {
  play: ({ className }: IP) => <S fill className={className}><path d="M8 5v14l11-7z" /></S>,
  plus: ({ className }: IP) => <S className={className}><path d="M12 5v14M5 12h14" /></S>,
  minus: ({ className }: IP) => <S className={className}><path d="M5 12h14" /></S>,
  arrow: ({ className }: IP) => <S className={className}><path d="M7 17 17 7M8 7h9v9" /></S>,
  chevron: ({ className }: IP) => <S className={className}><path d="m6 9 6 6 6-6" /></S>,
  star: ({ className }: IP) => <S fill className={className}><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" /></S>,
  menu: ({ className }: IP) => <S className={className}><path d="M4 7h16M4 12h16M4 17h16" /></S>,
  close: ({ className }: IP) => <S className={className}><path d="M6 6l12 12M18 6 6 18" /></S>,
  calendar: ({ className }: IP) => <S className={className}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></S>,
  telegram: ({ className }: IP) => <S fill className={className}><path d="M21.9 4.3 18.7 19.5c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.2 13.2 1.4 11.7c-1-.3-1-1 .2-1.5L20.5 2.9c.9-.3 1.6.2 1.4 1.4z" /></S>,
};
