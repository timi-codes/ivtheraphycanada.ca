export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Tooltip } from '@/components/ui/Tooltip'
import { SERVICE_LABELS } from '@/lib/utils'
import { VendorPerformancePanel } from '@/components/analytics/VendorPerformancePanel'
import { OverviewCharts } from '@/components/analytics/OverviewCharts'
import { JourneyExplorer } from '@/components/analytics/JourneyExplorer'
import { HideGlobalNav } from '@/components/ui/HideGlobalNav'
import { AdminUserMenu } from '@/components/admin/AdminUserMenu'
import { AdminDateFilter } from '@/components/admin/AdminDateFilter'
import { LeadsPanel } from '@/components/admin/LeadsPanel'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

function getDates(range: string, fromParam?: string, toParam?: string) {
  const now = new Date()
  const start = new Date()
  if (range === 'custom' && fromParam && toParam) {
    return { start: new Date(fromParam + 'T00:00:00'), end: new Date(toParam + 'T23:59:59') }
  }
  if (range === 'today') start.setHours(0, 0, 0, 0)
  else if (range === 'yesterday') { start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0) }
  else if (range === '7d') start.setDate(start.getDate() - 7)
  else if (range === '30d') start.setDate(start.getDate() - 30)
  else start.setDate(start.getDate() - 7)
  return { start, end: now }
}

function getPrevDates(range: string) {
  const { start, end } = getDates(range)
  const diff = end.getTime() - start.getTime()
  return { start: new Date(start.getTime() - diff), end: start }
}

function pct(a: number, b: number) {
  if (b === 0) return '+100%'
  const diff = ((a - b) / b) * 100
  return (diff >= 0 ? '+' : '') + diff.toFixed(0) + '%'
}

const HIGH_INTENT = ['phone_click', 'website_click', 'booking_click', 'directions_click', 'quote_submit', 'email_click', 'instagram_click', 'facebook_click']

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string; tab?: string; from?: string; to?: string }> }) {
  const sp = await searchParams
  const range = sp.range ?? '7d'
  const tab = sp.tab ?? 'overview'
  const fromParam = sp.from ?? ''
  const toParam = sp.to ?? ''

  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email ?? '')) redirect('/login')
  const userEmail = session.user.email ?? ''

  const { start, end } = getDates(range, fromParam, toParam)
  const { start: pStart, end: pEnd } = getPrevDates(range)

  // ── Core counts ─────────────────────────────────────────────────────────────
  const [
    totalSessions, prevSessions,
    totalEvents, searches, prevSearches,
    leadActions, prevLeadActions,
    mobileCount, totalSessionsForMobile,
    zeroResultSearches,
  ] = await Promise.all([
    prisma.analyticsSession.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.analyticsSession.count({ where: { createdAt: { gte: pStart, lte: pEnd } } }),
    prisma.analyticsEvent.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: 'search_query', createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: 'search_query', createdAt: { gte: pStart, lte: pEnd } } }),
    prisma.analyticsEvent.count({ where: { event: { in: HIGH_INTENT }, createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: { in: HIGH_INTENT }, createdAt: { gte: pStart, lte: pEnd } } }),
    prisma.analyticsSession.count({ where: { deviceType: 'mobile', createdAt: { gte: start, lte: end } } }),
    prisma.analyticsSession.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: 'search_query', hasResults: false, createdAt: { gte: start, lte: end } } }),
  ])

  const leadActionRate = totalSessions > 0 ? ((leadActions / totalSessions) * 100).toFixed(1) : '0'
  const mobilePct = totalSessionsForMobile > 0 ? ((mobileCount / totalSessionsForMobile) * 100).toFixed(0) : '0'

  // ── Funnel ──────────────────────────────────────────────────────────────────
  const [funnelListingViews, funnelCardClicks, funnelProfileViews, funnelLeadActions, funnelQuotes] = await Promise.all([
    prisma.analyticsEvent.count({ where: { event: 'page_view', pageType: 'vendor_list', createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: 'vendor_card_click', createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: 'page_view', pageType: 'vendor_profile', createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: { in: ['phone_click', 'website_click', 'booking_click', 'directions_click', 'email_click', 'instagram_click', 'facebook_click'] }, createdAt: { gte: start, lte: end } } }),
    prisma.analyticsEvent.count({ where: { event: 'quote_submit', createdAt: { gte: start, lte: end } } }),
  ])

  // ── Discovery method ────────────────────────────────────────────────────────
  const discoveryBreakdown = await prisma.analyticsSession.groupBy({
    by: ['entryMethod'],
    where: { createdAt: { gte: start, lte: end } },
    _count: true,
  })

  // ── Referrer breakdown ──────────────────────────────────────────────────────
  const referrerBreakdown = await prisma.analyticsSession.groupBy({
    by: ['referrerType'],
    where: { createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { _count: { referrerType: 'desc' } },
  })

  // ── Top cities ──────────────────────────────────────────────────────────────
  const cityEventsRaw = await prisma.analyticsEvent.groupBy({
    by: ['city', 'province'],
    where: { city: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { _count: { city: 'desc' } },
    take: 50,
  })
  // Deduplicate by city name — merge counts, keep the province from the row with the most events
  const cityMap = new Map<string, { city: string; province: string | null; _count: number }>()
  for (const row of cityEventsRaw) {
    const key = row.city!
    const existing = cityMap.get(key)
    if (!existing) {
      cityMap.set(key, { city: key, province: row.province, _count: row._count })
    } else {
      const merged = existing._count + row._count
      cityMap.set(key, {
        city: key,
        province: existing.province ?? row.province,
        _count: merged,
      })
    }
  }
  const cityEvents = Array.from(cityMap.values())
    .sort((a, b) => b._count - a._count)
    .slice(0, 15)

  const cityActions = await prisma.analyticsEvent.groupBy({
    by: ['city'],
    where: { city: { not: null }, event: { in: HIGH_INTENT }, createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const cityActionMap = Object.fromEntries(cityActions.map(c => [c.city, c._count]))

  const citySessions = await prisma.analyticsSession.groupBy({
    by: ['firstCity'],
    where: { firstCity: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const citySessionMap = Object.fromEntries(citySessions.map(c => [c.firstCity, c._count]))

  // ── Top vendors ─────────────────────────────────────────────────────────────
  const vendorClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId', 'vendorName'],
    where: { vendorId: { not: null }, event: { in: [...HIGH_INTENT, 'vendor_card_click', 'page_view'] }, createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { _count: { vendorId: 'desc' } },
    take: 10,
  })

  const vendorCardClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'vendor_card_click', vendorId: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const cardClickMap = Object.fromEntries(vendorCardClicks.map(v => [v.vendorId, v._count]))

  const vendorPhoneClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'phone_click', createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const vendorWebClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: { in: ['website_click', 'facebook_click'] }, createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const vendorInstagramClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'instagram_click', createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const vendorEmailClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'email_click', createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const vendorBookClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'booking_click', createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const vendorDirectionsClicks = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'directions_click', createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const vendorQuotes = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'quote_submit', createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const phoneMap = Object.fromEntries(vendorPhoneClicks.map(v => [v.vendorId, v._count]))
  const webMap = Object.fromEntries(vendorWebClicks.map(v => [v.vendorId, v._count]))
  const instagramMap = Object.fromEntries(vendorInstagramClicks.map(v => [v.vendorId, v._count]))
  const emailMap = Object.fromEntries(vendorEmailClicks.map(v => [v.vendorId, v._count]))
  const bookMap = Object.fromEntries(vendorBookClicks.map(v => [v.vendorId, v._count]))
  const directionsMap = Object.fromEntries(vendorDirectionsClicks.map(v => [v.vendorId, v._count]))
  const quoteMap = Object.fromEntries(vendorQuotes.map(v => [v.vendorId, v._count]))

  // ── Top searches ────────────────────────────────────────────────────────────
  // Fetch more than needed so we can filter noise in JS
  const topSearchesRaw = await prisma.analyticsEvent.groupBy({
    by: ['query'],
    where: {
      event: 'search_query',
      query: { not: null },
      createdAt: { gte: start, lte: end },
    },
    _count: true,
    orderBy: { _count: { query: 'desc' } },
    take: 100,
  })
  // Remove partial keystrokes: drop any query that is a case-insensitive prefix of a longer query in the list
  const allQueryStrings = topSearchesRaw.map(s => (s.query ?? '').toLowerCase())
  const topSearches = topSearchesRaw
    .filter(s => {
      const q = (s.query ?? '').toLowerCase()
      if (q.length < 3) return false // too short to be meaningful
      // Drop if another query starts with this one (meaning this is a partial of something longer)
      return !allQueryStrings.some(other => other !== q && other.startsWith(q))
    })
    .slice(0, 20)

  // ── Zero-result searches ─────────────────────────────────────────────────────
  const zeroResultQueries = await prisma.analyticsEvent.groupBy({
    by: ['query'],
    where: { event: 'search_query', hasResults: false, query: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { _count: { query: 'desc' } },
    take: 10,
  })

  // ── Recent sessions (Journey Explorer) ──────────────────────────────────────
  const recentSessions = await prisma.analyticsSession.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { events: { orderBy: { createdAt: 'asc' } } },
  })
  // Serialize for client component (convert Dates to ISO strings)
  const journeySessions = recentSessions.map(s => ({
    id: s.id,
    entryMethod: s.entryMethod,
    firstCity: s.firstCity,
    firstProvince: s.firstProvince,
    winnerVendorName: s.winnerVendorName,
    leadActionType: s.leadActionType,
    hasLeadAction: s.hasLeadAction,
    totalEvents: s.totalEvents,
    vendorsViewed: s.vendorsViewed,
    createdAt: s.createdAt.toISOString(),
    events: s.events.map(e => ({
      id: e.id,
      event: e.event,
      vendorName: e.vendorName ?? null,
      query: e.query ?? null,
      city: e.city ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  }))

  // ── Sales intelligence ──────────────────────────────────────────────────────
  // Cities with demand but no paid vendor
  const highDemandCities = cityEvents
    .filter(c => c._count > 5)
    .map(c => c.city)
    .filter(Boolean) as string[]

  const paidVendorCities = highDemandCities.length > 0
    ? await prisma.vendor.findMany({
        where: { city: { in: highDemandCities }, plan: { in: ['standard', 'premium', 'exclusive'] } },
        select: { city: true },
        distinct: ['city'],
      })
    : []
  const paidCitySet = new Set(paidVendorCities.map(v => v.city))
  const opportunities = cityEvents.filter(c => c.city && !paidCitySet.has(c.city) && c._count > 5)

  // ── Shared styles ────────────────────────────────────────────────────────────
  const card = 'bg-white rounded-2xl border border-gray-200 p-5 shadow-sm'
  const th = 'text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide'
  const td = 'px-4 py-3 text-sm text-gray-700'


  // ── City Intelligence ─────────────────────────────────────────────────────
  const selectedCity = (sp as Record<string, string>).city ?? null
  const cityIntelData = selectedCity ? await Promise.all([
    prisma.analyticsSession.count({ where: { firstCity: selectedCity, createdAt: { gte: start, lte: end } } }),
    prisma.analyticsSession.groupBy({ by: ['entryMethod'], where: { firstCity: selectedCity, createdAt: { gte: start, lte: end } }, _count: true }),
    prisma.analyticsEvent.groupBy({ by: ['query'], where: { city: selectedCity, event: 'search_query', query: { not: null }, createdAt: { gte: start, lte: end } }, _count: true, orderBy: { _count: { query: 'desc' } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ['vendorId', 'vendorName'], where: { city: selectedCity, event: { in: HIGH_INTENT }, vendorId: { not: null }, createdAt: { gte: start, lte: end } }, _count: true, orderBy: { _count: { vendorId: 'desc' } }, take: 8 }),
    prisma.analyticsEvent.count({ where: { city: selectedCity, event: { in: HIGH_INTENT }, createdAt: { gte: start, lte: end } } }),
  ]) : null

  // ── Vendor Performance ────────────────────────────────────────────────────
  const allVendorStatsRaw = await prisma.analyticsEvent.groupBy({
    by: ['vendorId', 'vendorName', 'vendorSlug'],
    where: { vendorId: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { _count: { vendorId: 'desc' } },
    take: 100,
  })
  // Deduplicate by vendorId — merge counts, keep the non-null name/slug
  const vendorStatMap = new Map<string, { vendorId: string; vendorName: string | null; vendorSlug: string | null; _count: number }>()
  for (const row of allVendorStatsRaw) {
    const key = row.vendorId!
    const existing = vendorStatMap.get(key)
    if (!existing) {
      vendorStatMap.set(key, { vendorId: key, vendorName: row.vendorName, vendorSlug: row.vendorSlug, _count: row._count })
    } else {
      vendorStatMap.set(key, {
        vendorId: key,
        vendorName: existing.vendorName ?? row.vendorName,
        vendorSlug: existing.vendorSlug ?? row.vendorSlug,
        _count: existing._count + row._count,
      })
    }
  }
  const allVendorStats = Array.from(vendorStatMap.values())
    .sort((a, b) => b._count - a._count)
    .slice(0, 20)
  const vendorProfileViews = await prisma.analyticsEvent.groupBy({
    by: ['vendorId'],
    where: { event: 'page_view', pageType: 'vendor_profile', vendorId: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
  })
  const profileViewMap = Object.fromEntries(vendorProfileViews.map(v => [v.vendorId, v._count]))

  // ── Daily time-series for charts ─────────────────────────────────────────
  const dailyRaw = await prisma.analyticsEvent.findMany({
    where: {
      event: { in: ['phone_click', 'website_click', 'directions_click', 'booking_click', 'quote_submit', 'email_click', 'instagram_click', 'facebook_click'] },
      createdAt: { gte: start, lte: end },
    },
    select: { event: true, createdAt: true },
  })
  // Group by date string
  const dailyMap: Record<string, { date: string; phone: number; website: number; directions: number; booking: number; quotes: number; instagram: number; email: number }> = {}
  for (const e of dailyRaw) {
    const date = e.createdAt.toISOString().slice(0, 10)
    if (!dailyMap[date]) dailyMap[date] = { date, phone: 0, website: 0, directions: 0, booking: 0, quotes: 0, instagram: 0, email: 0 }
    if (e.event === 'phone_click') dailyMap[date].phone++
    else if (e.event === 'website_click' || e.event === 'facebook_click') dailyMap[date].website++
    else if (e.event === 'directions_click') dailyMap[date].directions++
    else if (e.event === 'booking_click') dailyMap[date].booking++
    else if (e.event === 'quote_submit') dailyMap[date].quotes++
    else if (e.event === 'instagram_click') dailyMap[date].instagram++
    else if (e.event === 'email_click') dailyMap[date].email++
  }
  // Fill in all days in range with zeros
  const dailyData: typeof dailyMap[string][] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    dailyData.push(dailyMap[key] ?? { date: key, phone: 0, website: 0, directions: 0, booking: 0, quotes: 0, instagram: 0, email: 0 })
  }

  // ── Leads ─────────────────────────────────────────────────────────────────
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    include: { vendor: { select: { name: true, slug: true } } },
  })

  // ── Competitive Market signals ─────────────────────────────────────────────
  // Sessions that viewed 3+ different vendors
  const competitiveSessions = await prisma.analyticsSession.findMany({
    where: { vendorsViewed: { gte: 3 }, createdAt: { gte: start, lte: end } },
    select: { firstCity: true, firstProvince: true, vendorsViewed: true, winnerVendorName: true, leadActionType: true },
    orderBy: { vendorsViewed: 'desc' },
    take: 100,
  })
  const competitiveCities = competitiveSessions.reduce((acc, s) => {
    const key = s.firstCity ?? 'Unknown'
    if (!acc[key]) acc[key] = { city: s.firstCity, province: s.firstProvince, sessions: 0, avgVendors: 0, total: 0 }
    acc[key].sessions++
    acc[key].total += s.vendorsViewed
    return acc
  }, {} as Record<string, { city: string | null; province: string | null; sessions: number; avgVendors: number; total: number }>)
  Object.values(competitiveCities).forEach(c => { c.avgVendors = Math.round(c.total / c.sessions) })
  const competitiveCityList = Object.values(competitiveCities).sort((a, b) => b.sessions - a.sessions).slice(0, 10)

  // Service query distribution
  const serviceQueries = await prisma.analyticsEvent.groupBy({
    by: ['service'],
    where: { service: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { _count: { service: 'desc' } },
  })

  // Most searched cities with no city page
  const cityQueries = await prisma.analyticsEvent.groupBy({
    by: ['city'],
    where: { event: 'search_result_click', sourceType: 'city', city: { not: null }, createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { _count: { city: 'desc' } },
    take: 20,
  })
  const existingCitySlugs = await prisma.city.findMany({ select: { name: true } })
  const existingCityNames = new Set(existingCitySlugs.map(c => c.name.toLowerCase()))
  const citiesNeedingPages = cityQueries.filter(c => c.city && !existingCityNames.has(c.city.toLowerCase()))

  const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Journey Explorer', value: 'journeys' },
    { label: 'Search Intelligence', value: 'search' },
    { label: 'Funnel', value: 'funnel' },
    { label: 'City Intelligence', value: 'city' },
    { label: 'Vendor Performance', value: 'vendors' },
    { label: 'Competitive', value: 'competitive' },
    { label: 'Sales Opportunities', value: 'sales' },
    { label: 'Leads', value: 'leads' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <HideGlobalNav />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-xs text-gray-400">ivtherapycanada.ca · Admin</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date range filter */}
            <AdminDateFilter range={range} tab={tab} fromDate={fromParam} toDate={toParam} />
            {/* User menu */}
            <AdminUserMenu email={userEmail} />
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto flex gap-1 mt-3 overflow-x-auto">
          {tabs.map(t => (
            <Link
              key={t.value}
              href={`?range=${range}&tab=${t.value}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t.value ? 'bg-[#1E1E2C] text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'Sessions', value: totalSessions, prev: prevSessions, tip: "One session = one person's visit to your site, from their first page to their last click. Repeat visits by the same person count as separate sessions." },
                { label: 'Searches', value: searches, prev: prevSearches, tip: 'How many times visitors typed something into your search bar. High search volume means people are actively looking for providers — your SEO is attracting the right audience.' },
                { label: 'Lead Actions', value: leadActions, prev: prevLeadActions, tip: 'High-value clicks: phone calls, website visits, booking clicks, directions, and quote requests. These are the actions that drive revenue — each one is a potential new client for a vendor.' },
                { label: 'Action Rate', value: `${leadActionRate}%`, prev: null, tip: 'Percentage of sessions where a visitor took at least one lead action. A higher rate means your listings are converting visitors into real patient inquiries. 10–20% is a strong benchmark for a directory like this.' },
                { label: 'Mobile %', value: `${mobilePct}%`, prev: null, tip: 'Share of visitors browsing on a phone. Most IV therapy searches happen on mobile — if this is above 60% (typical), mobile UX and fast load times are critical.' },
                { label: 'Zero-result Searches', value: zeroResultSearches, prev: null, tip: 'Searches where no providers matched. Each zero-result search is a gap in your directory — a city or service people want but you don\'t have yet. Use the Search Intelligence tab to see the exact queries.' },
              ].map(s => (
                <div key={s.label} className={card}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center">{s.label}<Tooltip text={s.tip} /></p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  {s.prev !== null && (
                    <p className={`text-xs mt-1 ${Number(s.value) >= s.prev ? 'text-green-600' : 'text-red-500'}`}>
                      {pct(Number(s.value), s.prev)} vs prior period
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Discovery method + Referrer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={card}>
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">Discovery Method<Tooltip text="How visitors first found your site. Search = typed a city or service into your search bar. Browse = clicked a city or province link. Direct = typed the URL or used a bookmark. More 'search' entries means your internal search is the main entry point." /></h2>
                <div className="space-y-3">
                  {discoveryBreakdown.map(d => {
                    const pctVal = totalSessions > 0 ? Math.round((d._count / totalSessions) * 100) : 0
                    return (
                      <div key={d.entryMethod ?? 'unknown'}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize">{d.entryMethod ?? 'direct'}</span>
                          <span className="font-semibold text-gray-900">{d._count} <span className="text-gray-400 font-normal">({pctVal}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100">
                          <div className="h-1.5 rounded-full bg-[#1E1E2C]" style={{ width: `${pctVal}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={card}>
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">Referrer Intelligence<Tooltip text="Where visitors came from before landing on your site. Google = your SEO is working and ranking pages in search results. Direct = people already know your brand and typed your URL. Social = traffic from Instagram, Facebook, etc." /></h2>
                <div className="space-y-3">
                  {referrerBreakdown.map(r => {
                    const pctVal = totalSessions > 0 ? Math.round((r._count / totalSessions) * 100) : 0
                    const color = r.referrerType === 'google' ? 'bg-blue-500' : r.referrerType === 'social' ? 'bg-pink-500' : r.referrerType === 'direct' ? 'bg-green-500' : 'bg-gray-400'
                    return (
                      <div key={r.referrerType ?? 'unknown'}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${color}`} />
                            {r.referrerType === 'google' ? '🔍 Google / Search Engine' : r.referrerType === 'social' ? '📱 Social Media' : r.referrerType === 'direct' ? '🔗 Direct' : '🌐 Other'}
                          </span>
                          <span className="font-semibold text-gray-900">{r._count} ({pctVal}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100">
                          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-4">Google traffic = SEO working · Direct = brand awareness · Social = social traffic</p>
              </div>
            </div>

            {/* Charts */}
            <OverviewCharts
              dailyData={dailyData}
              totalPhone={(Object.values(phoneMap) as number[]).reduce((a, b) => a + b, 0)}
              totalWeb={(Object.values(webMap) as number[]).reduce((a, b) => a + b, 0)}
              totalDirections={(Object.values(directionsMap) as number[]).reduce((a, b) => a + b, 0)}
              totalBooking={(Object.values(bookMap) as number[]).reduce((a, b) => a + b, 0)}
              totalQuotes={(Object.values(quoteMap) as number[]).reduce((a, b) => a + b, 0)}
              totalInstagram={(Object.values(instagramMap) as number[]).reduce((a, b) => a + b, 0)}
              totalEmail={(Object.values(emailMap) as number[]).reduce((a, b) => a + b, 0)}
              totalSessions={totalSessions}
              searches={searches}
              leadActions={leadActions}
              discoveryBreakdown={discoveryBreakdown}
              referrerBreakdown={referrerBreakdown}
              topSearches={topSearches}
            />

            {/* Top Cities */}
            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center">Top Cities by Demand<Tooltip text="Cities generating the most traffic on your directory. Use this to decide where to focus your vendor outreach — high-traffic cities with low lead actions are your best sales targets." /></h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className={th}>City</th>
                    <th className={th}><span className="flex items-center gap-1">Sessions<Tooltip text="Visitors who started their journey searching in or browsing this city." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">Events<Tooltip text="Total tracked actions (page views, searches, clicks) by users interested in this city." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">Lead Actions<Tooltip text="High-intent clicks (phone, website, booking, directions) by visitors in this city. This is your revenue signal." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">Action Rate<Tooltip text="Percentage of this city's sessions that resulted in a lead action. Low rate in a high-traffic city = opportunity to add better vendors or improve listings." /></span></th>
                    <th className={th}>Bar</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {cityEvents.map(c => {
                      const sessions = citySessionMap[c.city ?? ''] ?? 0
                      const actions = cityActionMap[c.city ?? ''] ?? 0
                      const rate = sessions > 0 ? ((actions / sessions) * 100).toFixed(0) : '0'
                      const maxEvents = cityEvents[0]?._count ?? 1
                      return (
                        <tr key={c.city} className="hover:bg-gray-50">
                          <td className={`${td} font-medium text-gray-900`}>{c.city}<span className="text-gray-400 font-normal ml-1 text-xs">{c.province}</span></td>
                          <td className={td}>{sessions}</td>
                          <td className={td}>{c._count}</td>
                          <td className={td}><span className={actions > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'}>{actions}</span></td>
                          <td className={td}>{rate}%</td>
                          <td className={`${td} w-32`}>
                            <div className="h-1.5 rounded-full bg-gray-100">
                              <div className="h-1.5 rounded-full bg-[#E8624A]" style={{ width: `${Math.round((c._count / maxEvents) * 100)}%` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Vendors */}
            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center">Top Vendors by Engagement<Tooltip text="Vendors generating the most activity on your site. High engagement with low lead actions means the vendor's profile may need improvement. Use these numbers when pitching paid plan upgrades." /></h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className={th}>Vendor</th>
                    <th className={th}><span className="flex items-center gap-1">Total Events<Tooltip text="All tracked interactions with this vendor: card clicks, profile views, and CTA clicks combined." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">📞 Phone<Tooltip text="Times a visitor clicked the phone number on this vendor's profile. Each click = a potential new patient call." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">🌐 Website<Tooltip text="Times a visitor clicked through to this vendor's own website from their profile." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">📅 Booking<Tooltip text="Times a visitor clicked the online booking link on this vendor's profile." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">📋 Quotes<Tooltip text="Quote request forms submitted that were associated with this vendor's city or profile." /></span></th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {vendorClicks.map(v => (
                      <tr key={v.vendorId} className="hover:bg-gray-50">
                        <td className={`${td} font-medium text-gray-900`}>{v.vendorName ?? '—'}</td>
                        <td className={td}>{v._count}</td>
                        <td className={td}>{phoneMap[v.vendorId ?? ''] ?? 0}</td>
                        <td className={td}>{webMap[v.vendorId ?? ''] ?? 0}</td>
                        <td className={td}>{bookMap[v.vendorId ?? ''] ?? 0}</td>
                        <td className={td}>{quoteMap[v.vendorId ?? ''] ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── JOURNEY EXPLORER ─────────────────────────────────────────────── */}
        {tab === 'journeys' && (
          <JourneyExplorer sessions={journeySessions} />
        )}

        {/* ── SEARCH INTELLIGENCE ──────────────────────────────────────────── */}
        {tab === 'search' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center">Top Search Queries<Tooltip text="The exact words visitors typed into your search bar. Use this list to identify high-demand services or cities you should add more vendors for, and as keyword ideas for your blog content." /></h2>
              <p className="text-xs text-gray-400 mb-4">What users are looking for</p>
              <div className="space-y-2">
                {topSearches.map((s, i) => (
                  <div key={s.query} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-900 font-medium">{s.query}</span>
                        <span className="text-gray-500">{s._count}×</span>
                      </div>
                      <div className="h-1 rounded-full bg-gray-100">
                        <div className="h-1 rounded-full bg-[#1E1E2C]" style={{ width: `${Math.round((s._count / (topSearches[0]?._count ?? 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {topSearches.length === 0 && <p className="text-gray-400 text-sm">No searches yet.</p>}
              </div>
            </div>

            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center">Zero-Result Searches<Tooltip text="Searches where your directory returned no providers. Each entry is a content gap — a city or service people want that you haven't covered yet. Adding vendors or city pages for these queries can directly recover lost traffic." /></h2>
              <p className="text-xs text-gray-400 mb-4">Queries with no matches → content & listing gaps</p>
              <div className="space-y-2">
                {zeroResultQueries.map(s => (
                  <div key={s.query} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-900">&ldquo;{s.query}&rdquo;</span>
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{s._count} searches</span>
                  </div>
                ))}
                {zeroResultQueries.length === 0 && <p className="text-green-600 text-sm">No zero-result searches. 🎉</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── FUNNEL ───────────────────────────────────────────────────────── */}
        {tab === 'funnel' && (
          <div className={card}>
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center">Conversion Funnel<Tooltip text="Shows how visitors move from landing on your site to becoming a lead. Each step is narrower than the last — large drops between steps reveal where to focus your improvements." /></h2>
            <p className="text-xs text-gray-400 mb-6">Where users drop off from session to conversion</p>
            <div className="space-y-4 max-w-xl">
              {[
                { label: 'Sessions', value: totalSessions, color: 'bg-[#1E1E2C]', desc: 'Total visits', tip: 'Every visitor who landed on your site — the top of your funnel.' },
                { label: 'Listing Page Views', value: funnelListingViews, color: 'bg-blue-500', desc: 'Reach — viewed vendor list', tip: 'Visitors who reached the /vendors directory page — they\'re actively looking for a provider.' },
                { label: 'Vendor Card Clicks', value: funnelCardClicks, color: 'bg-indigo-500', desc: 'Interest — clicked a listing card', tip: 'Visitors who clicked on a specific vendor card — showing real interest in a provider.' },
                { label: 'Profile Page Views', value: funnelProfileViews, color: 'bg-purple-500', desc: 'Consideration — opened a vendor profile', tip: 'Visitors who opened a full vendor profile — they\'re seriously considering this provider.' },
                { label: 'Lead Actions', value: funnelLeadActions, color: 'bg-orange-500', desc: 'Intent — phone/website/booking/directions click', tip: 'Visitors who took a high-intent action: clicked a phone number, website, booking link, or directions. These are near-certain leads.' },
                { label: 'Quote Submitted', value: funnelQuotes, color: 'bg-green-500', desc: 'Conversion — submitted a quote form', tip: 'Visitors who filled out and submitted your quote request form — your highest-value conversion and a direct revenue signal.' },
              ].map((step, i, arr) => {
                const prev = arr[i - 1]?.value ?? step.value
                const dropPct = prev > 0 ? (100 - Math.round((step.value / prev) * 100)) : 0
                const barWidth = totalSessions > 0 ? Math.max(2, Math.round((step.value / totalSessions) * 100)) : 0
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 flex items-center">{step.label}<Tooltip text={step.tip} /></span>
                      <span className="text-sm font-bold text-gray-900">{step.value.toLocaleString()}</span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div className={`h-full ${step.color} rounded-lg transition-all flex items-center px-3`} style={{ width: `${barWidth}%` }}>
                        {barWidth > 15 && <span className="text-white text-xs font-semibold">{step.desc}</span>}
                      </div>
                    </div>
                    {i > 0 && dropPct > 0 && (
                      <p className="text-xs text-red-500 mt-1">↓ {dropPct}% drop-off from previous step</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CITY INTELLIGENCE ────────────────────────────────────────────── */}
        {tab === 'city' && (
          <div className="space-y-6">
            {/* City selector */}
            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-0.5">Select a City to Analyse</h2>
              <p className="text-xs text-gray-400 mb-3">Numbers show total analytics events (page views, searches, clicks) from visitors in each city during the selected period.</p>
              <div className="flex flex-wrap gap-2">
                {cityEvents.slice(0, 20).map(c => (
                  <Link
                    key={c.city}
                    href={`?range=${range}&tab=city&city=${encodeURIComponent(c.city ?? '')}`}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedCity === c.city ? 'bg-[#1E1E2C] text-white border-[#1E1E2C]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#1E1E2C]'}`}
                  >
                    {c.city} <span className="opacity-60">({c._count} events)</span>
                  </Link>
                ))}
              </div>
            </div>

            {selectedCity && cityIntelData && (() => {
              const [citySess, cityDisc, citySearches, cityTopVendors, cityActions] = cityIntelData
              const cityActionRate = citySess > 0 ? ((cityActions / citySess) * 100).toFixed(1) : '0'
              return (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Sessions', value: citySess, tip: `Unique visitors who started their session looking for IV therapy in ${selectedCity}.` },
                      { label: 'Lead Actions', value: cityActions, tip: `High-intent clicks (phone, website, booking, directions) from visitors in ${selectedCity}. This is the demand signal for this market.` },
                      { label: 'Action Rate', value: `${cityActionRate}%`, tip: `Percentage of ${selectedCity} sessions that converted to a lead action. Compare this to your overall Action Rate — gaps show where listings need work.` },
                    ].map(s => (
                      <div key={s.label} className={card}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center">{s.label}<Tooltip text={s.tip} /></p>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={card}>
                      <h3 className="font-semibold text-gray-900 mb-3">How Users Find {selectedCity}</h3>
                      {cityDisc.map(d => (
                        <div key={d.entryMethod ?? 'direct'} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                          <span className="text-gray-700 capitalize">{d.entryMethod ?? 'direct'}</span>
                          <span className="font-semibold">{d._count}</span>
                        </div>
                      ))}
                    </div>

                    <div className={card}>
                      <h3 className="font-semibold text-gray-900 mb-3">Top Searches in {selectedCity}</h3>
                      {citySearches.map(s => (
                        <div key={s.query} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                          <span className="text-gray-700">&ldquo;{s.query}&rdquo;</span>
                          <span className="font-semibold">{s._count}×</span>
                        </div>
                      ))}
                      {citySearches.length === 0 && <p className="text-gray-400 text-sm">No searches yet for this city.</p>}
                    </div>
                  </div>

                  <div className={card}>
                    <h3 className="font-semibold text-gray-900 mb-3">Top Vendors by Lead Actions in {selectedCity}</h3>
                    <div className="space-y-2">
                      {cityTopVendors.map((v, i) => (
                        <div key={v.vendorId} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                          <div className="flex-1 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">{v.vendorName}</span>
                            <span className="text-xs font-bold text-[#E8624A] bg-orange-50 px-2 py-0.5 rounded-full">{v._count} actions</span>
                          </div>
                        </div>
                      ))}
                      {cityTopVendors.length === 0 && <p className="text-gray-400 text-sm">No lead actions recorded yet for {selectedCity}.</p>}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* ── VENDOR PERFORMANCE ───────────────────────────────────────────── */}
        {tab === 'vendors' && (
          <div>
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 flex items-center">Vendor Performance<Tooltip text="How each listed vendor is performing on your directory. Use these numbers when calling vendors to pitch an upgrade — telling a free vendor they got 47 profile views and 8 phone clicks is a powerful sales tool." /></h2>
              <p className="text-xs text-gray-400 mt-0.5">Use this data when pitching paid plans — show vendors their own numbers</p>
            </div>
            <VendorPerformancePanel vendors={allVendorStats.filter(v => v.vendorName).map(v => ({
              vendorId: v.vendorId,
              vendorName: v.vendorName!,
              vendorSlug: v.vendorSlug,
              views: profileViewMap[v.vendorId] ?? 0,
              cardClicks: cardClickMap[v.vendorId] ?? 0,
              phone: phoneMap[v.vendorId] ?? 0,
              web: webMap[v.vendorId] ?? 0,
              instagram: instagramMap[v.vendorId] ?? 0,
              email: emailMap[v.vendorId] ?? 0,
              book: bookMap[v.vendorId] ?? 0,
              directions: directionsMap[v.vendorId] ?? 0,
              quotes: quoteMap[v.vendorId] ?? 0,
            }))} />
          </div>
        )}

        {/* ── COMPETITIVE / MARKET ─────────────────────────────────────────── */}
        {tab === 'competitive' && (
          <div className="space-y-6">
            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center">🏆 Competitive Markets<Tooltip text="Cities where visitors compared 3 or more vendor profiles before acting. This tells you where the market is busy — vendors in these cities are most likely to pay for an Exclusive plan to lock out competitors." /></h2>
              <p className="text-xs text-gray-400 mb-4">Cities where users viewed 3+ vendor profiles — high competition signal. Pitch Exclusive plan here.</p>
              {competitiveCityList.length === 0 ? (
                <p className="text-gray-400 text-sm">Not enough data yet — needs more sessions with multiple vendor views.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className={th}>City</th>
                    <th className={th}>Province</th>
                    <th className={th}><span className="flex items-center gap-1">Sessions Comparing<Tooltip text="Number of visitors in this city who opened 3 or more vendor profiles in a single session — they were actively shopping around." /></span></th>
                    <th className={th}><span className="flex items-center gap-1">Avg Vendors Viewed<Tooltip text="On average, how many vendor profiles each comparing visitor looked at. Higher numbers = harder decision = more valuable to be the top-ranked listing." /></span></th>
                    <th className={th}>Signal</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {competitiveCityList.map(c => (
                      <tr key={c.city} className="hover:bg-gray-50">
                        <td className={`${td} font-semibold`}>{c.city}</td>
                        <td className={td}>{c.province}</td>
                        <td className={td}>{c.sessions}</td>
                        <td className={td}>{c.avgVendors}</td>
                        <td className={td}><span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">EXCLUSIVE UPSELL</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center">💉 Service Demand Distribution<Tooltip text="Which IV therapy treatments visitors are searching and filtering for. Use this to prioritise which services to highlight in your directory — and which service pages to build next for SEO." /></h2>
              <p className="text-xs text-gray-400 mb-4">Which treatments users are actually looking for</p>
              <div className="space-y-3">
                {serviceQueries.filter(s => s.service).map(s => {
                  const max = serviceQueries[0]?._count ?? 1
                  const pctVal = Math.round((s._count / max) * 100)
                  return (
                    <div key={s.service}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-900 font-medium capitalize">{s.service?.replace(/_/g, ' ')}</span>
                        <span className="text-gray-500">{s._count} events</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-[#E8624A]" style={{ width: `${pctVal}%` }} />
                      </div>
                    </div>
                  )
                })}
                {serviceQueries.length === 0 && <p className="text-gray-400 text-sm">No service data yet.</p>}
              </div>
            </div>

            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center">🗺️ Cities Searched With No City Page<Tooltip text="Users searched for these cities but your directory has no dedicated landing page for them. Creating city pages (e.g. /ontario/london) for these locations can capture that organic search traffic from Google." /></h2>
              <p className="text-xs text-gray-400 mb-4">Users searched for these cities but no dedicated page exists — create these pages to capture the traffic</p>
              {citiesNeedingPages.length === 0 ? (
                <p className="text-green-600 text-sm">All searched cities have pages. 🎉</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {citiesNeedingPages.map(c => (
                    <span key={c.city} className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-800 font-medium">
                      {c.city} <span className="opacity-60">({c._count} searches)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SALES OPPORTUNITIES ──────────────────────────────────────────── */}
        {tab === 'sales' && (
          <div className="space-y-6">
            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center">🎯 High Demand — No Paid Vendor<Tooltip text="Cities where real visitors are searching for IV therapy, but every vendor listed is on the free plan. These are your easiest sales calls — you have proof of existing demand to show them." /></h2>
              <p className="text-xs text-gray-400 mb-4">Cities with real traffic but only free listings — pitch a paid plan here</p>
              {opportunities.length === 0 ? (
                <p className="text-gray-400 text-sm">No uncontested cities found in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">
                      <th className={th}>City</th>
                      <th className={th}>Province</th>
                      <th className={th}><span className="flex items-center gap-1">Events<Tooltip text="Total page views, searches, and clicks from visitors interested in this city. More events = more real demand." /></span></th>
                      <th className={th}><span className="flex items-center gap-1">Lead Actions<Tooltip text="High-intent clicks in this city. If there are lead actions with no paid vendor, those leads are going uncaptured — a clear pitch to a vendor." /></span></th>
                      <th className={th}>Signal</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {opportunities.map(c => (
                        <tr key={c.city} className="hover:bg-yellow-50">
                          <td className={`${td} font-semibold text-gray-900`}>{c.city}</td>
                          <td className={td}>{c.province}</td>
                          <td className={td}>{c._count}</td>
                          <td className={td}>{cityActionMap[c.city ?? ''] ?? 0}</td>
                          <td className={td}><span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">OPPORTUNITY</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={card}>
              <h2 className="font-semibold text-gray-900 mb-1">🔍 Competitive Markets</h2>
              <p className="text-xs text-gray-400 mb-4">Cities where users viewed 3+ vendors — high competition, pitch Exclusive plans</p>
              <p className="text-sm text-gray-500">Coming soon — requires session-level vendor comparison data to accumulate.</p>
            </div>
          </div>
        )}

        {/* ── LEADS ────────────────────────────────────────────────────────── */}
        {tab === 'leads' && (
          <LeadsPanel leads={leads.map(l => ({
            id: l.id,
            name: l.name,
            email: l.email,
            phone: l.phone ?? null,
            serviceType: l.serviceType ?? null,
            city: l.city,
            province: l.province ?? null,
            message: l.message ?? null,
            status: l.status,
            createdAt: l.createdAt.toISOString(),
            vendor: l.vendor ? { name: l.vendor.name, slug: l.vendor.slug ?? '' } : null,
          }))} />
        )}

      </div>
    </div>
  )
}
