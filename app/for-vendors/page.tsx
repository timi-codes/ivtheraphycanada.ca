import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'List Your IV Therapy Business | IV Therapy Canada',
  description: 'Get listed on Canada\'s largest IV therapy directory. Reach patients looking for IV therapy, NAD+, chelation, and more in your city.',
}

export default function ForVendorsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E1E2C] to-[#0a5f63] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Grow Your IV Therapy Practice</h1>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Get found by patients searching for IV therapy, NAD+, chelation, and concierge medicine across Canada. Join 369+ providers already listed.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/for-vendors/pricing">
              <Button size="lg" className="bg-white text-[#1E1E2C] hover:bg-[#F3F3F5]">
                View Pricing Plans
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Vendor Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Why List on IV Therapy Canada?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🔍', title: 'High-Intent Traffic', desc: 'Our visitors are actively searching for IV therapy services — not casual browsers. Higher conversion rates than generic health directories.' },
              { icon: '📍', title: 'Local SEO Boost', desc: 'Your listing ranks for "[service] in [city]" searches on Google. We optimize every city and service page for Canadian patients.' },
              { icon: '💬', title: 'Qualified Leads', desc: 'Receive contact requests from people who already know what they want. Filter by service type and location.' },
              { icon: '⭐', title: 'Build Credibility', desc: 'Showcase your credentials, services, and reviews to stand out from uncertified providers.' },
              { icon: '📱', title: 'Mobile Optimized', desc: 'Most IV therapy searches happen on mobile. Your listing looks great on every device.' },
              { icon: '📊', title: 'Lead Dashboard', desc: 'Track your leads, respond quickly, and manage your profile from our vendor dashboard.' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-start">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 mb-10">Start free. Upgrade when you&apos;re ready.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { plan: 'Free', price: '$0', desc: 'Basic listing with name, city & phone' },
              { plan: 'Standard', price: '$149', desc: 'Full profile with photos and priority placement' },
              { plan: 'Premium', price: '$299', desc: 'Featured badge, top placement, lead notifications' },
              { plan: 'Exclusive', price: '$499', desc: 'Only vendor shown in your city — all leads to you' },
            ].map((p) => (
              <div key={p.plan} className={`rounded-xl border p-5 text-center ${p.plan === 'Exclusive' ? 'border-[#1E1E2C] bg-white ring-2 ring-[#1E1E2C]/20' : 'border-gray-200 bg-white'}`}>
                <p className="font-bold text-gray-900">{p.plan}</p>
                <p className="text-2xl font-bold text-[#1E1E2C] my-1">{p.price}<span className="text-sm text-gray-500">/mo</span></p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/for-vendors/pricing">
            <Button size="lg">See Full Pricing →</Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#1E1E2C] text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Get More Patients?</h2>
        <p className="text-teal-100 mb-6">Join Canada&apos;s fastest-growing IV therapy directory.</p>
        <Link href="/dashboard">
          <Button size="lg" className="bg-white text-[#1E1E2C] hover:bg-[#F3F3F5]">
            Create Your Free Listing
          </Button>
        </Link>
      </section>
    </main>
  )
}
