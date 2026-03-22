'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

interface Props {
  vendorId: string
  vendorName: string
  city: string
  province: string
}

export function ScrollDepthTracker({ vendorId, vendorName, city, province }: Props) {
  useEffect(() => {
    const milestones = [25, 50, 75, 100]
    const reached = new Set<number>()
    const startTime = Date.now()

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight
      const total = document.documentElement.scrollHeight
      const pct = Math.round((scrolled / total) * 100)

      for (const m of milestones) {
        if (pct >= m && !reached.has(m)) {
          reached.add(m)
          track('scroll_depth', {
            vendorId,
            vendorName,
            city,
            province,
            scrollDepth: m,
            timeOnPage: Math.round((Date.now() - startTime) / 1000),
          })
        }
      }
    }

    // Track time on page when leaving
    const onUnload = () => {
      track('time_on_page', {
        vendorId,
        vendorName,
        city,
        province,
        timeOnPage: Math.round((Date.now() - startTime) / 1000),
        scrollDepth: Math.max(...Array.from(reached), 0),
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [vendorId, vendorName, city, province])

  return null
}
