'use client'

import { track } from '@/lib/analytics'

interface Props {
  vendorId: string
  vendorName: string
  vendorSlug: string
  vendorPlan: string
  city: string
  province: string
  phone: string | null
  website: string | null
  bookingLink: string | null
  hasBooking: boolean
  lat: number | null
  lng: number | null
}

function websiteEvent(url: string): string {
  if (/instagram\.com/i.test(url)) return 'instagram_click'
  if (/facebook\.com/i.test(url)) return 'facebook_click'
  return 'website_click'
}

export function VendorCTAs({ vendorId, vendorName, vendorSlug, vendorPlan, city, province, phone, website, bookingLink, hasBooking, lat, lng }: Props) {
  const ctx = { vendorId, vendorName, vendorSlug, vendorPlan, city, province }

  return (
    <div className="flex flex-col gap-2">
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={() => track('phone_click', ctx)}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white text-[#1E1E2C] font-semibold text-sm hover:bg-[#F3F3F5] transition-colors"
        >
          📞 {phone}
        </a>
      )}
      {hasBooking && bookingLink && (
        <a
          href={bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('booking_click', ctx)}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          Book Online →
        </a>
      )}
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(websiteEvent(website), ctx)}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          🌐 Visit Website
        </a>
      )}
      {lat && lng && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('directions_click', ctx)}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          📍 Get Directions
        </a>
      )}
    </div>
  )
}
