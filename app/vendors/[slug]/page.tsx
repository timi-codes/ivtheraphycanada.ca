import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LeadFormInline } from '@/components/forms/LeadFormInline'
import { VendorCTAs } from '@/components/vendor/VendorCTAs'
import { PageTracker } from '@/components/analytics/PageTracker'
import { ScrollDepthTracker } from '@/components/analytics/ScrollDepthTracker'
import { ContactLinks } from '@/components/vendor/ContactLinks'
import { SERVICE_LABELS, PROVINCE_SLUGS, formatPhone } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const vendor = await prisma.vendor.findUnique({ where: { slug } })
  if (!vendor) return {}
  return {
    title: `${vendor.name} — IV Therapy in ${vendor.city}, ${vendor.province}`,
    description: vendor.description?.slice(0, 160) ?? `${vendor.name} offers IV therapy services in ${vendor.city}, ${vendor.province}. View services, contact info, and book an appointment.`,
  }
}

const PROVIDER_LABELS: Record<string, string> = {
  md: 'Medical Doctor (MD)',
  nd: 'Naturopathic Doctor (ND)',
  rn: 'Registered Nurse (RN)',
  np: 'Nurse Practitioner (NP)',
}

const DRIP_LABELS: Record<string, string> = {
  energy: 'Energy Boost',
  beauty: 'Beauty & Glow',
  athletic: 'Athletic Recovery',
  anti_aging: 'Anti-Aging',
  detox: 'Detox',
  weight_loss: 'Weight Loss',
  fertility: 'Fertility Support',
  hangover: 'Hangover Recovery',
  immune: 'Immune Boost',
  hydration_pkg: 'Hydration Package',
}

const ADDON_LABELS: Record<string, string> = {
  hyperbaric: 'Hyperbaric Oxygen',
  ozone: 'Ozone Therapy',
  peptides: 'Peptides',
  hormone_therapy: 'Hormone Therapy',
  cryotherapy: 'Cryotherapy',
  red_light: 'Red Light Therapy',
  weight_loss_program: 'Weight Loss Program',
  botox: 'Botox',
  laser: 'Laser Treatments',
  acupuncture: 'Acupuncture',
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
      <span className="text-gray-500 text-sm">({count} reviews)</span>
    </div>
  )
}

export default async function VendorPage({ params }: Props) {
  const { slug } = await params
  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    include: { reviews: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })
  if (!vendor) notFound()

  const provinceSlug = PROVINCE_SLUGS[vendor.province] ?? vendor.province.toLowerCase().replace(/\s+/g, '-')
  const citySlug = vendor.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const clinicTypeLabel = vendor.clinicType === 'mobile_only'
    ? 'Mobile Only'
    : vendor.clinicType === 'hybrid'
    ? 'Clinic + Mobile'
    : 'Clinic'

  return (
    <>
      <PageTracker
        city={vendor.city}
        province={vendor.province}
        vendorId={vendor.id}
        vendorName={vendor.name}
        vendorSlug={vendor.slug}
        vendorPlan={vendor.plan}
      />
      <ScrollDepthTracker
        vendorId={vendor.id}
        vendorName={vendor.name}
        city={vendor.city}
        province={vendor.province}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: vendor.name,
            description: vendor.description,
            telephone: vendor.phone,
            url: vendor.website,
            address: {
              '@type': 'PostalAddress',
              streetAddress: vendor.street,
              addressLocality: vendor.city,
              addressRegion: vendor.province,
              postalCode: vendor.postalCode,
              addressCountry: 'CA',
            },
            geo: vendor.lat && vendor.lng ? {
              '@type': 'GeoCoordinates',
              latitude: vendor.lat,
              longitude: vendor.lng,
            } : undefined,
            aggregateRating: vendor.rating && vendor.reviewCount > 0 ? {
              '@type': 'AggregateRating',
              ratingValue: vendor.rating,
              reviewCount: vendor.reviewCount,
            } : undefined,
          }),
        }}
      />

      <main>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E1E2C] to-[#0a5f63] py-10 px-4 text-white">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-teal-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href={`/${provinceSlug}`} className="hover:text-white">{vendor.province}</Link>
              {' / '}
              <Link href={`/${provinceSlug}/${citySlug}`} className="hover:text-white">{vendor.city}</Link>
              {' / '}
              <span className="text-white">{vendor.name}</span>
            </nav>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-3xl font-bold">{vendor.name}</h1>
                  {vendor.plan === 'exclusive' && <Badge variant="premium">Exclusive</Badge>}
                  {vendor.plan === 'premium' && <Badge variant="teal">Premium</Badge>}
                  {vendor.isVerified && <Badge variant="green">Verified</Badge>}
                </div>
                <p className="text-teal-100">
                  {vendor.address ?? `${vendor.city}, ${vendor.province}`}
                </p>
                {vendor.rating && vendor.reviewCount > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-amber-300 font-semibold">{vendor.rating.toFixed(1)}</span>
                    <span className="text-teal-200 text-sm">({vendor.reviewCount} reviews)</span>
                    <Badge variant="default" className="bg-white/20 text-white">{clinicTypeLabel}</Badge>
                  </div>
                )}
              </div>
              <VendorCTAs
                vendorId={vendor.id}
                vendorName={vendor.name}
                vendorSlug={vendor.slug}
                vendorPlan={vendor.plan}
                city={vendor.city}
                province={vendor.province}
                phone={vendor.phone}
                website={vendor.website}
                bookingLink={vendor.bookingLink}
                hasBooking={vendor.hasBooking}
                lat={vendor.lat}
                lng={vendor.lng}
              />
            </div>
          </div>
        </div>

        {/* Photo gallery */}
        {(vendor.image1Url || vendor.image2Url || vendor.image3Url) && (
          <div className="max-w-4xl mx-auto px-4 pt-6">
            <div className={`grid gap-2 rounded-xl overflow-hidden ${
              [vendor.image1Url, vendor.image2Url, vendor.image3Url].filter(Boolean).length === 1
                ? 'grid-cols-1'
                : [vendor.image1Url, vendor.image2Url, vendor.image3Url].filter(Boolean).length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
            }`}>
              {vendor.image1Url && (
                <img src={vendor.image1Url} alt={`${vendor.name} photo 1`} className="w-full h-48 object-cover" />
              )}
              {vendor.image2Url && (
                <img src={vendor.image2Url} alt={`${vendor.name} photo 2`} className="w-full h-48 object-cover" />
              )}
              {vendor.image3Url && (
                <img src={vendor.image3Url} alt={`${vendor.name} photo 3`} className="w-full h-48 object-cover" />
              )}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              {vendor.description && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">About {vendor.name}</h2>
                  <p className="text-gray-600 leading-relaxed">{vendor.description}</p>
                </section>
              )}

              {/* Services */}
              {vendor.services.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Services Offered</h2>
                  <div className="flex flex-wrap gap-2">
                    {vendor.services.map((s) => (
                      <Badge key={s} variant="teal" className="text-sm px-3 py-1">
                        {SERVICE_LABELS[s] ?? s}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Drip packages */}
              {vendor.dripPackages.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">IV Drip Packages</h2>
                  <ul className="grid grid-cols-2 gap-2">
                    {vendor.dripPackages.map((pkg) => (
                      <li key={pkg} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-[#E8624A] inline-block flex-shrink-0" />
                        {DRIP_LABELS[pkg] ?? pkg}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Add-on services */}
              {vendor.addOnServices.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Additional Services</h2>
                  <div className="flex flex-wrap gap-2">
                    {vendor.addOnServices.map((s) => (
                      <Badge key={s} variant="gray">{ADDON_LABELS[s] ?? s}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Map */}
              {vendor.lat && vendor.lng && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Location</h2>
                  <div className="rounded-xl overflow-hidden border border-gray-200 h-56">
                    <iframe
                      width="100%"
                      height="100%"
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${vendor.lat},${vendor.lng}&zoom=15`}
                    />
                  </div>
                  {vendor.address && (
                    <p className="text-sm text-gray-500 mt-2">{vendor.address}</p>
                  )}
                </section>
              )}

              {/* Reviews */}
              {vendor.reviews.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Reviews
                    {vendor.rating && vendor.reviewCount > 0 && (
                      <span className="ml-3 font-normal">
                        <StarRating rating={vendor.rating} count={vendor.reviewCount} />
                      </span>
                    )}
                  </h2>
                  <div className="space-y-4">
                    {vendor.reviews.map((review) => (
                      <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{review.authorName ?? 'Anonymous'}</span>
                          <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-CA')}</span>
                        </div>
                        {review.body && <p className="text-sm text-gray-600">{review.body}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Quote form */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <h3 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">Request a Quote</h3>
                <p className="mb-6 text-sm text-gray-600 sm:text-base">
                  Send an inquiry directly to this provider.
                </p>
                <LeadFormInline
                  city={vendor.city}
                  province={vendor.province}
                  vendorId={vendor.id}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact card */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-4">Contact</h3>
                <ContactLinks
                  vendorId={vendor.id}
                  vendorName={vendor.name}
                  vendorSlug={vendor.slug}
                  vendorPlan={vendor.plan}
                  city={vendor.city}
                  province={vendor.province}
                  phone={vendor.phone}
                  website={vendor.website}
                  email={vendor.email}
                  instagram={vendor.instagram}
                />

                {/* Provider types */}
                {vendor.providerType.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Providers</p>
                    <div className="space-y-1">
                      {vendor.providerType.map((pt) => (
                        <p key={pt} className="text-sm text-gray-700">{PROVIDER_LABELS[pt] ?? pt.toUpperCase()}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 px-4 bg-gray-50">
        <p className="max-w-4xl mx-auto text-xs text-gray-400 italic">
          This directory lists service providers for informational purposes only and does not constitute medical advice.
          IV therapy, chelation therapy, NAD+ therapy, and related services should only be pursued under the guidance of a licensed medical professional.
        </p>
      </footer>
    </>
  )
}
