import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { VendorCard } from '@/components/vendor/VendorCard'
import { VendorFilters } from '@/components/vendor/VendorFilters'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

export const metadata: Metadata = {
  title: 'Find IV Therapy Providers in Canada | Browse All Clinics',
  description: 'Browse all IV therapy, NAD+ therapy, chelation, and mobile IV clinics across Canada. Filter by service, city, and province.',
  alternates: { canonical: `${SITE_URL}/vendors` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/vendors`,
    title: 'Find IV Therapy Providers in Canada',
    description: 'Browse all IV therapy, NAD+, chelation, and mobile IV clinics across Canada.',
    siteName: 'IV Therapy Canada',
  },
  twitter: { card: 'summary', title: 'Find IV Therapy Providers in Canada', description: 'Browse all IV therapy clinics across Canada.' },
}

interface SearchParams {
  service?: string
  city?: string
  province?: string
  page?: string
}

const PAGE_SIZE = 20

function planOrder(plan: string) {
  return { exclusive: 0, premium: 1, standard: 2, free: 3 }[plan] ?? 3
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const skip = (page - 1) * PAGE_SIZE

  // Normalize hyphen→underscore so ?service=iv-therapy matches DB value iv_therapy
  const serviceParam = sp.service ? sp.service.replace(/-/g, '_') : ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (serviceParam) where.services = { has: serviceParam }
  if (sp.city) where.city = { contains: sp.city, mode: 'insensitive' }
  if (sp.province) where.province = { contains: sp.province, mode: 'insensitive' }

  const [vendors, total, allCities, allProvinces] = await Promise.all([
    prisma.vendor.findMany({
      where,
      select: {
        id: true, name: true, slug: true, city: true, province: true,
        phone: true, website: true, rating: true, reviewCount: true,
        services: true, clinicType: true, plan: true, isVerified: true,
        isFeatured: true, description: true, hasBooking: true, bookingLink: true, image1Url: true, image2Url: true, image3Url: true,
      },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.vendor.count({ where }),
    prisma.vendor.findMany({ select: { city: true, province: true }, distinct: ['city'], orderBy: { city: 'asc' } }),
    prisma.vendor.findMany({ select: { province: true }, distinct: ['province'], orderBy: { province: 'asc' } }),
  ])

  vendors.sort((a, b) => planOrder(a.plan) - planOrder(b.plan) || (b.rating ?? 0) - (a.rating ?? 0))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const SERVICE_OPTIONS = [
    { value: '', label: 'All Services' },
    { value: 'iv_therapy', label: 'IV Therapy' },
    { value: 'vitamin_iv', label: 'Vitamin IV' },
    { value: 'mobile_iv', label: 'Mobile IV' },
    { value: 'nad_plus', label: 'NAD+' },
    { value: 'chelation', label: 'Chelation' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'myers_cocktail', label: "Myers' Cocktail" },
    { value: 'glutathione', label: 'Glutathione' },
    { value: 'hangover_iv', label: 'Hangover IV' },
    { value: 'immune_iv', label: 'Immune IV' },
    { value: 'hydration', label: 'Hydration IV' },
  ]

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
        {' / '}
        <span className="text-gray-900">All Providers</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">IV Therapy Providers in Canada</h1>
      <p className="text-gray-500 mb-8">{total} providers listed across Canada</p>

      {/* Filters */}
      <VendorFilters
        serviceOptions={SERVICE_OPTIONS}
        cityProvinces={allCities.map(c => ({ city: c.city, province: c.province }))}
        provinces={allProvinces
          .map(p => p.province)
          .filter(p => p.length > 3) // drop abbreviations like "ON", "BC", "AB"
        }
        defaultService={serviceParam}
        defaultCity={sp.city ?? ''}
        defaultProvince={sp.province ?? ''}
        hasFilters={!!(serviceParam || sp.city || sp.province)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {vendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
      </div>

      {vendors.length === 0 && (
        <div className="text-center py-16 text-gray-400">No providers match your filters.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (() => {
        const makeHref = (p: number) => {
          const params = new URLSearchParams()
          if (serviceParam) params.set('service', serviceParam)
          if (sp.city) params.set('city', sp.city)
          if (sp.province) params.set('province', sp.province)
          params.set('page', String(p))
          return `/vendors?${params}`
        }

        // Build page list with ellipsis
        const delta = 2
        const range: (number | '…')[] = []
        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
            range.push(i)
          } else if (range[range.length - 1] !== '…') {
            range.push('…')
          }
        }

        const btnBase = 'inline-flex items-center justify-center h-9 min-w-[2.25rem] px-3 rounded-lg text-sm font-medium border transition-all'
        const btnActive = `${btnBase} bg-[#1E1E2C] text-white border-[#1E1E2C]`
        const btnDefault = `${btnBase} bg-white border-gray-200 text-gray-700 hover:border-[#1E1E2C] hover:text-[#1E1E2C]`
        const btnDisabled = `${btnBase} border-gray-100 text-gray-300 cursor-not-allowed`

        return (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {/* Prev */}
            {page > 1
              ? <Link href={makeHref(page - 1)} className={btnDefault}>← Prev</Link>
              : <span className={btnDisabled}>← Prev</span>
            }

            {/* Page numbers with ellipsis */}
            {range.map((p, i) =>
              p === '…'
                ? <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                : <Link key={p} href={makeHref(p)} className={p === page ? btnActive : btnDefault}>{p}</Link>
            )}

            {/* Next */}
            {page < totalPages
              ? <Link href={makeHref(page + 1)} className={btnDefault}>Next →</Link>
              : <span className={btnDisabled}>Next →</span>
            }
          </div>
        )
      })()}
    </main>
  )
}
