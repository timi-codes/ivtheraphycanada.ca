import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { VendorCard } from '@/components/vendor/VendorCard'
import { LeadFormInline } from '@/components/forms/LeadFormInline'
import { PageTracker } from '@/components/analytics/PageTracker'

interface Props {
  params: Promise<{ province: string; city: string }>
}

const SERVICE_TABS = [
  { label: 'All', key: '' },
  { label: 'IV Therapy', key: 'iv_therapy' },
  { label: 'NAD+', key: 'nad_plus' },
  { label: 'Mobile IV', key: 'mobile_iv' },
  { label: 'Vitamin IV', key: 'vitamin_iv' },
  { label: 'Chelation', key: 'chelation' },
  { label: 'Concierge', key: 'concierge' },
]

function planOrder(plan: string) {
  return { exclusive: 0, premium: 1, standard: 2, free: 3 }[plan] ?? 3
}

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province, city } = await params
  const cityData = await prisma.city.findUnique({ where: { slug: city } })
  if (!cityData) return { robots: 'noindex' }
  const canonical = `${SITE_URL}/${province}/${city}`
  const title = cityData.metaTitle ?? `IV Therapy in ${cityData.name}, ${cityData.province} | Clinics & Providers`
  const description = cityData.metaDescription ?? `Find top-rated IV therapy, NAD+ therapy, chelation, and mobile IV clinics in ${cityData.name}, ${cityData.province}. Compare providers, read reviews, and get free quotes.`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description, siteName: 'IV Therapy Canada', locale: 'en_CA' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function CityPage({ params }: Props) {
  const { province, city: citySlug } = await params

  const cityData = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!cityData) notFound()

  const vendors = await prisma.vendor.findMany({
    where: {
      city: { equals: cityData.name, mode: 'insensitive' },
      province: { equals: cityData.province, mode: 'insensitive' },
    },
    select: {
      id: true, name: true, slug: true, city: true, province: true,
      phone: true, website: true, rating: true, reviewCount: true,
      services: true, clinicType: true, plan: true, isVerified: true,
      isFeatured: true, description: true, hasBooking: true, bookingLink: true, image1Url: true, image2Url: true, image3Url: true,
    },
  })

  // Sort: exclusive → premium → standard → free, then by rating
  vendors.sort((a, b) => {
    const planDiff = planOrder(a.plan) - planOrder(b.plan)
    if (planDiff !== 0) return planDiff
    return (b.rating ?? 0) - (a.rating ?? 0)
  })

  const nearbyCities = cityData.nearbyCities ?? []

  const faqItems = [
    { q: `How much does IV therapy cost in ${cityData.name}?`, a: 'IV therapy in Canada typically ranges from $150–$400 per session depending on the formulation. Vitamin hydration drips start around $150, while specialty infusions like NAD+ or chelation can range from $300–$800+.' },
    { q: `Is IV therapy safe?`, a: 'IV therapy is generally safe when administered by trained medical professionals including RNs, NPs, and MDs. Always verify provider credentials before booking.' },
    { q: `Does insurance cover IV therapy in ${cityData.province}?`, a: 'Most IV therapy for wellness purposes is not covered by provincial health plans. Some extended health benefits may cover IV therapy if prescribed for a medical condition.' },
    { q: `Are there mobile IV therapy services in ${cityData.name}?`, a: `Yes, several providers listed here offer mobile IV therapy in ${cityData.name}, delivering treatments to your home, hotel, or office.` },
    { q: `What's the difference between IV therapy and an IV drip?`, a: 'IV therapy and IV drip are used interchangeably. Both refer to delivering fluids, vitamins, minerals, or medications directly into the bloodstream through an intravenous line.' },
  ]

  return (
    <>
      <PageTracker city={cityData.name} province={cityData.province} sourceType="city-browse" />
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `IV Therapy in ${cityData.name}, ${cityData.province}`,
            numberOfItems: vendors.length,
            itemListElement: vendors.slice(0, 10).map((v, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: v.name,
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/vendors/${v.slug}`,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: process.env.NEXT_PUBLIC_SITE_URL },
              { '@type': 'ListItem', position: 2, name: cityData.province, item: `${process.env.NEXT_PUBLIC_SITE_URL}/${province}` },
              { '@type': 'ListItem', position: 3, name: cityData.name },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
          {' / '}
          <Link href={`/${province}`} className="hover:text-[#1E1E2C]">{cityData.province}</Link>
          {' / '}
          <span className="text-gray-900">{cityData.name}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          IV Therapy in {cityData.name}, {cityData.province}
        </h1>

        {cityData.introContent && (
          <p className="text-gray-600 leading-relaxed mb-6 max-w-3xl">{cityData.introContent}</p>
        )}

        {/* Service tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {SERVICE_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key ? `/${province}/${citySlug}/${tab.key.replace('_', '-')}` : `/${province}/${citySlug}`}
              className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-[#1E1E2C] hover:text-[#1E1E2C] transition-colors"
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{vendors.length} provider{vendors.length !== 1 ? 's' : ''} in {cityData.name}</p>
        </div>

        {vendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center mb-12">
            <p className="text-gray-500">No providers listed in {cityData.name} yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              <Link href="/for-vendors" className="text-[#1E1E2C] hover:underline">List your business →</Link>
            </p>
          </div>
        )}

        {/* Lead form */}
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Get a Free Quote in {cityData.name}</h2>
          <p className="text-gray-500 text-sm mb-6">Tell us what you need and we&apos;ll connect you with local providers.</p>
          <LeadFormInline city={cityData.name} province={cityData.province} />
        </div>

        {/* Nearby cities */}
        {nearbyCities.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-3">IV Therapy Near {cityData.name}</h2>
            <div className="flex flex-wrap gap-2">
              {nearbyCities.map((nearby) => {
                const nearbySlug = nearby.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                return (
                  <Link
                    key={nearby}
                    href={`/${province}/${nearbySlug}`}
                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-[#1E1E2C] hover:text-[#1E1E2C] transition-colors"
                  >
                    {nearby}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions — IV Therapy in {cityData.name}
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="border-t border-gray-100 py-6 px-4 bg-gray-50">
        <p className="max-w-5xl mx-auto text-xs text-gray-400 italic">
          This directory lists service providers for informational purposes only and does not constitute medical advice.
          IV therapy, chelation therapy, NAD+ therapy, and related services should only be pursued under the guidance of a licensed medical professional.
        </p>
      </footer>
    </>
  )
}
