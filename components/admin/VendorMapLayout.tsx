'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { VendorFilterBar } from './VendorFilterBar'
import { VendorListCard, type VendorRow } from './VendorListCard'
import { VendorDetailPanel } from './VendorDetailPanel'

const VendorMap = dynamic(() => import('./VendorMap').then(m => m.VendorMap), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <p className="text-sm text-gray-500">Loading map...</p>
    </div>
  ),
})

interface Props {
  vendors: VendorRow[]
  total: number
}

export function VendorMapLayout({ vendors, total }: Props) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedVendor = vendors.find(v => v.id === selectedVendorId) ?? null

  const handleSelectFromList = (id: string) => {
    setSelectedVendorId(id)
    setPanelOpen(false) // list click just highlights on map, doesn't open panel
    const el = listRef.current?.querySelector(`[data-vendor-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleSelectFromMap = (id: string) => {
    setSelectedVendorId(id)
    setPanelOpen(true)
    // Also scroll the list card into view
    const el = listRef.current?.querySelector(`[data-vendor-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const closePanel = () => {
    setPanelOpen(false)
    setSelectedVendorId(null)
  }

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left panel */}
      <div className="w-[400px] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
        <VendorFilterBar total={total} filtered={vendors.length} />
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {vendors.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-gray-400">No vendors match the current filters.</p>
            </div>
          ) : (
            vendors.map(v => (
              <div key={v.id} data-vendor-id={v.id}>
                <VendorListCard
                  vendor={v}
                  isSelected={selectedVendorId === v.id}
                  onSelect={handleSelectFromList}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel — map + detail panel overlay */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <VendorMap
          vendors={vendors}
          selectedVendorId={selectedVendorId}
          onSelectVendor={handleSelectFromMap}
        />

        {/* Detail panel — slides in from right over the map */}
        <VendorDetailPanel
          vendor={panelOpen ? selectedVendor : null}
          onClose={closePanel}
        />

        {/* Backdrop — clicking outside closes panel */}
        {panelOpen && (
          <div
            className="absolute inset-0 z-10"
            style={{ right: 320 }}
            onClick={closePanel}
          />
        )}
      </div>
    </div>
  )
}
