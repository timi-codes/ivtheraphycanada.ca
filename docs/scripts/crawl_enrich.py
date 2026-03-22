"""
IV Therapy & Wellness Infusion Directory — Enrichment Crawler
Reads iv_theraphy_services_only.csv (369 businesses with confirmed services),
crawls each website to extract deeper features:
  - provider_type    (md, nd, rn, np)
  - clinic_type      (clinic, mobile_only, hybrid)
  - drip_packages    (energy, beauty, athletic, anti_aging, detox, weight_loss, fertility)
  - add_on_services  (hyperbaric, ozone, peptides, hormone, cryotherapy, red_light, weight_loss_program)
  - has_booking      (true / false)
Writes iv_theraphy_enriched.csv with these new columns appended.
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

INPUT_FILE  = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_services_only.csv"
OUTPUT_FILE = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_enriched.csv"
CACHE_FILE  = "/Users/timicodes/Project/iv_theraphy/.enrich_cache.json"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")

CONCURRENCY = 5
TIMEOUT     = 20
MIN_WORDS   = 150

# ─── ALL VALID VALUES ───────────────────────────────────────────────────────────

ALL_PROVIDER_TYPES  = ["md", "nd", "rn", "np"]
ALL_CLINIC_TYPES    = ["clinic", "mobile_only", "hybrid"]
ALL_DRIP_PACKAGES   = ["energy", "beauty", "athletic", "anti_aging", "detox", "weight_loss", "fertility", "hangover", "immune", "hydration_pkg"]
ALL_ADD_ONS         = ["hyperbaric", "ozone", "peptides", "hormone_therapy", "cryotherapy", "red_light", "weight_loss_program", "botox", "laser", "acupuncture"]

# ─── TIER 1: KEYWORD MAPS ──────────────────────────────────────────────────────

PROVIDER_SIGNALS = {
    "md": [
        r"\bmd\b", r"\bm\.d\b", r"\bdoctor of medicine\b", r"\bphysician\b",
        r"\bmedical doctor\b", r"\bdr\.\s+\w+\s+md\b",
    ],
    "nd": [
        r"\bnd\b", r"\bn\.d\b", r"\bnaturopath\b", r"\bnaturopathic doctor\b",
        r"\bnaturopathic physician\b", r"\bnaturopathic medicine\b",
    ],
    "rn": [
        r"\brn\b", r"\br\.n\b", r"\bregistered nurse\b", r"\bnurse-administered\b",
        r"\bnurse administered\b", r"\bnursing staff\b", r"\bour nurses\b",
    ],
    "np": [
        r"\bnp\b", r"\bn\.p\b", r"\bnurse practitioner\b",
        r"\badvanced practice nurse\b",
    ],
}

CLINIC_TYPE_SIGNALS = {
    "mobile_only": [
        r"\bmobile only\b", r"\bwe come to you\b", r"\bat.home iv\b",
        r"\bin.home iv\b", r"\bno clinic\b", r"\bmobile service only\b",
        r"\bwe travel to you\b", r"\biv at your\b",
    ],
    "hybrid": [
        r"\bmobile.*clinic\b", r"\bclinic.*mobile\b",
        r"\bat.home.*or.*clinic\b", r"\bclinic.*at.home\b",
        r"\bwe offer.*mobile\b", r"\bmobile.*available\b",
        r"\bin.clinic.*mobile\b",
    ],
    "clinic": [
        r"\biv lounge\b", r"\binfusion suite\b", r"\binfusion room\b",
        r"\bvisit our clinic\b", r"\bbook.*appointment\b", r"\bour clinic\b",
        r"\binfusion centre\b", r"\binfusion center\b", r"\biv clinic\b",
    ],
}

DRIP_PACKAGE_SIGNALS = {
    "energy":       [r"\benergy drip\b", r"\benergy boost\b", r"\benergy iv\b", r"\bfatigue\b", r"\bjet lag\b"],
    "beauty":       [r"\bbeauty drip\b", r"\bskin brightening\b", r"\bglow drip\b", r"\bbeauty iv\b", r"\bhair.*skin.*nails\b"],
    "athletic":     [r"\bathlete\b", r"\bathletic recovery\b", r"\bperformance drip\b", r"\bsports recovery\b", r"\bpost.workout\b", r"\brecovery drip\b"],
    "anti_aging":   [r"\banti.aging\b", r"\bantiaging\b", r"\blongevity\b", r"\bage.defying\b", r"\byouthful\b"],
    "detox":        [r"\bdetox drip\b", r"\bdetoxification iv\b", r"\bheavy metal\b", r"\bcleanse drip\b"],
    "weight_loss":  [r"\bweight loss iv\b", r"\bweight loss drip\b", r"\bslim drip\b", r"\blipotropic\b", r"\bmetabolism drip\b"],
    "fertility":    [r"\bfertility\b", r"\bpregnancy\b", r"\breproductive\b", r"\bpregnancy iv\b"],
    "hangover":     [r"\bhangover\b", r"\bparty recovery\b", r"\bafter party\b"],
    "immune":       [r"\bimmune boost\b", r"\bimmunity drip\b", r"\bimmune support\b", r"\bcold.*flu\b"],
    "hydration_pkg":[r"\bhydration package\b", r"\bhydration drip\b", r"\brehydration\b", r"\bhydration therapy\b"],
}

ADD_ON_SIGNALS = {
    "hyperbaric":          [r"\bhyperbaric\b", r"\bhbot\b", r"\boxygen therapy\b", r"\bhyperbaric oxygen\b"],
    "ozone":               [r"\bozone therapy\b", r"\bozone iv\b", r"\bozone treatment\b"],
    "peptides":            [r"\bpeptide\b", r"\bpeptide therapy\b", r"\bpeptides\b"],
    "hormone_therapy":     [r"\bhormone therapy\b", r"\bhrt\b", r"\bhormone replacement\b", r"\btestosterone\b", r"\bmenopause\b"],
    "cryotherapy":         [r"\bcryotherapy\b", r"\bcryo\b", r"\bcold therapy\b", r"\bcold plunge\b"],
    "red_light":           [r"\bred light\b", r"\bphotobiomodulation\b", r"\binfrared\b", r"\bled therapy\b"],
    "weight_loss_program": [r"\bweight loss program\b", r"\bsemaglutide\b", r"\bozempic\b", r"\btirzepatide\b", r"\bglp.1\b", r"\bweight management\b"],
    "botox":               [r"\bbotox\b", r"\bneuromodulator\b", r"\bdysport\b", r"\bxeomin\b", r"\bwrinkle\b"],
    "laser":               [r"\blaser\b", r"\bphotofacial\b", r"\bipl\b", r"\blaser skin\b"],
    "acupuncture":         [r"\bacupuncture\b", r"\btraditional chinese medicine\b", r"\btcm\b"],
}

BOOKING_SIGNALS = [
    r"\bbook.*appointment\b", r"\bbook.*online\b", r"\bbooking\b",
    r"\bschedule.*appointment\b", r"\brequest.*appointment\b",
    r"\bonline booking\b", r"\bbook now\b", r"\bbook a session\b",
    r"\bjane app\b", r"\bmindbody\b", r"\bbooker\b", r"\bfresha\b",
]

DEEP_CRAWL_PATHS = [
    "/services", "/treatments", "/iv-therapy", "/what-we-offer",
    "/our-services", "/about", "/team", "/providers", "/practitioners",
]

# ─── HELPERS ───────────────────────────────────────────────────────────────────

def keyword_extract(text: str) -> dict:
    """Tier 1: Extract all features via keyword matching."""
    t = text.lower()

    provider_types = []
    for tag, patterns in PROVIDER_SIGNALS.items():
        if any(re.search(p, t) for p in patterns):
            provider_types.append(tag)

    # Clinic type: check mobile_only first, then hybrid, then clinic
    clinic_type = ""
    if any(re.search(p, t) for p in CLINIC_TYPE_SIGNALS["mobile_only"]):
        clinic_type = "mobile_only"
    elif any(re.search(p, t) for p in CLINIC_TYPE_SIGNALS["hybrid"]):
        clinic_type = "hybrid"
    elif any(re.search(p, t) for p in CLINIC_TYPE_SIGNALS["clinic"]):
        clinic_type = "clinic"

    drip_packages = []
    for tag, patterns in DRIP_PACKAGE_SIGNALS.items():
        if any(re.search(p, t) for p in patterns):
            drip_packages.append(tag)

    add_ons = []
    for tag, patterns in ADD_ON_SIGNALS.items():
        if any(re.search(p, t) for p in patterns):
            add_ons.append(tag)

    has_booking = any(re.search(p, t) for p in BOOKING_SIGNALS)

    return {
        "provider_type":  ",".join(sorted(set(provider_types))),
        "clinic_type":    clinic_type,
        "drip_packages":  ",".join(sorted(set(drip_packages))),
        "add_on_services": ",".join(sorted(set(add_ons))),
        "has_booking":    "true" if has_booking else "false",
    }


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


# ─── LLM ENRICHMENT ────────────────────────────────────────────────────────────

genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-2.5-flash-lite")


def llm_enrich(text: str) -> dict:
    """Use Gemini to extract enrichment features from website text."""
    prompt = f"""You are analyzing a Canadian IV therapy / wellness clinic website.
Extract the following features and return ONLY a JSON object with these exact keys.

Keys and allowed values:
- provider_type: comma-separated from [md, nd, rn, np] — who administers treatments
- clinic_type: one of [clinic, mobile_only, hybrid] — clinic=physical location only, mobile_only=they come to you, hybrid=both
- drip_packages: comma-separated from [energy, beauty, athletic, anti_aging, detox, weight_loss, fertility, hangover, immune, hydration_pkg]
- add_on_services: comma-separated from [hyperbaric, ozone, peptides, hormone_therapy, cryotherapy, red_light, weight_loss_program, botox, laser, acupuncture]
- has_booking: true or false — do they have online booking?

Rules:
- Use empty string "" for any field you cannot determine
- Only include values you are confident about
- Do NOT invent or guess values not supported by the text

Website content (first 2500 chars):
{text[:2500]}

Return ONLY valid JSON, no explanation. Example:
{{"provider_type": "nd,rn", "clinic_type": "hybrid", "drip_packages": "energy,beauty,athletic", "add_on_services": "hyperbaric,red_light", "has_booking": "true"}}
"""
    try:
        response = gemini.generate_content(prompt)
        raw = response.text.strip().strip("```json").strip("```").strip()
        data = json.loads(raw)
        # Validate values
        result = {
            "provider_type":   ",".join(t for t in data.get("provider_type", "").split(",") if t.strip() in ALL_PROVIDER_TYPES),
            "clinic_type":     data.get("clinic_type", "") if data.get("clinic_type", "") in ALL_CLINIC_TYPES else "",
            "drip_packages":   ",".join(t for t in data.get("drip_packages", "").split(",") if t.strip() in ALL_DRIP_PACKAGES),
            "add_on_services": ",".join(t for t in data.get("add_on_services", "").split(",") if t.strip() in ALL_ADD_ONS),
            "has_booking":     "true" if str(data.get("has_booking", "false")).lower() == "true" else "false",
        }
        return result
    except Exception as e:
        print(f"    [LLM ERROR] {e}")
        return {"provider_type": "", "clinic_type": "", "drip_packages": "", "add_on_services": "", "has_booking": "false"}


def merge_results(keyword_result: dict, llm_result: dict) -> dict:
    """Merge keyword + LLM results, filling gaps."""
    merged = {}
    for key in ["provider_type", "drip_packages", "add_on_services"]:
        kw_vals = set(v for v in keyword_result.get(key, "").split(",") if v)
        llm_vals = set(v for v in llm_result.get(key, "").split(",") if v)
        merged[key] = ",".join(sorted(kw_vals | llm_vals))

    merged["clinic_type"] = keyword_result.get("clinic_type") or llm_result.get("clinic_type", "")
    merged["has_booking"] = "true" if "true" in [keyword_result.get("has_booking"), llm_result.get("has_booking")] else "false"
    return merged


# ─── CORE ENRICHER ─────────────────────────────────────────────────────────────

async def enrich_website(
    business: dict,
    crawler: AsyncWebCrawler,
    run_config: CrawlerRunConfig,
    cache: dict,
) -> dict:
    """Crawl + enrich one business website."""
    url = (business.get("website") or "").strip()
    name = business.get("name", "Unknown")
    empty = {"provider_type": "", "clinic_type": "", "drip_packages": "", "add_on_services": "", "has_booking": "false"}

    # Check has_booking from existing column first
    if (business.get("booking_appointment_link") or "").strip():
        empty["has_booking"] = "true"

    if not url:
        return empty

    if url in cache:
        return cache[url]

    # Crawl homepage
    try:
        result = await crawler.arun(url=url, config=run_config)
        text = (result.markdown or result.extracted_content or "") if result.success else ""
    except Exception as e:
        print(f"    [CRAWL ERROR] {name}: {e}")
        cache[url] = empty
        return empty

    # Deep crawl if thin
    if word_count(text) < MIN_WORDS:
        base = url.rstrip("/")
        for path in DEEP_CRAWL_PATHS:
            try:
                deep = await crawler.arun(url=base + path, config=run_config)
                if deep.success:
                    text += " " + (deep.markdown or deep.extracted_content or "")
            except Exception:
                pass

    if not text.strip():
        cache[url] = empty
        return empty

    # Tier 1: keyword extraction
    kw_result = keyword_extract(text)

    # Tier 2: LLM to fill gaps and validate
    # Always run LLM if we have enough text — it adds drip_packages + add_ons well
    if word_count(text) >= 100:
        llm_result = llm_enrich(text)
        final = merge_results(kw_result, llm_result)
    else:
        final = kw_result

    # Override has_booking if booking link already known
    if (business.get("booking_appointment_link") or "").strip():
        final["has_booking"] = "true"

    cache[url] = final
    return final


# ─── MAIN ──────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("IV Therapy Directory — Enrichment Crawler")
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
        excluded_tags=["script", "style"],
    )

    NEW_COLS = ["provider_type", "clinic_type", "drip_packages", "add_on_services", "has_booking"]
    semaphore = asyncio.Semaphore(CONCURRENCY)
    results = [None] * total

    # Stat trackers
    stat_counters = {
        "provider_type":   {},
        "clinic_type":     {},
        "drip_packages":   {},
        "add_on_services": {},
        "has_booking":     {"true": 0, "false": 0},
    }

    async def process(index: int, row: dict, crawler: AsyncWebCrawler):
        async with semaphore:
            name = row.get("name", "Unknown")
            enriched = await enrich_website(row, crawler, run_config, cache)
            results[index] = enriched

            summary_parts = []
            if enriched["provider_type"]:
                summary_parts.append(f"providers:{enriched['provider_type']}")
            if enriched["clinic_type"]:
                summary_parts.append(f"type:{enriched['clinic_type']}")
            if enriched["drip_packages"]:
                summary_parts.append(f"pkgs:{enriched['drip_packages']}")
            if enriched["add_on_services"]:
                summary_parts.append(f"addons:{enriched['add_on_services']}")
            if enriched["has_booking"] == "true":
                summary_parts.append("booking:yes")

            status = " | ".join(summary_parts) if summary_parts else "[none]"
            print(f"  [{index+1:>4}/{total}] {name[:40]:<40} {status}")

            if (index + 1) % 25 == 0:
                save_cache(cache)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        tasks = [process(i, row, crawler) for i, row in enumerate(rows)]
        await asyncio.gather(*tasks)

    save_cache(cache)

    # Attach results and compute stats
    output_headers = list(headers) + NEW_COLS
    booking_count = 0
    for i, row in enumerate(rows):
        r = results[i] or {"provider_type": "", "clinic_type": "", "drip_packages": "", "add_on_services": "", "has_booking": "false"}
        for col in NEW_COLS:
            row[col] = r.get(col, "")

        if r.get("has_booking") == "true":
            booking_count += 1

        for tag in r.get("provider_type", "").split(","):
            if tag:
                stat_counters["provider_type"][tag] = stat_counters["provider_type"].get(tag, 0) + 1
        if r.get("clinic_type"):
            stat_counters["clinic_type"][r["clinic_type"]] = stat_counters["clinic_type"].get(r["clinic_type"], 0) + 1
        for tag in r.get("drip_packages", "").split(","):
            if tag:
                stat_counters["drip_packages"][tag] = stat_counters["drip_packages"].get(tag, 0) + 1
        for tag in r.get("add_on_services", "").split(","):
            if tag:
                stat_counters["add_on_services"][tag] = stat_counters["add_on_services"].get(tag, 0) + 1

    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=output_headers)
        writer.writeheader()
        writer.writerows(rows)

    # ── Summary ──────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("ENRICHMENT COMPLETE")
    print("=" * 60)
    print(f"Total businesses:  {total}")
    print(f"With booking link: {booking_count} ({booking_count/total*100:.1f}%)")
    print()

    print("Provider types:")
    for tag, count in sorted(stat_counters["provider_type"].items(), key=lambda x: -x[1]):
        print(f"  {tag:<8} {count:>4}")

    print("\nClinic types:")
    for tag, count in sorted(stat_counters["clinic_type"].items(), key=lambda x: -x[1]):
        print(f"  {tag:<15} {count:>4}")

    print("\nDrip packages:")
    for tag, count in sorted(stat_counters["drip_packages"].items(), key=lambda x: -x[1]):
        bar = "█" * (count // 3)
        print(f"  {tag:<18} {count:>4}  {bar}")

    print("\nAdd-on services:")
    for tag, count in sorted(stat_counters["add_on_services"].items(), key=lambda x: -x[1]):
        bar = "█" * (count // 3)
        print(f"  {tag:<22} {count:>4}  {bar}")

    print()
    print(f"Output saved to: {OUTPUT_FILE}")
    print(f"Cache saved to:  {CACHE_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
