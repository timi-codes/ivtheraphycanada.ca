"""
IV Therapy & Wellness Infusion Directory — Website Service Crawler
Reads iv_theraphy_cleaned.csv, crawls each website, detects services offered,
writes iv_theraphy_with_services.csv with a new `services` column.
"""

import asyncio
import csv
import json
import os
import re
import time
from pathlib import Path

import google.generativeai as genai
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# ─── CONFIG ────────────────────────────────────────────────────────────────────

INPUT_FILE  = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_cleaned.csv"
OUTPUT_FILE = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_with_services.csv"
CACHE_FILE  = "/Users/timicodes/Project/iv_theraphy/.crawl_cache.json"

# Your Gemini API key — set as env var or paste here
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")

CONCURRENCY   = 5     # simultaneous crawls
TIMEOUT       = 20    # seconds per page
MIN_WORDS     = 150   # homepage considered "thin" below this

# ─── SERVICE TAGS ──────────────────────────────────────────────────────────────

ALL_TAGS = [
    "iv_therapy", "vitamin_iv", "mobile_iv", "nad_plus", "chelation",
    "concierge", "myers_cocktail", "glutathione", "hangover_iv",
    "immune_iv", "hydration",
]

# ─── TIER 1: KEYWORD MAPS ──────────────────────────────────────────────────────

PRIMARY_SIGNALS = {
    "iv_therapy":     [
        r"iv therapy", r"iv drip", r"iv infusion", r"intravenous therapy",
        r"intravenous drip", r"intravenous infusion",
    ],
    "vitamin_iv":     [
        r"vitamin drip", r"vitamin iv", r"vitamin infusion",
        r"vitamin c iv", r"vitamin c drip", r"b12 iv", r"b-12 iv",
        r"multivitamin iv", r"vitamin b iv",
    ],
    "mobile_iv":      [
        r"mobile iv", r"at.home iv", r"in.home iv",
        r"we come to you", r"iv at home", r"iv to your",
        r"mobile infusion", r"home iv service",
    ],
    "nad_plus":       [
        r"nad\+", r"nad plus", r"nad therapy", r"nad infusion",
        r"nad iv", r"nicotinamide adenine", r"nad drip",
    ],
    "chelation":      [
        r"chelation", r"edta", r"heavy metal detox",
        r"chelation therapy", r"heavy metal iv",
    ],
    "concierge":      [
        r"concierge medicine", r"concierge doctor", r"concierge health",
        r"executive health", r"executive medicine", r"private doctor",
        r"direct primary care", r"membership medicine",
        r"membership.based care", r"personal physician",
    ],
    "myers_cocktail": [
        r"myers cocktail", r"myers' cocktail", r"myer's cocktail",
        r"myers' iv", r"meyer's cocktail",
    ],
    "glutathione":    [
        r"glutathione", r"skin brightening iv",
        r"glutathione drip", r"glutathione infusion",
    ],
    "hangover_iv":    [
        r"hangover", r"hangover iv", r"hangover drip",
        r"hangover recovery", r"after party", r"party recovery",
    ],
    "immune_iv":      [
        r"immune boost", r"immune iv", r"immune drip",
        r"immunity drip", r"immune support iv", r"immune infusion",
        r"immunity boost", r"immune system iv",
    ],
    "hydration":      [
        r"hydration therapy", r"hydration drip", r"hydration iv",
        r"rehydration", r"iv hydration", r"hydration infusion",
    ],
}

SECONDARY_SIGNALS = [
    r"wellness infusion", r"drip therapy", r"infusion clinic",
    r"infusion centre", r"infusion center", r"iv lounge",
    r"anti.aging", r"longevity", r"biohack",
    r"naturopath", r"integrative medicine", r"functional medicine",
    r"regenerative medicine", r"energy boost drip",
    r"athletic recovery", r"performance drip",
    r"wellness clinic", r"wellness centre", r"medical spa",
    r"med spa", r"medspa",
]

DEEP_CRAWL_PATHS = [
    "/services", "/treatments", "/iv-therapy", "/what-we-offer",
    "/our-services", "/iv-drip", "/offerings", "/programs",
]

# ─── HELPERS ───────────────────────────────────────────────────────────────────

def keyword_filter(text: str) -> list[str]:
    """Tier 1: fast regex keyword matching. Returns list of matched tags."""
    text_lower = text.lower()
    tags = []
    for tag, patterns in PRIMARY_SIGNALS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                tags.append(tag)
                break
    return tags


def has_secondary_signals(text: str) -> bool:
    """Check if text has secondary wellness signals worth passing to LLM."""
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in SECONDARY_SIGNALS)


def word_count(text: str) -> int:
    return len(text.split())


def load_cache() -> dict:
    if Path(CACHE_FILE).exists():
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


# ─── TIER 2: LLM CLASSIFICATION ────────────────────────────────────────────────

genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-2.5-flash-lite")

def llm_classify(text: str) -> list[str]:
    """Use Gemini Flash to classify services from extracted website text."""
    prompt = f"""You are classifying a Canadian wellness clinic website to determine
which IV therapy and wellness infusion services they offer.

Based on the following website content, identify which of these services
the business offers. Return ONLY a comma-separated list of applicable tags.
If none apply, return exactly: ""

Available tags:
- iv_therapy: general IV drip or infusion therapy
- vitamin_iv: vitamin-specific IV drips (vitamin C, B12, multivitamin)
- mobile_iv: mobile or at-home IV service (nurse comes to patient)
- nad_plus: NAD+ IV therapy
- chelation: chelation therapy or heavy metal detox IV
- concierge: concierge medicine, private doctor, executive health, membership-based care
- myers_cocktail: Myers' cocktail IV drip
- glutathione: glutathione IV drip or infusion
- hangover_iv: hangover recovery IV drip
- immune_iv: immune boost or immune support IV
- hydration: hydration IV therapy or hydration drip

Website content (first 2000 chars):
{text[:2000]}

Return format: comma-separated tags only, e.g.: iv_therapy,vitamin_iv,hydration
If no services match, return: ""
"""
    try:
        response = gemini.generate_content(prompt)
        raw = response.text.strip().strip('"').strip()
        if not raw:
            return []
        tags = [t.strip() for t in raw.split(",") if t.strip() in ALL_TAGS]
        return tags
    except Exception as e:
        print(f"    [LLM ERROR] {e}")
        return []


# ─── CORE CRAWLER ──────────────────────────────────────────────────────────────

async def classify_website(
    business: dict,
    crawler: AsyncWebCrawler,
    run_config: CrawlerRunConfig,
    cache: dict,
) -> str:
    """Full 3-tier classification for one business website."""
    url = (business.get("website") or "").strip()
    name = business.get("name", "Unknown")

    if not url:
        return ""

    # Check cache first
    if url in cache:
        return cache[url]

    # ── Tier 1 & 3: Crawl homepage ──────────────────────────────────────────
    try:
        result = await crawler.arun(url=url, config=run_config)
        text = ""
        if result.success:
            text = result.markdown or result.extracted_content or ""
    except Exception as e:
        print(f"    [CRAWL ERROR] {name}: {e}")
        cache[url] = ""
        return ""

    # Tier 1 — keyword pre-filter
    tags = keyword_filter(text)
    if tags:
        services = ",".join(sorted(set(tags)))
        cache[url] = services
        return services

    # Check secondary signals
    if has_secondary_signals(text) and word_count(text) >= MIN_WORDS:
        # Tier 2 — LLM
        tags = llm_classify(text)
        services = ",".join(sorted(set(tags)))
        cache[url] = services
        return services

    # Tier 3 — deep crawl if homepage was thin
    if word_count(text) < MIN_WORDS:
        combined = text
        base_url = url.rstrip("/")
        for path in DEEP_CRAWL_PATHS:
            try:
                deep = await crawler.arun(url=base_url + path, config=run_config)
                if deep.success:
                    combined += " " + (deep.markdown or deep.extracted_content or "")
            except Exception:
                pass

        tags = keyword_filter(combined)
        if tags:
            services = ",".join(sorted(set(tags)))
            cache[url] = services
            return services

        if has_secondary_signals(combined):
            tags = llm_classify(combined)
            services = ",".join(sorted(set(tags)))
            cache[url] = services
            return services

    cache[url] = ""
    return ""


# ─── MAIN ──────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("IV Therapy Directory — Website Service Crawler")
    print("=" * 60)

    # Load input CSV
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    total = len(rows)
    print(f"Loaded {total} businesses from {INPUT_FILE}")

    # Load cache
    cache = load_cache()
    cached_count = sum(1 for r in rows if (r.get("website") or "").strip() in cache)
    print(f"Cache: {len(cache)} entries ({cached_count} of {total} already done)")
    print()

    # Configure Crawl4AI
    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
    )

    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,   # bypass so we re-crawl with new settings
        page_timeout=TIMEOUT * 1000,
        wait_until="networkidle",      # wait for JS to finish rendering
        scan_full_page=True,           # scroll to trigger lazy-loaded content
        verbose=False,
        word_count_threshold=5,
        excluded_tags=["script", "style"],
    )

    # Tag frequency tracker
    tag_counts = {tag: 0 for tag in ALL_TAGS}
    services_found = 0

    # Process in batches
    semaphore = asyncio.Semaphore(CONCURRENCY)
    results = [""] * total

    async def process(index: int, row: dict, crawler: AsyncWebCrawler):
        async with semaphore:
            url = (row.get("website") or "").strip()
            name = row.get("name", "Unknown")

            services = await classify_website(row, crawler, run_config, cache)
            results[index] = services

            tag_list = [t for t in services.split(",") if t]
            status = f"[{services}]" if services else "[none]"
            print(f"  [{index+1:>4}/{total}] {name[:45]:<45} {status}")

            # Save cache every 25 rows
            if (index + 1) % 25 == 0:
                save_cache(cache)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        tasks = [process(i, row, crawler) for i, row in enumerate(rows)]
        await asyncio.gather(*tasks)

    # Final cache save
    save_cache(cache)

    # Attach results to rows
    output_headers = list(headers) + ["services"]
    for i, row in enumerate(rows):
        row["services"] = results[i]
        if results[i]:
            services_found += 1
            for tag in results[i].split(","):
                if tag in tag_counts:
                    tag_counts[tag] += 1

    # Write output CSV
    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=output_headers)
        writer.writeheader()
        writer.writerows(rows)

    # ── Summary ──────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("CRAWL COMPLETE")
    print("=" * 60)
    print(f"Total businesses:       {total}")
    print(f"Services detected:      {services_found} ({services_found/total*100:.1f}%)")
    print(f"No services detected:   {total - services_found}")
    print()
    print("Tag frequency breakdown:")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
        bar = "█" * (count // 3)
        print(f"  {tag:<18} {count:>4}  {bar}")
    print()
    print(f"Output saved to: {OUTPUT_FILE}")
    print(f"Cache saved to:  {CACHE_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
