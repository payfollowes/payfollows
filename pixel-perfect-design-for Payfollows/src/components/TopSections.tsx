import { useEffect, useRef, useState } from "react";
import { Reveal, SectionHead, Icons, Logo, GlowButton, OutlineButton } from "./ui";
import { A, links, navServices, areaCountries, flag, companyLinks, heroSocials, videoReviews, customerReviews, stats, orbitIcons } from "../data/content";

/* ================= NAVBAR ================= */
type Menu = "services" | "area" | "company" | null;

function MegaMenu({ which }: { which: Exclude<Menu, null> }) {
  if (which === "services")
    return (
      <div className="grid grid-cols-3 gap-1 p-4">
        {navServices.map(([l, i]) => (
          <a key={l} href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/[.06] hover:text-white">
            <img src={A(i)} alt="" className="h-6 w-6 object-contain" /> {l}
          </a>
        ))}
      </div>
    );
  if (which === "area")
    return (
      <div className="grid grid-cols-4 gap-1 p-4">
        {areaCountries.map((c) => (
          <a key={c} href="#" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/[.06] hover:text-white">
            <img src={flag(c)} alt="" className="h-4 w-6 rounded-sm object-cover" /> {c}
          </a>
        ))}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-1 p-4">
      {companyLinks.map((c) => (
        <a key={c} href="#" className="rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/[.06] hover:text-white">{c}</a>
      ))}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<Menu>(null);
  const t = useRef<number | undefined>(undefined);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const enter = (m: Menu) => { clearTimeout(t.current); setMenu(m); };
  const leave = () => { t.current = window.setTimeout(() => setMenu(null), 150); };
  const items: { label: string; key?: Exclude<Menu, null> }[] = [
    { label: "Services", key: "services" }, { label: "Service Area", key: "area" }, { label: "Company", key: "company" }, { label: "Pricing" }, { label: "Blog" },
  ];
  const width = { services: "w-[720px]", area: "w-[680px]", company: "w-[460px]" };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? "border-b border-white/10 bg-[#010002]/85 backdrop-blur-xl" : ""}`}>
      <nav className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-10" aria-label="Main">
        <Logo className="h-6 sm:h-7" />
        <ul className="hidden items-center gap-8 text-sm text-white/85 lg:flex">
          {items.map((l) => (
            <li key={l.label} className="relative" onMouseEnter={() => l.key && enter(l.key)} onMouseLeave={() => l.key && leave()}>
              <a href="#" className={`flex items-center gap-1 py-6 transition hover:text-white ${menu === l.key && l.key ? "text-white" : ""}`}>
                {l.label}
                {l.key && <Icons.chevron className={`h-3.5 w-3.5 transition ${menu === l.key ? "rotate-180" : ""}`} />}
              </a>
              {l.key && (
                <div className={`absolute left-1/2 top-full -translate-x-1/2 pt-1 transition-all duration-200 ${menu === l.key ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}>
                  <div className={`${width[l.key]} max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-[#0c0510]/95 shadow-2xl shadow-black backdrop-blur-xl`}>
                    <MegaMenu which={l.key} />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 lg:flex">
          <OutlineButton href={links.signin} className="!px-6 !py-2.5">Sign In</OutlineButton>
          <GlowButton href={links.signup} className="!px-6 !py-2.5">Register</GlowButton>
        </div>
        <button className="rounded-lg p-2 lg:hidden" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <Icons.close className="h-6 w-6" /> : <Icons.menu className="h-6 w-6" />}
        </button>
      </nav>
      <div className={`overflow-hidden transition-all duration-300 lg:hidden ${open ? "max-h-[80vh] overflow-y-auto" : "max-h-0"}`}>
        <ul className="space-y-1 px-4 pb-6 text-sm">
          {items.map((l) => (
            <li key={l.label}>
              {l.key ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 hover:bg-white/5">
                    {l.label} <Icons.chevron className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                    {(l.key === "services" ? navServices.map(([x]) => x) : l.key === "area" ? areaCountries : companyLinks).map((x) => (
                      <a key={x} href="#" className="rounded-md px-2 py-1.5 text-xs text-white/70 hover:bg-white/5">{x}</a>
                    ))}
                  </div>
                </details>
              ) : (
                <a href="#" className="block rounded-lg px-3 py-3 hover:bg-white/5">{l.label}</a>
              )}
            </li>
          ))}
          <li className="flex gap-3 pt-3">
            <OutlineButton href={links.signin} className="flex-1">Sign In</OutlineButton>
            <GlowButton href={links.signup} className="flex-1">Register</GlowButton>
          </li>
        </ul>
      </div>
    </header>
  );
}

/* ================= HERO ================= */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-[72px]">
      <img src={A("hero/background.webp")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#010002] via-[#010002]/80 to-[#010002]/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#010002] to-transparent" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#be00df]/20 blur-[140px]" />

      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-4 pt-12 sm:px-6 lg:flex-row lg:justify-between lg:gap-10 lg:pt-16">
        <div className="w-full max-w-[640px] pb-4 lg:pb-24">
          <Reveal className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-3 py-2 backdrop-blur">
              <img src={A("hero/google.svg")} alt="Google" className="h-6 w-6" />
              <div className="leading-none">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3].map((i) => <img key={i} src={A("hero/star.svg")} alt="" className="h-3 w-3" />)}
                  <img src={A("hero/star-half.svg")} alt="" className="h-3 w-3" />
                </div>
                <span className="mt-1 block text-[11px] text-white/70">4.9 Reviews</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <img key={i} src={A(`hero/avatar${i}.png`, 96)} alt="" className="h-8 w-8 rounded-full border-2 border-[#010002] object-cover" />
                ))}
              </div>
              <span className="text-sm text-white/85">Trusted by 98,538+ Users</span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-7 font-heading text-[34px] font-bold leading-[1.2] sm:text-5xl lg:text-[56px]">
              Best SMM Panel <br />
              for Social
              <img src={A("hero/chart-icon.webp")} alt="Social growth chart icon" className="mx-1.5 inline-block h-9 w-9 align-middle sm:h-12 sm:w-12 lg:h-[58px] lg:w-[58px]" />
              <span className="text-grad">Growth</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 max-w-[580px] text-sm font-light leading-relaxed text-white/75 sm:text-base">
              GrowFollows is a trusted SMM Panel for creators, businesses, agencies, and resellers in Bangladesh and worldwide. We help users buy followers, likes, views, comments, subscribers, and engagement services with simple ordering and affordable pricing from one easy dashboard.
            </p>
          </Reveal>
          <Reveal delay={300} className="mt-8 flex flex-wrap gap-4">
            <OutlineButton href={links.signin} className="min-w-[140px]">Sign In</OutlineButton>
            <GlowButton href={links.signup} className="min-w-[170px]">Create Account</GlowButton>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative w-full max-w-[542px] shrink-0 pb-14 lg:max-w-[480px] lg:pb-0 xl:max-w-[542px]">
          <div className="pointer-events-none absolute inset-x-10 top-16 bottom-24 rounded-full bg-[#be00df]/35 blur-[90px]" />
          <img src={A("hero/best-smm-panel-for-social-growth.webp")} alt="Best SMM Panel for Social Growth" width={410} height={543} className="float relative mx-auto w-[78%] drop-shadow-[0_30px_50px_rgba(190,0,223,.35)]" />
          <div className="absolute left-0 top-[28%] hidden items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-[18px] sm:flex">
            <img src={A("hero/checkmark.svg")} alt="" className="h-[22px] w-[22px]" />
            <span className="whitespace-nowrap text-sm">Instant Delivery</span>
          </div>
          <div className="absolute right-0 top-[55%] rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-right backdrop-blur-[18px]">
            <div className="font-heading text-xl font-bold">11,750,321</div>
            <div className="text-xs text-white/70">Orders Completed</div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 sm:gap-3 lg:-right-6 lg:left-auto">
            {heroSocials.map((s, i) => (
              <img key={s} src={s} alt="" className="float h-11 w-11 transition hover:scale-110 sm:h-14 sm:w-14" style={{ animationDelay: `${i * -0.7}s` }} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= TESTIMONIALS ================= */
function VideoCard({ r }: { r: (typeof videoReviews)[number] }) {
  const [playing, setPlaying] = useState(false);
  return (
    <article className="group relative aspect-[9/14] overflow-hidden rounded-2xl border border-white/10 bg-black">
      {playing ? (
        <video src={r.videoUrl} poster={r.poster} className="h-full w-full object-cover" autoPlay controls playsInline />
      ) : (
        <>
          <img src={r.poster} alt={`${r.name} video review`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <button onClick={() => setPlaying(true)} aria-label={`Play review from ${r.name}`} className="pulse-ring absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md transition group-hover:scale-110 group-hover:bg-[#be00df]">
            <img src={A("hero/play-arrow.svg")} alt="" className="ml-0.5 h-5 w-5" onError={(e) => (e.currentTarget.style.display = "none")} />
          </button>
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md">
            <div className="min-w-0">
              <div className="flex items-center gap-1 truncate text-sm font-semibold">{r.name}<img src={A("hero/verified-badge.svg")} alt="" className="h-3.5 w-3.5" /></div>
              <div className="text-[11px] text-white/60">{r.role}</div>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold"><img src={A("hero/star.svg")} alt="" className="h-3.5 w-3.5" />{r.rating}</div>
          </div>
        </>
      )}
    </article>
  );
}

export function Testimonials() {
  const [tab, setTab] = useState<"video" | "text">("video");
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <img src={A("review/tiles-bg.svg")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full opacity-60" />
      <img src={A("review/left-effect.svg")} alt="" aria-hidden className="pointer-events-none absolute -left-20 top-0 w-[500px] opacity-70" />
      <div className="relative">
        <SectionHead before="Trusted by Users in" accent="Bangladesh and Worldwide" sub="Thousands of creators, businesses, agencies, and resellers use GrowFollows to manage social media growth safely and easily. From Bangladesh to global markets, our SMM panel helps users order services, track progress, and build stronger online visibility." />
        <Reveal className="mt-8 flex justify-center" delay={100}>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[.04] p-1">
            {([["video", "Video Reviews", "hero/video-icon.svg"], ["text", "Customer Reviews", "hero/review-icon.svg"]] as const).map(([k, l, ic]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm transition ${tab === k ? "btn-glow" : "text-white/70 hover:text-white"}`}>
                <span className="inline-flex items-center gap-2"><img src={A(ic)} alt="" className="h-4 w-4" />{l}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {tab === "video" ? (
          <div className="mx-auto mt-12 grid max-w-[1400px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {videoReviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 100}><VideoCard r={r} /></Reveal>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-[1200px] px-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customerReviews.map((r, i) => (
                <Reveal key={r.name} delay={(i % 3) * 100}>
                  <article className="card flex h-full flex-col rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-[#be00df]/50">
                    <div className="flex items-center justify-between">
                      <img src={A("services/reviews/stars.svg")} alt="5 stars" className="h-4" />
                      <img src={A("services/reviews/quote.svg")} alt="" className="h-7 opacity-80" />
                    </div>
                    <p className="mt-5 flex-1 text-sm font-light leading-relaxed text-white/80">{r.quote}</p>
                    <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                      <img src={r.img} alt={r.name} loading="lazy" className="h-11 w-11 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{r.name}</div>
                        <div className="truncate text-xs text-white/55">{r.role}</div>
                      </div>
                      <span className="hidden text-[10px] text-white/40 sm:block">{r.date}</span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ================= WHY CHOOSE ================= */
export function WhyChoose() {
  const side = [
    { n: "01", t: "Quality Service Guarantee", d: "We provide reliable SMM panel services with clear order tracking, simple rules, and smooth processing. You can choose the service you need and manage your social media growth from one dashboard." },
    { n: "03", t: "Easy-to-Use Dashboard", d: "Our dashboard is simple for both beginners and professionals. Add funds, choose a service, place orders, and check progress without any complex setup." },
  ];
  const Side = ({ c }: { c: (typeof side)[number] }) => (
    <article className="flex h-full flex-col rounded-[20px] border border-white/10 bg-white/[.04] px-7 pt-[26px] pb-7 backdrop-blur-sm transition duration-500 hover:-translate-y-1 hover:border-[#be00df]/50 md:min-h-[300px]">
      <p className="text-2xl font-medium">{c.n}</p>
      <h3 className="mt-auto pt-10 text-xl font-medium sm:text-2xl">{c.t}</h3>
      <p className="mt-3 text-sm font-light leading-relaxed text-white/70">{c.d}</p>
    </article>
  );
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <img src={A("why-choose/bg.webp")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 w-full object-cover opacity-80" />
      <img src={A("why-choose/bg-noise.png")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#010002] to-transparent" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <Reveal>
            <h2 className="max-w-[620px] font-heading text-3xl font-bold leading-[1.2] sm:text-4xl lg:text-[48px]">
              Why Choose GrowFollows as <span className="text-grad">Your SMM Panel in Bangladesh?</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="max-w-[460px] text-sm font-light leading-relaxed text-white/70 sm:text-base lg:ml-auto lg:mt-2">
              GrowFollows is made for users who want affordable SMM services, simple ordering, and reliable support. Whether you are growing your own brand or managing client accounts, our platform gives you the tools to order faster and manage better.
            </p>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3 md:items-end">
          <Reveal className="order-1"><Side c={side[0]} /></Reveal>
          <Reveal delay={120} className="order-3 md:order-2">
            <article className="relative isolate flex flex-col overflow-hidden rounded-[20px] border border-[#f4b2ff]/40 bg-gradient-to-b from-[#be00df] to-[#5d0570] shadow-[0_30px_80px_-20px_rgba(190,0,223,.7)] transition duration-500 hover:-translate-y-2 md:min-h-[373px]">
              <img src={A("why-choose/card-pattern.png")} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
              <img src={A("why-choose/card-shine.png")} alt="" aria-hidden className="absolute top-[-13%] left-[-46%] -z-10 h-[244%] w-[189%] max-w-none" />
              <div className="flex h-full flex-1 flex-col px-7 pt-[26px] pb-7">
                <p className="text-2xl font-medium">02</p>
                <h3 className="mt-[38px] text-2xl font-medium">Affordable SMM Panel Services</h3>
                <p className="mt-3 text-sm font-light leading-relaxed">GrowFollows offers cheap SMM panel packages for Bangladeshi creators, agencies, businesses, and resellers. Order followers, likes, views, comments, and engagement services based on your budget.</p>
                <a href={links.signup} className="group mt-auto inline-flex items-center gap-2 pt-10 text-base transition hover:opacity-80">Let's Get Started <Icons.arrow className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
              </div>
            </article>
          </Reveal>
          <Reveal delay={240} className="order-2 md:order-3"><Side c={side[1]} /></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= CHEAP PANEL / PLATFORMS ================= */
export function CheapPanel() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#be00df]/15 blur-[140px]" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead badge="Best Services on your budget" before="Cheap SMM Panel for Bangladesh" accent="and Global Social Media Services" sub="GrowFollows helps you buy affordable SMM panel services for Facebook, Instagram, YouTube, TikTok, Telegram, Spotify, LinkedIn, and more. It is suitable for Bangladeshi businesses, creators, freelancers, agencies, and resellers who need simple social media growth support." />
        <Reveal className="relative mx-auto mt-10 h-[380px] max-w-[1000px] sm:h-[480px]" delay={100}>
          <img src={A("platforms/Ellipse.webp")} alt="" aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 w-[110%] max-w-none -translate-x-1/2 opacity-90" />
          <img src={A("platforms/cheap-smm-panel-for-bangladesh-and-global-social-media-services.png")} alt="Cheap SMM Panel for Bangladesh and Global Social Media Services" className="float absolute bottom-6 left-1/2 h-[92%] -translate-x-1/2 object-contain drop-shadow-[0_20px_60px_rgba(190,0,223,.45)]" />
          {orbitIcons.map((o, i) => (
            <img key={o.src} src={o.src} alt="" className="float absolute h-9 w-9 rounded-xl transition hover:scale-125 sm:h-12 sm:w-12" style={{ left: `${o.x}%`, top: `${o.y}%`, animationDelay: `${i * -0.55}s`, transform: "translate(-50%,-50%)" }} />
          ))}
        </Reveal>
        <div className="mx-auto mt-4 grid max-w-[640px] grid-cols-3 gap-3 sm:gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100} className="text-center">
              <div className="relative mx-auto grid aspect-square w-full max-w-[150px] place-items-center">
                <img src={A("platforms/stat-ring.svg")} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
                <span className="relative font-heading text-sm font-bold sm:text-xl">{s.value}</span>
              </div>
              <div className="mt-3 text-xs text-white/70 sm:text-sm">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

