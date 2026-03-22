'use client'

import Link from 'next/link'
import { SERVICE_LABELS } from '@/lib/utils'
import { track } from '@/lib/analytics'

interface VendorCardProps {
  vendor: {
    id: string
    name: string
    slug: string
    city: string
    province: string
    phone: string | null
    website: string | null
    rating: number | null
    reviewCount: number
    services: string[]
    clinicType: string
    plan: string
    isVerified: boolean
    isFeatured: boolean
    description: string | null
    hasBooking: boolean
    bookingLink: string | null
    image1Url: string | null
    image2Url: string | null
    image3Url: string | null
  }
}

// Deterministic color from business name
const AVATAR_COLORS = [
  ['#1E1E2C', '#141420'],
  ['#7c3aed', '#5b21b6'],
  ['#0369a1', '#075985'],
  ['#065f46', '#064e3b'],
  ['#9a3412', '#7c2d12'],
  ['#1d4ed8', '#1e3a8a'],
  ['#be185d', '#9d174d'],
  ['#d97706', '#b45309'],
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function Stars({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} className={`w-3.5 h-3.5 ${i <= full ? 'text-amber-400' : i === full + 1 && half ? 'text-amber-300' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-800">{rating.toFixed(1)}</span>
      {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
    </div>
  )
}

const CLINIC_TYPE_LABEL: Record<string, string> = {
  clinic: 'Clinic',
  mobile_only: 'Mobile',
  hybrid: 'Clinic + Mobile',
}

const PLAN_CONFIG: Record<string, { label: string; dot: string }> = {
  exclusive: { label: 'Exclusive', dot: 'bg-purple-500' },
  premium: { label: 'Premium', dot: 'bg-[#1E1E2C]' },
  standard: { label: 'Standard', dot: 'bg-blue-500' },
  free: { label: '', dot: '' },
}

export function VendorCard({ vendor }: VendorCardProps) {
  const [from, to] = getAvatarColor(vendor.name)
  const initial = vendor.name.charAt(0).toUpperCase()
  const planCfg = PLAN_CONFIG[vendor.plan]
  const isPaid = vendor.plan !== 'free'

  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="block group h-full"
      onClick={() => track('vendor_card_click', {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorSlug: vendor.slug,
        vendorPlan: vendor.plan,
        city: vendor.city,
        province: vendor.province,
      })}
    >
      <article
        className={`h-full bg-white rounded-2xl border overflow-hidden card-lift flex flex-col ${
          vendor.plan === 'exclusive'
            ? 'border-purple-200 shadow-md shadow-purple-100/50'
            : isPaid
            ? 'border-[#1E1E2C]/20 shadow-sm'
            : 'border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex flex-1 gap-0 min-h-0">
          {/* Avatar column */}
          <div className="flex-shrink-0 w-28 h-44 flex overflow-hidden">
            {vendor.image1Url ? (
              <img
                src={vendor.image1Url}
                alt={vendor.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div
                className="w-full h-full min-h-[5.5rem] flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
              >
                {initial}
              </div>
            )}
          </div>

          {/* Content: column layout so tags pin to bottom when grid row stretches */}
          <div className="flex-1 min-w-0 min-h-0 p-4 flex flex-col gap-2">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#1E1E2C] transition-colors leading-snug truncate">
                  {vendor.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {vendor.city}, {vendor.province}
                  <span className="text-gray-300">·</span>
                  {CLINIC_TYPE_LABEL[vendor.clinicType] ?? 'Clinic'}
                </p>
              </div>

              {/* Plan badge */}
              {isPaid && planCfg.label && (
                <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-gray-500 whitespace-nowrap">
                  <span className={`w-1.5 h-1.5 rounded-full ${planCfg.dot}`} />
                  {planCfg.label}
                </span>
              )}
            </div>

            {/* Rating */}
            {vendor.rating !== null && (
              <div className="shrink-0">
                <Stars rating={vendor.rating} count={vendor.reviewCount} />
              </div>
            )}

            {/* Description */}
            {vendor.description && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed shrink-0">
                {vendor.description}
              </p>
            )}

            {/* Services + tags — mt-auto uses row stretch space above instead of empty card bottom */}
            <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
              {vendor.services.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="inline-flex text-xs px-2 py-0.5 rounded-full bg-teal-50 text-[#1E1E2C] font-medium border border-teal-100"
                >
                  {SERVICE_LABELS[s] ?? s}
                </span>
              ))}
              {vendor.services.length > 3 && (
                <span className="text-xs text-gray-400">+{vendor.services.length - 3}</span>
              )}
              {vendor.hasBooking && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Book Online
                </span>
              )}
              {vendor.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-xs text-[#1E1E2C] font-medium">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
