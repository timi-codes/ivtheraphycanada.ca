import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageTracker } from '@/components/analytics/PageTracker'

interface Props {
  params: Promise<{ province: string }>
}

function toTitleCase(slug: string) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province } = await params
  const name = toTitleCase(province)
  const canonical = `${SITE_URL}/${province}`
  const title = `IV Therapy in ${name} | Find Clinics & Providers`
  const description = `Find top-rated IV therapy clinics, mobile IV services, NAD+ therapy, and chelation providers across ${name}, Canada. Compare reviews and get free quotes.`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description, siteName: 'IV Therapy Canada', locale: 'en_CA' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ProvincePage({ params }: Props) {
  const { province } = await params
  const provinceName = toTitleCase(province)

  const cities = await prisma.city.findMany({
    where: { provinceSlug: province },
    orderBy: { population: 'desc' },
  })

  if (cities.length === 0) {
    // Still show page if vendors exist in this province
    const vendorCount = await prisma.vendor.count({
      where: { province: { equals: provinceName, mode: 'insensitive' } },
    })
    if (vendorCount === 0) notFound()
  }

  const vendorCount = await prisma.vendor.count({
    where: { province: { equals: provinceName, mode: 'insensitive' } },
  })

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <PageTracker province={provinceName} sourceType="province-browse" />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
        {' / '}
        <span className="text-gray-900">{provinceName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        IV Therapy in {provinceName}
      </h1>
      <p className="text-gray-500 mb-8">
        {vendorCount} providers across {cities.length > 0 ? cities.length : 'multiple'} cities in {provinceName}
      </p>

      {cities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/${province}/${city.slug}`}
              className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-gray-700 hover:border-[#1E1E2C] hover:text-[#1E1E2C] hover:shadow-sm transition-all"
            >
              <p className="font-semibold">{city.name}</p>
              {city.population && (
                <p className="text-xs text-gray-400 mt-0.5">{(city.population / 1000).toFixed(0)}k pop.</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
