'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export interface VendorStat {
  vendorId: string
  vendorName: string
  vendorSlug: string | null
  views: number
  cardClicks: number
  phone: number
  web: number
  book: number
  directions: number
  quotes: number
  instagram: number
  email: number
}

type SortKey = 'views' | 'cardClicks' | 'leads'
type ViewMode = 'cards' | 'table'

export function VendorPerformancePanel({ vendors }: { vendors: VendorStat[] }) {
  const [view, setView] = useState<ViewMode>('cards')
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('views')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 9

  const processed = useMemo(() => {
    setPage(1)
    return vendors
      .filter(v => v.vendorName.toLowerCase().includes(filter.toLowerCase()))
      .map(v => ({ ...v, leads: v.phone + v.web + v.book + v.directions + v.quotes + v.instagram + v.email }))
      .sort((a, b) => {
        const av = sortKey === 'leads' ? a.leads : a[sortKey]
        const bv = sortKey === 'leads' ? b.leads : b[sortKey]
        return sortDir === 'desc' ? bv - av : av - bv
      })
  }, [vendors, filter, sortKey, sortDir])

  const totalPages = Math.ceil(processed.length / PAGE_SIZE)
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const maxViews = Math.max(1, ...processed.map(v => v.views))

  const rankColors = ['bg-amber-500', 'bg-gray-400', 'bg-orange-700']

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setView('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${view === 'cards' ? 'bg-[#1E1E2C] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
            Cards
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${view === 'table' ? 'bg-[#1E1E2C] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 10h18M3 14h18M10 4v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/></svg>
            Table
          </button>
        </div>

        {/* Filter */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          <input
            type="text"
            placeholder="Filter clinics..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1E1E2C]"
          />
        </div>

        {/* Sort key */}
        <div className="relative">
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="appearance-none text-xs pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1E1E2C] cursor-pointer font-medium text-gray-600"
          >
            <option value="views">Sort: Impressions</option>
            <option value="cardClicks">Sort: Clicks</option>
            <option value="leads">Sort: Leads</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </div>

        {/* Sort direction */}
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium text-gray-600"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          {sortDir === 'desc' ? 'High' : 'Low'}
        </button>
      </div>

      {processed.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-10">No vendors match your filter.</p>
      )}

      {/* Cards view */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((v, i) => {
            const barWidth = Math.max(4, Math.round((v.views / maxViews) * 100))
            const rankColor = rankColors[i] ?? 'bg-[#1E1E2C]'
            const barColor = i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-300' : 'bg-[#E8624A]'
            const viewToClickPct = v.views > 0 ? ((v.cardClicks / v.views) * 100).toFixed(1) : '0'
            const clickToLeadPct = v.cardClicks > 0 ? ((v.leads / v.cardClicks) * 100).toFixed(1) : '0'
            return (
              <div key={v.vendorId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gray-100">
                  <div className={`h-1 ${barColor} transition-all`} style={{ width: `${barWidth}%` }} />
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg ${rankColor} text-white text-xs font-bold flex items-center justify-center`}>
                      #{i + 1}
                    </span>
                    <p className="font-semibold text-gray-900 leading-snug min-w-0">
                      {v.vendorSlug
                        ? <Link href={`/vendors/${v.vendorSlug}`} className="hover:underline text-[#1E1E2C]">{v.vendorName}</Link>
                        : v.vendorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-center py-3 rounded-xl bg-gray-50 flex-1 flex flex-col justify-between h-16">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Seen</p>
                      <p className="text-xl font-bold text-gray-900 leading-none">{v.views}</p>
                      <p className="text-[9px] text-gray-400">impressions</p>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className="text-[9px] font-semibold text-gray-400">{viewToClickPct}%</span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </div>
                    <div className="text-center py-3 rounded-xl bg-orange-50 border border-orange-100 flex-1 flex flex-col justify-between h-16">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-orange-500">Clicked</p>
                      <p className="text-xl font-bold text-gray-900 leading-none">{v.cardClicks}</p>
                      <p className="text-[9px] text-gray-400">card clicks</p>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
                      <span className="text-[9px] font-semibold text-gray-400">{clickToLeadPct}%</span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                      <span className="text-[9px] text-gray-400 leading-tight text-center">
                        {[v.phone > 0 && `📞${v.phone}`, v.web > 0 && `🌐${v.web}`, v.instagram > 0 && `📸${v.instagram}`, v.email > 0 && `✉️${v.email}`, v.book > 0 && `📅${v.book}`, v.directions > 0 && `📍${v.directions}`, v.quotes > 0 && `📋${v.quotes}`].filter(Boolean).join(' ')}
                      </span>
                    </div>
                    <div className="text-center py-3 rounded-xl bg-green-50 border border-green-100 flex-1 flex flex-col justify-center h-16">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-green-600 mb-1">Leads</p>
                      <p className="text-xl font-bold text-gray-900 leading-none">{v.leads}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seen</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clicked</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">📞</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">🌐</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">📸</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">✉️</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">📅</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">📍</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">📋</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((v, i) => (
                  <tr key={v.vendorId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 font-semibold">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {v.vendorSlug
                        ? <Link href={`/vendors/${v.vendorSlug}`} className="hover:underline text-[#1E1E2C]">{v.vendorName}</Link>
                        : v.vendorName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{v.views}</td>
                    <td className="px-4 py-3 text-gray-700">{v.cardClicks}</td>
                    <td className="px-4 py-3 text-gray-700">{v.phone}</td>
                    <td className="px-4 py-3 text-gray-700">{v.web}</td>
                    <td className="px-4 py-3 text-gray-700">{v.instagram}</td>
                    <td className="px-4 py-3 text-gray-700">{v.email}</td>
                    <td className="px-4 py-3 text-gray-700">{v.book}</td>
                    <td className="px-4 py-3 text-gray-700">{v.directions}</td>
                    <td className="px-4 py-3 text-gray-700">{v.quotes}</td>
                    <td className="px-4 py-3"><span className={v.leads > 0 ? 'font-semibold text-green-700' : 'text-gray-400'}>{v.leads}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, processed.length)} of {processed.length} vendors
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${p === page ? 'bg-[#1E1E2C] text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
