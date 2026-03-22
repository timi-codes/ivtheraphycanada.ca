# Data Cleaning Prompt — IV Therapy & Wellness Infusion Directory (Canada)

## Task Overview

Clean a large CSV of wellness/medical business listings scraped from Google Maps into one clean, consolidated dataset with only valid, relevant listings for a Canadian IV therapy and wellness infusion directory.

Take the raw CSV → clean it → export a single consolidated CSV with only valid, relevant Canadian listings.

---

## Removal Criteria (Remove row if ANY of these apply)

### Missing Required Fields
- No business name
- No full address (needs street, not just city)
- No city
- No province/state
- No working hours listed

### Business Status
- Permanently closed
- Temporarily closed

### Quality Threshold
- 10 reviews or fewer (not enough social proof for directory listing)

### Not in Canada
- Remove any listings outside of Canada (country_code ≠ CA)

### Not a Wellness Infusion Business (remove with 99% confidence)
Based on business name and category, remove obvious non-matches:

- **Big box retailers** (Walmart, Lowe's, Home Depot, Costco, Shoppers Drug Mart, Rexall, London Drugs)
- **General hospitals or ERs** (unless they have a specific private/concierge program)
- **General GP / walk-in clinics** with no IV, wellness, or concierge focus
- **Dental clinics** (unless name suggests IV sedation therapy)
- **Veterinary clinics** (animal hospitals, pet care)
- **Gyms and fitness centres** with no IV or wellness infusion offering
- **Restaurants, cafes, juice bars** (unless name suggests IV therapy)
- **Hotels, spas** with no medical/IV focus (day spas offering only massage/facial)
- **Physiotherapy only** (unless bundled with IV or wellness clinic)
- **Chiropractors only** (unless bundled with IV or wellness clinic)
- **Mental health only** (therapists, psychologists, counselors with no IV offering)
- **Gas stations, auto shops, car rentals**
- **Law firms, accounting firms, real estate agencies**
- **Schools, daycares, universities**
- **Plumbing, construction, trades companies**
- **Any business where the name makes it 99% clear they don't offer IV therapy, NAD+, chelation, vitamin drips, or concierge medicine**

---

## Keep if ANY of these apply (even if unclear)

Keep the listing if the business name, category, or subtype contains any of the following signals:

**Direct matches (definitely keep):**
- IV therapy / IV drip / IV infusion
- Vitamin drip / vitamin infusion / vitamin IV
- NAD+ therapy / NAD infusion
- Chelation therapy / EDTA chelation / heavy metal detox
- Mobile IV / at-home IV
- Hydration therapy / hydration drip
- Myers cocktail
- Glutathione drip / glutathione infusion
- Concierge medicine / concierge doctor / concierge health
- Executive health / executive medicine
- Direct primary care / private doctor / private clinic

**Broad signals (keep for next round of filtering):**
- Wellness clinic / wellness centre / wellness lounge
- Naturopathic clinic / naturopath / naturopathic doctor (ND)
- Integrative medicine / functional medicine
- Anti-aging clinic / longevity clinic
- Med spa / medical spa / medi-spa (with medical services)
- Regenerative medicine
- Holistic health / holistic clinic
- Infusion clinic / infusion centre
- Health optimization
- Nurse practitioner clinic / RN clinic (if wellness-focused)

**Keep if unclear:** If there is any reasonable chance the business offers IV therapy, vitamin drips, NAD+, chelation, or concierge medicine — keep it for the next cleaning round. Only remove obvious non-matches here.

---

## Deduplication
- Remove duplicate listings using `place_id` as the unique identifier
- If `place_id` is empty, deduplicate by exact `name` + `address` match
- Keep the record with the most complete data when deduplicating

---

## Output Columns to Keep

From the raw CSV, retain only these columns in the final output:

```
name
category
subtypes
phone
website
address
street
city
state
postal_code
country
country_code
rating
reviews
business_status
working_hours
description
about
latitude
longitude
place_id
google_id
domain
email
company_instagram
company_facebook
booking_appointment_link
verified
photos_count
reviews_per_score_5
reviews_per_score_4
```

---

## Final Output Requirements

- Export as `result.csv`
- UTF-8 encoding
- One row per business
- No duplicate place_ids
- Only Canadian listings (country_code = CA)
- Only businesses with 11+ reviews
- Only OPERATIONAL businesses (business_status = OPERATIONAL)
- Only businesses with working hours listed
- Only businesses with a street address
- Only businesses relevant to: IV therapy, vitamin drips, NAD+, chelation, concierge medicine, wellness infusions, naturopathic clinics, integrative medicine, med spas, wellness centres
- Print a removal summary showing how many rows were removed per reason

---

## What This Data Powers

This cleaned dataset will seed a **Canadian Wellness Infusion Directory** covering:

| Service | Target Vendors |
|---------|---------------|
| IV Therapy | IV clinics, hydration lounges, mobile IV nurses |
| Vitamin IV Drips | Myers cocktail, vitamin C IV, glutathione, B12 clinics |
| NAD+ Therapy | Anti-aging clinics, longevity centres |
| Chelation Therapy | Naturopathic clinics, integrative medicine clinics |
| Mobile IV | Mobile nurses, at-home IV services |
| Concierge Medicine | Private doctors, executive health programmes |

The goal is a clean list of real, active, reputable Canadian vendors to:
1. Seed the directory with listings on launch
2. Use as outreach targets for paid listing upsells
3. Assign leads to vendors by city and service type
