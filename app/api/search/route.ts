import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export type SearchResult = {
  type: 'city' | 'province' | 'service'
  label: string
  sublabel?: string
  href: string
}

const PROVINCES = [
  { name: 'Ontario',                   slug: 'ontario' },
  { name: 'British Columbia',          slug: 'british-columbia' },
  { name: 'Alberta',                   slug: 'alberta' },
  { name: 'Quebec',                    slug: 'quebec' },
  { name: 'Manitoba',                  slug: 'manitoba' },
  { name: 'Saskatchewan',              slug: 'saskatchewan' },
  { name: 'Nova Scotia',               slug: 'nova-scotia' },
  { name: 'New Brunswick',             slug: 'new-brunswick' },
  { name: 'Newfoundland & Labrador',   slug: 'newfoundland-and-labrador' },
  { name: 'Prince Edward Island',      slug: 'prince-edward-island' },
  { name: 'Northwest Territories',     slug: 'northwest-territories' },
  { name: 'Yukon',                     slug: 'yukon' },
  { name: 'Nunavut',                   slug: 'nunavut' },
]

const SERVICES = [
  { name: 'IV Therapy',          slug: 'iv-therapy' },
  { name: 'Vitamin IV',          slug: 'vitamin-iv' },
  { name: 'Mobile IV',           slug: 'mobile-iv' },
  { name: 'NAD+ Therapy',        slug: 'nad-plus' },
  { name: 'Chelation Therapy',   slug: 'chelation-therapy' },
  { name: 'Concierge Medicine',  slug: 'concierge-medicine' },
  { name: "Myers' Cocktail",     slug: 'myers-cocktail' },
  { name: 'Glutathione IV',      slug: 'glutathione' },
  { name: 'Hangover IV',         slug: 'hangover-iv' },
  { name: 'Immune IV',           slug: 'immune-iv' },
  { name: 'Hydration IV',        slug: 'hydration' },
]

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const lower = q.toLowerCase()
  const results: SearchResult[] = []

  // Cities from DB
  try {
    const cities = await prisma.city.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { name: true, slug: true, province: true, provinceSlug: true },
      orderBy: { population: 'desc' },
      take: 5,
    })
    for (const c of cities) {
      results.push({
        type: 'city',
        label: c.name,
        sublabel: c.province,
        href: `/${c.provinceSlug}/${c.slug}`,
      })
    }
  } catch {
    // DB unavailable — skip city results
  }

  // Provinces
  for (const p of PROVINCES) {
    if (p.name.toLowerCase().includes(lower)) {
      results.push({ type: 'province', label: p.name, sublabel: 'Province', href: `/${p.slug}` })
    }
  }

  // Services
  for (const s of SERVICES) {
    if (s.name.toLowerCase().includes(lower)) {
      results.push({ type: 'service', label: s.name, sublabel: 'Service', href: `/vendors?service=${s.slug}` })
    }
  }

  return NextResponse.json(results.slice(0, 10))
}
