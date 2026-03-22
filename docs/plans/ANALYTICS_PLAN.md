# Analytics & Intent Intelligence Dashboard
## ivtherapycanada.ca — Full Build Plan

> Goal: Track every user interaction from first touch to lead action.
> Use data to identify high-intent markets, sell listings, and optimize placement strategy.

---

## What We Are Building

A self-hosted, first-party analytics system (no GA, no third-party) that:
- Tracks every meaningful user event with full session context
- Groups events into journeys (like the DiscoverPlasma screenshots)
- Surfaces intent signals per city, vendor, and service
- Gives you an admin dashboard to read demand and act on it

---

## Phase A — Database Schema (Prisma)

### New models to add to `schema.prisma`

```prisma
model AnalyticsSession {
  id           String   @id @default(cuid())
  sessionId    String   @unique          // UUID stored in cookie
  referrer     String?                   // document.referrer
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?
  entryPage    String                    // first URL visited
  entryMethod  String?                   // search | city-browse | province-browse | direct | service-filter
  deviceType   String?                   // mobile | desktop | tablet
  userAgent    String?
  country      String?  @default("CA")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  events       AnalyticsEvent[]
}

model AnalyticsEvent {
  id          String   @id @default(cuid())
  sessionId   String
  session     AnalyticsSession @relation(fields: [sessionId], references: [sessionId])
  event       String           // event type (see list below)
  page        String?          // current URL path
  city        String?
  province    String?
  service     String?
  vendorId    String?
  vendorName  String?
  vendorSlug  String?
  query       String?          // search query
  resultCount Int?             // search results returned
  referrer    String?          // where the click came from (city page, search, etc.)
  metadata    Json?            // flexible extra data
  createdAt   DateTime @default(now())

  @@index([event])
  @@index([sessionId])
  @@index([city])
  @@index([vendorId])
  @@index([createdAt])
}
```

---

## Phase B — Event Taxonomy

Every event has: `sessionId`, `event`, `page`, `city`, `province`, `service`, `vendorId`, timestamps.

### Discovery Events
| Event | Trigger | Key Data |
|-------|---------|----------|
| `page_view` | Every page load | page, city, province, service, referrer |
| `search_query` | User searches in autocomplete | query, resultCount |
| `search_result_click` | User clicks a search result | query, resultType (city/province/service), href |
| `city_browse` | User lands on `/[province]/[city]` | city, province |
| `province_browse` | User lands on `/[province]` | province |
| `service_filter` | User selects service filter | service, city, province |
| `vendor_list_view` | Vendor card appears on page | vendorId, position, city |
| `vendor_card_click` | User clicks vendor card | vendorId, city, sourceType (search/browse/direct) |

### High-Intent Events (Lead Actions)
| Event | Trigger | Key Data |
|-------|---------|----------|
| `phone_click` | Click phone number | vendorId, city, page |
| `website_click` | Click website link | vendorId, city, page |
| `booking_click` | Click booking link | vendorId, city, page |
| `directions_click` | Click directions/map | vendorId, city |
| `quote_submit` | Lead form submitted | vendorId, city, province, service, leadId |
| `quote_form_open` | User opens/views quote form | vendorId, city |

### Navigation Events
| Event | Trigger | Key Data |
|-------|---------|----------|
| `navbar_search` | Uses navbar search bar | query |
| `cities_dropdown_open` | Opens "Browse Cities" dropdown | — |
| `city_dropdown_click` | Clicks a city from dropdown | city, province |
| `pagination_click` | Clicks to next page | page number, city, filters |

---

## Phase C — Client-Side Tracker

### `/lib/analytics.ts` — Tracker utility

Lightweight client-side module. No dependencies. Reads `sessionId` from cookie (set server-side on first request). Sends events via `POST /api/track`.

```ts
// Usage examples:
track('phone_click', { vendorId, vendorName, city, province })
track('search_query', { query, resultCount: 5 })
track('website_click', { vendorId, city })
```

### `/app/api/track/route.ts` — Ingest endpoint

- POST only
- Reads `x-session-id` header or body
- Writes to `AnalyticsEvent` table
- Returns 200 immediately (fire and forget)

### Session cookie middleware

Set `iv_session` cookie on every first request via Next.js middleware. 30-day expiry. Used to stitch all events in a visit into one session.

---

## Phase D — Where to Add Tracking (Integration Points)

| Location | File | Events |
|----------|------|--------|
| All pages | middleware.ts | `page_view`, session init |
| Search autocomplete | `SearchAutocomplete.tsx` | `search_query`, `search_result_click` |
| City page | `app/[province]/[city]/page.tsx` | `city_browse` |
| Province page | `app/[province]/page.tsx` | `province_browse` |
| Vendor card | `VendorCard.tsx` | `vendor_card_click` |
| Vendor profile | `app/vendors/[slug]/page.tsx` | `vendor_list_view`, `phone_click`, `website_click`, `booking_click`, `directions_click` |
| Lead form | `LeadFormInline.tsx` | `quote_form_open`, `quote_submit` |
| Vendor filters | `VendorFilters.tsx` | `service_filter` |
| Navbar cities | `Navbar.tsx` | `cities_dropdown_open`, `city_dropdown_click` |
| Pagination | `vendors/page.tsx` | `pagination_click` |

---

## Phase E — Admin Analytics Dashboard

### URL: `/admin/analytics`

Protected by `ADMIN_EMAILS` env var (same as `/admin/leads`).

### Tab 1 — Overview

**Top stat cards (with % change vs prior period):**
- Total Sessions
- Unique Cities with activity
- Total Searches
- Listing Clicks (vendor card clicks)
- Lead Actions (phone + website + booking + quote)
- Lead Action Rate (actions / sessions)
- Mobile % of sessions
- Avg events per session

**Time range selector:** Today | Yesterday | 7 Days | 30 Days | This Month | Custom

**Charts:**
- Sessions over time (line chart)
- Lead actions over time (bar chart)
- Discovery method breakdown (pie: search vs city-browse vs province-browse vs direct)

**Top Cities by Demand table:**
Columns: City | Province | Sessions | Searches | Lead Actions | Action Rate
Sortable. Export to CSV.

**Top Vendors by Clicks table:**
Columns: Vendor | City | Profile Views | Phone Clicks | Website Clicks | Booking Clicks | Quotes | Total Actions | CTR

**Top Search Queries table:**
Columns: Query | Count | Avg Results | Click-through rate

---

### Tab 2 — Journey Explorer

Inspired directly by DiscoverPlasma screenshots.

**Session cards grid (12 per page):**
Each card shows:
- Entry method badge: SEARCH | BROWSE | DIRECT
- City, Province
- Journey duration
- Final lead action: WEBSITE | PHONE | BOOKING | QUOTE | (none)
- "Won by" vendor name
- Timestamp

**Click a card → session timeline:**
Full step-by-step journey:
- 🔍 Searched "IV therapy Toronto" — 12 results
- 👁 Saw 6 listings (vendor page)
- 👆 Clicked TruMed IV Therapy profile
- 🌐 Visited website → **LEAD ACTION**

Timeline uses dots/lines like DiscoverPlasma. Lead actions highlighted in green.

**Filter bar:**
- Entry method: All | Search | Browse | Direct
- Has action: All | Yes | No
- City filter
- Date range

**Bottom summary stats:**
- Avg listings viewed before action
- % of users who compare 2+ vendors
- Avg time from landing to lead action

---

### Tab 3 — City Intelligence

**City selector dropdown**

Per-city breakdown:
- Sessions this period
- Top search queries in this city
- Most clicked vendors
- Lead action rate
- Discovery method split (how are they finding this city?)
- "Uncontested" signal: cities with high demand but no paid vendor = sales opportunity

**Demand heatmap:** Canadian map with city dot sizes = session volume

---

### Tab 4 — Vendor Performance

Per-vendor stats (useful for sales conversations with clinics):
- Profile views
- Phone clicks
- Website clicks
- Booking clicks
- Quote requests
- Click-through rate from listing page
- Avg position when clicked (rank on city page)

"Show this to a vendor" mode — exportable one-page report per vendor.

---

### Tab 5 — Sales Intelligence

Automatically flags:
- **High demand, no paid vendor:** Cities with 10+ sessions but only free listings → pitch paid plan
- **High intent, no response:** Leads submitted to vendors with no email on file
- **Trending searches:** Queries up 50%+ vs prior period
- **Underperforming paid vendors:** Premium/exclusive vendors with low CTR → reach out proactively

---

## Suggested Additional Metrics to Track

### Engagement Depth
- Pages per session
- Time on site (first event → last event timestamp delta)
- Scroll depth on vendor profiles (track via IntersectionObserver)

### Search Intelligence
- Zero-result searches (queries with 0 vendors) → content/listing gaps
- Most searched cities with no city page → create city pages
- Service query distribution → which treatments have most demand

### Conversion Funnel
```
Sessions
  → Listing page views         (reach)
    → Vendor card clicks        (interest)
      → Profile page views      (consideration)
        → Lead action           (intent)
          → Quote submitted     (conversion)
```
Track drop-off at each stage per city.

### Competitive / Market
- Cities where users view 3+ vendors before acting → competitive market, opportunity for exclusive plans
- Cities where first vendor viewed = vendor acted on → dominant vendor signal

### Referrer Intelligence
- Google organic (referrer contains google.com) → SEO is working
- Direct (no referrer) → brand awareness
- Social (instagram, facebook) → social traffic

---

## Phase F — Implementation Order

### Step 1 — Schema & Migration
Add `AnalyticsSession` + `AnalyticsEvent` to `schema.prisma`, run migration.

### Step 2 — Session Middleware
Add session cookie creation to `middleware.ts`. Also capture referrer, UTM params, device type on session init. POST to `/api/sessions` to create the DB record.

### Step 3 — Track API Route
Build `POST /api/track` — validates body, writes `AnalyticsEvent`, returns 200.

### Step 4 — Client Tracker
Build `lib/analytics.ts` — `track(event, data)` function. Reads sessionId from cookie. Batches events if needed.

### Step 5 — Instrument Key Pages
Add tracking to: SearchAutocomplete, VendorCard, vendor profile CTAs (phone/website/booking), LeadFormInline, city/province pages, VendorFilters, Navbar cities dropdown.

### Step 6 — Overview Dashboard
Build `/admin/analytics` with Overview tab — stat cards, top cities table, top vendors table, top searches table.

### Step 7 — Journey Explorer
Build session card grid + session timeline view.

### Step 8 — City Intelligence Tab
Build city selector + per-city breakdown + sales opportunity flags.

### Step 9 — Vendor Performance Tab
Build per-vendor stats table + exportable report.

### Step 10 — Sales Intelligence Tab
Build automated opportunity flags.

---

## Tech Notes

- All analytics queries run server-side via Prisma (no client DB access)
- Use `Promise.all` to batch dashboard queries
- Date range filtering via `createdAt: { gte: start, lte: end }`
- No third-party analytics (PostHog, GA, Mixpanel) — 100% first-party, PIPEDA compliant
- Session cookie: `iv_session` — HttpOnly, SameSite=Lax, 30 days
- Events table will grow fast — add DB index on `createdAt` + `event` + `city` from day 1
- Consider archiving events older than 90 days to a summary table later

---

*Plan created: March 21, 2026*
