'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Props {
  range: string
  tab: string
  fromDate: string
  toDate: string
}

export function AdminDateFilter({ range, tab, fromDate, toDate }: Props) {
  const [showCustom, setShowCustom] = useState(range === 'custom')
  const [from, setFrom] = useState(fromDate)
  const [to, setTo] = useState(toDate)
  const router = useRouter()

  const presets = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
  ]

  function applyCustom(e: React.FormEvent) {
    e.preventDefault()
    if (from && to) {
      router.push(`?range=custom&from=${from}&to=${to}&tab=${tab}`)
      setShowCustom(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map(r => (
        <Link
          key={r.value}
          href={`?range=${r.value}&tab=${tab}`}
          onClick={() => setShowCustom(false)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            range === r.value
              ? 'bg-[#1E1E2C] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {r.label}
        </Link>
      ))}

      {/* Custom toggle */}
      <button
        onClick={() => setShowCustom(o => !o)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
          range === 'custom'
            ? 'bg-[#1E1E2C] text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {range === 'custom' && from && to ? `${from} → ${to}` : 'Custom'}
      </button>

      {/* Custom date picker popover */}
      {showCustom && (
        <form
          onSubmit={applyCustom}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg"
        >
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={e => setFrom(e.target.value)}
            required
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#1E1E2C]"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={e => setTo(e.target.value)}
            required
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#1E1E2C]"
          />
          <button
            type="submit"
            className="bg-[#1E1E2C] text-white text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </form>
      )}
    </div>
  )
}
