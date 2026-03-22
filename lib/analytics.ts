'use client'

const SESSION_COOKIE = 'iv_session'

function getSessionId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function getUTM(param: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(param)
}

export interface TrackPayload {
  city?: string
  province?: string
  service?: string
  vendorId?: string
  vendorName?: string
  vendorSlug?: string
  vendorPlan?: string
  vendorRank?: number
  query?: string
  resultCount?: number
  hasResults?: boolean
  scrollDepth?: number
  timeOnPage?: number
  sourceType?: string
  referrer?: string
  metadata?: Record<string, unknown>
}

export function track(event: string, payload: TrackPayload = {}) {
  if (typeof window === 'undefined') return

  const sessionId = getSessionId()
  if (!sessionId) return

  const body = {
    event,
    sessionId,
    page: window.location.pathname,
    docReferrer: document.referrer || null,
    utmSource: getUTM('utm_source'),
    utmMedium: getUTM('utm_medium'),
    utmCampaign: getUTM('utm_campaign'),
    ...payload,
  }

  // Fire and forget — don't await, don't block UI
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true, // works even if page unloads
  }).catch(() => {/* silent fail */})
}

// Page view — call once on mount in a client component
export function trackPageView(payload: TrackPayload = {}) {
  track('page_view', payload)
}
