# Website Crawling Prompt — IV Therapy & Wellness Infusion Directory (Canada)

## Context

I have a CSV of Canadian wellness/medical business listings (`iv_theraphy_cleaned.csv`) with columns including: `name`, `website`, `city`, `state`, `category`, `subtypes`, `description`, `about`.

**Goal:** Crawl each business website to determine which of the following services they offer, then add a new `services` column to the CSV with comma-separated service tags.

**Target service tags:**
```
iv_therapy | vitamin_iv | mobile_iv | nad_plus | chelation |
concierge | myers_cocktail | glutathione | hangover_iv | immune_iv | hydration
```

If none of the services are detected, leave the `services` column empty (`""`).

---

## Technical Setup (Crawl4AI)

```python
# Use these Crawl4AI modules for implementation
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import LLMExtractionStrategy
import google.generativeai as genai  # Gemini Flash for cost-efficient LLM classification
```

**BrowserConfig:**
- Headless mode: `True`
- Stealth settings: `True` (random user agents, human-like delays)
- Retry logic: 3 retries on failure

**CrawlerRunConfig:**
- Timeout: 15–20 seconds per page
- `PruningContentFilter`: strip nav, footer, ads — extract main content only
- `LLMExtractionStrategy` + `LLMConfig`: use Gemini Flash for cost efficiency
- `CacheMode`: cache results so crawl can be re-run without re-crawling all sites

---

## Tiered Classification Approach

### Tier 1 — Fast Keyword Pre-Filter (No LLM)

Crawl the homepage. Search extracted text for primary and secondary signals.

**Primary signals** (high confidence match — tag immediately):

| Signal Found In Text | Tag Assigned |
|----------------------|-------------|
| "iv therapy", "iv drip", "iv infusion", "intravenous therapy" | `iv_therapy` |
| "vitamin drip", "vitamin iv", "vitamin infusion", "vitamin c iv" | `vitamin_iv` |
| "mobile iv", "at-home iv", "in-home iv", "we come to you" | `mobile_iv` |
| "nad+", "nad plus", "nad therapy", "nad infusion", "nicotinamide" | `nad_plus` |
| "chelation", "edta", "heavy metal detox", "chelation therapy" | `chelation` |
| "concierge medicine", "concierge doctor", "executive health", "private doctor", "membership" | `concierge` |
| "myers cocktail", "myers' cocktail", "myer's cocktail" | `myers_cocktail` |
| "glutathione", "glutathione drip", "glutathione infusion", "skin brightening iv" | `glutathione` |
| "hangover", "hangover iv", "hangover drip", "hangover recovery" | `hangover_iv` |
| "immune boost", "immune iv", "immunity drip", "immune support iv" | `immune_iv` |
| "hydration therapy", "hydration drip", "hydration iv", "rehydration" | `hydration` |

**Secondary signals** (weaker — flag for Tier 2 LLM verification):
- "wellness infusion", "drip therapy", "infusion clinic", "iv lounge"
- "anti-aging", "longevity", "biohacking", "functional medicine"
- "naturopathic", "integrative medicine", "regenerative medicine"
- "energy boost", "athletic recovery", "performance drip"

→ If **primary signals found**: assign tags directly, skip LLM (Tier 2)
→ If **only secondary signals found**: pass to Tier 2 for LLM verification
→ If **no signals found**: go to Tier 3 (deep crawl fallback)

---

### Tier 2 — LLM Verification on Candidates

For businesses that passed secondary signal filter, use Gemini Flash to classify based on full extracted homepage content.

**LLM Prompt:**
```
You are classifying a Canadian wellness clinic website to determine
which IV therapy and wellness infusion services they offer.

Based on the following website content, identify which of these
services the business offers. Return ONLY a comma-separated list
of applicable tags. If none apply, return empty string "".

Available tags:
- iv_therapy: general IV drip therapy
- vitamin_iv: vitamin-specific IV drips (vitamin C, B12, multivitamin)
- mobile_iv: mobile/at-home IV service (nurse comes to you)
- nad_plus: NAD+ IV therapy
- chelation: chelation therapy or heavy metal detox
- concierge: concierge medicine, private doctor, membership-based care
- myers_cocktail: Myers' cocktail IV drip
- glutathione: glutathione IV drip
- hangover_iv: hangover recovery IV
- immune_iv: immune boost or immune support IV
- hydration: hydration IV therapy

Website content:
{extracted_text}

Return format: comma-separated tags only, e.g.: iv_therapy,vitamin_iv,hydration
If no services match, return: ""
```

---

### Tier 3 — Deep Crawl Fallback

If Tier 1 homepage was thin (< 200 words of content) or returned no signals:
- Also crawl `/services`, `/treatments`, `/products`, `/iv-therapy`, `/what-we-offer` pages
- Re-run Tier 1 keyword filter on combined content
- If still no signals: assign `services = ""`

---

## Crawling Logic (Pseudocode)

```python
async def classify_website(business: dict) -> str:
    url = business.get('website', '').strip()
    if not url:
        return ""

    # Step 1: Crawl homepage
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=url, config=run_config)

    if not result.success:
        return ""

    text = result.extracted_content or result.markdown or ""

    # Step 2: Tier 1 — keyword pre-filter
    tags = keyword_filter(text)
    if tags:
        return ",".join(tags)

    # Step 3: Check for secondary signals
    if has_secondary_signals(text):
        # Tier 2 — LLM verification
        tags = llm_classify(text)
        return ",".join(tags)

    # Step 4: Tier 3 — deep crawl if homepage was thin
    if len(text.split()) < 200:
        for path in ['/services', '/treatments', '/iv-therapy', '/what-we-offer']:
            deep_result = await crawler.arun(url=url.rstrip('/') + path, config=run_config)
            if deep_result.success:
                text += " " + (deep_result.extracted_content or "")
        tags = keyword_filter(text)
        if tags:
            return ",".join(tags)
        if has_secondary_signals(text):
            tags = llm_classify(text)
            return ",".join(tags)

    return ""
```

---

## Output Requirements

- Read from: `iv_theraphy_cleaned.csv`
- Write to: `iv_theraphy_with_services.csv`
- Add one new column: `services` (comma-separated tags or empty string)
- All existing columns preserved
- Print progress: `[n/total] BusinessName — tags found`
- Print final summary: total crawled, % with services detected, tag frequency breakdown
- Use `CacheMode` so partial runs can resume without re-crawling completed sites

---

## Service Tag Reference

| Tag | What It Means | Example Keywords |
|-----|--------------|-----------------|
| `iv_therapy` | General IV drip therapy | "iv therapy", "iv drip", "iv infusion" |
| `vitamin_iv` | Vitamin-specific IV drips | "vitamin drip", "vitamin c iv", "b12 iv" |
| `mobile_iv` | Nurse comes to you | "mobile iv", "at-home iv", "we come to you" |
| `nad_plus` | NAD+ IV therapy | "nad+", "nad therapy", "nicotinamide" |
| `chelation` | Chelation / heavy metal detox | "chelation", "edta", "heavy metal detox" |
| `concierge` | Private doctor / membership | "concierge medicine", "private doctor", "membership" |
| `myers_cocktail` | Myers' cocktail drip | "myers cocktail", "myers' cocktail" |
| `glutathione` | Glutathione IV drip | "glutathione", "skin brightening iv" |
| `hangover_iv` | Hangover recovery IV | "hangover", "hangover drip", "recovery iv" |
| `immune_iv` | Immune support IV | "immune boost", "immunity drip", "immune iv" |
| `hydration` | Hydration IV therapy | "hydration therapy", "hydration drip", "rehydration" |

---

## Input File Stats

| Metric | Value |
|--------|-------|
| Input file | `iv_theraphy_cleaned.csv` |
| Total rows | 798 |
| Rows with website | 778 |
| Rows without website | 20 (assign `services = ""` immediately) |
| Expected crawl time | ~2–4 hours (778 sites @ 15–20s each, concurrent) |

---

## Cost Estimate (Gemini Flash)

- Tier 1 keyword filter: free (no LLM)
- Tier 2 LLM calls: ~20–30% of sites = ~155–233 LLM calls
- Gemini Flash pricing: ~$0.075 per 1M input tokens
- Average homepage: ~1,000 tokens
- **Estimated total LLM cost: < $0.05**

---

*Prompt drafted: March 21, 2026*
