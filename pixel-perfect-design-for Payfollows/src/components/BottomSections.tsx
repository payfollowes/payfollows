import { useState } from "react";
import { Reveal, SectionHead, Icons, Logo, GlowButton, OutlineButton } from "./ui";
import { A, links, steps, platforms, worldCountries, flag, advantages, comparison, blogPosts, footer, navServices, areaCountries } from "../data/content";
import { faqTabs, faqCategories } from "../data/faq";
import { PaymentsDiagram } from "./PaymentsDiagram";

/* ================= PAYMENTS ================= */
export function Payments() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <img src={A("pricing/top-effect.svg")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full opacity-80" onError={(e) => (e.currentTarget.style.display = "none")} />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead before="Secure SMM Panel Payments with bKash," accent="Nagad, Rocket and Global Methods" sub="Adding funds to your GrowFollows account is fast, simple, and secure. Bangladesh users can use local payment options like bKash, Nagad, and Rocket where available, while global users can pay through supported cards, crypto, and other international methods." />
        <Reveal className="relative mx-auto mt-12 max-w-[1100px]" delay={100}>
          <PaymentsDiagram />
        </Reveal>
      </div>
      <img src={A("pricing/bottom-effect.svg")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-80" onError={(e) => (e.currentTarget.style.display = "none")} />
    </section>
  );
}

/* ================= HOW IT WORKS ================= */
export function HowWorks() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute right-0 top-10 h-[420px] w-[620px] rounded-full bg-[#be00df]/20 blur-[150px]" />
      <div className="relative mx-auto grid max-w-[1300px] gap-10 px-4 sm:px-6 lg:grid-cols-[280px_1fr] lg:items-end">
        <Reveal className="lg:pb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.05] px-4 py-1.5 text-xs text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-[#be00df]" />Our Work Process</span>
          <h2 className="mt-5 font-heading text-3xl font-bold leading-[1.2] sm:text-4xl">How GrowFollows <br /><span className="text-grad">SMM Panel Works</span></h2>
          <GlowButton href={links.signup} className="mt-7 min-w-[150px]">Register</GlowButton>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          {steps.map((s, i) => {
            const active = i === 3;
            return (
              <Reveal key={s.n} delay={i * 120}>
                <article
                  className={`relative flex flex-col justify-end overflow-visible rounded-[20px] p-6 transition duration-500 hover:-translate-y-1.5 ${active ? "bg-gradient-to-b from-[#be00df] to-[#5d0570] shadow-[0_30px_70px_-20px_rgba(190,0,223,.75)]" : "border border-white/10 bg-white/[.04] hover:border-[#be00df]/50"}`}
                  style={{ minHeight: `${200 + i * 50}px` }}
                >
                  {active && (
                    <img src={A("how-it-works/how-growfollows-smm-panel-works.png")} alt="How GrowFollows SMM Panel Works" className="float pointer-events-none absolute -right-4 -top-24 h-44 sm:-top-28 sm:h-52" />
                  )}
                  <span className={`font-heading text-2xl font-semibold ${active ? "text-white" : "text-white/90"}`}>{s.n}</span>
                  <h3 className="mt-3 text-lg font-medium leading-snug">{s.t}</h3>
                  <p className={`mt-2 text-[13px] font-light leading-relaxed ${active ? "text-white/90" : "text-white/65"}`}>{s.d}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ================= SMM SERVICES TABS ================= */
export function Services() {
  const [active, setActive] = useState(platforms[0]);
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <img src={A("smm-services/section-bg.png")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full w-full object-cover opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-[#be00df]/45 via-[#5d0570]/20 to-transparent" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead before="Our Affordable SMM Panel Services" accent="in Bangladesh" sub="GrowFollows offers affordable SMM panel services for creators, businesses, agencies, and resellers. Choose your platform and order followers, likes, views, comments, subscribers, members, plays, and other engagement services from one simple dashboard." />
        <Reveal className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6" delay={100}>
          {platforms.map((p) => {
            const on = active.id === p.id;
            return (
              <button key={p.id} onClick={() => setActive(p)} aria-pressed={on}
                className={`flex items-center justify-center gap-2 rounded-[10px] px-3 py-3 text-sm transition ${on ? "btn-glow" : "border border-white/15 bg-black/40 backdrop-blur hover:border-[#be00df]/60 hover:bg-[#be00df]/10"}`}>
                <span className="inline-flex items-center gap-2"><img src={p.icon} alt="" className="h-5 w-5 object-contain" />{p.label}</span>
              </button>
            );
          })}
        </Reveal>
        <Reveal delay={150} className="mt-8">
          <article className="relative grid overflow-hidden rounded-[24px] border border-[#f4b2ff]/25 bg-gradient-to-br from-[#5d0570] via-[#9a07b4] to-[#2c0335] md:grid-cols-[1.1fr_1fr]">
            <img src={A("smm-services/noise.png")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-overlay" />
            <img src={A("smm-services/card-bottom-overlay.svg")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 w-full" />
            <div key={active.id} className="relative flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <h3 className="font-heading text-3xl font-bold leading-tight sm:text-[44px]">
                {active.title} SMM <br /><span className="text-[#f4b2ff]">Panel</span>
              </h3>
              <p className="mt-5 max-w-[440px] text-sm font-light leading-relaxed text-white/85">{active.d}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <GlowButton href="#">Explore More</GlowButton>
                <OutlineButton href="#">View Pricing</OutlineButton>
              </div>
            </div>
            <div className="relative flex min-h-[300px] items-end justify-center pt-6">
              <img key={active.img} src={active.img} alt={`${active.title} SMM Panel`} className="reveal in relative max-h-[420px] w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,.5)]" />
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= WORLDWIDE ================= */
function FlagChip({ c }: { c: string }) {
  return (
    <a href="#" className="flex shrink-0 items-center gap-2.5 rounded-lg border border-white/15 bg-white/[.06] px-4 py-2 text-sm backdrop-blur transition hover:border-[#be00df]/70 hover:bg-[#be00df]/15">
      <img src={flag(c)} alt={`${c} flag`} className="h-4 w-6 rounded-[3px] object-cover" />
      {c}
    </a>
  );
}

export function Worldwide() {
  const row = [...worldCountries, ...worldCountries];
  return (
    <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28">
      <img src={A("worldwide/stars-bg.png")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead before="SMM Panel BD with Serving" accent="150+ Counties Worldwide" sub="GrowFollows is built for Bangladesh users and also supports customers from many countries. Creators, businesses, agencies, and resellers can use our SMM panel for local campaigns, international projects, and global social media growth." />
      </div>
      <Reveal className="relative mx-auto mt-6 max-w-[1100px] px-4" delay={100}>
        <img src={A("worldwide/smm-panel-bd-with-serving-150-counties-worldwide.png")} alt="SMM Panel BD with Serving 150+ Counties Worldwide" loading="lazy" className="mx-auto w-full" />
        <img src={A("worldwide/stone.png")} alt="" aria-hidden className="float absolute left-[4%] top-[10%] w-12 sm:w-20" />
        <img src={A("worldwide/stone.png")} alt="" aria-hidden className="float absolute right-[6%] top-[30%] w-8 rotate-45 sm:w-14" style={{ animationDelay: "-3s" }} />
      </Reveal>
      <div className="marquee-wrap relative -mt-10 space-y-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] sm:-mt-20">
        <div className="marquee flex w-max gap-3">{row.map((c, i) => <FlagChip key={c + i} c={c} />)}</div>
        <div className="marquee-rev flex w-max gap-3">{row.map((c, i) => <FlagChip key={c + i} c={c} />)}</div>
      </div>
    </section>
  );
}

/* ================= VIDEO ================= */
export function LearnVideo() {
  const [play, setPlay] = useState(false);
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <img src={A("how-it-works/texture.png")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
      <img src={A("how-it-works/glow.svg")} alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-0 w-[900px] -translate-x-1/2 opacity-80" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead before="Learn How Our" accent="SMM Panel Works" sub="See how GrowFollows helps users add funds, choose services, place orders, and track progress from one simple dashboard. This guide is useful for new users, agencies, resellers, and businesses in Bangladesh and worldwide." />
        <Reveal className="relative mt-12" delay={100}>
          <div className="group relative mx-auto aspect-video max-w-[1100px] overflow-hidden rounded-[24px] border border-white/10 shadow-[0_40px_100px_-30px_rgba(190,0,223,.6)]">
            {play ? (
              <iframe className="h-full w-full" src="https://www.youtube.com/embed/-Iv5XtX7vKk?autoplay=1" title="Top Listed SMM PANEL | Grab it Fast! GrowFollows.Com | Freelancer Nasim" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <button onClick={() => setPlay(true)} className="block h-full w-full" aria-label="Play: Learn How Our SMM Panel Works">
                <img src={A("shared/cover-photo.png")} alt="Learn How Our SMM Panel Works" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
                <span className="pulse-ring absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#be00df] shadow-2xl transition group-hover:scale-110 sm:h-20 sm:w-20">
                  <Icons.play className="ml-1 h-7 w-7" />
                </span>
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= ADVANTAGES ================= */
function AdvCard({ t, d }: { t: string; d: string }) {
  return (
    <article className="h-full rounded-[20px] border border-white/10 bg-white/[.04] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#be00df]/50">
      <h3 className="text-lg font-medium">{t}</h3>
      <p className="mt-2 text-sm font-light leading-relaxed text-white/65">{d}</p>
    </article>
  );
}

export function Advantages() {
  const [fast, ...rest] = advantages;
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <img src={A("advantages/section-bg.png")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60" />
      <img src={A("advantages/section-overlay.svg")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHead before="Advantages of Using" accent="GrowFollows SMM Panel Services" sub="Our SMM panel services are made for users who want simple ordering, affordable packages, local payment support, and flexible social media growth options for different platforms." />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Reveal><AdvCard {...fast} /></Reveal>
            <Reveal delay={100} className="flex-1">
              <article className="group h-full overflow-hidden rounded-[20px] border border-white/10 bg-white/[.04] transition hover:border-[#be00df]/50">
                <div className="overflow-hidden"><img src={A("advantages/24-7-support.png")} alt="24/7 Support" loading="lazy" className="w-full transition duration-700 group-hover:scale-105" /></div>
                <div className="p-6">
                  <h3 className="text-lg font-medium">24/7 Support</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-white/65">Get help with orders, payments, dashboard use, service selection, and other account questions whenever you need support.</p>
                </div>
              </article>
            </Reveal>
          </div>
          <div className="grid gap-5">
            {rest.map((c, i) => <Reveal key={c.t} delay={60 + i * 80}><AdvCard {...c} /></Reveal>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= COMPARISON ================= */
export function Comparison() {
  return (
    <section className="relative overflow-hidden">
      <img src={A("comparison/bg-left-image.png")} alt="" aria-hidden className="pointer-events-none absolute top-[-12%] left-[-18%] w-[145%] max-w-none" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-transparent via-[#010002]/60 to-[#010002]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#010002] to-transparent" />
      <div className="relative mx-auto flex max-w-[1400px] flex-col items-center gap-10 px-4 py-14 sm:gap-16 sm:px-6 sm:py-20 lg:py-24">
        <SectionHead before="GrowFollows vs Ads Platforms" accent="for SMM Panel Services" breakLine={false} />
        <Reveal className="w-full pt-6 sm:pt-10" delay={100}>
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 rounded-[24px] border border-[#6f6f6f] bg-black/5 px-4 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-[22px] lg:px-11 lg:py-[59px]">
            {comparison.map((c, i) => (
              <div key={c.name} className="relative mx-auto w-full max-w-[280px] sm:max-w-none">
                <div className={`relative aspect-square overflow-hidden rounded-[37px] border transition duration-500 hover:-translate-y-1.5 ${c.ok ? "border-[#be00df]/70 bg-[#be00df]/10 shadow-[0_0_60px_-10px_rgba(190,0,223,.7)]" : "border-white/15 bg-white/[.03]"}`}>
                  <div className="absolute inset-0 flex items-center justify-center p-[16%]">
                    <img src={c.logo} alt={c.name} loading="lazy" className="max-h-full max-w-full object-contain" />
                  </div>
                  {!c.ok && <div className="absolute inset-0 bg-white/[.01] backdrop-blur-[3px]" />}
                </div>
                <img src={A(c.ok ? "comparison/check-badge.png" : "comparison/x-badge.png")} alt={c.ok ? "Certified partner badge" : "Not certified badge"} className="float absolute left-1/2 top-[-25px] h-[58px] w-[58px] -translate-x-1/2 object-contain" style={{ animationDelay: `${i * -1}s` }} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= FAQ ================= */
export function FAQ() {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(0);
  const list = faqCategories[tab] ?? [];
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <img src={A("faq/section-bg.png")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#010002] via-transparent to-[#010002]" />
      <div className="relative mx-auto max-w-[1000px] px-4 sm:px-6">
        <SectionHead before="Frequently" accent="Asked Questions" breakLine={false} sub="Still have questions? Find clear answers about GrowFollows, SMM panel services, order process, payments, reseller support, and social media growth." />
        <Reveal className="mt-8 flex justify-center" delay={80}>
          <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[.04] p-1">
            {faqTabs.map((t, i) => (
              <button key={t} onClick={() => { setTab(i); setOpen(0); }} className={`shrink-0 rounded-lg px-5 py-2 text-sm transition ${tab === i ? "btn-glow" : "text-white/70 hover:text-white"}`}>
                <span>{t}</span>
              </button>
            ))}
          </div>
        </Reveal>
        <ul className="mt-10 space-y-3" key={tab}>
          {list.map((f, i) => {
            const on = open === i;
            return (
              <Reveal as="li" key={f.q} delay={i * 40}>
                <div className={`rounded-2xl border transition ${on ? "border-[#be00df]/50 bg-[#be00df]/[.06]" : "border-white/10 bg-white/[.03] hover:border-white/25"}`}>
                  <button onClick={() => setOpen(on ? -1 : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-sm font-medium sm:px-7 sm:text-base">
                    <span>{i + 1}. {f.q}</span>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition duration-300 ${on ? "rotate-180 bg-white text-[#be00df]" : "bg-[#be00df]"}`}>
                      {on ? <Icons.minus className="h-4 w-4" /> : <Icons.plus className="h-4 w-4" />}
                    </span>
                  </button>
                  <div className={`grid transition-all duration-500 ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-6 text-sm font-light leading-relaxed text-white/70 sm:px-7">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ================= BLOG + HELP ================= */
export function Blog() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <p className="text-sm font-medium text-[#f4b2ff]">Tips, guides, and SMM panel insights.</p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl lg:text-[48px]">Read Our <span className="text-grad">Blog</span></h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-white/70 sm:text-base">Explore the latest GrowFollows articles on social media marketing, affordable SMM services, and practical growth strategies for creators, businesses, agencies, and resellers.</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-white/[.03] transition duration-300 hover:-translate-y-1.5 hover:border-[#be00df]/50">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={p.cover} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
                    <span className="flex items-center gap-1.5"><img src={A("blog/clock.svg")} alt="" className="h-3.5 w-3.5" />{p.date}</span>
                    <span>• {p.author}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug transition group-hover:text-[#f4b2ff]">{p.title}</h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm font-light leading-relaxed text-white/65">{p.excerpt}</p>
                  <a href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#f4b2ff]">Read more <img src={A("blog/arrow.svg")} alt="" className="h-4 w-4 transition group-hover:translate-x-1" /></a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100} className="mt-16">
          <div className="relative grid overflow-hidden rounded-[24px] border border-white/10 lg:grid-cols-[1.3fr_1fr]">
            <img src={A("blog/cta-main-bg.svg")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            <img src={A("blog/noise.png")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-overlay" />
            <img src={A("blog/cta-right-effect.svg")} alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 h-full" />
            <div className="relative p-8 sm:p-12">
              <h3 className="font-heading text-2xl font-bold leading-tight sm:text-4xl">Still Need Help? <br /><span className="text-grad">Contact GrowFollows Support</span></h3>
              <p className="mt-4 max-w-[520px] text-sm font-light leading-relaxed text-white/75">Need help choosing the right SMM panel service? Our support team is ready to guide you with orders, payments, dashboard use, and service selection. GrowFollows keeps the process simple for Bangladesh users and global customers.</p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <GlowButton href="#">Contact Support <img src={A("blog/arrow.svg")} alt="" className="h-4 w-4 brightness-0 invert" /></GlowButton>
                <div className="flex items-center gap-3">
                  <img src={A("blog/download-avatars.png")} alt="GrowFollows user avatars" className="h-10 w-auto" />
                  <div className="text-xs leading-tight text-white/70"><span className="block font-heading text-lg font-bold text-white">98,538+</span>People have signed up<br />on our website.</div>
                </div>
              </div>
            </div>
            <div className="relative flex items-end justify-center">
              <img src={A("blog/social-icons.png")} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90" />
              <img src={A("blog/still-need-help-contact-growfollows-support.webp")} alt="Still Need Help? Contact GrowFollows Support" loading="lazy" className="float relative max-h-[340px] w-auto" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= FOOTER ================= */
function FooterCol({ title, items }: { title: string; items: { label: string; icon?: string }[] }) {
  const [more, setMore] = useState(false);
  const shown = more ? items : items.slice(0, 8);
  return (
    <div>
      <h4 className="font-heading text-base font-semibold">{title}</h4>
      <ul className="mt-5 space-y-3 text-sm text-white/60">
        {shown.map((x) => (
          <li key={x.label}><a href="#" className="flex items-center gap-2 transition hover:text-white">{x.icon && <img src={x.icon} alt="" className="h-4 w-4 rounded-sm object-contain" />}{x.label}</a></li>
        ))}
      </ul>
      {items.length > 8 && (
        <button onClick={() => setMore(!more)} className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#f4b2ff] hover:text-white">
          {more ? "Show Less" : "Show More"} <Icons.chevron className={`h-4 w-4 transition ${more ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 pt-16">
      <img src={A("footer/glow-left.svg")} alt="" aria-hidden className="pointer-events-none absolute left-0 top-0 w-[500px] opacity-70" />
      <div className="relative mx-auto max-w-[1300px] px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo className="h-8" />
            <ul className="mt-6 space-y-4 text-sm text-white/70">
              <li className="flex gap-3"><img src={A("footer/icon-email.svg")} alt="Email" className="h-5 w-5 shrink-0" /><a href={`mailto:${footer.email}`} className="hover:text-white">{footer.email}</a></li>
              <li className="flex gap-3"><img src={A("footer/icon-phone.svg")} alt="Phone" className="h-5 w-5 shrink-0" /><a href="tel:+447380800689" className="hover:text-white">{footer.phone}</a></li>
              <li className="flex gap-3"><img src={A("footer/icon-location.svg")} alt="Location" className="h-5 w-5 shrink-0" /><span>{footer.address}</span></li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {footer.socials.map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={s.name} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[.04] transition hover:-translate-y-0.5 hover:border-[#be00df]">
                  <img src={s.icon} alt="" className="h-5 w-5 object-contain" />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Quick Links" items={footer.quickLinks.map((label) => ({ label }))} />
          <FooterCol title="Our Services" items={navServices.slice(1).map(([l, i]) => ({ label: l.replace("Services", "SMM Panel"), icon: A(i) }))} />
          <FooterCol title="Our Service Area" items={areaCountries.map((c) => ({ label: `SMM Panel in ${c}`, icon: flag(c) }))} />
        </div>

        <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3">
          {footer.offices.map((o) => (
            <div key={o.name} className="flex gap-3">
              <img src={o.icon} alt="" className="h-8 w-8 shrink-0 rounded-md object-contain" />
              <div><div className="text-sm font-semibold">{o.name}</div><p className="mt-1 text-xs leading-relaxed text-white/55">{o.address}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-white/55">
          <span className="mr-1">Summarize with AI:</span>
          {footer.ai.map((a) => <a key={a} href="#" className="rounded-full border border-white/10 px-3 py-1 transition hover:border-[#be00df] hover:text-white">{a}</a>)}
        </div>
      </div>

      <div className="relative mt-10">
        <img src={A("footer/footer-bottom-effect.png")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-70" />
        <img src={A("footer/Growfollows.png")} alt="Growfollows" className="relative mx-auto w-[92%] max-w-[1300px] opacity-90" />
        <div className="relative mx-auto flex max-w-[1300px] flex-col-reverse items-center justify-between gap-3 px-4 py-6 text-xs text-white/55 sm:flex-row sm:px-6">
          <p>© 2026, Growfollows, All Rights Reserved.</p>
          <div className="flex gap-5">{["Terms & Conditions", "Privacy Policy", "Refund Policy"].map((l) => <a key={l} href="#" className="hover:text-white">{l}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}

/* ================= FLOATING TELEGRAM JOIN ================= */
export function TelegramJoin() {
  return (
    <a href="https://t.me/growfollows" target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-40 flex items-center rounded-full bg-[#229ED9] px-4 py-2.5 shadow-lg shadow-[#229ED9]/40 transition hover:-translate-y-0.5 hover:shadow-xl">
      <Icons.telegram className="h-5 w-5" />
      <span className="ml-2 text-sm font-semibold">Join</span>
    </a>
  );
}
