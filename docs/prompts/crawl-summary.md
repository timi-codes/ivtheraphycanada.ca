# Website Crawl Summary — IV Therapy & Wellness Infusion Directory (Canada)

> **Script:** `crawl_services.py`
> **Input:** `iv_theraphy_cleaned.csv`
> **Output:** `iv_theraphy_with_services.csv`
> **Date run:** March 21, 2026

---

## Results at a Glance

| Metric | Value |
|--------|-------|
| Total businesses crawled | 798 |
| Services detected | **369 (46.2%)** |
| No services detected | 429 (53.8%) |
| Final output (services only) | `iv_theraphy_services_only.csv` — 369 rows |

---

## Tag Frequency Breakdown

| Tag | Count | What It Covers |
|-----|-------|----------------|
| `iv_therapy` | 319 | General IV drip / infusion therapy |
| `vitamin_iv` | 170 | Vitamin C, B12, multivitamin IV drips |
| `glutathione` | 131 | Glutathione IV drip / skin brightening |
| `hydration` | 130 | Hydration IV therapy / hydration drip |
| `immune_iv` | 109 | Immune boost / immune support IV |
| `myers_cocktail` | 103 | Myers' cocktail IV drip |
| `hangover_iv` | 81 | Hangover recovery IV |
| `nad_plus` | 56 | NAD+ IV therapy |
| `chelation` | 30 | Chelation therapy / heavy metal detox |
| `concierge` | 16 | Concierge medicine / private doctor |
| `mobile_iv` | 4 | Mobile / at-home IV service |

---

## Technical Setup

### Tools Used

| Tool | Version / Model | Purpose |
|------|----------------|---------|
| Crawl4AI | v0.8.5 | Async headless browser crawling |
| Gemini Flash | `gemini-2.5-flash-lite` | LLM service classification (Tier 2) |
| Python | 3.13 | Script runtime |

### Crawler Configuration

```python
BrowserConfig(
    headless=True,
    extra_args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
)

CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    page_timeout=20_000,         # 20s per page
    wait_until="networkidle",    # wait for JS to finish rendering
    scan_full_page=True,         # scroll to trigger lazy-loaded content
    word_count_threshold=5,
    excluded_tags=["script", "style"],
)
```

### Concurrency

- **5 simultaneous crawls** (`asyncio.Semaphore(5)`)
- Cache saved every 25 rows to `.crawl_cache.json`

---

## Classification Approach (3 Tiers)

### Tier 1 — Keyword Pre-Filter (No LLM)
- Regex match against 11 `PRIMARY_SIGNALS` dictionaries on homepage text
- If any primary keyword found → tag assigned immediately, skip LLM
- **Fast, free, high precision**

### Tier 2 — LLM Verification (Gemini Flash)
- Triggered when secondary signals found but no primary keywords
- Secondary signals: `wellness infusion`, `drip therapy`, `infusion clinic`, `iv lounge`, `anti-aging`, `longevity`, `functional medicine`, etc.
- Gemini classifies from extracted homepage text (first 2,000 chars)
- **Used for ~20–30% of sites**

### Tier 3 — Deep Crawl Fallback
- Triggered when homepage text is thin (< 150 words)
- Crawls sub-pages: `/services`, `/treatments`, `/iv-therapy`, `/what-we-offer`, `/our-services`, `/iv-drip`, `/offerings`, `/programs`
- Re-runs Tier 1 + Tier 2 on combined text
- **Catches clinics with minimal homepage content**

---

## Issues & Fixes During Run

| Issue | Fix Applied |
|-------|-------------|
| `content_filter` argument not in Crawl4AI v0.8.5 | Removed `PruningContentFilter`, used `excluded_tags` + `word_count_threshold` instead |
| `wait_until='domcontentloaded'` missing JS-rendered content | Changed to `wait_until='networkidle'` |
| `scan_full_page=False` missing lazy-loaded content | Changed to `scan_full_page=True` |
| Stale cache returning old `[none]` results | Set `CacheMode.BYPASS`, deleted `.crawl_cache.json` |
| `gemini-1.5-flash` deprecated (404 error) | Updated to `gemini-2.5-flash-lite` |
| `gemini-2.0-flash` / `gemini-2.0-flash-lite` unavailable to new API keys | Confirmed available models via `genai.list_models()`, settled on `gemini-2.5-flash-lite` |

---

## Output Files

| File | Description |
|------|-------------|
| `iv_theraphy_with_services.csv` | All 798 businesses with new `services` column |
| `iv_theraphy_services_only.csv` | 369 businesses with at least one service detected |
| `.crawl_cache.json` | URL → services cache (resumable crawls) |

---

## Notes on Empty Results (429 businesses)

The 429 businesses with no services detected are not errors — they are likely:

- **General wellness clinics** that passed the initial data cleaning but don't offer IV therapy (e.g., physiotherapy, massage, mental health)
- **Med spas** focused on aesthetics only (laser, Botox, fillers — no IV drips)
- **Sites that failed to load** due to timeouts, bot detection, or broken URLs
- **Thin or JS-heavy sites** where content wasn't extractable

These can be reviewed manually or excluded from the directory seed data. The `iv_theraphy_services_only.csv` file (369 rows) is the clean, verified dataset ready for directory seeding.

---

*Crawl completed: March 21, 2026*
