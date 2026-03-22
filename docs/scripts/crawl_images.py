"""
IV Therapy Directory — Image URL Extractor + Claude Vision Ranker

For each business in iv_theraphy_final.csv:
  1. Crawl website → extract image URLs
  2. Filter out icons, logos, tiny images
  3. Send up to 12 candidate URLs to Claude Vision in ONE call
  4. Claude picks top 3 best clinic images
  5. Store the original URLs (no download, no hosting needed)

Output: iv_theraphy_with_images.csv with image_1_url, image_2_url, image_3_url columns
"""

import asyncio
import csv
import json
import os
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse

import anthropic
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# ─── CONFIG ────────────────────────────────────────────────────────────────────

INPUT_FILE  = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_final.csv"
OUTPUT_FILE = "/Users/timicodes/Project/iv_theraphy/iv_theraphy_with_images.csv"
CACHE_FILE  = "/Users/timicodes/Project/iv_theraphy/.image_url_cache.json"

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

CONCURRENCY    = 4
TIMEOUT        = 20
MAX_CANDIDATES = 12   # max image URLs to send to Claude Vision per site

# ─── SKIP PATTERNS ─────────────────────────────────────────────────────────────

SKIP_PATTERNS = [
    r"logo", r"\bicon\b", r"favicon", r"sprite", r"placeholder",
    r"blank", r"pixel", r"tracking", r"badge", r"avatar",
    r"captcha", r"data:image", r"\.svg(\?|$)", r"\.gif(\?|$)",
    r"\.ico(\?|$)", r"\.bmp(\?|$)", r"\.webp.*[?&]w=\d{1,2}[^0-9]",
    r"/wp-includes/", r"gravatar\.com", r"s\.w\.org",
]

# ─── HELPERS ───────────────────────────────────────────────────────────────────

def should_skip(url: str) -> bool:
    if not url or url.startswith("data:"):
        return True
    u = url.lower()
    return any(re.search(p, u) for p in SKIP_PATTERNS)


def to_absolute(url: str, base: str) -> str:
    if url.startswith("//"):
        return f"{urlparse(base).scheme}:{url}"
    if url.startswith("http"):
        return url
    return urljoin(base, url)


def load_cache() -> dict:
    if Path(CACHE_FILE).exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache: dict):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


# ─── CLAUDE VISION ─────────────────────────────────────────────────────────────

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def rank_images(image_urls: list[str], name: str, city: str) -> list[str]:
    """Send image URLs to Claude Vision, get back top 3 URLs ranked best-first."""
    if not image_urls:
        return []
    if len(image_urls) == 1:
        return image_urls

    content = []
    for i, url in enumerate(image_urls):
        content.append({"type": "text", "text": f"**Image {i + 1}:**"})
        content.append({
            "type": "image",
            "source": {"type": "url", "url": url}
        })

    content.append({
        "type": "text",
        "text": f"""You are curating photos for "{name}" in {city}, Canada — a wellness/IV therapy clinic directory.

Review all {len(image_urls)} images and select the TOP 3 best for a directory profile listing.

**Good images:** clinic interior, treatment/IV drip rooms, reception area, professional staff, branded exterior, services being performed.
**Bad images:** generic stock photos, logos only, blurry/dark shots, irrelevant images, social media icons, screenshots.

Return ONLY valid JSON with 1-based image numbers ranked best-to-worst:
{{"top3": [2, 5, 1], "reason": "brief reason"}}

If fewer than 3 are good, return only the good ones.
If none are suitable: {{"top3": [], "reason": "no suitable images"}}

Return ONLY the JSON, nothing else."""
    })

    try:
        response = claude.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            messages=[{"role": "user", "content": content}]
        )
        raw = re.sub(r"```json\s*|\s*```", "", response.content[0].text).strip()
        data = json.loads(raw)
        indices = [int(n) - 1 for n in data.get("top3", []) if 1 <= int(n) <= len(image_urls)]
        return [image_urls[i] for i in indices[:3]]
    except Exception as e:
        print(f"    [VISION ERROR] {e}")
        return image_urls[:3]  # fallback: first 3


# ─── CORE ──────────────────────────────────────────────────────────────────────

async def process(
    index: int,
    row: dict,
    total: int,
    crawler: AsyncWebCrawler,
    run_config: CrawlerRunConfig,
    cache: dict,
    sem: asyncio.Semaphore,
) -> dict:
    async with sem:
        name   = row.get("name", "Unknown")
        url    = (row.get("website") or "").strip()
        city   = row.get("city", "")
        prefix = f"  [{index+1:>4}/{total}] {name[:42]:<42}"
        empty  = {"image_1_url": "", "image_2_url": "", "image_3_url": ""}

        if url in cache:
            r = cache[url]
            print(f"{prefix} [cached] {r.get('image_1_url','')[:50]}")
            return r

        if not url:
            print(f"{prefix} [no website]")
            return empty

        # Crawl
        try:
            result = await crawler.arun(url=url, config=run_config)
        except Exception as e:
            print(f"{prefix} [CRAWL ERROR] {e}")
            cache[url] = empty
            return empty

        if not result.success:
            print(f"{prefix} [crawl failed]")
            cache[url] = empty
            return empty

        # Extract image URLs
        raw_imgs = result.media.get("images", []) if result.media else []
        md_imgs  = re.findall(r"!\[.*?\]\((https?://[^\s)]+)\)", result.markdown or "")

        seen, candidates = set(), []
        for img in sorted(raw_imgs, key=lambda x: float(x.get("score", 0)), reverse=True):
            src = to_absolute((img.get("src") or "").strip(), url)
            if src and src not in seen and not should_skip(src):
                seen.add(src)
                candidates.append(src)

        for src in md_imgs:
            src = to_absolute(src, url)
            if src not in seen and not should_skip(src):
                seen.add(src)
                candidates.append(src)

        candidates = candidates[:MAX_CANDIDATES]

        if not candidates:
            print(f"{prefix} [no images found]")
            cache[url] = empty
            return empty

        print(f"{prefix} {len(candidates)} candidates → Claude Vision...")

        # Rank with Claude Vision
        top_urls = rank_images(candidates, name, city)

        if not top_urls:
            print(f"{prefix} [no suitable images]")
            cache[url] = empty
            return empty

        # Pad to 3
        while len(top_urls) < 3:
            top_urls.append("")

        result_data = {
            "image_1_url": top_urls[0],
            "image_2_url": top_urls[1],
            "image_3_url": top_urls[2],
        }

        cache[url] = result_data
        print(f"{prefix} ✓ {len([u for u in top_urls if u])} images selected")
        return result_data


# ─── MAIN ──────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("IV Therapy — Image URL Extractor + Claude Vision Ranker")
    print("=" * 60)

    if not ANTHROPIC_API_KEY:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable")
        return

    with open(INPUT_FILE, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = list(reader.fieldnames or [])
        rows = list(reader)

    total = len(rows)
    print(f"Loaded {total} businesses")

    cache = load_cache()
    done  = sum(1 for r in rows if (r.get("website") or "").strip() in cache)
    print(f"Cache: {len(cache)} entries ({done} already done)\n")

    browser_config = BrowserConfig(
        headless=True, verbose=False,
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

    sem     = asyncio.Semaphore(CONCURRENCY)
    results = [None] * total

    async with AsyncWebCrawler(config=browser_config) as crawler:
        tasks = [process(i, row, total, crawler, run_config, cache, sem) for i, row in enumerate(rows)]
        batch = await asyncio.gather(*tasks)

    for i, r in enumerate(batch):
        results[i] = r or {"image_1_url": "", "image_2_url": "", "image_3_url": ""}

    save_cache(cache)

    # Write CSV
    new_cols = ["image_1_url", "image_2_url", "image_3_url"]
    out_headers = headers + [c for c in new_cols if c not in headers]
    with_images = 0

    for i, row in enumerate(rows):
        r = results[i]
        row["image_1_url"] = r.get("image_1_url", "")
        row["image_2_url"] = r.get("image_2_url", "")
        row["image_3_url"] = r.get("image_3_url", "")
        if row["image_1_url"]:
            with_images += 1

    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=out_headers)
        writer.writeheader()
        writer.writerows(rows)

    print()
    print("=" * 60)
    print("COMPLETE")
    print("=" * 60)
    print(f"Total:           {total}")
    print(f"With image URLs: {with_images} ({with_images/total*100:.1f}%)")
    print(f"No images:       {total - with_images}")
    print(f"\nOutput: {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
