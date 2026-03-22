'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'

const PROVINCES = ['Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland', 'PEI', 'Other']

const SERVICES = [
  { value: 'iv_therapy', label: 'IV Therapy' },
  { value: 'mobile_iv', label: 'Mobile IV' },
  { value: 'nad_plus', label: 'NAD+ Therapy' },
  { value: 'vitamin_iv', label: 'Vitamin IV' },
  { value: 'myers_cocktail', label: "Myers' Cocktail" },
  { value: 'glutathione', label: 'Glutathione' },
  { value: 'hangover_iv', label: 'Hangover IV' },
  { value: 'chelation', label: 'Chelation Therapy' },
  { value: 'concierge', label: 'Concierge Medicine' },
]

export default function ListYourClinicPage() {
  const [form, setForm] = useState({
    clinicName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    province: '',
    website: '',
    services: [] as string[],
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleService(val: string) {
    setForm(f => ({
      ...f,
      services: f.services.includes(val) ? f.services.filter(s => s !== val) : [...f.services, val],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/clinic-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Submission failed')
      setStatus('sent')
    } catch {
      setStatus('error')
      setError('Something went wrong. Please email us directly at hello@ivtherapycanada.ca')
    }
  }

  const input = 'w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1E1E2C] transition'
  const label = 'block text-xs font-semibold text-gray-600 mb-1'

  if (status === 'sent') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">We&apos;ve received your request</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Thanks for your interest in being listed on IV Therapy Canada. Our team will review your submission and reach out within 2–3 business days.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[#1E1E2C] hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Clinic</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            Get discovered by patients searching for IV therapy in your city. Fill in your details and we&apos;ll be in touch to get you listed.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Clinic info */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Clinic Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Clinic Name *</label>
                  <input className={input} required value={form.clinicName} onChange={e => set('clinicName', e.target.value)} placeholder="The Wellness Clinic" />
                </div>
                <div>
                  <label className={label}>Website</label>
                  <input className={input} type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yourclinic.ca" />
                </div>
                <div>
                  <label className={label}>City *</label>
                  <input className={input} required value={form.city} onChange={e => set('city', e.target.value)} placeholder="Toronto" />
                </div>
                <div>
                  <label className={label}>Province *</label>
                  <select className={input} required value={form.province} onChange={e => set('province', e.target.value)}>
                    <option value="">Select province...</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <label className={label}>Services Offered</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SERVICES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleService(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      form.services.includes(s.value)
                        ? 'bg-[#1E1E2C] text-white border-[#1E1E2C]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E1E2C]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Your Contact Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Your Name *</label>
                  <input className={input} required value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className={label}>Phone</label>
                  <input className={input} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="416-555-0100" />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Email *</label>
                  <input className={input} required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@yourclinic.ca" />
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={label}>Anything else you&apos;d like us to know?</label>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1E1E2C] transition resize-none"
                rows={3}
                value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="e.g. number of locations, special services, preferred listing tier..."
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-11 rounded-xl bg-[#1E1E2C] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Submitting…' : 'Submit Interest'}
            </button>

            <p className="text-center text-xs text-gray-400">
              No payment required. We&apos;ll review your submission and contact you directly.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
