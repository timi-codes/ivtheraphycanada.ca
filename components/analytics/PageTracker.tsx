'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

interface Props {
  city?: string
  province?: string
  service?: string
  vendorId?: string
  vendorName?: string
  vendorSlug?: string
  vendorPlan?: string
  sourceType?: string
}

export function PageTracker({ city, province, service, vendorId, vendorName, vendorSlug, vendorPlan, sourceType }: Props) {
  useEffect(() => {
    // Deduplicate vendor profile views within the same tab session
    if (vendorId) {
      const key = `viewed_vendor_${vendorId}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    }
    track('page_view', { city, province, service, vendorId, vendorName, vendorSlug, vendorPlan, sourceType })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
