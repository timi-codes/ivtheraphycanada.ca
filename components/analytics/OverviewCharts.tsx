'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface DailyPoint {
  date: string
  phone: number
  website: number
  directions: number
  booking: number
  quotes: number
  instagram: number
  email: number
}

interface DiscoveryEntry { entryMethod: string | null; _count: number }
interface ReferrerEntry { referrerType: string | null; _count: number }

interface Props {
  dailyData: DailyPoint[]
  totalPhone: number
  totalWeb: number
  totalDirections: number
  totalBooking: number
  totalQuotes: number
  totalInstagram: number
  totalEmail: number
  totalSessions: number
  searches: number
  leadActions: number
  discoveryBreakdown: DiscoveryEntry[]
  referrerBreakdown: ReferrerEntry[]
  topSearches: { query: string | null; _count: number }[]
}

const COLORS = {
  phone: '#1E1E2C',
  website: '#0ea5e9',
  directions: '#E8624A',
  booking: '#8b5cf6',
  quotes: '#22c55e',
  instagram: '#e1306c',
  email: '#f59e0b',
}

function fmt(date: string) {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

const DISCOVERY_COLORS: Record<string, string> = {
  search: '#0ea5e9',
  browse: '#8b5cf6',
  direct: '#22c55e',
  unknown: '#d1d5db',
}

const REFERRER_COLORS: Record<string, string> = {
  google: '#0ea5e9',
  social: '#E8624A',
  direct: '#22c55e',
  other: '#d1d5db',
}

export function OverviewCharts({
  dailyData, totalPhone, totalWeb, totalDirections, totalBooking, totalQuotes, totalInstagram, totalEmail,
  totalSessions, searches, leadActions, discoveryBreakdown, referrerBreakdown, topSearches,
}: Props) {
  const totalLeadActions = totalPhone + totalWeb + totalDirections + totalBooking + totalQuotes + totalInstagram + totalEmail
  const searchToClickRate = searches > 0 ? Math.round((leadActions / searches) * 100) : 0
  const actionBreakdown = [
    { label: 'Phone', value: totalPhone, color: COLORS.phone, icon: '📞' },
    { label: 'Website', value: totalWeb, color: COLORS.website, icon: '🌐' },
    { label: 'Instagram', value: totalInstagram, color: COLORS.instagram, icon: '📸' },
    { label: 'Email', value: totalEmail, color: COLORS.email, icon: '✉️' },
    { label: 'Directions', value: totalDirections, color: COLORS.directions, icon: '📍' },
    { label: 'Booking', value: totalBooking, color: COLORS.booking, icon: '📅' },
    { label: 'Quotes', value: totalQuotes, color: COLORS.quotes, icon: '📋' },
  ].filter(a => a.value > 0)

  const maxAction = Math.max(1, ...actionBreakdown.map(a => a.value))

  const discoveryPie = discoveryBreakdown.map(d => ({
    name: d.entryMethod ?? 'direct',
    value: d._count,
    color: DISCOVERY_COLORS[d.entryMethod ?? 'direct'] ?? '#d1d5db',
  }))

  const referrerPie = referrerBreakdown.map(r => ({
    name: r.referrerType === 'google' ? 'Google' : r.referrerType === 'social' ? 'Social' : r.referrerType === 'direct' ? 'Direct' : 'Other',
    value: r._count,
    color: REFERRER_COLORS[r.referrerType ?? 'other'] ?? '#d1d5db',
  }))

  const card = 'bg-white rounded-2xl border border-gray-200 shadow-sm p-5'

  return (
    <div className="space-y-6">
      {/* Row 1: Line chart + Action Breakdown + Search-to-Click */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line chart */}
        <div className={`${card} lg:col-span-2`}>
          <h2 className="font-semibold text-gray-900 mb-0.5">Lead Actions Over Time</h2>
          <p className="text-xs text-gray-400 mb-5">Daily breakdown of phone calls, website visits, directions & bookings</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(COLORS).map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ReTooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                labelFormatter={(label: unknown) => typeof label === 'string' ? fmt(label) : String(label)}
              />
              <Area type="monotone" dataKey="website" name="Website" stroke={COLORS.website} fill={`url(#grad-website)`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="directions" name="Directions" stroke={COLORS.directions} fill={`url(#grad-directions)`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="phone" name="Phone" stroke={COLORS.phone} fill={`url(#grad-phone)`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="booking" name="Booking" stroke={COLORS.booking} fill={`url(#grad-booking)`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="quotes" name="Quotes" stroke={COLORS.quotes} fill={`url(#grad-quotes)`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="instagram" name="Instagram" stroke={COLORS.instagram} fill={`url(#grad-instagram)`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="email" name="Email" stroke={COLORS.email} fill={`url(#grad-email)`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Action breakdown + Search-to-click */}
        <div className="flex flex-col gap-4">
          <div className={card}>
            <h3 className="font-semibold text-gray-900 mb-4">Action Breakdown</h3>
            <div className="space-y-3">
              {actionBreakdown.length === 0 && <p className="text-xs text-gray-400">No actions yet.</p>}
              {actionBreakdown.map(a => (
                <div key={a.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0 whitespace-nowrap">{a.icon} {a.label}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-2 transition-all"
                      style={{ width: `${Math.max(8, Math.round((a.value / maxAction) * 100))}%`, background: a.color }}
                    >
                      <span className="text-white text-[10px] font-bold">{a.value}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{totalLeadActions > 0 ? Math.round((a.value / totalLeadActions) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} flex flex-col items-center justify-center`}>
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="#f0fdf4" strokeWidth="10" />
                <circle
                  cx="48" cy="48" r="38"
                  fill="none" stroke="#22c55e" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - searchToClickRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{searchToClickRate}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Search-to-Action Rate</p>
            <p className="text-[10px] text-gray-400 text-center mt-0.5">Searches that led to a lead action</p>
          </div>
        </div>
      </div>

      {/* Row 2: Discovery donut + Referrer donut + Top Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discovery donut */}
        <div className={card}>
          <h3 className="font-semibold text-gray-900 mb-1">How Users Find You</h3>
          <p className="text-xs text-gray-400 mb-4">Entry method breakdown</p>
          {discoveryPie.length === 0 ? (
            <p className="text-xs text-gray-400">No data yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={discoveryPie} cx="50%" cy="50%" innerRadius={30} outerRadius={46} paddingAngle={2} dataKey="value">
                    {discoveryPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {discoveryPie.map(d => {
                  const total = discoveryPie.reduce((s, x) => s + x.value, 0)
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                  return (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600 capitalize">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-semibold text-gray-900">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Referrer donut */}
        <div className={card}>
          <h3 className="font-semibold text-gray-900 mb-1">Traffic Sources</h3>
          <p className="text-xs text-gray-400 mb-4">Where visitors come from</p>
          {referrerPie.length === 0 ? (
            <p className="text-xs text-gray-400">No data yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={referrerPie} cx="50%" cy="50%" innerRadius={30} outerRadius={46} paddingAngle={2} dataKey="value">
                    {referrerPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {referrerPie.map(d => {
                  const total = referrerPie.reduce((s, x) => s + x.value, 0)
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                  return (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-semibold text-gray-900">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top searches */}
        <div className={card}>
          <h3 className="font-semibold text-gray-900 mb-1">Top Searches</h3>
          <p className="text-xs text-gray-400 mb-4">Most searched cities and services</p>
          <div className="space-y-2">
            {topSearches.slice(0, 8).map((s, i) => (
              <div key={s.query} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-4 text-right font-semibold">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-gray-800 font-medium truncate">{s.query}</span>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{s._count}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full">
                    <div className="h-1 bg-[#1E1E2C] rounded-full" style={{ width: `${Math.round((s._count / (topSearches[0]?._count ?? 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {topSearches.length === 0 && <p className="text-xs text-gray-400">No searches yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
