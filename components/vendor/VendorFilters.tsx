'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics'

interface Option { value: string; label: string }

interface Props {
  serviceOptions: Option[]
  cityProvinces: { city: string; province: string }[]
  provinces: string[]
  defaultService: string
  defaultCity: string
  defaultProvince: string
  hasFilters: boolean
}

function Dropdown({ options, value, onChange, placeholder }: {
  options: Option[]
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const label = options.find(o => o.value === value)?.label ?? placeholder

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-10 px-4 rounded-full border bg-white text-sm font-medium transition-all hover:border-[#1E1E2C] focus:outline-none"
        style={{ borderColor: open ? '#1E1E2C' : '#D1D5DB', color: value ? '#1C1917' : '#9CA3AF', minWidth: '10rem' }}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#9CA3AF' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <ul className="absolute z-[200] mt-1 w-full min-w-max max-h-64 overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-xl"
          style={{ top: '100%', left: 0 }}>
          {options.map(o => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 flex items-center gap-2"
                style={{
                  color: o.value === value ? '#1E1E2C' : '#374151',
                  fontWeight: o.value === value ? 600 : 400,
                  background: o.value === value ? '#F3F3F5' : undefined,
                }}
              >
                {o.value === value && <span className="text-[#E8624A] text-xs">✓</span>}
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function VendorFilters({ serviceOptions, cityProvinces, provinces, defaultService, defaultCity, defaultProvince, hasFilters }: Props) {
  const [service, setService] = useState(defaultService)
  const [province, setProvince] = useState(defaultProvince)
  const [city, setCity] = useState(defaultCity)
  const router = useRouter()

  // Sync state when URL params change (Next.js reconciles without remounting)
  useEffect(() => setService(defaultService), [defaultService])
  useEffect(() => setProvince(defaultProvince), [defaultProvince])
  useEffect(() => setCity(defaultCity), [defaultCity])

  // When province changes, reset city if it doesn't belong to new province
  function handleProvinceChange(p: string) {
    setProvince(p)
    if (p && city) {
      const stillValid = cityProvinces.some(cp => cp.city === city && cp.province === p)
      if (!stillValid) setCity('')
    }
  }

  // Cities filtered by selected province
  const filteredCities = province
    ? cityProvinces.filter(cp => cp.province === province).map(cp => cp.city)
    : cityProvinces.map(cp => cp.city)

  const cityOptions: Option[] = [
    { value: '', label: 'All Cities' },
    ...filteredCities.map(c => ({ value: c, label: c })),
  ]

  const provinceOptions: Option[] = [
    { value: '', label: 'All Provinces' },
    ...provinces.map(p => ({ value: p, label: p })),
  ]

  function handleFilter() {
    track('service_filter', { service, city, province })
    const params = new URLSearchParams()
    if (service) params.set('service', service)
    if (city) params.set('city', city)
    if (province) params.set('province', province)
    router.push(`/vendors?${params}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Dropdown options={serviceOptions} value={service} onChange={setService} placeholder="All Services" />
      <Dropdown options={provinceOptions} value={province} onChange={handleProvinceChange} placeholder="All Provinces" />
      <Dropdown options={cityOptions} value={city} onChange={setCity} placeholder="All Cities" />

      <button
        type="button"
        onClick={handleFilter}
        className="h-10 rounded-full bg-[#1E1E2C] text-white px-5 text-sm font-medium hover:bg-[#141420] transition-colors"
      >
        Filter
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={() => { setService(''); setCity(''); setProvince(''); router.push('/vendors') }}
          className="h-10 inline-flex items-center rounded-full border border-gray-200 bg-white px-5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
