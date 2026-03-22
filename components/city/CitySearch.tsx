'use client'

import { SearchAutocomplete } from '@/components/ui/SearchAutocomplete'

export function CitySearch() {
  return (
    <SearchAutocomplete
      size="lg"
      placeholder="Search your city, province or service..."
      className="w-full max-w-lg"
    />
  )
}
