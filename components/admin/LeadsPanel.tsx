'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  serviceType: string | null
  city: string
  province: string | null
  message: string | null
  status: string
  createdAt: string
  vendor: { name: string; slug: string } | null
}

const STATUSES = ['new', 'pending', 'sent', 'converted', 'spam'] as const
type LeadStatus = typeof STATUSES[number]

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-gray-100 text-gray-600',
  converted: 'bg-green-100 text-green-700',
  spam: 'bg-red-100 text-red-600',
}

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
  hydration: 'Hydration IV',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
}

export function LeadsPanel({ leads }: { leads: Lead[] }) {
  const [selected, setSelected] = useState<string | null>(leads[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Local status overrides so UI updates instantly without page reload
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  function getStatus(lead: Lead) {
    return statusOverrides[lead.id] ?? lead.status
  }

  async function updateStatus(leadId: string, status: LeadStatus) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setStatusOverrides(prev => ({ ...prev, [leadId]: status }))
        router.refresh()
      }
    } finally {
      setUpdating(false)
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length }
    for (const l of leads) {
      const s = statusOverrides[l.id] ?? l.status
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [leads, statusOverrides])

  const filtered = useMemo(() => leads.filter(l => {
    if (statusFilter !== 'all' && getStatus(l) !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.vendor?.name ?? '').toLowerCase().includes(q)
      )
    }
    return true
  }), [leads, search, statusFilter])

  const selectedLead = leads.find(l => l.id === selected) ?? null

  if (leads.length === 0) {
    return <div className="text-center py-20 text-gray-400">No leads yet.</div>
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['all', 'new', 'sent', 'converted', 'spam'] as const).filter(s => (statusCounts[s] ?? 0) > 0).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
              statusFilter === s
                ? 'bg-[#1E1E2C] text-white'
                : s === 'all'
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : `${STATUS_COLORS[s]} opacity-80 hover:opacity-100`
            }`}
          >
            {s === 'all' ? `All (${statusCounts.all})` : `${s} (${statusCounts[s]})`}
          </button>
        ))}
      </div>

      {/* Master–detail */}
      <div className="flex gap-4 items-start">

        {/* LEFT: lead list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2.5 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#1E1E2C] focus:bg-white"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {filtered.map(l => {
              const isSelected = selected === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => setSelected(l.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? 'bg-[#1E1E2C]/5 border-l-2 border-[#1E1E2C]' : 'hover:bg-gray-50 border-l-2 border-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{l.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ml-2 ${STATUS_COLORS[getStatus(l)] ?? 'bg-gray-100 text-gray-500'}`}>
                      {getStatus(l)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{l.email}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span>{l.city}{l.province ? `, ${l.province}` : ''}</span>
                    {l.serviceType && <><span>·</span><span>{SERVICE_LABELS[l.serviceType] ?? l.serviceType}</span></>}
                  </div>
                  {l.message && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate italic">&ldquo;{l.message}&rdquo;</p>
                  )}
                  <p className="text-[9px] text-gray-300 mt-1">{fmtDate(l.createdAt)}</p>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No leads match.</p>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">{filtered.length} of {leads.length} leads</p>
          </div>
        </div>

        {/* RIGHT: detail */}
        {selectedLead ? (
          <div className="flex-1 min-w-0 space-y-4">

            {/* Status + meta row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Interactive status */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 sm:col-span-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      disabled={updating}
                      onClick={() => updateStatus(selectedLead.id, s)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize transition-all ${
                        getStatus(selectedLead) === s
                          ? STATUS_COLORS[s]
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'Service', value: selectedLead.serviceType ? (SERVICE_LABELS[selectedLead.serviceType] ?? selectedLead.serviceType) : 'Not specified' },
                { label: 'Location', value: `${selectedLead.city}${selectedLead.province ? `, ${selectedLead.province}` : ''}` },
                { label: 'Submitted', value: fmtDate(selectedLead.createdAt) },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Contact card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-4">Contact</p>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1E1E2C] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedLead.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                    <a href={`mailto:${selectedLead.email}`} className="text-sm font-medium text-[#1E1E2C] hover:underline break-all">{selectedLead.email}</a>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Phone</p>
                    {selectedLead.phone
                      ? <a href={`tel:${selectedLead.phone}`} className="text-sm font-medium text-[#1E1E2C] hover:underline">{selectedLead.phone}</a>
                      : <p className="text-sm text-gray-400">—</p>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor */}
            {selectedLead.vendor && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-3">
                <span className="text-lg">🏥</span>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Directed To</p>
                  <a href={`/vendors/${selectedLead.vendor.slug}`} className="text-sm font-bold text-[#1E1E2C] hover:underline" target="_blank" rel="noreferrer">
                    {selectedLead.vendor.name}
                  </a>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Message</p>
              {selectedLead.message ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedLead.message}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No message provided.</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
                <a
                  href={`mailto:${selectedLead.email}?subject=Your IV Therapy Inquiry`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#1E1E2C] px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Reply by Email
                </a>
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    Call
                  </a>
                )}
                <p className="text-[10px] text-gray-400 ml-auto">{fmtDate(selectedLead.createdAt)} at {fmtTime(selectedLead.createdAt)}</p>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-sm">
            Select a lead from the list.
          </div>
        )}
      </div>
    </div>
  )
}
