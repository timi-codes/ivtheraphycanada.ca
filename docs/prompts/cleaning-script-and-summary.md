# IV Therapy Directory — Data Cleaning Script & Summary

> **Input file:** `iv_theraphy - Sheet1.csv`
> **Output file:** `result.csv`
> **Date run:** March 21, 2026

---

## Cleaning Summary

| Metric | Count |
|--------|-------|
| Total input rows | 2,336 |
| **Rows kept** | **798** |
| Total removed | 1,538 |

### Removal Breakdown

| Reason | Count |
|--------|-------|
| No street address | 2 |
| No working hours | 238 |
| Not in Canada | 0 |
| Permanently / temporarily closed | 0 |
| 10 reviews or fewer | 509 |
| Not a wellness business | 33 |
| Duplicate listings | 756 |
| **Total removed** | **1,538** |

### Key Observations
- **Duplicates (756)** — Expected. Overlapping Outscraper queries across provinces + cities returned same businesses multiple times. Deduplicated by `place_id`.
- **Low reviews (509)** — Businesses with ≤10 reviews removed. Not enough social proof for directory listing.
- **No working hours (238)** — Google Maps listings without hours populated. Removed as incomplete.
- **Not a wellness business (33)** — Obvious non-matches removed by business name pattern matching.
- **All 798 remaining listings** are: active, Canadian, street-addressed, have working hours, and 11+ reviews.

---

## Python Cleaning Script

```python
import csv
import re

input_file = "/Users/timicodes/Project/iv_theraphy/iv_theraphy - Sheet1.csv"
output_file = "/Users/timicodes/Project/iv_theraphy/result.csv"

# Keywords that indicate NOT a wellness infusion business (99% confidence)
exclude_keywords = [
    # Big box retail
    r'\bwalmart\b', r'\bcostco\b', r'\bhome depot\b', r'\blowe\'?s\b',
    r'\bshoppers drug mart\b', r'\brexall\b', r'\blondon drugs\b',
    r'\bsuperstore\b', r'\bno frills\b', r'\bfreshco\b', r'\bmetro\b',
    # Dental
    r'\bdental\b', r'\bdentist\b', r'\bdentistry\b', r'\bordontist\b',
    # Veterinary
    r'\bveterinar\b', r'\banimal hospital\b', r'\bpet clinic\b', r'\bvet clinic\b',
    r'\banimal clinic\b', r'\bdog\b', r'\bcat hospital\b',
    # Gyms / fitness only
    r'\bgoodlife\b', r'\bplanet fitness\b', r'\banytime fitness\b',
    r'\bcrossfit\b', r'\byoga studio\b', r'\bpilates studio\b',
    # Restaurants / food
    r'\brestaurant\b', r'\bcafe\b', r'\bcafé\b', r'\bdiner\b',
    r'\bpizza\b', r'\bsushi\b', r'\bburger\b', r'\bbbq\b',
    r'\bsteakhouse\b', r'\bkitchen\b', r'\bbrewery\b', r'\bwinery\b',
    r'\bbakery\b', r'\bpastry\b', r'\bsandwich\b', r'\bpho\b',
    # Hotels / accommodation
    r'\bhotel\b', r'\bmotel\b', r'\bhostel\b', r'\bairbnb\b',
    r'\bbed and breakfast\b', r'\blodge\b', r'\binn\b', r'\bresort\b',
    # Gas / auto
    r'\bgas station\b', r'\bpetro.canada\b', r'\besso\b', r'\bshell\b',
    r'\bauto body\b', r'\bauto repair\b', r'\btire\b', r'\bmechanic\b',
    r'\bcar wash\b', r'\bcar rental\b',
    # Legal / finance / real estate
    r'\blaw firm\b', r'\blawyer\b', r'\baccounting\b', r'\baccountant\b',
    r'\breal estate\b', r'\brealty\b', r'\bmortgage\b', r'\binsurance\b',
    # Schools / education
    r'\bschool\b', r'\buniversity\b', r'\bcollege\b', r'\bdaycare\b',
    r'\bnursery\b', r'\bpreschool\b', r'\bacademy\b',
    # Trades / construction
    r'\bplumbing\b', r'\bplumber\b', r'\belectrical\b', r'\bhvac\b',
    r'\broofing\b', r'\bconstruction\b', r'\blandscaping\b',
    # Other irrelevant
    r'\bpharmacy\b', r'\bgrocery\b', r'\bsupermarket\b',
    r'\bfuneral\b', r'\bcemetery\b', r'\bchurch\b', r'\btemple\b',
    r'\bmuseum\b', r'\bgallery\b', r'\blibrary\b',
    r'\boptometr\b', r'\boptical\b', r'\beyecare\b',
]

# Keywords that KEEP a business (overrides exclusions)
keep_keywords = [
    'iv therapy', 'iv drip', 'iv infusion', 'intravenous',
    'vitamin drip', 'vitamin iv', 'vitamin infusion',
    'nad+', 'nad plus', 'nad therapy', 'nad infusion',
    'chelation', 'edta', 'heavy metal detox',
    'mobile iv', 'hydration therapy', 'hydration drip',
    'myers cocktail', 'glutathione', 'infusion clinic', 'infusion centre',
    'concierge medicine', 'concierge doctor', 'concierge health',
    'executive health', 'executive medicine', 'direct primary care',
    'private doctor', 'private clinic', 'private health',
    'wellness clinic', 'wellness centre', 'wellness lounge',
    'naturopath', 'integrative medicine', 'functional medicine',
    'anti-aging', 'anti aging', 'longevity clinic',
    'med spa', 'medical spa', 'medi-spa', 'medspa',
    'regenerative medicine', 'holistic clinic', 'health optimization',
    'infusion therapy', 'wellness infusion',
]

# Output columns to keep
output_cols = [
    'name', 'category', 'subtypes', 'phone', 'website',
    'address', 'street', 'city', 'state', 'postal_code',
    'country', 'country_code', 'rating', 'reviews',
    'business_status', 'working_hours', 'description', 'about',
    'latitude', 'longitude', 'place_id', 'google_id', 'domain',
    'email', 'company_instagram', 'company_facebook',
    'booking_appointment_link', 'verified', 'photos_count',
    'reviews_per_score_5', 'reviews_per_score_4',
]

def should_exclude(name, category, subtypes):
    combined = f"{name} {category} {subtypes}".lower()

    # Check keep keywords first
    for kw in keep_keywords:
        if kw in combined:
            return False

    # Check exclude patterns on name only
    name_lower = name.lower()
    for pattern in exclude_keywords:
        if re.search(pattern, name_lower):
            return True

    return False

removed = {
    'no_name': 0,
    'no_street': 0,
    'no_city': 0,
    'no_state': 0,
    'no_hours': 0,
    'not_canada': 0,
    'closed': 0,
    'low_reviews': 0,
    'not_relevant': 0,
    'duplicate': 0,
}

seen_place_ids = set()
kept = []

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    total = 0

    for row in reader:
        total += 1
        name            = (row.get('name') or '').strip()
        street          = (row.get('street') or '').strip()
        city            = (row.get('city') or '').strip()
        state           = (row.get('state') or '').strip()
        country_code    = (row.get('country_code') or '').strip().upper()
        business_status = (row.get('business_status') or '').strip().upper()
        working_hours   = (row.get('working_hours') or '').strip()
        reviews_raw     = (row.get('reviews') or '').strip()
        place_id        = (row.get('place_id') or '').strip()
        category        = (row.get('category') or '').strip()
        subtypes        = (row.get('subtypes') or '').strip()

        # 1. Missing required fields
        if not name:
            removed['no_name'] += 1; continue
        if not street:
            removed['no_street'] += 1; continue
        if not city:
            removed['no_city'] += 1; continue
        if not state:
            removed['no_state'] += 1; continue
        if not working_hours:
            removed['no_hours'] += 1; continue

        # 2. Canada only
        if country_code != 'CA':
            removed['not_canada'] += 1; continue

        # 3. Business status
        if business_status in ('PERMANENTLY_CLOSED', 'TEMPORARILY_CLOSED', 'CLOSED_TEMPORARILY'):
            removed['closed'] += 1; continue

        # 4. Quality threshold — 10 reviews or fewer
        try:
            reviews = int(float(reviews_raw)) if reviews_raw else 0
        except:
            reviews = 0
        if reviews <= 10:
            removed['low_reviews'] += 1; continue

        # 5. Not a wellness infusion business
        if should_exclude(name, category, subtypes):
            removed['not_relevant'] += 1; continue

        # 6. Deduplicate by place_id
        if place_id and place_id in seen_place_ids:
            removed['duplicate'] += 1; continue
        if place_id:
            seen_place_ids.add(place_id)

        kept.append(row)

# Write output with trimmed columns
available_cols = [c for c in output_cols if c in (headers or [])]

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=available_cols, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(kept)

print(f"Total input rows:  {total}")
print(f"Rows kept:         {len(kept)}")
print(f"Total removed:     {total - len(kept)}")
print()
print("Removal breakdown:")
for reason, count in removed.items():
    print(f"  {reason:<15} {count}")
```

---

## Output Column Reference

The `result.csv` contains these 31 columns:

| Column | Description |
|--------|-------------|
| `name` | Business name |
| `category` | Primary Google Maps category |
| `subtypes` | All category tags |
| `phone` | Phone number |
| `website` | Website URL |
| `address` | Full address string |
| `street` | Street address only |
| `city` | City |
| `state` | Province |
| `postal_code` | Postal code |
| `country` | Country name |
| `country_code` | CA |
| `rating` | Google rating (out of 5) |
| `reviews` | Total review count |
| `business_status` | OPERATIONAL / CLOSED |
| `working_hours` | Hours of operation |
| `description` | Business description |
| `about` | About section |
| `latitude` | GPS latitude |
| `longitude` | GPS longitude |
| `place_id` | Google Maps place ID (unique key) |
| `google_id` | Google business ID |
| `domain` | Website domain |
| `email` | Contact email |
| `company_instagram` | Instagram handle/URL |
| `company_facebook` | Facebook page URL |
| `booking_appointment_link` | Online booking link |
| `verified` | Google verified status |
| `photos_count` | Number of photos on listing |
| `reviews_per_score_5` | Count of 5-star reviews |
| `reviews_per_score_4` | Count of 4-star reviews |

---

*Script run: March 21, 2026*
