# Website Enrichment Summary — IV Therapy & Wellness Infusion Directory (Canada)

> **Script:** `crawl_enrich.py`
> **Input:** `iv_theraphy_services_only.csv` (369 businesses with confirmed services)
> **Output:** `iv_theraphy_enriched.csv`
> **Date run:** March 21, 2026

---

## What This Step Does

This is the **second crawl pass**, running only on the 369 businesses that had services confirmed in the first crawl. Instead of detecting *what services they offer*, this pass extracts *how they operate and what else they offer* — turning basic listings into rich, filterable directory profiles.

---

## Results at a Glance

| Metric | Value |
|--------|-------|
| Total businesses enriched | 369 |
| With online booking detected | **351 (95.1%)** |
| New columns added | 5 |

---

## New Columns Added

| Column | Values | Purpose |
|--------|--------|---------|
| `provider_type` | md, nd, rn, np | Who administers treatments |
| `clinic_type` | clinic, mobile_only, hybrid | Physical location vs mobile service |
| `drip_packages` | energy, beauty, athletic, anti_aging, detox, weight_loss, fertility, hangover, immune, hydration_pkg | Named drip packages offered |
| `add_on_services` | hyperbaric, ozone, peptides, hormone_therapy, cryotherapy, red_light, weight_loss_program, botox, laser, acupuncture | Other treatments beyond IV |
| `has_booking` | true / false | Whether online booking is available |

---

## Provider Type Breakdown

| Provider | Count | Notes |
|----------|-------|-------|
| Naturopath (ND) | 240 | Dominant provider type in Canadian IV therapy market |
| Registered Nurse (RN) | 125 | Common for mobile IV and med spas |
| Medical Doctor (MD) | 97 | Higher-end concierge and integrative clinics |
| Nurse Practitioner (NP) | 41 | Often alongside MDs in integrative practices |

> **Insight:** NDs dominate because IV therapy is a core naturopathic offering in Canada. MDs are mainly in concierge / executive health clinics.

---

## Clinic Type Breakdown

| Type | Count | Notes |
|------|-------|-------|
| Physical clinic | 351 | Has a fixed location patients visit |
| Hybrid (clinic + mobile) | 16 | Offers both in-clinic and at-home service |
| Mobile only | 1 | Nurse comes to patient — no physical clinic |

> **Insight:** Mobile IV is underrepresented in the data — many mobile operators may not have robust websites or aren't on Google Maps yet. Opportunity for outreach.

---

## Drip Package Breakdown

| Package | Count | What It Covers |
|---------|-------|----------------|
| `energy` | 136 | Energy boost, fatigue, jet lag drips |
| `anti_aging` | 128 | Longevity, anti-aging, age-defying drips |
| `fertility` | 117 | Fertility, reproductive health, pregnancy support |
| `immune` | 65 | Immune boost, cold & flu, immunity drips |
| `detox` | 58 | Detox, heavy metal, cleanse drips |
| `hydration_pkg` | 57 | Hydration packages and rehydration drips |
| `beauty` | 50 | Skin brightening, glow, hair/skin/nails drips |
| `athletic` | 46 | Athletic recovery, performance, post-workout drips |
| `weight_loss` | 44 | Lipotropic, metabolism, slim drips |
| `hangover` | 32 | Hangover recovery, party recovery drips |

> **Insight:** Energy and anti-aging are the top two packages — these should be the primary filter options on the directory. Fertility is surprisingly high — many naturopathic IV clinics target reproductive health patients.

---

## Add-On Services Breakdown

| Add-On | Count | Notes |
|--------|-------|-------|
| `acupuncture` | 181 | Most common — tied to ND-run clinics |
| `botox` | 123 | Very common in med spas that also do IV |
| `hormone_therapy` | 121 | HRT, testosterone, menopause management |
| `laser` | 112 | Laser skin treatments alongside IV |
| `weight_loss_program` | 64 | Semaglutide / GLP-1 programs (Ozempic, Wegovy) |
| `red_light` | 36 | Red light / photobiomodulation therapy |
| `ozone` | 23 | Ozone IV therapy |
| `peptides` | 18 | Peptide therapy (BPC-157, etc.) |
| `cryotherapy` | 13 | Cold plunge / whole-body cryotherapy |
| `hyperbaric` | 9 | Hyperbaric oxygen therapy (HBOT) |

> **Insight:** Acupuncture + botox + hormone therapy dominate — these clinics are full-service wellness centres, not just IV drip bars. The weight loss program count (64) reflects the Ozempic/semaglutide boom in Canadian med spas.

---

## Technical Setup

### Classification Approach

**Tier 1 — Keyword Regex** (fast, free)
- Pattern-matched all 5 feature categories against homepage + deep crawl text
- Clinic type uses priority logic: `mobile_only` checked first, then `hybrid`, then `clinic`

**Tier 2 — Gemini LLM** (always runs if ≥ 100 words of content)
- Used `gemini-2.5-flash-lite` for cost efficiency
- Prompt returns structured JSON — validated against allowed value lists before saving
- Results **merged** with Tier 1 (union of both — no data lost)

**Booking Shortcut**
- If `booking_appointment_link` column is already populated from original data → `has_booking = true` without needing crawl

### Deep Crawl Paths (for thin homepages)
```
/services  /treatments  /iv-therapy  /what-we-offer
/our-services  /about  /team  /providers  /practitioners
```

### Configuration
```python
CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    page_timeout=20_000,
    wait_until="networkidle",
    scan_full_page=True,
    word_count_threshold=5,
    excluded_tags=["script", "style"],
)
CONCURRENCY = 5
```

---

## Output Files

| File | Description |
|------|-------------|
| `iv_theraphy_enriched.csv` | 369 businesses with all original columns + 5 new enrichment columns |
| `.enrich_cache.json` | URL → enrichment cache for resumable re-runs |

---

## Directory Filters This Data Powers

The enriched dataset enables these user-facing filters on the directory:

| Filter | Column | Options |
|--------|--------|---------|
| Provider type | `provider_type` | MD, ND, RN, NP |
| Clinic or mobile | `clinic_type` | Clinic, Mobile, Both |
| Drip packages | `drip_packages` | Energy, Beauty, Anti-Aging, Athletic, Detox… |
| Add-on treatments | `add_on_services` | Hyperbaric, Ozone, Hormones, Red Light… |
| Online booking | `has_booking` | Yes / No |
| Services | `services` | IV Therapy, NAD+, Chelation, Glutathione… |
| City / Province | `city`, `state` | All Canadian provinces |

---

*Enrichment completed: March 21, 2026*
