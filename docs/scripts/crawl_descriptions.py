"""
IV Therapy & Wellness Infusion Directory — Description Generator
Reads iv_theraphy_enriched.csv (369 businesses),
crawls each website and uses Gemini to write a clean 2-3 sentence
directory description for each business.
Updates the `description` column in place.
Writes iv_theraphy_final.csv.
"""

import asyncio
import csv
import json
import os
import re
from pathlib import Path

import google.generativeai as genai
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# ─── CONFIG ────────────────────────────────────────────────────────────────────

INPUT_FILE  = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_enriched.csv"
OUTPUT_FILE = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_final.csv"
CACHE_FILE  = "/Users/timicodes/Project/iv_theraphy/.desc_cache.json"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")

CONCURRENCY = 5
TIMEOUT     = 20
MIN_WORDS   = 100

DEEP_CRAWL_PATHS = [
    "/about", "/about-us", "/our-story", "/who-we-are",
    "/services", "/treatments", "/iv-therapy", "/what-we-offer",
]

# ─── HELPERS ───────────────────────────────────────────────────────────────────

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


def clean_description(text: str) -> str:
    """Strip quotes, newlines, and extra whitespace from LLM output."""
    text = text.strip().strip('"').strip("'")
    text = re.sub(r"\s+", " ", text)
    return text


# ─── LLM ───────────────────────────────────────────────────────────────────────

genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-2.5-flash-lite")


def llm_describe(
    website_text: str,
    name: str,
    city: str,
    province: str,
    services: str,
    provider_type: str,
    clinic_type: str,
    drip_packages: str,
    add_on_services: str,
) -> str:
    """Generate a clean directory description using Gemini."""

    # Build context from structured data we already have
    context_parts = []
    if services:
        context_parts.append(f"Services: {services.replace(',', ', ')}")
    if provider_type:
        context_parts.append(f"Providers: {provider_type.replace(',', ', ').upper()}")
    if clinic_type:
        context_parts.append(f"Clinic type: {clinic_type.replace('_', ' ')}")
    if drip_packages:
        context_parts.append(f"Drip packages: {drip_packages.replace(',', ', ')}")
    if add_on_services:
        context_parts.append(f"Additional treatments: {add_on_services.replace(',', ', ')}")
    context = "\n".join(context_parts)

    prompt = f"""You are writing a directory listing description for a Canadian wellness clinic.

Business name: {name}
Location: {city}, {province}
{context}

Website content (use this as the primary source):
{website_text[:3000]}

Write a 2-3 sentence description for this business suitable for a wellness directory listing.

Rules:
- Be specific to THIS business — mention their actual services and specialties
- Mention the city/location naturally
- Do NOT use the business name in the description (it appears separately)
- Do NOT use marketing fluff like "state-of-the-art" or "world-class"
- Do NOT use first person ("we", "our")
- Write in third person (e.g. "The clinic offers...", "This Toronto wellness centre...")
- Keep it factual, professional, and under 60 words
- If the website content is insufficient, use the structured data above to write the description

Return ONLY the description text, nothing else.
"""
    try:
        response = gemini.generate_content(prompt)
        return clean_description(response.text)
    except Exception as e:
        print(f"    [LLM ERROR] {e}")
        return ""


def fallback_description(
    name: str,
    city: str,
    province: str,
    services: str,
    provider_type: str,
    clinic_type: str,
) -> str:
    """Build a basic template description from structured data when crawl fails."""
    parts = []

    # Clinic type opener
    if clinic_type == "mobile_only":
        parts.append(f"Mobile IV therapy service based in {city}, {province}")
    elif clinic_type == "hybrid":
        parts.append(f"Wellness clinic in {city}, {province} offering both in-clinic and mobile IV therapy")
    else:
        parts.append(f"Wellness clinic located in {city}, {province}")

    # Services
    service_list = [s.replace("_", " ") for s in services.split(",") if s] if services else []
    if service_list:
        parts.append(f"specializing in {', '.join(service_list[:4])}")

    # Provider
    if provider_type:
        providers = [p.upper() for p in provider_type.split(",") if p]
        parts.append(f"administered by {' and '.join(providers)} practitioners")

    return ". ".join(parts) + "." if parts else ""


# ─── CORE CRAWLER ──────────────────────────────────────────────────────────────

async def get_description(
    business: dict,
    crawler: AsyncWebCrawler,
    run_config: CrawlerRunConfig,
    cache: dict,
) -> str:
    """Crawl website and generate a directory description."""
    url       = (business.get("website") or "").strip()
    name      = business.get("name", "Unknown")
    city      = business.get("city", "")
    province  = business.get("state", "")
    services  = business.get("services", "")
    provider  = business.get("provider_type", "")
    clinic    = business.get("clinic_type", "")
    packages  = business.get("drip_packages", "")
    add_ons   = business.get("add_on_services", "")

    # Return cached result if available
    if url and url in cache:
        return cache[url]

    # No website — use fallback
    if not url:
        desc = fallback_description(name, city, province, services, provider, clinic)
        return desc

    # Crawl homepage
    try:
        result = await crawler.arun(url=url, config=run_config)
        text = (result.markdown or result.extracted_content or "") if result.success else ""
    except Exception as e:
        print(f"    [CRAWL ERROR] {name}: {e}")
        desc = fallback_description(name, city, province, services, provider, clinic)
        cache[url] = desc
        return desc

    # Deep crawl /about + /services if homepage is thin
    if word_count(text) < MIN_WORDS:
        base = url.rstrip("/")
        for path in DEEP_CRAWL_PATHS:
            try:
                deep = await crawler.arun(url=base + path, config=run_config)
                if deep.success:
                    text += " " + (deep.markdown or deep.extracted_content or "")
                if word_count(text) >= MIN_WORDS:
                    break
            except Exception:
                pass

    # Still no content — use fallback
    if word_count(text) < 30:
        desc = fallback_description(name, city, province, services, provider, clinic)
        cache[url] = desc
        return desc

    # Generate description with Gemini
    desc = llm_describe(text, name, city, province, services, provider, clinic, packages, add_ons)

    # Fall back to template if LLM returned nothing
    if not desc:
        desc = fallback_description(name, city, province, services, provider, clinic)

    cache[url] = desc
    return desc


# ─── MAIN ──────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("IV Therapy Directory — Description Generator")
    print("=" * 60)

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    total = len(rows)
    print(f"Loaded {total} businesses from {INPUT_FILE}")

    cache = load_cache()
    cached_count = sum(1 for r in rows if (r.get("website") or "").strip() in cache)
    print(f"Cache: {len(cache)} entries ({cached_count} of {total} already done)")
    print()

    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
    )

    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        page_timeout=TIMEOUT * 1000,
        wait_until="networkidle",
        scan_full_page=True,
        verbose=False,
        word_count_threshold=5,
        excluded_tags=["script", "style", "nav", "footer", "header"],
    )

    semaphore = asyncio.Semaphore(CONCURRENCY)
    results = [""] * total
    generated_count = 0

    async def process(index: int, row: dict, crawler: AsyncWebCrawler):
        async with semaphore:
            name = row.get("name", "Unknown")
            desc = await get_description(row, crawler, run_config, cache)
            results[index] = desc

            preview = desc[:80] + "..." if len(desc) > 80 else desc
            print(f"  [{index+1:>4}/{total}] {name[:35]:<35} → {preview}")

            if (index + 1) % 25 == 0:
                save_cache(cache)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        tasks = [process(i, row, crawler) for i, row in enumerate(rows)]
        await asyncio.gather(*tasks)

    save_cache(cache)

    # Write output — update description column in place
    for i, row in enumerate(rows):
        if results[i]:
            row["description"] = results[i]
            generated_count += 1

    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

    # ── Summary ──────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("DESCRIPTION GENERATION COMPLETE")
    print("=" * 60)
    print(f"Total businesses:      {total}")
    print(f"Descriptions written:  {generated_count} ({generated_count/total*100:.1f}%)")
    print(f"Failed / empty:        {total - generated_count}")
    print()
    print(f"Output saved to: {OUTPUT_FILE}")
    print(f"Cache saved to:  {CACHE_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
