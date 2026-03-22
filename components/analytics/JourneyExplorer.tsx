'use client'

import { useState } from 'react'

const HIGH_INTENT = ['phone_click', 'website_click', 'booking_click', 'directions_click', 'quote_submit']

const MEANINGFUL = new Set([
  'search_query',
  'search_result_click',
  'vendor_card_click',
  'page_view',
  'phone_click',
  'website_click',
  'booking_click',
  'directions_click',
  'quote_submit',
  'quote_form_open',
])

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Viewed vendor profile',
  vendor_card_click: 'Clicked vendor card',
  search_query: 'Searched',
  search_result_click: 'Clicked search result',
  phone_click: 'Called phone number',
  website_click: 'Visited website',
  booking_click: 'Clicked booking link',
  directions_click: 'Got directions',
  quote_submit: 'Submitted quote request',
  quote_form_open: 'Opened quote form',
}

const EVENT_ICON: Record<string, string> = {
  search_query: '🔍',
  search_result_click: '📄',
  vendor_card_click: '👁',
  page_view: '🏥',
  phone_click: '📞',
  website_click: '🌐',
  booking_click: '📅',
  directions_click: '📍',
  quote_submit: '📋',
  quote_form_open: '📋',
}

const ACTION_LABELS: Record<string, string> = {
  phone_click: '📞 PHONE',
  website_click: '🌐 WEBSITE',
  booking_click: '📅 BOOKING',
  directions_click: '📍 DIRECTIONS',
  quote_submit: '📋 QUOTE',
}

const ACTION_COLORS: Record<string, string> = {
  phone_click: 'bg-blue-100 text-blue-700',
  website_click: 'bg-sky-100 text-sky-700',
  booking_click: 'bg-purple-100 text-purple-700',
  directions_click: 'bg-orange-100 text-orange-700',
  quote_submit: 'bg-green-100 text-green-700',
}

export interface JourneyEvent {
  id: string
  event: string
  vendorName: string | null
  query: string | null
  city: string | null
  createdAt: string
}

export interface JourneySession {
  id: string
  entryMethod: string | null
  firstCity: string | null
  firstProvince: string | null
  winnerVendorName: string | null
  leadActionType: string | null
  hasLeadAction: boolean
  totalEvents: number
  vendorsViewed: number
  createdAt: string
  events: JourneyEvent[]
}

type DedupedEvent = JourneyEvent & { count: number }

function processTimeline(events: JourneyEvent[]): DedupedEvent[] {
  const meaningful = events.filter(e =>
    MEANINGFUL.has(e.event) && (e.event !== 'page_view' || e.vendorName)
  )
  const result: DedupedEvent[] = []
  for (const e of meaningful) {
    const last = result[result.length - 1]
    if (last && last.event === e.event && last.vendorName === e.vendorName && last.query === e.query) {
      last.count++
    } else {
      result.push({ ...e, count: 1 })
    }
  }
  return result
}

function buildPath(events: JourneyEvent[]): string[] {
  const path: string[] = []
  for (const e of events) {
    if (!MEANINGFUL.has(e.event)) continue
    if (e.event === 'page_view' && !e.vendorName) continue
    const icon = EVENT_ICON[e.event]
    if (icon && path[path.length - 1] !== icon) path.push(icon)
  }
  return path.slice(0, 6)
}

function fmtDuration(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`
  return `${(ms / 3_600_000).toFixed(1)}h`
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

const PAGE_SIZE = 20
type FilterKey = 'all' | 'search' | 'browse' | 'direct'

export function JourneyExplorer({ sessions }: { sessions: JourneySession[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selected, setSelected] = useState<string | null>(sessions[0]?.id ?? null)
  const [page, setPage] = useState(1)

  const searchCount = sessions.filter(s => s.entryMethod === 'search').length
  const browseCount = sessions.filter(s => s.entryMethod === 'browse').length
  const directCount = sessions.filter(s => !s.entryMethod || s.entryMethod === 'direct').length

  const filtered = sessions.filter(s => {
    if (filter === 'search') return s.entryMethod === 'search'
    if (filter === 'browse') return s.entryMethod === 'browse'
    if (filter === 'direct') return !s.entryMethod || s.entryMethod === 'direct'
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectedSession = sessions.find(s => s.id === selected) ?? null
  const timeline = selectedSession ? processTimeline(selectedSession.events) : []

  // Duration of selected session
  const selDuration = selectedSession && selectedSession.events.length >= 2
    ? fmtDuration(
        new Date(selectedSession.events[selectedSession.events.length - 1].createdAt).getTime() -
        new Date(selectedSession.events[0].createdAt).getTime()
      )
    : null

  // Summary stats
  const avgListingsViewed = sessions.length > 0
    ? (sessions.reduce((a, s) => a + (s.vendorsViewed ?? 0), 0) / sessions.length).toFixed(1)
    : '0'
  const comparingPct = sessions.length > 0
    ? Math.round((sessions.filter(s => (s.vendorsViewed ?? 0) >= 2).length / sessions.length) * 100)
    : 0
  const leadSessions = sessions.filter(s => s.hasLeadAction && s.events.length >= 2)
  const avgTimeToLead = leadSessions.length > 0
    ? (() => {
        const times = leadSessions
          .map(s => new Date(s.events[s.events.length - 1].createdAt).getTime() - new Date(s.events[0].createdAt).getTime())
          .filter(t => t > 0)
        return times.length > 0 ? fmtDuration(times.reduce((a, b) => a + b, 0) / times.length) : '—'
      })()
    : '—'

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `All (${sessions.length})` },
    { key: 'search', label: `Search (${searchCount})` },
    { key: 'browse', label: `Browse (${browseCount})` },
    { key: 'direct', label: `Direct (${directCount})` },
  ]

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: avgListingsViewed, label: 'Avg. vendors viewed', sub: 'per session' },
          { value: `${comparingPct}%`, label: 'Comparing 2+ clinics', sub: 'of all sessions' },
          { value: avgTimeToLead, label: 'Avg. time to lead', sub: 'for converting sessions' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-1">{s.label}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">Entry method:</span>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); setSelected(filtered[0]?.id ?? null) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.key
                ? 'bg-[#1E1E2C] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Master–detail layout */}
      <div className="flex gap-4 items-start">

        {/* LEFT: session list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sessions</p>
            <span className="text-xs text-gray-400">{filtered.length} total</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[560px] overflow-y-auto">
            {paginated.map(s => {
              const isSelected = selected === s.id
              const path = buildPath(s.events)
              const entryColor = s.entryMethod === 'search'
                ? 'bg-blue-100 text-blue-700'
                : s.entryMethod === 'browse'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
              const actionLabel = s.leadActionType ? ACTION_LABELS[s.leadActionType] : null
              const actionColor = s.leadActionType
                ? (ACTION_COLORS[s.leadActionType] ?? 'bg-green-100 text-green-700')
                : 'bg-green-100 text-green-700'

              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? 'bg-[#1E1E2C]/5 border-l-2 border-[#1E1E2C]' : 'hover:bg-gray-50 border-l-2 border-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${entryColor}`}>
                      {(s.entryMethod ?? 'direct').toUpperCase()}
                    </span>
                    {actionLabel && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${actionColor}`}>
                        {actionLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {s.firstCity ?? 'Unknown'}
                    {s.firstProvince && <span className="text-gray-400 font-normal text-xs ml-1">{s.firstProvince}</span>}
                  </p>
                  {s.winnerVendorName && (
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                      → <span className="font-medium">{s.winnerVendorName}</span>
                    </p>
                  )}
                  {path.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {path.map((icon, i) => (
                        <span key={i} className="text-xs leading-none">{icon}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 mt-1">{fmtDate(s.createdAt)} · {s.totalEvents} events</p>
                </button>
              )
            })}
            {paginated.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No sessions.</p>
            )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-[10px] text-gray-400">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: detail panel */}
        {selectedSession ? (
          <div className="flex-1 min-w-0 space-y-4">

            {/* Session metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Entry Method',
                  value: (selectedSession.entryMethod ?? 'direct').charAt(0).toUpperCase() + (selectedSession.entryMethod ?? 'direct').slice(1),
                  color: selectedSession.entryMethod === 'search' ? 'text-blue-700' : selectedSession.entryMethod === 'browse' ? 'text-purple-700' : 'text-gray-700',
                },
                {
                  label: 'Journey Duration',
                  value: selDuration ?? '< 1s',
                  color: 'text-gray-900',
                },
                {
                  label: 'Vendors Viewed',
                  value: String(selectedSession.vendorsViewed ?? 0),
                  color: 'text-gray-900',
                },
                {
                  label: 'Lead Action',
                  value: selectedSession.leadActionType ? (ACTION_LABELS[selectedSession.leadActionType] ?? selectedSession.leadActionType) : 'None',
                  color: selectedSession.hasLeadAction ? 'text-green-700' : 'text-gray-400',
                },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
                  <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Winner */}
            {selectedSession.winnerVendorName && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
                <span className="text-lg">🏆</span>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Winning Vendor</p>
                  <p className="text-sm font-bold text-[#1E1E2C]">{selectedSession.winnerVendorName}</p>
                </div>
                {selectedSession.leadActionType && ACTION_LABELS[selectedSession.leadActionType] && (
                  <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full ${ACTION_COLORS[selectedSession.leadActionType] ?? 'bg-green-100 text-green-700'}`}>
                    {ACTION_LABELS[selectedSession.leadActionType]}
                  </span>
                )}
              </div>
            )}

            {/* Full timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Full Journey</p>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400">No meaningful events recorded for this session.</p>
              ) : (
                <div className="relative">
                  {timeline.map((e, i) => {
                    const isAction = HIGH_INTENT.includes(e.event)
                    const isLast = i === timeline.length - 1
                    const label = EVENT_LABELS[e.event] ?? e.event.replace(/_/g, ' ')
                    return (
                      <div key={e.id} className="flex items-start gap-3 pb-4 relative">
                        {/* Connector line */}
                        {!isLast && (
                          <span className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-100" />
                        )}
                        {/* Dot */}
                        <span className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 border-2 z-10 flex items-center justify-center ${
                          isAction ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'
                        }`}>
                          {isAction && <span className="text-[7px] text-white font-bold">✓</span>}
                        </span>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium leading-tight ${isAction ? 'text-green-700' : 'text-gray-700'}`}>
                              {label}
                              {e.count > 1 && (
                                <span className="ml-1.5 bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  ×{e.count}
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-gray-300 flex-shrink-0 tabular-nums">{fmtTime(e.createdAt)}</span>
                          </div>
                          {e.vendorName && (
                            <p className="text-xs text-gray-400 mt-0.5">— {e.vendorName}</p>
                          )}
                          {e.query && (
                            <p className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{e.query}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-sm">
            Select a session from the list to view its journey.
          </div>
        )}
      </div>
    </div>
  )
}
