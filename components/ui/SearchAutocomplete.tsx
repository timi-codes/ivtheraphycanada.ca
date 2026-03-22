'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { SearchResult } from '@/app/api/search/route'
import { track } from '@/lib/analytics'

const TYPE_ICON: Record<SearchResult['type'], string> = {
  city:     '📍',
  province: '🗺️',
  service:  '💉',
}

interface Props {
  size?: 'sm' | 'lg'
  placeholder?: string
  className?: string
}

export function SearchAutocomplete({ size = 'sm', placeholder = 'Search city, province or service...', className = '' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Position dropdown under the input on open
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
  }, [open, query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced fetch — fires at 200ms for responsive autocomplete
  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data); setOpen(true); setActive(-1)
        }
      } finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  // Only record search_query on explicit intent (dropdown pick or Search button).
  // Never track partial keystrokes — no debounce timer needed.

  const navigate = useCallback((result: SearchResult) => {
    track('search_query', {
      query: result.label,
      resultCount: results.length,
      hasResults: true,
    })
    track('search_result_click', {
      query: result.label,
      sourceType: result.type,
      city: result.type === 'city' ? result.label : undefined,
      province: result.type === 'province' ? result.label : undefined,
      service: result.type === 'service' ? result.label : undefined,
    })
    setOpen(false)
    setQuery('')
    router.push(result.href)
  }, [router, results.length])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (active >= 0 && results[active]) { navigate(results[active]); return }
    if (results[0]) { navigate(results[0]); return }
    // Free-text submit (no dropdown selection) — record what was typed
    if (query.trim()) {
      track('search_query', { query: query.trim(), resultCount: results.length, hasResults: results.length > 0 })
      router.push(`/vendors?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const isLg = size === 'lg'

  const dropdown = open && mounted && (results.length > 0 || (query.length >= 2 && !loading)) ? createPortal(
    <div style={dropdownStyle}>
      {results.length > 0 ? (
        <ul className="rounded-xl border border-gray-100 bg-white shadow-2xl overflow-hidden" role="listbox">
          {results.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === active}>
              <button
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${i === active ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={e => { e.preventDefault(); navigate(r) }}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{TYPE_ICON[r.type]}</span>
                <span className="flex-1 font-medium text-sm" style={{ color: '#1C1917' }}>{r.label}</span>
                {r.sublabel && <span className="text-xs" style={{ color: '#A8A29E' }}>{r.sublabel}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white shadow-2xl px-4 py-3 text-sm" style={{ color: '#78716C' }}>
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>,
    document.body
  ) : null

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex items-center rounded-full border-2 overflow-hidden transition-all duration-200 focus-within:border-[#1E1E2C] focus-within:shadow-[0_0_0_3px_rgba(30,30,44,.1)] bg-white ${isLg ? 'border-gray-200 shadow-sm' : ''}`}
        style={isLg ? undefined : { borderColor: '#E7E5E0' }}
      >
        <div className="flex items-center gap-2 flex-1 px-4">
          <svg className={`flex-shrink-0 ${isLg ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" style={{ color: '#A8A29E' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => results.length > 0 && setOpen(true)}
            autoComplete="off"
            className={`flex-1 bg-transparent focus:outline-none ${isLg ? 'text-base py-3' : 'text-sm py-2'}`}
            style={{ color: '#1C1917', fontFamily: 'var(--font-body)' }}
          />
          {loading && <span className="text-xs" style={{ color: '#A8A29E' }}>…</span>}
        </div>
        <button
          type="submit"
          className={`text-white font-bold rounded-full transition-colors cursor-pointer ${isLg ? 'text-sm px-6 py-2.5 m-1' : 'text-xs px-4 py-2 m-1'}`}
          style={{ background: '#1E1E2C', fontFamily: 'var(--font-display)' }}
        >
          Search
        </button>
      </form>

      {dropdown}
    </div>
  )
}
