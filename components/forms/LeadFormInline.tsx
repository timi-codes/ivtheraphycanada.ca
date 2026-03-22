'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { track } from '@/lib/analytics'

interface Props {
  city: string
  province: string
  serviceType?: string
  vendorId?: string
}

const SERVICE_OPTIONS = [
  { value: 'iv_therapy', label: 'IV Therapy' },
  { value: 'vitamin_iv', label: 'Vitamin IV' },
  { value: 'mobile_iv', label: 'Mobile IV' },
  { value: 'nad_plus', label: 'NAD+ Therapy' },
  { value: 'chelation', label: 'Chelation Therapy' },
  { value: 'concierge', label: 'Concierge Medicine' },
  { value: 'myers_cocktail', label: "Myers' Cocktail" },
  { value: 'glutathione', label: 'Glutathione IV' },
  { value: 'hangover_iv', label: 'Hangover IV' },
  { value: 'immune_iv', label: 'Immune IV' },
  { value: 'hydration', label: 'Hydration IV' },
]

export function LeadFormInline({ city, province, serviceType, vendorId }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: serviceType ?? '',
    message: '',
    city: city,
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    track('quote_form_open', { city, province, vendorId, service: serviceType })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, city: form.city || city, province, vendorId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      setStatus('success')
      track('quote_submit', { city: form.city || city, province, vendorId, service: form.service })
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-semibold text-gray-900 text-lg">Request Sent!</h3>
        <p className="text-gray-500 text-sm mt-1">
          We&apos;ve received your request and will connect you with providers in {city} shortly.
        </p>
      </div>
    )
  }

  const fieldClass =
    'h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 focus:border-[#1E1E2C] focus:outline-none focus:ring-2 focus:ring-[#1E1E2C]/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            Your Name *
          </label>
          <Input
            required
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={fieldClass}
          />
        </div>
        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">
            Email *
          </label>
          <Input
            required
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={fieldClass}
          />
        </div>
        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-semibold text-gray-800">Phone</label>
          <Input
            type="tel"
            placeholder="(416) 555-0100"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={fieldClass}
          />
        </div>
        <div className={`grid gap-4 ${!city ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {!city && (
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-semibold text-gray-800">City *</label>
              <Input
                required
                placeholder="e.g. Toronto"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className={fieldClass}
              />
            </div>
          )}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">Service Type *</label>
            <CustomSelect
              name="service"
              defaultValue={form.service}
              options={[{ value: '', label: 'Select a service...' }, ...SERVICE_OPTIONS]}
              onChange={(v) => setForm((f) => ({ ...f, service: v }))}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-800">Message</label>
        <textarea
          rows={4}
          placeholder="Tell us more about what you're looking for..."
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="min-h-[7.5rem] w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-base leading-relaxed placeholder:text-gray-400 focus:border-[#1E1E2C] focus:outline-none focus:ring-2 focus:ring-[#1E1E2C]/20"
        />
      </div>
      {error && <p className="text-base text-red-600">{error}</p>}
      <Button
        type="submit"
        size="lg"
        disabled={status === 'loading'}
        className="h-14 w-full px-8 text-base sm:text-lg"
      >
        {status === 'loading' ? 'Sending...' : 'Get Free Quotes →'}
      </Button>
    </form>
  )
}
