'use client'

import Link from 'next/link'
import type { VendorRow } from './VendorListCard'

const SERVICE_LABELS: Record<string, string> = {
  iv_therapy: 'IV Therapy',
  vitamin_iv: 'Vitamin IV',
  mobile_iv: 'Mobile IV',
  nad_plus: 'NAD+',
  chelation: 'Chelation',
  concierge: 'Concierge',
  myers_cocktail: "Myers' Cocktail",
  glutathione: 'Glutathione',
  hangover_iv: 'Hangover IV',
  immune_iv: 'Immune IV',
  hydration: 'Hydration',
}

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-gray-100 text-gray-500',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
  exclusive: 'bg-amber-100 text-amber-700',
}

const CLINIC_TYPE_LABEL: Record<string, string> = {
  clinic: 'Clinic',
  mobile_only: 'Mobile Only',
  hybrid: 'Hybrid',
}

interface Props {
  vendor: VendorRow | null
  onClose: () => void
}

export function VendorDetailPanel({ vendor, onClose }: Props) {
  return (
    <div
      className={`absolute top-0 right-0 h-full w-[320px] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-20 transition-transform duration-200 ${
        vendor ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {!vendor ? null : (
        <>
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${PLAN_BADGE[vendor.plan] ?? PLAN_BADGE.free}`}>
                  {vendor.plan}
                </span>
                {vendor.isVerified && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>
                )}
                {vendor.isFeatured && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-semibold">★ Featured</span>
                )}
              </div>
              <h2 className="text-sm font-bold text-gray-900 mt-1.5 leading-snug">{vendor.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{vendor.city}, {vendor.province}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-0.5"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

            {/* Rating */}
            {vendor.rating != null && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(vendor.rating!) ? '#F59E0B' : '#E5E7EB'}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-800">{vendor.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">{vendor.reviewCount} review{vendor.reviewCount !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Status + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <p className={`text-xs font-medium ${
                  vendor.businessStatus === 'OPERATIONAL' ? 'text-green-600' :
                  vendor.businessStatus === 'CLOSED_TEMPORARILY' ? 'text-amber-600' :
                  'text-red-500'
                }`}>
                  {vendor.businessStatus === 'OPERATIONAL' ? 'Operational' :
                   vendor.businessStatus === 'CLOSED_TEMPORARILY' ? 'Temp. Closed' : 'Closed'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</p>
                <p className="text-xs font-medium text-gray-700">{CLINIC_TYPE_LABEL[vendor.clinicType] ?? vendor.clinicType}</p>
              </div>
            </div>

            {/* Services */}
            {vendor.services.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.services.map(s => (
                    <span key={s} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">
                      {SERVICE_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
              <div className="space-y-2">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                    </svg>
                    {vendor.phone}
                  </a>
                )}
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline truncate">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                    <span className="truncate">{vendor.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {vendor.lat && vendor.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${vendor.lat},${vendor.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Coordinates */}
            {vendor.lat && vendor.lng && (
              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Coordinates</p>
                <p className="text-xs font-mono text-gray-600">{vendor.lat.toFixed(5)}, {vendor.lng.toFixed(5)}</p>
              </div>
            )}
            {!vendor.lat && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5">
                <p className="text-xs text-orange-600 font-medium">⚠ No coordinates — won't appear on map</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100">
            <Link
              href={`/vendors/${vendor.slug}`}
              target="_blank"
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#1E1E2C] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              View Public Profile
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
