# BUILD_PLAN.md — ivtherapycanada.ca

> Claude works through each phase autonomously.
> Phases marked 🔴 PAUSE require user input before continuing.
> Check in after each phase completes.

---

## 🔴 PAUSE 0 — Before Anything (Do This First)

User must complete before Claude can build:

- [ ] Create Supabase project at supabase.com → get `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `DATABASE_URL`
- [ ] Create `.env.local` in project root with at minimum:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
  DATABASE_URL=your_postgres_connection_string
  ```

---

## Phase 1 — Project Scaffold 🤖 AUTO

Claude does all of this without asking:

- [ ] `npx create-next-app@latest . --typescript --tailwind --app --src-dir no --import-alias "@/*"`
- [ ] Install dependencies:
  ```
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs prisma @prisma/client
  npm install stripe @stripe/stripe-js resend react-email
  npm install slugify papaparse date-fns clsx tailwind-merge
  npm install -D @types/node
  ```
- [ ] Set up Prisma (`npx prisma init`)
- [ ] Write `prisma/schema.prisma` with full schema from CLAUDE.md
- [ ] Set up Supabase client (`/lib/supabase.ts`)
- [ ] Set up folder structure as defined in CLAUDE.md
- [ ] Create `.env.local.example` with all required variables
- [ ] Create `components/ui/` base components (Button, Card, Badge, Input)
- [ ] Run `npm run build` to verify no errors

**Checkpoint:** Tell user Phase 1 is done, show folder structure, confirm build passes.

---

## Phase 2 — Database & Data Seeding 🤖 AUTO

- [ ] Run `npx prisma migrate dev --name init`
- [ ] Write `/scripts/seed-vendors.ts` — reads `../iv_theraphy/iv_theraphy_final.csv`, imports all 369 vendors
- [ ] Write `/scripts/seed-cities.ts` — seeds Canadian cities (Toronto, Vancouver, Calgary, Edmonton, Ottawa, Mississauga, North York + all cities 75K+)
- [ ] Run both seed scripts
- [ ] Verify data in Supabase dashboard (ask user to confirm)

**Checkpoint:** Tell user seeding is done. Ask them to open Supabase dashboard and confirm vendors table has 369 rows.

---

## Phase 3 — Homepage 🤖 AUTO

- [ ] Build `/app/page.tsx` — homepage with:
  - Hero: headline + city search bar
  - Service type filter pills (IV Therapy | Vitamin IV | Mobile IV | NAD+ | Chelation | Concierge)
  - Featured vendors section (premium plan vendors)
  - Province grid (all 13 provinces)
  - Trust bar (# vendors, # cities, # provinces)
  - "How it works" section (3 steps)
  - "List Your Business" CTA section
  - Footer with disclaimer
- [ ] Build `components/city/CitySearch.tsx` — autocomplete city search
- [ ] Build `components/vendor/VendorCard.tsx` — vendor listing card
- [ ] Mobile responsive

**Checkpoint:** Run `npm run dev`, tell user to open localhost:3000 and review homepage. Ask: "Does the homepage look good? Should I continue to city pages?"

---

## Phase 4 — City Pages 🤖 AUTO

- [ ] Build `/app/[province]/[city]/page.tsx`
  - Dynamic route with `generateStaticParams()` for all cities in DB
  - H1: "IV Therapy in [City], [Province]"
  - Unique intro paragraph (pulled from `cities.introContent`)
  - Service filter tabs
  - Vendor cards filtered by city (sorted: exclusive → premium → standard → free)
  - Pricing FAQ section
  - Lead capture form
  - Nearby cities section
  - FAQ section (5 questions, hardcoded template per service type)
  - Schema markup: LocalBusiness + FAQPage + BreadcrumbList
- [ ] Build `/app/[province]/page.tsx` — Province hub page
- [ ] Build `/app/[province]/[city]/[service]/page.tsx` — service-specific city pages
- [ ] Generate meta titles + descriptions from template

**Checkpoint:** Tell user to check `/ontario/toronto` and one other city page. Ask for go-ahead before building vendor pages.

---

## Phase 5 — Vendor Profile Pages 🤖 AUTO

- [ ] Build `/app/vendors/[slug]/page.tsx`
  - Cover + logo area
  - Services tags
  - Provider types + clinic type badge
  - Drip packages list
  - Add-on services list
  - Description
  - Rating + review count
  - Google Maps embed
  - Phone + website + booking CTA
  - "Request a Quote" lead form (opens modal or inline)
  - Reviews section
- [ ] Build `/app/vendors/page.tsx` — full browsable vendor directory with filters

**Checkpoint:** Tell user to check a vendor profile (e.g., `/vendors/trumed-iv-therapy`). Ask for approval.

---

## Phase 6 — Lead Capture 🤖 AUTO

- [ ] Build `components/forms/LeadForm.tsx` — quote request form
  ```
  Service type (dropdown) | City | Name | Email | Phone | Message
  ```
- [ ] Build `/app/api/leads/route.ts` — POST endpoint
  - Save lead to DB
  - Send email to vendor (Resend)
  - Send confirmation to consumer (Resend)
- [ ] Build React Email templates:
  - `emails/new-lead.tsx` — vendor notification
  - `emails/lead-confirmation.tsx` — consumer confirmation
- [ ] Build `/app/get-a-quote/page.tsx` — standalone national lead form

## 🔴 PAUSE 6 — Resend Setup

User must:
- [ ] Create Resend account + verify `ivtherapycanada.ca` sending domain
- [ ] Add `RESEND_API_KEY` to `.env.local`
- [ ] Test a lead form submission end-to-end

---

## Phase 7 — Vendor Auth & Dashboard 🤖 AUTO

- [ ] Set up Supabase Auth (email + Google OAuth)
- [ ] Build `/app/dashboard/page.tsx` — overview (leads count, profile views, plan status)
- [ ] Build `/app/dashboard/leads/page.tsx` — lead inbox with status tracking
- [ ] Build `/app/dashboard/profile/page.tsx` — edit all listing fields
- [ ] Build `/app/dashboard/billing/page.tsx` — current plan, Stripe portal link
- [ ] Build middleware for auth protection on `/dashboard/*`
- [ ] Build `/app/for-vendors/page.tsx` — vendor landing page
- [ ] Build `/app/for-vendors/pricing/page.tsx` — pricing table

## 🔴 PAUSE 7 — Stripe Setup

User must:
- [ ] Create Stripe account
- [ ] Create 3 products + prices (Standard $149, Premium $299, Exclusive $499 CAD recurring)
- [ ] Add to `.env.local`:
  ```
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_STANDARD_PRICE_ID=
  STRIPE_PREMIUM_PRICE_ID=
  STRIPE_EXCLUSIVE_PRICE_ID=
  ```

---

## Phase 8 — Stripe Integration 🤖 AUTO

- [ ] Build subscription checkout flow (Stripe Checkout)
- [ ] Build `/app/api/stripe/webhook/route.ts` — handle subscription events
  - `checkout.session.completed` → upgrade vendor plan in DB
  - `customer.subscription.deleted` → downgrade to free
  - `invoice.payment_failed` → email vendor
- [ ] Build Stripe Customer Portal link in dashboard billing page
- [ ] Gate features by plan in dashboard

**Checkpoint:** Do a test checkout with Stripe test keys. Ask user to verify.

---

## Phase 9 — SEO & Technical 🤖 AUTO

- [ ] `sitemap.ts` — auto-generated from DB (all vendor + city + blog URLs)
- [ ] `robots.txt` — block `/api/*`, `/dashboard/*`
- [ ] Open Graph images for city pages
- [ ] Canonical tags on all pages
- [ ] Schema markup audit across all page types
- [ ] `next.config.ts` — image domains, redirects
- [ ] Verify Core Web Vitals with Lighthouse
- [ ] 404 page

---

## Phase 10 — Blog 🤖 AUTO

- [ ] Set up MDX blog (`/content/blog/`)
- [ ] Build `/app/blog/page.tsx` — blog listing
- [ ] Build `/app/blog/[slug]/page.tsx` — blog post
- [ ] Write first 3 posts:
  1. "How Much Does IV Therapy Cost in Canada? (2026)"
  2. "IV Therapy in Toronto: Best Clinics Ranked"
  3. "What Is NAD+ Therapy? A Canadian Guide"

---

## 🔴 PAUSE FINAL — Pre-Launch Review

User must review and approve:
- [ ] Homepage on mobile + desktop
- [ ] At least 3 city pages (Toronto, Vancouver, Calgary)
- [ ] One vendor profile
- [ ] Lead form end-to-end (submit → receive email)
- [ ] Stripe checkout end-to-end (test mode)
- [ ] Vendor dashboard (login, view leads, edit profile)
- [ ] Sitemap.xml accessible
- [ ] Schema markup validated (Google Rich Results Test)

**Then:** User deploys to Vercel + connects `ivtherapycanada.ca` domain.

---

## Quick Reference — Critical Pauses

| Phase | What's Needed |
|-------|--------------|
| Before Phase 1 | Supabase project + DATABASE_URL |
| After Phase 6 | Resend API key + domain verification |
| After Phase 7 | Stripe account + price IDs |
| After Phase 10 | Final review before Vercel deployment |

---

*Plan created: March 21, 2026*
