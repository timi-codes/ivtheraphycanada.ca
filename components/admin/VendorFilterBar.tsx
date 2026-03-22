'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition, useRef, useState, useEffect } from 'react'

const PLANS = ['free', 'standard', 'premium', 'exclusive'] as const
const SERVICES = [
  { value: 'iv_therapy', label: 'IV Therapy' },
  { value: 'vitamin_iv', label: 'Vitamin IV' },
  { value: 'mobile_iv', label: 'Mobile IV' },
  { value: 'nad_plus', label: 'NAD+' },
  { value: 'chelation', label: 'Chelation' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'myers_cocktail', label: "Myers'" },
  { value: 'glutathione', label: 'Glutathione' },
  { value: 'hangover_iv', label: 'Hangover' },
  { value: 'immune_iv', label: 'Immune' },
  { value: 'hydration', label: 'Hydration' },
]
const CLINIC_TYPES = [
  { value: 'clinic', label: 'Clinic' },
  { value: 'mobile_only', label: 'Mobile' },
  { value: 'hybrid', label: 'Hybrid' },
]
const STATUSES = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'CLOSED_TEMPORARILY', label: 'Temp. Closed' },
  { value: 'CLOSED', label: 'Closed' },
]
const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan',
]

const PLAN_ACTIVE: Record<string, string> = {
  free: 'bg-gray-200 text-gray-700 border-gray-300',
  standard: 'bg-blue-100 text-blue-700 border-blue-300',
  premium: 'bg-purple-100 text-purple-700 border-purple-300',
  exclusive: 'bg-amber-100 text-amber-700 border-amber-300',
}

// ── Custom dropdown ───────────────────────────────────────────────────────────
function Dropdown({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs transition-colors whitespace-nowrap ${
          value
            ? 'border-[#1E1E2C] bg-[#1E1E2C] text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        {selected?.label ?? placeholder}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''} opacity-60`}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px] py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors ${!value ? 'text-gray-400' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {placeholder}
          </button>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                value === o.value
                  ? 'bg-[#1E1E2C] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {o.label}
              {value === o.value && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  total: number
  filtered: number
}

export function VendorFilterBar({ total, filtered }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const get = (key: string) => sp.get(key) ?? ''
  const getMulti = (key: string) => sp.get(key)?.split(',').filter(Boolean) ?? []

  const push = useCallback((updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(sp.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (!val || (Array.isArray(val) && val.length === 0)) {
        params.delete(key)
      } else {
        params.set(key, Array.isArray(val) ? val.join(',') : val)
      }
    }
    startTransition(() => router.push(`?${params.toString()}`))
  }, [router, sp])

  const toggleMulti = (key: string, value: string) => {
    const current = getMulti(key)
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    push({ [key]: next })
  }

  const hasFilters = ['search', 'province', 'city', 'plan', 'services', 'clinicType', 'status', 'verified', 'featured']
    .some(k => sp.has(k))

  const selectedPlans = getMulti('plan')
  const selectedServices = getMulti('services')

  return (
    <div className="bg-white border-b border-gray-200 flex-shrink-0">
      {/* Row 1: search + dropdowns + toggles + count */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search..."
            defaultValue={get('search')}
            onChange={e => push({ search: e.target.value || null })}
            className="border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-[#1E1E2C]/20"
          />
        </div>

        <Dropdown
          value={get('province')}
          placeholder="Province"
          options={PROVINCES.map(p => ({ value: p, label: p }))}
          onChange={v => push({ province: v || null, city: null })}
        />

        <input
          type="text"
          placeholder="City..."
          defaultValue={get('city')}
          onChange={e => push({ city: e.target.value || null })}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs w-24 focus:outline-none focus:ring-2 focus:ring-[#1E1E2C]/20"
        />

        <Dropdown
          value={get('clinicType')}
          placeholder="Type"
          options={CLINIC_TYPES}
          onChange={v => push({ clinicType: v || null })}
        />

        <Dropdown
          value={get('status')}
          placeholder="Status"
          options={STATUSES}
          onChange={v => push({ status: v || null })}
        />

        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={sp.get('verified') === '1'} onChange={e => push({ verified: e.target.checked ? '1' : null })} className="rounded w-3.5 h-3.5 accent-[#1E1E2C]" />
          Verified
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={sp.get('featured') === '1'} onChange={e => push({ featured: e.target.checked ? '1' : null })} className="rounded w-3.5 h-3.5 accent-[#1E1E2C]" />
          Featured
        </label>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 tabular-nums">
            {isPending ? '...' : `${filtered} / ${total}`}
          </span>
          {hasFilters && (
            <button onClick={() => startTransition(() => router.push('?'))} className="text-xs text-red-400 hover:text-red-600 font-medium">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Plan + Service chips */}
      <div className="px-3 pb-2.5 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Plan</span>
        {PLANS.map(p => (
          <button
            key={p}
            onClick={() => toggleMulti('plan', p)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
              selectedPlans.includes(p) ? PLAN_ACTIVE[p] : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Services</span>
        {SERVICES.map(s => (
          <button
            key={s.value}
            onClick={() => toggleMulti('services', s.value)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
              selectedServices.includes(s.value)
                ? 'bg-teal-50 text-teal-700 border-teal-300'
                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
