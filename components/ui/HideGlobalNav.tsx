'use client'

import { useEffect } from 'react'

export function HideGlobalNav() {
  useEffect(() => {
    const el = document.getElementById('global-navbar')
    if (el) el.style.display = 'none'
    return () => { if (el) el.style.display = '' }
  }, [])

  return null
}
