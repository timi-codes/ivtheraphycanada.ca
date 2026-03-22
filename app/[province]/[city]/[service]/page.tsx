import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { VendorCard } from '@/components/vendor/VendorCard'
import { LeadFormInline } from '@/components/forms/LeadFormInline'

interface Props {
  params: Promise<{ province: string; city: string; service: string }>
}

const SERVICE_MAP: Record<string, { label: string; key: string; description: string }> = {
  'iv-therapy': { label: 'IV Therapy', key: 'iv_therapy', description: 'intravenous drip therapy and hydration infusions' },
  'vitamin-iv': { label: 'Vitamin IV', key: 'vitamin_iv', description: 'vitamin C, B12, and multivitamin IV infusions' },
  'mobile-iv': { label: 'Mobile IV', key: 'mobile_iv', description: 'at-home and mobile IV therapy services' },
  'nad-plus': { label: 'NAD+ Therapy', key: 'nad_plus', description: 'NAD+ IV therapy for energy, longevity, and cognitive support' },
  'chelation-therapy': { label: 'Chelation Therapy', key: 'chelation', description: 'chelation and heavy metal detox IV therapy' },
  'concierge-medicine': { label: 'Concierge Medicine', key: 'concierge', description: 'concierge medicine and private doctor services' },
  'myers-cocktail': { label: "Myers' Cocktail", key: 'myers_cocktail', description: "Myers' cocktail IV drip therapy" },
  'glutathione': { label: 'Glutathione IV', key: 'glutathione', description: 'glutathione IV drip and antioxidant therapy' },
  'hangover-iv': { label: 'Hangover IV', key: 'hangover_iv', description: 'hangover recovery IV therapy' },
  'immune-iv': { label: 'Immune IV', key: 'immune_iv', description: 'immune boost IV infusion therapy' },
  'hydration': { label: 'Hydration IV', key: 'hydration', description: 'IV hydration and fluid replacement therapy' },
}

function planOrder(plan: string) {
  return { exclusive: 0, premium: 1, standard: 2, free: 3 }[plan] ?? 3
}

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province, city: citySlug, service: serviceSlug } = await params
  const cityData = await prisma.city.findUnique({ where: { slug: citySlug } })
  const svc = SERVICE_MAP[serviceSlug]
  if (!cityData || !svc) return { robots: 'noindex' }
  const canonical = `${SITE_URL}/${province}/${citySlug}/${serviceSlug}`
  const title = `${svc.label} in ${cityData.name}, ${cityData.province} | Find Providers`
  const description = `Find top-rated ${svc.description} in ${cityData.name}, ${cityData.province}. Compare providers, read reviews, and get a free quote.`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description, siteName: 'IV Therapy Canada', locale: 'en_CA' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ServiceCityPage({ params }: Props) {
  const { province, city: citySlug, service: serviceSlug } = await params
  const svc = SERVICE_MAP[serviceSlug]
  if (!svc) notFound()

  const cityData = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!cityData) notFound()

  const vendors = await prisma.vendor.findMany({
    where: {
      city: { equals: cityData.name, mode: 'insensitive' },
      province: { equals: cityData.province, mode: 'insensitive' },
      services: { has: svc.key },
    },
    select: {
      id: true, name: true, slug: true, city: true, province: true,
      phone: true, website: true, rating: true, reviewCount: true,
      services: true, clinicType: true, plan: true, isVerified: true,
      isFeatured: true, description: true, hasBooking: true, bookingLink: true, image1Url: true, image2Url: true, image3Url: true,
    },
  })

  vendors.sort((a, b) => planOrder(a.plan) - planOrder(b.plan) || (b.rating ?? 0) - (a.rating ?? 0))

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
        {' / '}
        <Link href={`/${province}`} className="hover:text-[#1E1E2C]">{cityData.province}</Link>
        {' / '}
        <Link href={`/${province}/${citySlug}`} className="hover:text-[#1E1E2C]">{cityData.name}</Link>
        {' / '}
        <span className="text-gray-900">{svc.label}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        {svc.label} in {cityData.name}, {cityData.province}
      </h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        Find top-rated {svc.description} in {cityData.name}. Compare providers, read reviews, and get a free quote.
      </p>

      <p className="text-sm text-gray-500 mb-4">{vendors.length} provider{vendors.length !== 1 ? 's' : ''} offering {svc.label} in {cityData.name}</p>

      {vendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {vendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center mb-12">
          <p className="text-gray-500">No {svc.label} providers listed in {cityData.name} yet.</p>
          <Link href={`/${province}/${citySlug}`} className="text-sm text-[#1E1E2C] hover:underline mt-2 inline-block">
            View all providers in {cityData.name} →
          </Link>
        </div>
      )}

      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Get a {svc.label} Quote in {cityData.name}</h2>
        <p className="text-gray-500 text-sm mb-6">Connect with local providers in minutes.</p>
        <LeadFormInline city={cityData.name} province={cityData.province} serviceType={svc.key} />
      </div>
    </main>
  )
}
