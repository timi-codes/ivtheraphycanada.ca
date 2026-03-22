'use client'

import Link from 'next/link'

export interface VendorRow {
  id: string
  name: string
  slug: string
  city: string
  province: string
  plan: string
  isVerified: boolean
  isFeatured: boolean
  businessStatus: string
  services: string[]
  clinicType: string
  lat: number | null
  lng: number | null
  rating: number | null
  reviewCount: number
  phone: string | null
  website: string | null
}

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-500',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
  exclusive: 'bg-amber-100 text-amber-700',
}

const SERVICE_LABELS: Record<string, string> = {
  iv_therapy: 'IV Therapy',
  vitamin_iv: 'Vitamin IV',
  mobile_iv: 'Mobile IV',
  nad_plus: 'NAD+',
  chelation: 'Chelation',
  concierge: 'Concierge',
  myers_cocktail: "Myers'",
  glutathione: 'Glutathione',
  hangover_iv: 'Hangover',
  immune_iv: 'Immune',
  hydration: 'Hydration',
}

interface Props {
  vendor: VendorRow
  isSelected: boolean
  onSelect: (id: string) => void
}

export function VendorListCard({ vendor, isSelected, onSelect }: Props) {
  const visibleServices = vendor.services.slice(0, 3)
  const extraCount = vendor.services.length - 3

  return (
    <button
      onClick={() => onSelect(vendor.id)}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">{vendor.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${PLAN_BADGE[vendor.plan] ?? PLAN_BADGE.free}`}>
              {vendor.plan}
            </span>
            {vendor.isVerified && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>
            )}
            {vendor.isFeatured && (
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">★ Featured</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{vendor.city}, {vendor.province}</p>
          {vendor.services.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {visibleServices.map(s => (
                <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {SERVICE_LABELS[s] ?? s}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="text-[10px] text-gray-400">+{extraCount}</span>
              )}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          {vendor.rating != null && (
            <p className="text-xs font-semibold text-gray-700">★ {vendor.rating.toFixed(1)}</p>
          )}
          {vendor.reviewCount > 0 && (
            <p className="text-[10px] text-gray-400">{vendor.reviewCount} reviews</p>
          )}
          {!vendor.lat && (
            <p className="text-[10px] text-orange-400 mt-1">No coords</p>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        {vendor.businessStatus !== 'OPERATIONAL' && (
          <span className="text-[10px] text-red-500 font-medium">
            {vendor.businessStatus === 'CLOSED' ? 'Closed' : 'Temp. Closed'}
          </span>
        )}
        <Link
          href={`/vendors/${vendor.slug}`}
          target="_blank"
          onClick={e => e.stopPropagation()}
          className="text-[10px] text-blue-500 hover:underline"
        >
          View profile →
        </Link>
      </div>
    </button>
  )
}
