# PayFollows Web (Next.js 15)

The new PayFollows SMM panel storefront + dashboard, rebuilt with Next.js 15 App Router.
It reuses the existing Supabase database and the legacy Vite panel's serverless API
(deployed as the `payfollows` Vercel project) — no database migration required.

## Stack

- **Next.js 15** (App Router, TypeScript, React 19)
- **Tailwind CSS** + Radix UI primitives (shadcn-style component library in `src/components/ui`)
- **GSAP** (+ ScrollTrigger, `@gsap/react`) landing animations
- **Framer Motion** UI micro-interactions, **Embla** carousel, **Sonner** toasts
- **TanStack Query** data layer, **Supabase JS** (PKCE auth)
- Fontsource variable fonts (Inter + Space Grotesk) — no external font network needed

## Architecture

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx                # GSAP landing page
│   │   ├── login/ register/        # Supabase auth
│   │   ├── dashboard/              # User panel (overview, new-order, orders, services, add-funds, support, api)
│   │   └── admin/                  # Admin panel (users, orders, services, providers, payments, announcements, support, settings)
│   ├── components/
│   │   ├── ui/                     # Design-system primitives
│   │   ├── landing/                # GSAP landing sections
│   │   ├── dashboard/              # Shell, sidebar, topbar, stat cards
│   │   └── shared/                 # Logo, auth shell, empty state
│   └── lib/
│       ├── api.ts                  # All data calls (Supabase + legacy API)
│       ├── supabase/client.ts      # Browser Supabase client
│       ├── auth.tsx                # Auth provider / route guard
│       ├── currency.tsx            # Multi-currency formatting
│       └── constants.ts            # Navigation, platforms, status styles
```

### Backend connectivity

- `NEXT_PUBLIC_API_BASE_URL` points to the legacy panel (`https://payfollows.vercel.app`).
  The browser calls its `/api/*` routes cross-origin; CORS already allows `*.vercel.app`.
- In local dev, `next.config.mjs` rewrites relative `/api/*` requests to that base URL.
- Supabase env vars use the same project as the legacy panel, so existing accounts and data work unchanged.

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=https://payfollows.vercel.app
NEXT_PUBLIC_FASTPAY_MERCHANT_ID=...
NEXT_PUBLIC_FASTPAY_BASE_URL=https://api.fastpay.com/v1
```

## Scripts

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Vercel

Separate Vercel project **`payfollows-web`**, root directory `web/`, framework preset Next.js.
The legacy `payfollows` project keeps running unchanged as the API/payment backend.
