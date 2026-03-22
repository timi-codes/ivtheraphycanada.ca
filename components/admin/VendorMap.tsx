'use client'

import { useCallback, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import type { VendorRow } from './VendorListCard'

const MAP_CENTER = { lat: 56.1304, lng: -106.3468 }
const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

function makePinSvg(fill: string, stroke: string, selected = false) {
  const size = selected ? 32 : 24
  const height = selected ? 42 : 32
  const innerR = selected ? 6 : 5
  const ring = selected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="white" stroke-width="2" opacity="0.6"/>` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}">
    <path d="M${size / 2} 0C${(size / 2 * 0.447).toFixed(1)} 0 0 ${(size / 2 * 0.447).toFixed(1)} 0 ${size / 2}c0 ${size * 0.375} ${size / 2} ${size * 0.833} ${size / 2} ${size * 0.833}s${size / 2}-${size * 0.458} ${size / 2}-${size * 0.833}C${size} ${(size / 2 * 0.447).toFixed(1)} ${(size - size / 2 * 0.447).toFixed(1)} 0 ${size / 2} 0z" fill="${fill}" stroke="${stroke}" stroke-width="${selected ? 2 : 1.5}"/>
    ${ring}
    <circle cx="${size / 2}" cy="${size / 2}" r="${innerR}" fill="white" opacity="0.95"/>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const SELECTED_ICON_URL = makePinSvg('#E8624A', '#c94d38', true)
const SELECTED_SIZE = { width: 32, height: 42 }

const PLAN_ICONS: Record<string, { url: string; scaledSize: { width: number; height: number } }> = {
  free:      { url: makePinSvg('#9CA3AF', '#6B7280'), scaledSize: { width: 20, height: 27 } },
  standard:  { url: makePinSvg('#3B82F6', '#2563EB'), scaledSize: { width: 22, height: 29 } },
  premium:   { url: makePinSvg('#A855F7', '#9333EA'), scaledSize: { width: 24, height: 32 } },
  exclusive: { url: makePinSvg('#F59E0B', '#D97706'), scaledSize: { width: 26, height: 34 } },
}

interface Props {
  vendors: VendorRow[]
  selectedVendorId: string | null
  onSelectVendor: (id: string) => void
}

export function VendorMap({ vendors, selectedVendorId, onSelectVendor }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const onSelectRef = useRef(onSelectVendor)
  onSelectRef.current = onSelectVendor

  const vendorsWithCoords = vendors.filter(v => v.lat != null && v.lng != null)
  const vendorsWithoutCoords = vendors.length - vendorsWithCoords.length

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map

    vendors.filter(v => v.lat != null && v.lng != null).forEach(vendor => {
      const iconDef = PLAN_ICONS[vendor.plan] ?? PLAN_ICONS.free
      const marker = new google.maps.Marker({
        position: { lat: vendor.lat!, lng: vendor.lng! },
        map,
        icon: {
          url: iconDef.url,
          scaledSize: new google.maps.Size(iconDef.scaledSize.width, iconDef.scaledSize.height),
          anchor: new google.maps.Point(iconDef.scaledSize.width / 2, iconDef.scaledSize.height),
        },
        zIndex: vendor.plan === 'exclusive' ? 4 : vendor.plan === 'premium' ? 3 : vendor.plan === 'standard' ? 2 : 1,
        title: vendor.name,
      })
      marker.addListener('click', () => onSelectRef.current(vendor.id))
      markersRef.current.set(vendor.id, marker)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const prevSelectedRef = useRef<string | null>(null)

  useEffect(() => {
    const markers = markersRef.current

    // Reset previous marker to its plan icon
    if (prevSelectedRef.current) {
      const prev = vendors.find(v => v.id === prevSelectedRef.current)
      const prevMarker = markers.get(prevSelectedRef.current)
      if (prev && prevMarker) {
        const iconDef = PLAN_ICONS[prev.plan] ?? PLAN_ICONS.free
        prevMarker.setIcon({
          url: iconDef.url,
          scaledSize: new google.maps.Size(iconDef.scaledSize.width, iconDef.scaledSize.height),
          anchor: new google.maps.Point(iconDef.scaledSize.width / 2, iconDef.scaledSize.height),
        })
        prevMarker.setZIndex(prev.plan === 'exclusive' ? 4 : prev.plan === 'premium' ? 3 : prev.plan === 'standard' ? 2 : 1)
      }
    }

    prevSelectedRef.current = selectedVendorId

    if (!selectedVendorId) return

    // Highlight selected marker
    const marker = markers.get(selectedVendorId)
    if (marker) {
      marker.setIcon({
        url: SELECTED_ICON_URL,
        scaledSize: new google.maps.Size(SELECTED_SIZE.width, SELECTED_SIZE.height),
        anchor: new google.maps.Point(SELECTED_SIZE.width / 2, SELECTED_SIZE.height),
      })
      marker.setZIndex(999)
    }

    // Pan map
    if (mapRef.current) {
      const vendor = vendors.find(v => v.id === selectedVendorId)
      if (vendor?.lat && vendor?.lng) {
        mapRef.current.panTo({ lat: vendor.lat, lng: vendor.lng })
        mapRef.current.setZoom(13)
      }
    }
  }, [selectedVendorId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <p className="text-sm text-red-500">Failed to load Google Maps. Check your API key.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      {vendorsWithoutCoords > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm border border-orange-200 text-orange-700 text-xs px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
          {vendorsWithoutCoords} vendor{vendorsWithoutCoords !== 1 ? 's' : ''} missing coordinates
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-8 left-3 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2.5 shadow-md space-y-1.5">
        {[
          { color: 'bg-gray-400', label: 'Free' },
          { color: 'bg-blue-500', label: 'Standard' },
          { color: 'bg-purple-500', label: 'Premium' },
          { color: 'bg-amber-400', label: 'Exclusive' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={MAP_CENTER}
        zoom={4}
        onLoad={onLoad}
        options={{
          styles: MAP_STYLES,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: 7 },
        }}
      />
    </div>
  )
}
