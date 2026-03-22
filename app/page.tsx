export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { CitySearch } from '@/components/city/CitySearch'
import { VendorCard } from '@/components/vendor/VendorCard'
import { Logo } from '@/components/ui/Logo'

// ─── Data ────────────────────────────────────────────────────────────────────

async function getFeaturedVendors() {
  return prisma.vendor.findMany({
    where: { plan: { in: ['premium', 'exclusive'] } },
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    take: 6,
    select: {
      id: true, name: true, slug: true, city: true, province: true,
      phone: true, website: true, rating: true, reviewCount: true,
      services: true, clinicType: true, plan: true, isVerified: true,
      isFeatured: true, description: true, hasBooking: true, bookingLink: true, image1Url: true, image2Url: true, image3Url: true,
    },
  })
}

async function getTopRated() {
  return prisma.vendor.findMany({
    where: { rating: { gte: 4.5 }, reviewCount: { gte: 10 } },
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    take: 6,
    select: {
      id: true, name: true, slug: true, city: true, province: true,
      phone: true, website: true, rating: true, reviewCount: true,
      services: true, clinicType: true, plan: true, isVerified: true,
      isFeatured: true, description: true, hasBooking: true, bookingLink: true, image1Url: true, image2Url: true, image3Url: true,
    },
  })
}

async function getStats() {
  const [vendorCount, cityCount] = await Promise.all([
    prisma.vendor.count(),
    prisma.city.count(),
  ])
  return { vendorCount, cityCount }
}

// ─── Static data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { icon: '💧', label: 'IV Therapy',   slug: 'iv-therapy',        service: 'iv_therapy',   color: '#F3F3F5', accent: '#1E1E2C' },
  { icon: '⚡', label: 'NAD+',         slug: 'nad-plus',          service: 'nad_plus',     color: '#FEF3C7', accent: '#D97706' },
  { icon: '🏠', label: 'Mobile IV',    slug: 'mobile-iv',         service: 'mobile_iv',    color: '#F0FDF4', accent: '#16A34A' },
  { icon: '🧬', label: 'Chelation',    slug: 'chelation-therapy', service: 'chelation',    color: '#F5F3FF', accent: '#7C3AED' },
  { icon: '✨', label: 'Glutathione',  slug: 'glutathione',       service: 'glutathione',  color: '#FFF1F2', accent: '#BE185D' },
  { icon: '🩺', label: 'Concierge MD', slug: 'concierge-medicine',service: 'concierge',    color: '#F3F3F5', accent: '#1D4ED8' },
  { icon: '🍋', label: 'Vitamin IV',   slug: 'vitamin-iv',        service: 'vitamin_iv',   color: '#FEFCE8', accent: '#CA8A04' },
  { icon: '🛡️', label: 'Immune IV',    slug: 'immune-iv',         service: 'immune_iv',    color: '#F0FDF4', accent: '#15803D' },
]

const TOP_CITIES = [
  { name: 'Toronto',   prov: 'ontario',          flag: '🇨🇦' },
  { name: 'Vancouver', prov: 'british-columbia',  flag: '🌊' },
  { name: 'Calgary',   prov: 'alberta',           flag: '🏔️' },
  { name: 'Montreal',  prov: 'quebec',            flag: '🎭' },
  { name: 'Ottawa',    prov: 'ontario',           flag: '🏛️' },
  { name: 'Edmonton',  prov: 'alberta',           flag: '🌅' },
  { name: 'Halifax',   prov: 'nova-scotia',       flag: '⚓' },
  { name: 'Winnipeg',  prov: 'manitoba',          flag: '🌾' },
]

const PROVINCES = [
  { name: 'Ontario',            slug: 'ontario',                   abbr: 'ON' },
  { name: 'British Columbia',   slug: 'british-columbia',          abbr: 'BC' },
  { name: 'Alberta',            slug: 'alberta',                   abbr: 'AB' },
  { name: 'Quebec',             slug: 'quebec',                    abbr: 'QC' },
  { name: 'Manitoba',           slug: 'manitoba',                  abbr: 'MB' },
  { name: 'Saskatchewan',       slug: 'saskatchewan',              abbr: 'SK' },
  { name: 'Nova Scotia',        slug: 'nova-scotia',               abbr: 'NS' },
  { name: 'New Brunswick',      slug: 'new-brunswick',             abbr: 'NB' },
  { name: 'Newfoundland',       slug: 'newfoundland-and-labrador', abbr: 'NL' },
  { name: 'PEI',                slug: 'prince-edward-island',      abbr: 'PE' },
  { name: 'NWT',                slug: 'northwest-territories',     abbr: 'NT' },
  { name: 'Yukon',              slug: 'yukon',                     abbr: 'YT' },
  { name: 'Nunavut',            slug: 'nunavut',                   abbr: 'NU' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [featured, topRated, stats] = await Promise.all([
    getFeaturedVendors(),
    getTopRated(),
    getStats(),
  ])

  const displayVendors = featured.length >= 4 ? featured : topRated

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

  return (
    <>
      {/* JSON-LD: Organization + WebSite */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'IV Therapy Canada',
        url: siteUrl,
        logo: `${siteUrl}/drip.svg`,
        description: "Canada's most complete directory of IV therapy, NAD+, chelation, and mobile IV providers.",
        areaServed: 'CA',
        sameAs: [],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: siteUrl,
        name: 'IV Therapy Canada',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/vendors?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }) }} />

      {/* ── HERO ── */}
      <section
        className="pt-14 pb-16 px-4 overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #EAF6F6 0%, #F0FAF7 40%, #E8F4FD 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, #B2EBF2 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #A7F3D0 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="max-w-4xl mx-auto text-center relative">

          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border fade-up"
            style={{
              background: 'rgba(13,115,119,0.08)',
              borderColor: 'rgba(13,115,119,0.2)',
              color: '#0D7377',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#0D7377' }} />
            Canada&apos;s IV Therapy Directory
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-5 fade-up delay-100"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#1E1E2C' }}
          >
            Find the Best{' '}
            <span style={{ color: '#E8624A' }}>IV Therapy</span>
            <br />
            Clinics Near You
          </h1>

          <p className="text-lg md:text-xl max-w-xl mx-auto mb-8 fade-up delay-200" style={{ color: '#4B5563', lineHeight: '1.6' }}>
            Canada&apos;s most complete directory of IV therapy, NAD+, chelation, and mobile IV providers. Compare, read reviews, and book instantly.
          </p>

          {/* Search */}
          <div className="flex justify-center mb-6 fade-up delay-300">
            <CitySearch />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 fade-up delay-400 relative z-0">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <Link
                key={cat.service}
                href={`/vendors?service=${cat.service}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full border transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderColor: 'rgba(13,115,119,0.2)',
                  color: '#1E1E2C',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Stats row */}
          <div
            className="relative z-0 inline-flex items-center gap-12 px-12 py-4 rounded-2xl border fade-up delay-400"
            style={{ background: 'rgba(255,255,255,0.8)', borderColor: 'rgba(13,115,119,0.15)', backdropFilter: 'blur(8px)' }}
          >
            {[
              { value: `${stats.vendorCount}+`, label: 'Providers' },
              { value: `${stats.cityCount}+`,   label: 'Cities' },
              { value: '13',                     label: 'Provinces' },
              { value: 'Free',                   label: 'Quotes' },
            ].map((s, i) => (
              <div key={s.label} className="text-center">
                {i > 0 && <div className="absolute left-0 top-1/4 bottom-1/4 w-px bg-white/20" />}
                <div className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1E1E2C' }}>{s.value}</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-14 px-4" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
                Browse by Service
              </h2>
              <p className="text-sm mt-1" style={{ color: '#78716C' }}>Find exactly the treatment you&apos;re looking for</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.service}
                href={`/vendors?service=${cat.service}`}
                className="group rounded-2xl p-4 border transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                style={{ background: cat.color, borderColor: `${cat.accent}20` }}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: cat.accent }}>
                  {cat.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: `${cat.accent}99` }}>Find clinics →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP CITIES ── */}
      <section className="py-12 px-4" style={{ background: '#F4F8F7', borderTop: '1px solid #E2EDED', borderBottom: '1px solid #E2EDED' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-5" style={{ fontFamily: 'var(--font-display)', color: '#78716C' }}>
            Popular Cities
          </h2>
          <div className="flex flex-wrap gap-2">
            {TOP_CITIES.map((city) => {
              const slug = city.name.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link
                  key={city.name}
                  href={`/${city.prov}/${slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all hover:border-[#1E1E2C] hover:text-[#1E1E2C] hover:shadow-sm"
                  style={{ background: 'white', borderColor: '#E7E5E0', color: '#44403C' }}
                >
                  <span>{city.flag}</span>
                  {city.name}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED / TOP RATED VENDORS ── */}
      <section className="py-14 px-4" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
                {featured.length >= 4 ? 'Featured Providers' : 'Top Rated Providers'}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#78716C' }}>
                {featured.length >= 4 ? 'Premium listings across Canada' : 'Highest-rated clinics in our directory'}
              </p>
            </div>
            <Link
              href="/vendors"
              className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: '#1E1E2C', fontFamily: 'var(--font-display)' }}
            >
              View all <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayVendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-4 dot-divider" style={{ background: '#F4F8F7' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
              How It Works
            </h2>
            <p className="mt-2 text-base" style={{ color: '#78716C' }}>
              Find and book IV therapy in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.7%+1rem)] right-[calc(16.7%+1rem)] h-px" style={{ background: 'linear-gradient(90deg, #E7E5E0, #1E1E2C, #E7E5E0)' }} />

            {[
              { n: '01', icon: '🔍', title: 'Search Your City', desc: 'Enter your location or browse by province to find IV therapy clinics and mobile providers near you.' },
              { n: '02', icon: '📋', title: 'Compare Providers', desc: 'Read reviews, compare services, check credentials, and see pricing — all in one place.' },
              { n: '03', icon: '💉', title: 'Book or Get a Quote', desc: 'Contact clinics directly, book online, or submit a free quote request for the best deal.' },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center relative">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm"
                  style={{ background: 'white', border: '1px solid #E7E5E0' }}
                >
                  {step.icon}
                </div>
                <span className="text-xs font-bold mb-1" style={{ color: '#1E1E2C', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>{step.n}</span>
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#78716C' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVINCE GRID ── */}
      <section className="py-14 px-4" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1C1917' }}>
            Browse by Province
          </h2>
          <p className="text-sm mb-8" style={{ color: '#78716C' }}>IV therapy providers in every province and territory</p>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {PROVINCES.map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}`}
                className="group rounded-xl px-3 py-3 text-center border transition-all duration-200 hover:border-[#1E1E2C] hover:bg-white hover:shadow-sm hover:scale-[1.03]"
                style={{ background: '#F4F8F7', borderColor: '#2D2D2D' }}
              >
                <div
                  className="font-extrabold text-base group-hover:text-[#1E1E2C] transition-colors"
                  style={{ fontFamily: 'var(--font-display)', color: '#44403C' }}
                >
                  {p.abbr}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ color: '#A8A29E' }}>{p.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── VENDOR CTA ── */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{
          background: '#1E1E2C',
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="max-w-3xl mx-auto text-center relative">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(255,255,255,.15)', color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
          >
            FOR IV THERAPY CLINICS
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Grow Your Practice with<br />Canada&apos;s Largest Directory
          </h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,.75)' }}>
            Join 369+ providers. Get listed free or upgrade to reach more patients in your city.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/list-your-clinic"
              className="inline-flex items-center font-bold px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-[.98] shadow-lg"
              style={{ background: 'white', color: '#1E1E2C', fontFamily: 'var(--font-display)' }}
            >
              List Your Business — Free
            </Link>
            {/* Pricing plans button hidden for now
            <Link
              href="/for-vendors/pricing"
              className="inline-flex items-center font-semibold px-7 py-3 rounded-full border-2 border-white/40 text-white transition-all hover:bg-white/10"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              View Pricing Plans →
            </Link>
            */}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1C1917', color: '#A8A29E' }} className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-1 mb-3">
                <Image src="/drip.svg" alt="" width={24} height={24} style={{ marginTop: '6px' }} />
                <div className="flex flex-col items-start leading-none">
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em', color: 'white', fontSize: '1.1rem' }}>Therapy</span>
                  <Image src="/canada.svg" alt="Canada" width={42} height={8} />
                </div>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs mt-3">
                Canada&apos;s most complete directory of IV therapy, NAD+, chelation, and mobile IV providers — from coast to coast.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#78716C', fontFamily: 'var(--font-display)' }}>Directory</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['All Providers', '/vendors'],
                  ['Toronto', '/ontario/toronto'],
                  ['Vancouver', '/british-columbia/vancouver'],
                  ['Calgary', '/alberta/calgary'],
                  ['Montreal', '/quebec/montreal'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#78716C', fontFamily: 'var(--font-display)' }}>For Clinics</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['List Your Business', '/for-vendors'],
                  ['Get a Quote', '/get-a-quote'],
                  ['Blog', '/blog'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 text-xs space-y-2" style={{ borderColor: '#292524' }}>
            <p style={{ color: '#57534E', fontStyle: 'italic' }}>
              This directory lists service providers for informational purposes only and does not constitute medical advice.
              IV therapy, chelation therapy, NAD+ therapy, and related services should only be pursued under the guidance of a licensed medical professional.
            </p>
            <p style={{ color: '#57534E' }}>© {new Date().getFullYear()} IV Therapy Canada. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
