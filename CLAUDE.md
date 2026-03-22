# CLAUDE.md — ivtherapycanada.ca Directory

## What We Are Building

A Canadian IV therapy & wellness infusion directory at `ivtherapycanada.ca`.

**Model:** Rank & Rent / Local Lead Generation
**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · Stripe · Resend · Vercel

---

## Core Rules

### Always Do (No Need to Ask)
- Create, edit, delete files freely
- Run `npm install`, `npm run dev`, `npm run build`
- Run `npx prisma migrate dev`, `npx prisma generate`
- Create Supabase migration files
- Write all page components, API routes, server actions
- Implement all UI without asking for design approval on first pass
- Commit code with git

### Always Pause and Ask the User When
- You need an API key, secret, or credential that isn't in `.env.local`
- A database migration would DROP or ALTER existing tables with data
- You're about to push to git remote or deploy to Vercel
- A Stripe product or price needs to be created in the dashboard
- There is a critical architectural decision that affects multiple phases
- Something is broken and you've tried 2+ approaches without success

### Never Do
- Push to git remote without asking
- Deploy to Vercel without asking
- Add `.env.local` values — always ask the user to provide them
- Use placeholder/fake data in production code paths

---

## Tech Stack & Versions

```
Next.js 15 (App Router, TypeScript)
Tailwind CSS 4
Supabase (PostgreSQL + Auth + Storage)
Prisma (ORM)
Stripe (subscriptions + pay-per-lead)
Resend + React Email (transactional email)
Vercel (hosting)
Google Maps Embed API (vendor maps)
```

---

## Project Structure

```
/app
  /[province]
    /[city]
      page.tsx              ← City landing page (SSG)
      /[service]
        page.tsx            ← Service-specific city page
  /vendors
    page.tsx                ← Full vendor directory
    /[slug]
      page.tsx              ← Vendor profile
  /blog
    page.tsx
    /[slug]
      page.tsx
  /for-vendors
    page.tsx                ← Vendor landing + pricing
  /dashboard                ← Protected (auth required)
    page.tsx
    /leads/page.tsx
    /profile/page.tsx
    /billing/page.tsx
  /get-a-quote
    page.tsx
  /api
    /leads/route.ts
    /vendors/route.ts
    /stripe/webhook/route.ts
/components
  /ui                       ← Shared UI components
  /vendor                   ← Vendor-specific components
  /city                     ← City page components
  /forms                    ← Lead form, vendor form
/lib
  /supabase.ts
  /stripe.ts
  /resend.ts
  /utils.ts
/prisma
  schema.prisma
/data
  iv_theraphy_final.csv     ← Source vendor data (369 businesses)
  cities.json               ← Canadian cities seed data
```

---

## Database Schema

```prisma
model Vendor {
  id                   String   @id @default(cuid())
  name                 String
  slug                 String   @unique
  description          String?
  logoUrl              String?
  phone                String?
  website              String?
  email                String?
  address              String?
  street               String?
  city                 String
  province             String
  postalCode           String?
  lat                  Float?
  lng                  Float?
  rating               Float?
  reviewCount          Int      @default(0)
  services             String[] // iv_therapy, vitamin_iv, mobile_iv, nad_plus, chelation, concierge, myers_cocktail, glutathione, hangover_iv, immune_iv, hydration
  providerType         String[] // md, nd, rn, np
  clinicType           String   @default("clinic") // clinic | mobile_only | hybrid
  dripPackages         String[] // energy, beauty, athletic, anti_aging, detox, weight_loss, fertility, hangover, immune, hydration_pkg
  addOnServices        String[] // hyperbaric, ozone, peptides, hormone_therapy, cryotherapy, red_light, weight_loss_program, botox, laser, acupuncture
  hasBooking           Boolean  @default(false)
  bookingLink          String?
  instagram            String?
  facebook             String?
  plan                 String   @default("free") // free | standard | premium | exclusive
  stripeCustomerId     String?
  stripeSubscriptionId String?
  isVerified           Boolean  @default(false)
  isFeatured           Boolean  @default(false)
  businessStatus       String   @default("OPERATIONAL")
  workingHours         String?
  googlePlaceId        String?
  photosCount          Int      @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  leads                Lead[]
  reviews              Review[]
  users                VendorUser[]
}

model City {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  province        String
  provinceSlug    String
  population      Int?
  lat             Float?
  lng             Float?
  nearbyCities    String[]
  metaTitle       String?
  metaDescription String?
  introContent    String?
  createdAt       DateTime @default(now())
}

model Lead {
  id             String   @id @default(cuid())
  city           String
  province       String?
  serviceType    String?
  name           String
  email          String
  phone          String?
  message        String?
  vendorId       String?
  vendor         Vendor?  @relation(fields: [vendorId], references: [id])
  status         String   @default("new") // new | sent | converted | spam
  leadFee        Float?
  billed         Boolean  @default(false)
  createdAt      DateTime @default(now())
}

model Review {
  id         String   @id @default(cuid())
  vendorId   String
  vendor     Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  authorName String?
  rating     Int
  body       String?
  source     String   @default("direct") // direct | google_import
  createdAt  DateTime @default(now())
}

model VendorUser {
  id        String   @id @default(cuid())
  vendorId  String
  vendor    Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  userId    String
  role      String   @default("owner")
  createdAt DateTime @default(now())
}
```

---

## Service Tags Reference

```
iv_therapy      → General IV drip/infusion therapy
vitamin_iv      → Vitamin C, B12, multivitamin IV
mobile_iv       → Mobile/at-home IV service
nad_plus        → NAD+ IV therapy
chelation       → Chelation/heavy metal detox IV
concierge       → Concierge medicine/private doctor
myers_cocktail  → Myers' cocktail IV drip
glutathione     → Glutathione IV drip
hangover_iv     → Hangover recovery IV
immune_iv       → Immune boost IV
hydration       → Hydration IV therapy
```

---

## URL Structure

```
/                                         Homepage
/ontario/toronto/                         City page
/ontario/toronto/iv-therapy/              Service+city page
/ontario/toronto/nad-plus/
/ontario/toronto/chelation-therapy/
/ontario/toronto/concierge-medicine/
/vendors/                                 All vendors
/vendors/[slug]/                          Vendor profile
/blog/                                    Blog hub
/blog/[slug]/                             Blog post
/for-vendors/                             Vendor landing
/for-vendors/pricing/                     Pricing page
/get-a-quote/                             National lead form
/dashboard/                               Vendor dashboard (auth)
/dashboard/leads/
/dashboard/profile/
/dashboard/billing/
```

---

## Pricing Plans

```
Free      $0/mo   — Basic listing (name, city, phone)
Standard  $149/mo — Full profile, photos, priority placement
Premium   $299/mo — Featured badge, top placement, lead notifications
Exclusive $499/mo — Only vendor shown in city, all leads routed to them
```

---

## Pay-Per-Lead Pricing

```
iv_therapy / vitamin_iv / hydration  →  $20–$40/lead
nad_plus                             →  $40–$80/lead
chelation                            →  $80–$150/lead
concierge                            →  $100–$200/lead
```

---

## Environment Variables Needed

Ask the user for these — never hardcode:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STANDARD_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_EXCLUSIVE_PRICE_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@ivtherapycanada.ca

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# App
NEXT_PUBLIC_SITE_URL=https://ivtherapycanada.ca
```

---

## Design Guidelines

- **Colours:** Clean medical/wellness feel — white background, deep teal primary (`#0D7377`), soft green accent (`#84C318`)
- **Font:** Inter (body) + Cal Sans or Sora (headings)
- **Style:** Modern, clean, trustworthy — not cold clinical, not spa-fluffy. Think RateMDs meets Zocdoc meets a wellness brand.
- **Mobile first** — majority of searches are mobile
- **No stock photo overload** — use icons and clean cards over generic health photos

---

## Medical Disclaimer

Add to footer and all service pages:

> *This directory lists service providers for informational purposes only and does not constitute medical advice. IV therapy, chelation therapy, NAD+ therapy, and related services should only be pursued under the guidance of a licensed medical professional.*

---

## Vendor Data

The seed data is at: `../iv_theraphy/iv_theraphy_final.csv`
- 369 businesses
- 37 columns including: name, phone, website, address, city, state, rating, reviews, services, provider_type, clinic_type, drip_packages, add_on_services, has_booking, description, booking_appointment_link, company_instagram, company_facebook, latitude, longitude

Import script should:
1. Read the CSV
2. Generate a slug from the business name (slugify)
3. Map `state` → `province`
4. Split comma-separated fields (services, provider_type, drip_packages, add_on_services) into arrays
5. Insert into the vendors table via Prisma

---

## Current Build Phase

**PHASE 1 — Project Setup**

See BUILD_PLAN.md for the full phased checklist.
