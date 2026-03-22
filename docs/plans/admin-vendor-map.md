# Admin Vendor Map Page

## Route
`/admin/vendors`

New tab in the admin panel alongside existing analytics/leads tabs.

---

## Layout

Split-panel, full viewport height (minus admin nav):

| Left (40%) | Right (60%) |
|---|---|
| Filter bar + scrollable vendor list | Sticky Google Map with all vendor markers |

---

## 1. Page — `app/admin/vendors/page.tsx` (Server Component)

- Auth-gate: same `ADMIN_EMAILS` check as existing admin pages
- Fetch all vendors from Prisma: `id, name, slug, city, province, plan, isVerified, isFeatured, businessStatus, services, clinicType, lat, lng, rating, reviewCount, phone, website`
- Read filter params from `searchParams`: `province`, `city`, `plan`, `services`, `clinicType`, `status`, `verified`, `featured`, `search`
- Apply filters server-side in Prisma WHERE clauses
- Pass filtered vendor list + total count to client layout

---

## 2. Filter Bar — `components/admin/VendorFilterBar.tsx` (Client Component)

Renders above the vendor list. All filter changes push updated URL search params (SSR re-render, no separate API call).

| Filter | Type |
|---|---|
| Search | Text input (name or city) |
| Province | Single-select dropdown |
| City | Text input (free text) |
| Plan | Multi-select: `free`, `standard`, `premium`, `exclusive` |
| Services | Multi-select: all 11 service tags |
| Clinic Type | Select: `clinic`, `mobile_only`, `hybrid` |
| Business Status | Select: `OPERATIONAL`, `CLOSED_TEMPORARILY`, `CLOSED` |
| Verified | Toggle checkbox |
| Featured | Toggle checkbox |

Also shows: result count badge + "Clear all filters" button.

---

## 3. Vendor List Card — `components/admin/VendorListCard.tsx`

Compact row per vendor:
- Name + plan badge (color-coded: free=grey, standard=blue, premium=purple, exclusive=gold)
- City, Province
- Service chips (max 3, +N more)
- Star rating + review count
- Verified / Featured badges
- Click → highlights map marker + pans map to vendor

---

## 4. Map — `components/admin/VendorMap.tsx` (Client Component)

- Library: `@react-google-maps/api`
- Env var: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Markers for all vendors with `lat + lng`, color-coded by plan
- Click marker → InfoWindow with: name, city, plan badge, link to `/vendors/[slug]`
- Selecting a vendor from the list → map pans + opens InfoWindow
- Banner for vendors missing coordinates: "X vendors have no coordinates"

**Marker colors by plan:**
- `free` → grey
- `standard` → blue
- `premium` → purple
- `exclusive` → gold/amber

---

## 5. Layout Wrapper — `components/admin/VendorMapLayout.tsx` (Client Component)

Wires list ↔ map selection state:
- Holds `selectedVendorId` state
- Passes `onSelect` to list cards
- Passes `selectedVendorId` to map

---

## 6. Navigation

Add "Vendors" link to the admin tab bar in `app/admin/page.tsx`.

---

## Files to Create

```
app/admin/vendors/page.tsx
components/admin/VendorMapLayout.tsx
components/admin/VendorMap.tsx
components/admin/VendorFilterBar.tsx
components/admin/VendorListCard.tsx
```

---

## Dependencies

```bash
npm install @react-google-maps/api
```

---

## Execution Order

1. Install `@react-google-maps/api`
2. `app/admin/vendors/page.tsx` — auth + Prisma query + filter logic
3. `VendorFilterBar.tsx` — controlled filters, pushes URL params
4. `VendorListCard.tsx` — compact vendor row
5. `VendorMap.tsx` — Google Maps wrapper + markers + InfoWindow
6. `VendorMapLayout.tsx` — wires list ↔ map selection state
7. Add nav tab to admin
