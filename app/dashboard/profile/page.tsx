'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const SERVICE_OPTIONS = [
  { value: 'iv_therapy', label: 'IV Therapy' },
  { value: 'vitamin_iv', label: 'Vitamin IV' },
  { value: 'mobile_iv', label: 'Mobile IV' },
  { value: 'nad_plus', label: 'NAD+' },
  { value: 'chelation', label: 'Chelation' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'myers_cocktail', label: "Myers' Cocktail" },
  { value: 'glutathione', label: 'Glutathione' },
  { value: 'hangover_iv', label: 'Hangover IV' },
  { value: 'immune_iv', label: 'Immune IV' },
  { value: 'hydration', label: 'Hydration IV' },
]

export default function ProfilePage() {
  const [vendor, setVendor] = useState<Record<string, string | string[] | boolean | number | null> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/vendors/me')
      .then((r) => r.json())
      .then((data) => {
        setVendor(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vendor) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/vendors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendor),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  function toggleService(svc: string) {
    if (!vendor) return
    const current = (vendor.services as string[]) ?? []
    const updated = current.includes(svc) ? current.filter((s) => s !== svc) : [...current, svc]
    setVendor({ ...vendor, services: updated })
  }

  if (loading) return <div className="text-gray-400 py-10 text-center">Loading profile...</div>
  if (!vendor) return <div className="text-gray-400 py-10 text-center">No vendor linked to your account.</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Business Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <Input value={String(vendor.name ?? '')} onChange={(e) => setVendor({ ...vendor, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={String(vendor.phone ?? '')} onChange={(e) => setVendor({ ...vendor, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <Input value={String(vendor.website ?? '')} onChange={(e) => setVendor({ ...vendor, website: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input type="email" value={String(vendor.email ?? '')} onChange={(e) => setVendor({ ...vendor, email: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input value={String(vendor.address ?? '')} onChange={(e) => setVendor({ ...vendor, address: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={String(vendor.description ?? '')}
              onChange={(e) => setVendor({ ...vendor, description: e.target.value })}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1E1E2C] focus:outline-none focus:ring-2 focus:ring-[#1E1E2C]/20 resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Services Offered</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SERVICE_OPTIONS.map((svc) => {
              const selected = ((vendor.services as string[]) ?? []).includes(svc.value)
              return (
                <button
                  key={svc.value}
                  type="button"
                  onClick={() => toggleService(svc.value)}
                  className={`px-3 py-2 rounded-lg text-sm border font-medium transition-colors ${
                    selected ? 'bg-[#1E1E2C] text-white border-[#1E1E2C]' : 'border-gray-200 text-gray-700 hover:border-[#1E1E2C]'
                  }`}
                >
                  {svc.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Social & Booking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <Input value={String(vendor.instagram ?? '')} onChange={(e) => setVendor({ ...vendor, instagram: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
              <Input value={String(vendor.facebook ?? '')} onChange={(e) => setVendor({ ...vendor, facebook: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking Link</label>
              <Input value={String(vendor.bookingLink ?? '')} onChange={(e) => setVendor({ ...vendor, bookingLink: e.target.value })} />
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">✓ Profile saved successfully!</p>}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
