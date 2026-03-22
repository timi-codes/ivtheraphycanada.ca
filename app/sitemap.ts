import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

const SERVICES = [
  'iv-therapy', 'vitamin-iv', 'mobile-iv', 'nad-plus',
  'chelation-therapy', 'concierge-medicine', 'myers-cocktail',
  'glutathione', 'hangover-iv', 'immune-iv', 'hydration',
]

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let cities: { slug: string; provinceSlug: string }[] = []
  let vendors: { slug: string }[] = []

  try {
    ;[cities, vendors] = await Promise.all([
      prisma.city.findMany({ select: { slug: true, provinceSlug: true } }),
      prisma.vendor.findMany({ select: { slug: true }, orderBy: { updatedAt: 'desc' } }),
    ])
  } catch {
    // DB unavailable at build time — sitemap will be populated at runtime
  }

  const cityUrls: MetadataRoute.Sitemap = cities.flatMap((city) => [
    {
      url: `${BASE_URL}/${city.provinceSlug}/${city.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...SERVICES.map((service) => ({
      url: `${BASE_URL}/${city.provinceSlug}/${city.slug}/${service}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ])

  const vendorUrls: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${BASE_URL}/vendors/${v.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const provinceUrls: MetadataRoute.Sitemap = [
    ...new Set(cities.map((c) => c.provinceSlug)),
  ].map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const blogUrls: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: new Date(post.publishedAt),
  }))

  return [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/vendors`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/get-a-quote`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/for-vendors`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/list-your-clinic`, changeFrequency: 'monthly', priority: 0.6 },
    ...provinceUrls,
    ...cityUrls,
    ...vendorUrls,
    ...blogUrls,
  ]
}
