import { Metadata } from 'next'
import Link from 'next/link'
import { LeadFormInline } from '@/components/forms/LeadFormInline'

export const metadata: Metadata = {
  title: 'Get a Free IV Therapy Quote',
  description: 'Request a free quote from top-rated IV therapy clinics near you across Canada.',
}

export default function GetAQuotePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-14">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
        {' / '}
        <span className="text-gray-900">Get a Quote</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Get a Free IV Therapy Quote</h1>
      <p className="text-gray-500 mb-8 text-lg">
        Tell us what you&apos;re looking for and we&apos;ll connect you with top-rated IV therapy providers near you — for free.
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <LeadFormInline city="" province="" />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {[
          { icon: '⚡', label: 'Fast Response', desc: 'Providers typically reply within 24 hours' },
          { icon: '🔒', label: 'No Obligation', desc: 'Free quotes, no commitment required' },
          { icon: '🏥', label: 'Verified Providers', desc: 'All clinics are licensed professionals' },
        ].map((item) => (
          <div key={item.label} className="p-4">
            <p className="text-2xl mb-2">{item.icon}</p>
            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
