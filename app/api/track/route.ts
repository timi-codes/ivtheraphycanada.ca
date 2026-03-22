import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getReferrerType(referrer: string | null): string {
  if (!referrer) return 'direct'
  if (referrer.includes('google.') || referrer.includes('bing.') || referrer.includes('yahoo.')) return 'google'
  if (referrer.includes('facebook.') || referrer.includes('instagram.') || referrer.includes('twitter.') || referrer.includes('tiktok.')) return 'social'
  return 'other'
}

function getDeviceType(ua: string): string {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return 'mobile'
  if (/tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

function getPageType(page: string): string {
  if (page === '/' || page === '') return 'home'
  if (page.startsWith('/vendors/') && page.split('/').length > 2) return 'vendor_profile'
  if (page === '/vendors') return 'vendor_list'
  if (page.startsWith('/blog/') && page.split('/').length > 2) return 'blog_post'
  if (page === '/blog') return 'blog'
  if (page === '/get-a-quote') return 'quote'
  if (page === '/for-vendors') return 'for_vendors'
  if (page.split('/').filter(Boolean).length === 1) return 'province'
  if (page.split('/').filter(Boolean).length === 2) return 'city'
  if (page.split('/').filter(Boolean).length === 3) return 'service_city'
  return 'other'
}

const HIGH_INTENT_EVENTS = new Set(['phone_click', 'website_click', 'booking_click', 'directions_click', 'quote_submit', 'email_click', 'instagram_click', 'facebook_click'])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      event, sessionId, page, city, province, service,
      vendorId, vendorName, vendorSlug, vendorPlan, vendorRank,
      query, resultCount, hasResults, scrollDepth, timeOnPage,
      sourceType, referrer, metadata,
    } = body

    if (!event || !sessionId) {
      return NextResponse.json({ error: 'Missing event or sessionId' }, { status: 400 })
    }

    const ua = req.headers.get('user-agent') ?? ''
    const pageType = page ? getPageType(page) : undefined
    const category = HIGH_INTENT_EVENTS.has(event) ? 'high_intent'
      : ['page_view', 'city_browse', 'province_browse', 'search_query', 'search_result_click', 'vendor_card_click'].includes(event) ? 'discovery'
      : ['pagination_click', 'cities_dropdown_open', 'city_dropdown_click', 'service_filter'].includes(event) ? 'navigation'
      : 'engagement'

    // Upsert session
    const docReferrer = body.docReferrer ?? null
    await prisma.analyticsSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        referrer: docReferrer,
        referrerType: getReferrerType(docReferrer),
        utmSource: body.utmSource ?? null,
        utmMedium: body.utmMedium ?? null,
        utmCampaign: body.utmCampaign ?? null,
        entryPage: page ?? '/',
        entryMethod: sourceType ?? null,
        deviceType: getDeviceType(ua),
        userAgent: ua.slice(0, 500),
        firstCity: city ?? null,
        firstProvince: province ?? null,
        hasLeadAction: HIGH_INTENT_EVENTS.has(event),
        leadActionType: HIGH_INTENT_EVENTS.has(event) ? event : null,
        winnerVendorId: HIGH_INTENT_EVENTS.has(event) ? (vendorId ?? null) : null,
        winnerVendorName: HIGH_INTENT_EVENTS.has(event) ? (vendorName ?? null) : null,
        totalEvents: 1,
        pagesViewed: event === 'page_view' ? 1 : 0,
        vendorsViewed: pageType === 'vendor_profile' ? 1 : 0,
      },
      update: {
        totalEvents: { increment: 1 },
        pagesViewed: event === 'page_view' ? { increment: 1 } : undefined,
        vendorsViewed: pageType === 'vendor_profile' ? { increment: 1 } : undefined,
        ...(HIGH_INTENT_EVENTS.has(event) ? {
          hasLeadAction: true,
          leadActionType: event,
          winnerVendorId: vendorId ?? null,
          winnerVendorName: vendorName ?? null,
        } : {}),
        updatedAt: new Date(),
      },
    })

    // Write event
    await prisma.analyticsEvent.create({
      data: {
        sessionId,
        event,
        category,
        page: page ?? null,
        pageType,
        city: city ?? null,
        province: province ?? null,
        service: service ?? null,
        vendorId: vendorId ?? null,
        vendorName: vendorName ?? null,
        vendorSlug: vendorSlug ?? null,
        vendorPlan: vendorPlan ?? null,
        vendorRank: vendorRank ?? null,
        query: query ?? null,
        resultCount: resultCount ?? null,
        hasResults: hasResults ?? null,
        scrollDepth: scrollDepth ?? null,
        timeOnPage: timeOnPage ?? null,
        sourceType: sourceType ?? null,
        referrer: referrer ?? null,
        metadata: metadata ?? undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Track error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
